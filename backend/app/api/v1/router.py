from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    superadmin,
    admin,
    customers,
    services,
    billing,
    analytics
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(superadmin.router)
api_router.include_router(admin.router)
api_router.include_router(customers.router)
api_router.include_router(services.router)
api_router.include_router(billing.router)
api_router.include_router(analytics.router)
