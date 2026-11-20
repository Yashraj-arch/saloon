from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import User, StylistAttendance
from app.schemas import (
    AttendanceClockIn,
    AttendanceClockOut,
    AttendanceStatusUpdate,
    AttendanceResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/attendance", tags=["Stylist Attendance"])

def utcnow():
    return datetime.now(timezone.utc)

@router.post("/clock-in", response_model=AttendanceResponse)
async def clock_in(
    payload: AttendanceClockIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clock in for shift. Stylists can clock in themselves, or Salon Owner can clock in a specialist.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context required")

    stylist_id = payload.stylist_id or current_user.id
    if current_user.role == "STAFF" and stylist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Staff can only clock in for themselves")

    # Verify target stylist exists in this tenant
    stylist_res = await db.execute(
        select(User).where(User.id == stylist_id, User.tenant_id == tenant_id)
    )
    stylist = stylist_res.scalar_one_or_none()
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found in this salon")

    today = date.today()
    # Check if there is already an active (un-closed) shift
    existing_res = await db.execute(
        select(StylistAttendance)
        .where(
            StylistAttendance.tenant_id == tenant_id,
            StylistAttendance.stylist_id == stylist_id,
            StylistAttendance.work_date == today,
            StylistAttendance.clock_out.is_(None)
        )
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        # Already clocked in and active
        existing.status = "ON_FLOOR"
        await db.commit()
        await db.refresh(existing)
        return AttendanceResponse(
            id=existing.id,
            tenant_id=existing.tenant_id,
            stylist_id=existing.stylist_id,
            stylist_name=stylist.full_name,
            work_date=existing.work_date,
            clock_in=existing.clock_in,
            clock_out=existing.clock_out,
            status=existing.status,
            hours_worked=existing.hours_worked
        )

    new_attendance = StylistAttendance(
        tenant_id=tenant_id,
        stylist_id=stylist_id,
        work_date=today,
        clock_in=utcnow(),
        status="ON_FLOOR",
        hours_worked=0.0
    )
    db.add(new_attendance)
    await db.commit()
    await db.refresh(new_attendance)

    return AttendanceResponse(
        id=new_attendance.id,
        tenant_id=new_attendance.tenant_id,
        stylist_id=new_attendance.stylist_id,
        stylist_name=stylist.full_name,
        work_date=new_attendance.work_date,
        clock_in=new_attendance.clock_in,
        clock_out=new_attendance.clock_out,
        status=new_attendance.status,
        hours_worked=new_attendance.hours_worked
    )

@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(
    payload: AttendanceClockOut,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clock out from active shift.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context required")

    query = select(StylistAttendance).options(selectinload(StylistAttendance.stylist)).where(
        StylistAttendance.tenant_id == tenant_id,
        StylistAttendance.clock_out.is_(None)
    )
    if payload.attendance_id:
        query = query.where(StylistAttendance.id == payload.attendance_id)
    else:
        query = query.where(StylistAttendance.stylist_id == current_user.id)

    res = await db.execute(query)
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="No active shift found to clock out")

    now = utcnow()
    record.clock_out = now
    record.status = payload.status.upper() if payload.status else "OFF_DUTY"
    
    # Calculate hours
    if record.clock_in:
        delta = now - record.clock_in.replace(tzinfo=timezone.utc if record.clock_in.tzinfo is None else record.clock_in.tzinfo)
        record.hours_worked = round(max(0.0, delta.total_seconds() / 3600.0), 2)

    await db.commit()
    await db.refresh(record)

    return AttendanceResponse(
        id=record.id,
        tenant_id=record.tenant_id,
        stylist_id=record.stylist_id,
        stylist_name=record.stylist.full_name if record.stylist else "Stylist",
        work_date=record.work_date,
        clock_in=record.clock_in,
        clock_out=record.clock_out,
        status=record.status,
        hours_worked=record.hours_worked
    )

@router.patch("/{attendance_id}/status", response_model=AttendanceResponse)
async def update_status(
    attendance_id: int,
    payload: AttendanceStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle between ON_FLOOR and ON_BREAK.
    """
    tenant_id = current_user.tenant_id
    res = await db.execute(
        select(StylistAttendance)
        .options(selectinload(StylistAttendance.stylist))
        .where(StylistAttendance.id == attendance_id, StylistAttendance.tenant_id == tenant_id)
    )
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance shift not found")

    record.status = payload.status.upper()
    await db.commit()
    await db.refresh(record)

    return AttendanceResponse(
        id=record.id,
        tenant_id=record.tenant_id,
        stylist_id=record.stylist_id,
        stylist_name=record.stylist.full_name if record.stylist else "Stylist",
        work_date=record.work_date,
        clock_in=record.clock_in,
        clock_out=record.clock_out,
        status=record.status,
        hours_worked=record.hours_worked
    )

@router.get("/active-floor", response_model=List[AttendanceResponse])
async def get_active_floor_stylists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all stylists currently on the salon floor. Powers the live floor KPI counter.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        return []

    res = await db.execute(
        select(StylistAttendance)
        .options(selectinload(StylistAttendance.stylist))
        .where(
            StylistAttendance.tenant_id == tenant_id,
            StylistAttendance.work_date == date.today(),
            StylistAttendance.clock_out.is_(None),
            StylistAttendance.status == "ON_FLOOR"
        )
    )
    records = res.scalars().all()

    return [
        AttendanceResponse(
            id=r.id,
            tenant_id=r.tenant_id,
            stylist_id=r.stylist_id,
            stylist_name=r.stylist.full_name if r.stylist else "Stylist",
            work_date=r.work_date,
            clock_in=r.clock_in,
            clock_out=r.clock_out,
            status=r.status,
            hours_worked=r.hours_worked
        )
        for r in records
    ]

@router.get("/today", response_model=List[AttendanceResponse])
async def get_today_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all attendance records for today (active and completed).
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        return []

    res = await db.execute(
        select(StylistAttendance)
        .options(selectinload(StylistAttendance.stylist))
        .where(
            StylistAttendance.tenant_id == tenant_id,
            StylistAttendance.work_date == date.today()
        )
        .order_by(StylistAttendance.clock_in.desc())
    )
    records = res.scalars().all()

    return [
        AttendanceResponse(
            id=r.id,
            tenant_id=r.tenant_id,
            stylist_id=r.stylist_id,
            stylist_name=r.stylist.full_name if r.stylist else "Stylist",
            work_date=r.work_date,
            clock_in=r.clock_in,
            clock_out=r.clock_out,
            status=r.status,
            hours_worked=r.hours_worked
        )
        for r in records
    ]
