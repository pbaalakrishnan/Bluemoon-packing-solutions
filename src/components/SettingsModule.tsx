import React, { useState } from 'react';
import { COMPANY_INFO, dbService } from '../services/db';
import {
  Settings,
  CheckCircle2,
  Play,
  RotateCcw,
  Download,
  Upload,
  Database,
  Building2,
  Cpu,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    logs: string[];
    summary: string;
  } | null>(null);

  const [isRunningTest, setIsRunningTest] = useState(false);
  const [resetNotification, setResetNotification] = useState<string | null>(null);

  const handleRunAutomatedTests = () => {
    setIsRunningTest(true);
    setTimeout(() => {
      const results = dbService.runAutomatedTests();
      setTestResults(results);
      setIsRunningTest(false);
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
  };

  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = dbService.importDatabaseBackupJSON(content);
      if (res.success) {
        setResetNotification('Database restored successfully from backup!');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert(res.error || 'Failed to import backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    const conf = window.confirm(
      '⚠️ WARNING: Are you sure you want to reset the database to factory demo defaults? All custom records will be replaced.',
    );
    if (!conf) return;

    dbService.resetDatabaseToFactory();
    setResetNotification('System restored to factory initial state!');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Header */}
      <div className="border-b border-black/15 pb-5">
        <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
          12 / Administration & System Diagnostics
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
          System Administration & Diagnostics.
        </h1>
        <p className="text-xs sm:text-sm text-black/60 mt-1">
          Automated ERP mathematical verification, database backup/restore, and master profile configuration.
        </p>
      </div>

      {resetNotification && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{resetNotification}</span>
        </div>
      )}

      {/* 1. Automated Test Runner Card */}
      <div className="border border-black/15 bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <Cpu className="w-4 h-4 text-black" />
              Automated Business Logic Verification Test Suite
            </h2>
            <p className="text-xs text-black/60 mt-0.5">
              Executes atomic tests for: Negative roll prevention, carton calculations, FG deductions, and ledger integrity.
            </p>
          </div>

          <button
            onClick={handleRunAutomatedTests}
            disabled={isRunningTest}
            className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2 disabled:opacity-50 transition-all self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunningTest ? 'Executing Tests...' : 'Run Automated Tests'}</span>
          </button>
        </div>

        {testResults && (
          <div className="p-4 border border-black/15 bg-[#F8F8F5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/60">Test Execution Summary:</span>
              <span className="px-2.5 py-0.5 border border-black/20 text-xs font-mono font-bold bg-white text-black">
                {testResults.summary}
              </span>
            </div>

            <div className="bg-white p-3 border border-black/10 font-mono text-[11px] text-black space-y-1 max-h-48 overflow-y-auto">
              {testResults.logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
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
              <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">Company Name</span>
              <span className="font-serif font-bold text-black text-base">{COMPANY_INFO.name}</span>
            </div>

            <div className="p-3 bg-[#F8F8F5] border border-black/10">
              <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">Factory Address</span>
              <span className="text-black/80">{COMPANY_INFO.address}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">Contact Phone</span>
                <span className="font-mono text-black">{COMPANY_INFO.phone}</span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">Email</span>
                <span className="font-mono text-black">{COMPANY_INFO.email}</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8F8F5] border border-black/10">
              <span className="text-black/50 block text-[10px] uppercase font-mono font-semibold">GSTIN Registration</span>
              <span className="font-mono text-black font-bold">{COMPANY_INFO.gstin}</span>
            </div>
          </div>
        </div>

        {/* 3. Database Maintenance & Backup */}
        <div className="border border-black/15 bg-white p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
            <Database className="w-4 h-4 text-black" />
            Database Persistence & Backups
          </h2>
          <p className="text-xs text-black/60">
            This ERP runs entirely in browser localStorage with full ACID consistency. Export backups anytime or restore on another machine.
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
              <span>Restore Database from File (.json)</span>
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
                <span>Reset Database to Factory Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
