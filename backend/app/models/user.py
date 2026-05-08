import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, name="userrole", create_constraint=True), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    avatar = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    skating_style = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)

    spots = relationship("Spot", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reporter", cascade="all, delete-orphan")