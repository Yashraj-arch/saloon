import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.init_db import init_db_data
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("salon_crm")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database and tables...")
    try:
        # Create database if MySQL
        if "mysql" in settings.get_database_url():
            import pymysql
            try:
                raw_conn = pymysql.connect(
                    host=settings.MYSQL_HOST,
                    port=settings.MYSQL_PORT,
                    user=settings.MYSQL_USER,
                    password=settings.MYSQL_PASSWORD
                )
                with raw_conn.cursor() as cur:
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                raw_conn.close()
                logger.info(f"Verified MySQL database '{settings.MYSQL_DB}' exists.")
            except Exception as e:
                logger.warning(f"Could not automatically create MySQL database (check credentials): {e}")

        # Create all tables asynchronously
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")

        # Seed initial demo data
        async with AsyncSessionLocal() as session:
            await init_db_data(session)
        logger.info("Demo data verification/seeding completed.")

    except Exception as e:
        logger.error(f"Error during startup database initialization: {e}")

    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-tenant Salon CRM SaaS Backend with RBAC, Bento Analytics, and 1921-2099 Calendar",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database_target": settings.MYSQL_DB
    }
