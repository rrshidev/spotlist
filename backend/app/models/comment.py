import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref

from app.db.session import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    spot_id = Column(String(36), ForeignKey("spots.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(String(36), ForeignKey("comments.id"), nullable=True)
    is_reported = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)

    spot = relationship("Spot", back_populates="comments")
    user = relationship("User", back_populates="comments")
    reports = relationship("Report", back_populates="comment", cascade="all, delete-orphan")
    replies = relationship("Comment", cascade="all, delete-orphan", backref=backref("parent", remote_side=[id]))
    likes = relationship("Like", back_populates="comment", cascade="all, delete-orphan")