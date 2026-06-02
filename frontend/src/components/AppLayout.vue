<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside
      :width="sidebarWidth + 'px'"
      class="layout-aside"
      :class="{ 'no-transition': isResizing, 'is-collapsed': isCollapsed }"
    >
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <div class="logo" @click="toggleSidebar">
          <span v-if="!isCollapsed" class="logo-text">我的笔记</span>
          <img
            class="logo-img"
            :class="{ 'logo-img-collapsed': isCollapsed }"
            src="../assets/icon/shouqi.png"
            :alt="isCollapsed ? '展开' : '收起'"
          />
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        background-color="#1d1e1f"
        text-color="#bfcbd9"
        active-text-color="#ff630f"
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

      <!-- 拖拽手柄 -->
      <div class="resize-handle" @mousedown.stop="startResize">
        <div class="handle-bar"></div>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="layout-main">
      <!-- 顶部用户栏 -->
      <div v-if="user" class="top-bar">
        <span class="top-bar-title">我的笔记</span>
        <div class="top-bar-right">
          <el-avatar :size="28" style="background: #ff630f">
            {{ user.username.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="top-username">{{ user.username }}</span>
          <el-button text style="color: #666; padding: 4px 6px" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span style="margin-left: 4px">退出</span>
          </el-button>
        </div>
      </div>
      <div class="main-content">
        <router-view />
      </div>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getUser, removeToken } from "../utils/auth";

const route = useRoute();
const router = useRouter();
const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;
const SNAP_THRESHOLD = (SIDEBAR_EXPANDED + SIDEBAR_COLLAPSED) / 2; // 152px

const sidebarWidth = ref(SIDEBAR_EXPANDED);
const isCollapsed = computed(() => sidebarWidth.value <= SIDEBAR_COLLAPSED);
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartWidth = ref(SIDEBAR_EXPANDED);

const user = ref(null);

const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith("/notes")) return "/notes";
  if (path.startsWith("/chat")) return "/chat";
  return path;
});

function toggleSidebar() {
  sidebarWidth.value = isCollapsed.value ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
}

function startResize(e) {
  isResizing.value = true;
  resizeStartX.value = e.clientX;
  resizeStartWidth.value = sidebarWidth.value;
  document.addEventListener("mousemove", doResize);
  document.addEventListener("mouseup", stopResize);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
}

function doResize(e) {
  if (!isResizing.value) return;
  const delta = e.clientX - resizeStartX.value;
  const newWidth = Math.max(
    SIDEBAR_COLLAPSED,
    Math.min(SIDEBAR_EXPANDED, resizeStartWidth.value + delta),
  );
  sidebarWidth.value = newWidth;
}

function stopResize() {
  if (!isResizing.value) return;
  isResizing.value = false;
  // 吸附到折叠或展开状态
  sidebarWidth.value =
    sidebarWidth.value >= SNAP_THRESHOLD ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
  document.removeEventListener("mousemove", doResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

onMounted(() => {
  user.value = getUser();
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", doResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
});

function handleLogout() {
  removeToken();
  router.push({ name: "Login" });
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
.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}
.is-collapsed .sidebar-header {
  justify-content: center;
}
.logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
  flex: 1;
}
.is-collapsed .logo {
  flex: 0;
  padding: 0;
}
.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.logo-img {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transition: transform 0.3s;
}
.logo-img-collapsed {
  transform: scaleX(-1);
}
.nav-menu {
  flex: 1;
  border-right: none;
}
.layout-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.top-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}
.top-bar-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.top-username {
  font-size: 14px;
  color: #333;
}
.main-content {
  flex: 1;
  overflow: hidden;
}
.layout-aside.no-transition {
  transition: none;
}
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.resize-handle .handle-bar {
  width: 2px;
  height: 30px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.2s;
}
.resize-handle:hover .handle-bar,
.layout-aside.no-transition .handle-bar {
  background: #ff630f;
}
</style>
