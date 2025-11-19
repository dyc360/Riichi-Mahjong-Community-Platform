from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId
from .user import PyObjectId

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

class NewsInDB(NewsBase):
    id: PyObjectId
    author: PyObjectId
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    is_published: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}

class NewsResponse(NewsBase):
    id: str
    author: str
    author_name: Optional[str] = None
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}