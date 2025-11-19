from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user_models import News
from app.models.news import NewsCreate, NewsResponse


class NewsService:
    def __init__(self, db: Session):
        self.db = db

    async def create_news(self, news_data: NewsCreate, author_id: str) -> News:
        news = News(
            title=news_data.title,
            content=news_data.content,
            category=news_data.category,
            cover_image=news_data.cover_image,
            tags=",".join(news_data.tags) if news_data.tags else "",
            author_id=author_id
        )
        self.db.add(news)
        self.db.commit()
        self.db.refresh(news)
        return news

    async def get_news_list(self, skip: int = 0, limit: int = 10) -> List[News]:
        return self.db.query(News).filter(News.is_published == True) \
            .offset(skip).limit(limit).all()

    async def get_news_by_id(self, news_id: str) -> Optional[News]:
        return self.db.query(News).filter(News.id == news_id).first()

    async def increment_view_count(self, news_id: str):
        news = self.db.query(News).filter(News.id == news_id).first()
        if news:
            news.view_count += 1
            self.db.commit()


def get_news_service(db: Session) -> NewsService:
    return NewsService(db)