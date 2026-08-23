import React, { useState } from 'react';
import { dbService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyINR, formatDate, formatNumber, exportToCSV } from '../utils/exportUtils';
import {
  Layers,
  Search,
  Download,
  Package,
  Boxes,
  Film,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RawMaterialInventoryProps {
  onOpenPrintModal: (title: string, data: any, type: 'purchase' | 'job' | 'sale' | 'report') => void;
}

export const RawMaterialInventory: React.FC<RawMaterialInventoryProps> = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'rollTape' | 'paperCore' | 'cartonBox' | 'heatShrinkFilm'>('rollTape');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [selectedRollDetail, setSelectedRollDetail] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'rollTape' | 'paperCore' | 'cartonBox' | 'heatShrinkFilm';
    id: string;
    label: string;
    details: string;
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const state = dbService.getState();

  // Overall Stock Stats
  const totalRollKg = state.rollTapePurchases.reduce((acc, r) => acc + r.availableWeight, 0);
  const totalPaperCoreKg = dbService.getTotalPaperCoreStock();
  const totalCartonBoxes = dbService.getTotalCartonStock();
  const totalShrinkFilmKg = dbService.getTotalFilmStock();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    const userEmail = currentUser?.email || 'admin@bluemoon.in';

    if (itemToDelete.type === 'rollTape') {
      const res = dbService.deleteRollTapePurchase(itemToDelete.id, userEmail);
      if (res.success) {
        showToast(`Roll Tape ${itemToDelete.id} was permanently removed from inventory.`);
      } else {
        alert(res.error || 'Failed to delete roll.');
      }
    } else if (itemToDelete.type === 'paperCore') {
      const res = dbService.deletePaperCorePurchase(itemToDelete.id, userEmail);
      if (res.success) {
        showToast(`Paper Core batch (${itemToDelete.label}) removed.`);
      } else {
        alert(res.error || 'Failed to delete paper core entry.');
      }
    } else if (itemToDelete.type === 'cartonBox') {
      const res = dbService.deleteCartonPurchase(itemToDelete.id, userEmail);
      if (res.success) {
        showToast(`Carton Box batch (${itemToDelete.label}) removed.`);
      } else {
        alert(res.error || 'Failed to delete carton box entry.');
      }
    } else if (itemToDelete.type === 'heatShrinkFilm') {
      const res = dbService.deleteFilmPurchase(itemToDelete.id, userEmail);
      if (res.success) {
        showToast(`Heat Shrink Film batch (${itemToDelete.label}) removed.`);
      } else {
        alert(res.error || 'Failed to delete film entry.');
      }
    }

    setItemToDelete(null);
  };

  const handlePurgeEmptyRolls = () => {
    if (window.confirm('Are you sure you want to purge all fully consumed / 0 Kg roll tape records?')) {
      const userEmail = currentUser?.email || 'admin@bluemoon.in';
      const res = dbService.purgeEmptyRolls(userEmail);
      if (res.count > 0) {
        showToast(`Purged ${res.count} fully used roll(s) from inventory.`);
      } else {
        showToast('No depleted rolls were found to purge.');
      }
    }
  };

  // Filtered lists
  const filteredRolls = state.rollTapePurchases.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      r.rollId.toLowerCase().includes(q) ||
      r.jumboRollType.toLowerCase().includes(q) ||
      r.supplierName.toLowerCase().includes(q) ||
      r.thickness.toLowerCase().includes(q);
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    const matchSupplier = supplierFilter ? r.supplierId === supplierFilter : true;
    return matchSearch && matchStatus && matchSupplier;
  });

  const exportRollInventory = () => {
    const headers = [
      'Roll ID',
      'Jumbo Type',
      'Width',
      'Thickness',
      'Supplier',
      'Purchase Date',
      'Orig Weight (Kg)',
      'Avail Weight (Kg)',
      'Orig Length (M)',
      'Avail Length (M)',
      'Cost (INR)',
      'Status',
    ];
    const rows = filteredRolls.map((r) => [
      r.rollId,
      r.jumboRollType,
      r.rollWidth,
      r.thickness,
      r.supplierName,
      r.purchasedDate,
      r.originalWeight,
      r.availableWeight,
      r.originalLength,
      r.availableLength,
      r.cost,
      r.status,
    ]);
    exportToCSV('Raw_Material_Roll_Tape_Stock', rows, headers, 'Raw Material Roll Tape Stock Report', 'Auditor');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner & Quick Metrics */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            03 / Raw Material Warehouse
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Raw Material Inventory.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Real-time balance, lot-by-lot tracking, item deletions, and consumption history.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'rollTape' && (
            <button
              onClick={handlePurgeEmptyRolls}
              className="px-3 py-2 border border-black/20 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-black text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
              title="Purge all 0 Kg / Fully Used rolls from database"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Purge Empty Rolls</span>
            </button>
          )}

          <button
            onClick={exportRollInventory}
            className="px-4 py-2 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Stock Sheet</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-black" />
            Roll Tape Balance
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
            {formatNumber(totalRollKg)} <span className="text-xs font-mono font-normal text-black/50">Kg</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">
            {state.rollTapePurchases.filter((r) => r.availableWeight > 0).length} active jumbo rolls
          </div>
        </div>

        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3 h-3 text-black" />
            Paper Core Balance
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
            {formatNumber(totalPaperCoreKg)} <span className="text-xs font-mono font-normal text-black/50">Kg</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">1020 mm core width</div>
        </div>

        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Boxes className="w-3 h-3 text-black" />
            Carton Boxes Stock
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
            {formatNumber(totalCartonBoxes)} <span className="text-xs font-mono font-normal text-black/50">Nos</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">Corrugated master boxes</div>
        </div>

        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3 h-3 text-black" />
            Heat Shrink Film
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mt-2">
            {formatNumber(totalShrinkFilmKg)} <span className="text-xs font-mono font-normal text-black/50">Kg</span>
          </div>
          <div className="text-[10px] text-black/50 mt-1 font-mono">Packaging bundle film</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/15 space-x-1 sm:space-x-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('rollTape')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-sans uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'rollTape'
              ? 'border-black text-black font-bold bg-white'
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>01. Roll Tape Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('paperCore')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-sans uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'paperCore'
              ? 'border-black text-black font-bold bg-white'
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>02. Paper Core</span>
        </button>

        <button
          onClick={() => setActiveTab('cartonBox')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-sans uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'cartonBox'
              ? 'border-black text-black font-bold bg-white'
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>03. Carton Boxes</span>
        </button>

        <button
          onClick={() => setActiveTab('heatShrinkFilm')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-sans uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'heatShrinkFilm'
              ? 'border-black text-black font-bold bg-white'
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>04. Heat Shrink Film</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="border border-black/15 bg-white p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            placeholder="Search material, roll ID, specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
          />
        </div>

        {activeTab === 'rollTape' && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Partially Used">Partially Used</option>
              <option value="Fully Used">Fully Used</option>
            </select>

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
            >
              <option value="">All Suppliers</option>
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* TAB 1: ROLL TAPE */}
      {activeTab === 'rollTape' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Roll ID</th>
                  <th className="p-3">Jumbo Type</th>
                  <th className="p-3">Width & Thickness</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Purchased Date</th>
                  <th className="p-3 text-right">Original (Kg / M)</th>
                  <th className="p-3 text-right">Available (Kg / M)</th>
                  <th className="p-3 text-right">Cost (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredRolls.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-black/40 font-serif italic text-base">
                      No roll tape records found.
                    </td>
                  </tr>
                ) : (
                  filteredRolls.map((roll) => (
                    <tr key={roll.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="p-3 font-mono font-bold text-black">
                        {roll.rollId}
                      </td>
                      <td className="p-3 font-semibold text-black">{roll.jumboRollType}</td>
                      <td className="p-3 text-black/70 font-mono text-[11px]">
                        {roll.rollWidth} • {roll.thickness}
                      </td>
                      <td className="p-3 text-black">{roll.supplierName}</td>
                      <td className="p-3 text-black/70 font-mono text-[11px]">{formatDate(roll.purchasedDate)}</td>
                      <td className="p-3 text-right text-black/60 font-mono text-[11px]">
                        {formatNumber(roll.originalWeight)} Kg <br />
                        <span className="text-[10px] text-black/40">{formatNumber(roll.originalLength)} M</span>
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
                        <span className="font-bold text-black">
                          {formatNumber(roll.availableWeight)} Kg
                        </span>
                        <br />
                        <span className="text-[10px] text-black/40">
                          {formatNumber(roll.availableLength)} M
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-black">
                        {formatCurrencyINR(roll.cost)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-black/20 bg-[#F4F4F1] text-black">
                          {roll.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedRollDetail(roll)}
                            className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                            title="View Roll Lot Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setItemToDelete({
                                type: 'rollTape',
                                id: roll.rollId,
                                label: `Roll ${roll.rollId}`,
                                details: `${roll.jumboRollType} (${roll.rollWidth}, ${roll.thickness}) - Available: ${roll.availableWeight} Kg`,
                              })
                            }
                            className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                            title="Delete Roll Tape"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAPER CORE */}
      {activeTab === 'paperCore' && (
        <div className="border border-black/15 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-serif text-lg font-bold text-[#121212]">Paper Core Stock Ledger</h2>
            <div className="text-xs font-mono text-black/70 font-semibold">
              Current Available: {formatNumber(totalPaperCoreKg)} Kg
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Roll Width</th>
                  <th className="p-3">Thickness</th>
                  <th className="p-3 text-right">Inward Weight (Kg)</th>
                  <th className="p-3 text-right">Total Cost (₹)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {state.paperCorePurchases.map((core) => (
                  <tr key={core.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(core.purchasedDate)}</td>
                    <td className="p-3 font-semibold text-black">{core.supplierName}</td>
                    <td className="p-3 text-black/70 font-mono text-[11px]">{core.rollWidth}</td>
                    <td className="p-3 font-mono text-[11px]">{core.thickness}</td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {formatNumber(core.weight)} Kg
                    </td>
                    <td className="p-3 text-right font-mono">{formatCurrencyINR(core.cost)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          setItemToDelete({
                            type: 'paperCore',
                            id: core.id,
                            label: `Paper Core (${core.thickness})`,
                            details: `Inward ${core.weight} Kg from ${core.supplierName}`,
                          })
                        }
                        className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                        title="Delete Paper Core Entry"
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

      {/* TAB 3: CARTON BOXES */}
      {activeTab === 'cartonBox' && (
        <div className="border border-black/15 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-serif text-lg font-bold text-[#121212]">Carton Box Inventory Status</h2>
            <div className="text-xs font-mono text-black/70 font-semibold">
              Current Available Boxes: {formatNumber(totalCartonBoxes)} Nos
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Boxes Purchased</th>
                  <th className="p-3 text-right">Total Cost (₹)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {state.cartonBoxPurchases.map((cb) => (
                  <tr key={cb.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(cb.purchasedDate)}</td>
                    <td className="p-3 font-semibold text-black">{cb.supplierName}</td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {formatNumber(cb.boxCount)} Nos
                    </td>
                    <td className="p-3 text-right font-mono">{formatCurrencyINR(cb.cost)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          setItemToDelete({
                            type: 'cartonBox',
                            id: cb.id,
                            label: `Carton Boxes (${cb.boxCount} Nos)`,
                            details: `Supplier: ${cb.supplierName}, Cost: ₹${cb.cost}`,
                          })
                        }
                        className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                        title="Delete Carton Box Entry"
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

      {/* TAB 4: HEAT SHRINK FILM */}
      {activeTab === 'heatShrinkFilm' && (
        <div className="border border-black/15 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="font-serif text-lg font-bold text-[#121212]">Heat Shrink Film Balance</h2>
            <div className="text-xs font-mono text-black/70 font-semibold">
              Current Available: {formatNumber(totalShrinkFilmKg)} Kg
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Purchased Weight (Kg)</th>
                  <th className="p-3 text-right">Total Cost (₹)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {state.heatShrinkFilmPurchases.map((f) => (
                  <tr key={f.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(f.purchasedDate)}</td>
                    <td className="p-3 font-semibold text-black">{f.supplierName}</td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {formatNumber(f.weight)} Kg
                    </td>
                    <td className="p-3 text-right font-mono">{formatCurrencyINR(f.cost)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          setItemToDelete({
                            type: 'heatShrinkFilm',
                            id: f.id,
                            label: `Heat Shrink Film (${f.weight} Kg)`,
                            details: `Supplier: ${f.supplierName}, Cost: ₹${f.cost}`,
                          })
                        }
                        className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                        title="Delete Heat Shrink Film Entry"
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

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-black/15 pb-3">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-black">
                  Confirm Inventory Deletion
                </h3>
                <p className="text-xs text-black/60">This action will be logged in the immutable audit ledger.</p>
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
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLL DETAIL MODAL */}
      {selectedRollDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#121212]">
                  Roll Details: <span className="font-mono">{selectedRollDetail.rollId}</span>
                </h3>
                <p className="text-xs text-black/60 font-sans">{selectedRollDetail.jumboRollType}</p>
              </div>
              <button
                onClick={() => setSelectedRollDetail(null)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block mb-1 text-[10px] font-mono uppercase">Supplier</span>
                <span className="font-semibold text-black">{selectedRollDetail.supplierName}</span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block mb-1 text-[10px] font-mono uppercase">Purchase Date</span>
                <span className="font-semibold text-black font-mono">{formatDate(selectedRollDetail.purchasedDate)}</span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block mb-1 text-[10px] font-mono uppercase">Width & Thickness</span>
                <span className="font-semibold text-black font-mono">
                  {selectedRollDetail.rollWidth} • {selectedRollDetail.thickness}
                </span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block mb-1 text-[10px] font-mono uppercase">Original Qty</span>
                <span className="font-semibold text-black font-mono">
                  {selectedRollDetail.originalWeight} Kg / {selectedRollDetail.originalLength} M
                </span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block mb-1 text-[10px] font-mono uppercase">Available Weight</span>
                <span className="font-bold text-black font-mono text-sm">
                  {selectedRollDetail.availableWeight} Kg
                </span>
              </div>
              <div className="p-3 bg-[#F8F8F5] border border-black/10">
                <span className="text-black/50 block mb-1 text-[10px] font-mono uppercase">Purchase Cost</span>
                <span className="font-bold text-black font-mono">
                  {formatCurrencyINR(selectedRollDetail.cost)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRollDetail(null)}
                className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
