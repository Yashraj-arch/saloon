import json
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_password_hash
from app.models import Tenant, User, Customer, Service, ServiceOption, Bill, BillItem, CustomerAuditLog

async def init_db_data(session: AsyncSession):
    # 1. Check if SuperAdmin exists
    admin_stmt = select(User).where(User.email == "superadmin@luxesaloon.com")
    existing_admin = (await session.execute(admin_stmt)).scalar_one_or_none()

    if not existing_admin:
        super_admin = User(
            email="superadmin@luxesaloon.com",
            hashed_password=get_password_hash("SuperAdmin@123"),
            full_name="Alex Vance (Platform Owner)",
            role="SUPER_ADMIN",
            phone="+1 555-0199",
            is_active=True
        )
        session.add(super_admin)
        await session.flush()

    # 2. Check if Demo Salon Tenant exists
    tenant_stmt = select(Tenant).where(Tenant.slug == "luxe-aura-spa")
    existing_tenant = (await session.execute(tenant_stmt)).scalar_one_or_none()

    if not existing_tenant:
        now = datetime.now(timezone.utc)
        tenant = Tenant(
            name="Luxe Aura Hair & Spa",
            slug="luxe-aura-spa",
            owner_name="Sophia Martinez",
            contact_email="owner@luxeaura.com",
            contact_phone="+91 98765 43210",
            address="42 Glamour Avenue, Suite 10, Downtown",
            subscription_plan="Enterprise",
            subscription_status="ACTIVE",
            subscription_expires_at=now + timedelta(days=365),
            is_active=True
        )
        session.add(tenant)
        await session.flush()

        # Create Salon Owner Account
        owner = User(
            tenant_id=tenant.id,
            email="owner@luxeaura.com",
            hashed_password=get_password_hash("Owner@123"),
            full_name="Sophia Martinez",
            role="SALON_OWNER",
            phone="+91 98765 43210",
            is_active=True
        )
        session.add(owner)
        await session.flush()

        # Create Staff Members
        staff1 = User(
            tenant_id=tenant.id,
            email="staff@luxeaura.com",
            hashed_password=get_password_hash("Staff@123"),
            full_name="Marcus Reed (Master Stylist)",
            role="STAFF",
            phone="+91 98765 43211",
            commission_rate=12.5,
            is_active=True
        )
        staff2 = User(
            tenant_id=tenant.id,
            email="elena@luxeaura.com",
            hashed_password=get_password_hash("Staff@123"),
            full_name="Elena Rostova (Colorist & Skin)",
            role="STAFF",
            phone="+91 98765 43212",
            commission_rate=10.0,
            is_active=True
        )
        session.add_all([staff1, staff2])
        await session.flush()

        # Create Services with Options Matrix
        srv1 = Service(
            tenant_id=tenant.id,
            category="Hair",
            name="Signature Precision Haircut",
            description="Consultation, scalp massage, tailored cutting and styling",
            base_price=Decimal("650.00"),
            duration_minutes=45,
            is_active=True
        )
        session.add(srv1)
        await session.flush()

        # Haircut Options (Hairwash shampoos & Length)
        opt1 = ServiceOption(service_id=srv1.id, group_name="Hairwash Shampoo", option_name="Standard Clarifying", extra_price=Decimal("0.00"), is_default=True)
        opt2 = ServiceOption(service_id=srv1.id, group_name="Hairwash Shampoo", option_name="L'Oreal Serie Expert Spa", extra_price=Decimal("250.00"))
        opt3 = ServiceOption(service_id=srv1.id, group_name="Hairwash Shampoo", option_name="Moroccan Argan Nourishing", extra_price=Decimal("400.00"))
        opt4 = ServiceOption(service_id=srv1.id, group_name="Hairwash Shampoo", option_name="Keratin Deep Repair", extra_price=Decimal("550.00"))
        opt5 = ServiceOption(service_id=srv1.id, group_name="Hair Length", option_name="Short (Crop/Bob)", extra_price=Decimal("0.00"), is_default=True)
        opt6 = ServiceOption(service_id=srv1.id, group_name="Hair Length", option_name="Medium (Shoulder)", extra_price=Decimal("150.00"))
        opt7 = ServiceOption(service_id=srv1.id, group_name="Hair Length", option_name="Long (Past Shoulder)", extra_price=Decimal("300.00"))
        session.add_all([opt1, opt2, opt3, opt4, opt5, opt6, opt7])

        srv2 = Service(
            tenant_id=tenant.id,
            category="Hair",
            name="Keratin Silk Protein Treatment",
            description="Anti-frizz Brazilian keratin smoothing formula",
            base_price=Decimal("3500.00"),
            duration_minutes=120,
            is_active=True
        )
        session.add(srv2)
        await session.flush()

        srv2_opt1 = ServiceOption(service_id=srv2.id, group_name="Serum Booster", option_name="None", extra_price=Decimal("0.00"), is_default=True)
        srv2_opt2 = ServiceOption(service_id=srv2.id, group_name="Serum Booster", option_name="Olaplex No. 2 Bond Multiplier", extra_price=Decimal("800.00"))
        session.add_all([srv2_opt1, srv2_opt2])

        srv3 = Service(
            tenant_id=tenant.id,
            category="Skin",
            name="Hydra-Glow Brightening Facial",
            description="7-step deep pore vacuum extraction with hyaluronic infusion",
            base_price=Decimal("1800.00"),
            duration_minutes=60,
            is_active=True
        )
        session.add(srv3)
        await session.flush()

        srv3_opt1 = ServiceOption(service_id=srv3.id, group_name="Face Mask", option_name="Gold Radiance Peel-Off", extra_price=Decimal("450.00"))
        srv3_opt2 = ServiceOption(service_id=srv3.id, group_name="Face Mask", option_name="Tea Tree Calming Algae", extra_price=Decimal("350.00"), is_default=True)
        session.add_all([srv3_opt1, srv3_opt2])

        srv4 = Service(
            tenant_id=tenant.id,
            category="Grooming",
            name="Royal Beard Sculpt & Hot Towel",
            description="Razor outline edging, organic beard oil soak, hot towel finish",
            base_price=Decimal("400.00"),
            duration_minutes=30,
            is_active=True
        )
        session.add(srv4)
        await session.flush()

        # Seed Customers
        c1 = Customer(
            tenant_id=tenant.id,
            full_name="Aarav Sharma",
            phone="+91 99887 76655",
            email="aarav@example.com",
            gender="Male",
            birth_date=date(1994, 5, 14),
            notes="Prefers medium fade, sensitive scalp",
            is_deleted=False
        )
        c2 = Customer(
            tenant_id=tenant.id,
            full_name="Priya Patel",
            phone="+91 98112 23344",
            email="priya.p@example.com",
            gender="Female",
            birth_date=date(1998, 8, 22),
            notes="Regular client for hair spa every 3 weeks",
            is_deleted=False
        )
        c3 = Customer(
            tenant_id=tenant.id,
            full_name="Vikramaditya Roy",
            phone="+91 98223 34455",
            email="vikram@example.com",
            gender="Male",
            notes="VIP client",
            is_deleted=False
        )
        # Seed a soft-deleted customer for audit demonstration
        c4 = Customer(
            tenant_id=tenant.id,
            full_name="Rohan Mehra (Old Entry)",
            phone="+91 98990 01122",
            email="rohan.duplicate@example.com",
            notes="Duplicate contact number accidentally created",
            is_deleted=True,
            deletion_reason="Duplicate client record merged with master phone",
            deleted_by_user_id=staff1.id,
            deleted_at=now - timedelta(days=2)
        )
        session.add_all([c1, c2, c3, c4])
        await session.flush()

        # Seed sample Bills across today, this week, and this month
        # Today's bill
        b1 = Bill(
            tenant_id=tenant.id,
            invoice_number=f"INV-{now.strftime('%Y%m%d')}-001",
            customer_id=c1.id,
            staff_id=staff1.id,
            billed_by_id=staff1.id,
            subtotal=Decimal("900.00"),
            discount_amount=Decimal("50.00"),
            tax_amount=Decimal("0.00"),
            total_amount=Decimal("850.00"),
            payment_method="UPI",
            status="PAID",
            billed_at=now - timedelta(hours=2)
        )
        session.add(b1)
        await session.flush()
        bi1 = BillItem(
            bill_id=b1.id,
            service_id=srv1.id,
            service_name="Signature Precision Haircut",
            base_price=Decimal("650.00"),
            selected_options_json=json.dumps([{"group_name": "Hairwash Shampoo", "option_name": "L'Oreal Serie Expert Spa", "extra_price": 250.0}]),
            final_price=Decimal("900.00")
        )
        session.add(bi1)

        # Today's bill 2
        b2 = Bill(
            tenant_id=tenant.id,
            invoice_number=f"INV-{now.strftime('%Y%m%d')}-002",
            customer_id=c2.id,
            staff_id=staff2.id,
            billed_by_id=staff2.id,
            subtotal=Decimal("2150.00"),
            discount_amount=Decimal("150.00"),
            tax_amount=Decimal("0.00"),
            total_amount=Decimal("2000.00"),
            payment_method="CARD",
            status="PAID",
            billed_at=now - timedelta(hours=1)
        )
        session.add(b2)
        await session.flush()
        bi2 = BillItem(
            bill_id=b2.id,
            service_id=srv3.id,
            service_name="Hydra-Glow Brightening Facial",
            base_price=Decimal("1800.00"),
            selected_options_json=json.dumps([{"group_name": "Face Mask", "option_name": "Tea Tree Calming Algae", "extra_price": 350.0}]),
            final_price=Decimal("2150.00")
        )
        session.add(bi2)

        # Past bills for weekly & monthly revenue totals
        for days_ago, amt in [(1, Decimal("3200.00")), (2, Decimal("4100.00")), (3, Decimal("2800.00")), (5, Decimal("5400.00")), (12, Decimal("6200.00"))]:
            past_dt = now - timedelta(days=days_ago)
            pb = Bill(
                tenant_id=tenant.id,
                invoice_number=f"INV-{past_dt.strftime('%Y%m%d')}-{days_ago:03d}",
                customer_id=c3.id,
                staff_id=staff1.id,
                billed_by_id=owner.id,
                subtotal=amt,
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                total_amount=amt,
                payment_method="CASH" if days_ago % 2 == 0 else "UPI",
                status="PAID",
                billed_at=past_dt
            )
            session.add(pb)
            await session.flush()
            pbi = BillItem(
                bill_id=pb.id,
                service_id=srv2.id,
                service_name="Keratin Silk Protein Treatment",
                base_price=amt,
                selected_options_json="[]",
                final_price=amt
            )
            session.add(pbi)

        await session.commit()
