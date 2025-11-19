from fastapi import APIRouter
from typing import List
from datetime import datetime

router = APIRouter()

# 模拟数据
MOCK_NEWS = [
    {
        "id": "1",
        "title": "立直麻将大赛2024即将开始",
        "content": "年度立直麻将大赛即将拉开帷幕...",
        "category": "competition",
        "author": "admin",
        "author_name": "管理员",
        "view_count": 150,
        "like_count": 25,
        "comment_count": 8,
        "created_at": "2024-01-15T10:00:00Z"
    },
    {
        "id": "2",
        "title": "麻将AI技术新突破",
        "content": "最新研究显示，麻将AI在牌效率分析方面取得重大进展...",
        "category": "game",
        "author": "ai_researcher",
        "author_name": "AI研究员",
        "view_count": 89,
        "like_count": 15,
        "comment_count": 3,
        "created_at": "2024-01-14T14:30:00Z"
    }
]

@router.get("/")
async def get_news_list():
    return MOCK_NEWS

@router.get("/{news_id}")
async def get_news_detail(news_id: str):
    for news in MOCK_NEWS:
        if news["id"] == news_id:
            return news
    return {"error": "新闻不存在"}