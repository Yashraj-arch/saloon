import time
import html
import logging
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings

# Dedicated security audit logger
security_logger = logging.getLogger("salon_crm.security")
security_logger.setLevel(logging.INFO)

# ----------------- Rate Limiting Engine -----------------
class RateLimiter:
    def __init__(self):
        # Maps IP to list of request timestamps
        self.ip_requests: Dict[str, List[float]] = defaultdict(list)
        self.ip_login_requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, ip: str, path: str) -> Tuple[bool, int]:
        now = time.time()
        window = 60.0  # 1 minute window

        if "/auth/login" in path:
            limit = settings.RATE_LIMIT_LOGIN_PER_MINUTE
            requests = self.ip_login_requests[ip]
            # Prune old timestamps
            self.ip_login_requests[ip] = [t for t in requests if now - t < window]
            if len(self.ip_login_requests[ip]) >= limit:
                return False, int(window - (now - self.ip_login_requests[ip][0]))
            self.ip_login_requests[ip].append(now)
            return True, 0
        else:
            limit = settings.RATE_LIMIT_GLOBAL_PER_MINUTE
            requests = self.ip_requests[ip]
            self.ip_requests[ip] = [t for t in requests if now - t < window]
            if len(self.ip_requests[ip]) >= limit:
                return False, int(window - (now - self.ip_requests[ip][0]))
            self.ip_requests[ip].append(now)
            return True, 0

rate_limiter = RateLimiter()

# ----------------- Security Headers & Protection Middleware -----------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rate Limiting Check
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        allowed, retry_after = rate_limiter.is_allowed(client_ip, path)
        if not allowed:
            security_logger.warning(
                f"RATE LIMIT EXCEEDED | IP: {client_ip} | Path: {path} | User-Agent: {request.headers.get('user-agent', 'unknown')}"
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down.", "retry_after_seconds": retry_after},
                headers={"Retry-After": str(retry_after)}
            )

        # 2. Process Request
        response: Response = await call_next(request)

        # 3. Add OWASP Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"

        # HSTS (Strict-Transport-Security)
        if request.url.scheme == "https" or settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        # Content Security Policy (CSP)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: blob:; "
            "script-src 'self'; "
            "frame-ancestors 'none';"
        )

        # Suppress identifying backend header
        if "server" in response.headers:
            del response.headers["server"]

        return response

# ----------------- XSS Sanitization Helper -----------------
def sanitize_input(val: Optional[str]) -> Optional[str]:
    """Escapes HTML entities to prevent stored XSS attacks."""
    if val is None:
        return None
    return html.escape(val.strip())
