<template>
  <div class="history-panel">
    <h3 class="history-title">历史记录</h3>
    <div v-if="list.length === 0" class="history-empty">暂无记录</div>
    <div v-else class="history-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="history-item"
        @click="$emit('select', item)"
      >
        <div class="history-question">{{ item.question }}</div>
        <div class="history-time">{{ item.created_at }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  list: {
    type: Array,
    default: () => [],
  },
})
defineEmits(['select'])
</script>

<style scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.history-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}
.history-empty {
  color: #999;
  font-size: 14px;
  text-align: center;
  margin-top: 40px;
}
.history-list {
  flex: 1;
  overflow-y: auto;
}
.history-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.history-item:hover {
  background: #ecf5ff;
}
.history-question {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
