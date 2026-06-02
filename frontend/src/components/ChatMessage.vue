<template>
  <div class="chat-message" :class="{ 'is-user': role === 'user', 'is-ai': role === 'ai' }">
    <div class="message-avatar">
      <el-avatar :icon="role === 'user' ? UserFilled : Promotion" :size="36" />
    </div>
    <div class="message-bubble">
      <div class="message-content" style="white-space: pre-wrap">{{ content }}</div>
      <div class="message-time">{{ time }}</div>
    </div>
  </div>
</template>

<script setup>
import { UserFilled, Promotion } from '@element-plus/icons-vue'

defineProps({
  role: {
    type: String,
    required: true,
    validator: v => ['user', 'ai'].includes(v),
  },
  content: {
    type: String,
    default: '',
  },
  time: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  max-width: 80%;
}
.chat-message.is-user {
  flex-direction: row-reverse;
  margin-left: auto;
}
.chat-message.is-ai {
  margin-right: auto;
}
.message-bubble {
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
}
.is-user .message-bubble {
  background: #ff630f;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.is-ai .message-bubble {
  background: #f0f2f5;
  color: #333;
  border-bottom-left-radius: 4px;
}
.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}
.is-user .message-time {
  color: rgba(255, 255, 255, 0.7);
}
</style>
