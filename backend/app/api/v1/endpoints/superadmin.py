import re
from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import Tenant, User
from app.schemas import TenantCreate, TenantUpdate, TenantResponse
from app.api.deps import require_super_admin

router = APIRouter(prefix="/superadmin", tags=["Super Admin Platform Console"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[-\s]+', '-', text)

@router.get("/salons", response_model=List[TenantResponse])
async def list_salons(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Super Admin listing of all salon subscriptions.
    Privacy Guarantee: Exposes only tenant profiles and subscription license states.
    """
    stmt = select(Tenant).order_by(Tenant.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/salons", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_salon(
    salon_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Provision a new salon tenant and generate their Owner credentials.
    """
    # Check email uniqueness
    existing_user = await db.execute(select(User).where(User.email == salon_in.contact_email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this contact email already exists."
        )

    base_slug = slugify(salon_in.name)
    slug = base_slug
    counter = 1
    while True:
        check_slug = await db.execute(select(Tenant).where(Tenant.slug == slug))
        if not check_slug.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # 1 year subscription by default
    expires_at = datetime.now(timezone.utc) + timedelta(days=365)

    tenant = Tenant(
        name=salon_in.name,
        slug=slug,
        owner_name=salon_in.owner_name,
        contact_email=salon_in.contact_email,
        contact_phone=salon_in.contact_phone,
        address=salon_in.address,
        subscription_plan=salon_in.subscription_plan,
        subscription_status="ACTIVE",
        subscription_expires_at=expires_at,
        is_active=True
    )
    db.add(tenant)
    await db.flush()  # to obtain tenant.id

    # Create Salon Owner Account
    owner_user = User(
        tenant_id=tenant.id,
        email=salon_in.contact_email,
        hashed_password=get_password_hash(salon_in.initial_owner_password),
        full_name=salon_in.owner_name,
        role="SALON_OWNER",
        phone=salon_in.contact_phone,
        is_active=True
    )
    db.add(owner_user)
    await db.commit()
    await db.refresh(tenant)

    return tenant

@router.patch("/salons/{salon_id}", response_model=TenantResponse)
async def update_salon_subscription(
    salon_id: int,
    salon_update: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    stmt = select(Tenant).where(Tenant.id == salon_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail="Salon tenant not found")

    update_dict = salon_update.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(tenant, field, value)

    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.post("/salons/{salon_id}/toggle-status", response_model=TenantResponse)
async def toggle_salon_status(
    salon_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    stmt = select(Tenant).where(Tenant.id == salon_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Salon tenant not found")

    tenant.is_active = not tenant.is_active
    tenant.subscription_status = "ACTIVE" if tenant.is_active else "SUSPENDED"
    await db.commit()
    await db.refresh(tenant)
    return tenant
