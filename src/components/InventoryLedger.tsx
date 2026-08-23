import React, { useState } from 'react';
import { dbService } from '../services/db';
import { formatDateTime, formatNumber, exportToCSV } from '../utils/exportUtils';
import {
  BookOpen,
  Search,
  Download,
} from 'lucide-react';

export const InventoryLedger: React.FC = () => {
  const state = dbService.getState();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const transactions = state.inventoryTransactions;

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      tx.materialOrProduct.toLowerCase().includes(q) ||
      tx.referenceNumber.toLowerCase().includes(q) ||
      (tx.itemId && tx.itemId.toLowerCase().includes(q)) ||
      tx.user.toLowerCase().includes(q) ||
      tx.remarks.toLowerCase().includes(q);
    const matchType = typeFilter ? tx.transactionType === typeFilter : true;
    const matchCat = categoryFilter ? tx.category === categoryFilter : true;
    return matchSearch && matchType && matchCat;
  });

  const exportLedgerCSV = () => {
    const headers = [
      'Transaction ID',
      'Timestamp',
      'Type',
      'Category',
      'Material / Product',
      'Reference No',
      'Qty Before',
      'Qty Changed',
      'Qty After',
      'Unit',
      'User',
      'Remarks',
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      formatDateTime(tx.timestamp),
      tx.transactionType,
      tx.category,
      tx.materialOrProduct,
      tx.referenceNumber,
      tx.quantityBefore,
      tx.quantityChanged,
      tx.quantityAfter,
      tx.unit,
      tx.user,
      tx.remarks,
    ]);
    exportToCSV('Inventory_Ledger_Complete', rows, headers, 'Complete Inventory Audit Ledger', 'Auditor');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            07 / Immutable Audit Trace
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Inventory Audit Ledger.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Immutable trace of every purchase, consumption, production output, sale, and stock adjustment.
          </p>
        </div>

        <button
          onClick={exportLedgerCSV}
          className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="border border-black/15 bg-white p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            placeholder="Search Reference, Roll ID, User..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
        >
          <option value="">All Transaction Types</option>
          <option value="Purchase">Purchase (Inward)</option>
          <option value="Production Consumption">Production Consumption (Used)</option>
          <option value="Production Output">Production Output (Produced)</option>
          <option value="Sales">Sales (Dispatched)</option>
          <option value="Inventory Adjustment">Inventory Adjustment</option>
          <option value="Cancellation/Reversal">Cancellation/Reversal</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black focus:outline-none focus:border-black"
        >
          <option value="">All Categories</option>
          <option value="Roll Tape">Roll Tape</option>
          <option value="Paper Core">Paper Core</option>
          <option value="Carton Box">Carton Box</option>
          <option value="Heat Shrink Film">Heat Shrink Film</option>
          <option value="Finished Goods">Finished Goods</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="border border-black/15 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-black divide-y divide-black/10">
            <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Type & Category</th>
                <th className="p-3">Material / Item</th>
                <th className="p-3">Reference No</th>
                <th className="p-3 text-right">Before</th>
                <th className="p-3 text-right">Changed</th>
                <th className="p-3 text-right">After Balance</th>
                <th className="p-3">User</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-black/40 font-serif italic text-base">
                    No transactions matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.quantityChanged > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="p-3 text-black/70 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(tx.timestamp)}
                      </td>
                      <td className="p-3 font-sans">
                        <span className="inline-flex px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border border-black/20 bg-[#F4F4F1] text-black">
                          {tx.transactionType}
                        </span>
                        <div className="text-[10px] text-black/50 mt-0.5 font-mono">{tx.category}</div>
                      </td>
                      <td className="p-3 font-sans font-semibold text-black">
                        {tx.materialOrProduct}
                      </td>
                      <td className="p-3 font-bold font-mono text-black">{tx.referenceNumber}</td>
                      <td className="p-3 text-right text-black/60 text-[11px]">
                        {formatNumber(tx.quantityBefore)} {tx.unit}
                      </td>
                      <td className="p-3 text-right font-bold text-xs font-mono">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                          {isPositive ? '+' : ''}
                          {formatNumber(tx.quantityChanged)} {tx.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-black text-xs font-mono">
                        {formatNumber(tx.quantityAfter)} {tx.unit}
                      </td>
                      <td className="p-3 font-sans text-black/70 text-[11px] truncate max-w-[120px]">
                        {tx.user}
                      </td>
                      <td className="p-3 font-sans text-black/50 text-[11px] max-w-[200px] truncate" title={tx.remarks}>
                        {tx.remarks}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
