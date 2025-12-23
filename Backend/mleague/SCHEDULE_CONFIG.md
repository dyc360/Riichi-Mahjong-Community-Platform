# M-League 数据自动更新配置说明

## 当前更新频率

根据 `Backend/backend/celery.py` 中的配置，M-League数据的自动更新频率如下：

### 每日更新（每天凌晨0:00）

- **所有当前数据** - 每天凌晨0:00
  - 任务：`celery_update_all_current`
  - 更新内容：
    - 最新赛季的排名数据
    - 当前赛季的所有赛程数据（9-12月 + 次年1-5月）
    - 所有队伍的选手统计数据
    - 所有类型的积分数据
  - **注意**：不包括历史赛季的赛程数据

## 相关代码位置

### 1. Celery配置文件
- **文件路径**：`Backend/backend/celery.py`
- **说明**：定义了所有定时任务的调度配置

### 2. 任务函数定义
- **文件路径**：`Backend/mleague/tasks.py`
- **主要函数**：
  - `update_rankings_from_scraper()` - 更新排名数据
  - `update_current_season_schedule()` - 更新当前赛季赛程
  - `update_player_stats_from_scraper()` - 更新选手统计
  - `update_points_data_from_scraper()` - 更新积分数据
  - `update_all_mleague_data()` - 更新所有数据

### 3. Celery任务装饰器
- **文件路径**：`Backend/mleague/tasks.py` (第324-357行)
- **说明**：使用 `@shared_task` 装饰器定义的Celery任务

## 启动定时任务

### 前提条件

1. 安装Redis（Celery的消息代理）：
   ```bash
   # Windows (使用WSL或Docker)
   # 或使用Redis for Windows
   ```

2. 安装依赖：
   ```bash
   pip install celery redis
   ```

### 启动步骤

1. **启动Redis服务器**（如果还没有运行）：
   ```bash
   redis-server
   ```

2. **启动Celery Worker**（处理任务）：
   ```bash
   cd Backend
   celery -A backend worker --loglevel=info
   ```

3. **启动Celery Beat**（定时任务调度器）：
   ```bash
   cd Backend
   celery -A backend beat --loglevel=info
   ```

### 使用Docker Compose（推荐）

已创建 `docker-compose.yml` 文件来同时运行Redis、Celery Worker和Celery Beat。

#### 启动服务

```bash
cd Backend
docker-compose up -d
```

#### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f celery-worker
docker-compose logs -f celery-beat
docker-compose logs -f redis
```

#### 停止服务

```bash
docker-compose down
```

#### 停止并删除数据卷

```bash
docker-compose down -v
```

#### 重新构建镜像

```bash
docker-compose build --no-cache
docker-compose up -d
```

## 手动触发更新

如果不想使用定时任务，也可以手动触发：

### 1. 使用管理命令
```bash
# 更新所有数据
python manage.py update_mleague_data --type all

# 只更新排名
python manage.py update_mleague_data --type rankings

# 只更新赛程
python manage.py update_mleague_data --type schedule
```

### 2. 使用API接口（需要管理员权限）
```bash
# 更新所有数据
POST http://localhost:8000/api/mleague-scraper/trigger/all/

# 更新排名
POST http://localhost:8000/api/mleague-scraper/trigger/rankings/

# 更新当前赛季赛程
POST http://localhost:8000/api/mleague-scraper/trigger/schedule/
Body: { "current_season": true }
```

## 注意事项

1. **如果没有配置Celery定时任务**，数据不会自动更新，需要手动触发
2. **Redis是必需的**，Celery需要Redis作为消息代理
3. **时区设置**：所有定时任务使用 `Asia/Shanghai` 时区
4. **历史赛季数据**：只在每周日凌晨的完整更新中包含，平时不更新历史数据

## 检查定时任务状态

```bash
# 查看Celery Worker状态
celery -A backend inspect active

# 查看已注册的任务
celery -A backend inspect registered
```
