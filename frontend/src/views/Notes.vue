<template>
  <el-container direction="vertical" class="notes-container">
    <el-header class="notes-header">
      <h2>
        <el-icon><Notebook /></el-icon>
        个人笔记
      </h2>
      <el-button type="primary" @click="createNote">
        <el-icon><Plus /></el-icon>
        新建笔记
      </el-button>
    </el-header>

    <el-main class="notes-main">
      <!-- 加载状态 -->
      <div v-if="loading" class="notes-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="notes.length === 0" class="notes-empty">
        <div class="empty-icon">📝</div>
        <p>还没有笔记</p>
        <el-button type="primary" @click="createNote">写第一篇笔记</el-button>
      </div>

      <!-- 笔记列表 -->
      <div v-else class="notes-grid">
        <div
          v-for="note in notes"
          :key="note.id"
          class="note-card"
          @click="editNote(note.id)"
        >
          <div class="note-card-header">
            <h3 class="note-title">{{ note.title || '无标题' }}</h3>
            <el-dropdown @command="(cmd) => handleCommand(cmd, note)" trigger="click">
              <el-button text class="more-btn" @click.stop>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided style="color: #f56c6c">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="note-time">{{ note.updated_at }}</div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { getToken } from '../utils/auth'

const router = useRouter()
const notes = ref([])
const loading = ref(true)

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` }
}

async function fetchNotes() {
  loading.value = true
  try {
    const res = await axios.get('/api/notes', { headers: authHeader() })
    if (res.data.success) {
      notes.value = res.data.data
    }
  } catch (e) {
    ElMessage.error('获取笔记列表失败')
  } finally {
    loading.value = false
  }
}

function createNote() {
  router.push({ name: 'NoteNew' })
}

function editNote(id) {
  router.push({ name: 'NoteEdit', params: { id } })
}

async function deleteNote(id) {
  try {
    const res = await axios.delete(`/api/notes/${id}`, { headers: authHeader() })
    if (res.data.success) {
      ElMessage.success('删除成功')
      await fetchNotes()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

function handleCommand(cmd, note) {
  if (cmd === 'edit') {
    editNote(note.id)
  } else if (cmd === 'delete') {
    ElMessageBox.confirm('确定删除这篇笔记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => deleteNote(note.id)).catch(() => {})
  }
}

onMounted(fetchNotes)
</script>

<style scoped>
.notes-container {
  height: 100vh;
}
.notes-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px !important;
  padding: 0 24px;
}
.notes-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.notes-main {
  background: #f5f7fa;
  padding: 24px;
}
.notes-loading {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}
.notes-empty {
  text-align: center;
  padding: 80px 0;
}
.notes-empty .empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.notes-empty p {
  color: #999;
  font-size: 16px;
  margin-bottom: 16px;
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.note-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
}
.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #409eff;
}
.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.note-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.more-btn {
  flex-shrink: 0;
}
.note-time {
  font-size: 12px;
  color: #999;
}
</style>
