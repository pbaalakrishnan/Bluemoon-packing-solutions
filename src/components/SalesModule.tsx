import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { TapeType, TapeWidth } from '../types';
import {
  formatCurrencyINR,
  formatDate,
  formatNumber,
  exportToCSV,
} from '../utils/exportUtils';
import {
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ShieldAlert,
  Calculator,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface SalesModuleProps {
  onOpenPrintModal: (title: string, data: any, type: 'purchase' | 'job' | 'sale' | 'report') => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ onOpenPrintModal }) => {
  const { currentUser } = useAuth();
  const state = dbService.getState();

  // Modals
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [saleToDelete, setSaleToDelete] = useState<{ id: string; invoiceNo: string; details: string } | null>(null);

  // Notifications
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [widthFilter, setWidthFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const handleDeleteSaleConfirm = () => {
    if (!saleToDelete) return;
    const userEmail = currentUser?.email || 'admin@bluemoon.in';
    const res = dbService.deleteSale(saleToDelete.id, userEmail);
    if (res.success) {
      setFormSuccess(`Sales Invoice ${saleToDelete.invoiceNo} deleted from system.`);
    } else {
      alert(res.error || 'Failed to delete sale.');
    }
    setSaleToDelete(null);
    setTimeout(() => setFormSuccess(null), 3500);
  };

  // Form State
  const buyers = state.buyers.filter((b) => b.status === 'Active');
  const [buyerId, setBuyerId] = useState(buyers[0]?.id || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [tapeWidth, setTapeWidth] = useState<TapeWidth>('24 mm');
  const [tapeType, setTapeType] = useState<TapeType>('Plain-Transparent');
  const [saleUnit, setSaleUnit] = useState<'Cartons' | 'Pieces'>('Cartons');
  const [quantityInput, setQuantityInput] = useState('5');
  const [saleValue, setSaleValue] = useState('21600');
  const [remarks, setRemarks] = useState('');

  // Live stock & conversion calculations
  const availablePieces = dbService.getAvailablePiecesForProduct(tapeWidth, tapeType);
  const pcsPerCarton = dbService.getPiecesPerCarton(tapeWidth);
  const qtyNumber = parseInt(quantityInput, 10) || 0;

  const calculatedPiecesSold =
    saleUnit === 'Cartons' ? qtyNumber * pcsPerCarton : qtyNumber;
  const calculatedCartonsSold =
    saleUnit === 'Cartons' ? qtyNumber : Math.ceil(qtyNumber / pcsPerCarton);

  const isStockInsufficient = calculatedPiecesSold > availablePieces;

  // Handle Create Sale Order
  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (qtyNumber <= 0) {
      setFormError('Please enter a valid sale quantity greater than 0.');
      return;
    }

    const valueNum = parseFloat(saleValue);
    if (isNaN(valueNum) || valueNum < 0) {
      setFormError('Please enter a valid Sale Value in INR.');
      return;
    }

    const res = dbService.createSale(
      {
        saleDate,
        buyerId,
        tapeWidth,
        tapeType,
        saleUnit,
        quantity: qtyNumber,
        saleValue: valueNum,
        remarks,
      },
      currentUser?.email || 'sales@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to complete sale transaction.');
      return;
    }

    setFormSuccess(
      `Sale Order ${res.order?.saleInvoiceNo} created! Deducted ${calculatedPiecesSold} pieces (${calculatedCartonsSold} cartons) from Finished Goods.`,
    );
    setShowSaleModal(false);
    setRemarks('');
    setTimeout(() => setFormSuccess(null), 5000);
  };

  // Handle Cancel Sale
  const handleCancelSale = () => {
    if (!showCancelModal || !cancelReason.trim()) return;

    const res = dbService.cancelSale(
      showCancelModal,
      cancelReason.trim(),
      currentUser?.email || 'admin@bluemoon.in',
    );

    if (!res.success) {
      alert(res.error || 'Failed to cancel sale.');
      return;
    }

    setShowCancelModal(null);
    setCancelReason('');
    setFormSuccess(`Sale ${showCancelModal} cancelled and Finished Goods restored to inventory.`);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // Filtered Sales Orders
  const filteredSales = state.salesOrders.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.saleInvoiceNo.toLowerCase().includes(q) ||
      s.buyerName.toLowerCase().includes(q) ||
      s.tapeType.toLowerCase().includes(q);
    const matchBuyer = buyerFilter ? s.buyerId === buyerFilter : true;
    const matchWidth = widthFilter ? s.tapeWidth === widthFilter : true;
    const matchType = typeFilter ? s.tapeType === typeFilter : true;
    return matchSearch && matchBuyer && matchWidth && matchType;
  });

  const exportSalesCSV = () => {
    const headers = [
      'Invoice No',
      'Sale Date',
      'Buyer Name',
      'Tape Width',
      'Tape Type',
      'Pieces Sold',
      'Cartons Sold',
      'Sale Value (INR)',
      'Status',
      'Sales Rep',
    ];
    const rows = filteredSales.map((s) => [
      s.saleInvoiceNo,
      s.saleDate,
      s.buyerName,
      s.tapeWidth,
      s.tapeType,
      s.piecesSold,
      s.cartonsSold,
      s.saleValue,
      s.status,
      s.createdBy,
    ]);
    exportToCSV('Sales_Register_Ledger', rows, headers, 'Sales Register & Dispatch Ledger', currentUser?.email || 'admin');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            06 / Outward Dispatches & Sales
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Sales & Invoicing.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Dispatch billing, automatic Carton-to-Piece conversion, and instant Finished Goods deduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSalesCSV}
            className="px-3.5 py-2 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales CSV</span>
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowSaleModal(true);
            }}
            className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sale Order</span>
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

      {/* Filters Bar */}
      <div className="border border-black/15 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            placeholder="Search Invoice, Buyer, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
          />
        </div>

        <select
          value={buyerFilter}
          onChange={(e) => setBuyerFilter(e.target.value)}
          className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
        >
          <option value="">All Buyers</option>
          {state.buyers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={widthFilter}
          onChange={(e) => setWidthFilter(e.target.value)}
          className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
        >
          <option value="">All Widths</option>
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
          <option value="">All Types</option>
          <option value="Plain-Transparent">Plain-Transparent</option>
          <option value="Plain-Brown">Plain-Brown</option>
          <option value="Plain-Colour">Plain-Colour</option>
          <option value="Printed-Single-Colour">Printed-Single-Colour</option>
        </select>
      </div>

      {/* Sales Orders Table */}
      <div className="border border-black/15 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-black divide-y divide-black/10">
            <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Sale Date</th>
                <th className="p-3">Buyer / Customer</th>
                <th className="p-3">Product SKU</th>
                <th className="p-3 text-right">Sold (Pcs / Ctn)</th>
                <th className="p-3 text-right">Sale Value (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-black/40 font-serif italic text-base">
                    No sales orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="p-3 font-bold font-mono text-black">
                      {sale.saleInvoiceNo}
                    </td>
                    <td className="p-3 text-black/70 font-mono text-[11px]">{formatDate(sale.saleDate)}</td>
                    <td className="p-3 font-semibold text-black">
                      {sale.buyerName}
                      <span className="text-[10px] text-black/50 block font-mono font-normal">{sale.buyerPhone || ''}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-black">{sale.tapeWidth}</span> • {sale.tapeType}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <strong className="text-black text-sm">{formatNumber(sale.piecesSold)} Pcs</strong> <br />
                      <span className="text-black/60 text-[11px]">({sale.cartonsSold} Cartons)</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-black text-sm">
                      {formatCurrencyINR(sale.saleValue)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-black/20 bg-[#F4F4F1] text-black">
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onOpenPrintModal(`Tax Invoice - ${sale.saleInvoiceNo}`, sale, 'sale')}
                          className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                          title="Print Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {sale.status === 'Completed' && currentUser?.role === 'Admin' && (
                          <button
                            onClick={() => setShowCancelModal(sale.saleInvoiceNo)}
                            className="p-1.5 border border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 transition-colors"
                            title="Reverse / Cancel Sale"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setSaleToDelete({
                              id: sale.id,
                              invoiceNo: sale.saleInvoiceNo,
                              details: `${sale.buyerName} - ${sale.tapeWidth} (${sale.piecesSold} Pcs) - ₹${sale.saleValue}`,
                            })
                          }
                          className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/60 transition-colors"
                          title="Permanently Delete Sales Record"
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

      {/* CREATE SALE ORDER MODAL */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#121212]">
                  Create Sales Order & Dispatch Invoice
                </h2>
                <p className="text-[11px] text-black/60 font-sans">
                  Carton/Piece conversion with atomic stock verification
                </p>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buyer */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Select Buyer / Customer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black font-semibold"
                  >
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sale Date */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Date of Sale <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                {/* Tape Width */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Tape Width</label>
                  <select
                    value={tapeWidth}
                    onChange={(e) => setTapeWidth(e.target.value as TapeWidth)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  >
                    <option value="24 mm">24 mm (144 pcs/box)</option>
                    <option value="48 mm">48 mm (72 pcs/box)</option>
                    <option value="60 mm">60 mm (60 pcs/box)</option>
                    <option value="72 mm">72 mm (48 pcs/box)</option>
                  </select>
                </div>

                {/* Tape Type */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Tape Type</label>
                  <select
                    value={tapeType}
                    onChange={(e) => setTapeType(e.target.value as TapeType)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  >
                    <option value="Plain-Transparent">Plain-Transparent</option>
                    <option value="Plain-Brown">Plain-Brown</option>
                    <option value="Plain-Colour">Plain-Colour</option>
                    <option value="Printed-Single-Colour">Printed-Single-Colour</option>
                    <option value="Printed-Double-Colour">Printed-Double-Colour</option>
                    <option value="Printed-Transparent">Printed-Transparent</option>
                    <option value="Printed-Brown">Printed-Brown</option>
                  </select>
                </div>

                {/* Unit Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Sale Unit</label>
                  <div className="grid grid-cols-2 gap-2 border border-black/20 p-0.5 bg-[#F8F8F5]">
                    <button
                      type="button"
                      onClick={() => setSaleUnit('Cartons')}
                      className={`py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                        saleUnit === 'Cartons'
                          ? 'bg-black text-white font-bold'
                          : 'text-black/60 hover:text-black'
                      }`}
                    >
                      By Cartons
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleUnit('Pieces')}
                      className={`py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                        saleUnit === 'Pieces'
                          ? 'bg-black text-white font-bold'
                          : 'text-black/60 hover:text-black'
                      }`}
                    >
                      By Pieces
                    </button>
                  </div>
                </div>

                {/* Quantity Entered */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Quantity ({saleUnit}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>

                {/* Sale Value */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    Total Sale Value (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 21600"
                    value={saleValue}
                    onChange={(e) => setSaleValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Conversion & Finished Goods Stock Feedback Card */}
              <div
                className={`p-4 border space-y-2 text-xs ${
                  isStockInsufficient
                    ? 'bg-rose-50 border-rose-400 text-rose-950'
                    : 'bg-[#FAF9F6] border-black/15 text-black'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider">
                    <Calculator className="w-3.5 h-3.5 text-black" />
                    Automatic Packing Conversion
                  </span>
                  <span className="text-black/50 font-mono font-normal">
                    Packing: {pcsPerCarton} Pcs/Carton
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 bg-white border border-black/10">
                    <span className="text-[10px] text-black/50 block uppercase">Total Pieces to Deduct:</span>
                    <strong className="text-black text-sm">{formatNumber(calculatedPiecesSold)} Pcs</strong>
                  </div>
                  <div className="p-2 bg-white border border-black/10">
                    <span className="text-[10px] text-black/50 block uppercase">Equivalent Cartons:</span>
                    <strong className="text-black text-sm">{calculatedCartonsSold} Cartons</strong>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span>
                    Available in Stock: <strong className="text-black font-mono">{formatNumber(availablePieces)} Pcs</strong>
                  </span>
                  <span>
                    Stock Balance After Sale:{' '}
                    <strong
                      className={`font-mono ${
                        isStockInsufficient ? 'text-rose-600 font-bold' : 'text-black font-bold'
                      }`}
                    >
                      {formatNumber(Math.max(0, availablePieces - calculatedPiecesSold))} Pcs
                    </strong>
                  </span>
                </div>

                {isStockInsufficient && (
                  <div className="text-rose-600 font-bold text-[11px] pt-1">
                    🚫 Insufficient Finished Goods Stock! You cannot sell more than available {availablePieces} pieces.
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Dispatch Remarks / Gate Pass Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. Export garment packing dispatch via lorry"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStockInsufficient}
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm & Dispatch Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Reverse Sale Order {showCancelModal}
            </h3>
            <p className="text-xs text-black/70">
              Cancelling this sale will create an auditable reversal transaction and automatically return the sold
              finished goods back to physical stock.
            </p>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">
                Reason for Cancellation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Customer order amended, return to factory stock"
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
                className="px-4 py-2 border border-black/20 text-black text-xs font-medium"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelSale}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 uppercase tracking-wider"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT SALE DELETION MODAL */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-black/15 pb-3">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-black">
                  Delete Sales Invoice {saleToDelete.invoiceNo}
                </h3>
                <p className="text-xs text-black/60">This permanently removes the sales invoice from records.</p>
              </div>
            </div>

            <div className="bg-[#F8F8F5] border border-black/10 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-black">Invoice: {saleToDelete.invoiceNo}</div>
              <div className="text-black/70 font-mono text-[11px]">{saleToDelete.details}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 border border-black/20 bg-white hover:bg-[#F4F4F1] text-xs font-mono uppercase font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSaleConfirm}
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
