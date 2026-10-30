from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Numeric, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    owner_name = Column(String(120), nullable=False)
    contact_email = Column(String(150), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=True)
    
    subscription_plan = Column(String(50), default="Pro")  # Starter, Pro, Enterprise
    subscription_status = Column(String(50), default="ACTIVE")  # ACTIVE, SUSPENDED, EXPIRED
    subscription_expires_at = Column(DateTime, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="tenant", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="tenant", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(50), nullable=False)  # SUPER_ADMIN, SALON_OWNER, STAFF
    phone = Column(String(50), nullable=True)
    commission_rate = Column(Float, default=0.0)  # Stylist commission percentage
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    bills_handled = relationship("Bill", back_populates="staff", foreign_keys="Bill.staff_id")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(150), nullable=True)
    gender = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Soft Delete & Reason requirement
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deletion_reason = Column(Text, nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="customers")
    bills = relationship("Bill", back_populates="customer")
    audit_logs = relationship("CustomerAuditLog", back_populates="customer")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(80), nullable=False)  # Hair, Skin, Spa, Nails, Grooming
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="services")
    options = relationship("ServiceOption", back_populates="service", cascade="all, delete-orphan")


class ServiceOption(Base):
    __tablename__ = "service_options"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    group_name = Column(String(100), nullable=False)  # e.g., Shampoo Type, Length, Add-on
    option_name = Column(String(100), nullable=False)  # e.g., L'Oreal Spa, Keratin, Long Hair
    extra_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    is_default = Column(Boolean, default=False)

    # Relationships
    service = relationship("Service", back_populates="options")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_number = Column(String(60), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    staff_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    billed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), default="CASH")  # CASH, UPI, CARD, SPLIT
    status = Column(String(50), default="PAID")  # PAID, CANCELLED, REFUNDED
    notes = Column(Text, nullable=True)
    billed_at = Column(DateTime, default=utcnow, index=True, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="bills")
    customer = relationship("Customer", back_populates="bills")
    staff = relationship("User", back_populates="bills_handled", foreign_keys=[staff_id])
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    service_name = Column(String(150), nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    selected_options_json = Column(Text, nullable=True)  # JSON string of options and extra prices
    final_price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    bill = relationship("Bill", back_populates="items")


class CustomerAuditLog(Base):
    __tablename__ = "customer_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # SOFT_DELETE, RESTORE, UPDATE, CREATE
    performed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="audit_logs")
