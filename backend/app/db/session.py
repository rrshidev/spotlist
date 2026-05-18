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