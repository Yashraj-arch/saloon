from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Service, ServiceOption, User
from app.schemas import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    ServiceOptionCreate, ServiceOptionResponse
)
from app.api.deps import require_salon_owner, require_staff_or_owner

router = APIRouter(prefix="/services", tags=["Service Catalog & Options"])

@router.get("", response_model=List[ServiceResponse])
async def list_services(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    """
    List all services and their configurable options/modifiers.
    Both Staff and Owner can read services for billing and bookings.
    """
    query = (
        select(Service)
        .options(selectinload(Service.options))
        .where(Service.tenant_id == user.tenant_id, Service.is_active == True)
    )
    if category:
        query = query.where(Service.category == category)
    query = query.order_by(Service.category, Service.name)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Owner Only: Create a new service and attach dynamic options/modifiers.
    Example: Haircut with Shampoo options (L'Oreal, Keratin, Organic).
    """
    service = Service(
        tenant_id=owner.tenant_id,
        category=service_in.category,
        name=service_in.name,
        description=service_in.description,
        base_price=service_in.base_price,
        duration_minutes=service_in.duration_minutes,
        is_active=True
    )
    db.add(service)
    await db.flush()

    for opt in service_in.options:
        service_option = ServiceOption(
            service_id=service.id,
            group_name=opt.group_name,
            option_name=opt.option_name,
            extra_price=opt.extra_price,
            is_default=opt.is_default
        )
        db.add(service_option)

    await db.commit()

    # Re-query with eager loaded options
    stmt = (
        select(Service)
        .options(selectinload(Service.options))
        .where(Service.id == service.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()

@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """Owner Only: Update service metadata and base pricing."""
    stmt = (
        select(Service)
        .options(selectinload(Service.options))
        .where(Service.id == service_id, Service.tenant_id == owner.tenant_id)
    )
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_dict = service_update.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(service, k, v)

    await db.commit()
    await db.refresh(service)
    return service

@router.post("/{service_id}/options", response_model=ServiceOptionResponse, status_code=status.HTTP_201_CREATED)
async def add_service_option(
    service_id: int,
    opt_in: ServiceOptionCreate,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """Owner Only: Add an option/modifier to an existing service."""
    stmt = select(Service).where(Service.id == service_id, Service.tenant_id == owner.tenant_id)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    option = ServiceOption(
        service_id=service_id,
        group_name=opt_in.group_name,
        option_name=opt_in.option_name,
        extra_price=opt_in.extra_price,
        is_default=opt_in.is_default
    )
    db.add(option)
    await db.commit()
    await db.refresh(option)
    return option

@router.delete("/options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_option(
    option_id: int,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """Owner Only: Remove a specific modifier option."""
    stmt = (
        select(ServiceOption)
        .join(Service, ServiceOption.service_id == Service.id)
        .where(ServiceOption.id == option_id, Service.tenant_id == owner.tenant_id)
    )
    result = await db.execute(stmt)
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")

    await db.delete(option)
    await db.commit()
    return None
