# 雀魂新闻API架构部署指南

## 架构概述

已成功实现类似M-League的定时新闻抓取架构：
- 服务器定时抓取雀魂官网新闻并存储到数据库
- API接口从数据库读取缓存数据，提高响应速度
- 支持分类筛选和搜索功能

## 已实现组件

### 1. 数据模型 (`news_api/models.py`)
- `MajSoulNews` 模型：存储抓取的新闻数据
- 包含索引优化查询性能

### 2. 定时任务 (`news_api/tasks.py`)
- `celery_update_majsoul_news`：Celery异步任务
- `update_majsoul_news_from_scraper`：核心更新函数

### 3. 管理命令 (`news_api/management/commands/update_majsoul_news.py`)
- 手动触发新闻更新的命令行工具

### 4. API接口 (`news_api/views.py`)
- `MajsoulNewsView`：从数据库读取新闻数据
- 支持分页、筛选和搜索

### 5. 序列化器 (`news_api/serializers.py`)
- `MajSoulNewsSerializer`：数据序列化

### 6. 爬虫 (`news_api/scraper.py`)
- `MajSoulNewsScraper`：基于Selenium的网页爬虫
- 处理动态JavaScript内容

### 7. URL配置 (`news_api/urls.py`)
- `/api/news/majsoul/`：新闻API端点

### 8. 定时任务配置 (`backend/celery.py`)
- 每4小时自动更新新闻数据

## 部署步骤

### 1. 数据库迁移
```bash
cd Backend
python manage.py migrate news_api
```

### 2. 启动Celery Worker
```bash
# 使用Docker Compose（推荐）
docker-compose up -d celery-worker

# 或直接启动
celery -A backend worker --loglevel=info --concurrency=4
```

### 3. 启动Celery Beat调度器
```bash
# 使用Docker Compose（推荐）
docker-compose up -d celery-beat

# 或直接启动
celery -A backend beat --loglevel=info
```

### 4. 测试新闻更新
```bash
# 手动触发更新
python manage.py update_majsoul_news --limit=10

# 检查数据
python manage.py shell -c "from news_api.models import MajSoulNews; print(f'共 {MajSoulNews.objects.count()} 条新闻')"
```

### 5. 验证API接口
```bash
# 获取所有新闻
curl http://localhost:8000/api/news/majsoul/

# 按分类筛选
curl "http://localhost:8000/api/news/majsoul/?category=maintenance"

# 搜索新闻
curl "http://localhost:8000/api/news/majsoul/?search=maintenance"
```

## 架构优势

1. **性能优化**：API直接从数据库读取，避免实时爬取的延迟
2. **可靠性**：即使官网暂时无法访问，仍可提供缓存数据
3. **可扩展性**：支持多个新闻源和复杂的筛选逻辑
4. **维护性**：模块化设计，易于维护和扩展

## 监控和维护

### 查看Celery任务状态
```bash
# 检查worker状态
celery -A backend inspect active

# 查看定时任务
celery -A backend inspect scheduled
```

### 日志监控
- Celery日志：检查 `/var/log/celery/` 目录
- Django日志：检查应用日志文件
- 数据库：监控新闻数据更新频率

### 故障排除
1. 如果爬虫失败，检查Selenium和ChromeDriver版本
2. 如果数据库连接失败，检查MySQL服务状态
3. 如果Redis连接失败，检查Redis服务状态

## 扩展建议

1. **添加更多新闻源**：扩展爬虫支持其他麻将相关网站
2. **缓存优化**：添加Redis缓存层进一步提升性能
3. **监控告警**：添加新闻更新失败的告警机制
4. **数据清理**：定期清理过期新闻数据

---

✅ **架构实现完成** - 雀魂新闻API现已完全可用！