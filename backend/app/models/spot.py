import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship

from app.db.session import Base


class SpotCategory(enum.Enum):
    PARK = "park"
    STREET = "street"
    ROLLER = "roller"
    ROUTES = "routes"


class ObstacleType(enum.Enum):
    LEDGE = "ledge"
    RAIL = "rail"
    STAIRS = "stairs"
    HUBBA = "hubba"
    GAP = "gap"
    BANK = "bank"
    MANUAL_PAD = "manual_pad"
    BOWL = "bowl"
    QUARTER_PIPE = "quarter_pipe"
    WALLRIDE = "wallride"


class SpotStatus(enum.Enum):
    ACTIVE = "active"
    BUST = "bust"
    RISKY = "risky"
    UNKNOWN = "unknown"


class Spot(Base):
    __tablename__ = "spots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)
    city = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="street")
    obstacles = Column(JSON, default=list)
    ride_types = Column(JSON, default=list)
    media = Column(JSON, default=list)
    screenshot = Column(String(500), nullable=True)
    video = Column(String(500), nullable=True)
    status = Column(String(20), default="unknown")
    last_status_at = Column(DateTime, nullable=True)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    is_checked = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="spots")
    comments = relationship("Comment", back_populates="spot", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="spot", cascade="all, delete-orphan")
    saved_by = relationship("SavedSpot", back_populates="spot", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="spot", cascade="all, delete-orphan")