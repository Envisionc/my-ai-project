import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 全局注册 Element Plus 图标
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 让 ElMessage 等组件可以在 setup 外使用
import { ElMessage, ElMessageBox } from 'element-plus'
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$msgbox = ElMessageBox
// 挂载到 window 方便组件内直接使用
window.ElMessage = ElMessage
window.ElMessageBox = ElMessageBox

app.use(ElementPlus)
app.use(router)
app.mount('#app')
