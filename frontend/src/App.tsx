import React, { useState, useEffect } from 'react';
import type { Role } from './types';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SalonOwnerDashboard } from './pages/SalonOwnerDashboard';
import { StaffPOSDashboard } from './pages/StaffPOSDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { Sparkles, Shield, Crown, Scissors, ArrowRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [currentRole, setCurrentRole] = useState<Role>('SALON_OWNER');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('owner@luxeaura.com');
  const [currentSalonName, setCurrentSalonName] = useState<string | undefined>('Luxe Aura Hair & Spa');

  // Manual login modal state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Login handler
  const performLogin = async (email: string, pass: string) => {
    try {
      setLoggingIn(true);
      setLoginError(null);
      const res = await api.login(email, pass);
      localStorage.setItem('access_token', res.access_token);
      setToken(res.access_token);
      setCurrentRole(res.role);
      setCurrentUserEmail(res.email);
      setCurrentSalonName(res.salon_name);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed. Please verify credentials.';
      setLoginError(errorMsg);
    } finally {
      setLoggingIn(false);
    }
  };

  // Switch persona conveniently
  const handleSwitchPersona = async (role: Role) => {
    if (role === 'SUPER_ADMIN') {
      await performLogin('superadmin@luxesaloon.com', 'SuperAdmin@123');
    } else if (role === 'SALON_OWNER') {
      await performLogin('owner@luxeaura.com', 'Owner@123');
    } else if (role === 'STAFF') {
      await performLogin('staff@luxeaura.com', 'Staff@123');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
  };

  // Initial auto-login to Demo Salon Owner for immediate WOW presentation
  useEffect(() => {
    const initApp = async () => {
      try {
        await performLogin('owner@luxeaura.com', 'Owner@123');
      } catch (e) {
        console.warn('Backend may still be starting up, waiting for user login...', e);
      }
    };
    initApp();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bento-bg)] text-[var(--text-main)] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-sky-500/8 dark:bg-sky-400/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-600/6 dark:bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      {token ? (
        <>
          <Navbar
            currentRole={currentRole}
            currentUserEmail={currentUserEmail}
            currentSalonName={currentSalonName}
            onSwitchPersona={handleSwitchPersona}
            onLogout={handleLogout}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {currentRole === 'SUPER_ADMIN' && <SuperAdminDashboard />}
            {currentRole === 'SALON_OWNER' && <SalonOwnerDashboard />}
            {currentRole === 'STAFF' && <StaffPOSDashboard />}
          </main>
        </>
      ) : (
        /* Login Screen */
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md bento-card p-8 border border-[var(--bento-card-border)] shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-xl shadow-sky-500/20 flex items-center justify-center mb-3">
                <div className="w-full h-full bg-[var(--bento-bg)] rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-[var(--text-main)] font-['Outfit']">LuxeSalon CRM</h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">Multi-Tenant Salon SaaS Platform</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/12 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                performLogin(emailInput, passwordInput);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Account Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@salon.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-sky-500/5 dark:bg-white/5 border border-[var(--bento-card-border)] rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-sky-500/5 dark:bg-white/5 border border-[var(--bento-card-border)] rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-sky-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {loggingIn ? 'Authenticating...' : 'Sign In to Workspace'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Logins */}
            <div className="mt-6 pt-5 border-t border-[var(--bento-card-border)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center mb-3">
                1-Click Demo Logins
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSwitchPersona('SALON_OWNER')}
                  className="p-2.5 rounded-xl bg-sky-500/5 dark:bg-white/5 hover:bg-sky-500/15 border border-[var(--bento-card-border)] text-sky-700 dark:text-sky-300 font-bold text-center transition cursor-pointer"
                >
                  <Crown className="w-4 h-4 mx-auto mb-1 text-sky-600 dark:text-sky-400" />
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPersona('SUPER_ADMIN')}
                  className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-white/5 hover:bg-amber-500/15 border border-[var(--bento-card-border)] text-amber-700 dark:text-amber-300 font-bold text-center transition cursor-pointer"
                >
                  <Shield className="w-4 h-4 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPersona('STAFF')}
                  className="p-2.5 rounded-xl bg-emerald-500/5 dark:bg-white/5 hover:bg-emerald-500/15 border border-[var(--bento-card-border)] text-emerald-700 dark:text-emerald-300 font-bold text-center transition cursor-pointer"
                >
                  <Scissors className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                  Staff POS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-4 border-t border-[var(--bento-card-border)] text-center text-xs text-[var(--text-muted)] relative z-10 transition-colors duration-300">
        LuxeSalon Multi-Tenant CRM SaaS • Nordic Ice & Porcelain Minimalist • MySQL 8.0 & FastAPI
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
