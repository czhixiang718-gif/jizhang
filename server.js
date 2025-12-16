const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('无法连接数据库:', err.message);
  } else {
    db.run('PRAGMA foreign_keys = ON');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      entity TEXT,
      invoiceInfo TEXT,
      signDate TEXT,
      paymentDate TEXT,
      manager TEXT,
      contact TEXT,
      amount REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      date TEXT,
      amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`);
  });
}

app.get('/api/projects', (req, res) => {
  const sql = `
    SELECT p.*, COALESCE(SUM(pay.amount), 0) AS collected
    FROM projects p
    LEFT JOIN payments pay ON pay.project_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;
  db.all(sql, [], (err, projects) => {
    if (err) return res.status(400).json({ error: err.message });
    if (projects.length === 0) return res.json([]);
    const ids = projects.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    db.all(`SELECT * FROM payments WHERE project_id IN (${placeholders}) ORDER BY id ASC`, ids, (perr, allPayments) => {
      if (perr) {
        projects.forEach(p => { p.payments = []; });
        return res.json(projects);
      }
      const map = {};
      allPayments.forEach(pay => {
        if (!map[pay.project_id]) map[pay.project_id] = [];
        map[pay.project_id].push(pay);
      });
      projects.forEach(p => {
        p.payments = map[p.id] || [];
      });
      res.json(projects);
    });
  });
});

app.get('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM projects WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Project not found' });
    db.all(`SELECT * FROM payments WHERE project_id = ?`, [id], (perr, pays) => {
      if (perr) {
        row.payments = [];
        row.collected = 0;
      } else {
        const list = pays || [];
        row.payments = list;
        row.collected = list.reduce((acc, cur) => acc + (typeof cur.amount === 'number' ? cur.amount : parseFloat(cur.amount) || 0), 0);
      }
      res.json(row);
    });
  });
});

app.post('/api/projects', (req, res) => {
  const { name, entity, invoiceInfo, signDate, paymentDate, manager, contact, amount, status } = req.body;
  const sql = `INSERT INTO projects (name, entity, invoiceInfo, signDate, paymentDate, manager, contact, amount, status) VALUES (?,?,?,?,?,?,?,?,?)`;
  const params = [name, entity, invoiceInfo, signDate, paymentDate, manager, contact, amount, status || '进行中'];
  db.run(sql, params, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body, collected: 0, payments: [] });
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM payments WHERE project_id = ?`, [id], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    db.run(`DELETE FROM projects WHERE id = ?`, [id], function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Deleted', changes: this.changes });
    });
  });
});

app.post('/api/projects/:id/payments', (req, res) => {
  const projectId = req.params.id;
  const { date, amount } = req.body;
  const sql = `INSERT INTO payments (project_id, date, amount) VALUES (?,?,?)`;
  db.run(sql, [projectId, date, amount], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, project_id: projectId, date, amount });
  });
});

app.delete('/api/payments/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM payments WHERE id = ?`, [id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'Payment deleted' });
  });
});

app.post('/api/ai/generate', async (req, res) => {
  // 从请求体中获取 apiKey 和 endpointId，或者回退到环境变量 (保留旧兼容)
  let { prompt, apiKey, endpointId } = req.body || {};
  const envKey = process.env.GEMINI_API_KEY || ''; // 兼容旧逻辑
  
  // 优先使用前端传入的 apiKey，否则使用环境变量
  const key = apiKey || envKey;

  // 如果没有配置 Key，返回模拟数据
  if (!key) {
    console.log('⚠️ 未配置 API Key，使用模拟响应');
    await new Promise(r => setTimeout(r, 1000));
    
    if (prompt.includes('催款')) {
      return res.json({ 
        text: `【模拟 AI 生成结果 - 未配置 API Key】\n\n尊敬的[客户名称]财务部：\n\n您好！\n\n关于[项目名称]的款项（金额：¥xx万），根据合同约定应于[日期]支付。目前已过付款期限，烦请贵司尽快安排请款流程。\n\n如有任何疑问，请随时与我联系。\n\n谢谢！` 
      });
    } else if (prompt.includes('风险')) {
      return res.json({ 
        text: `【模拟 AI 生成结果 - 未配置 API Key】\n\n**风险等级：中等风险**\n\n**分析建议：**\n1. 该项目回款进度滞后，建议增加催收频率。\n2. 客户主体信用状况良好，但近期付款流程较慢。\n3. 建议发送正式催款函，并由负责人[负责人姓名]进行电话跟进。` 
      });
    } else {
      return res.json({ text: '【模拟 AI 响应】这是一条模拟的 AI 回复。请在“设置”中配置有效的豆包 API Key 和 Endpoint ID 以获取真实 AI 响应。' });
    }
  }

  // 判断是调用 豆包 (Volcengine) 还是 Gemini
  // 如果前端传了 endpointId，或者 key 看起来像豆包的 (sk-开头是常见格式，但 Gemini 也可以是)，
  // 这里简单约定：只要前端传了 endpointId，就走豆包逻辑。
  // 否则如果只是环境变量配置的，继续走 Gemini (旧逻辑)
  
  if (endpointId) {
    // --- 豆包 (Volcengine Ark) 调用逻辑 ---
    try {
      // 豆包 API 地址 (标准 OpenAI 兼容接口)
      const url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
      
      const payload = {
        model: endpointId,
        messages: [
          { role: 'system', content: '你是一个专业的项目管理与财务助手。' },
          { role: 'user', content: prompt || '' }
        ],
        stream: false
      };

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const errText = await r.text();
        console.error('Doubao API Error:', r.status, errText);
        throw new Error(`Doubao API Error: ${r.status}`);
      }

      const data = await r.json();
      const text = data.choices?.[0]?.message?.content || 'AI 暂时无法响应 (No content)。';
      res.json({ text });

    } catch (e) {
      console.error('AI Proxy Error (Doubao):', e);
      res.status(200).json({ text: `连接豆包 AI 服务失败: ${e.message}。请检查 API Key 和 Endpoint ID 是否正确。` });
    }
  } else {
    // --- Gemini (旧逻辑) ---
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`;
      const payload = { contents: [{ parts: [{ text: prompt || '' }] }] };
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 暂时无法响应，请稍后再试。';
      res.json({ text });
    } catch (e) {
      console.error('AI Proxy Error (Gemini):', e);
      res.status(200).json({ text: '连接 AI 服务失败，请检查网络或稍后重试。' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}/api`);
  console.log(`💾 数据库文件: ${DB_PATH}`);
});
