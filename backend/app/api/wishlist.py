from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.models.wishlist import SavedSpot
from app.core.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.post("/{spot_id}", status_code=status.HTTP_201_CREATED)
async def toggle_save_spot(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    result = await db.execute(
        select(SavedSpot).where(
            SavedSpot.user_id == current_user.id,
            SavedSpot.spot_id == spot_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"saved": False}

    saved = SavedSpot(user_id=current_user.id, spot_id=spot_id)
    db.add(saved)
    await db.commit()

    return {"saved": True}


@router.get("")
async def get_my_saved_spots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SavedSpot)
        .options(selectinload(SavedSpot.spot))
        .where(SavedSpot.user_id == current_user.id)
        .order_by(SavedSpot.created_at.desc())
    )
    saved = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "spot_id": str(s.spot.id),
            "spot_name": s.spot.name,
            "city": s.spot.city,
            "category": s.spot.category,
            "media": s.spot.media or [],
            "latitude": s.spot.latitude,
            "longitude": s.spot.longitude,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in saved
        if s.spot
    ]


@router.get("/check/{spot_id}")
async def check_saved(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SavedSpot).where(
            SavedSpot.user_id == current_user.id,
            SavedSpot.spot_id == spot_id
        )
    )
    return {"saved": result.scalar_one_or_none() is not None}
