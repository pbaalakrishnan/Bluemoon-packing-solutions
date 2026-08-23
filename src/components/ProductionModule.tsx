import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import {
  TapeType,
  TapeWidth,
  ProductionJob,
} from '../types';
import {
  formatDate,
  formatNumber,
  exportToCSV,
} from '../utils/exportUtils';
import {
  Factory,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Trash2,
  Layers,
  Eye,
  Calculator,
  ShieldAlert,
  Package,
} from 'lucide-react';

interface ProductionModuleProps {
  onOpenPrintModal: (title: string, data: any, type: 'purchase' | 'job' | 'sale' | 'report') => void;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({ onOpenPrintModal }) => {
  const { currentUser } = useAuth();
  const state = dbService.getState();

  // Modals & Views
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [jobToDelete, setJobToDelete] = useState<{ id: string; jobCardNo: string; details: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form notifications
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleDeleteJobConfirm = () => {
    if (!jobToDelete) return;
    const userEmail = currentUser?.email || 'admin@bluemoon.in';
    const res = dbService.deleteJob(jobToDelete.id, userEmail);
    if (res.success) {
      setFormSuccess(`Job Card ${jobToDelete.jobCardNo} permanently deleted from records.`);
    } else {
      alert(res.error || 'Failed to delete job.');
    }
    setJobToDelete(null);
    setTimeout(() => setFormSuccess(null), 3500);
  };

  // Available stock balances
  const availableRolls = dbService.getAvailableRolls();
  const currentPaperCoreStock = dbService.getTotalPaperCoreStock();
  const currentCartonStock = dbService.getTotalCartonStock();
  const currentFilmStock = dbService.getTotalFilmStock();

  // Dynamic next Job Card number suggestion
  const generateNextJobCardNo = () => {
    const nextNum = state.productionJobs.length + 1001;
    return `JOB-${nextNum}`;
  };

  // Job Form State
  const [jobCardNo, setJobCardNo] = useState(generateNextJobCardNo());
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');

  // Multi-Roll consumption list
  const [rollsUsed, setRollsUsed] = useState<
    { rollId: string; weightUsed: string }[]
  >([]);

  // Other materials
  const [paperCoreUsed, setPaperCoreUsed] = useState('5');
  const [filmUsed, setFilmUsed] = useState('1');

  // Finished Goods Outputs
  const [outputs, setOutputs] = useState<
    { tapeWidth: TapeWidth; tapeType: TapeType; quantity: string }[]
  >([
    { tapeWidth: '24 mm', tapeType: 'Plain-Transparent', quantity: '288' },
  ]);

  // Roll tape handlers
  const handleAddRollRow = () => {
    if (availableRolls.length === 0) {
      setFormError('No available jumbo rolls in stock. Please purchase raw rolls first.');
      return;
    }
    const firstRoll = availableRolls[0];
    setRollsUsed([...rollsUsed, { rollId: firstRoll.rollId, weightUsed: '' }]);
  };

  const handleRemoveRollRow = (idx: number) => {
    const updated = [...rollsUsed];
    updated.splice(idx, 1);
    setRollsUsed(updated);
  };

  const handleRollChange = (idx: number, field: 'rollId' | 'weightUsed', value: string) => {
    const updated = [...rollsUsed];
    updated[idx] = { ...updated[idx], [field]: value };
    setRollsUsed(updated);
  };

  // Output handlers
  const handleAddOutputRow = () => {
    setOutputs([
      ...outputs,
      { tapeWidth: '48 mm', tapeType: 'Plain-Brown', quantity: '72' },
    ]);
  };

  const handleRemoveOutputRow = (idx: number) => {
    if (outputs.length <= 1) return;
    const updated = [...outputs];
    updated.splice(idx, 1);
    setOutputs(updated);
  };

  const handleOutputChange = (
    idx: number,
    field: 'tapeWidth' | 'tapeType' | 'quantity',
    value: string,
  ) => {
    const updated = [...outputs];
    updated[idx] = { ...updated[idx], [field]: value };
    setOutputs(updated);
  };

  // Live Automatic Carton Calculation summary
  const calculatedOutputs = outputs.map((out) => {
    const qty = parseInt(out.quantity, 10) || 0;
    const pcsPerCarton = dbService.getPiecesPerCarton(out.tapeWidth);
    const cartons = Math.ceil(qty / pcsPerCarton);
    return {
      ...out,
      qtyNumber: qty,
      pcsPerCarton,
      cartons,
    };
  });

  const totalCalculatedPieces = calculatedOutputs.reduce((sum, o) => sum + o.qtyNumber, 0);
  const totalCalculatedCartons = calculatedOutputs.reduce((sum, o) => sum + o.cartons, 0);

  // Submit Job
  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!jobCardNo.trim()) {
      setFormError('JOB Card Number is mandatory.');
      return;
    }

    if (rollsUsed.length === 0) {
      setFormError('Please select at least one Roll Tape for consumption.');
      return;
    }

    // Validate each roll used
    const formattedRolls: { rollId: string; weightUsed: number }[] = [];
    for (const r of rollsUsed) {
      const w = parseFloat(r.weightUsed);
      if (isNaN(w) || w <= 0) {
        setFormError(`Please enter a valid weight used for roll ${r.rollId}.`);
        return;
      }
      formattedRolls.push({ rollId: r.rollId, weightUsed: w });
    }

    // Validate outputs
    const formattedOutputs: { tapeWidth: TapeWidth; tapeType: TapeType; quantity: number }[] = [];
    for (const out of outputs) {
      const q = parseInt(out.quantity, 10);
      if (isNaN(q) || q <= 0) {
        setFormError('Finished goods quantities must be positive whole numbers.');
        return;
      }
      formattedOutputs.push({
        tapeWidth: out.tapeWidth,
        tapeType: out.tapeType,
        quantity: q,
      });
    }

    const coreNum = parseFloat(paperCoreUsed) || 0;
    const filmNum = parseFloat(filmUsed) || 0;

    const res = dbService.createProductionJob(
      {
        jobCardNo: jobCardNo.trim(),
        productionDate,
        rollsUsed: formattedRolls,
        paperCoreUsedKg: coreNum,
        cartonBoxesUsed: totalCalculatedCartons,
        heatShrinkFilmUsedKg: filmNum,
        outputs: formattedOutputs,
        remarks,
      },
      currentUser?.email || 'production@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to create Production Job.');
      return;
    }

    setFormSuccess(`JOB ${jobCardNo} created and posted to Finished Goods & Inventory Ledger!`);
    setShowJobModal(false);
    setSelectedJob(res.job || null);
    // Reset form
    setJobCardNo(generateNextJobCardNo());
    setRollsUsed([]);
    setOutputs([{ tapeWidth: '24 mm', tapeType: 'Plain-Transparent', quantity: '288' }]);
    setTimeout(() => setFormSuccess(null), 5000);
  };

  // Job Cancellation / Reversal Handler
  const handleCancelJob = () => {
    if (!showCancelModal || !cancelReason.trim()) return;

    const res = dbService.cancelProductionJob(
      showCancelModal,
      cancelReason.trim(),
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      alert(res.error || 'Failed to cancel job');
      return;
    }

    setShowCancelModal(null);
    setCancelReason('');
    setSelectedJob(null);
    setFormSuccess(`JOB ${showCancelModal} successfully reversed and raw materials restored!`);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // Filtered jobs list
  const filteredJobs = state.productionJobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      j.jobCardNo.toLowerCase().includes(q) ||
      j.productionDate.includes(q) ||
      j.createdBy.toLowerCase().includes(q);
    const matchStatus = statusFilter ? j.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const exportJobsCSV = () => {
    const headers = [
      'Job Card No',
      'Production Date',
      'Total Pieces',
      'Total Cartons',
      'Rolls Used',
      'Paper Core (Kg)',
      'Carton Boxes Used',
      'Status',
      'Created By',
    ];
    const rows = filteredJobs.map((j) => [
      j.jobCardNo,
      j.productionDate,
      j.totalPieces,
      j.totalCartons,
      j.rollsUsed.map((r) => `${r.rollId} (${r.weightUsed}Kg)`).join('; '),
      j.paperCoreUsedKg,
      j.cartonBoxesUsed,
      j.status,
      j.createdBy,
    ]);
    exportToCSV('Production_Jobs_Register', rows, headers, 'Production Job Register', currentUser?.email || 'admin');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            04 / Slitting & Production
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Production Job Entry.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Jumbo roll consumption, automated carton calculation, and finished goods generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportJobsCSV}
            className="px-3.5 py-2 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-colors"
          >
            Export Register
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setJobCardNo(generateNextJobCardNo());
              if (rollsUsed.length === 0 && availableRolls.length > 0) {
                setRollsUsed([{ rollId: availableRolls[0].rollId, weightUsed: '25' }]);
              }
              setShowJobModal(true);
            }}
            className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Production Job</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Real-time Material Readiness Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Available Jumbo Rolls</div>
          <div className="font-serif text-2xl font-bold text-black mt-1">
            {availableRolls.length} <span className="text-xs font-mono font-normal text-black/50">({formatNumber(availableRolls.reduce((s, r) => s + r.availableWeight, 0))} Kg)</span>
          </div>
        </div>
        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Paper Core Stock</div>
          <div className="font-serif text-2xl font-bold text-black mt-1">
            {formatNumber(currentPaperCoreStock)} <span className="text-xs font-mono font-normal text-black/50">Kg</span>
          </div>
        </div>
        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Carton Boxes Stock</div>
          <div className="font-serif text-2xl font-bold text-black mt-1">
            {formatNumber(currentCartonStock)} <span className="text-xs font-mono font-normal text-black/50">Boxes</span>
          </div>
        </div>
        <div className="border border-black/15 bg-white p-4">
          <div className="text-[10px] text-black/50 font-mono font-semibold uppercase tracking-wider">Shrink Film Stock</div>
          <div className="font-serif text-2xl font-bold text-black mt-1">
            {formatNumber(currentFilmStock)} <span className="text-xs font-mono font-normal text-black/50">Kg</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="border border-black/15 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            placeholder="Search JOB Card No, Date, Operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Production Jobs Table */}
      <div className="border border-black/15 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-black divide-y divide-black/10">
            <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold border-b border-black/15 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">JOB Card No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Raw Rolls Consumed</th>
                <th className="p-3">Core / Film</th>
                <th className="p-3 text-right">Finished Goods Output</th>
                <th className="p-3 text-right">Cartons Packed</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-black/40 font-serif italic text-base">
                    No production job records found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="p-3 font-bold font-mono text-black">
                      {job.jobCardNo}
                    </td>
                    <td className="p-3 text-black/70 font-mono text-[11px]">{formatDate(job.productionDate)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {job.rollsUsed.map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 border border-black/20 bg-[#F4F4F1] font-mono text-[10px]"
                          >
                            {r.rollId}: {r.weightUsed} Kg
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-black/70 font-mono text-[11px]">
                      Core: <span className="text-black font-semibold">{job.paperCoreUsedKg} Kg</span> <br />
                      Film: <span className="text-black font-semibold">{job.heatShrinkFilmUsedKg} Kg</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {formatNumber(job.totalPieces)} Pcs
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-black">
                      {job.totalCartons} Boxes
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-black/20 bg-[#F4F4F1] text-black">
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                          title="View Complete Job Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenPrintModal(`Job Card Sheet - ${job.jobCardNo}`, job, 'job')}
                          className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                          title="Print Production Job Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setJobToDelete({
                              id: job.id,
                              jobCardNo: job.jobCardNo,
                              details: `Produced: ${job.totalPieces} Pcs (${job.totalCartons} Boxes) on ${job.productionDate}`,
                            })
                          }
                          className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                          title="Permanently Delete Job Card"
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

      {/* CREATE JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-3xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#121212]">
                  New Slitting & Production Job Card
                </h2>
                <p className="text-[11px] text-black/60 font-sans">
                  Atomic raw material consumption & automatic finished goods carton calculation
                </p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitJob} className="p-5 sm:p-6 space-y-6">
              {formError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Job Card Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8F8F5] p-4 border border-black/10">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    JOB Card No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={jobCardNo}
                    onChange={(e) => setJobCardNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono uppercase focus:outline-none focus:border-black font-bold"
                  />
                  <span className="text-[10px] text-black/50 mt-0.5 block">
                    Unique identifier. System strictly prevents duplicates.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Production Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* 2. Roll Tape Consumption */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Layers className="w-3.5 h-3.5 text-black" />
                    1. Jumbo Roll Tape Consumption
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRollRow}
                    className="px-2.5 py-1 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-semibold flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Roll</span>
                  </button>
                </div>

                {rollsUsed.length === 0 ? (
                  <div className="p-4 bg-[#F8F8F5] text-center text-black/50 text-xs border border-dashed border-black/20">
                    No rolls selected. Click "+ Add Roll" to specify jumbo roll consumption.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {rollsUsed.map((rUsage, idx) => {
                      const rollData = availableRolls.find((r) => r.rollId === rUsage.rollId);
                      const weightUsedNum = parseFloat(rUsage.weightUsed) || 0;
                      const closingWeight = rollData
                        ? Math.max(0, rollData.availableWeight - weightUsedNum)
                        : 0;
                      const isOverweight = rollData && weightUsedNum > rollData.availableWeight;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[#F8F8F5] border border-black/15 space-y-2"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-semibold text-black/60 mb-0.5">
                                Select Available Roll ID
                              </label>
                              <select
                                value={rUsage.rollId}
                                onChange={(e) => handleRollChange(idx, 'rollId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs font-mono"
                              >
                                {availableRolls.map((roll) => (
                                  <option key={roll.rollId} value={roll.rollId}>
                                    {roll.rollId} — {roll.jumboRollType} ({roll.availableWeight} Kg avail)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-semibold text-black/60 mb-0.5">
                                Weight Used (Kg) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="e.g. 25"
                                value={rUsage.weightUsed}
                                onChange={(e) => handleRollChange(idx, 'weightUsed', e.target.value)}
                                className={`w-full px-2.5 py-1.5 bg-white border text-xs font-mono ${
                                  isOverweight
                                    ? 'border-rose-500 focus:border-rose-500'
                                    : 'border-black/20 focus:border-black'
                                }`}
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveRollRow(idx)}
                                className="p-1.5 text-black/40 hover:text-rose-600 hover:bg-black/5"
                                title="Remove Roll"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {rollData && (
                            <div className="flex flex-wrap items-center justify-between text-[11px] px-2 py-1 bg-white border border-black/10 text-black/70 font-mono">
                              <div>
                                Available Before: <strong className="text-black">{rollData.availableWeight} Kg</strong>
                              </div>
                              <div>
                                Weight Used: <strong className="text-black">{weightUsedNum} Kg</strong>
                              </div>
                              <div>
                                Closing Balance:{' '}
                                <strong
                                  className={isOverweight ? 'text-rose-600 font-bold' : 'text-black'}
                                >
                                  {closingWeight.toFixed(2)} Kg
                                </strong>
                              </div>
                            </div>
                          )}

                          {isOverweight && (
                            <div className="text-[11px] text-rose-600 font-medium">
                              ⚠️ Weight used exceeds available balance ({rollData?.availableWeight} Kg). Cannot save!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Paper Core & Shrink Film Consumption */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8F8F5] p-4 border border-black/10">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Paper Core Used (Kg) — Avail: {currentPaperCoreStock} Kg
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={paperCoreUsed}
                    onChange={(e) => setPaperCoreUsed(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Shrink Film Used (Kg) — Avail: {currentFilmStock} Kg
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={filmUsed}
                    onChange={(e) => setFilmUsed(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 4. Finished Goods Output Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Package className="w-3.5 h-3.5 text-black" />
                    2. Finished Goods Output Lines
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOutputRow}
                    className="px-2.5 py-1 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-semibold flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Line</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {outputs.map((out, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F8F8F5] border border-black/15 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-black/60 mb-0.5">Tape Width</label>
                        <select
                          value={out.tapeWidth}
                          onChange={(e) => handleOutputChange(idx, 'tapeWidth', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs"
                        >
                          <option value="24 mm">24 mm (144 pcs/box)</option>
                          <option value="48 mm">48 mm (72 pcs/box)</option>
                          <option value="60 mm">60 mm (60 pcs/box)</option>
                          <option value="72 mm">72 mm (48 pcs/box)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-semibold text-black/60 mb-0.5">Tape Type</label>
                        <select
                          value={out.tapeType}
                          onChange={(e) => handleOutputChange(idx, 'tapeType', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs"
                        >
                          <option value="Plain-Transparent">Plain-Transparent</option>
                          <option value="Plain-Brown">Plain-Brown</option>
                          <option value="Plain-Colour">Plain-Colour</option>
                          <option value="Printed-Single-Colour">Printed-Single-Colour</option>
                          <option value="Printed-Double-Colour">Printed-Double-Colour</option>
                          <option value="Printed-Transparent">Printed-Transparent</option>
                          <option value="Printed-Brown">Printed-Brown</option>
                          <option value="Printed-Colour-Background">Printed-Colour-Background</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-black/60 mb-0.5">
                          Output Pieces <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 300"
                          value={out.quantity}
                          onChange={(e) => handleOutputChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {outputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOutputRow(idx)}
                            className="p-1.5 text-black/40 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. AUTOMATIC CARTON CALCULATION AUDIT CARD */}
              <div className="p-4 border border-black/20 bg-[#FAF9F6] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-black font-mono uppercase tracking-wider">
                    <Calculator className="w-3.5 h-3.5 text-black" />
                    <span>Automatic Carton Box Calculation</span>
                  </div>
                  <span className="text-[10px] font-mono text-black/50">CEIL(Qty / PcsPerCarton)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {calculatedOutputs.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-black/10 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-black">{c.tapeWidth}</span>: {c.qtyNumber} Pcs
                        <div className="text-[10px] text-black/50 font-mono">
                          CEIL({c.qtyNumber} / {c.pcsPerCarton})
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-black text-sm">
                        {c.cartons} Cartons
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-black/10 flex items-center justify-between text-xs font-semibold">
                  <div className="text-black/70">
                    Total Output: <strong className="text-black font-mono">{formatNumber(totalCalculatedPieces)}</strong> Pieces
                  </div>
                  <div className="text-black">
                    Cartons Required: <strong className="text-base text-black font-mono">{totalCalculatedCartons}</strong> Boxes
                  </div>
                </div>

                <div className="text-[11px] text-black/50 flex items-center gap-1.5 pt-1 font-mono">
                  <span>Carton Inventory: {currentCartonStock} available → After Job:</span>
                  <strong
                    className={
                      totalCalculatedCartons > currentCartonStock
                        ? 'text-rose-600'
                        : 'text-black'
                    }
                  >
                    {Math.max(0, currentCartonStock - totalCalculatedCartons)} Boxes
                  </strong>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Production Remarks / Machine Operator Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slitter machine 2, Batch 1 approved"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold flex items-center gap-2"
                >
                  <Factory className="w-3.5 h-3.5" />
                  <span>Execute & Save Job</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOB DETAIL VIEW & AUDIT MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-2xl shadow-2xl p-6 space-y-5 my-6">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-black font-mono">{selectedJob.jobCardNo}</h2>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase border border-black/20 bg-[#F4F4F1]">
                    {selectedJob.status}
                  </span>
                </div>
                <p className="text-xs text-black/60 font-mono">Production Date: {formatDate(selectedJob.productionDate)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenPrintModal(`Job Card - ${selectedJob.jobCardNo}`, selectedJob, 'job')}
                  className="p-2 border border-black/20 hover:bg-black hover:text-white transition-colors"
                  title="Print Job Sheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 border border-black/20 hover:bg-black hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Roll-wise Consumption Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                Roll Tape Consumption Breakdown
              </h3>
              <div className="overflow-x-auto border border-black/15">
                <table className="w-full text-xs text-left divide-y divide-black/10">
                  <thead className="bg-[#F8F8F5] text-black/60 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Roll ID</th>
                      <th className="p-2 text-right">Opening Wt</th>
                      <th className="p-2 text-right">Weight Used</th>
                      <th className="p-2 text-right">Closing Wt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 font-mono">
                    {selectedJob.rollsUsed.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold text-black">{r.rollId}</td>
                        <td className="p-2 text-right">{r.openingWeight} Kg</td>
                        <td className="p-2 text-right font-bold text-black">{r.weightUsed} Kg</td>
                        <td className="p-2 text-right text-black">{r.closingWeight} Kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Material Quantities Before / After */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-[#F8F8F5] border border-black/10">
                <span className="text-[10px] text-black/50 uppercase font-mono block">Paper Core</span>
                <strong className="text-black font-mono">{selectedJob.paperCoreUsedKg} Kg</strong>
              </div>
              <div className="p-2.5 bg-[#F8F8F5] border border-black/10">
                <span className="text-[10px] text-black/50 uppercase font-mono block">Carton Boxes</span>
                <strong className="text-black font-mono">{selectedJob.cartonBoxesUsed} Boxes</strong>
              </div>
              <div className="p-2.5 bg-[#F8F8F5] border border-black/10">
                <span className="text-[10px] text-black/50 uppercase font-mono block">Shrink Film</span>
                <strong className="text-black font-mono">{selectedJob.heatShrinkFilmUsedKg} Kg</strong>
              </div>
            </div>

            {/* Finished Goods Outputs */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                Finished Goods Produced
              </h3>
              <div className="space-y-1.5">
                {selectedJob.outputs.map((out, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#F8F8F5] border border-black/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-black">{out.tapeWidth}</span> • {out.tapeType}
                    </div>
                    <div className="text-right font-mono">
                      <strong className="text-black">{formatNumber(out.quantity)} Pcs</strong> &nbsp;
                      <span className="text-black/60">({out.cartonsCalculated} Cartons)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancellation / Reversal Option */}
            {selectedJob.status === 'Completed' && currentUser?.role === 'Admin' && (
              <div className="pt-3 border-t border-black/15 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(selectedJob.jobCardNo)}
                  className="px-3.5 py-1.5 border border-rose-300 bg-rose-50 text-rose-900 text-xs font-semibold uppercase tracking-wider"
                >
                  Reverse / Cancel Job
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-1.5 bg-black text-white text-xs uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANCELLATION REASON MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Reverse Job {showCancelModal}
            </h3>
            <p className="text-xs text-black/70">
              Cancelling this job will automatically restore all consumed raw materials back to inventory and
              remove unsold finished goods.
            </p>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">
                Reason for Reversal <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Slitting defect detected, raw material re-spooled"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-black/20 text-xs text-black"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-black/20 text-black text-xs"
              >
                Keep Job
              </button>
              <button
                onClick={handleCancelJob}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 uppercase tracking-wider"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT JOB DELETION MODAL */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-black/15 pb-3">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-black">
                  Delete Job Card {jobToDelete.jobCardNo}
                </h3>
                <p className="text-xs text-black/60">This permanently removes the production run from ledger records.</p>
              </div>
            </div>

            <div className="bg-[#F8F8F5] border border-black/10 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-black">Job Card: {jobToDelete.jobCardNo}</div>
              <div className="text-black/70 font-mono text-[11px]">{jobToDelete.details}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 border border-black/20 bg-white hover:bg-[#F4F4F1] text-xs font-mono uppercase font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJobConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
