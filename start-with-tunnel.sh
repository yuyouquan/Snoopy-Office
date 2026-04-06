#!/bin/bash

# Snoopy Office - 启动本地后端 + Cloudflare Tunnel

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Snoopy Office - 启动后端 + 公网隧道                   ║"
echo "╚════════════════════════════════════════════════════════╝"

# 检查后端是否已在运行
if pgrep -f "backend/app.py" > /dev/null; then
    echo "✅ 后端已在运行"
    BACKEND_URL="http://127.0.0.1:19000"
else
    echo "🚀 启动后端服务..."
    cd "$(dirname "$0")/backend"
    python3 app.py > /tmp/snoopy_backend.log 2>&1 &
    BACKEND_PID=$!
    sleep 3

    if ps -p $BACKEND_PID > /dev/null; then
        echo "✅ 后端启动成功 (PID: $BACKEND_PID)"
        BACKEND_URL="http://127.0.0.1:19000"
    else
        echo "❌ 后端启动失败"
        cat /tmp/snoopy_backend.log
        exit 1
    fi
fi

# 检查 Cloudflare Tunnel
if ! command -v cloudflared &> /dev/null; then
    echo "❌ 未安装 cloudflared，请访问: https://developers.cloudflare.com/cloudflare-one/downloads/"
    exit 1
fi

echo ""
echo "🌐 启动 Cloudflare Tunnel..."
echo "   将 http://127.0.0.1:19000 暴露到公网..."
echo ""

# 启动隧道并捕获输出
cloudflared tunnel --url http://127.0.0.1:19000 2>&1 | tee /tmp/tunnel.log | while IFS= read -r line; do
    echo "$line"
    # 尝试提取 URL
    if [[ $line =~ https://.*trycloudflare.com ]]; then
        TUNNEL_URL=$(echo "$line" | grep -oE 'https://[^[:space:]]+trycloudflare\.com')
        echo ""
        echo "╔════════════════════════════════════════════════════════╗"
        echo "║  ✅ 隧道已启动！                                       ║"
        echo "╚════════════════════════════════════════════════════════╝"
        echo ""
        echo "📋 后端信息："
        echo "   本地:   $BACKEND_URL"
        echo "   公网:   $TUNNEL_URL"
        echo ""
        echo "📌 配置 Vercel 环境变量："
        echo "   OPENCLAW_API_BASE = $TUNNEL_URL"
        echo ""
        echo "🔗 前端访问地址:"
        echo "   https://snoopy-office.vercel.app"
        echo ""
        echo "⚠️  注意:"
        echo "   - Cloudflare Tunnel URL 每次启动都会变化"
        echo "   - 重启本脚本后需要更新 Vercel 环境变量"
        echo "   - 建议使用 named tunnel 获得持久 URL（需要 Cloudflare 账号）"
        echo ""
    fi
done
