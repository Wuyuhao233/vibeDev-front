#!/bin/bash
set -e

echo "🔨 构建前端镜像..."
podman build -t vibedev-frontend:latest .

echo "🛑 停止旧容器..."
podman rm -f vibedev-frontend 2>/dev/null || true

echo "🚀 启动新容器（Pod 内运行，nginx:80 → 宿主机:5173）..."
podman run -d --pod vibedev-pod --name vibedev-frontend \
  vibedev-frontend:latest

echo ""
echo "⏳ 等待服务就绪..."
for i in $(seq 1 10); do
  if curl -s -o /dev/null http://localhost:5173 2>/dev/null; then
    echo "✅ 前端服务已就绪 → http://localhost:5173"
    exit 0
  fi
  sleep 1
done

echo "❌ 服务启动超时，请检查日志: podman logs vibedev-frontend"
echo ""
echo "💡 提示：如果 Pod 未暴露 5173 端口，请用以下命令重建 Pod："
echo "   podman pod rm -f vibedev-pod"
echo "   podman pod create --name vibedev-pod -p 8081:8080 -p 5173:80"
exit 1
