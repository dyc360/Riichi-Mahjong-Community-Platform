# 云服务器部署指南 - M-League数据爬取和定时更新

本文档提供在云服务器上部署M-League数据爬取和定时更新功能的完整步骤。

## 📋 目录

1. [服务器环境准备](#1-服务器环境准备)
2. [安装Redis](#2-安装redis)
3. [配置Celery定时任务](#3-配置celery定时任务)
4. [设置系统服务（自动启动）](#4-设置系统服务自动启动)
5. [验证和监控](#5-验证和监控)
6. [故障排查](#6-故障排查)

---

## 1. 服务器环境准备

### 1.1 检查Python环境

**Linux服务器：**
```bash
# 检查Python版本（需要3.9+）
python3 --version

# 如果没有安装，安装Python
sudo apt update
sudo apt install python3 python3-pip python3-venv -y
```

**Windows服务器：**
```powershell
# 检查Python版本
python --version

# 如果没有安装，从官网下载安装
# https://www.python.org/downloads/
```

### 1.2 部署项目代码

```bash
# 进入项目目录
cd /path/to/Riichi-Mahjong-Community-Platform/Backend

# 创建虚拟环境（推荐）
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 1.3 配置数据库连接

确保 `backend/settings.py` 中的数据库配置正确：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'mahjong_db',
        'USER': 'majhub_developer',
        'PASSWORD': 'Mahjong_123',
        'HOST': '120.53.120.90',
        'PORT': '8003',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}
```

### 1.4 运行数据库迁移

```bash
# 确保在虚拟环境中
python manage.py migrate
```

---

## 2. 安装Redis

### 2.1 Linux服务器安装Redis

**Ubuntu/Debian：**
```bash
# 安装Redis
sudo apt update
sudo apt install redis-server -y

# 启动Redis服务
sudo systemctl start redis-server

# 设置开机自启
sudo systemctl enable redis-server

# 验证Redis运行状态
sudo systemctl status redis-server
redis-cli ping  # 应该返回 PONG
```

**CentOS/RHEL：**
```bash
# 安装EPEL仓库
sudo yum install epel-release -y

# 安装Redis
sudo yum install redis -y

# 启动Redis服务
sudo systemctl start redis

# 设置开机自启
sudo systemctl enable redis

# 验证
redis-cli ping
```

### 2.2 Windows服务器安装Redis

**选项1：使用WSL（推荐）**
```powershell
# 在WSL中安装Redis
wsl
sudo apt update
sudo apt install redis-server -y
sudo service redis-server start
```

**选项2：使用Docker**
```powershell
# 使用Docker运行Redis
docker run -d --name redis -p 6379:6379 redis:6.2-alpine
```

**选项3：下载Windows版本**
- 从 [Redis for Windows](https://github.com/microsoftarchive/redis/releases) 下载
- 或使用 [Memurai](https://www.memurai.com/)（Redis的Windows替代品）

### 2.3 配置Redis（可选）

编辑Redis配置文件 `/etc/redis/redis.conf`（Linux）：

```bash
# 设置密码（可选，但推荐）
requirepass your_redis_password

# 如果设置了密码，需要在settings.py中更新：
# CELERY_BROKER_URL = 'redis://:your_redis_password@localhost:6379/0'
```

---

## 3. 配置Celery定时任务

### 3.1 验证Celery配置

确保 `backend/settings.py` 中的Celery配置正确：

```python
# Celery配置
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'
CELERY_ENABLE_UTC = True
```

### 3.2 测试Celery连接

```bash
# 激活虚拟环境
source venv/bin/activate  # Linux
# 或
venv\Scripts\activate  # Windows

# 测试Redis连接
celery -A backend inspect ping

# 查看已注册的任务
celery -A backend inspect registered
```

---

## 4. 设置系统服务（自动启动）

### 4.1 Linux服务器 - 使用systemd

#### 创建Celery Worker服务

创建文件 `/etc/systemd/system/celery-worker.service`：

```ini
[Unit]
Description=Celery Worker for M-League Data Scraping
After=network.target redis.service

[Service]
Type=simple
User=your_username
Group=your_group
WorkingDirectory=/path/to/Riichi-Mahjong-Community-Platform/Backend
Environment="PATH=/path/to/Riichi-Mahjong-Community-Platform/Backend/venv/bin"
ExecStart=/path/to/Riichi-Mahjong-Community-Platform/Backend/venv/bin/celery -A backend worker --loglevel=info --concurrency=4
ExecStop=/bin/kill -s TERM $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

#### 创建Celery Beat服务

创建文件 `/etc/systemd/system/celery-beat.service`：

```ini
[Unit]
Description=Celery Beat Scheduler for M-League Data
After=network.target redis.service celery-worker.service

[Service]
Type=simple
User=your_username
Group=your_group
WorkingDirectory=/path/to/Riichi-Mahjong-Community-Platform/Backend
Environment="PATH=/path/to/Riichi-Mahjong-Community-Platform/Backend/venv/bin"
ExecStart=/path/to/Riichi-Mahjong-Community-Platform/Backend/venv/bin/celery -A backend beat --loglevel=info
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

#### 启动和管理服务

```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start celery-worker
sudo systemctl start celery-beat

# 设置开机自启
sudo systemctl enable celery-worker
sudo systemctl enable celery-beat

# 查看服务状态
sudo systemctl status celery-worker
sudo systemctl status celery-beat

# 查看日志
sudo journalctl -u celery-worker -f
sudo journalctl -u celery-beat -f
```

### 4.2 Linux服务器 - 使用Supervisor（替代方案）

如果不想使用systemd，可以使用Supervisor：

```bash
# 安装Supervisor
sudo apt install supervisor -y

# 创建配置文件
sudo nano /etc/supervisor/conf.d/celery-worker.conf
```

`/etc/supervisor/conf.d/celery-worker.conf`：
```ini
[program:celery-worker]
command=/path/to/Riichi-Mahjong-Community-Platform/Backend/venv/bin/celery -A backend worker --loglevel=info --concurrency=4
directory=/path/to/Riichi-Mahjong-Community-Platform/Backend
user=your_username
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery-worker.log
```

`/etc/supervisor/conf.d/celery-beat.conf`：
```ini
[program:celery-beat]
command=/path/to/Riichi-Mahjong-Community-Platform/Backend/venv/bin/celery -A backend beat --loglevel=info
directory=/path/to/Riichi-Mahjong-Community-Platform/Backend
user=your_username
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery-beat.log
```

启动Supervisor：
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker
sudo supervisorctl start celery-beat
```

### 4.3 Windows服务器 - 使用任务计划程序

#### 创建启动脚本

创建 `start_celery_worker.bat`：
```batch
@echo off
cd /d D:\software_engineering\Riichi-Mahjong-Community-Platform\Backend
call venv\Scripts\activate
celery -A backend worker --loglevel=info --concurrency=4
```

创建 `start_celery_beat.bat`：
```batch
@echo off
cd /d D:\software_engineering\Riichi-Mahjong-Community-Platform\Backend
call venv\Scripts\activate
celery -A backend beat --loglevel=info
```

#### 配置任务计划程序

1. 打开"任务计划程序"（Task Scheduler）
2. 创建基本任务
3. 设置触发器为"计算机启动时"
4. 操作选择"启动程序"，指向对应的bat文件
5. 勾选"以最高权限运行"

### 4.4 使用Docker Compose（推荐，适用于所有系统）

如果服务器支持Docker，这是最简单的方案：

```bash
# 进入项目目录
cd /path/to/Riichi-Mahjong-Community-Platform/Backend

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 设置Docker开机自启（Linux）
sudo systemctl enable docker
```

---

## 5. 验证和监控

### 5.1 验证服务运行状态

**Linux（systemd）：**
```bash
# 检查服务状态
sudo systemctl status celery-worker
sudo systemctl status celery-beat
sudo systemctl status redis-server

# 检查进程
ps aux | grep celery
ps aux | grep redis
```

**Docker：**
```bash
docker-compose ps
docker-compose logs celery-worker
docker-compose logs celery-beat
```

### 5.2 测试Celery任务

```bash
# 激活虚拟环境
source venv/bin/activate

# 查看活跃的任务
celery -A backend inspect active

# 查看已注册的任务
celery -A backend inspect registered

# 查看定时任务
celery -A backend inspect scheduled

# 手动触发测试任务
python manage.py update_mleague_data --type rankings
```

### 5.3 检查数据库数据

```bash
# 使用Django shell检查数据
python manage.py shell
```

```python
from mleague.models import TeamRanking, Match, TeamPlayerStats, PointsData

# 检查排名数据
print(f"排名数据: {TeamRanking.objects.count()} 条")
print(f"比赛数据: {Match.objects.count()} 条")
print(f"选手统计: {TeamPlayerStats.objects.count()} 条")
print(f"积分数据: {PointsData.objects.count()} 条")

# 检查最新更新时间
from mleague.models import TeamRanking
latest = TeamRanking.objects.order_by('-last_updated').first()
if latest:
    print(f"最新更新时间: {latest.last_updated}")
```

### 5.4 查看日志

**Linux（systemd）：**
```bash
# 查看Celery Worker日志
sudo journalctl -u celery-worker -f --since "1 hour ago"

# 查看Celery Beat日志
sudo journalctl -u celery-beat -f --since "1 hour ago"
```

**Docker：**
```bash
docker-compose logs -f celery-worker
docker-compose logs -f celery-beat
```

**手动运行（调试）：**
```bash
# 在前台运行，查看实时日志
celery -A backend worker --loglevel=info
celery -A backend beat --loglevel=info
```

---

## 6. 故障排查

### 6.1 Redis连接失败

**症状：** `Error: [Errno 111] Connection refused`

**解决方案：**
```bash
# 检查Redis是否运行
redis-cli ping

# 如果失败，启动Redis
sudo systemctl start redis-server  # Linux
# 或
docker start redis  # Docker
```

### 6.2 Celery Worker无法启动

**检查：**
```bash
# 检查虚拟环境是否正确激活
which celery

# 检查Python路径
python -c "import celery; print(celery.__file__)"

# 检查Django设置
python manage.py check
```

### 6.3 定时任务不执行

**检查：**
```bash
# 检查Celery Beat是否运行
ps aux | grep celery-beat

# 检查时区设置
python manage.py shell
>>> from django.conf import settings
>>> print(settings.TIME_ZONE)  # 应该是 'Asia/Shanghai'

# 查看定时任务配置
celery -A backend inspect scheduled
```

### 6.4 数据爬取失败

**检查：**
```bash
# 查看详细错误日志
celery -A backend events

# 手动测试爬取
python manage.py update_mleague_data --type rankings

# 检查网络连接
curl -I https://m-league.jp
```

### 6.5 数据库连接问题

**检查：**
```bash
# 测试数据库连接
python manage.py dbshell

# 检查数据库配置
python manage.py shell
>>> from django.conf import settings
>>> print(settings.DATABASES)
```

---

## 7. 定时任务配置说明

根据 `backend/celery.py` 的配置，系统会在：

- **每天凌晨0:00** 自动更新所有M-League数据：
  - 最新赛季排名
  - 当前赛季赛程（9-12月 + 次年1-5月）
  - 选手统计数据
  - 积分数据

**注意：** 不包括历史赛季数据，历史数据需要手动触发。

---

## 8. 手动触发更新

如果需要立即更新数据，可以手动触发：

```bash
# 更新所有数据
python manage.py update_mleague_data --type all

# 只更新排名
python manage.py update_mleague_data --type rankings

# 只更新赛程
python manage.py update_mleague_data --type schedule

# 更新当前赛季所有赛程
python manage.py update_mleague_data --type schedule
```

或使用API接口（需要管理员权限）：
```bash
curl -X POST http://your-server:8000/api/mleague-scraper/trigger/all/
```

---

## 9. 性能优化建议

1. **调整Worker并发数**：根据服务器CPU核心数调整 `--concurrency` 参数
2. **设置任务优先级**：重要任务可以设置更高的优先级
3. **监控资源使用**：定期检查CPU、内存、磁盘使用情况
4. **日志轮转**：配置日志轮转避免日志文件过大

---

## 10. 安全建议

1. **Redis密码**：生产环境建议设置Redis密码
2. **防火墙**：只开放必要的端口（6379仅本地访问）
3. **用户权限**：使用非root用户运行Celery服务
4. **定期备份**：定期备份数据库和Redis数据

---

完成以上步骤后，云服务器将自动在每天凌晨0:00更新M-League数据并存入数据库。
