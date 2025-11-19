from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId
from .user import PyObjectId

class PostBase(BaseModel):
    title: str
    content: str
    category: str = "other-discussion"  # cut-discussion, competition-discussion, other-discussion
    images: List[str] = []
    tiles: List[str] = []  # 麻将牌序列

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    tiles: Optional[List[str]] = None
    is_solved: Optional[bool] = None

class PostInDB(PostBase):
    id: PyObjectId
    author: PyObjectId
    like_count: int = 0
    comment_count: int = 0
    view_count: int = 0
    is_solved: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}

class PostResponse(PostBase):
    id: str
    author: str
    author_name: Optional[str] = None
    like_count: int
    comment_count: int
    view_count: int
    is_solved: bool
    created_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}