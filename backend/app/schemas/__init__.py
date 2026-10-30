from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth -----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    tenant_id: Optional[int] = None
    user_id: int
    full_name: str
    email: str
    salon_name: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None

# ----------------- Tenant -----------------
class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    owner_name: str = Field(..., min_length=2, max_length=120)
    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=5, max_length=50)
    address: Optional[str] = None
    subscription_plan: str = "Pro"  # Starter, Pro, Enterprise
    initial_owner_password: str = Field(..., min_length=6)

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    is_active: Optional[bool] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    slug: str
    owner_name: str
    contact_email: str
    contact_phone: str
    address: Optional[str] = None
    subscription_plan: str
    subscription_status: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- User -----------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = "STAFF"  # SALON_OWNER, STAFF
    phone: Optional[str] = None
    commission_rate: Optional[float] = 0.0

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    commission_rate: Optional[float] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    tenant_id: Optional[int]
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    commission_rate: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Customer -----------------
class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=7, max_length=50)
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None

class CustomerSoftDelete(BaseModel):
    # Mandatory deletion reason enforced
    reason: str = Field(..., min_length=5, description="Mandatory justification for deleting customer record")

class CustomerResponse(BaseModel):
    id: int
    tenant_id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None
    is_deleted: bool
    deletion_reason: Optional[str] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Service & Options -----------------
class ServiceOptionCreate(BaseModel):
    group_name: str  # e.g., "Hairwash Shampoo", "Hair Length"
    option_name: str  # e.g., "L'Oreal Spa Shampoo", "Long Hair (+₹400)"
    extra_price: Decimal = Decimal("0.00")
    is_default: bool = False

class ServiceOptionResponse(BaseModel):
    id: int
    service_id: int
    group_name: str
    option_name: str
    extra_price: Decimal
    is_default: bool

    class Config:
        from_attributes = True

class ServiceCreate(BaseModel):
    category: str  # Hair, Skin, Spa, Nails, Grooming
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    base_price: Decimal = Field(..., ge=0)
    duration_minutes: int = 30
    options: List[ServiceOptionCreate] = []

class ServiceUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class ServiceResponse(BaseModel):
    id: int
    tenant_id: int
    category: str
    name: str
    description: Optional[str] = None
    base_price: Decimal
    duration_minutes: int
    is_active: bool
    options: List[ServiceOptionResponse] = []

    class Config:
        from_attributes = True

# ----------------- Bill & POS -----------------
class SelectedOption(BaseModel):
    group_name: str
    option_name: str
    extra_price: Decimal = Decimal("0.00")

class BillItemCreate(BaseModel):
    service_id: int
    selected_options: List[SelectedOption] = []

class BillCreate(BaseModel):
    customer_id: int
    staff_id: Optional[int] = None  # Stylist who did service
    items: List[BillItemCreate]
    discount_amount: Decimal = Decimal("0.00")
    payment_method: str = "CASH"  # CASH, UPI, CARD, SPLIT
    notes: Optional[str] = None

class BillItemResponse(BaseModel):
    id: int
    service_id: int
    service_name: str
    base_price: Decimal
    selected_options_json: Optional[str] = None
    final_price: Decimal

    class Config:
        from_attributes = True

class BillResponse(BaseModel):
    id: int
    tenant_id: int
    invoice_number: str
    customer_id: int
    customer_name: Optional[str] = None
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    payment_method: str
    status: str
    notes: Optional[str] = None
    billed_at: datetime
    items: List[BillItemResponse] = []

    class Config:
        from_attributes = True

# ----------------- Analytics & Calendar -----------------
class RevenueSummary(BaseModel):
    daily_revenue: Decimal
    weekly_revenue: Decimal
    monthly_revenue: Decimal
    yearly_revenue: Decimal
    today_bills_count: int
    today_customers_count: int
    average_ticket_size: Decimal
    active_staff_count: int
    total_active_services: int

class CalendarDayRevenue(BaseModel):
    date: str  # YYYY-MM-DD
    total_revenue: Decimal
    bills_count: int
    intensity: str  # none, low, medium, high

class CalendarDrilldownResponse(BaseModel):
    date: str
    total_revenue: Decimal
    bills_count: int
    bills: List[BillResponse] = []
    top_services: List[dict] = []
    staff_breakdown: List[dict] = []
