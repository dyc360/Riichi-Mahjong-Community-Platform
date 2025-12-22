# 服务器环境配置和网络访问详细步骤

本文档提供在服务器上配置 M-League 数据爬取环境的完整步骤。

## 📋 目录

1. [基础环境配置](#1-基础环境配置)
2. [Python 环境配置](#2-python-环境配置)
3. [项目依赖安装](#3-项目依赖安装)
4. [Selenium 和 ChromeDriver 配置](#4-selenium-和-chromedriver-配置)
5. [网络访问配置和测试](#5-网络访问配置和测试)
6. [验证配置](#6-验证配置)
7. [常见问题排查](#7-常见问题排查)

---

## 1. 基础环境配置

### 1.1 检查系统信息

**Windows 服务器：**
```powershell
# 查看系统信息
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
```

**Linux 服务器：**
```bash
# 查看系统信息
cat /etc/os-release
uname -a
```

### 1.2 更新系统包（Linux）

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y

# Fedora
sudo dnf update -y
```

---

## 2. Python 环境配置

### 2.1 安装 Python（如果未安装）

**Windows 服务器：**

1. 访问 [Python 官网](https://www.python.org/downloads/)
2. 下载 Python 3.9 或更高版本（推荐 3.10 或 3.11）
3. 安装时**务必勾选** "Add Python to PATH"
4. 验证安装：
```powershell
python --version
pip --version
```

**Linux 服务器：**

```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip python3-venv -y

# CentOS/RHEL
sudo yum install python3 python3-pip -y

# Fedora
sudo dnf install python3 python3-pip -y

# 验证安装
python3 --version
pip3 --version
```

### 2.2 创建虚拟环境（推荐）

**Windows：**
```powershell
# 进入项目后端目录
cd D:\software_engineering\Riichi-Mahjong-Community-Platform\Backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 验证（命令提示符前应显示 (venv)）
```

**Linux：**
```bash
# 进入项目后端目录
cd /path/to/Riichi-Mahjong-Community-Platform/Backend

# 创建虚拟环境
python3 -m venv majhub_env

# 激活虚拟环境
source majhub_env/bin/activate

# 验证（命令提示符前应显示 (venv)）
```

---

## 3. 项目依赖安装

### 3.1 安装基础依赖

**在激活的虚拟环境中执行：**

```bash
# 升级 pip
pip install --upgrade pip

# 安装项目依赖
pip install -r requirements.txt
```

### 3.2 安装 Selenium 和相关依赖

```bash
# 安装 Selenium
pip install selenium

# 安装 webdriver-manager（自动管理 ChromeDriver，推荐）
pip install webdriver-manager

# 安装其他可能需要的依赖
pip install beautifulsoup4 lxml requests
```

### 3.3 验证依赖安装

```bash
# 检查关键包是否安装成功
python -c "import django; print('Django:', django.get_version())"
python -c "import selenium; print('Selenium:', selenium.__version__)"
python -c "import bs4; print('BeautifulSoup4: OK')"
```

---

## 4. Selenium 和 ChromeDriver 配置

### 4.1 安装 Chrome/Chromium 浏览器

**Windows 服务器：**

1. 下载并安装 [Google Chrome](https://www.google.com/chrome/)
2. 或使用便携版 Chrome（无需安装）
3. 验证安装：
```powershell
# 查找 Chrome 安装路径（通常在）
# C:\Program Files\Google\Chrome\Application\chrome.exe
# 或
# C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
```

**Linux 服务器：**

```bash
# Ubuntu/Debian
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb -y

# CentOS/RHEL
sudo yum install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

# 或使用 Chromium（开源版本）
# Ubuntu/Debian
sudo apt install chromium-browser -y

# CentOS/RHEL
sudo yum install chromium -y

# 验证安装
google-chrome --version
# 或
chromium --version
```

### 4.2 配置 ChromeDriver（方法一：自动管理 - 推荐）

**使用 webdriver-manager（最简单，推荐）：**

修改 `scraper.py` 中的 `fetch_points_data()` 函数：

```python
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# 在函数中修改为：
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--window-size=1920,1080")

# 使用 webdriver-manager 自动下载和管理 ChromeDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
```

### 4.3 配置 ChromeDriver（方法二：手动安装）

**Windows 服务器：**

1. 查看 Chrome 版本：
```powershell
# 在 Chrome 地址栏输入
chrome://version/
# 记录 "Google Chrome" 后面的版本号（如：120.0.6099.109）
```

2. 下载对应版本的 ChromeDriver：
   - 访问 [ChromeDriver 下载页面](https://chromedriver.chromium.org/downloads)
   - 或使用 [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/)
   - 下载与 Chrome 版本匹配的 ChromeDriver

3. 解压并配置：
```powershell
# 解压 chromedriver.exe 到项目目录或系统 PATH
# 方法 A：放到项目目录
# 将 chromedriver.exe 放到 Backend 目录

# 方法 B：添加到系统 PATH
# 将 chromedriver.exe 放到 C:\Windows\System32 或添加到 PATH 环境变量
```

**Linux 服务器：**

1. 查看 Chrome 版本：
```bash
google-chrome --version
# 或
chromium --version
```

2. 下载 ChromeDriver：
```bash
# 创建下载目录
mkdir -p ~/chromedriver
cd ~/chromedriver

# 下载 ChromeDriver（替换版本号）
CHROME_VERSION=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+\.\d+' | head -1)
CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%.*.*}")

# 下载（如果上面的方法不行，手动下载）
wget https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip

# 解压
unzip chromedriver_linux64.zip

# 移动到系统路径并设置权限
sudo mv chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

# 验证
chromedriver --version
```

### 4.4 配置无头模式参数（服务器环境）

确保 `scraper.py` 中的 Chrome 选项包含以下参数（代码中已有）：

```python
chrome_options = Options()
chrome_options.add_argument("--headless")  # 无头模式（无图形界面）
chrome_options.add_argument("--no-sandbox")  # 禁用沙箱（服务器环境必需）
chrome_options.add_argument("--disable-dev-shm-usage")  # 解决共享内存问题
chrome_options.add_argument("--disable-gpu")  # 禁用 GPU（服务器通常没有）
chrome_options.add_argument("--window-size=1920,1080")  # 设置窗口大小
```

**Linux 服务器额外依赖：**

```bash
# 安装 Chrome/Chromium 运行所需的系统库
sudo apt install -y \
    libnss3 \
    libatk-bridge2.0-0t64 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2t64
```

---

## 5. 网络访问配置和测试

### 5.1 测试网络连接

**Windows：**
```powershell
# 测试目标网站是否可访问
Test-NetConnection -ComputerName m-league.jp -Port 443

# 或使用 curl（如果已安装）
curl -I https://m-league.jp/points
```

**Linux：**
```bash
# 测试 DNS 解析
nslookup m-league.jp

# 测试 HTTP 连接
curl -I https://m-league.jp/points

# 测试 HTTPS 连接
openssl s_client -connect m-league.jp:443 -showcerts
```

### 5.2 配置防火墙规则（如果需要）

**Windows 防火墙：**

```powershell
# 允许 Python 出站连接（如果需要）
New-NetFirewallRule -DisplayName "Python Outbound" -Direction Outbound -Program "C:\Python\python.exe" -Action Allow
```

**Linux 防火墙（iptables）：**

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow out 443/tcp
sudo ufw allow out 80/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

### 5.3 配置代理（如果需要）

如果服务器需要通过代理访问外网：

**设置环境变量：**

**Windows：**
```powershell
# 临时设置（当前会话）
$env:HTTP_PROXY = "http://proxy.example.com:8080"
$env:HTTPS_PROXY = "http://proxy.example.com:8080"

# 永久设置（系统环境变量）
[System.Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://proxy.example.com:8080", "Machine")
[System.Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://proxy.example.com:8080", "Machine")
```

**Linux：**
```bash
# 临时设置
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# 永久设置（添加到 ~/.bashrc 或 /etc/environment）
echo 'export HTTP_PROXY=http://proxy.example.com:8080' >> ~/.bashrc
echo 'export HTTPS_PROXY=http://proxy.example.com:8080' >> ~/.bashrc
source ~/.bashrc
```

**在代码中配置代理（Selenium）：**

如果需要，可以在 `scraper.py` 中添加代理配置：

```python
chrome_options.add_argument("--proxy-server=http://proxy.example.com:8080")
```

### 5.4 测试 DNS 解析

```bash
# Windows
nslookup m-league.jp

# Linux
dig m-league.jp
# 或
host m-league.jp
```

---

## 6. 验证配置

### 6.1 创建测试脚本

创建文件 `Backend/test_scraper_setup.py`：

```python
#!/usr/bin/env python
"""测试爬虫环境配置"""
import sys

def test_imports():
    """测试必要的包是否已安装"""
    print("=" * 50)
    print("测试 Python 包导入...")
    print("=" * 50)
    
    try:
        import django
        print(f"✅ Django: {django.get_version()}")
    except ImportError:
        print("❌ Django: 未安装")
        return False
    
    try:
        import selenium
        print(f"✅ Selenium: {selenium.__version__}")
    except ImportError:
        print("❌ Selenium: 未安装")
        return False
    
    try:
        from bs4 import BeautifulSoup
        print("✅ BeautifulSoup4: OK")
    except ImportError:
        print("❌ BeautifulSoup4: 未安装")
        return False
    
    try:
        import requests
        print(f"✅ Requests: {requests.__version__}")
    except ImportError:
        print("❌ Requests: 未安装")
        return False
    
    return True

def test_chrome_driver():
    """测试 ChromeDriver 是否可用"""
    print("\n" + "=" * 50)
    print("测试 ChromeDriver...")
    print("=" * 50)
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        
        print("正在启动 Chrome...")
        driver = webdriver.Chrome(options=chrome_options)
        print("✅ ChromeDriver: 启动成功")
        
        print("正在测试访问目标网站...")
        driver.get("https://m-league.jp/points")
        print(f"✅ 页面标题: {driver.title}")
        
        driver.quit()
        print("✅ ChromeDriver: 测试通过")
        return True
        
    except Exception as e:
        print(f"❌ ChromeDriver: 测试失败 - {str(e)}")
        return False

def test_network():
    """测试网络连接"""
    print("\n" + "=" * 50)
    print("测试网络连接...")
    print("=" * 50)
    
    try:
        import requests
        
        url = "https://m-league.jp/points"
        print(f"正在访问: {url}")
        
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code == 200:
            print(f"✅ 网络连接: 成功 (状态码: {response.status_code})")
            print(f"✅ 响应大小: {len(response.content)} 字节")
            return True
        else:
            print(f"❌ 网络连接: 失败 (状态码: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ 网络连接: 失败 - {str(e)}")
        return False

def main():
    """主测试函数"""
    print("\n" + "=" * 50)
    print("M-League 爬虫环境配置测试")
    print("=" * 50 + "\n")
    
    results = []
    
    # 测试包导入
    results.append(("包导入", test_imports()))
    
    # 测试网络
    results.append(("网络连接", test_network()))
    
    # 测试 ChromeDriver
    results.append(("ChromeDriver", test_chrome_driver()))
    
    # 总结
    print("\n" + "=" * 50)
    print("测试结果总结")
    print("=" * 50)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 所有测试通过！环境配置成功！")
        return 0
    else:
        print("\n⚠️  部分测试失败，请检查配置。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

### 6.2 运行测试脚本

```bash
# 在激活的虚拟环境中
cd Backend
python test_scraper_setup.py
```

### 6.3 测试 API 端点

**启动 Django 服务器：**

```bash
# 在激活的虚拟环境中
cd Backend
python manage.py runserver 0.0.0.0:8000
```

**测试 API（在另一个终端）：**

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/m-league/points/" -Method GET

# Linux/Windows Git Bash
curl http://localhost:8000/api/m-league/points/

# 或使用浏览器访问
# http://localhost:8000/api/m-league/points/
```

---

## 7. 常见问题排查

### 7.1 ChromeDriver 版本不匹配

**问题：** `SessionNotCreatedException: session not created: This version of ChromeDriver only supports Chrome version XX`

**解决方案：**
1. 使用 `webdriver-manager` 自动管理版本（推荐）
2. 或手动下载匹配的 ChromeDriver 版本

### 7.2 无头模式启动失败（Linux）

**问题：** `selenium.common.exceptions.WebDriverException: Message: unknown error: Chrome failed to start`

**解决方案：**
```bash
# 安装必要的系统库
sudo apt install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
```

### 7.3 网络连接超时

**问题：** `requests.exceptions.Timeout` 或 `ConnectionError`

**解决方案：**
1. 检查防火墙设置
2. 检查代理配置
3. 测试 DNS 解析
4. 检查服务器是否能访问外网

### 7.4 权限问题（Linux）

**问题：** `Permission denied` 或 `chromedriver: cannot execute binary file`

**解决方案：**
```bash
# 给 ChromeDriver 执行权限
chmod +x /usr/local/bin/chromedriver

# 检查文件权限
ls -l /usr/local/bin/chromedriver
```

### 7.5 共享内存不足（Linux）

**问题：** `DevToolsActivePort file doesn't exist`

**解决方案：**
```bash
# 增加共享内存大小
sudo mount -o remount,size=2G /dev/shm

# 或在代码中已添加 --disable-dev-shm-usage 参数
```

### 7.6 查看详细错误日志

**在 Django 中启用详细日志：**

在 `settings.py` 中添加：

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'scraper.log',
        },
    },
    'loggers': {
        'mleague': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
        },
    },
}
```

---

## 📝 快速检查清单

在服务器上配置完成后，使用以下清单验证：

- [ ] Python 3.9+ 已安装
- [ ] 虚拟环境已创建并激活
- [ ] 所有依赖包已安装（requirements.txt）
- [ ] Selenium 已安装
- [ ] Chrome/Chromium 浏览器已安装
- [ ] ChromeDriver 已配置（自动或手动）
- [ ] 网络连接测试通过
- [ ] 测试脚本运行成功
- [ ] API 端点可以正常访问
- [ ] 实际爬取测试成功

---

## 🔗 有用的链接

- [Selenium 官方文档](https://www.selenium.dev/documentation/)
- [ChromeDriver 下载](https://chromedriver.chromium.org/downloads)
- [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/)
- [webdriver-manager 文档](https://github.com/SergeyPirogov/webdriver_manager)

---

## 💡 提示

1. **生产环境建议：** 使用 `webdriver-manager` 自动管理 ChromeDriver，避免版本不匹配问题
2. **性能优化：** 在服务器上使用无头模式，减少资源消耗
3. **错误处理：** 确保代码中有完善的错误处理和日志记录
4. **定时任务：** 配置完成后，设置定时任务定期爬取数据

---

**配置完成后，可以开始使用爬虫功能了！** 🎉
