import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { COMPANY_INFO, dbService } from '../services/db';
import {
  Menu,
  X,
  Bell,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAlerts?: () => void;
  activeModule?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenAlerts,
  activeModule,
}) => {
  const { currentUser, switchUserRole, logout } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const alerts = dbService.getDashboardAlerts();
  const alertCount = alerts.filter((a) => a.type === 'danger' || a.type === 'warning').length;

  const rolesList: Role[] = [
    'Admin',
    'Inventory User',
    'Production User',
    'Sales User',
    'Viewer',
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#F4F4F1]/95 backdrop-blur border-b border-black/10 text-[#121212] transition-colors">
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Mobile Toggle & Editorial Brand */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 border border-black/15 bg-white text-[#121212] hover:bg-black hover:text-white lg:hidden transition-colors rounded-none"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-baseline space-x-3">
            <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-serif font-black text-sm tracking-tight">
              B
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#121212]">
                  {COMPANY_INFO.name}
                </span>
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-semibold text-black/50 hidden sm:inline">
                  ERP SUITE // PRODUCTION READY
                </span>
              </div>
              <p className="hidden xl:block text-[11px] font-sans text-black/60 tracking-normal truncate max-w-xl">
                {COMPANY_INFO.address}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Role Selector & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Low Stock Alerts Icon */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="relative p-2 border border-black/15 bg-white hover:bg-black hover:text-white text-[#121212] transition-colors"
              title="View Stock & Production Alerts"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white">
                  {alertCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-black/15 hover:border-black/30 text-xs font-sans text-[#121212] transition-colors"
              title="Switch role"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-black/70" />
              <span className="hidden md:inline text-black/50 uppercase tracking-widest text-[10px]">Role:</span>
              <span className="font-semibold text-[#121212] text-[11px]">
                {currentUser?.role || 'Guest'}
              </span>
              <ChevronDown className="w-3 h-3 text-black/50" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-black/20 shadow-xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-black/50 border-b border-black/10">
                  Switch Active Role
                </div>
                {rolesList.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchUserRole(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-sans flex items-center justify-between hover:bg-[#F4F4F1] transition-colors ${
                      currentUser?.role === r
                        ? 'font-bold bg-[#ECECE8] text-black'
                        : 'text-black/80'
                    }`}
                  >
                    <span>{r}</span>
                    {currentUser?.role === r && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Avatar & Logout */}
          <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-black/10">
            <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-mono font-bold">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left text-xs font-sans">
              <div className="font-semibold text-[#121212] truncate max-w-[120px]">
                {currentUser?.name || 'Balakrishnan P'}
              </div>
              <div className="text-[10px] text-black/50 font-mono">
                {currentUser?.email || 'admin@bluemoon.in'}
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out of Bluemoon ERP?')) {
                  logout();
                }
              }}
              className="p-1.5 border border-black/15 bg-white hover:bg-rose-50 hover:text-rose-600 text-black/60 transition-colors ml-1"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
