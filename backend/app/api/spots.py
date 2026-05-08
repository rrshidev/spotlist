from typing import Optional, List
from math import radians, cos, sin, asin, sqrt
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.schemas.spot import SpotCreate, SpotUpdate, SpotResponse, SpotListResponse
from app.core.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/spots", tags=["spots"])


@router.get("/my", response_model=List[SpotResponse])
async def get_my_spots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Spot).where(Spot.author_id == current_user.id).options(selectinload(Spot.author))
    )
    spots = result.scalars().all()
    return [
        SpotResponse(
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
            author_avatar=s.author.avatar if s.author else None,
            is_checked=s.is_checked,
            likes_count=s.likes_count or 0,
            created_at=s.created_at
        )
        for s in spots
    ]


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371
    return c * r


@router.get("", response_model=SpotListResponse)
async def get_spots(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    radius: Optional[float] = Query(10),
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
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

    user_liked_spots = set()
    if with_liked and current_user:
        from app.models.like import Like
        result = await db.execute(select(Like).where(Like.user_id == current_user.id))
        likes = result.scalars().all()
        user_liked_spots = {str(l.spot_id) for l in likes if l.spot_id}

    if lat and lon and radius:
        spots_with_distance = []
        for spot in spots:
            dist = haversine(lon, lat, spot.longitude, spot.latitude)
            if dist <= radius:
                spot_dict = {
                    "id": str(spot.id),
                    "name": spot.name,
                    "description": spot.description,
                    "latitude": spot.latitude,
                    "longitude": spot.longitude,
                    "address": spot.address,
                    "city": spot.city,
                    "category": spot.category,
                    "media": spot.media or [],
                    "screenshot": spot.screenshot,
                    "author_id": str(spot.author_id),
                    "author_username": None,
                    "author_avatar": None,
                    "is_checked": spot.is_checked,
                    "likes_count": spot.likes_count or 0,
                    "liked": str(spot.id) in user_liked_spots,
                    "created_at": spot.created_at,
                    "distance": round(dist, 2)
                }
                spots_with_distance.append(SpotResponse(**spot_dict))
        spots_with_distance.sort(key=lambda x: x.distance)
        total = len(spots_with_distance)
        start = (page - 1) * page_size
        end = start + page_size
        return SpotListResponse(
            spots=spots_with_distance[start:end],
            total=total,
            page=page,
            page_size=page_size
        )

    total = len(spots)
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query.options(selectinload(Spot.author)))
    spots = result.scalars().all()

    spots_response = []
    for spot in spots:
        spots_response.append(SpotResponse(
            id=str(spot.id),
            name=spot.name,
            description=spot.description,
            latitude=spot.latitude,
            longitude=spot.longitude,
            address=spot.address,
            city=spot.city,
            category=spot.category,
            media=spot.media or [],
            screenshot=spot.screenshot,
            author_id=str(spot.author_id),
            author_username=spot.author.username if spot.author else None,
            author_avatar=spot.author.avatar if spot.author else None,
            is_checked=spot.is_checked,
            likes_count=spot.likes_count or 0,
            created_at=spot.created_at
        ))

    return SpotListResponse(
        spots=spots_response,
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
    return SpotResponse(
        id=str(spot.id),
        name=spot.name,
        description=spot.description,
        latitude=spot.latitude,
        longitude=spot.longitude,
        address=spot.address,
        city=spot.city,
        category=spot.category,
        media=spot.media or [],
        screenshot=spot.screenshot,
        author_id=str(spot.author_id),
        author_username=spot.author.username if spot.author else None,
        author_avatar=spot.author.avatar if spot.author else None,
        is_checked=spot.is_checked,
        created_at=spot.created_at
    )


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
        media=spot_data.media or [],
        screenshot=spot_data.screenshot,
        author_id=current_user.id
    )
    db.add(spot)
    await db.commit()
    await db.refresh(spot)
    return SpotResponse(
        id=str(spot.id),
        name=spot.name,
        description=spot.description,
        latitude=spot.latitude,
        longitude=spot.longitude,
        address=spot.address,
        city=spot.city,
        category=spot.category,
        media=spot.media or [],
        screenshot=spot.screenshot,
        author_id=str(spot.author_id),
        author_username=current_user.username,
        author_avatar=current_user.avatar,
        is_checked=spot.is_checked,
        created_at=spot.created_at
    )

 
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

    for key, value in spot_data.model_dump(exclude_unset=True).items():
        setattr(spot, key, value)

    await db.commit()
    await db.refresh(spot)
    return SpotResponse(
        id=str(spot.id),
        name=spot.name,
        description=spot.description,
        latitude=spot.latitude,
        longitude=spot.longitude,
        address=spot.address,
        city=spot.city,
        category=spot.category,
        media=spot.media or [],
        screenshot=spot.screenshot,
        author_id=str(spot.author_id),
        author_username=current_user.username,
        is_checked=spot.is_checked,
        created_at=spot.created_at
    )


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