from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel


class RentalBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: str
    items: List[str] = []
    prices: Optional[str] = None
    contacts: Dict[str, str] = {}
    media: List[str] = []


class RentalCreate(RentalBase):
    pass


class RentalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    items: Optional[List[str]] = None
    prices: Optional[str] = None
    contacts: Optional[Dict[str, str]] = None
    media: Optional[List[str]] = None


class RentalResponse(RentalBase):
    id: str
    owner_id: str
    owner_username: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RentalListResponse(BaseModel):
    rentals: List[RentalResponse]
    total: int
    page: int
    page_size: int
