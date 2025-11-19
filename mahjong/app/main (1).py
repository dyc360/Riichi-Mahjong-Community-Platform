from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.config.database import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, users, news, community, practice, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 事件处理
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# 注册路由
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["认证"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["用户"])
app.include_router(news.router, prefix=f"{settings.API_V1_STR}/news", tags=["新闻"])
app.include_router(community.router, prefix=f"{settings.API_V1_STR}/community", tags=["社区"])
app.include_router(practice.router, prefix=f"{settings.API_V1_STR}/practice", tags=["练习"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["管理"])

@app.get("/")
async def root():
    return {"message": "立直麻将AI平台API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}