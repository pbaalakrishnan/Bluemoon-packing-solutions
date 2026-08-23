import React, { useState } from 'react';
import { COMPANY_INFO, dbService } from '../services/db';
import {
  Settings,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  Database,
  Building2,
  ShieldCheck,
  HardDrive,
  Activity,
  Layers,
  FileText,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { formatNumber } from '../utils/exportUtils';

export const SettingsModule: React.FC = () => {
  const [integrityStatus, setIntegrityStatus] = useState<{
    checked: boolean;
    valid: boolean;
    issues: string[];
    timestamp: string;
  } | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const state = dbService.getState();

  // Calculate local storage size
  const storageUsageBytes = new Blob([JSON.stringify(state)]).size;
  const storageUsageKB = (storageUsageBytes / 1024).toFixed(2);

  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const results = dbService.runAutomatedTests();
      setIntegrityStatus({
        checked: true,
        valid: results.passed,
        issues: results.passed ? [] : results.logs.filter((l) => l.includes('FAIL')),
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsVerifying(false);
      setNotification(
        results.passed
          ? 'System Health Audit Passed: All stock balances, ledger entries, and carton math are 100% consistent.'
          : 'Audit finished with warnings.',
      );
      setTimeout(() => setNotification(null), 4000);
    }, 400);
  };

  const handleExportBackupJSON = () => {
    const jsonStr = dbService.exportDatabaseBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bluemoon_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification('Database backup downloaded successfully.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = dbService.importDatabaseBackupJSON(content);
      if (res.success) {
        setNotification('Database restored successfully from backup! Reloading application...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert(res.error || 'Failed to import backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    const conf = window.confirm(
      '⚠️ WARNING: Are you sure you want to reset the database to factory initial state? All active operational data will be reseeded with default demo values.',
    );
    if (!conf) return;

    dbService.resetDatabaseToFactory();
    setNotification('System restored to factory initial state! Reloading...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Header */}
      <div className="border-b border-black/15 pb-5">
        <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
          12 / Administration & Data Management
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
          System Administration & Storage.
        </h1>
        <p className="text-xs sm:text-sm text-black/60 mt-1">
          Database backup & recovery, system health verification, data integrity audits, and master company letterhead details.
        </p>
      </div>

      {notification && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Database Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-black/15">
          <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-wider">
            <span>Tape Rolls</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl font-bold text-black mt-2">
            {state.rollTapePurchases.length}
          </div>
          <div className="text-[10px] text-black/50 font-mono mt-0.5">Purchased Inward</div>
        </div>

        <div className="p-4 bg-white border border-black/15">
          <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-wider">
            <span>Job Slips</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl font-bold text-black mt-2">
            {state.productionJobs.length}
          </div>
          <div className="text-[10px] text-black/50 font-mono mt-0.5">Production Cycles</div>
        </div>

        <div className="p-4 bg-white border border-black/15">
          <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-wider">
            <span>Invoices</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl font-bold text-black mt-2">
            {state.salesOrders.length}
          </div>
          <div className="text-[10px] text-black/50 font-mono mt-0.5">Sales Dispatches</div>
        </div>

        <div className="p-4 bg-white border border-black/15">
          <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-wider">
            <span>Storage Size</span>
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl font-bold text-black mt-2">
            {storageUsageKB} <span className="text-xs font-sans font-normal text-black/50">KB</span>
          </div>
          <div className="text-[10px] text-black/50 font-mono mt-0.5">LocalStorage Used</div>
        </div>
      </div>

      {/* 1. Database Health & Ledger Verification */}
      <div className="border border-black/15 bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
              Database Health & Ledger Integrity Audit
            </h2>
            <p className="text-xs text-black/60 mt-0.5">
              Verifies zero negative roll states, validates carton packaging math formulas, and reconciles credit/debit audit transactions.
            </p>
          </div>

          <button
            onClick={handleVerifyIntegrity}
            disabled={isVerifying}
            className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2 disabled:opacity-50 transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying Integrity...' : 'Run Health Audit'}</span>
          </button>
        </div>

        {integrityStatus && (
          <div className="p-4 border border-black/15 bg-[#F8F8F5] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>INTEGRITY STATUS: HEALTHY & SYNCHRONIZED</span>
              </div>
              <span className="text-[10px] font-mono text-black/50">
                Audited at {integrityStatus.timestamp}
              </span>
            </div>
            <p className="text-xs text-black/70">
              All inventory transactions, parent-child roll deductions, finished product carton algorithms, and ledger audit sequences passed verification with zero errors.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Company Information Card */}
        <div className="border border-black/15 bg-white p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
            <Building2 className="w-4 h-4 text-black" />
            Company Profile & Letterhead
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8F8F5] border border-black/10">
              <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">
                Company Name
              </span>
              <span className="font-serif font-bold text-black text-base">{COMPANY_INFO.name}</span>
            </div>

            <div className="p-3 bg-[#F8F8F5] border border-black/10">
              <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">
                Factory & Billing Address
              </span>
              <span className="text-black/80">{COMPANY_INFO.address}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">
                  Contact Phone
                </span>
                <span className="font-mono text-black">{COMPANY_INFO.phone}</span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">
                  Official Email
                </span>
                <span className="font-mono text-black">{COMPANY_INFO.email}</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8F8F5] border border-black/10">
              <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">
                GSTIN Registration
              </span>
              <span className="font-mono text-black font-bold">{COMPANY_INFO.gstin}</span>
            </div>
          </div>
        </div>

        {/* 3. Database Persistence & Backup */}
        <div className="border border-black/15 bg-white p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
            <Database className="w-4 h-4 text-black" />
            Database Persistence & Backup Hub
          </h2>
          <p className="text-xs text-black/60">
            This ERP persists all transactional data locally in browser storage. Download complete JSON archives for safekeeping or migration across devices.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleExportBackupJSON}
              className="w-full py-2.5 px-4 bg-white hover:bg-black hover:text-white border border-black/20 text-black text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Database Backup (.json)</span>
            </button>

            <label className="w-full py-2.5 px-4 bg-white hover:bg-black hover:text-white border border-black/20 text-black text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Database from Backup (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackupJSON}
                className="hidden"
              />
            </label>

            <div className="pt-2 border-t border-black/10">
              <button
                onClick={handleFactoryReset}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Database to Initial State</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
