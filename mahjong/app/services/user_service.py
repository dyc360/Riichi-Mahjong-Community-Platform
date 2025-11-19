from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.user_models import User
from app.models.user import UserCreate, UserInDB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    async def create_user(self, user_data: UserCreate) -> UserInDB:
        # 检查用户是否存在
        if self.db.query(User).filter(User.email == user_data.email).first():
            raise ValueError("用户邮箱已存在")

        if self.db.query(User).filter(User.username == user_data.username).first():
            raise ValueError("用户名已存在")

        # 创建用户
        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=self.get_password_hash(user_data.password),
            phone=user_data.phone,
            avatar=user_data.avatar,
            level=user_data.level,
            points=user_data.points,
            rank=user_data.rank,
            is_admin=user_data.is_admin
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return UserInDB(
            id=str(user.id),
            username=user.username,
            email=user.email,
            phone=user.phone,
            avatar=user.avatar,
            level=user.level,
            points=user.points,
            rank=user.rank,
            is_admin=user.is_admin,
            is_active=user.is_active,
            password_hash=user.password_hash,
            total_practices=user.total_practices,
            correct_answers=user.correct_answers,
            average_score=user.average_score,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        user = self.db.query(User).filter(User.email == email).first()
        if user:
            return UserInDB(
                id=str(user.id),
                username=user.username,
                email=user.email,
                phone=user.phone,
                avatar=user.avatar,
                level=user.level,
                points=user.points,
                rank=user.rank,
                is_admin=user.is_admin,
                is_active=user.is_active,
                password_hash=user.password_hash,
                total_practices=user.total_practices,
                correct_answers=user.correct_answers,
                average_score=user.average_score,
                last_login=user.last_login,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            return UserInDB(
                id=str(user.id),
                username=user.username,
                email=user.email,
                phone=user.phone,
                avatar=user.avatar,
                level=user.level,
                points=user.points,
                rank=user.rank,
                is_admin=user.is_admin,
                is_active=user.is_active,
                password_hash=user.password_hash,
                total_practices=user.total_practices,
                correct_answers=user.correct_answers,
                average_score=user.average_score,
                last_login=user.last_login,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
        return None

    async def authenticate_user(self, email: str, password: str) -> Optional[UserInDB]:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None

        # 更新最后登录时间
        db_user = self.db.query(User).filter(User.id == user.id).first()
        db_user.last_login = datetime.utcnow()
        self.db.commit()

        return user

    async def update_user_stats(self, user_id: str, correct: bool = True):
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_practices += 1
            if correct:
                user.correct_answers += 1
            self.db.commit()


def get_user_service(db: Session) -> UserService:
    return UserService(db)