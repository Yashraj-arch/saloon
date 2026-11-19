import React, { useEffect, useState } from 'react';
import { X, Receipt, UserCheck, Scissors, CreditCard } from 'lucide-react';
import type { CalendarDrilldownResponse } from '../../types';
import { api } from '../../services/api';

interface DayDrilldownDrawerProps {
  dateStr: string | null;
  onClose: () => void;
}

export const DayDrilldownDrawer: React.FC<DayDrilldownDrawerProps> = ({
  dateStr,
  onClose
}) => {
  const [data, setData] = useState<CalendarDrilldownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'staff' | 'services'>('invoices');

  useEffect(() => {
    if (!dateStr) return;
    const fetchDrilldown = async () => {
      try {
        setLoading(true);
        const res = await api.admin.getCalendarDrilldown(dateStr);
        setData(res);
      } catch (err) {
        console.error('Failed to fetch drilldown:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrilldown();
  }, [dateStr]);

  if (!dateStr) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#0b101b] border-l border-[var(--bento-card-border)] p-6 flex flex-col justify-between overflow-y-auto shadow-2xl transition-colors duration-300">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[var(--bento-card-border)]">
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bento-pill-blue">
                Day Revenue Drilldown
              </span>
              <h2 className="text-2xl font-black text-[var(--text-main)] mt-1 font-['Outfit']">
                {new Date(dateStr).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-sky-500/8 dark:bg-white/5 hover:bg-sky-500/15 text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Revenue Summary Card */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-600/10 dark:from-sky-950/40 dark:to-slate-900/40 border border-sky-400/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-sky-800 dark:text-sky-300 font-medium">Total Day Revenue</p>
              <p className="text-3xl font-extrabold text-[var(--text-main)] mt-0.5 font-['Outfit']">
                ₹{data ? Number(data.total_revenue).toLocaleString() : '0'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-sky-800 dark:text-sky-300 font-medium">Completed Orders</p>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-['Outfit']">
                {data ? data.bills_count : 0}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-5 border-b border-[var(--bento-card-border)] pb-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-500 dark:text-slate-950'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-sky-500/5 dark:bg-white/5'
              }`}
            >
              Invoices ({data?.bills.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-500 dark:text-slate-950'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-sky-500/5 dark:bg-white/5'
              }`}
            >
              Stylist Earnings
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-500 dark:text-slate-950'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-sky-500/5 dark:bg-white/5'
              }`}
            >
              Top Services
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-[var(--text-muted)]">Loading day transactions...</div>
            ) : activeTab === 'invoices' ? (
              data?.bills.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                  No invoices recorded on this day.
                </div>
              ) : (
                data?.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 rounded-2xl bg-sky-500/[0.03] dark:bg-white/[0.03] border border-[var(--bento-card-border)] hover:border-sky-400/40 transition flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span className="text-xs font-bold text-[var(--text-main)]">{bill.invoice_number}</span>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(bill.total_amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>Customer: <strong className="text-[var(--text-main)]">{bill.customer_name || 'Walk-in'}</strong></span>
                      <span>Stylist: <strong className="text-[var(--text-main)]">{bill.staff_name || 'Assigned'}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--bento-card-border)]">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {bill.payment_method}
                      </span>
                      <span>
                        {new Date(bill.billed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Services and Option Modifiers */}
                    <div className="mt-1 flex flex-col gap-1">
                      {bill.items.map((item) => {
                        let parsedOptions: { group_name: string; option_name: string; extra_price: number }[] = [];
                        try {
                          if (item.selected_options_json) {
                            parsedOptions = JSON.parse(item.selected_options_json);
                          }
                        } catch {}

                        return (
                          <div key={item.id} className="text-xs p-2 rounded-lg bg-sky-500/5 dark:bg-black/20 text-[var(--text-main)]">
                            <div className="flex justify-between font-medium">
                              <span>{item.service_name}</span>
                              <span className="font-bold">₹{Number(item.final_price)}</span>
                            </div>
                            {parsedOptions.length > 0 && (
                              <div className="text-[10px] text-sky-700 dark:text-sky-300 mt-0.5 flex flex-wrap gap-1">
                                {parsedOptions.map((opt, oIdx) => (
                                  <span key={oIdx} className="px-1.5 py-0.5 rounded bg-sky-500/10 dark:bg-sky-950/40 border border-sky-400/25">
                                    {opt.group_name}: {opt.option_name} (+₹{opt.extra_price})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'staff' ? (
              data?.staff_breakdown.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-sm">No staff sales recorded.</div>
              ) : (
                data?.staff_breakdown.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-sky-500/[0.03] dark:bg-white/[0.03] border border-[var(--bento-card-border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">{st.staff_name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{st.bill_count} service sessions</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[var(--text-main)] font-['Outfit']">₹{st.revenue.toLocaleString()}</span>
                  </div>
                ))
              )
            ) : (
              data?.top_services.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-sky-500/[0.03] dark:bg-white/[0.03] border border-[var(--bento-card-border)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <p className="text-xs font-bold text-[var(--text-main)]">{srv.service_name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{srv.count} performed</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-sky-700 dark:text-sky-300 font-['Outfit']">₹{srv.revenue.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--bento-card-border)] mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
