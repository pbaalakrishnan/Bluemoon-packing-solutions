import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { PaymentMode, PaymentReceipt, SaleOrder, TapeType, TapeWidth } from '../types';
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
  IndianRupee,
  Receipt,
  History,
  CreditCard,
  Building2,
  Clock,
  Check,
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

  // Payment Recording Modal State
  const [paymentModalSale, setPaymentModalSale] = useState<SaleOrder | null>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payDateInput, setPayDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [payModeInput, setPayModeInput] = useState<PaymentMode>('Bank Transfer / NEFT / RTGS');
  const [payRefInput, setPayRefInput] = useState('');
  const [payNotesInput, setPayNotesInput] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Payment History Modal State
  const [historyModalSale, setHistoryModalSale] = useState<SaleOrder | null>(null);

  // Notifications
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [widthFilter, setWidthFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Pending'>('All');

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

  // Form State for New Sale Order
  const buyers = state.buyers.filter((b) => b.status === 'Active');
  const [buyerId, setBuyerId] = useState(buyers[0]?.id || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [tapeWidth, setTapeWidth] = useState<TapeWidth>('24 mm');
  const [tapeType, setTapeType] = useState<TapeType>('Plain-Transparent');
  const [saleUnit, setSaleUnit] = useState<'Cartons' | 'Pieces'>('Cartons');
  const [quantityInput, setQuantityInput] = useState('5');
  const [saleValue, setSaleValue] = useState('21600');
  const [initialPaymentReceived, setInitialPaymentReceived] = useState('');
  const [initialPaymentMode, setInitialPaymentMode] = useState<PaymentMode>('Bank Transfer / NEFT / RTGS');
  const [initialPaymentRef, setInitialPaymentRef] = useState('');
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

    const initPaidNum = initialPaymentReceived ? parseFloat(initialPaymentReceived) : 0;
    if (initPaidNum < 0 || initPaidNum > valueNum) {
      setFormError(`Initial payment cannot be negative or exceed the total invoice value of ₹${valueNum.toLocaleString()}`);
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
        amountReceived: initPaidNum,
        paymentMode: initPaidNum > 0 ? initialPaymentMode : undefined,
        paymentReference: initialPaymentRef || undefined,
        paymentRemarks: initPaidNum > 0 ? 'Initial payment collected at invoice creation' : undefined,
        remarks,
      },
      currentUser?.email || 'sales@bluemoon.in',
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to complete sale transaction.');
      return;
    }

    setFormSuccess(
      `Sale Order ${res.order?.saleInvoiceNo} created! Deducted ${calculatedPiecesSold} pieces (${calculatedCartonsSold} cartons). Payment status: ${res.order?.paymentStatus || 'Pending'}.`,
    );
    setShowSaleModal(false);
    setRemarks('');
    setInitialPaymentReceived('');
    setInitialPaymentRef('');
    setTimeout(() => setFormSuccess(null), 5000);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (sale: SaleOrder) => {
    const received = sale.amountReceived || 0;
    const due = Math.max(0, sale.saleValue - received);
    setPaymentModalSale(sale);
    setPayAmountInput(due > 0 ? due.toString() : '');
    setPayDateInput(new Date().toISOString().slice(0, 10));
    setPayModeInput('Bank Transfer / NEFT / RTGS');
    setPayRefInput('');
    setPayNotesInput('');
    setPaymentError(null);
  };

  // Submit Payment Received
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSale) return;

    setPaymentError(null);
    const amountNum = parseFloat(payAmountInput);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError('Please enter a valid received payment amount greater than 0.');
      return;
    }

    const currentReceived = paymentModalSale.amountReceived || 0;
    const currentDue = paymentModalSale.saleValue - currentReceived;

    if (amountNum > currentDue + 0.01) {
      setPaymentError(`Payment amount (₹${amountNum.toLocaleString()}) cannot exceed remaining balance due of ₹${currentDue.toLocaleString()}`);
      return;
    }

    const userEmail = currentUser?.email || 'sales@bluemoon.in';
    const res = dbService.recordSalePayment(
      paymentModalSale.id,
      {
        amount: amountNum,
        paymentDate: payDateInput,
        paymentMode: payModeInput,
        referenceNo: payRefInput,
        notes: payNotesInput,
      },
      userEmail,
    );

    if (!res.success) {
      setPaymentError(res.error || 'Failed to record payment.');
      return;
    }

    setFormSuccess(
      `Payment of ₹${amountNum.toLocaleString()} successfully recorded for Invoice ${paymentModalSale.saleInvoiceNo}!`,
    );
    setPaymentModalSale(null);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // Handle Delete Payment Receipt
  const handleDeletePaymentReceipt = (saleId: string, paymentId: string, amount: number) => {
    if (!window.confirm(`Are you sure you want to reverse / delete this payment receipt of ₹${amount.toLocaleString()}?`)) {
      return;
    }
    const userEmail = currentUser?.email || 'admin@bluemoon.in';
    const res = dbService.deleteSalePayment(saleId, paymentId, userEmail);
    if (res.success) {
      setFormSuccess(`Payment receipt of ₹${amount.toLocaleString()} removed.`);
      // Refresh history modal state if open
      const updatedSale = state.salesOrders.find((s) => s.id === saleId);
      setHistoryModalSale(updatedSale || null);
    } else {
      alert(res.error || 'Failed to delete payment receipt.');
    }
    setTimeout(() => setFormSuccess(null), 3500);
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

  // KPI Calculations
  const completedSales = state.salesOrders.filter((s) => s.status === 'Completed');
  const totalSalesValue = completedSales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalAmountReceived = completedSales.reduce((sum, s) => sum + (s.amountReceived || 0), 0);
  const totalOutstandingDue = Math.max(0, totalSalesValue - totalAmountReceived);
  const collectionRate = totalSalesValue > 0 ? Math.round((totalAmountReceived / totalSalesValue) * 100) : 100;

  // Filtered Sales Orders
  const filteredSales = state.salesOrders.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.saleInvoiceNo.toLowerCase().includes(q) ||
      s.buyerName.toLowerCase().includes(q) ||
      s.tapeType.toLowerCase().includes(q) ||
      (s.paymentReference && s.paymentReference.toLowerCase().includes(q));
    const matchBuyer = buyerFilter ? s.buyerId === buyerFilter : true;
    const matchWidth = widthFilter ? s.tapeWidth === widthFilter : true;
    const matchType = typeFilter ? s.tapeType === typeFilter : true;
    
    let matchPaymentStatus = true;
    if (paymentStatusFilter !== 'All') {
      const pStatus = s.paymentStatus || (s.amountReceived && s.amountReceived >= s.saleValue ? 'Paid' : (s.amountReceived || 0) > 0 ? 'Partial' : 'Pending');
      matchPaymentStatus = pStatus === paymentStatusFilter;
    }

    return matchSearch && matchBuyer && matchWidth && matchType && matchPaymentStatus;
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
      'Total Value (INR)',
      'Amount Received (INR)',
      'Balance Due (INR)',
      'Payment Status',
      'Payment Mode',
      'Reference No',
      'Order Status',
      'Sales Rep',
    ];
    const rows = filteredSales.map((s) => {
      const received = s.amountReceived || 0;
      const due = s.balanceDue ?? Math.max(0, s.saleValue - received);
      const status = s.paymentStatus || (received >= s.saleValue ? 'Paid' : received > 0 ? 'Partial' : 'Pending');
      return [
        s.saleInvoiceNo,
        s.saleDate,
        s.buyerName,
        s.tapeWidth,
        s.tapeType,
        s.piecesSold,
        s.cartonsSold,
        s.saleValue,
        received,
        due,
        status,
        s.paymentMode || 'N/A',
        s.paymentReference || 'N/A',
        s.status,
        s.createdBy,
      ];
    });
    exportToCSV('Sales_Register_Ledger', rows, headers, 'Sales Register & Payment Ledger', currentUser?.email || 'admin');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            06 / Outward Dispatches & Payment Receivables
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Sales & Payment Receivables.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Dispatch billing, automatic Carton-to-Piece deduction, and real-time payment collection tracking.
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

      {/* Financial Summary & Receivables KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-black/15 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-black/50">
            <span>Total Invoiced Sales</span>
            <Receipt className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="font-serif text-2xl font-bold text-black">
            {formatCurrencyINR(totalSalesValue)}
          </div>
          <div className="text-[10px] text-black/60 font-mono">
            {completedSales.length} Completed Invoices
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-emerald-800">
            <span>Total Amount Received</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-900">
            {formatCurrencyINR(totalAmountReceived)}
          </div>
          <div className="text-[10px] text-emerald-700 font-mono font-semibold">
            Collection Rate: {collectionRate}%
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-amber-900">
            <span>Outstanding Balance Due</span>
            <Clock className="w-3.5 h-3.5 text-amber-800" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-950">
            {formatCurrencyINR(totalOutstandingDue)}
          </div>
          <div className="text-[10px] text-amber-800 font-mono">
            Pending Customer Settlements
          </div>
        </div>

        <div className="p-4 bg-[#F8F8F5] border border-black/15 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-black/50">
            <span>Payment Health</span>
            <CreditCard className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="font-serif text-2xl font-bold text-black">
            {collectionRate}%
          </div>
          <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-black h-full transition-all duration-500"
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="border border-black/15 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            placeholder="Search Invoice, Buyer, Ref..."
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

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black font-semibold focus:outline-none focus:border-black"
        >
          <option value="All">All Payment Statuses</option>
          <option value="Paid">Paid (Full)</option>
          <option value="Partial">Partial (Part Received)</option>
          <option value="Pending">Pending (Due)</option>
        </select>
      </div>

      {/* Sales Orders & Payments Table */}
      <div className="border border-black/15 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-black divide-y divide-black/10">
            <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Sale Date</th>
                <th className="p-3">Buyer / Customer</th>
                <th className="p-3">Product SKU</th>
                <th className="p-3 text-right">Sold (Qty)</th>
                <th className="p-3 text-right">Invoice Value</th>
                <th className="p-3 text-right">Received / Due</th>
                <th className="p-3 text-center">Payment Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-black/40 font-serif italic text-base">
                    No sales orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const received = sale.amountReceived || 0;
                  const due = sale.balanceDue ?? Math.max(0, sale.saleValue - received);
                  const pStatus = sale.paymentStatus || (received >= sale.saleValue ? 'Paid' : received > 0 ? 'Partial' : 'Pending');
                  const hasHistory = sale.payments && sale.payments.length > 0;

                  return (
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
                      <td className="p-3 text-right font-mono">
                        <div className="text-emerald-700 font-bold text-xs">
                          {formatCurrencyINR(received)}
                        </div>
                        {due > 0 ? (
                          <div className="text-rose-600 text-[11px] font-medium">
                            Due: {formatCurrencyINR(due)}
                          </div>
                        ) : (
                          <div className="text-black/40 text-[10px]">
                            Cleared (₹0 due)
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {pStatus === 'Paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-300 bg-emerald-50 text-emerald-800">
                            <Check className="w-2.5 h-2.5" />
                            Paid
                          </span>
                        )}
                        {pStatus === 'Partial' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900">
                            <Clock className="w-2.5 h-2.5" />
                            Partial
                          </span>
                        )}
                        {pStatus === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-rose-300 bg-rose-50 text-rose-800">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Pending
                          </span>
                        )}
                        {sale.status === 'Cancelled' && (
                          <span className="block mt-0.5 text-[9px] font-mono font-bold text-black/50 uppercase">
                            [Cancelled]
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Record Payment Button */}
                          {sale.status === 'Completed' && due > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(sale)}
                              className="px-2 py-1 border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                              title="Record / Mark Payment Received"
                            >
                              <IndianRupee className="w-3 h-3" />
                              <span>Receive</span>
                            </button>
                          )}

                          {/* Payment History / Receipts */}
                          {hasHistory && (
                            <button
                              onClick={() => setHistoryModalSale(sale)}
                              className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                              title="View Payment Receipts History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print Invoice */}
                          <button
                            onClick={() => onOpenPrintModal(`Tax Invoice - ${sale.saleInvoiceNo}`, sale, 'sale')}
                            className="p-1.5 border border-black/15 bg-white hover:bg-black hover:text-white transition-colors"
                            title="Print Tax Invoice & Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Reverse Sale (Admin) */}
                          {sale.status === 'Completed' && currentUser?.role === 'Admin' && (
                            <button
                              onClick={() => setShowCancelModal(sale.saleInvoiceNo)}
                              className="p-1.5 border border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 transition-colors"
                              title="Reverse / Cancel Sale"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Sale */}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT RECEIVED MODAL */}
      {paymentModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-lg shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#121212]">
                    Record Payment Received
                  </h2>
                  <p className="text-[11px] text-black/60 font-mono">
                    Invoice #{paymentModalSale.saleInvoiceNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalSale(null)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3 border border-rose-400 bg-rose-50 text-rose-950 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Invoice Summary Card */}
              <div className="bg-[#F8F8F5] border border-black/15 p-3.5 text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-black/10">
                  <span className="text-black/60 font-sans font-medium">Customer:</span>
                  <span className="font-bold font-sans text-black">{paymentModalSale.buyerName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-white border border-black/10">
                    <span className="text-[10px] text-black/50 block uppercase">Total Invoiced:</span>
                    <strong className="text-black text-xs sm:text-sm">
                      {formatCurrencyINR(paymentModalSale.saleValue)}
                    </strong>
                  </div>
                  <div className="p-2 bg-white border border-black/10">
                    <span className="text-[10px] text-emerald-700 block uppercase font-bold">Already Received:</span>
                    <strong className="text-emerald-800 text-xs sm:text-sm">
                      {formatCurrencyINR(paymentModalSale.amountReceived || 0)}
                    </strong>
                  </div>
                  <div className="p-2 bg-white border border-black/10">
                    <span className="text-[10px] text-rose-700 block uppercase font-bold">Remaining Due:</span>
                    <strong className="text-rose-800 text-xs sm:text-sm">
                      {formatCurrencyINR(Math.max(0, paymentModalSale.saleValue - (paymentModalSale.amountReceived || 0)))}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Amount Input with Full Balance Shortcut */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-black uppercase font-mono tracking-wider">
                    Amount Received (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const due = Math.max(0, paymentModalSale.saleValue - (paymentModalSale.amountReceived || 0));
                      setPayAmountInput(due.toString());
                    }}
                    className="text-[10px] font-mono uppercase font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Pay Full Balance (₹{Math.max(0, paymentModalSale.saleValue - (paymentModalSale.amountReceived || 0)).toLocaleString()})
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/40 font-bold font-mono">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    max={Math.max(0, paymentModalSale.saleValue - (paymentModalSale.amountReceived || 0))}
                    placeholder="e.g. 21600"
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-black/20 text-sm font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Payment Date & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 font-mono uppercase">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payDateInput}
                    onChange={(e) => setPayDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1 font-mono uppercase">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payModeInput}
                    onChange={(e) => setPayModeInput(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-semibold focus:outline-none focus:border-black"
                  >
                    <option value="Bank Transfer / NEFT / RTGS">Bank Transfer / NEFT / RTGS</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Demand Draft">Demand Draft</option>
                  </select>
                </div>
              </div>

              {/* Reference / UTR / Cheque Number */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1 font-mono uppercase">
                  Transaction Ref / UTR / Cheque No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-SBI-8891024 / CHQ-104928"
                  value={payRefInput}
                  onChange={(e) => setPayRefInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs font-mono focus:outline-none focus:border-black placeholder:text-black/30"
                />
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1 font-mono uppercase">
                  Payment Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via current bank account"
                  value={payNotesInput}
                  onChange={(e) => setPayNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs focus:outline-none focus:border-black placeholder:text-black/30"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-black/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalSale(null)}
                  className="px-4 py-2 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY & RECEIPTS MODAL */}
      {historyModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#121212]">
                    Payment Collection Receipts
                  </h2>
                  <p className="text-[11px] text-black/60 font-mono">
                    Invoice #{historyModalSale.saleInvoiceNo} — {historyModalSale.buyerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalSale(null)}
                className="p-1 border border-black/20 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#F8F8F5] border border-black/15 font-mono text-xs text-center">
                <div>
                  <span className="text-black/50 uppercase text-[10px] block">Invoice Value</span>
                  <strong className="text-sm text-black">{formatCurrencyINR(historyModalSale.saleValue)}</strong>
                </div>
                <div>
                  <span className="text-emerald-700 uppercase text-[10px] block font-bold">Total Received</span>
                  <strong className="text-sm text-emerald-800">{formatCurrencyINR(historyModalSale.amountReceived || 0)}</strong>
                </div>
                <div>
                  <span className="text-rose-700 uppercase text-[10px] block font-bold">Balance Remaining</span>
                  <strong className="text-sm text-rose-800">
                    {formatCurrencyINR(Math.max(0, historyModalSale.saleValue - (historyModalSale.amountReceived || 0)))}
                  </strong>
                </div>
              </div>

              {/* Receipts List */}
              <div className="space-y-2">
                <h3 className="font-mono text-xs uppercase font-bold text-black/60 tracking-wider">
                  Payment History Ledger ({historyModalSale.payments?.length || 0} Receipts)
                </h3>

                {(!historyModalSale.payments || historyModalSale.payments.length === 0) ? (
                  <div className="p-6 text-center text-black/40 font-serif italic border border-dashed border-black/20">
                    No payment receipts recorded for this invoice yet.
                  </div>
                ) : (
                  <div className="border border-black/15 divide-y divide-black/10">
                    {historyModalSale.payments.map((p: PaymentReceipt) => (
                      <div key={p.id} className="p-3.5 hover:bg-[#FAF9F6] flex items-center justify-between gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm font-mono text-emerald-800">
                              {formatCurrencyINR(p.amount)}
                            </span>
                            <span className="px-2 py-0.5 border border-black/15 bg-white font-mono text-[10px] uppercase font-semibold text-black">
                              {p.paymentMode}
                            </span>
                            {p.referenceNo && (
                              <span className="text-black/60 font-mono text-[11px]">
                                Ref: <strong className="text-black">{p.referenceNo}</strong>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-black/60 font-mono flex items-center gap-3">
                            <span>Date: {formatDate(p.paymentDate)}</span>
                            {p.recordedBy && <span>Recorded by: {p.recordedBy}</span>}
                          </div>
                          {p.notes && (
                            <div className="text-[11px] text-black/80 italic font-sans">
                              "{p.notes}"
                            </div>
                          )}
                        </div>

                        {currentUser?.role === 'Admin' && (
                          <button
                            onClick={() => handleDeletePaymentReceipt(historyModalSale.id, p.id, p.amount)}
                            className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-400 transition-colors shrink-0"
                            title="Delete / Reverse Payment Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-black/10">
                <button
                  type="button"
                  onClick={() => {
                    const s = historyModalSale;
                    setHistoryModalSale(null);
                    handleOpenPaymentModal(s);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono uppercase font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Record Another Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryModalSale(null)}
                  className="px-4 py-1.5 border border-black/20 text-black hover:bg-[#F4F4F1] text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  Carton/Piece conversion with atomic stock verification & payment receipt
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

              {/* Initial Payment Options (Optional) */}
              <div className="p-4 bg-[#F8F8F5] border border-black/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-black flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    Payment Collection at Billing (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() => setInitialPaymentReceived(saleValue)}
                    className="text-[10px] font-mono uppercase font-bold text-emerald-700 underline"
                  >
                    Mark Paid in Full
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-black/70 mb-1">
                      Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={initialPaymentReceived}
                      onChange={(e) => setInitialPaymentReceived(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs font-mono font-bold focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-black/70 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={initialPaymentMode}
                      onChange={(e) => setInitialPaymentMode(e.target.value as PaymentMode)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs focus:outline-none focus:border-black"
                    >
                      <option value="Bank Transfer / NEFT / RTGS">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-black/70 mb-1">
                      Ref / UTR No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-998822"
                      value={initialPaymentRef}
                      onChange={(e) => setInitialPaymentRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-black/20 text-xs font-mono focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
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
