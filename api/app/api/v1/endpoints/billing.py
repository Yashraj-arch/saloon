import json
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security_middleware import sanitize_input, security_logger
from app.models import Bill, BillItem, Customer, Service, ServiceOption, User
from app.schemas import BillCreate, BillResponse, BillItemResponse
from app.api.deps import require_staff_or_owner

router = APIRouter(prefix="/billing", tags=["POS & Invoicing"])

ALLOWED_PAYMENT_METHODS = {"CASH", "UPI", "CARD", "SPLIT"}

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
    Generate customer invoice.
    SECURITY HARDENING: Prices and modifiers are strictly verified against the database
    to prevent client-side price tampering. Discounts are strictly bound.
    """
    # 1. Validate payment method
    pay_method = bill_in.payment_method.strip().upper()
    if pay_method not in ALLOWED_PAYMENT_METHODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment method '{bill_in.payment_method}'. Allowed: {list(ALLOWED_PAYMENT_METHODS)}"
        )

    # 2. Verify customer exists in this tenant
    cust_stmt = select(Customer).where(
        Customer.id == bill_in.customer_id,
        Customer.tenant_id == user.tenant_id,
        Customer.is_deleted == False
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Active customer not found in this salon")

    staff_name = None
    if bill_in.staff_id:
        st_stmt = select(User).where(User.id == bill_in.staff_id, User.tenant_id == user.tenant_id)
        st_res = await db.execute(st_stmt)
        staff_user = st_res.scalar_one_or_none()
        if staff_user:
            staff_name = staff_user.full_name

    subtotal = Decimal("0.00")
    bill_items_to_create = []

    # 3. Server-side price calculation & verification
    for item in bill_in.items:
        srv_stmt = select(Service).where(Service.id == item.service_id, Service.tenant_id == user.tenant_id)
        srv_res = await db.execute(srv_stmt)
        service = srv_res.scalar_one_or_none()
        if not service or not service.is_active:
            raise HTTPException(status_code=400, detail=f"Active Service ID {item.service_id} not found in this salon")

        item_total = Decimal(str(service.base_price))
        options_detail = []

        for opt in item.selected_options:
            # Query verified option price from DB to reject client tampering
            opt_stmt = select(ServiceOption).where(
                ServiceOption.service_id == service.id,
                ServiceOption.group_name == opt.group_name,
                ServiceOption.option_name == opt.option_name
            )
            opt_res = await db.execute(opt_stmt)
            db_option = opt_res.scalar_one_or_none()
            verified_extra = Decimal(str(db_option.extra_price)) if db_option else Decimal("0.00")

            item_total += verified_extra
            options_detail.append({
                "group_name": opt.group_name,
                "option_name": opt.option_name,
                "extra_price": float(verified_extra)
            })

        subtotal += item_total
        bill_items_to_create.append({
            "service_id": service.id,
            "service_name": service.name,
            "base_price": service.base_price,
            "options_json": json.dumps(options_detail),
            "final_price": item_total
        })

    # 4. Validate discount
    if bill_in.discount_amount < Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount amount cannot be negative")
    
    # Discount cannot exceed subtotal
    discount = min(bill_in.discount_amount, subtotal)
    tax = Decimal("0.00")
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
        payment_method=pay_method,
        status="PAID",
        notes=sanitize_input(bill_in.notes),
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

    security_logger.info(
        f"INVOICE_GENERATED | Tenant ID: {user.tenant_id} | Invoice: {bill.invoice_number} | Amount: ₹{total} | Payment: {pay_method} | Staff ID: {user.id}"
    )

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
        .limit(min(limit, 100))  # Max 100 to prevent resource exhaustion attacks
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
