<template>
  <el-container direction="vertical" class="chat-container">
    <el-header class="chat-header">
      <h2>
        <el-icon><Message /></el-icon>
        AI 问答助手
      </h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="createSession">
          <el-icon><Plus /></el-icon>
          新对话
        </el-button>
        <el-button text @click="showHistory = !showHistory">
          <el-icon><Timer /></el-icon>
          {{ showHistory ? '隐藏历史' : '历史记录' }}
        </el-button>
        <el-button text @click="clearChat">
          <el-icon><Delete /></el-icon>
          清空对话
        </el-button>
      </div>
    </el-header>

    <el-container class="chat-body">
      <!-- 历史记录侧边栏 -->
      <el-aside v-if="showHistory" width="280px" class="history-sidebar">
        <HistoryPanel
          :list="sessions"
          :active-id="currentSessionId"
          @select="handleSelect"
          @rename="handleRenameSession"
          @pin="handlePinSession"
          @delete="handleDeleteSession"
        />
      </el-aside>

      <!-- 主聊天区 -->
      <el-main class="chat-area" ref="chatAreaRef">
        <div v-if="messages.length === 0" class="chat-empty">
          <div class="empty-icon">🤖</div>
          <p>输入您的问题，开始 AI 对话</p>
        </div>
        <ChatMessage
          v-for="(msg, i) in messages"
          :key="i"
          :role="msg.role"
          :content="msg.content"
          :time="msg.time"
        />
      </el-main>
    </el-container>

    <ChatInput :loading="loading" @send="handleSend" />
  </el-container>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { getToken } from '../utils/auth'
import { ElMessageBox } from 'element-plus'
import ChatMessage from '../components/ChatMessage.vue'
import ChatInput from '../components/ChatInput.vue'
import HistoryPanel from '../components/HistoryPanel.vue'

const API_BASE = ''

const messages = ref([])
const sessions = ref([])
const currentSessionId = ref(null)
const loading = ref(false)
const chatAreaRef = ref(null)
const showHistory = ref(true)
const skipAutoScroll = ref(false)

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` }
}

/** 获取会话列表 */
async function fetchSessions() {
  try {
    const res = await axios.get(`${API_BASE}/api/sessions`, { headers: authHeader() })
    if (res.data.success) {
      sessions.value = res.data.data
    }
  } catch (e) {
    console.error('获取会话列表失败', e)
  }
}

/** 加载指定会话的消息 */
async function loadSessionMessages(sessionId) {
  try {
    const res = await axios.get(`${API_BASE}/api/sessions/${sessionId}/messages`, {
      headers: authHeader(),
    })
    if (res.data.success) {
      const items = res.data.data || []
      messages.value = items.flatMap((m) => [
        { role: 'user', content: m.question, time: m.created_at },
        { role: 'ai', content: m.answer, time: m.created_at },
      ])
      currentSessionId.value = sessionId
      scrollToBottom()
    }
  } catch (e) {
    console.error('加载会话消息失败', e)
  }
}

/** 创建新会话 */
async function createSession() {
  try {
    const res = await axios.post(`${API_BASE}/api/sessions`, {}, { headers: authHeader() })
    if (res.data.success) {
      currentSessionId.value = res.data.data.id
      messages.value = []
      await fetchSessions()
    }
  } catch (e) {
    console.error('创建会话失败', e)
  }
}

/** 删除会话 */
async function handleDeleteSession(sessionId) {
  try {
    const res = await axios.delete(`${API_BASE}/api/sessions/${sessionId}`, {
      headers: authHeader(),
    })
    if (res.data.success) {
      // 如果删除的是当前会话，清空聊天区或切换到其他会话
      if (currentSessionId.value === sessionId) {
        const other = sessions.value.find((s) => s.id !== sessionId)
        if (other) {
          await loadSessionMessages(other.id)
        } else {
          messages.value = []
          currentSessionId.value = null
        }
      }
      await fetchSessions()
    }
  } catch (e) {
    console.error('删除会话失败', e)
  }
}

/** 选择会话 */
async function handleSelect(sessionId) {
  if (sessionId === currentSessionId.value) return
  skipAutoScroll.value = true
  await loadSessionMessages(sessionId)
}

/** 重命名会话 */
async function handleRenameSession(sessionId) {
  const session = sessions.value.find((s) => s.id === sessionId)
  const { value: newTitle } = await ElMessageBox.prompt('请输入新名称', '重命名会话', {
    inputValue: session?.title || '',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
  if (newTitle) {
    await axios.put(
      `${API_BASE}/api/sessions/${sessionId}`,
      { title: newTitle },
      { headers: authHeader() }
    )
    await fetchSessions()
  }
}

/** 置顶 / 取消置顶 */
async function handlePinSession(sessionId) {
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session) return
  await axios.put(
    `${API_BASE}/api/sessions/${sessionId}`,
    { is_pinned: session.is_pinned ? 0 : 1 },
    { headers: authHeader() }
  )
  await fetchSessions()
}

/** 发送消息 */
async function handleSend(question) {
  const now = new Date().toLocaleString()
  messages.value.push({ role: 'user', content: question, time: now })

  loading.value = true
  try {
    const res = await axios.post(
      `${API_BASE}/api/chat`,
      { question, session_id: currentSessionId.value },
      { headers: authHeader() }
    )
    if (res.data.success) {
      messages.value.push({
        role: 'ai',
        content: res.data.data.answer,
        time: new Date().toLocaleString(),
      })
      await fetchSessions()
    } else {
      messages.value.push({
        role: 'ai',
        content: `错误：${res.data.message}`,
        time: new Date().toLocaleString(),
      })
    }
  } catch (e) {
    messages.value.push({
      role: 'ai',
      content: '网络异常，请检查后端服务是否启动',
      time: new Date().toLocaleString(),
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function clearChat() {
  messages.value = []
}

function scrollToBottom() {
  nextTick(() => {
    const el = chatAreaRef.value?.$el
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 监听 messages 变化，自动滚动到底部
watch(messages, () => {
  if (skipAutoScroll.value) {
    skipAutoScroll.value = false
    return
  }
  scrollToBottom()
}, { deep: false })

onMounted(async () => {
  await fetchSessions()
  // 自动加载最近一个会话
  if (sessions.value.length > 0) {
    await loadSessionMessages(sessions.value[0].id)
  } else {
    // 没有会话则创建一个
    await createSession()
  }
})
</script>

<style scoped>
.chat-container {
  height: 100%;
}
.chat-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px !important;
  padding: 0 20px;
}
.chat-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.chat-body {
  height: calc(100% - 60px - 130px);
  overflow: hidden;
}
.history-sidebar {
  background: #fafafa;
  border-right: 1px solid #e4e7ed;
  padding: 16px 12px;
  overflow-y: auto;
}
.chat-area {
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}
.chat-empty {
  margin: auto;
  text-align: center;
}
.chat-empty .empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.chat-empty p {
  color: #999;
  font-size: 16px;
}
</style>
