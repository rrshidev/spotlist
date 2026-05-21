import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class SavedSpot(Base):
    __tablename__ = "saved_spots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    spot_id = Column(String(36), ForeignKey("spots.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_spots")
    spot = relationship("Spot", back_populates="saved_by")

    __table_args__ = (
        UniqueConstraint('user_id', 'spot_id', name='unique_user_spot_saved'),
    )
