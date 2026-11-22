import os
import sys

_current = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_current, ".."))
_backend_dir = os.path.join(_root_dir, "backend")

for p in [_backend_dir, _root_dir, "/var/task/backend", "/var/task"]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except Exception:
    try:
        from backend.app.main import app
    except Exception as e:
        import traceback
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
                    "message": str(e),
                    "traceback": err_tb,
                    "sys_path": sys.path
                }
            )
