# app/models/user_models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.config.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    avatar = Column(String(255), nullable=True)
    level = Column(String(20), default="初段")
    points = Column(Integer, default=0)
    rank = Column(Integer, default=0)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # 练习统计
    total_practices = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    average_score = Column(Integer, default=0)

    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class News(Base):
    __tablename__ = "news"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="latest")
    cover_image = Column(String(255), nullable=True)
    tags = Column(String(500), default="")  # 用逗号分隔的标签

    author_id = Column(String(36), nullable=False)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="other-discussion")
    images = Column(Text, default="")  # 用逗号分隔的图片URL
    tiles = Column(Text, default="")  # 用逗号分隔的麻将牌

    author_id = Column(String(36), nullable=False)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    is_solved = Column(Boolean, default=False)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())