from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone: Optional[str] = None
    avatar: Optional[str] = None
    level: str = "初段"
    points: int = 0
    rank: int = 0
    is_admin: bool = False
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    level: Optional[str] = None
    points: Optional[int] = None

class UserInDB(UserBase):
    id: str
    password_hash: str
    total_practices: int = 0
    correct_answers: int = 0
    average_score: float = 0.0
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PracticeStats(BaseModel):
    total_practices: int = 0
    correct_answers: int = 0
    average_score: float = 0.0

class UserResponse(UserBase):
    id: str
    practice_stats: PracticeStats = PracticeStats()

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: Optional[str] = None
    username: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None