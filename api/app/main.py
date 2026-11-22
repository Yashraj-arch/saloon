import os
import sys
import traceback

_current = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current)
_root_dir = os.path.dirname(_backend_dir)
for _p in [_backend_dir, _current, _root_dir, "/var/task/backend", "/var/task"]:
    if _p and _p not in sys.path:
        sys.path.insert(0, _p)

try:
    import uuid
    import logging
    from contextlib import asynccontextmanager
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    from sqlalchemy import text

    from app.core.config import settings
    from app.core.database import engine, Base, AsyncSessionLocal
    from app.core.security_middleware import SecurityHeadersMiddleware, security_logger
    from app.api.v1.router import api_router

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("salon_crm")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("Lux Multi-Tenant API initialized.")
        yield

    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Multi-tenant Salon CRM SaaS Backend with Hardened RBAC, Rate Limiting, and Bento Analytics",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    # 1. Custom Security Headers & Rate Limiting Middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # 2. Strict CORS policy
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_origin_regex=r"^https://.*\.vercel\.app$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        max_age=86400
    )

    # 3. Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        err_id = uuid.uuid4().hex[:8]
        security_logger.error(
            f"INTERNAL SERVER ERROR [ID: {err_id}] | Method: {request.method} | Path: {request.url.path} | Error: {str(exc)}",
            exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred.", "error_id": err_id, "debug_message": str(exc)}
        )

    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/api", tags=["Health"])
    @app.get("/api/", tags=["Health"])
    @app.get("/api/index", tags=["Health"])
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

except Exception as fatal_e:
    err_tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Lux API Diagnostic Fallback")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    def fatal_diag(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "FastAPI Initialization Failed",
                "message": str(fatal_e),
                "traceback": err_tb,
                "sys_path": sys.path,
                "current_dir": _current
            }
        )
