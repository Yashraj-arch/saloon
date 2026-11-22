import logging
import sys
import os
import ssl
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings

logger = logging.getLogger("salon_crm.database")

Base = declarative_base()

def get_engine():
    db_url = settings.get_database_url()
    is_testing = "pytest" in sys.modules or os.environ.get("TESTING") == "1"
    is_serverless = os.environ.get("VERCEL") == "1" or is_testing
    pool_kwargs = {"poolclass": NullPool} if is_serverless else {"pool_pre_ping": True, "pool_recycle": 3600}

    connect_args = {}
    is_tidb = "tidbcloud.com" in db_url.lower() or settings.MYSQL_HOST.endswith("tidbcloud.com")
    if is_tidb or "ssl" in db_url.lower():
        ctx = ssl.create_default_context()
        connect_args["ssl"] = ctx
        if sys.platform == "win32":
            import asyncio
            try:
                asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            except Exception:
                pass

    try:
        if "mysql" in db_url:
            # If not remote/tidb, do a quick connectivity check for local MySQL
            if not is_tidb and not settings.DATABASE_URL:
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
                connect_args=connect_args,
                echo=False,
                **pool_kwargs
            )
    except Exception as e:
        logger.warning(
            f"MySQL connection failed: {e}. "
            "Falling back to high-performance local SQLite (./saloon.db)."
        )
        return create_async_engine(
            "sqlite+aiosqlite:///./saloon.db",
            echo=False,
            **({"poolclass": NullPool} if is_testing else {})
        )

    return create_async_engine(
        db_url,
        connect_args=connect_args,
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
