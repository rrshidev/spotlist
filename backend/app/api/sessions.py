from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.spot import Spot
from app.models.session import Session, SessionParticipant
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse, SessionListResponse, ParticipantInfo
from app.core.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


async def _session_to_response(
    session: Session,
    current_user_id: Optional[str] = None,
) -> SessionResponse:
    participants = []
    is_joined = False
    for p in session.participants or []:
        info = ParticipantInfo(
            id=str(p.id),
            user_id=str(p.user_id),
            username=p.user.username if p.user else "?",
            avatar=p.user.avatar if p.user else None,
            joined_at=p.joined_at,
        )
        participants.append(info)
        if current_user_id and str(p.user_id) == current_user_id:
            is_joined = True

    return SessionResponse(
        id=str(session.id),
        spot_id=str(session.spot_id),
        creator_id=str(session.creator_id),
        creator_username=session.creator.username if session.creator else None,
        creator_avatar=session.creator.avatar if session.creator else None,
        title=session.title,
        description=session.description,
        session_date=session.session_date,
        session_time=session.session_time,
        max_participants=session.max_participants,
        participant_count=len(participants),
        participants=participants,
        spot_name=session.spot.name if session.spot else None,
        spot_city=session.spot.city if session.spot else None,
        created_at=session.created_at,
        is_joined=is_joined,
    )


def _load_options():
    return [
        selectinload(Session.creator),
        selectinload(Session.spot),
        selectinload(Session.participants).selectinload(SessionParticipant.user),
    ]


@router.get("", response_model=SessionListResponse)
async def get_sessions(
    spot_id: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    query = select(Session).options(*_load_options()).order_by(Session.session_date, Session.session_time)

    if spot_id:
        query = query.where(Session.spot_id == spot_id)

    if date_from:
        query = query.where(Session.session_date >= date_from)

    if city:
        subq = select(Spot.id).where(func.lower(Spot.city) == city.lower())
        query = query.where(Session.spot_id.in_(subq))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    sessions = result.scalars().all()

    current_user_id = str(current_user.id) if current_user else None
    return SessionListResponse(
        sessions=[await _session_to_response(s, current_user_id) for s in sessions],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/my", response_model=List[SessionResponse])
async def get_my_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(*_load_options())
        .where(Session.creator_id == current_user.id)
        .order_by(Session.session_date)
    )
    sessions = result.scalars().all()
    return [await _session_to_response(s, str(current_user.id)) for s in sessions]


@router.get("/joined", response_model=List[SessionResponse])
async def get_joined_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .options(*_load_options())
        .join(SessionParticipant, SessionParticipant.session_id == Session.id)
        .where(SessionParticipant.user_id == current_user.id)
        .order_by(Session.session_date)
    )
    sessions = result.scalars().all()
    return [await _session_to_response(s, str(current_user.id)) for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id).options(*_load_options())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_user_id = str(current_user.id) if current_user else None
    return await _session_to_response(session, current_user_id)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    spot_result = await db.execute(select(Spot).where(Spot.id == session_data.spot_id))
    spot = spot_result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    session = Session(
        spot_id=session_data.spot_id,
        creator_id=current_user.id,
        title=session_data.title,
        description=session_data.description,
        session_date=session_data.session_date,
        session_time=session_data.session_time,
        max_participants=session_data.max_participants,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    creator_result = await db.execute(
        select(Session).where(Session.id == session.id).options(*_load_options())
    )
    session = creator_result.scalar_one()
    return await _session_to_response(session, str(current_user.id))


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    session_data: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id).options(*_load_options())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = session_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session, key, value)

    await db.commit()
    await db.refresh(session)
    return await _session_to_response(session, str(current_user.id))


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(session)
    await db.commit()


@router.post("/{session_id}/join", response_model=SessionResponse)
async def join_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id).options(*_load_options())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = await db.execute(
        select(SessionParticipant).where(
            and_(
                SessionParticipant.session_id == session_id,
                SessionParticipant.user_id == current_user.id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already joined")

    if session.max_participants:
        count_result = await db.execute(
            select(func.count()).select_from(SessionParticipant).where(
                SessionParticipant.session_id == session_id
            )
        )
        count = count_result.scalar() or 0
        if count >= session.max_participants:
            raise HTTPException(status_code=400, detail="Session is full")

    participant = SessionParticipant(
        session_id=session_id,
        user_id=current_user.id,
    )
    db.add(participant)
    await db.commit()

    if session.creator_id != current_user.id:
        from app.services.push_service import send_push
        await send_push(
            db,
            user_id=session.creator_id,
            title="Новый участник",
            body=f"{current_user.username} присоединился к «{session.title}»",
            url=f"/sessions/{session_id}",
        )

    fresh = await db.execute(
        select(Session).where(Session.id == session_id).options(*_load_options())
    )
    session = fresh.scalar_one()
    return await _session_to_response(session, str(current_user.id))


@router.post("/{session_id}/leave", response_model=SessionResponse)
async def leave_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id).options(*_load_options())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = await db.execute(
        select(SessionParticipant).where(
            and_(
                SessionParticipant.session_id == session_id,
                SessionParticipant.user_id == current_user.id,
            )
        )
    )
    participant = existing.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=400, detail="Not a participant")

    await db.delete(participant)
    await db.commit()

    fresh = await db.execute(
        select(Session).where(Session.id == session_id).options(*_load_options())
    )
    session = fresh.scalar_one()
    return await _session_to_response(session, str(current_user.id))
