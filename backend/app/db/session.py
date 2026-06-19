from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add columns that may be missing from existing tables
        await conn.execute(text("ALTER TABLE spots ADD COLUMN IF NOT EXISTS obstacles JSON DEFAULT '[]'::json"))
        await conn.execute(text("ALTER TABLE spots ADD COLUMN IF NOT EXISTS ride_types JSON DEFAULT '[]'::json"))
        await conn.execute(text("ALTER TABLE spots ADD COLUMN IF NOT EXISTS video VARCHAR(500)"))
        await conn.execute(text("ALTER TABLE spots ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unknown'"))
        await conn.execute(text("ALTER TABLE spots ADD COLUMN IF NOT EXISTS last_status_at TIMESTAMP WITH TIME ZONE"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(50)"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100)"))
        # Rental table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS rentals (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                address VARCHAR(500),
                city VARCHAR(255) NOT NULL,
                items JSON DEFAULT '[]'::json,
                prices TEXT,
                contacts JSON DEFAULT '{}'::json,
                media JSON DEFAULT '[]'::json,
                owner_id VARCHAR(36) REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        # Sessions tables
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                spot_id VARCHAR(36) REFERENCES spots(id),
                creator_id VARCHAR(36) REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                session_date DATE NOT NULL,
                session_time TIME,
                max_participants INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS session_participants (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(36) REFERENCES sessions(id),
                user_id VARCHAR(36) REFERENCES users(id),
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(session_id, user_id)
            )
        """))