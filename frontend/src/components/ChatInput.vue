<template>
  <div class="chat-input">
    <div class="chat-input-row">
      <el-input
        v-model="text"
        type="textarea"
        :rows="2"
        placeholder="请输入您的问题..."
        :disabled="loading"
        @keydown.enter.prevent="handleSend"
        class="chat-input-area"
      />
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSend"
        class="chat-send-btn"
      >
        {{ loading ? "发送中..." : "发送" }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  loading: Boolean,
});
const emit = defineEmits(["send"]);

const text = ref("");

function handleSend() {
  const msg = text.value.trim();
  if (!msg || props.loading) return;
  emit("send", msg);
  text.value = "";
}
</script>

<style scoped>
.chat-input {
  border-top: 1px solid #e4e7ed;
  padding: 12px 16px;
  background: #fff;
}
.chat-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-input-area {
  flex: 1;
}
.chat-send-btn {
  height: 32px;
  width: 80px;
  font-size: 15px;
  flex-shrink: 0;
}
</style>
