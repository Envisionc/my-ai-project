<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-header">
        <h1>📒 创建账号</h1>
        <p>注册一个新的账号</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        @keyup.enter="handleRegister"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名（2-20个字符）"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码（至少6位）"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="register-footer">
        已有账号？
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'
import { setToken, setUser } from '../utils/auth'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const validatePass = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await axios.post('/api/auth/register', {
      username: form.username,
      password: form.password,
    })
    if (res.data.success) {
      ElMessage.success('注册成功')
      setToken(res.data.data.token)
      setUser(res.data.data.user)
      router.push({ name: 'Chat' })
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error('网络异常，请检查后端服务')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.register-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.register-header {
  text-align: center;
  margin-bottom: 32px;
}
.register-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px;
}
.register-header p {
  color: #999;
  margin: 0;
  font-size: 14px;
}
.register-form {
  margin-bottom: 16px;
}
.register-footer {
  text-align: center;
  font-size: 14px;
  color: #999;
}
.register-footer a {
  color: #409eff;
  text-decoration: none;
}
.register-footer a:hover {
  text-decoration: underline;
}
</style>
