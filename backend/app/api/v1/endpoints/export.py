import io
import csv
from datetime import date
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import User, Bill, Expense
from app.api.deps import require_salon_owner

router = APIRouter(prefix="/export", tags=["Accounting CSV Export"])

@router.get("/bills-csv")
async def export_bills_csv(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_salon_owner)
):
    """
    Exports closed invoices to clean standard CSV for bookkeeping and Excel accounting.
    """
    tenant_id = current_user.tenant_id
    conditions = [Bill.tenant_id == tenant_id]
    if year:
        conditions.append(extract("year", Bill.billed_at) == year)
    if month:
        conditions.append(extract("month", Bill.billed_at) == month)

    query = (
        select(Bill)
        .options(selectinload(Bill.customer), selectinload(Bill.staff))
        .where(and_(*conditions))
        .order_by(Bill.billed_at.desc())
    )
    result = await db.execute(query)
    bills = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number",
        "Date",
        "Client Name",
        "Assigned Stylist",
        "Subtotal (INR)",
        "Discount (INR)",
        "Total Paid (INR)",
        "Payment Mode",
        "Status"
    ])

    for b in bills:
        writer.writerow([
            b.invoice_number,
            b.billed_at.strftime("%Y-%m-%d %H:%M"),
            b.customer.full_name if b.customer else "Walk-in Guest",
            b.staff.full_name if b.staff else "Front Desk",
            float(b.subtotal),
            float(b.discount_amount),
            float(b.total_amount),
            b.payment_method,
            b.status
        ])

    csv_data = output.getvalue()
    filename = f"Lux_Bills_{year or 'all'}_{month or 'all'}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pnl-csv")
async def export_pnl_csv(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_salon_owner)
):
    """
    Exports Profit & Loss Statement (Gross Revenue, Commissions, Expenses, Net Profit).
    """
    tenant_id = current_user.tenant_id
    target_year = year or date.today().year
    target_month = month or date.today().month

    # 1. Total revenue
    bills_q = (
        select(Bill)
        .options(selectinload(Bill.staff))
        .where(
            Bill.tenant_id == tenant_id,
            Bill.status == "PAID",
            extract("year", Bill.billed_at) == target_year,
            extract("month", Bill.billed_at) == target_month
        )
    )
    bills = (await db.execute(bills_q)).scalars().all()
    gross_revenue = sum((b.total_amount for b in bills), Decimal("0.00"))

    # 2. Commissions
    commissions = Decimal("0.00")
    for b in bills:
        if b.staff and b.staff.commission_rate:
            commissions += b.total_amount * (Decimal(str(b.staff.commission_rate)) / Decimal("100.0"))
    commissions = round(commissions, 2)

    # 3. Expenses
    expenses_q = select(Expense).where(
        Expense.tenant_id == tenant_id,
        extract("year", Expense.incurred_date) == target_year,
        extract("month", Expense.incurred_date) == target_month
    )
    expenses = (await db.execute(expenses_q)).scalars().all()
    total_expenses = sum((e.amount for e in expenses), Decimal("0.00"))

    # 4. Net Profit
    net_profit = gross_revenue - commissions - total_expenses

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Financial Category", "Amount (INR)", "Notes"])
    writer.writerow(["Gross Service Revenue", float(gross_revenue), f"{len(bills)} paid invoices"])
    writer.writerow(["Stylist Commissions Paid", float(commissions), "Stylist floor commissions"])
    writer.writerow(["Salon Operating Expenses", float(total_expenses), f"{len(expenses)} logged expense entries"])
    writer.writerow(["NET OPERATING PROFIT", float(net_profit), "Gross - (Commissions + Expenses)"])
    writer.writerow([])
    writer.writerow(["--- Itemized Expenses Breakdown ---", "", ""])
    writer.writerow(["Date", "Category", "Title", "Amount (INR)"])
    for e in expenses:
        writer.writerow([
            e.incurred_date.strftime("%Y-%m-%d"),
            e.category,
            e.title,
            float(e.amount)
        ])

    csv_data = output.getvalue()
    filename = f"Lux_PnL_{target_year}_{target_month:02d}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
