from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.models import User, Tenant
from app.schemas import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(
            sub=user_id,
            role=payload.get("role"),
            tenant_id=payload.get("tenant_id")
        )
    except JWTError:
        raise credentials_exception

    stmt = select(User).where(User.id == int(token_data.sub))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or non-existent user account"
        )
    return user


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Super Admin: Manages subscriptions and salon provisioning only."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Super Admin privilege required"
        )
    return current_user


def require_salon_owner(current_user: User = Depends(get_current_user)) -> User:
    """
    Salon Owner / Admin: Access salon revenue, staff, service options, 1921-2099 calendar.
    Super Admins are EXPLICITLY FORBIDDEN from viewing salon financial and customer metrics!
    """
    if current_user.role != "SALON_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Only the verified Salon Owner can access revenue analytics and settings"
        )
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No salon tenant associated with this account"
        )
    return current_user


def require_staff_or_owner(current_user: User = Depends(get_current_user)) -> User:
    """
    Staff or Salon Owner: Customer management, POS billing, and appointments.
    """
    if current_user.role not in ["SALON_OWNER", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Salon Staff or Owner access required"
        )
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No salon tenant associated with this account"
        )
    return current_user
