from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

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
    id: PyObjectId
    password_hash: str
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True

class PracticeStats(BaseModel):
    total_practices: int = 0
    correct_answers: int = 0
    average_score: float = 0.0

class UserResponse(UserBase):
    id: str
    practice_stats: PracticeStats = PracticeStats()
    
    class Config:
        json_encoders = {ObjectId: str}