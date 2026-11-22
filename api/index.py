import os
import sys

# Ensure both api/ and backend/ are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for p in [current_dir, backend_dir, root_dir, "/var/task/api", "/var/task/backend", "/var/task"]:
    if p and os.path.exists(p) and p not in sys.path:
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

        app = FastAPI(title="Lux API Initialization Diagnostics")

        @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
        def error_handler(path: str):
            return JSONResponse(
                status_code=500,
                content={
                    "error": "FastAPI Initialization Failed",
                    "message": str(e),
                    "traceback": err_tb,
                    "current_dir": current_dir,
                    "root_exists": os.path.exists(root_dir),
                    "root_files": os.listdir(root_dir) if os.path.exists(root_dir) else [],
                }
            )

# Vercel ASGI entrypoint
handler = app
