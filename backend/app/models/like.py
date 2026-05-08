import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Like(Base):
    __tablename__ = "likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    spot_id = Column(UUID(as_uuid=True), ForeignKey("spots.id"), nullable=True)
    comment_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="likes")
    spot = relationship("Spot", back_populates="likes")
    comment = relationship("Comment")

    __table_args__ = (
        UniqueConstraint('user_id', 'spot_id', name='unique_user_spot_like'),
        UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_like'),
    )