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
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white font-['Outfit']">
              Salon Owner Bento Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time daily, weekly, monthly, and yearly economics, 1921–2099 calendar analytics, and service matrices.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bento Analytics
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'services'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Services Catalog ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'staff'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Staff Team ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
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
            <BentoCard variant="purple" className="lg:col-span-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
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
                  <div className="mt-1 flex items-center gap-2 text-xs text-purple-200">
                    <span>{summary?.today_bills_count || 0} Bills</span>
                    <span>•</span>
                    <span>{summary?.today_customers_count || 0} Clients</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-purple-400/20 text-[11px] text-purple-200 flex justify-between">
                <span>Avg Ticket: ₹{summary?.average_ticket_size || 0}</span>
                <span className="font-semibold text-emerald-300">Live Register</span>
              </div>
            </BentoCard>

            {/* Weekly Revenue Bento Card */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Weekly Revenue (7d)
                </span>
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white font-['Outfit']">
                  ₹{summary ? Number(summary.weekly_revenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-slate-400 mt-1">Rolling 7-day performance</p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Profitable pace</span>
              </div>
            </BentoCard>

            {/* Monthly Revenue Bento Card */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monthly Total (MTD)
                </span>
                <span className="bento-pill bento-pill-purple text-[10px]">
                  Current Month
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-purple-300 font-['Outfit']">
                  ₹{summary ? Number(summary.monthly_revenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-slate-400 mt-1">Month-to-date business volume</p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[11px] text-slate-400 flex justify-between">
                <span>Target: ₹100,000</span>
                <span className="text-purple-300 font-bold">On track</span>
              </div>
            </BentoCard>

            {/* Yearly Revenue Bento Card */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Yearly Total (YTD)
                </span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-amber-400 font-['Outfit']">
                  ₹{summary ? Number(summary.yearly_revenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-slate-400 mt-1">Cumulative fiscal year revenue</p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[11px] text-slate-400 flex justify-between">
                <span>Active Stylists: {summary?.active_staff_count || 0}</span>
                <span className="text-slate-200">{summary?.total_active_services || 0} Services</span>
              </div>
            </BentoCard>
          </div>

          {/* Bento Row 2: Revenue Chart Visualizer & Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart Widget */}
            <div className="bento-card p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Revenue Trend Visualizer
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dynamic trend analysis across customized time buckets
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                  {(['week', 'month', 'year'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                        chartPeriod === period
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
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
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
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
                        backgroundColor: '#120f2b',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                        fontSize: '12px',
                        color: '#fff'
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#a855f7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#purpleGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Economics Bento Tile */}
            <div className="bento-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Salon Business Economics
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Key unit economics metrics for profit optimization
                </p>

                <div className="mt-5 space-y-4">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Average Ticket Size (ATS)</p>
                      <p className="text-xl font-bold text-white mt-0.5">
                        ₹{summary?.average_ticket_size || 0}
                      </p>
                    </div>
                    <span className="bento-pill bento-pill-green text-[10px]">Optimal</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Active Staff Utilization</p>
                      <p className="text-xl font-bold text-purple-300 mt-0.5">
                        {summary?.active_staff_count || 0} Stylists
                      </p>
                    </div>
                    <span className="bento-pill bento-pill-purple text-[10px]">On Floor</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Configured Service Offerings</p>
                      <p className="text-xl font-bold text-white mt-0.5">
                        {services.length} Base Services
                      </p>
                    </div>
                    <span className="bento-pill bento-pill-amber text-[10px]">Tiered Options</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-[11px] text-slate-400">
                Formula adjustments & expense overheads can be expanded in next release.
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
              <h2 className="text-xl font-bold text-white font-['Outfit']">
                Services & Dynamic Option Modifiers Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Only Salon Admins can create and modify service pricing and add-on options (e.g. Haircut + Hairwash shampoos).
              </p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition"
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
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {srv.category}
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      Base: ₹{Number(srv.base_price)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2 font-['Outfit']">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {srv.description || 'No description provided.'}
                  </p>

                  {/* Options Matrix */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Available Options / Add-ons:</span>
                      <span className="text-[10px] text-purple-300 font-mono">
                        {srv.options.length} options
                      </span>
                    </p>

                    {srv.options.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No add-ons configured.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {srv.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="text-[11px] p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-slate-400 text-[10px] block">{opt.group_name}</span>
                              <span className="text-white font-medium">{opt.option_name}</span>
                            </div>
                            <span className="font-bold text-purple-300">
                              {Number(opt.extra_price) > 0 ? `+₹${opt.extra_price}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {srv.duration_minutes} mins
                  </span>
                  <span className="text-emerald-400 font-semibold">Active in POS</span>
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
              <h2 className="text-xl font-bold text-white font-['Outfit']">
                Salon Staff & Stylist Team
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff can manage customers and execute billing, but cannot view total salon financials or alter base service prices.
              </p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition"
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
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                      {st.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{st.full_name}</h3>
                      <p className="text-[11px] text-slate-400">{st.email}</p>
                    </div>
                  </div>
                  <span className="bento-pill bento-pill-green text-[10px]">Active</span>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Commission Rate:</span>
                    <strong className="text-purple-300">{st.commission_rate}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Phone:</span>
                    <span>{st.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Access Role:</span>
                    <span className="font-mono text-emerald-400 text-[11px]">{st.role}</span>
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
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Soft-Deleted Customers Audit Vault
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff cannot permanently purge customer records. Review the exact reasons provided upon deletion and restore anytime.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-bold">
              {deletedCustomers.length} Archived Records
            </span>
          </div>

          {deletedCustomers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No soft-deleted customer records. All customer accounts are currently active.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-white/[0.01]">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                    <th className="py-3 px-4">Mandatory Deletion Reason</th>
                    <th className="py-3 px-4">Deleted At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deletedCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {cust.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {cust.phone}
                        {cust.email && <div className="text-[10px] text-slate-500">{cust.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-medium">
                          "{cust.deletion_reason || 'No reason provided'}"
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {cust.deleted_at ? new Date(cust.deleted_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRestoreCustomer(cust.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition ml-auto"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-xl bg-[#141033] border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              Create New Service with Options Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure tiered pricing and add-ons (e.g. Haircut with specific Shampoo formulas or Hair Length surcharges).
            </p>

            <form onSubmit={handleCreateService} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category *</label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-[#1b173e] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="Hair">Hair</option>
                    <option value="Skin">Skin / Facial</option>
                    <option value="Spa">Spa & Massage</option>
                    <option value="Grooming">Beard & Grooming</option>
                    <option value="Nails">Nails</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Precision Layered Cut"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newService.base_price}
                    onChange={(e) => setNewService({ ...newService, base_price: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Includes consultation, shampoo wash, styling..."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              {/* Dynamic Options List */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-300">
                    Add-ons & Options Modifiers:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOptionRow}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newService.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <input
                        type="text"
                        placeholder="Group (e.g. Shampoo Type)"
                        value={opt.group_name}
                        onChange={(e) => {
                          const updated = [...newService.options];
                          updated[idx].group_name = e.target.value;
                          setNewService({ ...newService, options: updated });
                        }}
                        className="w-1/3 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
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
                        className="w-1/3 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
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
                        className="w-1/4 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionRow(idx)}
                        className="p-1.5 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#141033] border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              Register New Staff Member
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Create a staff/stylist login account for customer management and POS billing.
            </p>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Taylor"
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Staff Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jessica@salon.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Commission %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newStaff.commission_rate}
                    onChange={(e) => setNewStaff({ ...newStaff, commission_rate: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <input
                    type="text"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition"
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
