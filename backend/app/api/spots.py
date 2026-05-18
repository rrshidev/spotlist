from typing import Optional, List
from math import radians, cos, sin, asin, sqrt
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.schemas.spot import SpotCreate, SpotUpdate, SpotResponse, SpotListResponse, SpotStatusUpdate
from app.core.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/spots", tags=["spots"])


def _spot_to_response(spot: Spot, liked: bool = False, distance: Optional[float] = None) -> SpotResponse:
    return SpotResponse(
        id=str(spot.id),
        name=spot.name,
        description=spot.description,
        latitude=spot.latitude,
        longitude=spot.longitude,
        address=spot.address,
        city=spot.city,
        category=spot.category,
        obstacles=[{"type": o["type"], "count": o.get("count")} for o in (spot.obstacles or [])],
        ride_types=spot.ride_types or [],
        media=spot.media or [],
        screenshot=spot.screenshot,
        video=spot.video,
        status=spot.status or "unknown",
        last_status_at=spot.last_status_at,
        author_id=str(spot.author_id),
        author_username=spot.author.username if spot.author else None,
        author_avatar=spot.author.avatar if spot.author else None,
        is_checked=spot.is_checked,
        likes_count=spot.likes_count or 0,
        liked=liked,
        created_at=spot.created_at,
        distance=distance,
    )


def _match_obstacles(obstacles: list, obstacle_type: Optional[str], stair_count: Optional[int]) -> bool:
    if not obstacle_type:
        return True
    for o in (obstacles or []):
        if o.get("type") == obstacle_type:
            if obstacle_type == "stairs" and stair_count is not None:
                if o.get("count") == stair_count:
                    return True
            else:
                return True
    return False


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return c * 6371


@router.get("/my", response_model=List[SpotResponse])
async def get_my_spots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Spot).where(Spot.author_id == current_user.id).options(selectinload(Spot.author))
    )
    return [_spot_to_response(s) for s in result.scalars().all()]


@router.get("", response_model=SpotListResponse)
async def get_spots(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    radius: Optional[float] = Query(10),
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    obstacle_type: Optional[str] = Query(None),
    stair_count: Optional[int] = Query(None),
    ride_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    with_liked: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = select(Spot)

    if city:
        query = query.where(func.lower(Spot.city) == city.lower())

    if category:
        query = query.where(Spot.category == category)

    result = await db.execute(query)
    spots = result.scalars().all()

    if obstacle_type:
        spots = [s for s in spots if _match_obstacles(s.obstacles, obstacle_type, stair_count)]

    if ride_type:
        spots = [s for s in spots if ride_type in (s.ride_types or [])]

    user_liked_spots = set()
    if with_liked and current_user:
        from app.models.like import Like
        result = await db.execute(select(Like).where(Like.user_id == current_user.id))
        user_liked_spots = {str(l.spot_id) for l in result.scalars().all() if l.spot_id}

    if lat and lon and radius and not city:
        filtered: list[tuple[float, Spot]] = []
        for spot in spots:
            dist = haversine(lon, lat, spot.longitude, spot.latitude)
            if dist <= radius:
                filtered.append((dist, spot))
        filtered.sort(key=lambda x: x[0])
        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = filtered[start:end]
        return SpotListResponse(
            spots=[_spot_to_response(s, str(s.id) in user_liked_spots, round(d, 2)) for d, s in page_items],
            total=total,
            page=page,
            page_size=page_size
        )

    total = len(spots)
    offset = (page - 1) * page_size
    spots = spots[offset:offset + page_size]
    # Load author relationship for remaining spots
    if spots:
        ids = [s.id for s in spots]
        author_result = await db.execute(select(Spot).where(Spot.id.in_(ids)).options(selectinload(Spot.author)))
        spots = author_result.scalars().all()

    return SpotListResponse(
        spots=[_spot_to_response(s, str(s.id) in user_liked_spots) for s in spots],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{spot_id}", response_model=SpotResponse)
async def get_spot(spot_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Spot).where(Spot.id == spot_id).options(selectinload(Spot.author))
    )
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return _spot_to_response(spot)


@router.post("", response_model=SpotResponse, status_code=status.HTTP_201_CREATED)
async def create_spot(
    spot_data: SpotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    spot = Spot(
        name=spot_data.name,
        description=spot_data.description,
        latitude=spot_data.latitude,
        longitude=spot_data.longitude,
        address=spot_data.address,
        city=spot_data.city,
        category=spot_data.category.value if hasattr(spot_data.category, 'value') else spot_data.category,
        obstacles=[o.model_dump() for o in (spot_data.obstacles or [])],
        ride_types=spot_data.ride_types or [],
        media=spot_data.media or [],
        screenshot=spot_data.screenshot,
        video=spot_data.video,
        status=spot_data.status or "unknown",
        author_id=current_user.id,
    )
    db.add(spot)
    await db.commit()
    await db.refresh(spot)
    return _spot_to_response(spot, liked=False)


@router.put("/{spot_id}", response_model=SpotResponse)
async def update_spot(
    spot_id: str,
    spot_data: SpotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = spot_data.model_dump(exclude_unset=True)
    if 'obstacles' in update_data:
        update_data['obstacles'] = [
            o.model_dump() if hasattr(o, 'model_dump') else o
            for o in (update_data['obstacles'] or [])
        ]
    for key, value in update_data.items():
        setattr(spot, key, value)

    await db.commit()
    await db.refresh(spot)
    return _spot_to_response(spot)


@router.delete("/{spot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spot(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(spot)
    await db.commit()


@router.patch("/{spot_id}/status", response_model=SpotResponse)
async def update_spot_status(
    spot_id: str,
    status_data: SpotStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Spot).where(Spot.id == spot_id).options(selectinload(Spot.author)))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    spot.status = status_data.status
    spot.last_status_at = datetime.utcnow()
    await db.commit()
    await db.refresh(spot)
    return _spot_to_response(spot)