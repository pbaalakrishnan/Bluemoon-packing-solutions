import React from 'react';
import { COMPANY_INFO } from '../services/db';
import { formatCurrencyINR, formatDate, formatDateTime, formatNumber } from '../utils/exportUtils';
import { Printer, X } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: 'purchase' | 'job' | 'sale' | 'report';
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type,
}) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white font-sans">
      <div className="bg-white border border-black/20 w-full max-w-4xl shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-[#F8F8F5] border-b border-black/15 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-black" />
            <span className="font-serif text-base font-bold text-black">{title}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 border border-black/20 bg-white hover:bg-black hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Letterhead Paper Document */}
        <div className="p-8 sm:p-12 bg-white text-[#121212] font-sans min-h-[600px] space-y-6 print:p-0">
          {/* Bluemoon Official Letterhead */}
          <div className="border-b border-black pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-serif font-black text-base">
                  B
                </div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-black uppercase tracking-tight">
                  {COMPANY_INFO.name}
                </h1>
              </div>
              <p className="text-xs text-black/70 mt-1 max-w-md leading-relaxed">
                {COMPANY_INFO.address}
              </p>
              <div className="text-[11px] text-black/80 mt-1 flex flex-wrap gap-x-4 font-mono">
                <span><strong>Phone:</strong> {COMPANY_INFO.phone}</span>
                <span><strong>Email:</strong> {COMPANY_INFO.email}</span>
                <span><strong>GSTIN:</strong> {COMPANY_INFO.gstin}</span>
              </div>
            </div>

            <div className="text-right sm:self-center">
              <div className="inline-block px-3 py-1 border border-black bg-[#F8F8F5] font-mono font-bold text-xs uppercase text-black">
                {type === 'job' && 'JOB CARD / PRODUCTION SLIP'}
                {type === 'sale' && 'TAX INVOICE & DISPATCH NOTE'}
                {type === 'purchase' && 'GOODS INWARD VOUCHER'}
                {type === 'report' && 'AUDIT REPORT & STATEMENT'}
              </div>
              <div className="text-[10px] text-black/50 mt-1 font-mono">
                Generated: {formatDateTime(new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* TYPE: PRODUCTION JOB */}
          {type === 'job' && (
            <div className="space-y-5 text-xs text-black">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8F8F5] p-4 border border-black/15 font-mono">
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Job Card No</span>
                  <strong className="text-sm font-bold text-black">{data.jobCardNo}</strong>
                </div>
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Production Date</span>
                  <strong className="text-black">{formatDate(data.productionDate)}</strong>
                </div>
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Status</span>
                  <strong className="text-black">{data.status}</strong>
                </div>
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Operator / Rep</span>
                  <strong className="text-black">{data.createdBy}</strong>
                </div>
              </div>

              {/* Rolls Used Table */}
              <div>
                <h3 className="font-serif text-xs font-bold text-black uppercase tracking-wider mb-2">
                  1. Jumbo Roll Tape Consumption
                </h3>
                <table className="w-full text-left border border-black/20 divide-y divide-black/10">
                  <thead className="bg-[#F8F8F5] font-mono font-semibold text-[10px] uppercase text-black/60">
                    <tr>
                      <th className="p-2 border-r border-black/15">Roll ID</th>
                      <th className="p-2 text-right border-r border-black/15">Opening Weight</th>
                      <th className="p-2 text-right border-r border-black/15">Weight Used</th>
                      <th className="p-2 text-right">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 font-mono text-[11px]">
                    {data.rollsUsed?.map((r: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 border-r border-black/15 font-bold">{r.rollId}</td>
                        <td className="p-2 text-right border-r border-black/15">{r.openingWeight} Kg</td>
                        <td className="p-2 text-right border-r border-black/15 font-bold">{r.weightUsed} Kg</td>
                        <td className="p-2 text-right">{r.closingWeight} Kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Other Packing */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#F8F8F5] border border-black/15 font-mono text-xs">
                <div>
                  <span className="text-black/50 text-[10px] block uppercase">Paper Core Consumed:</span>
                  <strong>{data.paperCoreUsedKg} Kg</strong>
                </div>
                <div>
                  <span className="text-black/50 text-[10px] block uppercase">Carton Boxes Used:</span>
                  <strong>{data.cartonBoxesUsed} Boxes</strong>
                </div>
                <div>
                  <span className="text-black/50 text-[10px] block uppercase">Shrink Film Used:</span>
                  <strong>{data.heatShrinkFilmUsedKg} Kg</strong>
                </div>
              </div>

              {/* Finished Goods Produced Table */}
              <div>
                <h3 className="font-serif text-xs font-bold text-black uppercase tracking-wider mb-2">
                  2. Finished Goods Slit Output
                </h3>
                <table className="w-full text-left border border-black/20 divide-y divide-black/10">
                  <thead className="bg-[#F8F8F5] font-mono font-semibold text-[10px] uppercase text-black/60">
                    <tr>
                      <th className="p-2 border-r border-black/15">Tape Width</th>
                      <th className="p-2 border-r border-black/15">Tape Type</th>
                      <th className="p-2 text-right border-r border-black/15">Output Quantity (Pieces)</th>
                      <th className="p-2 text-right">Master Cartons Packed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 text-[11px] font-mono">
                    {data.outputs?.map((out: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 border-r border-black/15 font-bold font-sans">{out.tapeWidth}</td>
                        <td className="p-2 border-r border-black/15 font-sans">{out.tapeType}</td>
                        <td className="p-2 text-right border-r border-black/15 font-bold">
                          {formatNumber(out.quantity)} Pcs
                        </td>
                        <td className="p-2 text-right font-bold">
                          {out.cartonsCalculated} Cartons
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TYPE: SALES INVOICE */}
          {type === 'sale' && (
            <div className="space-y-5 text-xs text-black">
              <div className="grid grid-cols-2 gap-4 bg-[#F8F8F5] p-4 border border-black/15">
                <div>
                  <span className="text-[10px] uppercase font-bold text-black/50 block font-mono">Buyer / Consignee:</span>
                  <div className="font-serif font-bold text-base text-black">{data.buyerName}</div>
                  <div className="text-[11px] text-black/60 mt-0.5 font-mono">{data.buyerPhone}</div>
                </div>

                <div className="text-right space-y-1 font-mono">
                  <div>
                    <span className="text-black/50">Invoice No:</span>{' '}
                    <strong className="font-bold text-sm text-black">{data.saleInvoiceNo}</strong>
                  </div>
                  <div>
                    <span className="text-black/50">Invoice Date:</span>{' '}
                    <strong>{formatDate(data.saleDate)}</strong>
                  </div>
                  <div>
                    <span className="text-black/50">Payment Terms:</span> <strong>Immediate / 30 Days</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border border-black/20 divide-y divide-black/10">
                <thead className="bg-[#F8F8F5] font-mono font-semibold text-[10px] uppercase text-black/60">
                  <tr>
                    <th className="p-2.5 border-r border-black/15">#</th>
                    <th className="p-2.5 border-r border-black/15">Description of Goods</th>
                    <th className="p-2.5 text-right border-r border-black/15">Quantity (Pieces)</th>
                    <th className="p-2.5 text-right border-r border-black/15">Cartons</th>
                    <th className="p-2.5 text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 text-[11px]">
                  <tr>
                    <td className="p-2.5 border-r border-black/15 font-mono">1</td>
                    <td className="p-2.5 border-r border-black/15">
                      <strong>BOPP Self Adhesive Tape</strong>
                      <div className="text-[10px] text-black/60">
                        Specification: {data.tapeWidth} • {data.tapeType}
                      </div>
                    </td>
                    <td className="p-2.5 text-right border-r border-black/15 font-mono font-bold">
                      {formatNumber(data.piecesSold)} Pcs
                    </td>
                    <td className="p-2.5 text-right border-r border-black/15 font-mono font-bold">
                      {data.cartonsSold} Cartons
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-sm text-black">
                      {formatCurrencyINR(data.saleValue)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#F8F8F5] border-t border-black font-bold text-xs">
                  <tr>
                    <td colSpan={4} className="p-2 text-right uppercase text-[11px] font-mono">
                      Invoice Grand Total:
                    </td>
                    <td className="p-2 text-right font-mono text-sm text-black">
                      {formatCurrencyINR(data.saleValue)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-2 text-right uppercase text-[11px] font-mono text-emerald-800">
                      Amount Received:
                    </td>
                    <td className="p-2 text-right font-mono text-sm text-emerald-800">
                      {formatCurrencyINR(data.amountReceived || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-2 text-right uppercase text-[11px] font-mono text-rose-800">
                      Balance Due / Outstanding:
                    </td>
                    <td className="p-2 text-right font-mono text-sm text-rose-800">
                      {formatCurrencyINR(Math.max(0, data.saleValue - (data.amountReceived || 0)))}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Payment Receipts Breakdown if available */}
              {data.payments && data.payments.length > 0 && (
                <div className="p-3 bg-[#F8F8F5] border border-black/15 text-[11px] space-y-1.5 font-mono">
                  <div className="font-bold text-black uppercase text-[10px]">Payment Receipts Summary:</div>
                  {data.payments.map((p: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-black/80">
                      <span>
                        • {formatDate(p.paymentDate)} via {p.paymentMode} {p.referenceNo ? `(Ref: ${p.referenceNo})` : ''}
                      </span>
                      <strong className="text-emerald-800">{formatCurrencyINR(p.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-[11px] text-black/60 flex items-center justify-between">
                <div>
                  <strong>Payment Status:</strong>{' '}
                  <span className="font-mono font-bold uppercase text-black">
                    {data.paymentStatus || (data.amountReceived >= data.saleValue ? 'PAID IN FULL' : (data.amountReceived || 0) > 0 ? 'PARTIALLY PAID' : 'PAYMENT PENDING')}
                  </span>
                </div>
                <div className="text-[10px] text-black/50">
                  Authorized Signatory: ________________________
                </div>
              </div>

              <div className="pt-1 text-[10px] text-black/60">
                <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </div>
            </div>
          )}

          {/* TYPE: REPORT */}
          {type === 'report' && (
            <div className="space-y-4 text-xs">
              <div className="text-black/60 font-mono text-[11px]">Period: {data.period}</div>
              <table className="w-full text-left border border-black/20 divide-y divide-black/10">
                <thead className="bg-[#F8F8F5] font-mono font-semibold text-[10px] uppercase text-black/60">
                  <tr>
                    {data.headers?.map((h: string, i: number) => (
                      <th key={i} className="p-2 border-r border-black/15">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 text-[11px] font-mono">
                  {data.rows?.map((row: any[], rIdx: number) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-black/15">
                          {typeof cell === 'number' ? formatNumber(cell) : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.totals && (
                <div className="p-3 bg-[#F8F8F5] border border-black/20 flex justify-end gap-6 font-mono text-xs font-bold">
                  {data.totals.map((tot: any, i: number) => (
                    <div key={i}>
                      <span className="text-black/60 mr-2 uppercase text-[10px]">{tot.label}:</span>
                      <span className="text-black">{tot.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Signatory Footer */}
          <div className="pt-12 border-t border-black/20 flex justify-between items-end text-xs font-mono">
            <div>
              <p className="text-[11px] text-black/50">Goods dispatched in sound condition.</p>
              <div className="mt-8 font-semibold text-black">Customer / Receiver Signature</div>
            </div>

            <div className="text-right">
              <div className="font-bold text-black uppercase font-serif">For Bluemoon Packing Solutions</div>
              <div className="mt-10 font-semibold text-black">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
