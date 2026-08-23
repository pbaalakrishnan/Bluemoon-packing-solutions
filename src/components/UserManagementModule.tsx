import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { UserRole } from '../types';
import { formatDateTime } from '../utils/exportUtils';
import {
  Shield,
  UserPlus,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const UserManagementModule: React.FC = () => {
  const { currentUser, switchUser } = useAuth();
  const state = dbService.getState();

  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Production Manager');
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    dbService.addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'Active',
    });

    setNotification(`User account for ${name} (${role}) created successfully!`);
    setShowAddModal(false);
    setName('');
    setEmail('');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleStatus = (userId: string, currentStatus?: 'Active' | 'Suspended' | 'Inactive') => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    dbService.updateUserStatus(userId, newStatus);
    setNotification(`User status changed to ${newStatus}.`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    if (state.users.length <= 1) {
      alert('Cannot delete the only remaining user account.');
      setUserToDelete(null);
      return;
    }
    const adminEmail = currentUser?.email || 'admin@bluemoon.in';
    const res = dbService.deleteUser(userToDelete.id, adminEmail);
    if (res.success) {
      setNotification(`User account "${userToDelete.name}" deleted.`);
    } else {
      alert(res.error || 'Failed to delete user.');
    }
    setUserToDelete(null);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#121212]">
      {/* Top Banner */}
      <div className="border-b border-black/15 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
            11 / Access Control & Authentication
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            User Accounts & Security (RBAC).
          </h1>
          <p className="text-xs sm:text-sm text-black/60 mt-1">
            Define system roles: Super Admin, Admin, Production Manager, Inventory Manager, Sales Manager, Viewer.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision New User</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 border border-black/15 bg-white text-black text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Role Definitions Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 border border-black/15 bg-white space-y-1">
          <div className="font-bold text-black flex items-center gap-1.5 font-mono uppercase text-[11px]">
            <Shield className="w-3.5 h-3.5 text-black" />
            Admin / Super Admin
          </div>
          <p className="text-black/60 text-[11px]">
            Full permissions: Purchase inward, Production jobs, Sales billing, Inventory adjustments, and Reversals.
          </p>
        </div>

        <div className="p-4 border border-black/15 bg-white space-y-1">
          <div className="font-bold text-black flex items-center gap-1.5 font-mono uppercase text-[11px]">
            <Shield className="w-3.5 h-3.5 text-black" />
            Production & Inventory
          </div>
          <p className="text-black/60 text-[11px]">
            Execute slitting production jobs, record raw material purchases, view stock balances and ledger.
          </p>
        </div>

        <div className="p-4 border border-black/15 bg-white space-y-1">
          <div className="font-bold text-black flex items-center gap-1.5 font-mono uppercase text-[11px]">
            <Shield className="w-3.5 h-3.5 text-black" />
            Sales Manager & Viewer
          </div>
          <p className="text-black/60 text-[11px]">
            Create sale orders, generate dispatch invoices, and inspect stock availability.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-black/15 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-black divide-y divide-black/10">
            <thead className="bg-[#F8F8F5] text-black/60 font-mono font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">User Name & Email</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Last Active</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {state.users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-black flex items-center gap-2">
                      {u.name}
                      {currentUser?.id === u.id && (
                        <span className="px-1.5 py-0.5 border border-black/20 bg-[#F4F4F1] font-mono text-[9px] uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-black/50 text-[11px] font-mono">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-black/20 bg-[#F4F4F1] text-black">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-black/70 font-mono text-[11px]">{formatDateTime(u.createdAt)}</td>
                  <td className="p-3 text-black/50 font-mono text-[11px]">
                    {formatDateTime(u.lastLogin)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-black/20 bg-[#F4F4F1]">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => switchUser(u.id)}
                        className="px-2.5 py-1 border border-black/20 bg-white hover:bg-black hover:text-white text-black text-[10px] font-mono uppercase tracking-wider transition-colors"
                        title="Switch active user session"
                      >
                        Set Active
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                          u.status === 'Active'
                            ? 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
                            : 'border-black/20 bg-white text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      {currentUser?.id !== u.id && (
                        <button
                          onClick={() =>
                            setUserToDelete({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                            })
                          }
                          className="p-1 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-black/40 transition-colors"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="font-serif text-lg font-bold text-black flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-black" />
              Provision New User Account
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-black mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Karthikeyan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-black mb-1 font-semibold">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. karthik@bluemoonpacking.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-black mb-1 font-semibold">System Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-black/20 text-xs text-black focus:outline-none focus:border-black font-semibold"
                >
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Production Manager">Production Manager (Jobs & Consumption)</option>
                  <option value="Inventory Manager">Inventory Manager (Purchases & Ledger)</option>
                  <option value="Sales Manager">Sales Manager (Billing & Dispatch)</option>
                  <option value="Viewer">Viewer (Read-Only Reports)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/15 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-black/20 text-black text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-wider font-semibold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-black/20 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-black/15 pb-3">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-black">
                  Delete User Account
                </h3>
                <p className="text-xs text-black/60">This permanently removes user login credentials.</p>
              </div>
            </div>

            <div className="bg-[#F8F8F5] border border-black/10 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-black">{userToDelete.name}</div>
              <div className="text-black/60 font-mono text-[11px]">{userToDelete.email}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-black/20 bg-white hover:bg-[#F4F4F1] text-xs font-mono uppercase font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
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
