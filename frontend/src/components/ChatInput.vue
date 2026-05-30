<template>
  <div class="chat-input">
    <el-input
      v-model="text"
      type="textarea"
      :rows="3"
      placeholder="请输入您的问题..."
      :disabled="loading"
      @keydown.enter.prevent="handleSend"
    />
    <div class="chat-input-actions">
      <el-button type="primary" :loading="loading" @click="handleSend">
        {{ loading ? '发送中...' : '发送' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  loading: Boolean,
})
const emit = defineEmits(['send'])

const text = ref('')

function handleSend() {
  const msg = text.value.trim()
  if (!msg || props.loading) return
  emit('send', msg)
  text.value = ''
}
</script>

<style scoped>
.chat-input {
  border-top: 1px solid #e4e7ed;
  padding: 16px;
  background: #fff;
}
.chat-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
