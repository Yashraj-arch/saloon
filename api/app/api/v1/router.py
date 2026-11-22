from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    superadmin,
    admin,
    customers,
    services,
    billing,
    analytics,
    attendance,
    expenses,
    payroll,
    export,
    verify
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(superadmin.router)
api_router.include_router(admin.router)
api_router.include_router(customers.router)
api_router.include_router(services.router)
api_router.include_router(billing.router)
api_router.include_router(analytics.router)
api_router.include_router(attendance.router)
api_router.include_router(expenses.router)
api_router.include_router(payroll.router)
api_router.include_router(export.router)
api_router.include_router(verify.router)
