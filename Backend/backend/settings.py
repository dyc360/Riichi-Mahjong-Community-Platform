import os
import sys
from pathlib import Path
from datetime import timedelta
import datetime

BASE_DIR = Path(__file__).resolve().parent.parent

# 检测是否在运行测试
IS_TESTING = 'test' in sys.argv or 'pytest' in sys.argv[0]

# Controlled via environment to match production defaults
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'production').lower()
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

if ENVIRONMENT == 'production' and DEBUG and not IS_TESTING:
    raise RuntimeError("DJANGO_DEBUG must be False when DJANGO_ENV=production")


def get_env_list(var_name: str, default: str = ""):
    value = os.environ.get(var_name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


if DEBUG:
    SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key')
else:
    try:
        SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
    except KeyError as exc:
        raise RuntimeError("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is False") from exc

APPEND_SLASH = False

ALLOWED_HOSTS = get_env_list('DJANGO_ALLOWED_HOSTS', 'backend,localhost,127.0.0.1,120.53.120.90')
CORS_ALLOW_ALL_ORIGINS = DEBUG
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
    'drf_spectacular',
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

# 测试时使用 SQLite，避免连接远程 MySQL
if IS_TESTING:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
else:
    # 使用 MySQL
    # 请确保已安装 mysqlclient: pip install mysqlclient
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DB_NAME', 'mahjong_db'),
            'USER': os.environ.get('DB_USER', 'majhub_developer'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'Mahjong_123'),
            'HOST': os.environ.get('DB_HOST', 'db'),
            'PORT': os.environ.get('DB_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
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
        'auth_api.utils.JWTAuthentication',
    ],
    # 默认分页配置
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# 缓存配置 - 使用内存缓存（生产环境建议使用 Redis）
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,  # 默认缓存5分钟
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

CORS_ALLOWED_ORIGINS = get_env_list(
    'DJANGO_CORS_ALLOWED_ORIGINS',
    ','.join([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://120.53.120.90",
    ])
)

# CSRF 信任的源（用于跨域请求）
CSRF_TRUSTED_ORIGINS = get_env_list(
    'DJANGO_CSRF_TRUSTED_ORIGINS',
    ','.join([
        "https://120.53.120.90",
        "http://120.53.120.90",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])
)
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SECURE_SSL_REDIRECT = os.environ.get(
    'DJANGO_SECURE_SSL_REDIRECT',
    'true' if not DEBUG else 'false'
).lower() == 'true'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
SECURE_HSTS_SECONDS = int(os.environ.get(
    'DJANGO_SECURE_HSTS_SECONDS',
    '31536000' if not DEBUG else '0'
))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0 and not DEBUG
SECURE_HSTS_PRELOAD = SECURE_HSTS_INCLUDE_SUBDOMAINS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# JWT 配置
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = datetime.timedelta(days=7)  # 使用 datetime.timedelta

# Mahjim Service Configuration
MAHJIM_SERVICE_URL = os.environ.get('MAHJIM_SERVICE_URL', 'http://localhost:8081')

# Celery配置
# 支持从环境变量读取，Docker环境中使用redis服务名，本地开发使用localhost
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'
CELERY_ENABLE_UTC = True

