from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.config.database import connect_to_mongo, close_mongo_connection
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.news import router as news_router
from app.api.routes.community import router as community_router
from app.api.routes.practice import router as practice_router
from app.api.routes.admin import router as admin_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 事件处理
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    print("✅ 数据库连接成功")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    print("❌ 数据库连接已关闭")

# 注册路由
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["认证"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["用户"])
app.include_router(news_router, prefix=f"{settings.API_V1_STR}/news", tags=["新闻"])
app.include_router(community_router, prefix=f"{settings.API_V1_STR}/community", tags=["社区"])
app.include_router(practice_router, prefix=f"{settings.API_V1_STR}/practice", tags=["练习"])
app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["管理"])

@app.get("/")
async def root():
    return {
        "message": "立直麻将AI平台API", 
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2023-11-15T10:00:00Z"}