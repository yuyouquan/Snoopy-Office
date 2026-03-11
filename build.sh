#!/bin/bash
# 构建脚本: 替换模板变量用于静态部署
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
API_BASE="${OPENCLAW_API_BASE:-}"

mkdir -p dist
cp -r frontend/* dist/

# 替换模板变量
sed -i.bak "s|{{VERSION_TIMESTAMP}}|${TIMESTAMP}|g" dist/index.html
sed -i.bak "s|{{OPENCLAW_API_BASE}}|${API_BASE}|g" dist/index.html
rm -f dist/index.html.bak

echo "Build complete. Timestamp: ${TIMESTAMP}, API Base: ${API_BASE:-'(same-origin)'}"
