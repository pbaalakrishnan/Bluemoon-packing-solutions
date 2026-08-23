import React, { useState } from 'react';
import { dbService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const MastersModule: React.FC = () => {
  const { currentUser } = useAuth();
  const state = dbService.getState();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'buyers'>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');

  // Supplier Form
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supGst, setSupGst] = useState('');

  // Buyer Form
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [buyName, setBuyName] = useState('');
  const [buyContact, setBuyContact] = useState('');
  const [buyPhone, setBuyPhone] = useState('');
  const [buyEmail, setBuyEmail] = useState('');
  const [buyAddress, setBuyAddress] = useState('');
  const [buyGst, setBuyGst] = useState('');

  const [notification, setNotification] = useState<string | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<{
    type: 'supplier' | 'buyer';
    id: string;
    name: string;
  } | null>(null);

  const handleDeleteEntity = () => {
    if (!entityToDelete) return;
    const userEmail = currentUser?.email || 'admin@bluemoon.in';

    if (entityToDelete.type === 'supplier') {
      const res = dbService.deleteSupplier(entityToDelete.id, userEmail);
      if (res.success) {
        setNotification(`Supplier "${entityToDelete.name}" deleted successfully.`);
      } else {
        alert(res.error || 'Failed to delete supplier.');
      }
    } else {
      const res = dbService.deleteBuyer(entityToDelete.id, userEmail);
      if (res.success) {
        setNotification(`Buyer / Customer "${entityToDelete.name}" deleted successfully.`);
      } else {
        alert(res.error || 'Failed to delete buyer.');
      }
    }

    setEntityToDelete(null);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    dbService.addSupplier({
      name: supName.trim(),
      contactPerson: supContact.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim(),
      address: supAddress.trim(),
      gstNumber: supGst.trim(),
      status: 'Active',
    });

    setNotification(`Supplier "${supName}" registered successfully!`);
    setShowSupplierModal(false);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupGst('');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyName.trim()) return;

    dbService.addBuyer({
      name: buyName.trim(),
      contactPerson: buyContact.trim(),
      phone: buyPhone.trim(),
      email: buyEmail.trim(),
      address: buyAddress.trim(),
      gstNumber: buyGst.trim(),
      status: 'Active',
    });

    setNotification(`Buyer "${buyName}" registered successfully!`);
    setShowBuyerModal(false);
    setBuyName('');
    setBuyContact('');
    setBuyPhone('');
    setBuyEmail('');
    setBuyAddress('');
    setBuyGst('');
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredSuppliers = state.suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery),
  );

  const filteredBuyers = state.buyers.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery),
  );

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Header */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            10 / Directory & Master Ledgers
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            Suppliers & Buyers Directory.
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Maintain authorized vendor and customer accounts with GSTIN and contact profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'suppliers' ? (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Supplier</span>
            </button>
          ) : (
            <button
              onClick={() => setShowBuyerModal(true)}
              className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Buyer</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-black/15 space-x-3 font-mono">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center space-x-2 px-3 py-2 text-xs uppercase tracking-wider transition-all ${
            activeTab === 'suppliers'
              ? 'border-b-2 border-black font-bold text-black'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Suppliers ({state.suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('buyers')}
          className={`flex items-center space-x-2 px-3 py-2 text-xs uppercase tracking-wider transition-all ${
            activeTab === 'buyers'
              ? 'border-b-2 border-black font-bold text-black'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customers / Buyers ({state.buyers.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="border border-black/15 bg-white p-4 flex items-center">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'suppliers' ? 'suppliers' : 'buyers'} by name, contact, phone...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#F8F8F5] border border-black/15 text-xs text-black placeholder-black/40 focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* SUPPLIERS LIST */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="border border-black/15 bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-black">{sup.name}</h3>
                  <p className="text-[11px] text-black/60 font-medium">{sup.contactPerson}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase border border-black/20 bg-[#F4F4F1]">
                    {sup.status}
                  </span>
                  <button
                    onClick={() =>
                      setEntityToDelete({
                        type: 'supplier',
                        id: sup.id,
                        name: sup.name,
                      })
                    }
                    className="p-1 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/40 transition-colors"
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-black/70 pt-2 border-t border-black/10">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-black/40" />
                  <span className="font-mono text-[11px]">{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-black/40" />
                  <span>{sup.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-black/40 mt-0.5 shrink-0" />
                  <span className="text-black/60">{sup.address}</span>
                </div>
                {sup.gstNumber && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-black font-semibold pt-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>GST: {sup.gstNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUYERS LIST */}
      {activeTab === 'buyers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuyers.map((buy) => (
            <div
              key={buy.id}
              className="border border-black/15 bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-black">{buy.name}</h3>
                  <p className="text-[11px] text-black/60 font-medium">{buy.contactPerson}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase border border-black/20 bg-[#F4F4F1]">
                    {buy.status}
                  </span>
                  <button
                    onClick={() =>
                      setEntityToDelete({
                        type: 'buyer',
                        id: buy.id,
                        name: buy.name,
                      })
                    }
                    className="p-1 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/40 transition-colors"
                    title="Delete Buyer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-black/70 pt-2 border-t border-black/10">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-black/40" />
                  <span className="font-mono text-[11px]">{buy.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-black/40" />
                  <span>{buy.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-black/40 mt-0.5 shrink-0" />
                  <span className="text-black/60">{buy.address}</span>
                </div>
                {buy.gstNumber && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-black font-semibold pt-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>GST: {buy.gstNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <Building2 className="w-4 h-4 text-black" />
              Add Raw Material Supplier
            </h2>
            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-black mb-1 font-semibold">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-black mb-1 font-semibold">Contact Person</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-black mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-black mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-black mb-1 font-semibold">GSTIN Number</label>
                <input
                  type="text"
                  value={supGst}
                  onChange={(e) => setSupGst(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black uppercase font-mono focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-black mb-1 font-semibold">Factory / Office Address</label>
                <textarea
                  rows={2}
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <div className="pt-3 border-t border-black/15 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-black/20 text-black text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BUYER MODAL */}
      {showBuyerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <Users className="w-4 h-4 text-black" />
              Add Customer / Buyer
            </h2>
            <form onSubmit={handleCreateBuyer} className="space-y-3 text-xs">
              <div>
                <label className="block text-black mb-1 font-semibold">Buyer / Company Name *</label>
                <input
                  type="text"
                  required
                  value={buyName}
                  onChange={(e) => setBuyName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-black mb-1 font-semibold">Contact Person</label>
                  <input
                    type="text"
                    value={buyContact}
                    onChange={(e) => setBuyContact(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-black mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={buyPhone}
                    onChange={(e) => setBuyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-black mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={buyEmail}
                  onChange={(e) => setBuyEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-black mb-1 font-semibold">GSTIN Number</label>
                <input
                  type="text"
                  value={buyGst}
                  onChange={(e) => setBuyGst(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black uppercase font-mono focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-black mb-1 font-semibold">Delivery / Billing Address</label>
                <textarea
                  rows={2}
                  value={buyAddress}
                  onChange={(e) => setBuyAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <div className="pt-3 border-t border-black/15 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBuyerModal(false)}
                  className="px-4 py-2 border border-black/20 text-black text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Save Buyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MASTER RECORD CONFIRMATION MODAL */}
      {entityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-black/15 pb-3">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-black">
                  Delete {entityToDelete.type === 'supplier' ? 'Supplier' : 'Customer / Buyer'}
                </h3>
                <p className="text-xs text-black/60">This permanently removes the master record from the system.</p>
              </div>
            </div>

            <div className="bg-[#F8F8F5] border border-black/10 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-black">{entityToDelete.name}</div>
              <div className="text-black/60 text-[11px]">ID: {entityToDelete.id}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setEntityToDelete(null)}
                className="px-4 py-2 border border-black/20 bg-white hover:bg-[#F4F4F1] text-xs font-mono uppercase font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEntity}
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
