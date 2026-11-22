import os
import sys

_current = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.join(_current, "backend")

for _p in [_backend_dir, _current, "/var/task/backend", "/var/task"]:
    if _p and _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from app.main import app
except Exception:
    from backend.app.main import app
