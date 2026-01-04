# 性能测试指南

本目录包含麻将社区平台的性能测试工具。

## 目录结构

```
performance_tests/
├── locustfile.py              # Locust主测试文件
├── config/
│   └── test_scenarios.json   # 测试场景配置
├── results/                   # 测试结果存储（自动创建）
├── run_test.sh               # Linux测试运行脚本
├── run_test.bat              # Windows测试运行脚本
└── README.md                 # 本文档
```

## 安装依赖

首先安装性能测试所需的依赖：

```bash
cd Backend
pip install -r requirements.txt
```

确保以下包已安装：
- `locust>=2.17.0`

## 快速开始

### 1. 准备测试环境

确保：
- Django服务器正在运行
- 数据库已配置并可以访问

### 2. 运行性能测试

#### 方式一：使用Locust Web UI（推荐）

```bash
# 在Backend目录下
locust -f performance_tests/locustfile.py --host=https://120.53.120.90
```

然后在浏览器中访问 `http://localhost:8089`，配置测试参数并开始测试。

#### 方式二：命令行运行

```bash
# 负载测试：200用户，每秒增加5个用户，运行10分钟
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 200 \
    --spawn-rate 5 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/locust_report.html \
    --csv performance_tests/results/stats
```

#### 方式三：使用脚本运行

**Linux/Mac:**

```bash
chmod +x performance_tests/run_test.sh
./performance_tests/run_test.sh load https://120.53.120.90
```

**Windows:**

```bash
performance_tests\run_test.bat load https://120.53.120.90
```

## 测试场景

### 场景1: 负载测试

**目标**: 验证系统在正常负载下的表现

```bash
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 100 \
    --spawn-rate 5 \
    --run-time 5m \
    --headless \
    --html performance_tests/results/load_test.html
```

### 场景2: 压力测试

**目标**: 找出系统性能瓶颈和极限

```bash
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 500 \
    --spawn-rate 10 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/stress_test.html
```

## 在服务器上运行

### 准备工作

1. **SSH连接到服务器**

```bash
ssh user@120.53.120.90
```

2. **进入项目目录**

```bash
cd /path/to/Riichi-Mahjong-Community-Platform/Backend
```

3. **激活虚拟环境**

```bash
source venv/bin/activate  # Linux
# 或
venv\Scripts\activate  # Windows
```

4. **安装依赖**

```bash
pip install locust
```

### 运行测试

#### 方式一：在服务器上直接运行（适合无头模式）

```bash
# 运行负载测试
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 200 \
    --spawn-rate 5 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/test_report.html \
    --csv performance_tests/results/stats
```

#### 方式二：在本地运行，测试远程服务器（推荐）

在本地机器上运行Locust，测试远程服务器：

```bash
# 在本地机器上
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90
```

然后访问 `http://localhost:8089` 配置测试参数。

#### 方式三：分布式运行（适合大规模测试）

**主节点（Master）**:

```bash
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --master \
    --expect-workers 2
```

**工作节点（Worker）**:

```bash
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --worker \
    --master-host=<master-ip>
```

## 查看测试结果

测试完成后，Locust会生成以下文件：

- `test_report.html` - HTML格式的测试报告（可在浏览器中打开）
- `stats_*.csv` - 详细统计数据（CSV格式）

### 查看HTML报告

```bash
# Linux/Mac
firefox performance_tests/results/test_report.html

# Windows
start performance_tests\results\test_report.html
```

## 测试指标说明

### 应用层指标
- **请求响应时间**: P50, P95, P99分位数
- **请求成功率**: 成功请求数 / 总请求数
- **每秒请求数（RPS）**: 系统处理能力
- **错误率**: 失败请求数 / 总请求数

## 性能优化建议

根据测试结果，可以考虑以下优化：

1. **数据库优化**
   - 添加索引
   - 优化慢查询
   - 使用连接池
   - 启用查询缓存

2. **应用优化**
   - 增加Gunicorn workers
   - 启用响应缓存
   - 优化序列化
   - 使用CDN

3. **系统优化**
   - 增加服务器资源
   - 使用负载均衡
   - 优化网络配置

## 常见问题

### 1. Locust连接失败

**问题**: 无法连接到目标服务器

**解决**:
- 检查服务器地址和端口是否正确
- 检查防火墙设置
- 确认服务器正在运行

### 2. 测试结果不准确

**问题**: 测试结果与预期不符

**解决**:
- 确保在测试环境运行，避免影响生产环境
- 检查网络延迟
- 确保测试数据充足
- 多次运行测试取平均值

### 3. 登录失败

**问题**: 所有登录请求失败

**解决**:
- 检查测试账号 `YJY1111` 是否存在
- 确认密码是否正确
- 检查登录API的请求格式

## 参考资源

- [Locust官方文档](https://docs.locust.io/)
- [Django性能优化指南](https://docs.djangoproject.com/en/stable/topics/performance/)

## 联系支持

如有问题，请联系开发团队或查看项目文档。
