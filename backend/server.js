const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const JWT_SECRET = process.env.JWT_SECRET || 'my-ai-project-jwt-secret-2026';

// 中间件
app.use(cors());
app.use(express.json());

// SQLite
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', 'database', 'conversations.db');
const db = new sqlite3.Database(dbPath);

// 初始化数据表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 如果 conversations 表还不存在则创建
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id INTEGER,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 兼容旧数据库：为 conversations 表补充 user_id 列
  db.run(`ALTER TABLE conversations ADD COLUMN user_id INTEGER REFERENCES users(id)`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('迁移 user_id 列失败:', err.message);
    }
    // 将旧记录（user_id 为 NULL）关联到默认用户
    db.run(`UPDATE conversations SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL`);
  });

  // 创建 sessions 表
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '新对话',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 兼容旧数据库：补充 is_pinned 列
  db.run(`ALTER TABLE sessions ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('迁移 is_pinned 列失败:', err.message);
    }
  });

  // 兼容旧数据库：为 conversations 补充 session_id 列
  db.run(`ALTER TABLE conversations ADD COLUMN session_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('迁移 session_id 列失败:', err.message);
      return;
    }
    // 为每个有对话但没有会话的用户创建会话
    db.run(`
      INSERT INTO sessions (user_id, title, created_at)
        SELECT c.user_id, '历史对话', MIN(c.created_at)
        FROM conversations c
        WHERE c.session_id IS NULL
        GROUP BY c.user_id
    `, function(insertErr) {
      if (insertErr) {
        console.error('创建默认会话失败:', insertErr.message);
        return;
      }
      if (this.changes === 0) return;
      // 按 user_id 匹配更新
      db.all(`SELECT id, user_id FROM sessions WHERE user_id IN (
        SELECT DISTINCT user_id FROM conversations WHERE session_id IS NULL
      )`, (e2, sessions) => {
        if (e2) { console.error(e2.message); return; }
        sessions.forEach(s => {
          db.run('UPDATE conversations SET session_id = ? WHERE user_id = ? AND session_id IS NULL', [s.id, s.user_id]);
        });
      });
    });
  });
});

// ============ JWT 认证中间件 ============
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, message: '未登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, data: null, message: '登录已过期，请重新登录' });
  }
}

// ============ 认证接口 ============

// POST /api/auth/register - 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, data: null, message: '用户名和密码不能为空' });
    }
    if (username.length < 2 || username.length > 20) {
      return res.json({ success: false, data: null, message: '用户名长度应在2-20个字符之间' });
    }
    if (password.length < 6) {
      return res.json({ success: false, data: null, message: '密码长度不能少于6位' });
    }

    // 检查用户名是否已存在
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (existing) {
      return res.json({ success: false, data: null, message: '用户名已存在' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, password_hash], function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    const token = jwt.sign({ userId: result.lastID }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token, user: { id: result.lastID, username } },
      message: '注册成功',
    });
  } catch (error) {
    console.error('注册失败:', error.message);
    res.json({ success: false, data: null, message: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login - 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, data: null, message: '用户名和密码不能为空' });
    }

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, password_hash FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.json({ success: false, data: null, message: '用户名或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.json({ success: false, data: null, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username } },
      message: '登录成功',
    });
  } catch (error) {
    console.error('登录失败:', error.message);
    res.json({ success: false, data: null, message: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me - 获取当前用户信息
app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get('SELECT id, username, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) {
      return res.json({ success: false, data: null, message: '用户不存在' });
    }
    res.json({ success: true, data: user, message: '' });
  });
});

// ============ 笔记接口 ============

// GET /api/notes - 获取笔记列表
app.get('/api/notes', authMiddleware, (req, res) => {
  db.all(
    'SELECT id, title, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
    [req.userId],
    (err, rows) => {
      if (err) {
        console.error('查询笔记失败:', err.message);
        return res.json({ success: false, data: null, message: '获取笔记列表失败' });
      }
      res.json({ success: true, data: rows, message: '' });
    }
  );
});

// POST /api/notes - 创建笔记
app.post('/api/notes', authMiddleware, (req, res) => {
  const { title, content } = req.body;
  if (!title) {
    return res.json({ success: false, data: null, message: '笔记标题不能为空' });
  }
  db.run(
    'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
    [req.userId, title, content || ''],
    function (err) {
      if (err) {
        console.error('创建笔记失败:', err.message);
        return res.json({ success: false, data: null, message: '创建笔记失败' });
      }
      res.json({
        success: true,
        data: { id: this.lastID, title, content },
        message: '创建成功',
      });
    }
  );
});

// GET /api/notes/:id - 获取单条笔记
app.get('/api/notes/:id', authMiddleware, (req, res) => {
  db.get(
    'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    (err, row) => {
      if (err || !row) {
        return res.json({ success: false, data: null, message: '笔记不存在' });
      }
      res.json({ success: true, data: row, message: '' });
    }
  );
});

// PUT /api/notes/:id - 更新笔记
app.put('/api/notes/:id', authMiddleware, (req, res) => {
  const { title, content } = req.body;
  db.run(
    "UPDATE notes SET title = ?, content = ?, updated_at = datetime('now', 'localtime') WHERE id = ? AND user_id = ?",
    [title, content || '', req.params.id, req.userId],
    function (err) {
      if (err) {
        console.error('更新笔记失败:', err.message);
        return res.json({ success: false, data: null, message: '更新笔记失败' });
      }
      if (this.changes === 0) {
        return res.json({ success: false, data: null, message: '笔记不存在或无权操作' });
      }
      res.json({ success: true, data: { id: parseInt(req.params.id), title, content }, message: '更新成功' });
    }
  );
});

// DELETE /api/notes/:id - 删除笔记
app.delete('/api/notes/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId], function (err) {
    if (err) {
      console.error('删除笔记失败:', err.message);
      return res.json({ success: false, data: null, message: '删除笔记失败' });
    }
    if (this.changes === 0) {
      return res.json({ success: false, data: null, message: '笔记不存在或无权操作' });
    }
    res.json({ success: true, data: null, message: '删除成功' });
  });
});

// ============ AI 问答接口（带用户关联）============

// POST /api/chat - 调用 DeepSeek API（支持 session_id）
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { question, session_id } = req.body;
    if (!question) {
      return res.json({ success: false, data: null, message: '请输入问题' });
    }

    if (!DEEPSEEK_API_KEY) {
      return res.json({ success: false, data: null, message: 'DEEPSEEK_API_KEY 未配置' });
    }

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: question }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );

    const answer = response.data.choices[0].message.content;

    // 存入数据库（关联用户和会话）
    db.run(
      'INSERT INTO conversations (user_id, session_id, question, answer) VALUES (?, ?, ?, ?)',
      [req.userId, session_id || null, question, answer],
      function (err) {
        if (err) {
          console.error('数据库写入失败:', err.message);
        }
      }
    );

    res.json({ success: true, data: { answer, question }, message: '' });
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.response?.data || error.message);
    res.json({ success: false, data: null, message: 'AI 服务调用失败，请稍后重试' });
  }
});

// ============ 会话管理接口 ============

// POST /api/sessions - 创建新会话
app.post('/api/sessions', authMiddleware, (req, res) => {
  db.run(
    'INSERT INTO sessions (user_id, title) VALUES (?, ?)',
    [req.userId, '新对话'],
    function (err) {
      if (err) {
        console.error('创建会话失败:', err.message);
        return res.json({ success: false, data: null, message: '创建会话失败' });
      }
      res.json({ success: true, data: { id: this.lastID, title: '新对话' }, message: '' });
    }
  );
});

// GET /api/sessions - 获取当前用户的会话列表
app.get('/api/sessions', authMiddleware, (req, res) => {
  db.all(`
    SELECT s.id, s.title, s.is_pinned, s.created_at,
      COUNT(c.id) as msg_count,
      (SELECT question FROM conversations WHERE session_id = s.id ORDER BY id ASC LIMIT 1) as first_question
    FROM sessions s
    LEFT JOIN conversations c ON c.session_id = s.id
    WHERE s.user_id = ?
    GROUP BY s.id
    ORDER BY s.is_pinned DESC, s.created_at DESC
  `, [req.userId], (err, rows) => {
    if (err) {
      console.error('查询会话列表失败:', err.message);
      return res.json({ success: false, data: null, message: '获取会话列表失败' });
    }
    res.json({ success: true, data: rows, message: '' });
  });
});

// DELETE /api/sessions/:id - 删除会话及其消息
app.delete('/api/sessions/:id', authMiddleware, (req, res) => {
  const sessionId = req.params.id;
  // 先删消息，再删会话
  db.run('DELETE FROM conversations WHERE session_id = ? AND user_id = ?', [sessionId, req.userId], () => {
    db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [sessionId, req.userId], function (err) {
      if (err) {
        console.error('删除会话失败:', err.message);
        return res.json({ success: false, data: null, message: '删除会话失败' });
      }
      if (this.changes === 0) {
        return res.json({ success: false, data: null, message: '会话不存在或无权操作' });
      }
      res.json({ success: true, data: null, message: '删除成功' });
    });
  });
});

// PUT /api/sessions/:id - 更新会话（重命名 / 置顶）
app.put('/api/sessions/:id', authMiddleware, (req, res) => {
  const { title, is_pinned } = req.body;
  const updates = [];
  const params = [];
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (is_pinned !== undefined) { updates.push('is_pinned = ?'); params.push(is_pinned ? 1 : 0); }
  if (updates.length === 0) {
    return res.json({ success: false, data: null, message: '没有要更新的字段' });
  }
  params.push(req.params.id, req.userId);
  db.run(
    `UPDATE sessions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    params,
    function (err) {
      if (err) {
        console.error('更新会话失败:', err.message);
        return res.json({ success: false, data: null, message: '更新会话失败' });
      }
      if (this.changes === 0) {
        return res.json({ success: false, data: null, message: '会话不存在或无权操作' });
      }
      res.json({ success: true, data: null, message: '更新成功' });
    }
  );
});

// GET /api/sessions/:id/messages - 获取某会话的所有消息
app.get('/api/sessions/:id/messages', authMiddleware, (req, res) => {
  db.all(
    'SELECT id, question, answer, created_at FROM conversations WHERE session_id = ? AND user_id = ? ORDER BY id ASC',
    [req.params.id, req.userId],
    (err, rows) => {
      if (err) {
        console.error('查询消息失败:', err.message);
        return res.json({ success: false, data: null, message: '获取消息失败' });
      }
      res.json({ success: true, data: rows, message: '' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`后端服务已启动，端口: ${PORT}`);
});
