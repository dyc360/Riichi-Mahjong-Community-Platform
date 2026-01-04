# 服务器性能测试运行指南

本文档详细说明如何在服务器上运行性能测试。

## 目录

1. [准备工作](#准备工作)
2. [安装依赖](#安装依赖)
3. [运行测试](#运行测试)
4. [查看结果](#查看结果)
5. [常见问题](#常见问题)

## 准备工作

### 1. SSH连接到服务器

```bash
ssh user@120.53.120.90
```

### 2. 进入项目目录

```bash
cd /path/to/Riichi-Mahjong-Community-Platform/Backend
```

### 3. 激活虚拟环境

```bash
# Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 4. 确认服务器状态

确保以下服务正在运行：
- Django应用服务器（Gunicorn）
- MySQL数据库

## 安装依赖

### 安装性能测试依赖

```bash
pip install locust
```

或者安装所有依赖：

```bash
pip install -r requirements.txt
```

### 验证安装

```bash
locust --version
```

## 运行测试

### 方式一：使用Web UI（推荐用于交互式测试）

#### 在服务器上运行（需要端口转发）

```bash
# 在服务器上运行
locust -f performance_tests/locustfile.py --host=https://120.53.120.90

# 在本地机器上设置SSH端口转发
ssh -L 8089:localhost:8089 user@120.53.120.90

# 然后在浏览器访问 http://localhost:8089
```

#### 在本地运行（测试远程服务器）

```bash
# 在本地机器上运行
locust -f performance_tests/locustfile.py --host=https://120.53.120.90

# 访问 http://localhost:8089
```

### 方式二：命令行无头模式（推荐用于自动化测试）

#### Linux服务器

```bash
# 使用脚本运行
chmod +x performance_tests/run_test.sh
./performance_tests/run_test.sh load https://120.53.120.90

# 或直接运行
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 200 \
    --spawn-rate 5 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/test_report.html \
    --csv performance_tests/results/stats
```

#### Windows服务器

```bash
# 使用批处理文件
performance_tests\run_test.bat load https://120.53.120.90

# 或直接运行
locust -f performance_tests\locustfile.py --host=https://120.53.120.90 --users 200 --spawn-rate 5 --run-time 10m --headless --html performance_tests\results\test_report.html --csv performance_tests\results\stats
```

### 测试场景

#### 1. 负载测试（Load Test）

```bash
./performance_tests/run_test.sh load
# 或
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 200 \
    --spawn-rate 5 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/load_test.html
```

#### 2. 压力测试（Stress Test）

```bash
./performance_tests/run_test.sh stress
# 或
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 500 \
    --spawn-rate 10 \
    --run-time 20m \
    --headless \
    --html performance_tests/results/stress_test.html
```

#### 3. 稳定性测试（Stability Test）

```bash
./performance_tests/run_test.sh stability
# 或
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 100 \
    --spawn-rate 5 \
    --run-time 30m \
    --headless \
    --html performance_tests/results/stability_test.html
```

#### 4. 峰值测试（Spike Test）

```bash
./performance_tests/run_test.sh spike
# 或
locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 300 \
    --spawn-rate 50 \
    --run-time 5m \
    --headless \
    --html performance_tests/results/spike_test.html
```

## 查看结果

### 查看测试报告

Locust会生成HTML格式的测试报告：

```bash
# Linux
firefox performance_tests/results/test_report.html

# Windows
start performance_tests\results\test_report.html
```

### 查看CSV数据

测试数据保存在CSV文件中：

```bash
# 查看统计数据
cat performance_tests/results/stats_*.csv
```

## 完整测试流程示例

### 示例1：完整的负载测试流程

```bash
# 1. 运行负载测试
./performance_tests/run_test.sh load https://120.53.120.90

# 2. 等待测试完成（10分钟）

# 3. 查看报告
firefox performance_tests/results/test_report.html
```

### 示例2：在后台运行测试

```bash
# 运行测试（后台）
nohup locust -f performance_tests/locustfile.py \
    --host=https://120.53.120.90 \
    --users 200 \
    --spawn-rate 5 \
    --run-time 10m \
    --headless \
    --html performance_tests/results/test_report.html \
    --csv performance_tests/results/stats \
    > performance_tests/results/locust.log 2>&1 &

# 查看进程
ps aux | grep locust

# 查看日志
tail -f performance_tests/results/locust.log
```

## 常见问题

### 1. Locust无法连接到服务器

**问题**: `Connection refused` 或 `Timeout`

**解决方案**:
- 检查服务器地址和端口是否正确
- 确认服务器正在运行：`curl https://120.53.120.90/health/`
- 检查防火墙设置
- 确认网络连接正常

### 2. 测试结果不准确

**问题**: 测试结果与预期不符

**解决方案**:
- 确保在测试环境运行，避免影响生产环境
- 检查网络延迟：`ping 120.53.120.90`
- 确保测试数据充足
- 多次运行测试取平均值
- 检查服务器资源使用情况

### 3. 权限问题

**问题**: `Permission denied`

**解决方案**:
```bash
# Linux: 添加执行权限
chmod +x performance_tests/run_test.sh

# 或直接使用locust命令
locust -f performance_tests/locustfile.py --host=https://120.53.120.90
```

### 4. 端口被占用

**问题**: `Address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :8089  # Linux
netstat -ano | findstr :8089  # Windows

# 杀死进程
kill -9 <PID>  # Linux
taskkill /PID <PID> /F  # Windows
```

### 5. 登录失败

**问题**: 所有登录请求失败

**解决方案**:
- 检查测试账号 `YJY1111` 是否存在
- 确认密码是否正确
- 检查登录API的请求格式

## 性能优化建议

根据测试结果，可以考虑以下优化：

1. **增加Gunicorn workers**
   ```bash
   gunicorn backend.wsgi:application --workers 4 --bind 0.0.0.0:8000
   ```

2. **启用数据库连接池**
   - 在settings.py中配置数据库连接池

3. **使用Redis缓存**
   - 启用Django缓存框架
   - 缓存频繁访问的数据

4. **优化数据库查询**
   - 添加索引
   - 使用select_related和prefetch_related
   - 启用查询日志分析慢查询

5. **CDN和静态文件**
   - 使用CDN加速静态文件
   - 启用Gzip压缩

## 联系支持

如有问题，请查看：
- [性能测试README](README.md)
- [Locust官方文档](https://docs.locust.io/)
- 项目文档
