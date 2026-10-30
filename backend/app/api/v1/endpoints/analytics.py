import calendar
from typing import List, Optional
from datetime import datetime, date, time, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Bill, BillItem, Customer, Service, User
from app.schemas import RevenueSummary, CalendarDayRevenue, CalendarDrilldownResponse, BillResponse, BillItemResponse
from app.api.deps import require_salon_owner

router = APIRouter(prefix="/analytics", tags=["Revenue Analytics & 1921-2099 Calendar"])

@router.get("/summary", response_model=RevenueSummary)
async def get_revenue_summary(
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Salon Owner Revenue Dashboard: Daily, Weekly, Monthly, and Yearly revenue.
    Strictly isolated: Super Admin or other salons cannot view this.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min)
    week_start = today_start - timedelta(days=7)
    month_start = datetime(now.year, now.month, 1)
    year_start = datetime(now.year, 1, 1)

    tenant_id = owner.tenant_id

    # Daily Revenue & Count
    daily_query = select(
        func.coalesce(func.sum(Bill.total_amount), 0),
        func.count(Bill.id)
    ).where(
        Bill.tenant_id == tenant_id,
        Bill.billed_at >= today_start,
        Bill.status == "PAID"
    )
    daily_res = await db.execute(daily_query)
    daily_rev, today_bills = daily_res.one()

    # Weekly Revenue
    weekly_query = select(func.coalesce(func.sum(Bill.total_amount), 0)).where(
        Bill.tenant_id == tenant_id,
        Bill.billed_at >= week_start,
        Bill.status == "PAID"
    )
    weekly_rev = (await db.execute(weekly_query)).scalar_one()

    # Monthly Revenue
    monthly_query = select(func.coalesce(func.sum(Bill.total_amount), 0)).where(
        Bill.tenant_id == tenant_id,
        Bill.billed_at >= month_start,
        Bill.status == "PAID"
    )
    monthly_rev = (await db.execute(monthly_query)).scalar_one()

    # Yearly Revenue
    yearly_query = select(func.coalesce(func.sum(Bill.total_amount), 0)).where(
        Bill.tenant_id == tenant_id,
        Bill.billed_at >= year_start,
        Bill.status == "PAID"
    )
    yearly_rev = (await db.execute(yearly_query)).scalar_one()

    # Distinct customers served today
    cust_query = select(func.count(func.distinct(Bill.customer_id))).where(
        Bill.tenant_id == tenant_id,
        Bill.billed_at >= today_start,
        Bill.status == "PAID"
    )
    today_cust = (await db.execute(cust_query)).scalar_one()

    # Active Staff count
    staff_query = select(func.count(User.id)).where(
        User.tenant_id == tenant_id,
        User.role == "STAFF",
        User.is_active == True
    )
    staff_count = (await db.execute(staff_query)).scalar_one()

    # Active Services count
    srv_query = select(func.count(Service.id)).where(
        Service.tenant_id == tenant_id,
        Service.is_active == True
    )
    srv_count = (await db.execute(srv_query)).scalar_one()

    ats = Decimal("0.00")
    if today_bills > 0:
        ats = Decimal(daily_rev) / Decimal(today_bills)

    return RevenueSummary(
        daily_revenue=Decimal(daily_rev),
        weekly_revenue=Decimal(weekly_rev),
        monthly_revenue=Decimal(monthly_rev),
        yearly_revenue=Decimal(yearly_rev),
        today_bills_count=today_bills,
        today_customers_count=today_cust,
        average_ticket_size=round(ats, 2),
        active_staff_count=staff_count,
        total_active_services=srv_count
    )


@router.get("/calendar-month", response_model=List[CalendarDayRevenue])
async def get_calendar_month_revenue(
    year: int = Query(..., ge=1921, le=2099, description="Target year between 1921 and 2099"),
    month: int = Query(..., ge=1, le=12, description="Target month 1-12"),
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Interactive 1921-2099 Bento Calendar Engine:
    Returns day-by-day revenue totals and heatmap intensities for any year/month.
    """
    days_in_month = calendar.monthrange(year, month)[1]
    start_dt = datetime(year, month, 1, 0, 0, 0)
    end_dt = datetime(year, month, days_in_month, 23, 59, 59)

    stmt = (
        select(
            func.date(Bill.billed_at).label("bill_date"),
            func.coalesce(func.sum(Bill.total_amount), 0).label("revenue"),
            func.count(Bill.id).label("bill_count")
        )
        .where(
            Bill.tenant_id == owner.tenant_id,
            Bill.billed_at >= start_dt,
            Bill.billed_at <= end_dt,
            Bill.status == "PAID"
        )
        .group_by(func.date(Bill.billed_at))
    )
    result = await db.execute(stmt)
    records = {str(row.bill_date): (Decimal(row.revenue), int(row.bill_count)) for row in result.all()}

    # Calculate average revenue for heatmap thresholding
    all_revs = [rev for rev, _ in records.values() if rev > 0]
    avg_rev = (sum(all_revs) / len(all_revs)) if all_revs else Decimal(1000)

    calendar_days = []
    for d in range(1, days_in_month + 1):
        dt_str = f"{year:04d}-{month:02d}-{d:02d}"
        if dt_str in records:
            rev, count = records[dt_str]
            if rev >= avg_rev * Decimal("1.4"):
                intensity = "high"
            elif rev >= avg_rev * Decimal("0.7"):
                intensity = "medium"
            else:
                intensity = "low"
        else:
            rev = Decimal("0.00")
            count = 0
            intensity = "none"

        calendar_days.append(
            CalendarDayRevenue(
                date=dt_str,
                total_revenue=rev,
                bills_count=count,
                intensity=intensity
            )
        )

    return calendar_days


@router.get("/calendar-drilldown", response_model=CalendarDrilldownResponse)
async def get_calendar_day_drilldown(
    date_str: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format (1921 to 2099)"),
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Day Drilldown Drawer:
    When an owner clicks any date in the 1921-2099 calendar, returns exact bills,
    staff performance breakdown, and top services rendered on that day.
    """
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    if target_date.year < 1921 or target_date.year > 2099:
        raise HTTPException(status_code=400, detail="Year must be between 1921 and 2099")

    start_dt = datetime.combine(target_date, time.min)
    end_dt = datetime.combine(target_date, time.max)

    # Fetch bills
    bills_stmt = (
        select(Bill)
        .options(selectinload(Bill.items), selectinload(Bill.customer), selectinload(Bill.staff))
        .where(
            Bill.tenant_id == owner.tenant_id,
            Bill.billed_at >= start_dt,
            Bill.billed_at <= end_dt,
            Bill.status == "PAID"
        )
        .order_by(desc(Bill.billed_at))
    )
    bills_res = await db.execute(bills_stmt)
    bills = bills_res.scalars().all()

    total_revenue = sum(b.total_amount for b in bills)

    # Top services on this day
    srv_stmt = (
        select(
            BillItem.service_name,
            func.count(BillItem.id).label("count"),
            func.sum(BillItem.final_price).label("revenue")
        )
        .join(Bill, BillItem.bill_id == Bill.id)
        .where(
            Bill.tenant_id == owner.tenant_id,
            Bill.billed_at >= start_dt,
            Bill.billed_at <= end_dt,
            Bill.status == "PAID"
        )
        .group_by(BillItem.service_name)
        .order_by(desc("revenue"))
        .limit(5)
    )
    top_srv_rows = (await db.execute(srv_stmt)).all()
    top_services = [
        {"service_name": r.service_name, "count": r.count, "revenue": float(r.revenue)}
        for r in top_srv_rows
    ]

    # Staff breakdown on this day
    staff_stmt = (
        select(
            User.full_name,
            func.count(Bill.id).label("bill_count"),
            func.sum(Bill.total_amount).label("revenue")
        )
        .join(Bill, Bill.staff_id == User.id)
        .where(
            Bill.tenant_id == owner.tenant_id,
            Bill.billed_at >= start_dt,
            Bill.billed_at <= end_dt,
            Bill.status == "PAID"
        )
        .group_by(User.full_name)
        .order_by(desc("revenue"))
    )
    staff_rows = (await db.execute(staff_stmt)).all()
    staff_breakdown = [
        {"staff_name": r.full_name, "bill_count": r.bill_count, "revenue": float(r.revenue)}
        for r in staff_rows
    ]

    bills_formatted = [
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
        ) for b in bills
    ]

    return CalendarDrilldownResponse(
        date=date_str,
        total_revenue=total_revenue,
        bills_count=len(bills),
        bills=bills_formatted,
        top_services=top_services,
        staff_breakdown=staff_breakdown
    )


@router.get("/revenue-chart")
async def get_revenue_chart(
    period: str = Query("week", regex="^(week|month|year)$"),
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_salon_owner)
):
    """
    Returns chart-ready points for Bento UI visualizers.
    """
    now = datetime.now(timezone.utc)
    points = []

    if period == "week":
        for i in range(6, -1, -1):
            d = now.date() - timedelta(days=i)
            st = datetime.combine(d, time.min)
            en = datetime.combine(d, time.max)
            stmt = select(func.coalesce(func.sum(Bill.total_amount), 0)).where(
                Bill.tenant_id == owner.tenant_id,
                Bill.billed_at >= st,
                Bill.billed_at <= en,
                Bill.status == "PAID"
            )
            rev = (await db.execute(stmt)).scalar_one()
            points.append({
                "label": d.strftime("%a (%d)"),
                "date": d.strftime("%Y-%m-%d"),
                "revenue": float(rev)
            })

    elif period == "month":
        # Break into 4 weeks
        for week_idx in range(4):
            end_d = now.date() - timedelta(days=week_idx * 7)
            start_d = end_d - timedelta(days=6)
            st = datetime.combine(start_d, time.min)
            en = datetime.combine(end_d, time.max)
            stmt = select(func.coalesce(func.sum(Bill.total_amount), 0)).where(
                Bill.tenant_id == owner.tenant_id,
                Bill.billed_at >= st,
                Bill.billed_at <= en,
                Bill.status == "PAID"
            )
            rev = (await db.execute(stmt)).scalar_one()
            points.insert(0, {
                "label": f"W{4 - week_idx} ({start_d.strftime('%b %d')})",
                "revenue": float(rev)
            })

    elif period == "year":
        # 12 months of current year
        for m in range(1, 13):
            days_in_m = calendar.monthrange(now.year, m)[1]
            st = datetime(now.year, m, 1, 0, 0, 0)
            en = datetime(now.year, m, days_in_m, 23, 59, 59)
            stmt = select(func.coalesce(func.sum(Bill.total_amount), 0)).where(
                Bill.tenant_id == owner.tenant_id,
                Bill.billed_at >= st,
                Bill.billed_at <= en,
                Bill.status == "PAID"
            )
            rev = (await db.execute(stmt)).scalar_one()
            points.append({
                "label": calendar.month_abbr[m],
                "month": m,
                "revenue": float(rev)
            })

    return {"period": period, "data": points}
