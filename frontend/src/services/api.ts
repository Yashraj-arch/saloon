import type {
  User,
  Tenant,
  Customer,
  Service,
  ServiceOption,
  Bill,
  RevenueSummary,
  CalendarDayRevenue,
  CalendarDrilldownResponse,
  SelectedOption
} from '../types';

const BASE_URL = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const errData = await res.json();
      errMessage = errData.detail || errData.message || JSON.stringify(errData);
    } catch {
      errMessage = await res.text();
    }
    throw new Error(errMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{
      access_token: string;
      token_type: string;
      role: 'SUPER_ADMIN' | 'SALON_OWNER' | 'STAFF';
      tenant_id?: number;
      user_id: number;
      full_name: string;
      email: string;
      salon_name?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  getMe: () => request<User>('/auth/me'),

  // Super Admin
  superadmin: {
    listSalons: () => request<Tenant[]>('/superadmin/salons'),
    createSalon: (data: {
      name: string;
      owner_name: string;
      contact_email: string;
      contact_phone: string;
      address?: string;
      subscription_plan: string;
      initial_owner_password: string;
    }) => request<Tenant>('/superadmin/salons', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    toggleStatus: (salonId: number) => request<Tenant>(`/superadmin/salons/${salonId}/toggle-status`, {
      method: 'POST'
    }),
    updateSubscription: (salonId: number, data: Partial<Tenant>) => request<Tenant>(`/superadmin/salons/${salonId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },

  // Salon Owner Admin & Analytics
  admin: {
    getSummary: () => request<RevenueSummary>('/analytics/summary'),
    getCalendarMonth: (year: number, month: number) =>
      request<CalendarDayRevenue[]>(`/analytics/calendar-month?year=${year}&month=${month}`),
    getCalendarDrilldown: (dateStr: string) =>
      request<CalendarDrilldownResponse>(`/analytics/calendar-drilldown?date_str=${dateStr}`),
    getRevenueChart: (period: 'week' | 'month' | 'year' = 'week') =>
      request<{ period: string; data: { label: string; revenue: number }[] }>(`/analytics/revenue-chart?period=${period}`),
    listStaff: () => request<User[]>('/admin/staff'),
    createStaff: (data: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
      commission_rate?: number;
    }) => request<User>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    listDeletedCustomers: () => request<Customer[]>('/admin/deleted-customers'),
    restoreCustomer: (customerId: number) => request<Customer>(`/admin/customers/${customerId}/restore`, {
      method: 'POST'
    }),
    createService: (data: {
      category: string;
      name: string;
      description?: string;
      base_price: number;
      duration_minutes?: number;
      options: { group_name: string; option_name: string; extra_price: number; is_default?: boolean }[];
    }) => request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    addServiceOption: (serviceId: number, data: { group_name: string; option_name: string; extra_price: number; is_default?: boolean }) =>
      request<ServiceOption>(`/services/${serviceId}/options`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteServiceOption: (optionId: number) => request<void>(`/services/options/${optionId}`, {
      method: 'DELETE'
    })
  },

  // Staff & Shared (Customer & Billing)
  services: {
    list: (category?: string) => request<Service[]>(`/services${category ? `?category=${category}` : ''}`)
  },

  customers: {
    list: (search?: string) => request<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    create: (data: {
      full_name: string;
      phone: string;
      email?: string;
      gender?: string;
      birth_date?: string;
      notes?: string;
    }) => request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    softDelete: (customerId: number, reason: string) => request<Customer>(`/customers/${customerId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  },

  billing: {
    create: (data: {
      customer_id: number;
      staff_id?: number | null;
      items: { service_id: number; selected_options: SelectedOption[] }[];
      discount_amount?: number;
      payment_method?: string;
      notes?: string;
    }) => request<Bill>('/billing', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    list: (limit = 30) => request<Bill[]>(`/billing?limit=${limit}`)
  }
};
