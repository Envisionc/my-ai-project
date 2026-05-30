<template>
  <el-container direction="vertical" class="editor-container">
    <el-header class="editor-header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
      <el-button type="primary" :loading="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存' }}
      </el-button>
    </el-header>

    <el-main class="editor-main">
      <div class="editor-form">
        <el-input
          v-model="title"
          placeholder="输入笔记标题..."
          size="large"
          class="title-input"
          maxlength="100"
          show-word-limit
        />
        <el-input
          v-model="content"
          type="textarea"
          placeholder="开始写点什么..."
          :rows="20"
          class="content-input"
          resize="none"
        />
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { getToken } from '../utils/auth'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const title = ref('')
const content = ref('')

const isEdit = computed(() => !!route.params.id)

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` }
}

function goBack() {
  router.push({ name: 'Notes' })
}

async function fetchNote() {
  if (!isEdit.value) return
  try {
    const res = await axios.get(`/api/notes/${route.params.id}`, { headers: authHeader() })
    if (res.data.success) {
      title.value = res.data.data.title
      content.value = res.data.data.content
    } else {
      ElMessage.error(res.data.message)
      goBack()
    }
  } catch {
    ElMessage.error('获取笔记失败')
    goBack()
  }
}

async function handleSave() {
  if (!title.value.trim()) {
    ElMessage.warning('请输入笔记标题')
    return
  }

  saving.value = true
  try {
    let res
    if (isEdit.value) {
      res = await axios.put(
        `/api/notes/${route.params.id}`,
        { title: title.value, content: content.value },
        { headers: authHeader() }
      )
    } else {
      res = await axios.post(
        '/api/notes',
        { title: title.value, content: content.value },
        { headers: authHeader() }
      )
    }

    if (res.data.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      goBack()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(fetchNote)
</script>

<style scoped>
.editor-container {
  height: 100vh;
}
.editor-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px !important;
  padding: 0 20px;
}
.editor-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}
.editor-main {
  background: #f5f7fa;
  padding: 24px;
}
.editor-form {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.title-input {
  margin-bottom: 20px;
}
.title-input :deep(.el-input__inner) {
  font-size: 20px;
  font-weight: 600;
  border: none;
  padding-left: 0;
}
.title-input :deep(.el-input__inner:focus) {
  box-shadow: none;
}
.content-input :deep(textarea) {
  font-size: 15px;
  line-height: 1.8;
  border: none;
  padding: 0;
  min-height: 60vh;
}
.content-input :deep(textarea:focus) {
  box-shadow: none;
}
</style>
