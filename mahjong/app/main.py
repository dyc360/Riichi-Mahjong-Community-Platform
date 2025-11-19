from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⚠️ 数据库连接已跳过，使用模拟数据模式")

# 只注册不需要数据库的路由
from app.api.routes.news import router as news_router
from app.api.routes.community import router as community_router
from app.api.routes.practice import router as practice_router

app.include_router(news_router, prefix=f"{settings.API_V1_STR}/news", tags=["新闻"])
app.include_router(community_router, prefix=f"{settings.API_V1_STR}/community", tags=["社区"])
app.include_router(practice_router, prefix=f"{settings.API_V1_STR}/practice", tags=["练习"])

@app.get("/")
async def root():
    return {
        "message": "立直麻将AI平台API (模拟数据模式)",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "simulation_mode"}