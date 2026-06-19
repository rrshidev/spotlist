import json
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_push(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str,
    url: str = "/",
):
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return

    result = await db.execute(
        text("SELECT subscription FROM push_subscriptions WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    rows = result.fetchall()
    if not rows:
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return

    for row in rows:
        sub = row[0] if isinstance(row[0], dict) else json.loads(row[0])
        try:
            webpush(
                subscription_info=sub,
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "url": url,
                }),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL},
            )
        except WebPushException as e:
            if e.response and e.response.status_code == 410:
                await db.execute(
                    text("DELETE FROM push_subscriptions WHERE user_id = :user_id AND endpoint = :endpoint"),
                    {"user_id": user_id, "endpoint": sub.get("endpoint", "")},
                )
                await db.commit()
            else:
                logger.warning(f"Push failed for user {user_id}: {e}")
        except Exception as e:
            logger.warning(f"Push error for user {user_id}: {e}")
