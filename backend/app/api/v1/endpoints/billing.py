import json
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Bill, BillItem, Customer, Service, User
from app.schemas import BillCreate, BillResponse, BillItemResponse
from app.api.deps import require_staff_or_owner

router = APIRouter(prefix="/billing", tags=["POS & Invoicing"])

def generate_invoice_number() -> str:
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"INV-{now_str}-{short_uuid}"

@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    bill_in: BillCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    """
    Generate customer invoice with base service prices and selected modifier options.
    """
    # Verify customer exists in this tenant
    cust_stmt = select(Customer).where(
        Customer.id == bill_in.customer_id,
        Customer.tenant_id == user.tenant_id,
        Customer.is_deleted == False
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Active customer not found")

    staff_name = None
    if bill_in.staff_id:
        st_stmt = select(User).where(User.id == bill_in.staff_id, User.tenant_id == user.tenant_id)
        st_res = await db.execute(st_stmt)
        staff_user = st_res.scalar_one_or_none()
        if staff_user:
            staff_name = staff_user.full_name

    subtotal = Decimal("0.00")
    bill_items_to_create = []

    for item in bill_in.items:
        srv_stmt = select(Service).where(Service.id == item.service_id, Service.tenant_id == user.tenant_id)
        srv_res = await db.execute(srv_stmt)
        service = srv_res.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=400, detail=f"Service ID {item.service_id} not found in this salon")

        item_total = service.base_price
        options_detail = []
        for opt in item.selected_options:
            item_total += opt.extra_price
            options_detail.append({
                "group_name": opt.group_name,
                "option_name": opt.option_name,
                "extra_price": float(opt.extra_price)
            })

        subtotal += item_total
        bill_items_to_create.append({
            "service_id": service.id,
            "service_name": service.name,
            "base_price": service.base_price,
            "options_json": json.dumps(options_detail),
            "final_price": item_total
        })

    discount = bill_in.discount_amount if bill_in.discount_amount < subtotal else Decimal("0.00")
    tax = Decimal("0.00")  # configurable tax
    total = (subtotal - discount) + tax

    bill = Bill(
        tenant_id=user.tenant_id,
        invoice_number=generate_invoice_number(),
        customer_id=customer.id,
        staff_id=bill_in.staff_id,
        billed_by_id=user.id,
        subtotal=subtotal,
        discount_amount=discount,
        tax_amount=tax,
        total_amount=total,
        payment_method=bill_in.payment_method,
        status="PAID",
        notes=bill_in.notes,
        billed_at=datetime.now(timezone.utc)
    )
    db.add(bill)
    await db.flush()

    # Add items
    for item_data in bill_items_to_create:
        b_item = BillItem(
            bill_id=bill.id,
            service_id=item_data["service_id"],
            service_name=item_data["service_name"],
            base_price=item_data["base_price"],
            selected_options_json=item_data["options_json"],
            final_price=item_data["final_price"]
        )
        db.add(b_item)

    await db.commit()

    # Fetch complete bill response
    query = (
        select(Bill)
        .options(selectinload(Bill.items), selectinload(Bill.customer), selectinload(Bill.staff))
        .where(Bill.id == bill.id)
    )
    res = await db.execute(query)
    saved_bill = res.scalar_one()

    return BillResponse(
        id=saved_bill.id,
        tenant_id=saved_bill.tenant_id,
        invoice_number=saved_bill.invoice_number,
        customer_id=saved_bill.customer_id,
        customer_name=customer.full_name,
        staff_id=saved_bill.staff_id,
        staff_name=staff_name,
        subtotal=saved_bill.subtotal,
        tax_amount=saved_bill.tax_amount,
        discount_amount=saved_bill.discount_amount,
        total_amount=saved_bill.total_amount,
        payment_method=saved_bill.payment_method,
        status=saved_bill.status,
        notes=saved_bill.notes,
        billed_at=saved_bill.billed_at,
        items=[
            BillItemResponse(
                id=bi.id,
                service_id=bi.service_id,
                service_name=bi.service_name,
                base_price=bi.base_price,
                selected_options_json=bi.selected_options_json,
                final_price=bi.final_price
            ) for bi in saved_bill.items
        ]
    )

@router.get("", response_model=List[BillResponse])
async def list_bills(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_staff_or_owner)
):
    query = (
        select(Bill)
        .options(selectinload(Bill.items), selectinload(Bill.customer), selectinload(Bill.staff))
        .where(Bill.tenant_id == user.tenant_id)
        .order_by(desc(Bill.billed_at))
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    bills = result.scalars().all()

    response_list = []
    for b in bills:
        response_list.append(
            BillResponse(
                id=b.id,
                tenant_id=b.tenant_id,
                invoice_number=b.invoice_number,
                customer_id=b.customer_id,
                customer_name=b.customer.full_name if b.customer else "Unknown",
                staff_id=b.staff_id,
                staff_name=b.staff.full_name if b.staff else "Unassigned",
                subtotal=b.subtotal,
                tax_amount=b.tax_amount,
                discount_amount=b.discount_amount,
                total_amount=b.total_amount,
                payment_method=b.payment_method,
                status=b.status,
                notes=b.notes,
                billed_at=b.billed_at,
                items=[
                    BillItemResponse(
                        id=bi.id,
                        service_id=bi.service_id,
                        service_name=bi.service_name,
                        base_price=bi.base_price,
                        selected_options_json=bi.selected_options_json,
                        final_price=bi.final_price
                    ) for bi in b.items
                ]
            )
        )
    return response_list
