from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.models.comment import Comment
from app.models.report import Report
from app.schemas.user import UserResponse
from app.schemas.spot import SpotResponse
from app.schemas.comment import CommentWithReport, ReportResponse
from app.core.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    users_count = await db.scalar(select(func.count(User.id)))
    spots_count = await db.scalar(select(func.count(Spot.id)))
    unchecked_spots = await db.scalar(select(func.count(Spot.id)).where(Spot.is_checked == False))
    comments_count = await db.scalar(select(func.count(Comment.id)))
    reported_comments = await db.scalar(select(func.count(Comment.id)).where(Comment.is_reported == True))

    return {
        "total_users": users_count or 0,
        "total_spots": spots_count or 0,
        "unchecked_spots": unchecked_spots or 0,
        "total_comments": comments_count or 0,
        "reported_comments": reported_comments or 0
    }


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [UserResponse(
        id=str(u.id),
        email=u.email,
        username=u.username,
        role=u.role,
        is_active=u.is_active,
        created_at=u.created_at
    ) for u in users]


@router.patch("/users/{user_id}/ban")
async def toggle_ban_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot ban admin")

    user.is_active = not user.is_active
    await db.commit()
    return {"message": f"User {'banned' if not user.is_active else 'unbanned'}"}


@router.get("/spots", response_model=List[SpotResponse])
async def get_all_spots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(
        select(Spot).options(selectinload(Spot.author)).order_by(Spot.created_at.desc())
    )
    spots = result.scalars().all()
    return [SpotResponse(
        id=str(s.id),
        name=s.name,
        description=s.description,
        latitude=s.latitude,
        longitude=s.longitude,
        address=s.address,
        city=s.city,
        category=s.category,
        media=s.media or [],
        screenshot=s.screenshot,
        author_id=str(s.author_id),
        author_username=s.author.username if s.author else None,
        is_checked=s.is_checked,
        created_at=s.created_at
    ) for s in spots]


@router.patch("/spots/{spot_id}/check")
async def approve_spot(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    spot.is_checked = True
    await db.commit()
    return {"message": "Spot approved"}


@router.delete("/spots/{spot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spot_admin(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    await db.delete(spot)
    await db.commit()


@router.get("/reports", response_model=List[CommentWithReport])
async def get_reported_comments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(
        select(Comment)
        .where(Comment.is_reported == True)
        .options(
            selectinload(Comment.user),
            selectinload(Comment.reports).selectinload(Report.reporter)
        )
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    return [
        CommentWithReport(
            id=str(c.id),
            spot_id=str(c.spot_id),
            user_id=str(c.user_id),
            username=c.user.username,
            content=c.content,
            parent_id=str(c.parent_id) if c.parent_id else None,
            is_reported=c.is_reported,
            created_at=c.created_at,
            updated_at=c.updated_at,
            report_reason=c.reports[0].reason if c.reports else None,
            reporter_username=c.reports[0].reporter.username if c.reports else None
        )
        for c in comments
    ]


@router.patch("/comments/{comment_id}/ignore-report")
async def ignore_report(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_reported = False
    await db.commit()
    return {"message": "Report ignored"}