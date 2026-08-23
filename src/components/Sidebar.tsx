import React from 'react';
import { useAuth } from '../context/AuthContext';
import { COMPANY_INFO } from '../services/db';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Factory,
  PackageCheck,
  TrendingUp,
  BookOpen,
  SlidersHorizontal,
  FileBarChart,
  Database,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  X,
  Boxes,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  isOpen?: boolean;
  isOpenMobile?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  isOpen,
  isOpenMobile,
  onClose,
  onCloseMobile,
}) => {
  const { currentUser, logout, hasPermission } = useAuth();

  const isDrawerOpen = isOpen ?? isOpenMobile ?? false;
  const handleClose = onClose || onCloseMobile || (() => {});
  const handleSelect = (id: string) => {
    if (setActiveTab) setActiveTab(id);
    if (onSelectTab) onSelectTab(id);
    handleClose();
  };

  const navigationItems = [
    {
      id: 'dashboard',
      num: '01',
      label: 'Dashboard',
      icon: LayoutDashboard,
      module: 'dashboard',
    },
    {
      id: 'purchases',
      num: '02',
      label: 'Inward Purchases',
      icon: ShoppingCart,
      module: 'purchases',
      badge: 'Rolls',
    },
    {
      id: 'raw-materials',
      num: '03',
      label: 'Raw Material Stock',
      icon: Layers,
      module: 'raw-materials',
    },
    {
      id: 'production',
      num: '04',
      label: 'Production & Slitting',
      icon: Factory,
      module: 'production',
      badge: 'Jobs',
    },
    {
      id: 'finished-goods',
      num: '05',
      label: 'Finished Goods',
      icon: PackageCheck,
      module: 'finished-goods',
    },
    {
      id: 'sales',
      num: '06',
      label: 'Sales & Dispatches',
      icon: TrendingUp,
      module: 'sales',
      badge: 'Billing',
    },
    {
      id: 'ledger',
      num: '07',
      label: 'Stock Ledger',
      icon: BookOpen,
      module: 'ledger',
    },
    {
      id: 'adjustments',
      num: '08',
      label: 'Physical Count Audit',
      icon: SlidersHorizontal,
      module: 'adjustments',
      adminOnly: true,
    },
    {
      id: 'reports',
      num: '09',
      label: 'Statements & Reports',
      icon: FileBarChart,
      module: 'reports',
    },
    {
      id: 'masters',
      num: '10',
      label: 'Master Registry',
      icon: Database,
      module: 'masters',
    },
    {
      id: 'users',
      num: '11',
      label: 'Access & Users',
      icon: Users,
      module: 'users',
      adminOnly: true,
    },
    {
      id: 'settings',
      num: '12',
      label: 'System & Backup',
      icon: Settings,
      module: 'settings',
      adminOnly: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-[#F4F4F1] border-r border-black/10 flex flex-col transition-transform duration-300 ease-in-out font-sans ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Editorial Brand Header */}
        <div className="p-6 border-b border-black/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40 mb-1">
              Industrial Utility
            </div>
            <h1 className="font-serif text-lg font-bold text-[#121212] tracking-tight leading-none">
              Bluemoon Packing
            </h1>
          </div>
          <button
            onClick={handleClose}
            className="p-1 border border-black/15 bg-white text-black hover:bg-black hover:text-white lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plant Facility Banner */}
        <div className="px-6 py-2.5 bg-white/40 border-b border-black/10">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-black/60 font-semibold">
            <span>Plant Kangayam</span>
            <span className="font-mono text-black/40">TN-638111</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="px-2 pt-2 pb-2 text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-black/40">
            System Modules
          </div>

          {navigationItems.map((item) => {
            const isAllowed = item.adminOnly
              ? currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin'
              : hasPermission(item.module);

            if (!isAllowed) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'masters' && activeTab === 'master-data');

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-all border ${
                  isActive
                    ? 'bg-[#121212] text-white border-[#121212] font-semibold shadow-xs'
                    : 'bg-transparent text-black/80 border-transparent hover:border-black/15 hover:bg-white/70 hover:text-black'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`font-mono text-[10px] ${isActive ? 'text-white/60' : 'text-black/40'}`}>
                    {item.num}
                  </span>
                  <span className="tracking-tight text-[12px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 font-mono uppercase tracking-wider border ${
                      isActive
                        ? 'border-white/30 text-white/90 bg-white/10'
                        : 'border-black/15 text-black/60 bg-white/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Editorial Plant Quote / Status Card */}
        <div className="p-4 border-t border-black/10 bg-white/60">
          <div className="p-3 bg-black text-white mb-3">
            <div className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1">
              Facility Status
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span>Slitter Units: ONLINE</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <div className="font-semibold text-black truncate max-w-[130px] text-[11px]">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-black/50 font-mono">{currentUser?.role}</div>
            </div>
            <button
              onClick={logout}
              className="px-2 py-1 border border-black/20 hover:bg-black hover:text-white text-black transition-colors text-[10px] uppercase tracking-wider font-semibold"
              title="Logout session"
            >
              Exit
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
