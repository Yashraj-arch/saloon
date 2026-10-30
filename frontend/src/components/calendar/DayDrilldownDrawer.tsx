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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-[#120f2d] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Day Revenue Drilldown
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
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
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Revenue Summary Card */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-200">Total Day Revenue</p>
              <p className="text-3xl font-extrabold text-white mt-0.5">
                ₹{data ? Number(data.total_revenue).toLocaleString() : '0'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-200">Completed Orders</p>
              <p className="text-2xl font-bold text-purple-300">
                {data ? data.bills_count : 0}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-5 border-b border-white/5 pb-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                activeTab === 'invoices'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              Invoices ({data?.bills.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                activeTab === 'staff'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              Stylist Earnings
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                activeTab === 'services'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              Top Services
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading day transactions...</div>
            ) : activeTab === 'invoices' ? (
              data?.bills.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No invoices recorded on this day.
                </div>
              ) : (
                data?.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">{bill.invoice_number}</span>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-400">
                        ₹{Number(bill.total_amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Customer: <strong className="text-slate-200">{bill.customer_name || 'Walk-in'}</strong></span>
                      <span>Stylist: <strong className="text-slate-200">{bill.staff_name || 'Assigned'}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {bill.payment_method}
                      </span>
                      <span>
                        {new Date(bill.billed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Services and Option Modifiers */}
                    <div className="mt-1 flex flex-col gap-1">
                      {bill.items.map((item) => {
                        let parsedOptions: any[] = [];
                        try {
                          if (item.selected_options_json) {
                            parsedOptions = JSON.parse(item.selected_options_json);
                          }
                        } catch {}

                        return (
                          <div key={item.id} className="text-xs p-2 rounded-lg bg-black/20 text-slate-300">
                            <div className="flex justify-between font-medium">
                              <span>{item.service_name}</span>
                              <span className="text-slate-200">₹{Number(item.final_price)}</span>
                            </div>
                            {parsedOptions.length > 0 && (
                              <div className="text-[10px] text-purple-300 mt-0.5 flex flex-wrap gap-1">
                                {parsedOptions.map((opt, oIdx) => (
                                  <span key={oIdx} className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/20">
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
                <div className="py-12 text-center text-slate-500 text-sm">No staff sales recorded.</div>
              ) : (
                data?.staff_breakdown.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs font-bold text-white">{st.staff_name}</p>
                        <p className="text-[10px] text-slate-400">{st.bill_count} service sessions</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-white">₹{st.revenue.toLocaleString()}</span>
                  </div>
                ))
              )
            ) : (
              data?.top_services.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{srv.service_name}</p>
                      <p className="text-[10px] text-slate-400">{srv.count} performed</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-purple-300">₹{srv.revenue.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
