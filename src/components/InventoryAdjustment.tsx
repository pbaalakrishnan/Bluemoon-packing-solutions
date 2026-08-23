import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { formatDateTime, formatNumber } from '../utils/exportUtils';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const InventoryAdjustment: React.FC = () => {
  const { currentUser } = useAuth();
  const state = dbService.getState();

  const [category, setCategory] = useState<
    'Roll Tape' | 'Paper Core' | 'Carton Box' | 'Heat Shrink Film' | 'Finished Goods'
  >('Roll Tape');
  const [selectedItem, setSelectedItem] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('Physical Stock Audit Reconciliation');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Compute current system quantity based on selected category & item
  let systemQty = 0;
  let unit = 'Kg';

  if (category === 'Roll Tape') {
    const roll = state.rollTapePurchases.find((r) => r.rollId === selectedItem);
    systemQty = roll ? roll.availableWeight : 0;
    unit = 'Kg';
  } else if (category === 'Paper Core') {
    systemQty = dbService.getTotalPaperCoreStock();
    unit = 'Kg';
  } else if (category === 'Carton Box') {
    systemQty = dbService.getTotalCartonStock();
    unit = 'Nos';
  } else if (category === 'Heat Shrink Film') {
    systemQty = dbService.getTotalFilmStock();
    unit = 'Kg';
  } else if (category === 'Finished Goods') {
    if (selectedItem) {
      const [w, t] = selectedItem.split('__');
      systemQty = dbService.getAvailablePiecesForProduct(w as any, t as any);
    }
    unit = 'Pieces';
  }

  const physicalNum = parseFloat(physicalCount);
  const diff = !isNaN(physicalNum) ? physicalNum - systemQty : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(physicalNum) || physicalNum < 0) {
      setError('Please enter a valid physical count (≥ 0).');
      return;
    }

    let itemIdentifier = selectedItem;
    if (category === 'Paper Core') itemIdentifier = 'Paper-Core-1020';
    if (category === 'Carton Box') itemIdentifier = 'Corrugated-Cartons';
    if (category === 'Heat Shrink Film') itemIdentifier = 'Heat-Shrink-Film';

    if (!itemIdentifier) {
      setError('Please select an item to adjust.');
      return;
    }

    const res = dbService.createInventoryAdjustment(
      {
        category,
        itemIdentifier,
        systemQuantity: systemQty,
        physicalQuantity: physicalNum,
        reason,
        remarks,
      },
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      setError(res.error || 'Failed to apply adjustment.');
      return;
    }

    setSuccess(`Successfully adjusted ${category} stock to ${physicalNum} ${unit}!`);
    setPhysicalCount('');
    setRemarks('');
    setTimeout(() => setSuccess(null), 4000);
  };

  const fgSummaries = dbService.getFinishedGoodsSummary();

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5">
        <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
          08 / Audit & Reconciliation
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
          Physical Stock Adjustment.
        </h1>
        <p className="text-xs sm:text-sm text-black/60 mt-1">
          Reconcile physical floor counts with system ledger. Every adjustment creates an immutable transaction.
        </p>
      </div>

      {success && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="border border-black/15 bg-white p-6 space-y-4 lg:col-span-2">
          <h2 className="font-serif text-lg font-bold text-[#121212] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-black" />
            Create Physical Count Adjustment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Select Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as any);
                    setSelectedItem('');
                  }}
                  className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black"
                >
                  <option value="Roll Tape">Roll Tape (Jumbos)</option>
                  <option value="Paper Core">Paper Core Stock</option>
                  <option value="Carton Box">Carton Boxes</option>
                  <option value="Heat Shrink Film">Heat Shrink Film</option>
                  <option value="Finished Goods">Finished Goods SKU</option>
                </select>
              </div>

              {/* Specific Item Selector */}
              {category === 'Roll Tape' && (
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Select Roll ID</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black font-mono"
                  >
                    <option value="">-- Select Roll --</option>
                    {state.rollTapePurchases.map((r) => (
                      <option key={r.rollId} value={r.rollId}>
                        {r.rollId} ({r.availableWeight} Kg - {r.jumboRollType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {category === 'Finished Goods' && (
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Select SKU</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black"
                  >
                    <option value="">-- Select Product --</option>
                    {fgSummaries.map((s) => (
                      <option key={`${s.tapeWidth}__${s.tapeType}`} value={`${s.tapeWidth}__${s.tapeType}`}>
                        {s.tapeWidth} • {s.tapeType} ({s.totalPieces} Pcs)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* System vs Physical Calculation Display */}
            <div className="p-4 border border-black/15 bg-[#FAF9F6] grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-2.5 bg-white border border-black/10">
                <span className="text-[10px] text-black/50 uppercase block font-sans">System Recorded</span>
                <strong className="text-black text-sm">
                  {formatNumber(systemQty)} {unit}
                </strong>
              </div>

              <div className="p-2.5 bg-white border border-black/10">
                <span className="text-[10px] text-black/50 uppercase block font-sans">Physical Actual</span>
                <strong className="text-black text-sm">
                  {physicalCount ? formatNumber(parseFloat(physicalCount)) : '-'} {unit}
                </strong>
              </div>

              <div className="p-2.5 bg-white border border-black/10">
                <span className="text-[10px] text-black/50 uppercase block font-sans">Adjustment Delta</span>
                <strong
                  className={`text-sm ${
                    diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-black'
                  }`}
                >
                  {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)} {unit}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Physical Count Actual ({unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter physical count verified"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono font-bold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Reason for Adjustment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black"
                >
                  <option value="Physical Stock Audit Reconciliation">Physical Stock Audit Reconciliation</option>
                  <option value="Floor Slitting Wastage Scrap">Floor Slitting Wastage Scrap</option>
                  <option value="Damaged / Wet Packing Boxes">Damaged / Wet Packing Boxes</option>
                  <option value="Core Breakage during handling">Core Breakage during handling</option>
                  <option value="Customer Return Stock Intake">Customer Return Stock Intake</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1">Audit Remarks</label>
              <input
                type="text"
                placeholder="e.g. Approved by Plant Head after physical weighbridge calibration"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold"
              >
                Post Stock Adjustment
              </button>
            </div>
          </form>
        </div>

        {/* Recent Adjustments List */}
        <div className="border border-black/15 bg-white p-5 space-y-3">
          <h3 className="font-serif text-base font-bold text-black">Recent Adjustments</h3>
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
            {state.inventoryAdjustments.length === 0 ? (
              <div className="text-center text-black/40 text-xs py-8 font-serif italic">No adjustments recorded yet.</div>
            ) : (
              state.inventoryAdjustments.map((adj) => (
                <div key={adj.id} className="p-3 bg-[#F8F8F5] border border-black/10 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">{adj.category}</span>
                    <span className="text-[10px] text-black/50 font-mono">{formatDateTime(adj.timestamp)}</span>
                  </div>
                  <div className="text-black/60 font-mono text-[11px]">
                    Item: <span className="text-black">{adj.itemIdentifier}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px] font-mono">
                    <span>
                      {adj.systemQuantity} → {adj.physicalQuantity} {adj.unit}
                    </span>
                    <span className={adj.adjustmentQuantity >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {adj.adjustmentQuantity >= 0 ? `+${adj.adjustmentQuantity}` : adj.adjustmentQuantity}
                    </span>
                  </div>
                  <div className="text-[10px] text-black/70 pt-0.5">{adj.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
