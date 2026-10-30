import React, { useState, useEffect } from 'react';
import {
  Scissors,
  UserPlus,
  Search,
  Trash2,
  Receipt,
  Plus,
  AlertTriangle,
  ShoppingBag,
  Printer
} from 'lucide-react';
import type { Customer, Service, Bill, SelectedOption } from '../types';
import { api } from '../services/api';

export const StaffPOSDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'customers' | 'history'>('pos');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<Customer | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  // New Customer Form
  const [newCust, setNewCust] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: 'Female',
    notes: ''
  });

  // POS Billing Cart State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<{
    service: Service;
    selectedOptions: SelectedOption[];
  }[]>([]);
  const [submittingBill, setSubmittingBill] = useState(false);

  const loadData = async () => {
    try {
      const [custs, srvs, bills] = await Promise.all([
        api.customers.list(searchQuery),
        api.services.list(),
        api.billing.list(20)
      ]);
      setCustomers(custs);
      setServices(srvs);
      setRecentBills(bills);
      if (custs.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custs[0].id);
      }
    } catch (err) {
      console.error('Failed to load staff portal data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.customers.create(newCust);
      setShowAddCustomerModal(false);
      setNewCust({ full_name: '', phone: '', email: '', gender: 'Female', notes: '' });
      setSelectedCustomerId(created.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deleteCustomerTarget) return;
    if (!deletionReason || deletionReason.trim().length < 5) {
      alert('A valid deletion reason (min 5 characters) is mandatory.');
      return;
    }

    try {
      await api.customers.softDelete(deleteCustomerTarget.id, deletionReason.trim());
      setDeleteCustomerTarget(null);
      setDeletionReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error soft-deleting customer');
    }
  };

  const handleAddToCart = (srv: Service) => {
    // Pick default options if any
    const defaultOpts: SelectedOption[] = srv.options
      .filter((o) => o.is_default)
      .map((o) => ({
        group_name: o.group_name,
        option_name: o.option_name,
        extra_price: Number(o.extra_price)
      }));

    setCartItems([...cartItems, { service: srv, selectedOptions: defaultOpts }]);
  };

  const handleToggleOption = (cartIndex: number, opt: any) => {
    const updated = [...cartItems];
    const currentSelected = updated[cartIndex].selectedOptions;
    const existsIndex = currentSelected.findIndex(
      (o) => o.group_name === opt.group_name && o.option_name === opt.option_name
    );

    if (existsIndex >= 0) {
      currentSelected.splice(existsIndex, 1);
    } else {
      currentSelected.push({
        group_name: opt.group_name,
        option_name: opt.option_name,
        extra_price: Number(opt.extra_price)
      });
    }

    setCartItems(updated);
  };

  const handleRemoveFromCart = (cartIndex: number) => {
    const updated = [...cartItems];
    updated.splice(cartIndex, 1);
    setCartItems(updated);
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const base = Number(item.service.base_price);
    const extras = item.selectedOptions.reduce((oAcc, o) => oAcc + o.extra_price, 0);
    return acc + base + extras;
  }, 0);

  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckoutBill = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer for this bill.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one service to checkout.');
      return;
    }

    try {
      setSubmittingBill(true);
      const payload = {
        customer_id: selectedCustomerId,
        staff_id: null,
        items: cartItems.map((item) => ({
          service_id: item.service.id,
          selected_options: item.selectedOptions
        })),
        discount_amount: discountAmount,
        payment_method: paymentMethod
      };

      const bill = await api.billing.create(payload);
      setReceiptBill(bill);
      setCartItems([]);
      setDiscountAmount(0);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error processing billing');
    } finally {
      setSubmittingBill(false);
    }
  };

  const selectedCustObj = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Scissors className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[var(--text-main)] font-['Outfit']">
              Staff Front Desk & POS Terminal
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Register clients, select services + modifiers (hairwash/shampoo), and generate invoices.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--bento-card-border)] shadow-sm">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'pos'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Live POS Checkout
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'customers'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Customer CRM ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Recent Invoices
          </button>
        </div>
      </div>

      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Service Selection & Modifiers */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bento-card p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--bento-card-border)]">
                <h3 className="text-sm font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Select Services & Add-on Modifiers
                </h3>
                <span className="text-xs text-[var(--text-muted)]">{services.length} services available</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 hover:border-sky-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                          {srv.category}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{Number(srv.base_price)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-main)] mt-1.5">{srv.name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{srv.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--bento-card-border)] flex items-center justify-between">
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                        {srv.options.length} modifier options
                      </span>
                      <button
                        onClick={() => handleAddToCart(srv)}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout Drawer */}
          <div className="bento-card p-5 flex flex-col justify-between h-full">
            <div>
              {/* Customer Selector */}
              <div className="pb-3 border-b border-[var(--bento-card-border)]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">Select Customer *</label>
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    New Client
                  </button>
                </div>

                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500 cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>

                {selectedCustObj && (
                  <div className="mt-2 p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/20 text-[11px] text-sky-900 dark:text-sky-200">
                    <span className="font-semibold">{selectedCustObj.full_name}</span>
                    {selectedCustObj.notes && (
                      <span className="block text-[10px] text-[var(--text-muted)] italic">
                        Note: {selectedCustObj.notes}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Items in Cart */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Order Items ({cartItems.length})
                </h4>

                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-muted)] text-xs">
                    Cart is empty. Click "+ Add" on any service.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cartItems.map((item, idx) => {
                      const itemBase = Number(item.service.base_price);
                      const itemExtras = item.selectedOptions.reduce((acc, o) => acc + o.extra_price, 0);
                      const itemLineTotal = itemBase + itemExtras;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--text-main)]">{item.service.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[var(--text-main)]">₹{itemLineTotal}</span>
                              <button
                                onClick={() => handleRemoveFromCart(idx)}
                                className="text-rose-500 hover:text-rose-600 p-0.5 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Configurable Modifiers (Shampoos, Lengths, Add-ons) */}
                          {item.service.options.length > 0 && (
                            <div className="pt-2 border-t border-[var(--bento-card-border)] space-y-1">
                              <span className="text-[10px] text-[var(--text-muted)] font-semibold block">
                                Choose Modifiers / Options:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.service.options.map((opt) => {
                                  const isSelected = item.selectedOptions.some(
                                    (o) => o.group_name === opt.group_name && o.option_name === opt.option_name
                                  );

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleToggleOption(idx, opt)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition ${
                                        isSelected
                                          ? 'bg-sky-600 text-white font-bold shadow-sm'
                                          : 'bg-slate-200 dark:bg-white/5 text-[var(--text-muted)] hover:bg-slate-300 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {opt.option_name} (+₹{opt.extra_price})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Checkout Controls */}
            <div className="mt-4 pt-4 border-t border-[var(--bento-card-border)] space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[var(--text-main)]">₹{subtotal}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-right text-[var(--text-main)] outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-between text-sm font-extrabold text-[var(--text-main)] pt-2 border-t border-[var(--bento-card-border)]">
                <span>Total Due:</span>
                <span className="text-xl text-emerald-600 dark:text-emerald-400 font-black">₹{total}</span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                  {['UPI', 'CASH', 'CARD', 'SPLIT'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 rounded-xl transition ${
                        paymentMethod === m
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckoutBill}
                disabled={submittingBill || cartItems.length === 0}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-40"
              >
                {submittingBill ? 'Processing Invoice...' : `Complete Checkout • ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer CRM Tab */}
      {activeTab === 'customers' && (
        <div className="bento-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--bento-card-border)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                Customer Directory & Client Profiles
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Staff can manage client details. Soft-deleted clients are safely archived and require an audit reason.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none w-48 sm:w-64 focus:border-sky-500"
                />
              </div>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Customer
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs text-[var(--text-main)]">
              <thead className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--bento-card-border)] bg-slate-50 dark:bg-white/[0.01]">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Special Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bento-card-border)]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold border border-sky-500/20">
                        {c.full_name.charAt(0)}
                      </div>
                      {c.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">{c.phone}</td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">{c.email || '—'}</td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">{c.gender || '—'}</td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)] max-w-xs truncate">
                      {c.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setDeleteCustomerTarget(c);
                          setDeletionReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                      >
                        Soft Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices Tab */}
      {activeTab === 'history' && (
        <div className="bento-card p-6">
          <h2 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] pb-3 border-b border-[var(--bento-card-border)]">
            Recent Invoices Stream
          </h2>

          <div className="space-y-3 mt-4">
            {recentBills.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-sky-500/30 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-[var(--text-main)]">{b.invoice_number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    Client: <strong className="text-[var(--text-main)]">{b.customer_name}</strong> • Method: {b.payment_method}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-[var(--text-main)]">
                    ₹{Number(b.total_amount).toLocaleString()}
                  </span>
                  <button
                    onClick={() => setReceiptBill(b)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                    title="View Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Soft-Delete Customer Modal */}
      {deleteCustomerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c121e] border border-rose-500/30 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                Soft-Delete Customer Record
              </h3>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              You are deleting client <strong className="text-[var(--text-main)]">{deleteCustomerTarget.full_name}</strong>.
              In accordance with CRM audit rules, <strong>this client will not be permanently deleted</strong>; they will be archived in the Owner Audit Vault.
            </p>

            <div className="mt-4">
              <label className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">
                Mandatory Deletion Reason * (min 5 characters)
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Client requested account removal / Duplicate contact number..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-rose-500"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                {deletionReason.trim().length < 5
                  ? `Need ${5 - deletionReason.trim().length} more characters to enable deletion.`
                  : '✓ Reason provided meets audit compliance.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bento-card-border)] mt-4">
              <button
                type="button"
                onClick={() => setDeleteCustomerTarget(null)}
                className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSoftDelete}
                disabled={deletionReason.trim().length < 5}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition disabled:opacity-40"
              >
                Confirm Soft Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
              Register New Customer
            </h3>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Natasha Romanoff"
                  value={newCust.full_name}
                  onChange={(e) => setNewCust({ ...newCust, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98000 00000"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Gender</label>
                  <select
                    value={newCust.gender}
                    onChange={(e) => setNewCust({ ...newCust, gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Email</label>
                <input
                  type="email"
                  placeholder="natasha@example.com"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Preferences / Stylist Notes</label>
                <textarea
                  rows={2}
                  placeholder="Scalp sensitivity, favorite hair serum, etc."
                  value={newCust.notes}
                  onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bento-card-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {receiptBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl font-mono text-xs border border-slate-200">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h3 className="text-lg font-black tracking-tight font-sans text-slate-900">
                LUXE SALON & SPA
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">Official Client Invoice</p>
              <p className="text-[10px] text-slate-400 mt-1">{receiptBill.invoice_number}</p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold">{receiptBill.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span>{receiptBill.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(receiptBill.billed_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {receiptBill.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.service_name}</span>
                  <span className="font-bold">₹{Number(item.final_price)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 space-y-1">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span className="text-emerald-700">₹{Number(receiptBill.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-6 text-[10px] text-slate-400 font-sans">
              Thank you for choosing LuxeSalon!
            </div>

            <button
              onClick={() => setReceiptBill(null)}
              className="w-full mt-4 py-2 bg-slate-900 text-white rounded-xl font-bold font-sans text-xs hover:bg-slate-800 transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
