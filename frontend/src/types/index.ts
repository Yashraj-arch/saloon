export type Role = 'SUPER_ADMIN' | 'SALON_OWNER' | 'STAFF';

export interface User {
  id: number;
  tenant_id?: number | null;
  email: string;
  full_name: string;
  role: Role;
  phone?: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  owner_name: string;
  contact_email: string;
  contact_phone: string;
  address?: string | null;
  subscription_plan: string;
  subscription_status: string;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  tenant_id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  is_deleted: boolean;
  deletion_reason?: string | null;
  deleted_at?: string | null;
  created_at: string;
}

export interface ServiceOption {
  id: number;
  service_id: number;
  group_name: string;
  option_name: string;
  extra_price: number;
  is_default: boolean;
}

export interface Service {
  id: number;
  tenant_id: number;
  category: string;
  name: string;
  description?: string | null;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
  options: ServiceOption[];
}

export interface SelectedOption {
  group_name: string;
  option_name: string;
  extra_price: number;
}

export interface BillItem {
  id: number;
  service_id: number;
  service_name: string;
  base_price: number;
  selected_options_json?: string | null;
  final_price: number;
}

export interface Bill {
  id: number;
  tenant_id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string | null;
  staff_id?: number | null;
  staff_name?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  status: string;
  notes?: string | null;
  billed_at: string;
  items: BillItem[];
}

export interface RevenueSummary {
  daily_revenue: number;
  weekly_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  today_bills_count: number;
  today_customers_count: number;
  average_ticket_size: number;
  active_staff_count: number;
  total_active_services: number;
}

export interface CalendarDayRevenue {
  date: string; // YYYY-MM-DD
  total_revenue: number;
  bills_count: number;
  intensity: 'none' | 'low' | 'medium' | 'high';
}

export interface CalendarDrilldownResponse {
  date: string;
  total_revenue: number;
  bills_count: number;
  bills: Bill[];
  top_services: { service_name: string; count: number; revenue: number }[];
  staff_breakdown: { staff_name: string; bill_count: number; revenue: number }[];
}
