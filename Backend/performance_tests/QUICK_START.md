# 性能测试快速开始指南

## 5分钟快速开始

### 1. 安装依赖

```bash
cd Backend
pip install locust
```

### 2. 运行测试（最简单的方式）

#### 方式A：使用Web UI（推荐）

```bash
locust -f performance_tests/locustfile.py --host=https://120.53.120.90
```

然后在浏览器访问 `http://localhost:8089`，配置参数并开始测试。

#### 方式B：命令行运行

```bash
# Linux/Mac
./performance_tests/run_test.sh load

# Windows
performance_tests\run_test.bat load
```

### 3. 查看结果

测试完成后，查看生成的HTML报告：

```bash
# Linux/Mac
open performance_tests/results/test_report.html

# Windows
start performance_tests\results\test_report.html
```

## 完整测试流程

### 运行测试

```bash
# 使用脚本
./performance_tests/run_test.sh load

# 或直接运行
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 200 \
    --spawn-rate 5 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/test_report.html
```

## 常用命令速查

### 测试命令

```bash
# 负载测试（200用户，10分钟）
locust -f performance_tests/locustfile.py --host=https://120.53.120.90 --users 200 --spawn-rate 5 --run-time 10m --headless --html report.html

# 压力测试（500用户，20分钟）
locust -f performance_tests/locustfile.py --host=https://120.53.120.90 --users 500 --spawn-rate 10 --run-time 20m --headless --html report.html

# 稳定性测试（100用户，30分钟）
locust -f performance_tests/locustfile.py --host=https://120.53.120.90 --users 100 --spawn-rate 5 --run-time 30m --headless --html report.html
```

## 测试场景说明

| 场景 | 用户数 | 增长速率 | 持续时间 | 用途 |
|------|--------|----------|----------|------|
| 负载测试 | 200 | 5/秒 | 10分钟 | 验证正常负载下的表现 |
| 压力测试 | 500 | 10/秒 | 20分钟 | 找出性能瓶颈 |
| 稳定性测试 | 100 | 5/秒 | 30分钟 | 验证长时间运行稳定性 |
| 峰值测试 | 300 | 50/秒 | 5分钟 | 测试突发流量处理 |

## 结果文件说明

- `test_report.html` - Locust HTML测试报告
- `stats_*.csv` - 详细统计数据（CSV格式）

## 更多信息

- 详细文档：[README.md](README.md)
- 服务器运行指南：[SERVER_RUN_GUIDE.md](SERVER_RUN_GUIDE.md)
- Locust文档：https://docs.locust.io/
