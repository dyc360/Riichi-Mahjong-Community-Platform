# M-League 数据抓取模块

这个模块用于从网络（如M-League官网）实时抓取数据并应用到项目中。

## 功能特性

- ✅ 支持多种数据源（官网爬虫、第三方API、RSS Feed）
- ✅ 自动更新排名数据
- ✅ 支持定时任务（Celery或Django定时任务）
- ✅ 错误处理和重试机制
- ✅ RESTful API接口

## 安装依赖

```bash
pip install beautifulsoup4 lxml feedparser
# 可选：如果需要使用Celery
pip install celery redis
```

## 使用方法

### 1. 配置数据源

根据实际情况修改 `scraper.py` 中的数据源配置：

#### 方式A：从官网抓取（需要分析网页结构）

```python
# 在 scraper.py 中修改 MLeagueOfficialScraper
class MLeagueOfficialScraper(MLeagueScraper):
    def __init__(self):
        super().__init__(base_url="https://m-league.jp")  # 替换为实际官网URL
    
    def fetch_rankings(self, season: str = None):
        # 根据实际网页HTML结构调整解析逻辑
        # 使用浏览器开发者工具分析网页结构
        ...
```

#### 方式B：使用第三方API

```python
# 在 scraper.py 中配置API
scraper = create_scraper(
    scraper_type='api',
    api_key='your-api-key',
    api_base_url='https://api.example.com/mleague'
)
```

### 2. 手动触发数据抓取

#### 通过API接口

```bash
# 测试抓取器（公开接口）
curl http://localhost:8000/api/mleague-scraper/test/?scraper_type=official&season=2023赛季

# 手动触发排名更新（需要管理员权限）
curl -X POST http://localhost:8000/api/mleague-scraper/trigger/rankings/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"season": "2023赛季", "scraper_type": "official"}'
```

#### 通过Django管理命令

```python
# 在Django shell中
from mleague.tasks import update_rankings_from_scraper
update_rankings_from_scraper(season='2023赛季', scraper_type='official')
```

### 3. 设置定时任务

#### 方式A：使用Celery（推荐）

1. 安装Redis：
```bash
# Windows (使用WSL或Docker)
# 或使用Docker
docker run -d -p 6379:6379 redis
```

2. 配置Celery（创建 `Backend/backend/celery.py`）：
```python
from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

3. 在 `settings.py` 中添加：
```python
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
```

4. 启动Celery Worker：
```bash
celery -A backend worker --loglevel=info
```

5. 设置定时任务（在 `settings.py` 或 `celery.py`）：
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'update-mleague-rankings': {
        'task': 'mleague.tasks.celery_update_rankings',
        'schedule': crontab(hour='*/6'),  # 每6小时更新一次
    },
}
```

#### 方式B：使用Django的定时任务（django-crontab）

1. 安装：
```bash
pip install django-crontab
```

2. 在 `settings.py` 中添加：
```python
INSTALLED_APPS = [
    ...
    'django_crontab',
]

CRONJOBS = [
    ('0 */6 * * *', 'mleague.tasks.update_rankings_from_scraper'),
]
```

3. 启动定时任务：
```bash
python manage.py crontab add
```

### 4. 前端调用

前端可以通过现有的排名API获取数据：

```typescript
// 前端代码
const response = await fetch('http://localhost:8000/api/news_api/m-league/rankings/?season=2023赛季');
const data = await response.json();
// data.data 包含排名列表
```

## 实现步骤

### 步骤1：分析目标网站结构

1. 打开M-League官网（或目标数据源）
2. 使用浏览器开发者工具（F12）分析网页结构
3. 找到排名/赛程数据的HTML元素
4. 记录CSS选择器或XPath路径

### 步骤2：实现抓取逻辑

在 `MLeagueOfficialScraper` 类中实现：

```python
def fetch_rankings(self, season: str = None):
    url = f"{self.base_url}/rankings"
    response = self._make_request(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # 根据实际HTML结构调整
    rankings = []
    # 解析逻辑...
    
    return rankings
```

### 步骤3：测试抓取器

```bash
# 测试接口
curl http://localhost:8000/api/mleague-scraper/test/?scraper_type=official
```

### 步骤4：设置自动更新

选择上述定时任务方式之一，设置自动抓取。

## 注意事项

### ⚠️ 法律和道德考虑

1. **遵守robots.txt**：检查目标网站的 `robots.txt` 文件
2. **尊重服务条款**：确保不违反网站使用条款
3. **请求频率**：不要过于频繁地请求，避免对服务器造成压力
4. **User-Agent**：使用合理的User-Agent标识

### ⚠️ 技术挑战

1. **反爬虫机制**：某些网站可能有反爬虫措施（验证码、IP限制等）
2. **网页结构变化**：网站改版可能导致抓取失败，需要定期维护
3. **数据格式**：不同数据源格式可能不同，需要适配

### 💡 建议

1. **使用代理池**：如果遇到IP限制，考虑使用代理
2. **缓存机制**：避免重复请求相同数据
3. **错误监控**：设置日志和告警，及时发现抓取失败
4. **备用方案**：准备多个数据源，一个失败时切换到另一个

## 扩展功能

### 添加新的数据源

1. 创建新的Scraper类继承 `MLeagueScraper`
2. 实现 `fetch_rankings`、`fetch_schedule` 等方法
3. 在 `create_scraper` 函数中添加新类型

### 添加更多数据类型

- 选手统计数据
- 比赛详情
- 新闻资讯
- 视频链接

## 故障排查

### 抓取失败

1. 检查网络连接
2. 查看日志文件
3. 验证目标URL是否可访问
4. 检查HTML结构是否变化

### 数据不准确

1. 验证解析逻辑
2. 检查数据源是否更新
3. 对比原始网页数据

## 示例：完整的抓取器实现

参考 `scraper.py` 中的示例代码，根据实际网站结构调整选择器和解析逻辑。

