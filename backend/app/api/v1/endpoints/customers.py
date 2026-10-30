from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc

from app.core.database import get_db
from app.models import Customer, CustomerAuditLog, User
from app.schemas import CustomerCreate, CustomerUpdate, CustomerSoftDelete, CustomerResponse
from app.api.deps import require_staff_or_owner

router = APIRouter(prefix="/customers", tags=["Customer Management"])

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    query = select(Customer).where(Customer.tenant_id == user.tenant_id)

    if not include_deleted:
        query = query.where(Customer.is_deleted == False)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Customer.full_name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
                Customer.email.ilike(search_pattern)
            )
        )

    query = query.order_by(desc(Customer.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    # Check if existing customer with same phone in this salon
    stmt = select(Customer).where(
        Customer.tenant_id == user.tenant_id,
        Customer.phone == customer_in.phone,
        Customer.is_deleted == False
    )
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An active customer with phone {customer_in.phone} already exists in this salon."
        )

    customer = Customer(
        tenant_id=user.tenant_id,
        full_name=customer_in.full_name,
        phone=customer_in.phone,
        email=customer_in.email,
        gender=customer_in.gender,
        birth_date=customer_in.birth_date,
        notes=customer_in.notes,
        is_deleted=False
    )
    db.add(customer)
    await db.flush()

    # Log creation audit
    audit = CustomerAuditLog(
        tenant_id=user.tenant_id,
        customer_id=customer.id,
        action="CREATE",
        performed_by_user_id=user.id,
        reason="Initial customer registration"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(customer)
    return customer

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    stmt = select(Customer).where(
        Customer.id == customer_id,
        Customer.tenant_id == user.tenant_id
    )
    result = await db.execute(stmt)
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    update_data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    stmt = select(Customer).where(
        Customer.id == customer_id,
        Customer.tenant_id == user.tenant_id,
        Customer.is_deleted == False
    )
    result = await db.execute(stmt)
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Active customer not found")

    data = update_data.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(customer, field, val)

    # Log update
    audit = CustomerAuditLog(
        tenant_id=user.tenant_id,
        customer_id=customer.id,
        action="UPDATE",
        performed_by_user_id=user.id,
        details=f"Updated fields: {list(data.keys())}"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(customer)
    return customer

@router.post("/{customer_id}/delete", response_model=CustomerResponse)
async def soft_delete_customer(
    customer_id: int,
    delete_payload: CustomerSoftDelete,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    """
    Soft-delete customer record.
    CRITICAL REQUIREMENT: Staff CANNOT delete a customer without providing a valid deletion reason.
    Record is preserved in the database with audit tracking.
    """
    if not delete_payload.reason or len(delete_payload.reason.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A detailed reason for deletion is mandatory (minimum 5 characters)."
        )

    stmt = select(Customer).where(
        Customer.id == customer_id,
        Customer.tenant_id == user.tenant_id,
        Customer.is_deleted == False
    )
    result = await db.execute(stmt)
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=404, detail="Active customer not found")

    customer.is_deleted = True
    customer.deletion_reason = delete_payload.reason.strip()
    customer.deleted_by_user_id = user.id
    customer.deleted_at = datetime.now(timezone.utc)

    # Audit log entry
    audit = CustomerAuditLog(
        tenant_id=user.tenant_id,
        customer_id=customer.id,
        action="SOFT_DELETE",
        performed_by_user_id=user.id,
        reason=delete_payload.reason.strip()
    )
    db.add(audit)

    await db.commit()
    await db.refresh(customer)
    return customer
