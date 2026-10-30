import React from 'react';
import { Shield, Sparkles, Scissors, Crown, LogOut, Sun, Moon } from 'lucide-react';
import type { Role } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentRole: Role;
  currentUserEmail: string;
  currentSalonName?: string;
  onSwitchPersona: (role: Role) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUserEmail,
  currentSalonName,
  onSwitchPersona,
  onLogout
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[var(--nav-bg)] border-b border-[var(--bento-card-border)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Salon Tenant Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[var(--bento-bg)] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[var(--text-main)] font-['Outfit']">
                LuxeSalon
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bento-pill-blue">
                SaaS
              </span>
            </div>
            {currentRole !== 'SUPER_ADMIN' && currentSalonName && (
              <p className="text-xs text-sky-700 dark:text-sky-300/80 font-medium truncate max-w-[200px]">
                {currentSalonName}
              </p>
            )}
          </div>
        </div>

        {/* Quick Persona / Role Switcher for seamless evaluation */}
        <div className="flex items-center gap-2 bg-sky-500/5 dark:bg-white/[0.03] p-1.5 rounded-2xl border border-[var(--bento-card-border)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] px-2 hidden md:inline">
            Active Persona:
          </span>

          <button
            onClick={() => onSwitchPersona('SUPER_ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentRole === 'SUPER_ADMIN'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-500 dark:text-slate-950'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-sky-500/10 dark:hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
            Super Admin
          </button>

          <button
            onClick={() => onSwitchPersona('SALON_OWNER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentRole === 'SALON_OWNER'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-500 dark:text-slate-950'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-sky-500/10 dark:hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-sky-500 dark:text-sky-300" />
            Salon Owner
          </button>

          <button
            onClick={() => onSwitchPersona('STAFF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentRole === 'STAFF'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-500 dark:text-slate-950'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-sky-500/10 dark:hover:bg-white/5'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-300" />
            Staff / POS
          </button>
        </div>

        {/* User Account / Theme Toggle / Logout */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-white/5 hover:bg-sky-500/20 dark:hover:bg-white/10 text-sky-700 dark:text-sky-300 border border-[var(--bento-card-border)] transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-sky-700" />
            )}
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[var(--text-main)] leading-tight">
              {currentRole === 'SUPER_ADMIN'
                ? 'Alex Vance (Platform Owner)'
                : currentRole === 'SALON_OWNER'
                ? 'Sophia Martinez'
                : 'Marcus Reed'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{currentUserEmail}</p>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-xl bg-sky-500/5 dark:bg-white/5 hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-300 border border-[var(--bento-card-border)] hover:border-rose-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
