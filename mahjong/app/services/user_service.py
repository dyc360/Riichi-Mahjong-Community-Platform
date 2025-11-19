from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from passlib.context import CryptContext
from app.models.user import UserCreate, UserUpdate, UserInDB, UserResponse
from app.core.database import get_database

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.users

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    async def create_user(self, user: UserCreate) -> UserInDB:
        # 检查用户是否存在
        if await self.collection.find_one({"email": user.email}):
            raise ValueError("用户邮箱已存在")
        
        if await self.collection.find_one({"username": user.username}):
            raise ValueError("用户名已存在")

        user_dict = user.dict()
        user_dict["password_hash"] = self.get_password_hash(user.password)
        user_dict.pop("password", None)
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()

        result = await self.collection.insert_one(user_dict)
        created_user = await self.collection.find_one({"_id": result.inserted_id})
        return UserInDB(**created_user)

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        user = await self.collection.find_one({"email": email})
        if user:
            return UserInDB(**user)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return UserInDB(**user)
        return None

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await self.collection.update_one(
                {"_id": ObjectId(user_id)}, 
                {"$set": update_data}
            )
        
        return await self.get_user_by_id(user_id)

    async def update_user_stats(self, user_id: str, correct: bool = True):
        update_data = {
            "updated_at": datetime.utcnow(),
            "$inc": {"practice_stats.total_practices": 1}
        }
        
        if correct:
            update_data["$inc"]["practice_stats.correct_answers"] = 1
        
        await self.collection.update_one(
            {"_id": ObjectId(user_id)}, 
            update_data
        )

    async def authenticate_user(self, email: str, password: str) -> Optional[UserInDB]:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        
        # 更新最后登录时间
        await self.collection.update_one(
            {"_id": ObjectId(user.id)}, 
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        return user

user_service = UserService()