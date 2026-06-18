from datetime import timedelta
from typing import Optional
import hashlib
import hmac
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _verify_telegram_auth(data: dict) -> bool:
    bot_token = settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        return False

    received_hash = data.pop("hash", None)
    if not received_hash:
        return False

    items = sorted(
        (k, str(v)) for k, v in data.items()
        if v is not None
    )
    check_string = "\n".join(f"{k}={v}" for k, v in items)

    secret_key = hashlib.sha256(bot_token.encode()).digest()
    computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

    return computed_hash == received_hash


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.from_orm(user)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    for field, value in user_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.from_orm(current_user)


@router.post("/telegram", response_model=Token)
async def telegram_login(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    if not _verify_telegram_auth(data):
        raise HTTPException(status_code=400, detail="Invalid Telegram auth data")

    telegram_id = str(data.get("id"))
    username = data.get("username") or data.get("first_name", "Telegram User")
    photo_url = data.get("photo_url")

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        if photo_url:
            user.avatar = photo_url
    else:
        user = User(
            email=f"tg_{telegram_id}@telegram.placeholder",
            username=username,
            password_hash=get_password_hash(str(uuid.uuid4())),
            telegram_id=telegram_id,
            telegram_username=username,
            avatar=photo_url,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token)


@router.post("/telegram/link")
async def link_telegram(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not _verify_telegram_auth(data):
        raise HTTPException(status_code=400, detail="Invalid Telegram auth data")

    telegram_id = str(data.get("id"))
    username = data.get("username") or data.get("first_name", "Telegram User")

    existing = await db.execute(select(User).where(User.telegram_id == telegram_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Telegram already linked to another account")

    current_user.telegram_id = telegram_id
    current_user.telegram_username = username
    await db.commit()

    return {"status": "linked", "telegram_username": username}


@router.delete("/telegram/link")
async def unlink_telegram(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.telegram_id = None
    current_user.telegram_username = None
    await db.commit()
    return {"status": "unlinked"}