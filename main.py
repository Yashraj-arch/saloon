import os
import sys

root_dir = os.path.dirname(os.path.abspath(__file__))
api_dir = os.path.join(root_dir, "api")
backend_dir = os.path.join(root_dir, "backend")

for p in [api_dir, os.path.join(api_dir, "app"), backend_dir, root_dir, "/var/task/api", "/var/task/backend", "/var/task"]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

try:
    from api.app.main import app
except Exception:
    from backend.app.main import app

handler = app
