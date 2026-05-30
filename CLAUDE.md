# 我的 AI 全栈项目

## 技术栈
- **后端**: Node.js + Express + SQLite
- **前端**: Vue 3 + Vite + Element Plus
- **AI**: DeepSeek API
- **认证**: JWT (jsonwebtoken + bcryptjs)
- **路由**: Vue Router 4

## 功能模块

### 1. 用户认证
- 注册 / 登录 / 退出
- JWT 令牌认证（7天有效期）
- 路由守卫权限控制

### 2. AI 问答
- 输入问题调用 DeepSeek API
- 历史记录查看和回放
- 对话记录按用户隔离

### 3. 个人笔记
- 笔记列表（卡片式网格布局）
- 新建 / 编辑 / 删除笔记
- 自动保存时间戳

## 目录结构
```
├── backend/
│   └── server.js          # 后端：认证 + 聊天 + 笔记 API
├── frontend/
│   └── src/
│       ├── router/
│       │   └── index.js   # 路由配置 + 权限守卫
│       ├── views/
│       │   ├── Login.vue      # 登录页
│       │   ├── Register.vue   # 注册页
│       │   ├── Chat.vue       # AI 问答页
│       │   ├── Notes.vue      # 笔记列表页
│       │   └── NoteEditor.vue # 笔记编辑页
│       ├── components/
│       │   ├── AppLayout.vue  # 主布局（侧边栏）
│       │   ├── ChatMessage.vue
│       │   ├── ChatInput.vue
│       │   └── HistoryPanel.vue
│       ├── utils/
│       │   └── auth.js        # 认证工具函数
│       ├── App.vue
│       └── main.js
├── database/
│   └── conversations.db   # SQLite 数据库
└── .env                   # 环境变量
```

## 开发命令
- `cd backend && node server.js` — 启动后端 (端口 3001)
- `cd frontend && npm run dev` — 启动前端 (端口 5173)
- 访问 `http://localhost:5173` 使用应用

## API 接口

### 认证
- `POST /api/auth/register` — 注册
- `POST /api/auth/login` — 登录
- `GET /api/auth/me` — 获取当前用户（需认证）

### 笔记（需登录）
- `GET /api/notes` — 笔记列表
- `POST /api/notes` — 创建笔记
- `GET /api/notes/:id` — 获取单条笔记
- `PUT /api/notes/:id` — 更新笔记
- `DELETE /api/notes/:id` — 删除笔记

### AI 问答（需登录）
- `POST /api/chat` — 发送问题
- `GET /api/history` — 获取历史记录

## 代码规范
- 后端统一返回格式：`{ success: true, data: 结果, message: "" }`
- 前端组件使用组合式 API（`<script setup>`）
- API 密钥通过环境变量 `.env` 配置
