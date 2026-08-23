import React, { useState } from 'react';
import { COMPANY_INFO, dbService } from '../services/db';
import { formatCurrencyINR, formatNumber } from '../utils/exportUtils';
import {
  Layers,
  Factory,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Boxes,
  ArrowUpRight,
  PlusCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const metrics = dbService.getDashboardMetrics();
  const alerts = dbService.getDashboardAlerts();
  const fgSummary = dbService.getFinishedGoodsSummary();
  const state = dbService.getState();

  // Chart data extraction
  const completedJobs = state.productionJobs.filter((j) => j.status === 'Completed');
  const completedSales = state.salesOrders.filter((s) => s.status === 'Completed');

  // Group finished goods by width
  const fgByWidth = [
    { width: '24 mm', pieces: 0, cartons: 0 },
    { width: '48 mm', pieces: 0, cartons: 0 },
    { width: '60 mm', pieces: 0, cartons: 0 },
    { width: '72 mm', pieces: 0, cartons: 0 },
  ];

  fgSummary.forEach((item) => {
    const match = fgByWidth.find((w) => w.width === item.tapeWidth);
    if (match) {
      match.pieces += item.totalPieces;
      match.cartons += item.totalCartons;
    }
  });

  const maxFgPieces = Math.max(...fgByWidth.map((w) => w.pieces), 1);

  return (
    <div className="space-y-8 pb-12 font-sans text-[#121212]">
      {/* Editorial Header Section */}
      <section className="border-b border-black/15 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold text-black/50">
                01 / Operations Control
              </span>
              <div className="h-px w-8 bg-black/20" />
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-black/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Plant Active
              </div>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#121212] leading-[1.05]">
              Manufacturing &<br className="hidden sm:inline" /> Material Overview.
            </h1>
            <p className="text-sm font-sans text-black/70 max-w-xl mt-3 leading-relaxed">
              Real-time slitting telemetry, raw tape stock reconciliation, master carton packaging algorithms, and dispatch accounting for {COMPANY_INFO.name}.
            </p>
          </div>

          {/* Action Quick Shortcuts */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('purchases')}
              className="px-4 py-2.5 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Inward Roll</span>
            </button>
            <button
              onClick={() => onNavigate('production')}
              className="px-4 py-2.5 bg-white hover:bg-[#121212] hover:text-white border border-black/20 text-[#121212] text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Job Card</span>
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="px-4 py-2.5 bg-white hover:bg-[#121212] hover:text-white border border-black/20 text-[#121212] text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Sales Bill</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real-Time Dashboard Alerts Bar */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.slice(0, 3).map((alt) => (
            <div
              key={alt.id}
              className={`p-4 border flex items-start space-x-3 transition-all ${
                alt.type === 'danger'
                  ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                  : alt.type === 'warning'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-white border-black/15 text-black'
              }`}
            >
              {alt.type === 'danger' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : alt.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-black/60 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider">{alt.title}</div>
                <div className="text-[11px] opacity-80 mt-0.5 leading-snug">{alt.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 1: 4 CORE SUMMARY KPI CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40">
            02 / Key Performance Matrix
          </div>
          <span className="font-mono text-[10px] text-black/40">WEIGHT & CURRENCY INR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Raw Materials Card */}
          <div
            onClick={() => onNavigate('raw-materials')}
            className="border border-black/15 bg-white p-5 hover:border-black transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-[0.2em]">
                <span>01 / Jumbo Rolls</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-3xl font-bold text-[#121212] tracking-tight">
                  {formatNumber(metrics.totalRollTapeAvailableKg)}
                  <span className="text-sm font-sans font-normal text-black/50 ml-1">Kg</span>
                </div>
                <div className="text-xs text-black/60 mt-1">Tape Inward Weight Available</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-black/70">
              <span>{metrics.availableRollCount} Ready</span>
              <span>{metrics.partiallyUsedRollCount} Partial</span>
              <span>{metrics.fullyUsedRollCount} Used</span>
            </div>
          </div>

          {/* 2. Paper Core & Packing Stock */}
          <div
            onClick={() => onNavigate('raw-materials')}
            className="border border-black/15 bg-white p-5 hover:border-black transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-[0.2em]">
                <span>02 / Packing Raw</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-3xl font-bold text-[#121212] tracking-tight">
                  {formatNumber(metrics.totalCartonBoxesAvailable)}
                  <span className="text-sm font-sans font-normal text-black/50 ml-1">Boxes</span>
                </div>
                <div className="text-xs text-black/60 mt-1">Master Packaging Inventory</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-black/70">
              <span>Core: {metrics.totalPaperCoreAvailableKg} Kg</span>
              <span>Film: {metrics.totalHeatShrinkFilmAvailableKg} Kg</span>
            </div>
          </div>

          {/* 3. Production Card */}
          <div
            onClick={() => onNavigate('production')}
            className="border border-black/15 bg-white p-5 hover:border-black transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-black/50 text-[10px] uppercase font-sans tracking-[0.2em]">
                <span>03 / Slit Output</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-3xl font-bold text-[#121212] tracking-tight">
                  {formatNumber(metrics.totalFinishedGoodsPieces)}
                  <span className="text-sm font-sans font-normal text-black/50 ml-1">Pcs</span>
                </div>
                <div className="text-xs text-black/60 mt-1">Finished Goods Stock</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-black/70">
              <span>{metrics.totalFinishedGoodsCartons} Cartons</span>
              <span className="text-black font-semibold">{metrics.totalJobsCount} Jobs</span>
            </div>
          </div>

          {/* 4. Sales Card */}
          <div
            onClick={() => onNavigate('sales')}
            className="border border-black/15 bg-[#121212] text-white p-5 hover:border-black transition-all cursor-pointer group flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-sans tracking-[0.2em]">
                <span>04 / Revenue Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-3xl font-bold text-white tracking-tight">
                  {formatCurrencyINR(metrics.totalSalesValue)}
                </div>
                <div className="text-xs text-white/70 mt-1">Cumulative Invoiced Sales</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] font-mono text-white/80">
              <span className="text-emerald-400">
                Rec: {formatCurrencyINR(metrics.totalAmountReceived || 0)}
              </span>
              <span className="text-amber-300">
                Due: {formatCurrencyINR(metrics.totalOutstandingReceivables || 0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PRODUCTION & SALES TIMEFRAME BREAKDOWN */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Time Breakdown */}
        <div className="border border-black/15 bg-white p-6">
          <div className="flex items-baseline justify-between mb-4 border-b border-black/10 pb-3">
            <div>
              <div className="text-[10px] font-sans uppercase tracking-[0.2em] font-bold text-black/40 mb-1">
                Slitting Output
              </div>
              <h2 className="font-serif text-xl font-bold text-[#121212]">
                Production by Timeframe
              </h2>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs font-sans uppercase tracking-wider font-semibold text-black hover:underline"
            >
              + Create Job
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border border-black/10 p-3.5 bg-[#F8F8F5]">
              <div className="text-[10px] font-sans uppercase tracking-wider text-black/50">Today</div>
              <div className="font-serif text-xl font-bold text-[#121212] mt-1">
                {formatNumber(metrics.todayProductionPieces)}
              </div>
              <div className="text-[10px] font-mono text-black/60 mt-1">
                {metrics.todayProductionCartons} Cartons
              </div>
            </div>

            <div className="border border-black/10 p-3.5 bg-[#F8F8F5]">
              <div className="text-[10px] font-sans uppercase tracking-wider text-black/50">This Week</div>
              <div className="font-serif text-xl font-bold text-[#121212] mt-1">
                {formatNumber(metrics.weekProductionPieces)}
              </div>
              <div className="text-[10px] font-mono text-black/60 mt-1">
                {metrics.weekProductionCartons} Cartons
              </div>
            </div>

            <div className="border border-black/10 p-3.5 bg-[#F8F8F5]">
              <div className="text-[10px] font-sans uppercase tracking-wider text-black/50">This Month</div>
              <div className="font-serif text-xl font-bold text-[#121212] mt-1">
                {formatNumber(metrics.monthProductionPieces)}
              </div>
              <div className="text-[10px] font-mono text-black/60 mt-1">
                {metrics.monthProductionCartons} Cartons
              </div>
            </div>
          </div>

          {/* Recent Jobs list */}
          <div className="mt-5 pt-4 border-t border-black/10">
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-black/60 mb-2.5">
              Recent Job Slips
            </div>
            <div className="space-y-1.5">
              {completedJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-2.5 border border-black/10 bg-[#FAF9F6] text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-black">{job.jobCardNo}</span>
                    <span className="text-black/40 text-[11px]">({job.productionDate})</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-[#121212]">{formatNumber(job.totalPieces)} Pcs</span>
                    <span className="text-black/50 ml-2">({job.totalCartons} Ctn)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Time Breakdown */}
        <div className="border border-black/15 bg-white p-6">
          <div className="flex items-baseline justify-between mb-4 border-b border-black/10 pb-3">
            <div>
              <div className="text-[10px] font-sans uppercase tracking-[0.2em] font-bold text-black/40 mb-1">
                Order Billing
              </div>
              <h2 className="font-serif text-xl font-bold text-[#121212]">
                Sales & Dispatches by Period
              </h2>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-sans uppercase tracking-wider font-semibold text-black hover:underline"
            >
              + Create Bill
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border border-black/10 p-3.5 bg-[#F8F8F5]">
              <div className="text-[10px] font-sans uppercase tracking-wider text-black/50">Today</div>
              <div className="font-serif text-lg font-bold text-[#121212] mt-1">
                {formatCurrencyINR(metrics.todaySalesValue)}
              </div>
              <div className="text-[10px] font-sans text-black/60 mt-1">Direct Invoices</div>
            </div>

            <div className="border border-black/10 p-3.5 bg-[#F8F8F5]">
              <div className="text-[10px] font-sans uppercase tracking-wider text-black/50">This Week</div>
              <div className="font-serif text-lg font-bold text-[#121212] mt-1">
                {formatCurrencyINR(metrics.weekSalesValue)}
              </div>
              <div className="text-[10px] font-sans text-black/60 mt-1">Weekly Total</div>
            </div>

            <div className="border border-black/10 p-3.5 bg-[#F8F8F5]">
              <div className="text-[10px] font-sans uppercase tracking-wider text-black/50">This Month</div>
              <div className="font-serif text-lg font-bold text-[#121212] mt-1">
                {formatCurrencyINR(metrics.monthSalesValue)}
              </div>
              <div className="text-[10px] font-sans text-black/60 mt-1">Monthly Total</div>
            </div>
          </div>

          {/* Recent Sales list */}
          <div className="mt-5 pt-4 border-t border-black/10">
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-black/60 mb-2.5">
              Recent Dispatches
            </div>
            <div className="space-y-1.5">
              {completedSales.slice(0, 3).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-2.5 border border-black/10 bg-[#FAF9F6] text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-black">{sale.saleInvoiceNo}</span>
                    <span className="text-black/70 ml-2 font-medium truncate max-w-[140px] inline-block align-bottom">
                      {sale.buyerName}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-[#121212]">{formatCurrencyINR(sale.saleValue)}</span>
                    <span className="text-black/50 ml-1.5">({sale.cartonsSold} Ctn)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FINISHED GOODS BY WIDTH & TYPE MATRIX */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Width-wise Stock Progress Bars */}
        <div className="border border-black/15 bg-white p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between mb-4 border-b border-black/10 pb-3">
            <div>
              <div className="text-[10px] font-sans uppercase tracking-[0.2em] font-bold text-black/40 mb-1">
                Dimension Distribution
              </div>
              <h2 className="font-serif text-xl font-bold text-[#121212]">
                Stock Availability by Tape Width
              </h2>
            </div>
            <button
              onClick={() => onNavigate('finished-goods')}
              className="text-xs font-sans uppercase tracking-wider font-semibold text-black hover:underline"
            >
              Full Inventory →
            </button>
          </div>

          <div className="space-y-4">
            {fgByWidth.map((item) => {
              const pct = Math.round((item.pieces / maxFgPieces) * 100);
              return (
                <div key={item.width} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-serif font-bold text-base text-[#121212]">{item.width} BOPP Tape</span>
                    <span className="font-mono text-black/80">
                      <strong>{formatNumber(item.pieces)}</strong> Pcs &nbsp;
                      <span className="text-black/50">({item.cartons} Cartons)</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#ECECE8] h-2.5 overflow-hidden border border-black/10 flex">
                    <div
                      className="bg-black h-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, item.pieces > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Packing Rules Footer */}
          <div className="mt-6 p-4 border border-black/10 bg-[#F8F8F5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div>
              <span className="text-black/50 block text-[10px] uppercase font-sans tracking-wider">24 mm</span>
              <strong className="font-mono text-black">144 Pcs / Box</strong>
            </div>
            <div>
              <span className="text-black/50 block text-[10px] uppercase font-sans tracking-wider">48 mm</span>
              <strong className="font-mono text-black">72 Pcs / Box</strong>
            </div>
            <div>
              <span className="text-black/50 block text-[10px] uppercase font-sans tracking-wider">60 mm</span>
              <strong className="font-mono text-black">60 Pcs / Box</strong>
            </div>
            <div>
              <span className="text-black/50 block text-[10px] uppercase font-sans tracking-wider">72 mm</span>
              <strong className="font-mono text-black">48 Pcs / Box</strong>
            </div>
          </div>
        </div>

        {/* Stock Breakdown by Tape Type */}
        <div className="border border-black/15 bg-white p-6">
          <div className="border-b border-black/10 pb-3 mb-4">
            <div className="text-[10px] font-sans uppercase tracking-[0.2em] font-bold text-black/40 mb-1">
              Specification Log
            </div>
            <h2 className="font-serif text-xl font-bold text-[#121212]">
              Stock by Tape Type
            </h2>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {fgSummary.map((item, idx) => (
              <div
                key={idx}
                className="p-3 border border-black/10 bg-[#FAF9F6] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#121212]">{item.tapeType}</div>
                  <div className="text-[11px] font-mono text-black/50">{item.tapeWidth}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-black">{formatNumber(item.totalPieces)} Pcs</div>
                  <div className="text-[10px] text-black/60">{item.totalCartons} Cartons</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
