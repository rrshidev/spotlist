from typing import Optional, List
from math import radians, cos, sin, asin, sqrt
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.rental import Rental
from app.schemas.rental import RentalCreate, RentalUpdate, RentalResponse, RentalListResponse
from app.core.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/rentals", tags=["rentals"])


def _rental_to_response(rental: Rental) -> RentalResponse:
    return RentalResponse(
        id=str(rental.id),
        name=rental.name,
        description=rental.description,
        latitude=rental.latitude,
        longitude=rental.longitude,
        address=rental.address,
        city=rental.city,
        items=rental.items or [],
        prices=rental.prices,
        contacts=rental.contacts or {},
        media=rental.media or [],
        owner_id=str(rental.owner_id),
        owner_username=rental.owner.username if rental.owner else None,
        created_at=rental.created_at,
        updated_at=rental.updated_at,
    )


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return c * 6371


@router.get("/my", response_model=List[RentalResponse])
async def get_my_rentals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Rental).where(Rental.owner_id == current_user.id).options(selectinload(Rental.owner))
    )
    return [_rental_to_response(s) for s in result.scalars().all()]


@router.get("", response_model=RentalListResponse)
async def get_rentals(
    city: Optional[str] = Query(None),
    item_type: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    radius: Optional[float] = Query(10),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Rental).options(selectinload(Rental.owner))

    if city:
        query = query.where(func.lower(Rental.city) == city.lower())

    result = await db.execute(query)
    rentals = result.scalars().all()

    if item_type:
        rentals = [r for r in rentals if item_type in (r.items or [])]

    if lat and lon and radius and not city:
        filtered: list[tuple[float, Rental]] = []
        for rental in rentals:
            dist = haversine(lon, lat, rental.longitude, rental.latitude)
            if dist <= radius:
                filtered.append((dist, rental))
        filtered.sort(key=lambda x: x[0])
        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = filtered[start:end]
        return RentalListResponse(
            rentals=[_rental_to_response(r) for d, r in page_items],
            total=total,
            page=page,
            page_size=page_size
        )

    total = len(rentals)
    offset = (page - 1) * page_size
    rentals = rentals[offset:offset + page_size]

    return RentalListResponse(
        rentals=[_rental_to_response(r) for r in rentals],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{rental_id}", response_model=RentalResponse)
async def get_rental(rental_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Rental).where(Rental.id == rental_id).options(selectinload(Rental.owner))
    )
    rental = result.scalar_one_or_none()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    return _rental_to_response(rental)


@router.post("", response_model=RentalResponse, status_code=status.HTTP_201_CREATED)
async def create_rental(
    rental_data: RentalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rental = Rental(
        name=rental_data.name,
        description=rental_data.description,
        latitude=rental_data.latitude,
        longitude=rental_data.longitude,
        address=rental_data.address,
        city=rental_data.city,
        items=rental_data.items or [],
        prices=rental_data.prices,
        contacts=rental_data.contacts or {},
        media=rental_data.media or [],
        owner_id=current_user.id,
    )
    db.add(rental)
    await db.commit()
    await db.refresh(rental)
    return _rental_to_response(rental)


@router.put("/{rental_id}", response_model=RentalResponse)
async def update_rental(
    rental_id: str,
    rental_data: RentalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Rental).where(Rental.id == rental_id).options(selectinload(Rental.owner)))
    rental = result.scalar_one_or_none()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = rental_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rental, key, value)

    await db.commit()
    await db.refresh(rental)
    return _rental_to_response(rental)


@router.delete("/{rental_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rental(
    rental_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Rental).where(Rental.id == rental_id))
    rental = result.scalar_one_or_none()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(rental)
    await db.commit()
