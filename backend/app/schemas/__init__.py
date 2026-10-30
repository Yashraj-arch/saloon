from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- Auth -----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

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
    contact_phone: str = Field(..., pattern=r"^[0-9+\s\-()]{7,25}$")
    address: Optional[str] = Field(None, max_length=255)
    subscription_plan: str = Field("Pro", pattern="^(?i)(Starter|Pro|Enterprise)$")
    initial_owner_password: str = Field(..., min_length=8, max_length=128)

class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    owner_name: Optional[str] = Field(None, min_length=2, max_length=120)
    contact_phone: Optional[str] = Field(None, pattern=r"^[0-9+\s\-()]{7,25}$")
    address: Optional[str] = Field(None, max_length=255)
    subscription_plan: Optional[str] = Field(None, pattern="^(?i)(Starter|Pro|Enterprise)$")
    subscription_status: Optional[str] = Field(None, pattern="^(?i)(ACTIVE|SUSPENDED|EXPIRED)$")
    is_active: Optional[bool] = None

class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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

# ----------------- User -----------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=120)
    role: str = Field("STAFF", pattern="^(?i)(SALON_OWNER|STAFF)$")
    phone: Optional[str] = Field(None, pattern=r"^[0-9+\s\-()]{7,25}$")
    commission_rate: Optional[float] = Field(0.0, ge=0.0, le=100.0)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, pattern=r"^[0-9+\s\-()]{7,25}$")
    commission_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: Optional[int]
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    commission_rate: float
    is_active: bool
    created_at: datetime

# ----------------- Customer -----------------
class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., pattern=r"^[0-9+\s\-()]{7,25}$")
    email: Optional[EmailStr] = None
    gender: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, pattern=r"^[0-9+\s\-()]{7,25}$")
    email: Optional[EmailStr] = None
    gender: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)

class CustomerSoftDelete(BaseModel):
    # Mandatory deletion reason enforced
    reason: str = Field(..., min_length=5, max_length=500, description="Mandatory justification for deleting customer record")

class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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

# ----------------- Service & Options -----------------
class ServiceOptionCreate(BaseModel):
    group_name: str = Field(..., min_length=2, max_length=100)
    option_name: str = Field(..., min_length=2, max_length=100)
    extra_price: Decimal = Field(Decimal("0.00"), ge=0, le=100000)
    is_default: bool = False

class ServiceOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    service_id: int
    group_name: str
    option_name: str
    extra_price: Decimal
    is_default: bool

class ServiceCreate(BaseModel):
    category: str = Field(..., min_length=2, max_length=80)
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    base_price: Decimal = Field(..., ge=0, le=1000000)
    duration_minutes: int = Field(30, ge=5, le=720)
    options: List[ServiceOptionCreate] = []

class ServiceUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=2, max_length=80)
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    base_price: Optional[Decimal] = Field(None, ge=0, le=1000000)
    duration_minutes: Optional[int] = Field(None, ge=5, le=720)
    is_active: Optional[bool] = None

class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    category: str
    name: str
    description: Optional[str] = None
    base_price: Decimal
    duration_minutes: int
    is_active: bool
    options: List[ServiceOptionResponse] = []

# ----------------- Bill & POS -----------------
class SelectedOption(BaseModel):
    group_name: str = Field(..., min_length=1, max_length=100)
    option_name: str = Field(..., min_length=1, max_length=100)
    extra_price: Decimal = Field(Decimal("0.00"), ge=0)

class BillItemCreate(BaseModel):
    service_id: int = Field(..., ge=1)
    selected_options: List[SelectedOption] = []

class BillCreate(BaseModel):
    customer_id: int = Field(..., ge=1)
    staff_id: Optional[int] = Field(None, ge=1)
    items: List[BillItemCreate] = Field(..., min_length=1)
    discount_amount: Decimal = Field(Decimal("0.00"), ge=0)
    payment_method: str = Field("CASH", pattern="^(?i)(CASH|UPI|CARD|SPLIT)$")
    notes: Optional[str] = Field(None, max_length=500)

class BillItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    service_id: int
    service_name: str
    base_price: Decimal
    selected_options_json: Optional[str] = None
    final_price: Decimal

class BillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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
    date: str
    total_revenue: Decimal
    bills_count: int
    intensity: str

class CalendarDrilldownResponse(BaseModel):
    date: str
    total_revenue: Decimal
    bills_count: int
    bills: List[BillResponse] = []
    top_services: List[dict] = []
    staff_breakdown: List[dict] = []
