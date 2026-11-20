import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, Printer, ArrowLeft, Calendar, User, CreditCard } from 'lucide-react';
import type { VerifiedInvoice } from '../types';
import { api } from '../services/api';

interface PublicVerifyInvoicePageProps {
  invoiceNumber: string;
  onBack?: () => void;
}

export const PublicVerifyInvoicePage: React.FC<PublicVerifyInvoicePageProps> = ({ invoiceNumber, onBack }) => {
  const [invoice, setInvoice] = useState<VerifiedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.verify.get(invoiceNumber);
        setInvoice(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invoice verification failed';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (invoiceNumber) {
      fetchInvoice();
    }
  }, [invoiceNumber]);

  return (
    <div className="min-h-screen bg-[var(--bento-bg)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0c121e] border border-[var(--bento-card-border)] rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-[var(--text-main)]">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] mb-4 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        )}

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[var(--text-muted)] font-medium">Verifying invoice authenticity...</p>
          </div>
        ) : error || !invoice ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-black">
              ✕
            </div>
            <h2 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">Verification Failed</h2>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              {error || `No verified invoice record was found for '${invoiceNumber}'.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="text-center pb-4 border-b border-[var(--bento-card-border)]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authentic Digital Invoice
              </div>
              <h1 className="text-2xl font-black text-[var(--text-main)] font-['Outfit'] tracking-tight">
                {invoice.salon_name}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{invoice.invoice_number}</p>
            </div>

            {/* Meta details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-500" /> Client:
                </span>
                <strong className="text-[var(--text-main)]">{invoice.customer_name}</strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" /> Date & Time:
                </span>
                <span>{new Date(invoice.billed_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-500" /> Payment Tender:
                </span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">{invoice.payment_method}</span>
              </div>
            </div>

            {/* Items */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-[var(--bento-card-border)] space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider pb-1 border-b border-[var(--bento-card-border)]">
                Verified Services Rendered
              </div>
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <span className="text-[var(--text-main)] font-medium">{item.service_name}</span>
                  <span className="font-bold text-[var(--text-main)]">₹{Number(item.final_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-2 border-t border-[var(--bento-card-border)] flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Total Paid</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{Number(invoice.total_amount).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Copy
              </button>
            </div>

            <div className="text-center pt-2 text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              Cryptographically verified by Lux SaaS Security Ledger
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
