from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class NewsBase(BaseModel):
    title: str
    content: str
    category: str = "latest"  # latest, competition, game, other
    cover_image: Optional[str] = None
    tags: List[str] = []

class NewsCreate(NewsBase):
    pass

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None

class NewsResponse(NewsBase):
    id: str
    author: str
    author_name: Optional[str] = None
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime