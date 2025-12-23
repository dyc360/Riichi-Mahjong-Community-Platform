#!/bin/bash
# Celery服务自动配置脚本（Linux systemd）
# 使用方法: sudo bash setup_celery_services.sh

set -e

# 配置变量（请根据实际情况修改）
PROJECT_DIR="/home/ubuntu/Riichi-Mahjong-Community-Platform/Backend"
VENV_PATH="$PROJECT_DIR/majhub_env"
USER_NAME=ubuntu
GROUP_NAME=ubuntu

echo "=========================================="
echo "Celery服务自动配置脚本"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "虚拟环境: $VENV_PATH"
echo "运行用户: $USER_NAME"
echo "用户组: $GROUP_NAME"
echo "=========================================="

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误: 项目目录不存在: $PROJECT_DIR"
    echo "请修改脚本中的 PROJECT_DIR 变量"
    exit 1
fi

# 检查虚拟环境是否存在
if [ ! -d "$VENV_PATH" ]; then
    echo "错误: 虚拟环境不存在: $VENV_PATH"
    echo "请先创建虚拟环境: python3 -m venv venv"
    exit 1
fi

# 创建Celery Worker服务文件
echo "创建Celery Worker服务..."
cat > /tmp/celery-worker.service <<EOF
[Unit]
Description=Celery Worker for M-League Data Scraping
After=network.target redis.service

[Service]
Type=simple
User=$USER_NAME
Group=$GROUP_NAME
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$VENV_PATH/bin"
ExecStart=$VENV_PATH/bin/celery -A backend worker --loglevel=info --concurrency=4
ExecStop=/bin/kill -s TERM \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 创建Celery Beat服务文件
echo "创建Celery Beat服务..."
cat > /tmp/celery-beat.service <<EOF
[Unit]
Description=Celery Beat Scheduler for M-League Data
After=network.target redis.service celery-worker.service

[Service]
Type=simple
User=$USER_NAME
Group=$GROUP_NAME
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$VENV_PATH/bin"
ExecStart=$VENV_PATH/bin/celery -A backend beat --loglevel=info
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 复制服务文件到systemd目录
echo "安装服务文件..."
sudo cp /tmp/celery-worker.service /etc/systemd/system/
sudo cp /tmp/celery-beat.service /etc/systemd/system/

# 重新加载systemd
echo "重新加载systemd配置..."
sudo systemctl daemon-reload

# 启用服务（开机自启）
echo "启用服务..."
sudo systemctl enable celery-worker
sudo systemctl enable celery-beat

# 启动服务
echo "启动服务..."
sudo systemctl start celery-worker
sudo systemctl start celery-beat

# 等待服务启动
sleep 3

# 检查服务状态
echo ""
echo "=========================================="
echo "服务状态检查"
echo "=========================================="
sudo systemctl status celery-worker --no-pager -l
echo ""
sudo systemctl status celery-beat --no-pager -l

echo ""
echo "=========================================="
echo "配置完成！"
echo "=========================================="
echo "常用命令："
echo "  查看Worker状态: sudo systemctl status celery-worker"
echo "  查看Beat状态:   sudo systemctl status celery-beat"
echo "  查看Worker日志: sudo journalctl -u celery-worker -f"
echo "  查看Beat日志:   sudo journalctl -u celery-beat -f"
echo "  重启Worker:     sudo systemctl restart celery-worker"
echo "  重启Beat:       sudo systemctl restart celery-beat"
echo "=========================================="
