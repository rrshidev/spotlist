import json
import base64
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/push", tags=["push"])


def get_vapid_private_key() -> str:
    raw = base64.b64decode(settings.VAPID_PRIVATE_KEY).decode()
    return raw


@router.get("/vapid-public-key")
async def get_vapid_public_key() -> Dict[str, str]:
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push not configured")
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe(
    data: Dict[str, Any],
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    subscription = data.get("subscription")
    if not subscription:
        raise HTTPException(status_code=400, detail="Missing subscription")

    endpoint = subscription.get("endpoint", "")

    await session.execute(
        text("DELETE FROM push_subscriptions WHERE endpoint = :endpoint"),
        {"endpoint": endpoint},
    )

    sub_json = json.dumps(subscription)

    await session.execute(
        text("""
            INSERT INTO push_subscriptions (id, user_id, endpoint, subscription, created_at)
            VALUES (:id, :user_id, :endpoint, CAST(:subscription AS json), NOW())
        """),
        {
            "id": uuid.uuid4().hex[:36],
            "user_id": current_user.id,
            "endpoint": endpoint,
            "subscription": sub_json,
        },
    )

    await session.commit()
    return {"status": "subscribed"}


@router.delete("/unsubscribe")
async def unsubscribe(
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    await session.execute(
        text("DELETE FROM push_subscriptions WHERE user_id = :user_id"),
        {"user_id": current_user.id},
    )
    await session.commit()
    return {"status": "unsubscribed"}


@router.post("/test")
async def send_test(
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push not configured")

    result = await session.execute(
        text("SELECT subscription FROM push_subscriptions WHERE user_id = :user_id"),
        {"user_id": current_user.id},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No subscription found")

    sub = row[0] if isinstance(row[0], dict) else json.loads(row[0])

    try:
        from pywebpush import webpush, WebPushException

        private_key = get_vapid_private_key()

        response = webpush(
            subscription_info=sub,
            data=json.dumps({
                "title": "SpotList",
                "body": "Это тестовое уведомление!",
                "url": "/",
            }),
            vapid_private_key=private_key,
            vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL},
        )
        logger.info(f"Push sent, status: {response.status_code}")
        return {"status": "sent"}
    except WebPushException as e:
        if e.response and e.response.status_code == 410:
            await session.execute(
                text("DELETE FROM push_subscriptions WHERE user_id = :user_id"),
                {"user_id": current_user.id},
            )
            await session.commit()
            raise HTTPException(status_code=410, detail="Subscription expired")
        logger.error(f"Push failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to send push")
    except ImportError:
        raise HTTPException(status_code=503, detail="pywebpush not installed")
