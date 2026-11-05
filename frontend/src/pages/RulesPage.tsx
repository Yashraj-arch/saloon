import React from 'react';
import { Shield, BookOpen, UserCheck, Scissors, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import type { Role } from '../types';
import { BentoCard } from '../components/bento/BentoCard';

interface RulesPageProps {
  role: Role;
}

export const RulesPage: React.FC<RulesPageProps> = ({ role }) => {
  // Staff cannot see any rules as per requirement
  if (role === 'STAFF') {
    return (
      <div className="py-20 text-center">
        <Lock className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h2 className="text-xl font-bold text-[var(--text-main)]">Access Restricted</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Operating rules are only accessible to Salon Owners and Platform Administrators.
        </p>
      </div>
    );
  }

  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[var(--text-main)] font-['Outfit']">
              Rules & Operating Governance
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Official operational policies, role permissions, compliance requirements, and audit protocols for Lux.
          </p>
        </div>

        <span className="self-start md:self-auto px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-xs font-bold">
          Viewing Scope: {isSuperAdmin ? 'Full Platform (All Rules)' : 'Salon Operations (Owner & Staff)'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Super Admin Platform Governance Rules - visible ONLY to Super Admin */}
        {isSuperAdmin && (
          <BentoCard variant="accent" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-white" />
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    Platform Governance Rules
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  Super Admin Only
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-xs text-white/90">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Multi-Tenant Data Isolation:</strong> Every salon tenancy is strictly isolated by <code className="bg-white/10 px-1 py-0.5 rounded">tenant_id</code>. Super Admin provisions database access and subscriptions, but cannot view individual salon client details or ledger records.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Subscription Life Cycle:</strong> Tenancy status can be toggled between Active and Suspended. Suspended salons are immediately locked out of POS billing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Initial Credential Provisioning:</strong> Initial owner credentials are created upon tenancy setup. Owners must manage subsequent staff accounts.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-white/70">
              Authority: Platform Administrator
            </div>
          </BentoCard>
        )}

        {/* 2. Salon Owner Operating Rules - visible to Super Admin and Owner */}
        <BentoCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--bento-card-border)]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-[var(--text-main)] font-['Outfit']">
                  Salon Owner Rules
                </h3>
              </div>
              <span className="bento-pill bento-pill-blue text-[10px]">
                Owner Scope
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-xs text-[var(--text-main)]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Catalog & Pricing Authority:</strong> Only Salon Owners and designated Admins can create services, set base prices, and configure add-on modifiers (e.g. specialized hairwash shampoos).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Staff Commission & Floor Control:</strong> Owners register stylists, set commission percentages, and monitor stylist utilization.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Full Financial Ledger Visibility:</strong> Exclusive access to real-time daily revenue, weekly rolling totals, monthly totals, and annual fiscal performance.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Audit Vault Restoration:</strong> Review soft-deleted clients, inspect mandatory deletion reasons, and execute 1-click account restorations.
                </span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--bento-card-border)] text-[11px] text-[var(--text-muted)]">
            Authority: Salon Owner / Salon Admin
          </div>
        </BentoCard>

        {/* 3. Staff Operating Rules - visible to Super Admin and Owner (Staff cannot view) */}
        <BentoCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--bento-card-border)]">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-[var(--text-main)] font-['Outfit']">
                  Staff Operational Rules
                </h3>
              </div>
              <span className="bento-pill bento-pill-green text-[10px]">
                Staff Scope
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-xs text-[var(--text-main)]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Front Desk Execution:</strong> Staff register new clients, manage notes, select service modifiers, and checkout invoices.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>No Base Price Alteration:</strong> Staff cannot modify base service prices or create new service offerings.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>No Permanent Purging:</strong> Customer records cannot be permanently erased by staff. Soft-deletion requires a mandatory compliant reason (minimum 5 characters).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Revenue Privacy:</strong> Staff cannot access salon-wide revenue totals, profit analytics, or other stylists' commission earnings.
                </span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--bento-card-border)] text-[11px] text-[var(--text-muted)]">
            Enforced by: Server-Side RBAC & Database Triggers
          </div>
        </BentoCard>
      </div>
    </div>
  );
};
