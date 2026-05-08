import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class SpotCategory(enum.Enum):
    PARK = "park"
    STREET = "street"
    ROLLER = "roller"
    ROUTES = "routes"


class Spot(Base):
    __tablename__ = "spots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)
    city = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="street")
    media = Column(JSON, default=list)
    screenshot = Column(String(500), nullable=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_checked = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="spots")
    comments = relationship("Comment", back_populates="spot", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="spot", cascade="all, delete-orphan")