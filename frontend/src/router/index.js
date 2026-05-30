import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated, getToken } from '../utils/auth'
import axios from 'axios'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'Chat' } },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('../views/Chat.vue'),
      },
      {
        path: 'notes',
        name: 'Notes',
        component: () => import('../views/Notes.vue'),
      },
      {
        path: 'notes/new',
        name: 'NoteNew',
        component: () => import('../views/NoteEditor.vue'),
      },
      {
        path: 'notes/:id/edit',
        name: 'NoteEdit',
        component: () => import('../views/NoteEditor.vue'),
        props: true,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫：认证检查
router.beforeEach((to, from, next) => {
  const auth = isAuthenticated()

  if (to.meta.requiresAuth && !auth) {
    next({ name: 'Login' })
  } else if (to.meta.guest && auth) {
    next({ name: 'Chat' })
  } else {
    next()
  }
})

// 在路由切换时验证 token 是否有效
router.beforeEach(async (to, from, next) => {
  if (!to.meta.requiresAuth) {
    return next()
  }

  try {
    const res = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.data.success) {
      next()
    } else {
      localStorage.removeItem('ai-notes-token')
      next({ name: 'Login' })
    }
  } catch {
    next({ name: 'Login' })
  }
})

export default router
