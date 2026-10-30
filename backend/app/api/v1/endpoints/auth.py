from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.security_middleware import security_logger
from app.models import User, Tenant
from app.schemas import Token, LoginRequest, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    stmt = select(User).where(User.email == login_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        security_logger.warning(
            f"AUTH_FAILURE | IP: {client_ip} | Attempted Email: {login_data.email} | Reason: Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        security_logger.warning(
            f"AUTH_BLOCKED | IP: {client_ip} | Email: {login_data.email} | Reason: Account deactivated"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support or your salon owner."
        )

    salon_name = None
    if user.tenant_id:
        tenant_stmt = select(Tenant).where(Tenant.id == user.tenant_id)
        tenant_res = await db.execute(tenant_stmt)
        tenant = tenant_res.scalar_one_or_none()
        if tenant:
            if not tenant.is_active or tenant.subscription_status == "SUSPENDED":
                security_logger.warning(
                    f"TENANT_SUSPENDED | IP: {client_ip} | Tenant ID: {user.tenant_id} | Email: {user.email}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This salon's subscription is inactive or suspended. Please contact the platform admin."
                )
            salon_name = tenant.name

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        tenant_id=user.tenant_id
    )

    security_logger.info(
        f"AUTH_SUCCESS | IP: {client_ip} | User ID: {user.id} | Email: {user.email} | Role: {user.role}"
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        tenant_id=user.tenant_id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        salon_name=salon_name
    )

@router.post("/token", response_model=Token, include_in_schema=False)
async def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    login_req = LoginRequest(email=form_data.username, password=form_data.password)
    return await login(login_req, request, db)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
