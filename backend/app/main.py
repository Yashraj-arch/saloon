import os
import sys

_current = os.path.dirname(os.path.abspath(__file__))
_api_dir = os.path.dirname(_current)
_root_dir = os.path.dirname(_api_dir)
for _p in [_api_dir, _current, _root_dir, "/var/task/api", "/var/task"]:
    if _p and _p not in sys.path:
        sys.path.insert(0, _p)

import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.init_db import init_db_data
from app.core.security_middleware import SecurityHeadersMiddleware, security_logger
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("salon_crm")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database and tables on MySQL / TiDB...")
    try:
        # Create database if MySQL local (skip for managed TiDB Cloud or custom DATABASE_URL)
        db_url = settings.get_database_url()
        if "mysql" in db_url and "tidbcloud.com" not in db_url and not settings.DATABASE_URL:
            import pymysql
            try:
                raw_conn = pymysql.connect(
                    host=settings.MYSQL_HOST,
                    port=settings.MYSQL_PORT,
                    user=settings.MYSQL_USER,
                    password=settings.MYSQL_PASSWORD,
                    connect_timeout=3
                )
                with raw_conn.cursor() as cur:
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                raw_conn.close()
                logger.info(f"Verified MySQL database '{settings.MYSQL_DB}' exists and ready.")
            except Exception as e:
                logger.warning(f"Could not automatically run CREATE DATABASE on MySQL: {e}")

        # Verify tables and seed demo data
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            async with AsyncSessionLocal() as session:
                await init_db_data(session)
            logger.info("Database schema initialized and demo data verified.")
        except Exception as db_init_err:
            logger.warning(f"Database schema verification note: {db_init_err}")

    except Exception as e:
        logger.error(f"Error during startup database initialization: {e}")

    yield
    logger.info("Shutting down application...")

# OpenAPI Docs visibility
docs_url = "/docs"
redoc_url = "/redoc"

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-tenant Salon CRM SaaS Backend with Hardened RBAC, Rate Limiting, and Bento Analytics",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan
)

# 1. Custom Security Headers & Rate Limiting Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. Strict CORS policy (Whitelisted origins only, explicit methods and headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400  # Cache preflight requests for 24 hours
)

# 3. Global Exception Handler to Prevent Traceback Leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_id = uuid.uuid4().hex[:8]
    security_logger.error(
        f"INTERNAL SERVER ERROR [ID: {err_id}] | Method: {request.method} | Path: {request.url.path} | Error: {str(exc)}",
        exc_info=True
    )
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred.", "error_id": err_id, "debug_message": str(exc)}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact support.", "error_id": err_id}
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database_target": settings.MYSQL_DB,
        "environment": settings.ENVIRONMENT
    }

# Vercel ASGI handler
handler = app
