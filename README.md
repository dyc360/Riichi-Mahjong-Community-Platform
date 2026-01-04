# MajHub - Riichi Mahjong Community Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![Django](https://img.shields.io/badge/django-4.2-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)

**MajHub** 是一个集日麻技术研讨、牌理练习、赛事数据追踪于一体的综合性立直麻将社区平台。项目采用现代化的前后端分离架构，融合了高性能算法与实时数据抓取技术，旨在为麻将爱好者提供专业的辅助工具与交流空间。

---

## 核心功能 (Key Features)

### 麻将辅助工具
- **何切练习 (Naze Naze)**: 随机生成复杂牌型，基于算法计算最佳切牌效率（进张数、改良等），帮助玩家提升牌理水平。
- **点数计算练习**: 提供多种和牌场景，训练玩家快速准确计算符数与番数。
- **牌谱生成器**: 支持普通手牌、七对子、国士无双等多种牌型的加权随机生成。

### M-League 赛事中心
- **实时数据追踪**: 自动抓取 M-League 官网最新赛程、队伍排名及选手个人数据。
- **可视化图表**: 多维度展示选手数据（副露率、立直率、和牌率等）。
- **高性能架构**: 采用 "异步预爬取 + 数据库缓存" 策略，确保毫秒级的数据查询响应。

### 社区互动
- **论坛系统**: 支持 Markdown 发帖、评论与标签分类。
- **新闻资讯**: 聚合麻将界最新动态。

---

## 技术架构 (Tech Stack)

### Backend (后端)
- **Framework**: Django REST Framework (Python)
- **Task Queue**: Celery + Redis (用于爬虫任务与异步计算)
- **Database**: PostgreSQL / SQLite
- **Core Algorithms**:
  - **Python**: 负责复杂的业务逻辑与规则判定 (`mahjong` 库)。
  - **C++ Extension**: 核心向听数计算 (`shanten`) 采用 C++ 编写并封装为 Python 扩展，实现 O(1) 查表法，性能极致优化。

### Frontend (前端)
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Hooks

### Infrastructure (基础设施)
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Scraper**: Selenium (Headless Chrome)

---

## 快速开始 (Getting Started)

### 前置要求
- Docker & Docker Compose
- (可选) Node.js 18+ & Python 3.9+

### 方式一：使用 Docker Compose (推荐)

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/MajHub.git
cd MajHub

# 2. 启动服务
docker-compose up -d --build

# 3. 访问应用
# 前端: http://localhost:5173
# 后端 API: http://localhost:8000
```

### 方式二：手动部署

#### 后端设置
```bash
cd Backend

# 安装依赖
pip install -r requirements.txt

# 编译 C++ 扩展 (如果需要)
# cd mahjong_utils/shanten && python setup.py build_ext --inplace

# 迁移数据库
python manage.py migrate

# 启动 Celery Worker (Windows)
celery -A backend worker -l info -P eventlet

# 启动 Django 开发服务器
python manage.py runserver
```

#### 前端设置
```bash
cd Frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 核心难点与解决方案

### 1. 高性能向听数计算
为了解决 Python 回溯算法在处理复杂牌型时的性能瓶颈，我们引入了 **C++ 扩展模块**。通过预计算生成二进制索引表 (`index_s.bin`, `index_h.bin`)，将向听数计算转化为 O(1) 的查表操作，相比纯 Python 实现性能提升数千倍，完美支持 AI 训练与大规模模拟。

### 2. M-League 数据实时性
针对 M-League 官网的动态渲染特性，我们设计了 **Selenium 异步爬虫架构**。
- **预爬取**: Celery 定时任务后台运行 Headless Chrome 抓取数据。
- **缓存**: 清洗后的结构化数据存储于本地数据库。
- **零延迟**: API 直接读取数据库，避免了用户请求时的实时爬取等待。

---

## 贡献 (Contributing)

欢迎提交 Pull Request 或 Issue！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 许可证 (License)

本项目采用 [MIT License](LICENSE) 许可证。