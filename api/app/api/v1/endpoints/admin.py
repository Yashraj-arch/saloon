from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import User, Customer, CustomerAuditLog, Tenant
from app.schemas import UserCreate, UserUpdate, UserResponse, CustomerResponse, TenantResponse
from app.api.deps import require_salon_owner

router = APIRouter(prefix="/admin", tags=["Salon Owner Administration"])

@router.get("/profile", response_model=TenantResponse)
async def get_salon_profile(
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    stmt = select(Tenant).where(Tenant.id == owner.tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Salon not found")
    return tenant

# ----------------- Staff Management -----------------
@router.get("/staff", response_model=List[UserResponse])
async def list_staff(
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    stmt = select(User).where(
        User.tenant_id == owner.tenant_id,
        User.role == "STAFF"
    ).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    # Check duplicate email
    check = await db.execute(select(User).where(User.email == staff_in.email))
    if check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    staff_user = User(
        tenant_id=owner.tenant_id,
        email=staff_in.email,
        hashed_password=get_password_hash(staff_in.password),
        full_name=staff_in.full_name,
        role="STAFF",
        phone=staff_in.phone,
        commission_rate=staff_in.commission_rate or 0.0,
        is_active=True
    )
    db.add(staff_user)
    await db.commit()
    await db.refresh(staff_user)
    return staff_user

@router.patch("/staff/{staff_id}", response_model=UserResponse)
async def update_staff(
    staff_id: int,
    staff_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    stmt = select(User).where(
        User.id == staff_id,
        User.tenant_id == owner.tenant_id,
        User.role == "STAFF"
    )
    result = await db.execute(stmt)
    staff_user = result.scalar_one_or_none()
    if not staff_user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if staff_update.full_name is not None:
        staff_user.full_name = staff_update.full_name
    if staff_update.phone is not None:
        staff_user.phone = staff_update.phone
    if staff_update.commission_rate is not None:
        staff_user.commission_rate = staff_update.commission_rate
    if staff_update.is_active is not None:
        staff_user.is_active = staff_update.is_active
    if staff_update.password:
        staff_user.hashed_password = get_password_hash(staff_update.password)

    await db.commit()
    await db.refresh(staff_user)
    return staff_user

# ----------------- Soft-Deleted Customers Audit Vault -----------------
@router.get("/deleted-customers", response_model=List[CustomerResponse])
async def list_deleted_customers(
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Review all soft-deleted customers, the staff member who deleted them,
    and their mandatory deletion reason.
    """
    stmt = select(Customer).where(
        Customer.tenant_id == owner.tenant_id,
        Customer.is_deleted == True
    ).order_by(desc(Customer.deleted_at))
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/customers/{customer_id}/restore", response_model=CustomerResponse)
async def restore_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Owner 1-click restore of a soft-deleted customer.
    """
    stmt = select(Customer).where(
        Customer.id == customer_id,
        Customer.tenant_id == owner.tenant_id,
        Customer.is_deleted == True
    )
    result = await db.execute(stmt)
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Soft-deleted customer not found")

    customer.is_deleted = False
    customer.deletion_reason = None
    customer.deleted_at = None
    customer.deleted_by_user_id = None

    # Log audit event
    audit = CustomerAuditLog(
        tenant_id=owner.tenant_id,
        customer_id=customer.id,
        action="RESTORE",
        performed_by_user_id=owner.id,
        reason="Owner restored customer account"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(customer)
    return customer
