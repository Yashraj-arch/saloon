import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger("salon_crm.database")

Base = declarative_base()

import sys
import os
from sqlalchemy.pool import NullPool

def get_engine():
    db_url = settings.get_database_url()
    is_testing = "pytest" in sys.modules or os.environ.get("TESTING") == "1"
    pool_kwargs = {"poolclass": NullPool} if is_testing else {"pool_pre_ping": True, "pool_recycle": 3600}

    try:
        if "mysql" in db_url:
            # Test synchronous connection quickly
            import pymysql
            conn = pymysql.connect(
                host=settings.MYSQL_HOST,
                port=settings.MYSQL_PORT,
                user=settings.MYSQL_USER,
                password=settings.MYSQL_PASSWORD,
                connect_timeout=2
            )
            conn.close()
            logger.info("Successfully authenticated with local MySQL 8.0 server!")
            return create_async_engine(
                db_url,
                echo=False,
                **pool_kwargs
            )
    except Exception as e:
        logger.warning(
            f"MySQL connection with configured password failed: {e}. "
            "Falling back to high-performance local SQLite (./saloon.db). "
            "To connect to MySQL 8.0, simply update MYSQL_PASSWORD in backend/.env!"
        )
        return create_async_engine(
            "sqlite+aiosqlite:///./saloon.db",
            echo=False,
            **({"poolclass": NullPool} if is_testing else {})
        )

    return create_async_engine(
        db_url,
        echo=False,
        **pool_kwargs
    )

engine = get_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
