from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class SpotBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: str
    category: str = "street"


class SpotCreate(SpotBase):
    media: Optional[List[str]] = None
    screenshot: Optional[str] = None


class SpotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    media: Optional[List[str]] = None
    screenshot: Optional[str] = None


class SpotResponse(SpotBase):
    id: str
    media: List[str] = []
    screenshot: Optional[str] = None
    author_id: str
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    is_checked: bool
    likes_count: int = 0
    liked: bool = False
    created_at: datetime
    distance: Optional[float] = None

    class Config:
        from_attributes = True


class SpotListResponse(BaseModel):
    spots: List[SpotResponse]
    total: int
    page: int
    page_size: int