from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel


class SessionBase(BaseModel):
    spot_id: str
    title: str
    description: Optional[str] = None
    session_date: date
    session_time: Optional[time] = None
    max_participants: Optional[int] = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    session_date: Optional[date] = None
    session_time: Optional[time] = None
    max_participants: Optional[int] = None


class ParticipantInfo(BaseModel):
    id: str
    user_id: str
    username: str
    avatar: Optional[str] = None
    joined_at: datetime


class SessionResponse(SessionBase):
    id: str
    creator_id: str
    creator_username: Optional[str] = None
    creator_avatar: Optional[str] = None
    participant_count: int = 0
    max_participants: Optional[int] = None
    participants: List[ParticipantInfo] = []
    spot_name: Optional[str] = None
    spot_city: Optional[str] = None
    created_at: datetime
    is_joined: bool = False

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: List[SessionResponse]
    total: int
    page: int
    page_size: int
