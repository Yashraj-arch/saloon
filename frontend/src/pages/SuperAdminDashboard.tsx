import React, { useState, useEffect } from 'react';
import { Shield, Building2, Plus, CreditCard, Lock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { Tenant } from '../types';
import { api } from '../services/api';
import { BentoCard } from '../components/bento/BentoCard';

export const SuperAdminDashboard: React.FC = () => {
  const [salons, setSalons] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    subscription_plan: 'Pro',
    initial_owner_password: 'Password@123'
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const data = await api.superadmin.listSalons();
      setSalons(data);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to fetch salons' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMsg(null);
      await api.superadmin.createSalon(form);
      setMsg({ type: 'success', text: `Salon '${form.name}' provisioned successfully!` });
      setShowAddModal(false);
      setForm({
        name: '',
        owner_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        subscription_plan: 'Pro',
        initial_owner_password: 'Password@123'
      });
      fetchSalons();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to provision salon' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.superadmin.toggleStatus(id);
      fetchSalons();
    } catch (err: any) {
      alert(err.message || 'Error toggling salon status');
    }
  };

  const activeSalonsCount = salons.filter((s) => s.is_active && s.subscription_status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Platform Owner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white font-['Outfit']">
              Super Admin SaaS Portal
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Provision salon accounts, manage database tenancies, and license subscriptions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Provision New Salon
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
        <Lock className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-indigo-200 leading-relaxed">
          <strong className="text-white block font-bold mb-0.5">Privacy & Strict Revenue Isolation Enforced:</strong>
          As the platform Super Admin, you manage salon database access and subscription licenses with each salon's name.
          In accordance with multi-tenant privacy rules, <strong>individual salon revenue totals, customer details, and financial ledgers are completely hidden from this portal</strong> and can only be accessed by the respective Salon Owner.
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Bento Platform KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Salons</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">{salons.length}</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="bento-pill bento-pill-green">Active: {activeSalonsCount}</span>
            </div>
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">License Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-emerald-400">
              {salons.length > 0 ? `${Math.round((activeSalonsCount / salons.length) * 100)}%` : '100%'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Tenant subscription health</p>
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Enterprise Salons</span>
            <CreditCard className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-indigo-300">
              {salons.filter((s) => s.subscription_plan === 'Enterprise').length}
            </span>
            <span className="bento-pill bento-pill-purple mt-1">High-tier</span>
          </div>
        </BentoCard>

        <BentoCard variant="purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-200">SaaS Multi-Tenancy</span>
            <Shield className="w-4 h-4 text-purple-200" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white">Row-Isolated</span>
            <p className="text-[11px] text-purple-200 mt-1">MySQL 8.0 schema</p>
          </div>
        </BentoCard>
      </div>

      {/* Salons Table */}
      <div className="bento-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white font-['Outfit']">
            Tenant Salons Registry
          </h3>
          <button
            onClick={fetchSalons}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading salon tenancies...</div>
        ) : salons.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No salons provisioned yet. Click "Provision New Salon" to onboard your first client.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-white/[0.01]">
                <tr>
                  <th className="py-3 px-4">Salon Name</th>
                  <th className="py-3 px-4">Owner & Contact</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {salons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{salon.name}</div>
                      <span className="text-[10px] font-mono text-purple-300/80">/{salon.slug}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{salon.owner_name}</div>
                      <div className="text-[11px] text-slate-400">{salon.contact_email}</div>
                      <div className="text-[11px] text-slate-500">{salon.contact_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        {salon.subscription_plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`bento-pill ${
                          salon.is_active && salon.subscription_status === 'ACTIVE'
                            ? 'bento-pill-green'
                            : 'bento-pill-rose'
                        }`}
                      >
                        {salon.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(salon.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(salon.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                          salon.is_active
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {salon.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision New Salon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#141033] border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              Provision New Salon Tenant
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Creates the tenant database record and initial Salon Owner login credentials.
            </p>

            <form onSubmit={handleCreateSalon} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Salon Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Elegance Lounge"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Green"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 00000"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Owner Login Email *</label>
                <input
                  type="email"
                  required
                  placeholder="owner@salon.com"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Subscription Plan</label>
                  <select
                    value={form.subscription_plan}
                    onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-[#1b173e] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="Starter">Starter (₹1,999/mo)</option>
                    <option value="Pro">Pro (₹4,999/mo)</option>
                    <option value="Enterprise">Enterprise (₹9,999/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Initial Owner Password</label>
                  <input
                    type="text"
                    required
                    value={form.initial_owner_password}
                    onChange={(e) => setForm({ ...form, initial_owner_password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Salon Address</label>
                <input
                  type="text"
                  placeholder="e.g. 102 High Street, Downtown"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
