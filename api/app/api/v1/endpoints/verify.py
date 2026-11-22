from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Bill, Tenant, Customer, BillItem
from app.schemas import VerifiedInvoiceResponse, BillItemResponse

router = APIRouter(prefix="/verify", tags=["Public Verification"])

@router.get("/{invoice_number}", response_model=VerifiedInvoiceResponse)
async def verify_invoice(
    invoice_number: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public digital invoice verification endpoint.
    Anyone scanning the receipt QR code can verify authentic transaction details.
    """
    query = (
        select(Bill)
        .options(
            selectinload(Bill.tenant),
            selectinload(Bill.customer),
            selectinload(Bill.items)
        )
        .where(Bill.invoice_number == invoice_number.strip().upper())
    )
    result = await db.execute(query)
    bill = result.scalar_one_or_none()

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice '{invoice_number}' not found in verification registry."
        )

    return VerifiedInvoiceResponse(
        invoice_number=bill.invoice_number,
        salon_name=bill.tenant.name if bill.tenant else "Lux Salon",
        salon_phone=bill.tenant.contact_phone if bill.tenant else "",
        customer_name=bill.customer.full_name if bill.customer else "Walk-in Guest",
        billed_at=bill.billed_at,
        subtotal=bill.subtotal,
        discount_amount=bill.discount_amount,
        total_amount=bill.total_amount,
        payment_method=bill.payment_method,
        status=bill.status,
        items=[
            BillItemResponse(
                id=item.id,
                service_id=item.service_id,
                service_name=item.service_name,
                base_price=item.base_price,
                selected_options_json=item.selected_options_json,
                final_price=item.final_price
            )
            for item in bill.items
        ],
        is_verified=True
    )
