#!/bin/bash
# 构建脚本: 替换模板变量用于静态部署
export BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
export BUILD_API_BASE="${OPENCLAW_API_BASE:-}"

mkdir -p dist
cp -r frontend/* dist/

# 用 Python 替换模板变量（通过环境变量传递，避免 shell 转义问题）
python3 << 'PYEOF'
import os
ts = os.environ.get("BUILD_TIMESTAMP", "")
api = os.environ.get("BUILD_API_BASE", "").strip()
with open("dist/index.html", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("{{VERSION_TIMESTAMP}}", ts)
content = content.replace("{{OPENCLAW_API_BASE}}", api)
with open("dist/index.html", "w", encoding="utf-8") as f:
    f.write(content)
print(f"Replaced: VERSION_TIMESTAMP={ts}, OPENCLAW_API_BASE={api or '(same-origin)'}")
PYEOF

echo "Build complete."
