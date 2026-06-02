<template>
  <div class="history-panel">
    <h3 class="history-title">对话列表</h3>
    <div v-if="list.length === 0" class="history-empty">暂无对话</div>
    <div v-else class="history-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="history-item"
        :class="{ 'is-active': activeId === item.id, 'is-pinned': item.is_pinned }"
        @click="$emit('select', item.id)"
      >
        <div class="history-item-header">
          <span class="history-item-title">
            <el-icon v-if="item.is_pinned" class="pin-icon"><StarFilled /></el-icon>
            {{ item.title }}
          </span>
          <el-dropdown
            trigger="hover"
            placement="bottom-end"
            @command="(cmd) => handleCommand(cmd, item.id)"
          >
            <el-button
              text
              size="small"
              class="btn-more"
              @click.stop
            >
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon><Edit /></el-icon>重命名
                </el-dropdown-item>
                <el-dropdown-item :command="item.is_pinned ? 'unpin' : 'pin'">
                  <el-icon><StarFilled /></el-icon>{{ item.is_pinned ? '取消置顶' : '置顶' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided style="color: #f56c6c">
                  <el-icon><Delete /></el-icon>删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="history-item-meta">
          <span class="history-item-preview">{{ item.first_question || '(空)' }}</span>
          <span class="history-item-count">{{ item.msg_count }} 条</span>
        </div>
        <div class="history-item-time">{{ item.created_at }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  list: { type: Array, default: () => [] },
  activeId: { type: [Number, String], default: null },
})
const emit = defineEmits(['select', 'rename', 'pin', 'delete'])

function handleCommand(cmd, sessionId) {
  if (cmd === 'rename') emit('rename', sessionId)
  else if (cmd === 'pin' || cmd === 'unpin') emit('pin', sessionId)
  else if (cmd === 'delete') emit('delete', sessionId)
}
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
  border: 1px solid transparent;
}
.history-item:hover {
  background: #ecf5ff;
}
.history-item.is-active {
  background: #ecf5ff;
  border-color: #ff630f;
}
.history-item.is-pinned .history-item-title {
  color: #ff630f;
}
.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.history-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}
.pin-icon {
  color: #ff630f;
  flex-shrink: 0;
  font-size: 12px;
}
.btn-more {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.history-item:hover .btn-more {
  opacity: 1;
}
.history-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.history-item-preview {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}
.history-item-count {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
}
.history-item-time {
  font-size: 11px;
  color: #ccc;
  margin-top: 2px;
}
</style>
