import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COMPANY_INFO, dbService } from '../services/db';
import {
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
  Mail,
  FileCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performLogin = (user: string, pass: string) => {
    setErrorMessage(null);
    const trimmedUser = user.trim();
    const trimmedPass = pass.trim();

    if (!trimmedUser) {
      setErrorMessage('Please enter your username or registered email address.');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('Please enter your security password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = login(trimmedUser, trimmedPass);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your username and password.');
      }
    } catch (e: any) {
      setIsSubmitting(false);
      setErrorMessage(e?.message || 'Login encountered an unexpected error.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(usernameOrEmail, password);
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleDirectSignIn = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    performLogin(user, pass);
  };

  const sampleAccounts = [
    {
      role: 'Super Admin / Director',
      username: 'admin',
      pass: 'admin123',
      badge: 'Full Access',
      desc: 'Complete control over purchases, slitting jobs, sales, & audit ledger',
    },
    {
      role: 'Production Manager',
      username: 'production',
      pass: 'user123',
      badge: 'Production Floor',
      desc: 'Issue job slips, tape consumption, and finished tape slitting output',
    },
    {
      role: 'Inventory Manager',
      username: 'inventory',
      pass: 'user123',
      badge: 'Warehouse & RM',
      desc: 'Record inward raw materials, jumbo roll tracking, and adjustments',
    },
    {
      role: 'Sales Manager',
      username: 'sales',
      pass: 'user123',
      badge: 'Billing & Dispatch',
      desc: 'Tax invoices, customer delivery notes, and piece/carton billing',
    },
    {
      role: 'Audit & Compliance',
      username: 'viewer',
      pass: 'viewer123',
      badge: 'Read Only',
      desc: 'Ledger inspection, stock audit sheets, and management summaries',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#121212] flex flex-col justify-between font-sans selection:bg-black selection:text-white">
      {/* Top Header Strip */}
      <header className="border-b border-black/15 bg-white/80 backdrop-blur-xs py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-serif font-black text-lg">
            B
          </div>
          <div>
            <span className="font-serif font-bold text-base sm:text-lg tracking-tight uppercase block leading-none text-black">
              {COMPANY_INFO.name}
            </span>
            <span className="text-[10px] font-mono text-black/50 tracking-wider uppercase">
              BOPP Self-Adhesive Tape Manufacturing ERP
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-[11px] font-mono text-black/60">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-black" />
            Kangayam Tk, Tirupur
          </span>
          <span className="px-2 py-0.5 border border-black/20 bg-[#F4F4F1] font-bold text-black uppercase text-[9px]">
            ACID SAFE v2.0
          </span>
        </div>
      </header>

      {/* Main Login Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Sign In Form */}
          <div className="lg:col-span-6 bg-white border border-black/20 p-6 sm:p-8 space-y-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-black/40 mb-1.5">
                SECURE AUTHENTICATION GATEWAY
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black tracking-tight">
                Sign In to Workstation.
              </h1>
              <p className="text-xs text-black/60 mt-1">
                Enter your authorized credentials to access factory inventory, slitting jobs, and ledger records.
              </p>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-1.5 font-mono">
                    Username or Email ID *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/40">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="e.g. admin or admin@bluemoon.in"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black transition-colors font-sans placeholder:text-black/30"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-black uppercase tracking-wider font-mono">
                      Password *
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black transition-colors font-mono placeholder:text-black/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/40 hover:text-black transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-black hover:bg-black/85 text-white text-xs font-sans uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Authenticating...' : 'Authorize & Enter Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-black/10 text-[11px] text-black/50 flex items-center justify-between font-mono">
              <span>Security: RBAC Strict Session</span>
              <span>AES-256 Audit Logged</span>
            </div>
          </div>

          {/* Right Column: Fast Demo Profile Selection & Master System Notes */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            {/* Quick Profile Selection */}
            <div className="bg-white border border-black/20 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-black" />
                  <span className="font-serif text-base font-bold text-black">
                    Authorized System Profiles
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-black/50">
                  Click to Auto-fill
                </span>
              </div>

              <div className="space-y-2.5">
                {sampleAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-black/15 hover:border-black bg-white hover:bg-[#F8F8F5] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                  >
                    <div
                      onClick={() => handleQuickFill(acc.username, acc.pass)}
                      className="space-y-0.5 cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-xs text-black">
                          {acc.role}
                        </span>
                        <span className="px-1.5 py-0.2 border border-black/20 bg-[#F4F4F1] font-mono text-[9px] uppercase font-semibold">
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-black/60 leading-tight">
                        {acc.desc}
                      </p>
                      <div className="text-[10px] font-mono text-black/40">
                        user: <strong className="text-black">{acc.username}</strong> • pass: <strong className="text-black">{acc.pass}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleQuickFill(acc.username, acc.pass)}
                        className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-black/20 hover:border-black bg-white text-black transition-colors"
                        title="Fill inputs"
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectSignIn(acc.username, acc.pass)}
                        className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-black hover:bg-black/80 text-white font-semibold flex items-center gap-1 transition-colors"
                        title="Sign in instantly"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Factory & System Guarantee Info */}
            <div className="p-4 bg-[#ECECE8] border border-black/15 text-xs text-black space-y-1.5">
              <div className="font-serif font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-black" />
                Factory Production & Integrity Assurance
              </div>
              <p className="text-[11px] text-black/70 leading-relaxed font-sans">
                Transactions, parent-to-child roll reductions, automated carton packaging ceiling formulas, and physical stock reversals are backed by an immutable ledger.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/15 bg-white py-3.5 px-6 text-center text-xs text-black/60 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © 2026 {COMPANY_INFO.name}. All Rights Reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>GSTIN: {COMPANY_INFO.gstin}</span>
          <span>Helpdesk: {COMPANY_INFO.phone}</span>
        </div>
      </footer>
    </div>
  );
};
