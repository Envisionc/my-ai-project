<template>
  <el-container direction="vertical" class="chat-container">
    <el-header class="chat-header">
      <h2>
        <el-icon><ChatDotSquare /></el-icon>
        AI 问答助手
      </h2>
      <div class="header-actions">
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
        <HistoryPanel :list="historyList" @select="handleSelect" />
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
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { getToken } from '../utils/auth'
import ChatMessage from '../components/ChatMessage.vue'
import ChatInput from '../components/ChatInput.vue'
import HistoryPanel from '../components/HistoryPanel.vue'

const API_BASE = ''

const messages = ref([])
const historyList = ref([])
const loading = ref(false)
const chatAreaRef = ref(null)
const showHistory = ref(true)

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` }
}

async function fetchHistory() {
  try {
    const res = await axios.get(`${API_BASE}/api/history`, { headers: authHeader() })
    if (res.data.success) {
      historyList.value = res.data.data
    }
  } catch (e) {
    console.error('获取历史记录失败', e)
  }
}

async function handleSend(question) {
  const now = new Date().toLocaleString()
  messages.value.push({ role: 'user', content: question, time: now })

  loading.value = true
  try {
    const res = await axios.post(
      `${API_BASE}/api/chat`,
      { question },
      { headers: authHeader() }
    )
    if (res.data.success) {
      messages.value.push({
        role: 'ai',
        content: res.data.data.answer,
        time: new Date().toLocaleString(),
      })
      await fetchHistory()
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

function handleSelect(item) {
  messages.value = [
    { role: 'user', content: item.question, time: item.created_at },
    { role: 'ai', content: item.answer, time: item.created_at },
  ]
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

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.chat-container {
  height: 100vh;
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
  height: calc(100vh - 60px - 130px);
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
