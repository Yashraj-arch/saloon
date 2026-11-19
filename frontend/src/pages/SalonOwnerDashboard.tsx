import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  UserPlus,
  RotateCcw,
  Plus,
  Sparkles,
  BarChart3,
  Clock,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import type { RevenueSummary, Service, User, Customer } from '../types';
import { api } from '../services/api';
import { BentoCard } from '../components/bento/BentoCard';
import { CalendarBentoWidget } from '../components/calendar/CalendarBentoWidget';
import { DayDrilldownDrawer } from '../components/calendar/DayDrilldownDrawer';

export const SalonOwnerDashboard: React.FC = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [chartData, setChartData] = useState<{ label: string; revenue: number }[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [deletedCustomers, setDeletedCustomers] = useState<Customer[]>([]);
  
  // Selected date for the 1921-2099 drilldown drawer
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Active view tab in owner dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff' | 'audit'>('overview');

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // New Service Form
  const [newService, setNewService] = useState({
    category: 'Hair',
    name: '',
    description: '',
    base_price: 500,
    duration_minutes: 45,
    options: [
      { group_name: 'Hairwash Shampoo', option_name: "Standard Clarifying", extra_price: 0, is_default: true },
      { group_name: 'Hairwash Shampoo', option_name: "L'Oreal Serie Expert Spa", extra_price: 250, is_default: false },
      { group_name: 'Hairwash Shampoo', option_name: "Keratin Protein Repair", extra_price: 500, is_default: false },
    ]
  });

  // New Staff Form
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: 'StaffPassword@123',
    commission_rate: 10.0
  });

  const loadData = async () => {
    try {
      const [sum, chartRes, srv, stf, delCust] = await Promise.all([
        api.admin.getSummary(),
        api.admin.getRevenueChart(chartPeriod),
        api.services.list(),
        api.admin.listStaff(),
        api.admin.listDeletedCustomers()
      ]);
      setSummary(sum);
      setChartData(chartRes.data);
      setServices(srv);
      setStaffList(stf);
      setDeletedCustomers(delCust);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [chartPeriod]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createService(newService);
      setShowAddServiceModal(false);
      setNewService({
        category: 'Hair',
        name: '',
        description: '',
        base_price: 500,
        duration_minutes: 45,
        options: []
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create service');
    }
  };

  const handleAddOptionRow = () => {
    setNewService({
      ...newService,
      options: [
        ...newService.options,
        { group_name: 'Hairwash Shampoo', option_name: '', extra_price: 150, is_default: false }
      ]
    });
  };

  const handleRemoveOptionRow = (index: number) => {
    const updated = [...newService.options];
    updated.splice(index, 1);
    setNewService({ ...newService, options: updated });
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createStaff(newStaff);
      setShowAddStaffModal(false);
      setNewStaff({
        full_name: '',
        email: '',
        phone: '',
        password: 'StaffPassword@123',
        commission_rate: 10.0
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create staff');
    }
  };

  const handleRestoreCustomer = async (id: number) => {
    try {
      await api.admin.restoreCustomer(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to restore customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Owner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[var(--text-main)] font-['Outfit']">
              owner
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--bento-card-border)] shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'overview'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'services'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Services Catalog ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'staff'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Staff Team ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'audit'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Deletion Audit Vault ({deletedCustomers.length})
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Main Bento Hero Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Revenue Bento Card */}
            <BentoCard variant="accent" className="lg:col-span-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                    Today's Gross Revenue
                  </span>
                  <span className="bento-pill bento-pill-green text-[10px]">
                    +18% Today
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white font-['Outfit']">
                    ₹{summary ? Number(summary.daily_revenue).toLocaleString() : '0'}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                    <span>{summary?.today_bills_count || 0} Bills</span>
                    <span>•</span>
                    <span>{summary?.today_customers_count || 0} Clients</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/20 text-[11px] text-white/80 flex justify-between">
                <span>Avg Ticket: ₹{summary?.average_ticket_size || 0}</span>
                <span className="font-semibold text-emerald-300">Live Register</span>
              </div>
            </BentoCard>

            {/* Weekly Revenue Bento Card */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Weekly Revenue (7d)
                </span>
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-[var(--text-main)] font-['Outfit']">
                  ₹{summary ? Number(summary.weekly_revenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-1">Rolling 7-day performance</p>
              </div>
              <div className="pt-4 border-t border-[var(--bento-card-border)] text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Profitable pace</span>
              </div>
            </BentoCard>

            {/* Monthly Revenue Bento Card */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Monthly Total (MTD)
                </span>
                <span className="bento-pill bento-pill-blue text-[10px]">
                  Current Month
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-sky-600 dark:text-sky-400 font-['Outfit']">
                  ₹{summary ? Number(summary.monthly_revenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-1">Month-to-date business volume</p>
              </div>
              <div className="pt-4 border-t border-[var(--bento-card-border)] text-[11px] text-[var(--text-muted)] flex justify-between">
                <span>Target: ₹100,000</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">On track</span>
              </div>
            </BentoCard>

            {/* Yearly Revenue Bento Card */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Yearly Total (YTD)
                </span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-['Outfit']">
                  ₹{summary ? Number(summary.yearly_revenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-1">Cumulative fiscal year revenue</p>
              </div>
              <div className="pt-4 border-t border-[var(--bento-card-border)] text-[11px] text-[var(--text-muted)] flex justify-between">
                <span>Active Stylists: {summary?.active_staff_count || 0}</span>
                <span className="text-[var(--text-main)]">{summary?.total_active_services || 0} Services</span>
              </div>
            </BentoCard>
          </div>

          {/* Bento Row 2: Revenue Chart Visualizer & Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart Widget */}
            <div className="bento-card p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--bento-card-border)]">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    Revenue Trend Visualizer
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Dynamic trend analysis across customized time buckets
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                  {(['week', 'month', 'year'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                        chartPeriod === period
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart container */}
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#skyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Business Performance Highlights Tile */}
            <div className="bento-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  Business Performance Highlights
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Key unit economics & operational metrics
                </p>

                <div className="mt-5 space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Average Bill Value</p>
                      <p className="text-xl font-bold text-[var(--text-main)] mt-0.5">
                        ₹{summary?.average_ticket_size || 0}
                      </p>
                    </div>
                    <span className="bento-pill bento-pill-green text-[10px]">Optimal</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Stylists on Floor</p>
                      <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                        {summary?.active_staff_count || 0} Stylists Ready
                      </p>
                    </div>
                    <span className="bento-pill bento-pill-blue text-[10px]">Active</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Top Performing Category</p>
                      <p className="text-base font-bold text-[var(--text-main)] mt-0.5">
                        Hair Care & Styling
                      </p>
                    </div>
                    <span className="bento-pill bento-pill-amber text-[10px]">High Demand</span>
                  </div>

                  {/* Monthly Revenue Target Progress Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--text-muted)]">Monthly Target Progress</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {Math.min(100, Math.round(((Number(summary?.monthly_revenue) || 0) / 100000) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(5, Math.round(((Number(summary?.monthly_revenue) || 0) / 100000) * 100)))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--bento-card-border)] text-[11px] text-[var(--text-muted)]">
                Live register metrics updated automatically upon every client checkout.
              </div>
            </div>
          </div>

          {/* 1921-2099 Historical & Future Revenue Calendar Engine */}
          <CalendarBentoWidget
            selectedDate={selectedDate}
            onSelectDate={(dt) => setSelectedDate(dt)}
          />

          {/* Day Drilldown Slide-Over Drawer */}
          <DayDrilldownDrawer
            dateStr={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        </>
      )}

      {/* Services Catalog Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Services
              </h2>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              Add New Service
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => (
              <div key={srv.id} className="bento-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      {srv.category}
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Base: ₹{Number(srv.base_price)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text-main)] mt-2 font-['Outfit']">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                    {srv.description || 'No description provided.'}
                  </p>

                  {/* Options Matrix */}
                  <div className="mt-4 pt-3 border-t border-[var(--bento-card-border)]">
                    <p className="text-[11px] font-bold text-[var(--text-main)] mb-2 flex items-center justify-between">
                      <span>Available Options / Add-ons:</span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold">
                        {srv.options.length} options
                      </span>
                    </p>

                    {srv.options.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">No add-ons configured.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {srv.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-[var(--text-muted)] text-[10px] block">{opt.group_name}</span>
                              <span className="text-[var(--text-main)] font-medium">{opt.option_name}</span>
                            </div>
                            <span className="font-bold text-sky-600 dark:text-sky-400">
                              {Number(opt.extra_price) > 0 ? `+₹${opt.extra_price}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--bento-card-border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {srv.duration_minutes} mins
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active in POS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Management Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Salon Staff & Stylist Team
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Manage salon stylists, specialists, and commission tiers.
              </p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div key={st.id} className="bento-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
                      {st.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">{st.full_name}</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">{st.email}</p>
                    </div>
                  </div>
                  <span className="bento-pill bento-pill-green text-[10px]">Active</span>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--bento-card-border)] space-y-2 text-xs">
                  <div className="flex justify-between text-[var(--text-main)]">
                    <span className="text-[var(--text-muted)]">Commission Rate:</span>
                    <strong className="text-sky-600 dark:text-sky-400">{st.commission_rate}%</strong>
                  </div>
                  <div className="flex justify-between text-[var(--text-main)]">
                    <span className="text-[var(--text-muted)]">Phone:</span>
                    <span>{st.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-main)]">
                    <span className="text-[var(--text-muted)]">Access Role:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">{st.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soft-Deleted Customer Audit Vault Tab */}
      {activeTab === 'audit' && (
        <div className="bento-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--bento-card-border)]">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Soft-Deleted Customers Audit Vault
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Review archived customer records and restore when needed.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-bold">
              {deletedCustomers.length} Archived Records
            </span>
          </div>

          {deletedCustomers.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm">
              No soft-deleted customer records. All customer accounts are currently active.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-[var(--text-main)]">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--bento-card-border)] bg-slate-50 dark:bg-white/[0.01]">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                    <th className="py-3 px-4">Mandatory Deletion Reason</th>
                    <th className="py-3 px-4">Deleted At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bento-card-border)]">
                  {deletedCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-[var(--text-main)]">
                        {cust.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {cust.phone}
                        {cust.email && <div className="text-[10px] text-[var(--text-muted)] opacity-70">{cust.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-200 text-xs font-medium">
                          "{cust.deletion_reason || 'No reason provided'}"
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {cust.deleted_at ? new Date(cust.deleted_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRestoreCustomer(cust.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-600 text-sky-600 dark:text-sky-300 hover:text-white dark:hover:text-white border border-sky-500/30 text-xs font-bold transition ml-auto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          1-Click Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
              Create New Service with Options Matrix
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure tiered pricing and add-ons (e.g. Haircut with specific Shampoo formulas or Hair Length surcharges).
            </p>

            <form onSubmit={handleCreateService} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Category *</label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Hair">Hair</option>
                    <option value="Skin">Skin / Facial</option>
                    <option value="Spa">Spa & Massage</option>
                    <option value="Grooming">Beard & Grooming</option>
                    <option value="Nails">Nails</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Precision Layered Cut"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newService.base_price}
                    onChange={(e) => setNewService({ ...newService, base_price: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Includes consultation, shampoo wash, styling..."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                />
              </div>

              {/* Dynamic Options List */}
              <div className="pt-3 border-t border-[var(--bento-card-border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    Add-ons & Options Modifiers:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOptionRow}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newService.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
                      <input
                        type="text"
                        placeholder="Group (e.g. Shampoo Type)"
                        value={opt.group_name}
                        onChange={(e) => {
                          const updated = [...newService.options];
                          updated[idx].group_name = e.target.value;
                          setNewService({ ...newService, options: updated });
                        }}
                        className="w-1/3 px-2 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-[var(--text-main)] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Option (e.g. L'Oreal Spa)"
                        value={opt.option_name}
                        onChange={(e) => {
                          const updated = [...newService.options];
                          updated[idx].option_name = e.target.value;
                          setNewService({ ...newService, options: updated });
                        }}
                        className="w-1/3 px-2 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-[var(--text-main)] outline-none"
                      />
                      <input
                        type="number"
                        placeholder="+₹"
                        value={opt.extra_price}
                        onChange={(e) => {
                          const updated = [...newService.options];
                          updated[idx].extra_price = Number(e.target.value);
                          setNewService({ ...newService, options: updated });
                        }}
                        className="w-1/4 px-2 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-[var(--text-main)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionRow(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bento-card-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition"
                >
                  Save Service to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
              Register New Staff Member
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Create a staff/stylist login account for customer management and POS billing.
            </p>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Taylor"
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Staff Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jessica@salon.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Commission %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newStaff.commission_rate}
                    onChange={(e) => setNewStaff({ ...newStaff, commission_rate: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Password</label>
                  <input
                    type="text"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bento-card-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
