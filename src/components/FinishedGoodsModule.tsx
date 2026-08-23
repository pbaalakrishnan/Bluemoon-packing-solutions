import React, { useState } from 'react';
import { dbService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatNumber, exportToCSV } from '../utils/exportUtils';
import {
  PackageCheck,
  Search,
  Download,
  Printer,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface FinishedGoodsModuleProps {
  onOpenPrintModal: (title: string, data: any, type: 'purchase' | 'job' | 'sale' | 'report') => void;
}

export const FinishedGoodsModule: React.FC<FinishedGoodsModuleProps> = ({ onOpenPrintModal }) => {
  const { currentUser } = useAuth();
  const state = dbService.getState();
  const summary = dbService.getFinishedGoodsSummary();

  const [searchQuery, setSearchQuery] = useState('');
  const [widthFilter, setWidthFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'batches'>('matrix');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; label: string; details: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteBatch = () => {
    if (!itemToDelete) return;
    const userEmail = currentUser?.email || 'admin@bluemoon.in';
    const res = dbService.deleteFinishedGoodsItem(itemToDelete.id, userEmail);
    if (res.success) {
      showToast(`Finished Goods batch (${itemToDelete.label}) deleted from inventory.`);
    } else {
      alert(res.error || 'Failed to delete finished goods item.');
    }
    setItemToDelete(null);
  };

  const handlePurgeDepleted = () => {
    if (window.confirm('Purge all completed/depleted (0 Pcs) finished goods batches?')) {
      const userEmail = currentUser?.email || 'admin@bluemoon.in';
      const res = dbService.purgeDepletedFinishedGoods(userEmail);
      if (res.count > 0) {
        showToast(`Purged ${res.count} depleted batch(es).`);
      } else {
        showToast('No 0 Pcs batches found to purge.');
      }
    }
  };

  // Summary Totals
  const totalAvailablePieces = summary.reduce((sum, s) => sum + s.totalPieces, 0);
  const totalAvailableCartons = summary.reduce((sum, s) => sum + s.totalCartons, 0);

  // Filtered Summary
  const filteredSummary = summary.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.tapeWidth.toLowerCase().includes(q) || s.tapeType.toLowerCase().includes(q);
    const matchWidth = widthFilter ? s.tapeWidth === widthFilter : true;
    const matchType = typeFilter ? s.tapeType === typeFilter : true;
    return matchSearch && matchWidth && matchType;
  });

  // Filtered Individual Batches
  const filteredBatches = state.finishedGoods.filter((fg) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      fg.jobCardNo.toLowerCase().includes(q) ||
      fg.tapeWidth.toLowerCase().includes(q) ||
      fg.tapeType.toLowerCase().includes(q);
    const matchWidth = widthFilter ? fg.tapeWidth === widthFilter : true;
    const matchType = typeFilter ? fg.tapeType === typeFilter : true;
    return matchSearch && matchWidth && matchType;
  });

  const exportStockCSV = () => {
    const headers = ['Tape Width', 'Tape Type', 'Pieces Per Carton', 'Available Pieces', 'Cartons Equivalent'];
    const rows = filteredSummary.map((s) => [
      s.tapeWidth,
      s.tapeType,
      s.piecesPerCarton,
      s.totalPieces,
      s.totalCartons,
    ]);
    exportToCSV('Finished_Goods_Inventory', rows, headers, 'Finished Goods Stock Balance Report', 'Auditor');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Header */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            05 / Finished Goods Warehouse
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Finished Goods Inventory.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Available ready-to-sell tape stock grouped by width, type, and carton packing ratio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePurgeDepleted}
            className="px-3 py-2 border border-black/20 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-black text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
            title="Purge all 0-Stock finished goods records"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Purge 0-Stock</span>
          </button>
          <button
            onClick={() => onOpenPrintModal('Finished Goods Stock Report', summary, 'report')}
            className="px-3.5 py-2 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportStockCSV}
            className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Stock</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Total Finished Pieces</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-black mt-1">
            {formatNumber(totalAvailablePieces)} <span className="text-xs font-mono font-normal text-black/50">Pieces</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">Ready for dispatch</div>
        </div>

        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Total Master Cartons</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-black mt-1">
            {formatNumber(totalAvailableCartons)} <span className="text-xs font-mono font-normal text-black/50">Boxes</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">Standard corrugated cartons</div>
        </div>

        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Active SKU Variants</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-black mt-1">
            {summary.length} <span className="text-xs font-mono font-normal text-black/50">Variants</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">Across 24mm, 48mm, 60mm, 72mm</div>
        </div>
      </div>

      {/* Filter and View Switcher */}
      <div className="border border-black/15 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
            <input
              type="text"
              placeholder="Search Width or Tape Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={widthFilter}
            onChange={(e) => setWidthFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
          >
            <option value="">All Tape Widths</option>
            <option value="24 mm">24 mm</option>
            <option value="48 mm">48 mm</option>
            <option value="60 mm">60 mm</option>
            <option value="72 mm">72 mm</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
          >
            <option value="">All Tape Types</option>
            <option value="Plain-Transparent">Plain-Transparent</option>
            <option value="Plain-Brown">Plain-Brown</option>
            <option value="Plain-Colour">Plain-Colour</option>
            <option value="Printed-Single-Colour">Printed-Single-Colour</option>
            <option value="Printed-Double-Colour">Printed-Double-Colour</option>
          </select>
        </div>

        <div className="flex border border-black/20 p-0.5 bg-[#F8F8F5] text-xs font-mono">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 uppercase text-[10px] tracking-wider transition-colors ${
              viewMode === 'matrix' ? 'bg-black text-white font-bold' : 'text-black/60 hover:text-black'
            }`}
          >
            Stock Matrix
          </button>
          <button
            onClick={() => setViewMode('batches')}
            className={`px-3 py-1.5 uppercase text-[10px] tracking-wider transition-colors ${
              viewMode === 'batches' ? 'bg-black text-white font-bold' : 'text-black/60 hover:text-black'
            }`}
          >
            Job Batches
          </button>
        </div>
      </div>

      {/* VIEW 1: GROUPED MATRIX */}
      {viewMode === 'matrix' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Tape Width</th>
                  <th className="p-3">Tape Type</th>
                  <th className="p-3 text-center">Packing Rule</th>
                  <th className="p-3 text-right">Available Pieces</th>
                  <th className="p-3 text-right">Cartons Equivalent</th>
                  <th className="p-3 text-center">Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-black/40 font-serif italic text-base">
                      No finished goods matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="p-3 font-bold text-black font-mono">{item.tapeWidth}</td>
                      <td className="p-3 font-semibold text-black">{item.tapeType}</td>
                      <td className="p-3 text-center font-mono text-black/70 text-[11px]">
                        {item.piecesPerCarton} Pcs / Carton
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-black text-sm">
                        {formatNumber(item.totalPieces)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-black text-sm">
                        {item.totalCartons} Cartons
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-black/20 bg-[#F4F4F1] text-black">
                          {item.totalPieces > 200 ? 'Sufficient' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PRODUCTION BATCHES */}
      {viewMode === 'batches' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Production Date</th>
                  <th className="p-3">JOB Card No</th>
                  <th className="p-3">Width & Type</th>
                  <th className="p-3 text-right">Original Produced</th>
                  <th className="p-3 text-right">Available Pieces</th>
                  <th className="p-3 text-right">Cartons</th>
                  <th className="p-3 text-right">Operator</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredBatches.map((fg) => (
                  <tr key={fg.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(fg.productionDate)}</td>
                    <td className="p-3 font-bold font-mono text-black">{fg.jobCardNo}</td>
                    <td className="p-3">
                      <span className="font-bold text-black">{fg.tapeWidth}</span> • {fg.tapeType}
                    </td>
                    <td className="p-3 text-right font-mono text-black/60 text-[11px]">{formatNumber(fg.quantity)} Pcs</td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {formatNumber(fg.availableQuantity)} Pcs
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {fg.availableCartons} Ctn
                    </td>
                    <td className="p-3 text-right text-black/50 text-[10px] font-mono">{fg.createdBy}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          setItemToDelete({
                            id: fg.id,
                            label: `Job ${fg.jobCardNo} Batch`,
                            details: `${fg.tapeWidth} ${fg.tapeType} - ${fg.availableQuantity} available pcs`,
                          })
                        }
                        className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                        title="Delete Finished Goods Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELETE BATCH CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-black/15 pb-3">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-black">
                  Delete Finished Goods Batch
                </h3>
                <p className="text-xs text-black/60">This will decrement ready-to-sell stock and record in ledger.</p>
              </div>
            </div>

            <div className="bg-[#F8F8F5] border border-black/10 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-black">{itemToDelete.label}</div>
              <div className="text-black/70 font-mono text-[11px]">{itemToDelete.details}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-black/20 bg-white hover:bg-[#F4F4F1] text-xs font-mono uppercase font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBatch}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
