# 快速配置指南 - M-League 爬虫环境

## 🚀 5 分钟快速配置（Windows 服务器）

### 步骤 1: 安装 Python 和依赖
```powershell
# 1. 确保 Python 3.9+ 已安装
python --version

# 2. 进入项目目录
cd D:\software_engineering\Riichi-Mahjong-Community-Platform\Backend

# 3. 创建并激活虚拟环境
python -m venv venv
venv\Scripts\activate

# 4. 安装依赖
pip install --upgrade pip
pip install -r requirements.txt
pip install selenium
```

### 步骤 2: 安装 Chrome 浏览器
1. 下载并安装 [Google Chrome](https://www.google.com/chrome/)
2. 验证安装：在浏览器中访问 `chrome://version/` 查看版本号

### 步骤 3: 配置 ChromeDriver

**方法 A：自动管理（推荐，但需要修改代码）**
```powershell
pip install webdriver-manager
```
然后修改 `mleague/scraper.py` 中的代码（见下方说明）

**方法 B：手动安装（不改代码）**
1. 查看 Chrome 版本（在 Chrome 中输入 `chrome://version/`）
2. 下载对应版本的 ChromeDriver：
   - 访问：https://googlechromelabs.github.io/chrome-for-testing/
   - 或：https://chromedriver.chromium.org/downloads
3. 解压 `chromedriver.exe` 到 `Backend` 目录
4. 或添加到系统 PATH 环境变量

### 步骤 4: 测试配置
```powershell
# 运行测试脚本
python test_scraper_setup.py

# 如果测试通过，启动 Django 服务器
python manage.py runserver

# 在另一个终端测试 API
curl http://localhost:8000/api/m-league/points/
```

---

## 🐧 快速配置（Linux 服务器）

### 步骤 1: 安装基础环境
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# 创建虚拟环境
cd /path/to/Backend
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt
pip install selenium
```

### 步骤 2: 安装 Chrome
```bash
# Ubuntu/Debian
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb -y

# 安装系统依赖（无头模式必需）
sudo apt install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
```

### 步骤 3: 配置 ChromeDriver
```bash
# 查看 Chrome 版本
google-chrome --version

# 下载 ChromeDriver（替换版本号）
CHROME_VERSION=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+\.\d+' | head -1)
# 手动下载对应版本，或使用 webdriver-manager
```

### 步骤 4: 测试
```bash
python3 test_scraper_setup.py
```

---

## 🔧 可选：使用 webdriver-manager（自动管理 ChromeDriver）

如果不想手动管理 ChromeDriver 版本，可以修改代码使用 `webdriver-manager`：

### 1. 安装 webdriver-manager
```bash
pip install webdriver-manager
```

### 2. 修改 `mleague/scraper.py` 中的 `fetch_points_data()` 函数

**找到这一行（约第 791 行）：**
```python
driver = webdriver.Chrome(options=chrome_options)
```

**替换为：**
```python
try:
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
except ImportError:
    # 如果 webdriver-manager 未安装，使用默认方式
    driver = webdriver.Chrome(options=chrome_options)
```

这样 ChromeDriver 会自动下载和匹配版本，无需手动管理。

---

## ✅ 验证清单

配置完成后，检查以下项目：

- [ ] Python 3.9+ 已安装
- [ ] 虚拟环境已创建并激活
- [ ] 所有依赖已安装（`pip list` 查看）
- [ ] Chrome/Chromium 浏览器已安装
- [ ] ChromeDriver 已配置（在 PATH 或项目目录）
- [ ] 网络可以访问 `https://m-league.jp/points`
- [ ] 测试脚本运行成功
- [ ] API 端点可以正常返回数据

---

## 🆘 常见问题快速解决

### ChromeDriver 找不到
- **Windows**: 将 `chromedriver.exe` 放到项目 `Backend` 目录
- **Linux**: `sudo mv chromedriver /usr/local/bin/ && sudo chmod +x /usr/local/bin/chromedriver`

### 无头模式启动失败（Linux）
```bash
sudo apt install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
```

### 网络连接失败
```bash
# 测试连接
curl -I https://m-league.jp/points

# 检查防火墙
# Windows: 检查 Windows Defender 防火墙
# Linux: sudo ufw status
```

---

## 📞 需要帮助？

1. 运行测试脚本查看详细错误：`python test_scraper_setup.py`
2. 查看完整配置文档：`SERVER_SETUP.md`
3. 检查 Django 日志文件

---

**配置完成后，运行 `python manage.py runserver` 启动服务器！** 🎉
