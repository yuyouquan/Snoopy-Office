# Snoopy Office 部署指南 — 前后端分离

这份指南说明如何部署 Snoopy Office 的前端到 Vercel，同时保持后端在本地运行。

---

## 问题诊断

当前问题：前端（Vercel）无法连接到本地后端（127.0.0.1:19000）。

**原因**：
1. Vercel 上的前端只能访问公网地址，不能直接访问 localhost
2. 后端需要通过某种方式暴露到公网
3. 前端需要知道后端的公网地址

---

## 解决方案

### 方案 A：使用 Cloudflare Tunnel（推荐，快速测试）

这是最简单的临时方案。无需部署后端，直接把本地后端暴露到公网。

#### Step 1 — 确保后端在运行

```bash
# 检查后端是否运行
curl http://127.0.0.1:19000/health

# 如果没有运行，启动后端
cd backend
python3 app.py
```

#### Step 2 — 启动 Cloudflare Tunnel

```bash
# 暴露本地后端到公网
cloudflared tunnel --url http://127.0.0.1:19000
```

你会看到类似的输出：
```
INF Requesting new quick Tunnel on trycloudflare.com...
https://xxx-yyy-zzz.trycloudflare.com
```

**记下这个 URL**，例如：`https://xxx-yyy-zzz.trycloudflare.com`

#### Step 3 — 配置 Vercel 环境变量

1. 打开 Vercel 项目设置
   - 访问 https://vercel.com/dashboard
   - 找到 "Snoopy Office" 项目
   - 进入 **Settings** → **Environment Variables**

2. 添加环境变量：
   - **Name**: `OPENCLAW_API_BASE`
   - **Value**: `https://xxx-yyy-zzz.trycloudflare.com`（替换为你的隧道 URL）
   - **Environments**: 选择 `Production` 和 `Preview`

3. 点击 **Save**，Vercel 会自动重新部署前端

#### Step 4 — 验证连接

1. 重新访问 https://snoopy-office.vercel.app/
2. 打开浏览器 DevTools 的 **Network** 标签
3. 刷新页面，检查 API 请求是否成功（状态码 200）

**注意**：
- Cloudflare Tunnel URL 每次重启都会变化
- 重启后需要更新 Vercel 环境变量
- 这个方案不适合生产环境长期使用

---

### 方案 B：部署后端到云平台（生产推荐）

如果你想要长期稳定的部署，把后端也部署到云平台。

#### 推荐平台（选一个）：

**Railway.app**（最简单）
```bash
# 1. 注册 https://railway.app
# 2. 连接 GitHub 仓库
# 3. 选择 backend/app.py 作为启动命令
# 4. 自动获得稳定的公网 URL
```

**Render.com**（免费额度充足）
```bash
# 1. 注册 https://render.com
# 2. Create New → Web Service
# 3. 连接 GitHub，选择此仓库
# 4. Runtime: Python 3.x
# 5. Build: pip install -r backend/requirements.txt
# 6. Start: python backend/app.py
```

**Fly.io**（高性能）
```bash
# 1. 安装 flyctl
# 2. fly auth login
# 3. 在项目根目录创建 fly.toml
# 4. fly deploy
```

#### 部署后的步骤：

1. 获得后端公网 URL（例如：`https://snoopy-office-backend.railway.app`）
2. 在 Vercel 环境变量中设置 `OPENCLAW_API_BASE = https://snoopy-office-backend.railway.app`
3. 重新部署 Vercel 前端
4. 访问 https://snoopy-office.vercel.app/ 验证

---

## 前端代码配置

### 如何让前端读取环境变量？

前端在 `index.html` 中有这一行：

```javascript
window.OPENCLAW_API_BASE = '{{OPENCLAW_API_BASE}}';
function getApiBase() { return window.OPENCLAW_API_BASE || ''; }
```

这个模板变量 `{{OPENCLAW_API_BASE}}` 是由后端的模板引擎替换的。

**在 Vercel 部署中**，前端是静态文件，没有模板引擎替换。所以需要在构建时注入环境变量。

#### 修复方法（如果 Vercel 环境变量不生效）：

在 `frontend/index.html` 中修改这一行：

```javascript
// 旧代码：
window.OPENCLAW_API_BASE = '{{OPENCLAW_API_BASE}}';

// 新代码：
window.OPENCLAW_API_BASE = '{{OPENCLAW_API_BASE}}' || process.env.OPENCLAW_API_BASE || '';
```

但这需要构建步骤。更简单的方法是在浏览器控制台手动设置：

```javascript
// 在浏览器 DevTools console 中运行
window.OPENCLAW_API_BASE = 'https://xxx-yyy-zzz.trycloudflare.com';
location.reload();
```

---

## CORS 问题处理

如果你看到类似错误：
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

这是 CORS 问题。后端需要配置允许 Vercel 前端的跨域请求。

### 在后端 (app.py) 中添加 CORS 支持

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# 允许来自 Vercel 部署的请求
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://snoopy-office.vercel.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

或者允许所有来源（开发环境）：

```python
CORS(app)
```

然后安装 flask-cors：

```bash
pip install flask-cors
```

---

## 快速排查清单

- [ ] 后端在本地运行：`curl http://127.0.0.1:19000/health`
- [ ] Cloudflare Tunnel 已启动：`cloudflared tunnel --url http://127.0.0.1:19000`
- [ ] 隧道 URL 记下来（例如 `https://xxx.trycloudflare.com`）
- [ ] Vercel 环境变量已设置：`OPENCLAW_API_BASE = https://xxx.trycloudflare.com`
- [ ] Vercel 前端已重新部署（自动或手动触发）
- [ ] 浏览器 console 检查是否有 CORS 错误
- [ ] 浏览器 Network 标签检查 API 请求状态码

---

## 常见问题

**Q: 每次重启隧道 URL 都变了，很烦**
A: 这是 Cloudflare Tunnel 免费版的限制。使用 named tunnel（需要 Cloudflare 账号）可以获得固定 URL。

**Q: Vercel 环境变量设置了但不生效**
A: 确保已经：
1. 保存环境变量
2. 重新部署（手动或自动）
3. 刷新前端页面，不是从浏览器缓存读取

**Q: CORS 错误怎么办**
A: 在后端 `app.py` 中添加 CORS 配置，或使用代理（如 Vercel Rewrites）。

**Q: 可以用代理吗**
A: 可以。在 `vercel.json` 中添加：

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://xxx.trycloudflare.com/$1"
    }
  ]
}
```

---

## 推荐最佳实践

1. **开发环境**：后端本地运行，前端 localhost 开发
2. **测试环境**：用 Cloudflare Tunnel 快速验证
3. **生产环境**：后端部署到 Railway/Render，前端部署到 Vercel，双双配置环境变量

---

## 需要帮助？

- Cloudflare Tunnel 文档：https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/
- Railway 部署：https://railway.app/docs
- Vercel 环境变量：https://vercel.com/docs/environment-variables
