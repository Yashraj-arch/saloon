from datetime import date
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract

from app.core.database import get_db
from app.models import User, Expense
from app.schemas import ExpenseCreate, ExpenseResponse
from app.api.deps import require_salon_owner

router = APIRouter(prefix="/expenses", tags=["Salon Operating Expenses"])

@router.get("/", response_model=List[ExpenseResponse])
async def list_expenses(
    category: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_salon_owner)
):
    """
    List salon operating expenses with optional category and year/month filters.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        return []

    conditions = [Expense.tenant_id == tenant_id]
    if category:
        conditions.append(Expense.category == category.upper())
    if year:
        conditions.append(extract("year", Expense.incurred_date) == year)
    if month:
        conditions.append(extract("month", Expense.incurred_date) == month)

    query = select(Expense).where(and_(*conditions)).order_by(Expense.incurred_date.desc(), Expense.id.desc())
    result = await db.execute(query)
    expenses = result.scalars().all()
    return expenses

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_salon_owner)
):
    """
    Record a new operating expense (inventory, rent, utilities, maintenance).
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context required")

    expense = Expense(
        tenant_id=tenant_id,
        category=payload.category.upper(),
        title=payload.title.strip(),
        amount=payload.amount,
        incurred_date=payload.incurred_date or date.today(),
        notes=payload.notes.strip() if payload.notes else None
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_salon_owner)
):
    """
    Remove an expense entry.
    """
    tenant_id = current_user.tenant_id
    res = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.tenant_id == tenant_id)
    )
    expense = res.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")

    await db.delete(expense)
    await db.commit()
    return None
