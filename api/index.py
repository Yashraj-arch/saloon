import os
import sys

_current = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_current, ".."))
_backend_dir = os.path.join(_root_dir, "backend")

for p in [_current, _backend_dir, _root_dir, "/var/task/api", "/var/task/backend", "/var/task"]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app, handler
except Exception:
    from backend.app.main import app, handler
