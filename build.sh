#!/bin/bash
# 构建脚本: 替换模板变量用于静态部署
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p dist
cp -r frontend/* dist/
sed -i.bak "s/{{VERSION_TIMESTAMP}}/${TIMESTAMP}/g" dist/index.html
rm -f dist/index.html.bak
echo "Build complete. Timestamp: ${TIMESTAMP}"
