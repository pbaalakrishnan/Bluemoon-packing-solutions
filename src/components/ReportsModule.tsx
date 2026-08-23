import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import {
  formatCurrencyINR,
  formatDate,
  formatNumber,
  exportToCSV,
} from '../utils/exportUtils';
import {
  FileBarChart,
  Download,
  Printer,
  Layers,
  Factory,
  PackageCheck,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

interface ReportsModuleProps {
  onOpenPrintModal: (title: string, data: any, type: 'purchase' | 'job' | 'sale' | 'report') => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ onOpenPrintModal }) => {
  const { currentUser } = useAuth();
  const state = dbService.getState();

  // Selected Report Type
  const [reportCategory, setReportCategory] = useState<'raw' | 'production' | 'fg' | 'sales'>('sales');
  const [reportType, setReportType] = useState('sales_by_buyer');

  // Filters
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly' | 'yearly' | 'all' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [filterWidth, setFilterWidth] = useState('');
  const [filterType, setFilterType] = useState('');

  // Period preset switcher
  const handlePeriodChange = (val: 'today' | 'weekly' | 'monthly' | 'yearly' | 'all' | 'custom') => {
    setPeriod(val);
    const now = new Date();
    if (val === 'today') {
      setStartDate(now.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (val === 'weekly') {
      const w = new Date(Date.now() - 7 * 86400000);
      setStartDate(w.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (val === 'monthly') {
      const m = new Date(Date.now() - 30 * 86400000);
      setStartDate(m.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (val === 'yearly') {
      const y = new Date(Date.now() - 365 * 86400000);
      setStartDate(y.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (val === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  const handleResetFilters = () => {
    handlePeriodChange('monthly');
    setFilterSupplier('');
    setFilterBuyer('');
    setFilterWidth('');
    setFilterType('');
  };

  // Generate dynamic report data based on reportCategory and reportType
  let reportTitle = '';
  let headers: string[] = [];
  let tableRows: (string | number)[][] = [];
  let totalsSummary: { label: string; value: string }[] = [];

  if (reportCategory === 'raw') {
    if (reportType === 'purchases') {
      reportTitle = 'Raw Material Purchases Report';
      headers = ['Roll ID', 'Type', 'Supplier', 'Width & Thickness', 'Purchase Date', 'Weight (Kg)', 'Length (M)', 'Cost (₹)'];
      const rolls = state.rollTapePurchases.filter(
        (r) =>
          r.purchasedDate >= startDate &&
          r.purchasedDate <= endDate &&
          (!filterSupplier || r.supplierId === filterSupplier),
      );
      tableRows = rolls.map((r) => [
        r.rollId,
        r.jumboRollType,
        r.supplierName,
        `${r.rollWidth} • ${r.thickness}`,
        formatDate(r.purchasedDate),
        r.originalWeight,
        r.originalLength,
        r.cost,
      ]);
      const totalKg = rolls.reduce((s, r) => s + r.originalWeight, 0);
      const totalCost = rolls.reduce((s, r) => s + r.cost, 0);
      totalsSummary = [
        { label: 'Total Weight Purchased', value: `${formatNumber(totalKg)} Kg` },
        { label: 'Total Purchase Value', value: formatCurrencyINR(totalCost) },
      ];
    } else {
      reportTitle = 'Raw Material Stock & Lot Balance';
      headers = ['Roll ID', 'Type', 'Supplier', 'Original Wt', 'Available Wt', 'Original Len', 'Available Len', 'Status'];
      const rolls = state.rollTapePurchases.filter(
        (r) => !filterSupplier || r.supplierId === filterSupplier,
      );
      tableRows = rolls.map((r) => [
        r.rollId,
        r.jumboRollType,
        r.supplierName,
        r.originalWeight,
        r.availableWeight,
        r.originalLength,
        r.availableLength,
        r.status,
      ]);
      const totalAvailKg = rolls.reduce((s, r) => s + r.availableWeight, 0);
      totalsSummary = [{ label: 'Total Available Balance', value: `${formatNumber(totalAvailKg)} Kg` }];
    }
  } else if (reportCategory === 'production') {
    reportTitle = 'Production JOB Register & Output Analysis';
    headers = ['Job Card No', 'Date', 'Rolls Consumed', 'Total Output Pcs', 'Total Cartons', 'Status', 'Operator'];
    const jobs = state.productionJobs.filter(
      (j) => j.productionDate >= startDate && j.productionDate <= endDate,
    );
    tableRows = jobs.map((j) => [
      j.jobCardNo,
      formatDate(j.productionDate),
      j.rollsUsed.map((r) => `${r.rollId} (${r.weightUsed}Kg)`).join(', '),
      j.totalPieces,
      j.totalCartons,
      j.status,
      j.createdBy,
    ]);
    const totalPcs = jobs.reduce((s, j) => s + j.totalPieces, 0);
    const totalCtn = jobs.reduce((s, j) => s + j.totalCartons, 0);
    totalsSummary = [
      { label: 'Total Pieces Produced', value: `${formatNumber(totalPcs)} Pcs` },
      { label: 'Total Cartons Produced', value: `${formatNumber(totalCtn)} Boxes` },
      { label: 'Completed Jobs Count', value: `${jobs.length} Jobs` },
    ];
  } else if (reportCategory === 'fg') {
    reportTitle = 'Finished Goods Stock & SKU Report';
    headers = ['Tape Width', 'Tape Type', 'Pieces Per Carton', 'Available Pieces', 'Cartons Equivalent'];
    const fg = dbService.getFinishedGoodsSummary().filter((s) => {
      const matchW = filterWidth ? s.tapeWidth === filterWidth : true;
      const matchT = filterType ? s.tapeType === filterType : true;
      return matchW && matchT;
    });
    tableRows = fg.map((s) => [s.tapeWidth, s.tapeType, s.piecesPerCarton, s.totalPieces, s.totalCartons]);
    const totalPcs = fg.reduce((s, item) => s + item.totalPieces, 0);
    const totalCtn = fg.reduce((s, item) => s + item.totalCartons, 0);
    totalsSummary = [
      { label: 'Total Finished Pieces', value: `${formatNumber(totalPcs)} Pcs` },
      { label: 'Total Master Cartons', value: `${formatNumber(totalCtn)} Boxes` },
    ];
  } else if (reportCategory === 'sales') {
    reportTitle = 'Sales & Revenue Dispatch Report';
    headers = ['Invoice No', 'Sale Date', 'Buyer', 'Product SKU', 'Pieces Sold', 'Cartons Sold', 'Sale Value (₹)'];
    const sales = state.salesOrders.filter((s) => {
      const matchDate = s.saleDate >= startDate && s.saleDate <= endDate;
      const matchBuyer = filterBuyer ? s.buyerId === filterBuyer : true;
      const matchWidth = filterWidth ? s.tapeWidth === filterWidth : true;
      const matchType = filterType ? s.tapeType === filterType : true;
      return matchDate && matchBuyer && matchWidth && matchType;
    });
    tableRows = sales.map((s) => [
      s.saleInvoiceNo,
      formatDate(s.saleDate),
      s.buyerName,
      `${s.tapeWidth} • ${s.tapeType}`,
      s.piecesSold,
      s.cartonsSold,
      s.saleValue,
    ]);
    const totalPcs = sales.reduce((sum, s) => sum + s.piecesSold, 0);
    const totalCtn = sales.reduce((sum, s) => sum + s.cartonsSold, 0);
    const totalVal = sales.reduce((sum, s) => sum + s.saleValue, 0);
    totalsSummary = [
      { label: 'Total Pieces Sold', value: `${formatNumber(totalPcs)} Pcs` },
      { label: 'Total Cartons Dispatched', value: `${formatNumber(totalCtn)} Cartons` },
      { label: 'Total Sales Revenue', value: formatCurrencyINR(totalVal) },
    ];
  }

  // Export to Excel / CSV
  const handleExportCSV = () => {
    exportToCSV(
      reportTitle.replace(/\s+/g, '_'),
      tableRows,
      headers,
      reportTitle,
      currentUser?.email || 'admin@bluemoon.in',
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            09 / Business Intelligence
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Reports & Analytics.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Exportable business intelligence across Raw Materials, Production, Finished Stock, and Sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenPrintModal(
                reportTitle,
                { headers, rows: tableRows, totals: totalsSummary, period: `${startDate} to ${endDate}` },
                'report',
              )
            }
            className="px-3.5 py-2 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-black/15 space-x-1 sm:space-x-4 overflow-x-auto pb-1 font-mono">
        <button
          onClick={() => {
            setReportCategory('sales');
            setReportType('sales_by_buyer');
          }}
          className={`flex items-center space-x-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            reportCategory === 'sales'
              ? 'border-b-2 border-black font-bold text-black'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sales & Billing</span>
        </button>

        <button
          onClick={() => {
            setReportCategory('production');
            setReportType('jobs');
          }}
          className={`flex items-center space-x-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            reportCategory === 'production'
              ? 'border-b-2 border-black font-bold text-black'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <Factory className="w-3.5 h-3.5" />
          <span>Production</span>
        </button>

        <button
          onClick={() => {
            setReportCategory('fg');
            setReportType('fg_stock');
          }}
          className={`flex items-center space-x-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            reportCategory === 'fg'
              ? 'border-b-2 border-black font-bold text-black'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Finished Goods</span>
        </button>

        <button
          onClick={() => {
            setReportCategory('raw');
            setReportType('purchases');
          }}
          className={`flex items-center space-x-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            reportCategory === 'raw'
              ? 'border-b-2 border-black font-bold text-black'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Raw Materials</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="border border-black/15 bg-white p-5 space-y-4">
        {/* Period Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center border border-black/20 p-0.5 bg-[#F8F8F5] text-xs font-mono">
            {(['today', 'weekly', 'monthly', 'yearly', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 uppercase text-[10px] tracking-wider transition-colors ${
                  period === p ? 'bg-black text-white font-bold' : 'text-black/60 hover:text-black'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 border border-black/20 bg-[#F8F8F5] hover:bg-black hover:text-white text-black text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Date Ranges & Dynamic Criteria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-black/10 text-xs">
          <div>
            <label className="block text-black/60 mb-1 font-mono text-[10px] uppercase">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriod('custom');
              }}
              className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-black/60 mb-1 font-mono text-[10px] uppercase">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriod('custom');
              }}
              className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          {reportCategory === 'sales' && (
            <div>
              <label className="block text-black/60 mb-1 font-mono text-[10px] uppercase">Filter Buyer</label>
              <select
                value={filterBuyer}
                onChange={(e) => setFilterBuyer(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="">All Buyers</option>
                {state.buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportCategory === 'raw' && (
            <div>
              <label className="block text-black/60 mb-1 font-mono text-[10px] uppercase">Filter Supplier</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="">All Suppliers</option>
                {state.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(reportCategory === 'fg' || reportCategory === 'sales') && (
            <div>
              <label className="block text-black/60 mb-1 font-mono text-[10px] uppercase">Filter Width</label>
              <select
                value={filterWidth}
                onChange={(e) => setFilterWidth(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="">All Widths</option>
                <option value="24 mm">24 mm</option>
                <option value="48 mm">48 mm</option>
                <option value="60 mm">60 mm</option>
                <option value="72 mm">72 mm</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Totals KPI Banner */}
      {totalsSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {totalsSummary.map((tot, idx) => (
            <div key={idx} className="p-4 border border-black/15 bg-white">
              <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">{tot.label}</div>
              <div className="font-serif text-2xl font-bold text-black mt-1">{tot.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Report Data Table */}
      <div className="border border-black/15 bg-white overflow-hidden">
        <div className="p-4 border-b border-black/15 bg-[#F8F8F5] flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-black">{reportTitle}</h2>
          <span className="text-xs text-black/60 font-mono">
            {startDate} to {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-black divide-y divide-black/10">
            <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 font-mono">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="p-8 text-center text-black/40 font-serif italic text-base">
                    No data records available for selected report filters.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FAF9F6] transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3">
                        {typeof cell === 'number' && cIdx >= headers.length - 2 ? (
                          <span className="font-bold text-black">
                            {formatNumber(cell)}
                          </span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
