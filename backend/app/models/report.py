import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=False)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    comment = relationship("Comment", back_populates="reports")
    reporter = relationship("User")