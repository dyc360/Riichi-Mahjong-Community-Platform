# Docker Compose 设置说明

## 当前问题

由于镜像加速器限流（429 Too Many Requests），Python镜像暂时无法拉取。

## 解决方案

### 方案1：只使用Docker运行Redis（推荐，临时方案）

如果Python镜像拉取失败，可以只使用Docker运行Redis，Celery在本地运行：

```bash
# 1. 只启动Redis
docker-compose up -d redis

# 2. 在本地启动Celery Worker（新终端窗口）
cd Backend
celery -A backend worker --loglevel=info --concurrency=4

# 3. 在本地启动Celery Beat（新终端窗口）
cd Backend
celery -A backend beat --loglevel=info
```

### 方案2：更换镜像加速器

1. 打开Docker Desktop
2. 进入 Settings > Docker Engine
3. 修改或添加镜像加速器配置：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

4. 点击 "Apply & Restart"
5. 等待几分钟后重试拉取镜像

### 方案3：暂时禁用镜像加速器

如果镜像加速器持续有问题，可以暂时禁用：

1. 打开Docker Desktop
2. 进入 Settings > Docker Engine
3. 删除或注释掉 `registry-mirrors` 配置
4. 点击 "Apply & Restart"
5. 直接使用Docker Hub（可能较慢）

### 方案4：等待后重试

镜像加速器的限流通常是暂时的，可以等待10-30分钟后重试：

```bash
# 等待后重试拉取Python镜像
docker pull python:3.11-slim

# 如果成功，启动所有服务
docker-compose up -d
```

## 验证服务状态

### 检查Redis

```bash
# 检查Redis容器状态
docker ps | findstr redis

# 测试Redis连接
docker exec mleague-redis redis-cli ping
# 应该返回: PONG
```

### 检查Celery（本地运行）

```bash
# 检查Celery Worker
celery -A backend inspect active

# 检查Celery Beat
celery -A backend inspect scheduled
```

## 完整启动所有服务（当镜像问题解决后）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f celery-worker
docker-compose logs -f celery-beat
docker-compose logs -f redis

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```
