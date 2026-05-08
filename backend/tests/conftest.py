import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import uuid as uuid_module
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


from app.db.session import Base, get_db
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.spot import Spot
from app.models.comment import Comment
from app.models.like import Like
from main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_async_session_maker = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with test_async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    from app.models import user, spot, comment, like, report
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_async_session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = lambda: db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    from datetime import datetime
    import bcrypt
    hashed = bcrypt.hashpw("testpass123".encode(), bcrypt.gensalt()).decode()
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash=hashed,
        is_active=True,
        role=UserRole.USER,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_spot(db_session: AsyncSession, test_user: User) -> Spot:
    spot = Spot(
        name="Test Spot",
        description="A test spot",
        latitude=55.7558,
        longitude=37.6173,
        address="Moscow, Red Square",
        city="Moscow",
        category="park",
        media=[],
        author_id=test_user.id,
        is_checked=True,
        likes_count=0,
    )
    db_session.add(spot)
    await db_session.commit()
    await db_session.refresh(spot)
    return spot


@pytest_asyncio.fixture
async def test_comment(db_session: AsyncSession, test_user: User, test_spot: Spot) -> Comment:
    from datetime import datetime
    comment = Comment(
        spot_id=test_spot.id,
        user_id=test_user.id,
        content="Test comment",
        created_at=datetime.utcnow(),
    )
    db_session.add(comment)
    await db_session.commit()
    await db_session.refresh(comment)
    return comment
