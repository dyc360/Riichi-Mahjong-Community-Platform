import os
import sys
from pathlib import Path
from datetime import timedelta
import datetime

# Add project paths to sys.path to ensure our local mahjong_utils is used
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR
MAHJONG_UTILS_PATH = BASE_DIR / 'mahjong_utils'

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(MAHJONG_UTILS_PATH) not in sys.path:
    sys.path.insert(0, str(MAHJONG_UTILS_PATH))

SECRET_KEY = 'django-insecure-your-secret-key-here'

DEBUG = True
APPEND_SLASH = False

ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'auth_api',
    'mahjong_api',
    'news_api',
    'mleague',  # M-League数据抓取模块
    'forum_api',  # 论坛模块
]

AUTH_USER_MODEL = 'auth_api.CustomUser'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'auth_api.middleware.JWTAuthentication',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# 使用 MySQL
# 请确保已安装 mysqlclient: pip install mysqlclient
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'mahjong_db',
        'USER': 'majhub_developer',
        'PASSWORD': 'Mahjong_123',
        'HOST': 'db',  # 数据库主机
        'PORT': '3306',         # 数据库端口
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
            'connect_timeout': 60,
            'read_timeout': 60,
            'write_timeout': 60,
        },
        'CONN_MAX_AGE': 60,
        'ATOMIC_REQUESTS': False,
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 6,
        }
    },
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React 默认端口
    "http://127.0.0.1:3000",
    "http://localhost:8080",  # Vue 默认端口
    "http://127.0.0.1:8080",
    "http://localhost:5173",  # Vite 默认端口
    "http://127.0.0.1:5173",
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

JWT_SECRET_KEY = 'your-jwt-secret-key-change-this-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = timedelta(days=7)

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# JWT 配置
JWT_SECRET_KEY = 'your-jwt-secret-key-change-this-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = datetime.timedelta(days=7)  # 使用 datetime.timedelta

# Mahjim Service Configuration
MAHJIM_SERVICE_URL = 'http://mahjim:8080'

# Celery配置
# 支持从环境变量读取，Docker环境中使用redis服务名，本地开发使用localhost
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'
CELERY_ENABLE_UTC = True

