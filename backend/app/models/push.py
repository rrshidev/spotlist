from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    endpoint = Column(String(500), nullable=False)
    subscription = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
