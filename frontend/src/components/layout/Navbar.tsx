import React from 'react';
import { Shield, Sparkles, Scissors, Crown, LogOut, Sun, Moon, LayoutDashboard, BookOpen } from 'lucide-react';
import type { Role } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentRole: Role;
  currentUserEmail: string;
  currentSalonName?: string;
  currentNav: 'dashboard' | 'rules';
  onNavigate: (nav: 'dashboard' | 'rules') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUserEmail,
  currentSalonName,
  currentNav,
  onNavigate,
  onLogout
}) => {
  const { theme, toggleTheme } = useTheme();

  // Single role display as requested: "Super admin or owner or staff"
  const renderRoleBadge = () => {
    if (currentRole === 'SUPER_ADMIN') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          Super Admin
        </span>
      );
    }
    if (currentRole === 'SALON_OWNER') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-xs font-bold">
          <Crown className="w-3.5 h-3.5 text-sky-500" />
          Owner
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold">
        <Scissors className="w-3.5 h-3.5 text-emerald-500" />
        Staff
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[var(--nav-bg)] border-b border-[var(--bento-card-border)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand: "Lux" */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[var(--bento-bg)] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[var(--text-main)] font-['Outfit']">
              Lux
            </span>
            {currentRole !== 'SUPER_ADMIN' && currentSalonName && (
              <p className="text-xs text-sky-700 dark:text-sky-300/80 font-medium truncate max-w-[200px]">
                {currentSalonName}
              </p>
            )}
          </div>
        </div>

        {/* Navigation & Role Badge */}
        <div className="flex items-center gap-3">
          {/* Navigation Links: Dashboard and Rules (Rules visible to Super Admin & Owner, hidden for Staff) */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-[var(--bento-card-border)]">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentNav === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>

            {currentRole !== 'STAFF' && (
              <button
                onClick={() => onNavigate('rules')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentNav === 'rules'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Rules
              </button>
            )}
          </nav>

          {/* Single Role Mention */}
          <div className="hidden sm:block">
            {renderRoleBadge()}
          </div>
        </div>

        {/* User Account / Theme Toggle / Logout */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-white/5 hover:bg-sky-500/20 dark:hover:bg-white/10 text-sky-700 dark:text-sky-300 border border-[var(--bento-card-border)] transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-sky-700" />
            )}
          </button>

          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-[var(--text-main)] leading-tight">
              {currentUserEmail}
            </p>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-xl bg-sky-500/5 dark:bg-white/5 hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-300 border border-[var(--bento-card-border)] hover:border-rose-500/30 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
