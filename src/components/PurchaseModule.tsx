import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import {
  JumboRollType,
  RollWidth,
  Thickness,
  PaperCoreThickness,
} from '../types';
import {
  formatCurrencyINR,
  formatDate,
  formatNumber,
  exportToCSV,
} from '../utils/exportUtils';
import {
  ShoppingCart,
  Plus,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Layers,
  Boxes,
  Film,
} from 'lucide-react';

interface PurchaseModuleProps {
  onOpenPrintModal: (title: string, data: any, type: 'purchase' | 'job' | 'sale' | 'report') => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ onOpenPrintModal }) => {
  const { currentUser } = useAuth();
  const state = dbService.getState();
  const [activeTab, setActiveTab] = useState<'rollTape' | 'paperCore' | 'cartonBox' | 'heatShrinkFilm'>('rollTape');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterJumboType, setFilterJumboType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showRollModal, setShowRollModal] = useState(false);
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [showCartonModal, setShowCartonModal] = useState(false);
  const [showFilmModal, setShowFilmModal] = useState(false);

  // Form error & success banners
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Roll Tape Form State
  const [rollForm, setRollForm] = useState({
    rollId: '',
    jumboRollType: 'Plain-Transparent' as JumboRollType,
    purchasedDate: new Date().toISOString().slice(0, 10),
    supplierId: state.suppliers[0]?.id || '',
    rollWidth: '1315 mm' as RollWidth,
    thickness: '40 Microns' as Thickness,
    originalWeight: '',
    originalLength: '',
    cost: '',
  });

  // Paper Core Form State
  const [coreForm, setCoreForm] = useState({
    purchasedDate: new Date().toISOString().slice(0, 10),
    supplierId: state.suppliers[0]?.id || '',
    rollWidth: '1020 mm' as const,
    thickness: '3 mm' as PaperCoreThickness,
    weight: '',
    cost: '',
  });

  // Carton Box Form State
  const [cartonForm, setCartonForm] = useState({
    purchasedDate: new Date().toISOString().slice(0, 10),
    supplierId: state.suppliers[0]?.id || '',
    boxCount: '',
    cost: '',
  });

  // Heat Shrink Film Form State
  const [filmForm, setFilmForm] = useState({
    purchasedDate: new Date().toISOString().slice(0, 10),
    supplierId: state.suppliers[0]?.id || '',
    weight: '',
    cost: '',
  });

  const suppliers = state.suppliers.filter((s) => s.status === 'Active');

  // Submit Handlers
  const handleRollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const weightNum = parseFloat(rollForm.originalWeight);
    const lengthNum = parseFloat(rollForm.originalLength);
    const costNum = parseFloat(rollForm.cost);

    if (!rollForm.rollId.trim()) {
      setFormError('Roll Identification Number is required.');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please enter a valid Weight in Kg (> 0).');
      return;
    }
    if (isNaN(lengthNum) || lengthNum <= 0) {
      setFormError('Please enter a valid Length in Meters (> 0).');
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      setFormError('Please enter a valid Cost in INR.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === rollForm.supplierId);
    const res = dbService.createRollTapePurchase(
      {
        rollId: rollForm.rollId.trim(),
        jumboRollType: rollForm.jumboRollType,
        purchasedDate: rollForm.purchasedDate,
        supplierId: rollForm.supplierId,
        supplierName: supplier?.name || 'Unknown Supplier',
        rollWidth: rollForm.rollWidth,
        thickness: rollForm.thickness,
        originalWeight: weightNum,
        originalLength: lengthNum,
        cost: costNum,
        createdBy: currentUser?.email || 'admin@bluemoon.in',
      },
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to save Roll Tape Purchase.');
      return;
    }

    setFormSuccess(`Roll Tape ${rollForm.rollId} saved and added to Raw Material Inventory!`);
    setShowRollModal(false);
    setRollForm({
      rollId: '',
      jumboRollType: 'Plain-Transparent',
      purchasedDate: new Date().toISOString().slice(0, 10),
      supplierId: suppliers[0]?.id || '',
      rollWidth: '1315 mm',
      thickness: '40 Microns',
      originalWeight: '',
      originalLength: '',
      cost: '',
    });
    setTimeout(() => setFormSuccess(null), 4000);
  };

  const handleCoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const weightNum = parseFloat(coreForm.weight);
    const costNum = parseFloat(coreForm.cost);

    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please enter a valid weight in Kg.');
      return;
    }
    const supplier = suppliers.find((s) => s.id === coreForm.supplierId);
    const res = dbService.createPaperCorePurchase(
      {
        purchasedDate: coreForm.purchasedDate,
        supplierId: coreForm.supplierId,
        supplierName: supplier?.name || 'Unknown Supplier',
        rollWidth: '1020 mm',
        thickness: coreForm.thickness,
        weight: weightNum,
        cost: isNaN(costNum) ? 0 : costNum,
      },
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to save Paper Core purchase.');
      return;
    }

    setFormSuccess('Paper Core stock updated successfully.');
    setShowCoreModal(false);
    setCoreForm({
      purchasedDate: new Date().toISOString().slice(0, 10),
      supplierId: suppliers[0]?.id || '',
      rollWidth: '1020 mm',
      thickness: '3 mm',
      weight: '',
      cost: '',
    });
    setTimeout(() => setFormSuccess(null), 4000);
  };

  const handleCartonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const boxNum = parseInt(cartonForm.boxCount, 10);
    const costNum = parseFloat(cartonForm.cost);

    if (isNaN(boxNum) || boxNum <= 0) {
      setFormError('Please enter valid number of boxes.');
      return;
    }
    const supplier = suppliers.find((s) => s.id === cartonForm.supplierId);
    const res = dbService.createCartonPurchase(
      {
        purchasedDate: cartonForm.purchasedDate,
        supplierId: cartonForm.supplierId,
        supplierName: supplier?.name || 'Unknown Supplier',
        boxCount: boxNum,
        cost: isNaN(costNum) ? 0 : costNum,
      },
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to save Carton Box purchase.');
      return;
    }

    setFormSuccess('Carton Boxes inventory updated successfully.');
    setShowCartonModal(false);
    setCartonForm({
      purchasedDate: new Date().toISOString().slice(0, 10),
      supplierId: suppliers[0]?.id || '',
      boxCount: '',
      cost: '',
    });
    setTimeout(() => setFormSuccess(null), 4000);
  };

  const handleFilmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const weightNum = parseFloat(filmForm.weight);
    const costNum = parseFloat(filmForm.cost);

    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please enter valid film weight in Kg.');
      return;
    }
    const supplier = suppliers.find((s) => s.id === filmForm.supplierId);
    const res = dbService.createFilmPurchase(
      {
        purchasedDate: filmForm.purchasedDate,
        supplierId: filmForm.supplierId,
        supplierName: supplier?.name || 'Unknown Supplier',
        weight: weightNum,
        cost: isNaN(costNum) ? 0 : costNum,
      },
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to save Heat Shrink Film purchase.');
      return;
    }

    setFormSuccess('Heat Shrink Film stock updated successfully.');
    setShowFilmModal(false);
    setFilmForm({
      purchasedDate: new Date().toISOString().slice(0, 10),
      supplierId: suppliers[0]?.id || '',
      weight: '',
      cost: '',
    });
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // Filtered lists
  const filteredRolls = state.rollTapePurchases.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      r.rollId.toLowerCase().includes(q) ||
      r.supplierName.toLowerCase().includes(q) ||
      r.jumboRollType.toLowerCase().includes(q) ||
      r.rollWidth.toLowerCase().includes(q) ||
      r.thickness.toLowerCase().includes(q);
    const matchSup = filterSupplier ? r.supplierId === filterSupplier : true;
    const matchType = filterJumboType ? r.jumboRollType === filterJumboType : true;
    const matchStat = filterStatus ? r.status === filterStatus : true;
    return matchSearch && matchSup && matchType && matchStat;
  });

  const filteredCores = state.paperCorePurchases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.supplierName.toLowerCase().includes(q) ||
      c.thickness.toLowerCase().includes(q) ||
      c.purchasedDate.includes(q)
    );
  });

  const filteredCartons = state.cartonBoxPurchases.filter((b) => {
    const q = searchQuery.toLowerCase();
    return b.supplierName.toLowerCase().includes(q) || b.purchasedDate.includes(q);
  });

  const filteredFilms = state.heatShrinkFilmPurchases.filter((f) => {
    const q = searchQuery.toLowerCase();
    return f.supplierName.toLowerCase().includes(q) || f.purchasedDate.includes(q);
  });

  // Export Roll Tape to CSV
  const handleExportRolls = () => {
    const headers = [
      'Roll ID',
      'Jumbo Type',
      'Purchase Date',
      'Supplier',
      'Width',
      'Thickness',
      'Original Weight (Kg)',
      'Available Weight (Kg)',
      'Original Length (M)',
      'Available Length (M)',
      'Cost (INR)',
      'Status',
    ];
    const rows = filteredRolls.map((r) => [
      r.rollId,
      r.jumboRollType,
      r.purchasedDate,
      r.supplierName,
      r.rollWidth,
      r.thickness,
      r.originalWeight,
      r.availableWeight,
      r.originalLength,
      r.availableLength,
      r.cost,
      r.status,
    ]);
    exportToCSV('Roll_Tape_Purchases', rows, headers, 'Roll Tape Purchase Ledger', currentUser?.email || 'admin');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Header */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            02 / Inward Procurement
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Purchase Inventory.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Inward raw materials: Jumbo Roll Tapes, Paper Cores, Carton Boxes & Heat Shrink Films.
          </p>
        </div>

        {/* Action Button depending on tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'rollTape' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowRollModal(true);
              }}
              className="px-4 py-2.5 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inward Jumbo Roll Tape</span>
            </button>
          )}
          {activeTab === 'paperCore' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowCoreModal(true);
              }}
              className="px-4 py-2.5 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inward Paper Core</span>
            </button>
          )}
          {activeTab === 'cartonBox' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowCartonModal(true);
              }}
              className="px-4 py-2.5 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inward Carton Boxes</span>
            </button>
          )}
          {activeTab === 'heatShrinkFilm' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowFilmModal(true);
              }}
              className="px-4 py-2.5 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inward Heat Shrink Film</span>
            </button>
          )}
        </div>
      </div>

      {/* Success / Error Banners */}
      {formSuccess && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
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
          <span>01. Roll Tape ({state.rollTapePurchases.length})</span>
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
          <span>02. Paper Core ({state.paperCorePurchases.length})</span>
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
          <span>03. Cartons ({state.cartonBoxPurchases.length})</span>
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
          <span>04. Shrink Film ({state.heatShrinkFilmPurchases.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="border border-black/15 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
            <input
              type="text"
              placeholder="Search Roll ID, Supplier, Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
            />
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Specific Filters */}
          {activeTab === 'rollTape' && (
            <>
              <div>
                <select
                  value={filterJumboType}
                  onChange={(e) => setFilterJumboType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
                >
                  <option value="">All Jumbo Types</option>
                  <option value="Plain-Transparent">Plain-Transparent</option>
                  <option value="Plain-Brown">Plain-Brown</option>
                  <option value="Plain-Colour">Plain-Colour</option>
                  <option value="Printed-Single-Colour">Printed-Single-Colour</option>
                  <option value="Printed-Double-Colour">Printed-Double-Colour</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Partially Used">Partially Used</option>
                  <option value="Fully Used">Fully Used</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Action button bar */}
        <div className="flex items-center justify-between pt-2 border-t border-black/10 text-xs font-mono">
          <div className="text-black/50 text-[11px]">
            ACTIVE TAB: <span className="font-bold text-black uppercase">{activeTab}</span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'rollTape' && (
              <button
                onClick={handleExportRolls}
                className="px-3 py-1 border border-black/20 bg-white hover:bg-black hover:text-white text-black flex items-center gap-1.5 transition-colors uppercase text-[10px] tracking-wider font-semibold"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: ROLL TAPE TABLE */}
      {activeTab === 'rollTape' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Roll ID</th>
                  <th className="p-3">Jumbo Type</th>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Width & Thickness</th>
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
                      No Roll Tape purchase records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRolls.map((roll) => (
                    <tr key={roll.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="p-3 font-bold text-black font-mono">
                        {roll.rollId}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-black">{roll.jumboRollType}</span>
                      </td>
                      <td className="p-3 text-black/70 font-mono text-[11px]">{formatDate(roll.purchasedDate)}</td>
                      <td className="p-3 font-medium text-black">{roll.supplierName}</td>
                      <td className="p-3 text-black/70 font-mono text-[11px]">
                        {roll.rollWidth} • {roll.thickness}
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
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
                      <td className="p-3 text-right font-bold text-black font-mono">
                        {formatCurrencyINR(roll.cost)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-black/20 bg-[#F4F4F1] text-black">
                          {roll.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onOpenPrintModal(`Goods Receipt Note - ${roll.rollId}`, roll, 'purchase')}
                          className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                          title="Print Inward GRN"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAPER CORE TABLE */}
      {activeTab === 'paperCore' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Roll Width</th>
                  <th className="p-3">Core Thickness</th>
                  <th className="p-3 text-right">Purchased Weight (Kg)</th>
                  <th className="p-3 text-right">Cost (₹)</th>
                  <th className="p-3 text-right">Inward User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredCores.map((core) => (
                  <tr key={core.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(core.purchasedDate)}</td>
                    <td className="p-3 font-bold text-black">{core.supplierName}</td>
                    <td className="p-3 text-black/70 font-mono text-[11px]">{core.rollWidth}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 border border-black/20 bg-[#F4F4F1] font-mono text-[10px]">
                        {core.thickness}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-black font-mono">
                      {formatNumber(core.weight)} Kg
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatCurrencyINR(core.cost)}
                    </td>
                    <td className="p-3 text-right text-black/50 text-[10px] font-mono">{core.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CARTON BOX TABLE */}
      {activeTab === 'cartonBox' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Quantity (Nos / Boxes)</th>
                  <th className="p-3 text-right">Total Cost (₹)</th>
                  <th className="p-3 text-right">Inward User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredCartons.map((box) => (
                  <tr key={box.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(box.purchasedDate)}</td>
                    <td className="p-3 font-bold text-black">{box.supplierName}</td>
                    <td className="p-3 text-right font-bold text-black font-mono">
                      {formatNumber(box.boxCount)} Boxes
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatCurrencyINR(box.cost)}
                    </td>
                    <td className="p-3 text-right text-black/50 text-[10px] font-mono">{box.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HEAT SHRINK FILM TABLE */}
      {activeTab === 'heatShrinkFilm' && (
        <div className="border border-black/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black divide-y divide-black/10">
              <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Purchased Weight (Kg)</th>
                  <th className="p-3 text-right">Total Cost (₹)</th>
                  <th className="p-3 text-right">Inward User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredFilms.map((film) => (
                  <tr key={film.id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3 font-mono text-[11px]">{formatDate(film.purchasedDate)}</td>
                    <td className="p-3 font-bold text-black">{film.supplierName}</td>
                    <td className="p-3 text-right font-bold text-black font-mono">
                      {formatNumber(film.weight)} Kg
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatCurrencyINR(film.cost)}
                    </td>
                    <td className="p-3 text-right text-black/50 text-[10px] font-mono">{film.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: INWARD JUMBO ROLL TAPE */}
      {showRollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#121212]">
                  Inward Jumbo Roll Tape
                </h2>
                <p className="text-[11px] text-black/60 font-sans">
                  Adds new roll to Raw Material Inventory with unique ID validation
                </p>
              </div>
              <button
                onClick={() => setShowRollModal(false)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRollSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Roll ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RT-0005"
                    value={rollForm.rollId}
                    onChange={(e) => setRollForm({ ...rollForm, rollId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono uppercase focus:outline-none focus:border-black"
                  />
                  <span className="text-[10px] text-black/50 mt-0.5 block">
                    Must be unique in database.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Jumbo Roll Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rollForm.jumboRollType}
                    onChange={(e) =>
                      setRollForm({ ...rollForm, jumboRollType: e.target.value as JumboRollType })
                    }
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  >
                    <option value="Plain-Transparent">Plain-Transparent</option>
                    <option value="Plain-Brown">Plain-Brown</option>
                    <option value="Plain-Colour">Plain-Colour</option>
                    <option value="Printed-Single-Colour">Printed-Single-Colour</option>
                    <option value="Printed-Double-Colour">Printed-Double-Colour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Purchased Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={rollForm.purchasedDate}
                    onChange={(e) => setRollForm({ ...rollForm, purchasedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={rollForm.supplierId}
                    onChange={(e) => setRollForm({ ...rollForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Roll Width <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rollForm.rollWidth}
                    onChange={(e) => setRollForm({ ...rollForm, rollWidth: e.target.value as RollWidth })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  >
                    <option value="1315 mm">1315 mm</option>
                    <option value="1020 mm">1020 mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Thickness <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rollForm.thickness}
                    onChange={(e) => setRollForm({ ...rollForm, thickness: e.target.value as Thickness })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  >
                    <option value="38 Microns">38 Microns</option>
                    <option value="40 Microns">40 Microns</option>
                    <option value="42 Microns">42 Microns</option>
                    <option value="44 Microns">44 Microns</option>
                    <option value="46 Microns">46 Microns</option>
                    <option value="48 Microns">48 Microns</option>
                    <option value="50 Microns">50 Microns</option>
                    <option value="52 Microns">52 Microns</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Weight (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 500"
                    value={rollForm.originalWeight}
                    onChange={(e) => setRollForm({ ...rollForm, originalWeight: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Length (Meter) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 10000"
                    value={rollForm.originalLength}
                    onChange={(e) => setRollForm({ ...rollForm, originalLength: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    Purchase Cost (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 75000"
                    value={rollForm.cost}
                    onChange={(e) => setRollForm({ ...rollForm, cost: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRollModal(false)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Save & Inward Roll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAPER CORE PURCHASE */}
      {showCoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <h2 className="font-serif text-lg font-bold text-[#121212]">
                Inward Paper Core Stock
              </h2>
              <button
                onClick={() => setShowCoreModal(false)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCoreSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs">
                  {formError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Purchased Date</label>
                  <input
                    type="date"
                    required
                    value={coreForm.purchasedDate}
                    onChange={(e) => setCoreForm({ ...coreForm, purchasedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Supplier</label>
                  <select
                    value={coreForm.supplierId}
                    onChange={(e) => setCoreForm({ ...coreForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Roll Width</label>
                    <input
                      type="text"
                      disabled
                      value="1020 mm"
                      className="w-full px-3 py-2 bg-[#F4F4F1] border border-black/20 text-xs text-black/60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Core Thickness</label>
                    <select
                      value={coreForm.thickness}
                      onChange={(e) =>
                        setCoreForm({ ...coreForm, thickness: e.target.value as PaperCoreThickness })
                      }
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                    >
                      <option value="3 mm">3 mm</option>
                      <option value="3.5 mm">3.5 mm</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Weight (Kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 350"
                      value={coreForm.weight}
                      onChange={(e) => setCoreForm({ ...coreForm, weight: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Cost (₹ INR)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 24500"
                      value={coreForm.cost}
                      onChange={(e) => setCoreForm({ ...coreForm, cost: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCoreModal(false)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Inward Paper Core
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CARTON BOX PURCHASE */}
      {showCartonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <h2 className="font-serif text-lg font-bold text-[#121212]">
                Inward Carton Boxes Stock
              </h2>
              <button
                onClick={() => setShowCartonModal(false)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCartonSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs">
                  {formError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Purchased Date</label>
                  <input
                    type="date"
                    required
                    value={cartonForm.purchasedDate}
                    onChange={(e) => setCartonForm({ ...cartonForm, purchasedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Supplier</label>
                  <select
                    value={cartonForm.supplierId}
                    onChange={(e) => setCartonForm({ ...cartonForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">No. of Boxes (Nos)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      value={cartonForm.boxCount}
                      onChange={(e) => setCartonForm({ ...cartonForm, boxCount: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Cost in INR (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 17500"
                      value={cartonForm.cost}
                      onChange={(e) => setCartonForm({ ...cartonForm, cost: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCartonModal(false)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Inward Boxes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HEAT SHRINK FILM PURCHASE */}
      {showFilmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <h2 className="font-serif text-lg font-bold text-[#121212]">
                Inward Heat Shrink Film Stock
              </h2>
              <button
                onClick={() => setShowFilmModal(false)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleFilmSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs">
                  {formError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Purchased Date</label>
                  <input
                    type="date"
                    required
                    value={filmForm.purchasedDate}
                    onChange={(e) => setFilmForm({ ...filmForm, purchasedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Supplier</label>
                  <select
                    value={filmForm.supplierId}
                    onChange={(e) => setFilmForm({ ...filmForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Weight in Kg</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 120"
                      value={filmForm.weight}
                      onChange={(e) => setFilmForm({ ...filmForm, weight: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Cost in INR (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 15600"
                      value={filmForm.cost}
                      onChange={(e) => setFilmForm({ ...filmForm, cost: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFilmModal(false)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Inward Film Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
