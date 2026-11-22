from datetime import date
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import User, Bill, BillItem
from app.schemas import StylistPayrollSummary
from app.api.deps import require_salon_owner

router = APIRouter(prefix="/payroll", tags=["Specialist Commission & Payroll"])

@router.get("/monthly-summary", response_model=List[StylistPayrollSummary])
async def get_monthly_payroll_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_salon_owner)
):
    """
    Computes earned commissions per stylist based on closed bills.
    Formula: Earned Commission = Sum(BillItem.final_price) * (Stylist Commission Rate / 100)
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        return []

    target_year = year or date.today().year
    target_month = month or date.today().month

    # Get all staff members for this salon
    staff_res = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.role == "STAFF")
    )
    staff_members = staff_res.scalars().all()

    # Get closed bills for this month
    bills_query = (
        select(Bill)
        .options(selectinload(Bill.items))
        .where(
            Bill.tenant_id == tenant_id,
            Bill.status == "PAID",
            extract("year", Bill.billed_at) == target_year,
            extract("month", Bill.billed_at) == target_month
        )
    )
    bills_res = await db.execute(bills_query)
    bills = bills_res.scalars().all()

    # Aggregate by staff_id
    payroll_data = []
    for staff in staff_members:
        staff_bills = [b for b in bills if b.staff_id == staff.id]
        total_services = sum(len(b.items) for b in staff_bills)
        total_revenue = sum((b.total_amount for b in staff_bills), Decimal("0.00"))
        
        # Calculate commission from commission_rate
        rate = Decimal(str(staff.commission_rate or 0.0))
        earned_commission = round(total_revenue * (rate / Decimal("100.0")), 2)

        payroll_data.append(
            StylistPayrollSummary(
                stylist_id=staff.id,
                stylist_name=staff.full_name,
                email=staff.email,
                commission_rate=staff.commission_rate,
                total_services_count=total_services,
                total_revenue_generated=total_revenue,
                total_commission_earned=earned_commission,
                is_active=staff.is_active
            )
        )

    return payroll_data
