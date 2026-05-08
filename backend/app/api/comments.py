from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.models.comment import Comment
from app.models.report import Report
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentWithSpotResponse, ReportCreate, ReportResponse
from app.core.security import get_current_user

router = APIRouter(tags=["comments"])


@router.get("/comments/user", response_model=List[CommentWithSpotResponse])
async def get_user_comments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Comment)
        .where(Comment.user_id == current_user.id)
        .options(selectinload(Comment.user), selectinload(Comment.spot))
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    return [
        CommentWithSpotResponse(
            id=str(c.id),
            spot_id=str(c.spot_id),
            spot_name=c.spot.name if c.spot else "Удалённый спот",
            user_id=str(c.user_id),
            username=c.user.username,
            user_avatar=c.user.avatar,
            content=c.content,
            parent_id=str(c.parent_id) if c.parent_id else None,
            is_reported=c.is_reported,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in comments
    ]


@router.get("/spots/{spot_id}/comments", response_model=List[CommentResponse])
async def get_comments(spot_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment)
        .where(Comment.spot_id == spot_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    return [
        CommentResponse(
            id=str(c.id),
            spot_id=str(c.spot_id),
            user_id=str(c.user_id),
            username=c.user.username,
            user_avatar=c.user.avatar,
            content=c.content,
            parent_id=str(c.parent_id) if c.parent_id else None,
            is_reported=c.is_reported,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in comments
    ]


@router.post("/spots/{spot_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    spot_id: str,
    comment_data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Spot not found")

    if comment_data.parent_id:
        parent_result = await db.execute(
            select(Comment).where(Comment.id == comment_data.parent_id, Comment.spot_id == spot_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = Comment(
        spot_id=spot_id,
        user_id=current_user.id,
        content=comment_data.content,
        parent_id=comment_data.parent_id
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return CommentResponse(
        id=str(comment.id),
        spot_id=str(comment.spot_id),
        user_id=str(comment.user_id),
        username=current_user.username,
        user_avatar=current_user.avatar,
        content=comment.content,
        parent_id=str(comment.parent_id) if comment.parent_id else None,
        is_reported=comment.is_reported,
        created_at=comment.created_at,
        updated_at=comment.updated_at
    )


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    comment.content = comment_data.content
    from datetime import datetime
    comment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(comment)

    return CommentResponse(
        id=str(comment.id),
        spot_id=str(comment.spot_id),
        user_id=str(comment.user_id),
        username=current_user.username,
        content=comment.content,
        is_reported=comment.is_reported,
        created_at=comment.created_at,
        updated_at=comment.updated_at
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(comment)
    await db.commit()


@router.post("/comments/{comment_id}/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_comment(
    comment_id: str,
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_reported = True
    report = Report(
        comment_id=comment_id,
        reporter_id=current_user.id,
        reason=report_data.reason
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return ReportResponse(
        id=str(report.id),
        comment_id=str(report.comment_id),
        reporter_id=str(report.reporter_id),
        reason=report.reason,
        created_at=report.created_at
    )