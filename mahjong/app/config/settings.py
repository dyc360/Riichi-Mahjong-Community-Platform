from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # 项目配置
    PROJECT_NAME: str = "立直麻将AI平台"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # MySQL 数据库配置
    DB_HOST: str = "localhost"
    DB_PORT: str = "3306"
    DB_NAME: str = "mahjong_ai"
    DB_USER: str = "root"
    DB_PASSWORD: str = "your-mysql-password"

    # JWT配置
    SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # CORS配置
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        case_sensitive = True


settings = Settings()