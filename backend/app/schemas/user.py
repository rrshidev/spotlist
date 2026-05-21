from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None
    city: Optional[str] = None
    skating_style: Optional[str] = None
    bio: Optional[str] = None
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None


class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime
    avatar: Optional[str] = None
    city: Optional[str] = None
    skating_style: Optional[str] = None
    bio: Optional[str] = None
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=str(obj.id),
            email=obj.email,
            username=obj.username,
            role=obj.role.value,
            is_active=obj.is_active,
            created_at=obj.created_at,
            avatar=obj.avatar,
            city=obj.city,
            skating_style=obj.skating_style,
            bio=obj.bio,
            telegram_id=obj.telegram_id,
            telegram_username=obj.telegram_username
        )


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None