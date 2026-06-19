import uuid
from datetime import datetime, date, time
from sqlalchemy import Column, String, Text, Date, Time, Integer, DateTime, ForeignKey, UniqueConstraint

from app.db.session import Base
from sqlalchemy.orm import relationship


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    spot_id = Column(String(36), ForeignKey("spots.id"), nullable=False)
    creator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    session_date = Column(Date, nullable=False)
    session_time = Column(Time, nullable=True)
    max_participants = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    spot = relationship("Spot", back_populates="sessions")
    creator = relationship("User", back_populates="created_sessions")
    participants = relationship("SessionParticipant", back_populates="session", cascade="all, delete-orphan")


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="participants")
    user = relationship("User", back_populates="joined_sessions")

    __table_args__ = (UniqueConstraint("session_id", "user_id", name="uq_session_participant"),)
