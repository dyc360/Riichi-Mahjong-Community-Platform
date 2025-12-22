#!/bin/bash
# Celery服务状态检查脚本

echo "=========================================="
echo "Celery服务状态检查"
echo "=========================================="
echo ""

# 检查Redis
echo "1. Redis状态:"
if systemctl is-active --quiet redis-server || systemctl is-active --quiet redis; then
    echo "   ✓ Redis正在运行"
    redis-cli ping > /dev/null 2>&1 && echo "   ✓ Redis连接正常" || echo "   ✗ Redis连接失败"
else
    echo "   ✗ Redis未运行"
fi
echo ""

# 检查Celery Worker
echo "2. Celery Worker状态:"
if systemctl is-active --quiet celery-worker; then
    echo "   ✓ Celery Worker正在运行"
    systemctl status celery-worker --no-pager -l | head -n 5
else
    echo "   ✗ Celery Worker未运行"
fi
echo ""

# 检查Celery Beat
echo "3. Celery Beat状态:"
if systemctl is-active --quiet celery-beat; then
    echo "   ✓ Celery Beat正在运行"
    systemctl status celery-beat --no-pager -l | head -n 5
else
    echo "   ✗ Celery Beat未运行"
fi
echo ""

# 检查进程
echo "4. 进程检查:"
WORKER_PIDS=$(pgrep -f "celery.*worker" | wc -l)
BEAT_PIDS=$(pgrep -f "celery.*beat" | wc -l)
echo "   Celery Worker进程数: $WORKER_PIDS"
echo "   Celery Beat进程数: $BEAT_PIDS"
echo ""

# 检查定时任务
echo "5. 定时任务配置:"
if command -v celery > /dev/null 2>&1; then
    cd "$(dirname "$0")/.." || exit
    source venv/bin/activate 2>/dev/null || true
    celery -A backend inspect scheduled 2>/dev/null | head -n 20 || echo "   无法获取定时任务信息"
else
    echo "   Celery命令未找到"
fi
echo ""

echo "=========================================="
