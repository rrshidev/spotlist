from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    parent_id: Optional[str] = None


class CommentUpdate(BaseModel):
    content: str


class CommentWithReport(CommentBase):
    id: str
    spot_id: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    parent_id: Optional[str] = None
    is_reported: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    report_reason: Optional[str] = None
    reporter_username: Optional[str] = None

    class Config:
        from_attributes = True


class CommentResponse(CommentBase):
    id: str
    spot_id: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    parent_id: Optional[str] = None
    is_reported: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    reason: str


class ReportResponse(BaseModel):
    id: str
    comment_id: str
    reporter_id: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True