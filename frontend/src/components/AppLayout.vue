<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapsed ? '64px' : '240px'" class="layout-aside">
      <div class="logo" @click="isCollapsed = !isCollapsed">
        <span v-if="!isCollapsed" class="logo-text">📒 我的笔记</span>
        <span v-else class="logo-mini">📒</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        background-color="#1d1e1f"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
        class="nav-menu"
      >
        <el-menu-item index="/chat">
          <el-icon><ChatDotSquare /></el-icon>
          <template #title>AI 问答</template>
        </el-menu-item>
        <el-menu-item index="/notes">
          <el-icon><Notebook /></el-icon>
          <template #title>个人笔记</template>
        </el-menu-item>
      </el-menu>

      <!-- 底部用户信息 -->
      <div class="aside-footer">
        <el-divider style="border-color: #333; margin: 8px 0" />
        <div class="user-info" v-if="user">
          <el-avatar :size="isCollapsed ? 28 : 32" style="background: #409eff">
            {{ user.username.charAt(0).toUpperCase() }}
          </el-avatar>
          <span v-if="!isCollapsed" class="username">{{ user.username }}</span>
          <el-tooltip content="退出登录" placement="right">
            <el-button
              text
              :style="{ color: '#bfcbd9', padding: isCollapsed ? '4px' : '4px 8px' }"
              @click="handleLogout"
            >
              <el-icon><SwitchButton /></el-icon>
              <span v-if="!isCollapsed" style="margin-left: 4px">退出</span>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="layout-main">
      <router-view />
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser, removeToken } from '../utils/auth'

const route = useRoute()
const router = useRouter()
const isCollapsed = ref(false)
const user = ref(null)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/notes')) return '/notes'
  if (path.startsWith('/chat')) return '/chat'
  return path
})

onMounted(() => {
  user.value = getUser()
})

function handleLogout() {
  removeToken()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.layout-aside {
  background: #1d1e1f;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid #333;
}
.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}
.logo-mini {
  color: #fff;
  font-size: 22px;
}
.nav-menu {
  flex: 1;
  border-right: none;
}
.aside-footer {
  padding: 8px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}
.username {
  color: #bfcbd9;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.layout-main {
  height: 100vh;
  overflow: hidden;
}
</style>
