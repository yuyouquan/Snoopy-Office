# Vercel 前端配置 Checklist

**目标**：让 Vercel 部署的前端能访问本地后端

---

## 📋 配置步骤

### 前置条件 ✅

- [x] 后端在本地运行：`http://127.0.0.1:19000`
- [x] 后端状态检查通过：`curl http://127.0.0.1:19000/health`
- [x] Cloudflare Tunnel 已启动
- [x] 隧道 URL：`https://casual-mistress-greene-outlet.trycloudflare.com`
- [x] 隧道连接验证：`curl https://casual-mistress-greene-outlet.trycloudflare.com/health` ✅

---

## 🔧 Vercel 环境变量配置

### 方式一：Web 界面（推荐）

1. **打开 Vercel 仪表板**
   - 访问 https://vercel.com/dashboard

2. **选择项目**
   - 找到 "Snoopy Office" 项目
   - 点击进入

3. **进入设置**
   - 点击 **Settings** 选项卡

4. **配置环境变量**
   - 左侧菜单 → **Environment Variables**
   - 点击 **Add New**

5. **填写环境变量**

   | 字段 | 值 |
   |------|-----|
   | Name | `OPENCLAW_API_BASE` |
   | Value | `https://casual-mistress-greene-outlet.trycloudflare.com` |
   | Environments | ✓ Production ✓ Preview |

6. **保存**
   - 点击 **Save**
   - 等待重新部署完成（约 1-2 分钟）

### 方式二：CLI

```bash
# 如果你已安装 Vercel CLI
vercel env add OPENCLAW_API_BASE
# 输入值：https://casual-mistress-greene-outlet.trycloudflare.com
```

---

## ✅ 验证配置

### 1. 检查部署状态

访问 Vercel Dashboard：
- 项目 → **Deployments**
- 查看最新部署状态（应该是 ✓ Ready）

### 2. 打开前端应用

```
https://snoopy-office.vercel.app/
```

### 3. 浏览器调试

按 `F12` 打开 DevTools：

**Network 标签：**
- 刷新页面
- 查看 API 请求（例如 `/health`, `/status`, `/agents`）
- 确认状态码为 **200** 或 **201**
- URL 应该显示为 `https://casual-mistress-greene-outlet.trycloudflare.com/...`

**Console 标签：**
- 检查是否有红色错误信息
- 查找 CORS 相关的错误
- 查找网络错误

### 4. 功能测试

在页面上测试：
- [ ] 页面能正常加载
- [ ] 状态面板显示数据（今日、本周、排行榜）
- [ ] Agent 卡片显示数据
- [ ] 工位系统显示（各角色工作站）
- [ ] 切换状态功能正常

---

## 🐛 常见问题排查

### 问题 1：环境变量不生效

**症状**：设置了环境变量，但前端仍然无法连接

**解决**：
1. 确认已点击 **Save**
2. 等待部署完成（检查 Deployments 标签）
3. 刷新前端页面（Ctrl+Shift+R 硬刷新）
4. 打开浏览器 DevTools，查看 Network 标签中的 API 请求 URL

### 问题 2：CORS 错误

**症状**：控制台出现 "Cross-Origin Request Blocked" 错误

**原因**：
- 前端（HTTPS Vercel）无法访问后端（Cloudflare Tunnel）
- 后端缺少 CORS 配置

**解决**：

在后端 `app.py` 中添加 CORS 支持：

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 允许所有来源（开发环境）

# 生产环境更严格的配置：
# CORS(app, resources={
#     r"/api/*": {
#         "origins": ["https://snoopy-office.vercel.app"],
#         "methods": ["GET", "POST", "OPTIONS"],
#         "allow_headers": ["Content-Type"]
#     }
# })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=19000)
```

然后：
```bash
pip install flask-cors
python backend/app.py
```

### 问题 3：隧道 URL 过期

**症状**：今天还能用，明天就不行了

**原因**：
- Cloudflare Tunnel 免费版隧道每次重启都会变化
- 隧道可能因为浏览器关闭或进程停止而重启

**解决**：
1. 重新启动隧道：`cloudflared tunnel --url http://127.0.0.1:19000`
2. 复制新 URL
3. 在 Vercel 中更新环境变量
4. 等待重新部署
5. 刷新前端

---

## 📊 环境变量配置历史

| 时间 | URL | 备注 |
|------|-----|------|
| 2026-04-06 19:56 | `https://casual-mistress-greene-outlet.trycloudflare.com` | 首次配置，隧道正常 |
| | | |

---

## 🎯 快速命令参考

```bash
# 测试隧道连接
curl https://casual-mistress-greene-outlet.trycloudflare.com/health

# 测试完整 API
curl https://casual-mistress-greene-outlet.trycloudflare.com/openclaw/status

# 查看本地后端状态
curl http://127.0.0.1:19000/health

# 查看隧道进程
ps aux | grep cloudflared

# 停止隧道
pkill cloudflared

# 重启隧道
cloudflared tunnel --url http://127.0.0.1:19000
```

---

## 📚 相关文档

- [Cloudflare Tunnel 官方文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Vercel 环境变量文档](https://vercel.com/docs/environment-variables)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [README.md](./README.md) - 项目说明

---

## ✨ 成功标志

当你看到以下画面时，说明配置成功：

1. ✅ 浏览器打开 https://snoopy-office.vercel.app/
2. ✅ 页面显示 Snoopy 办公室（不是空白或错误）
3. ✅ DevTools Network 标签显示 API 请求状态码 200
4. ✅ 页面显示统计数据、Agent 卡片、工位信息
5. ✅ 没有红色错误信息

---

## 💬 需要帮助？

如果还有问题，收集以下信息：

1. 浏览器 DevTools Console 的完整错误信息
2. Network 标签中失败 API 请求的详细信息
3. `curl https://casual-mistress-greene-outlet.trycloudflare.com/health` 的输出
4. Vercel Dashboard 中的部署日志

---

**最后更新**：2026-04-06
**作者**：Claude Code
