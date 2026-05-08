from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.models.comment import Comment
from app.models.like import Like
from app.core.security import get_current_user

router = APIRouter(prefix="/likes", tags=["likes"])


@router.post("/{spot_id}", status_code=status.HTTP_201_CREATED)
async def like_spot(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    
    result = await db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.spot_id == spot_id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        await db.delete(existing)
        spot.likes_count = max(0, (spot.likes_count or 1) - 1)
        await db.commit()
        return {"liked": False, "likes_count": spot.likes_count}
    
    like = Like(user_id=current_user.id, spot_id=spot_id)
    db.add(like)
    spot.likes_count = (spot.likes_count or 0) + 1
    await db.commit()
    
    return {"liked": True, "likes_count": spot.likes_count}


@router.get("/spot/{spot_id}")
async def get_spot_likes(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    
    liked = False
    result = await db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.spot_id == spot_id)
    )
    if result.scalar_one_or_none():
        liked = True
    
    return {"liked": liked, "likes_count": spot.likes_count or 0}


@router.get("")
async def get_my_likes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Like).options(selectinload(Like.spot)).where(Like.user_id == current_user.id)
    )
    likes = result.scalars().all()
    return [
        {
            "spot_id": str(l.spot.id),
            "spot_name": l.spot.name,
            "city": l.spot.city,
            "category": l.spot.category,
            "media": l.spot.media or [],
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in likes
        if l.spot
    ]


@router.post("/comment/{comment_id}", status_code=status.HTTP_201_CREATED)
async def like_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    result = await db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.comment_id == comment_id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        await db.delete(existing)
        await db.commit()
        result = await db.execute(
            select(Like).where(Like.comment_id == comment_id)
        )
        count = len(result.scalars().all())
        return {"liked": False, "likes_count": count}
    
    like = Like(user_id=current_user.id, comment_id=comment_id)
    db.add(like)
    await db.commit()
    
    result = await db.execute(
        select(Like).where(Like.comment_id == comment_id)
    )
    count = len(result.scalars().all())
    return {"liked": True, "likes_count": count}


@router.get("/comment/{comment_id}")
async def get_comment_likes(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    result = await db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.comment_id == comment_id)
    )
    liked = bool(result.scalar_one_or_none())
    
    result = await db.execute(
        select(Like).where(Like.comment_id == comment_id)
    )
    count = len(result.scalars().all())
    
    return {"liked": liked, "likes_count": count}