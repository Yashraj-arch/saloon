import React from 'react';
import { Shield, Sparkles, Scissors, Crown, LogOut } from 'lucide-react';
import type { Role } from '../../types';

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
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0a1a]/80 border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Salon Tenant Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b0a1a] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-['Outfit']">
                LuxeSalon
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SaaS
              </span>
            </div>
            {currentRole !== 'SUPER_ADMIN' && currentSalonName && (
              <p className="text-xs text-purple-300/80 font-medium truncate max-w-[200px]">
                {currentSalonName}
              </p>
            )}
          </div>
        </div>

        {/* Quick Persona / Role Switcher for seamless evaluation */}
        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 px-2 hidden md:inline">
            Active Persona:
          </span>

          <button
            onClick={() => onSwitchPersona('SUPER_ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentRole === 'SUPER_ADMIN'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            Super Admin
          </button>

          <button
            onClick={() => onSwitchPersona('SALON_OWNER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentRole === 'SALON_OWNER'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-purple-300" />
            Salon Owner
          </button>

          <button
            onClick={() => onSwitchPersona('STAFF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentRole === 'STAFF'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-300" />
            Staff / POS
          </button>
        </div>

        {/* User Account / Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-tight">
              {currentRole === 'SUPER_ADMIN'
                ? 'Alex Vance (Platform Owner)'
                : currentRole === 'SALON_OWNER'
                ? 'Sophia Martinez'
                : 'Marcus Reed'}
            </p>
            <p className="text-[10px] text-slate-400">{currentUserEmail}</p>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
