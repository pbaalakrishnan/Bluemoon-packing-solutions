import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PurchaseModule } from './components/PurchaseModule';
import { RawMaterialInventory } from './components/RawMaterialInventory';
import { ProductionModule } from './components/ProductionModule';
import { FinishedGoodsModule } from './components/FinishedGoodsModule';
import { SalesModule } from './components/SalesModule';
import { InventoryLedger } from './components/InventoryLedger';
import { InventoryAdjustment } from './components/InventoryAdjustment';
import { ReportsModule } from './components/ReportsModule';
import { MastersModule } from './components/MastersModule';
import { UserManagementModule } from './components/UserManagementModule';
import { SettingsModule } from './components/SettingsModule';
import { PrintModal } from './components/PrintModal';

const MainLayout: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Print modal state
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
    type: 'purchase' | 'job' | 'sale' | 'report';
  }>({
    isOpen: false,
    title: '',
    data: null,
    type: 'report',
  });

  const handleOpenPrintModal = (
    title: string,
    data: any,
    type: 'purchase' | 'job' | 'sale' | 'report',
  ) => {
    setPrintModalState({
      isOpen: true,
      title,
      data,
      type,
    });
  };

  const handleClosePrintModal = () => {
    setPrintModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'purchases':
        return <PurchaseModule onOpenPrintModal={handleOpenPrintModal} />;
      case 'raw-materials':
        return <RawMaterialInventory onOpenPrintModal={handleOpenPrintModal} />;
      case 'production':
        return <ProductionModule onOpenPrintModal={handleOpenPrintModal} />;
      case 'finished-goods':
        return <FinishedGoodsModule onOpenPrintModal={handleOpenPrintModal} />;
      case 'sales':
        return <SalesModule onOpenPrintModal={handleOpenPrintModal} />;
      case 'ledger':
        return <InventoryLedger />;
      case 'adjustments':
        return <InventoryAdjustment />;
      case 'reports':
        return <ReportsModule onOpenPrintModal={handleOpenPrintModal} />;
      case 'masters':
        return <MastersModule />;
      case 'users':
        return <UserManagementModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#121212] flex flex-col font-sans selection:bg-[#121212] selection:text-white">
      {/* Top Editorial Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenTestRunner={() => setActiveTab('settings')}
        onOpenAlerts={() => setActiveTab('dashboard')}
        activeModule={activeTab}
      />

      {/* Main Workspace with Editorial Border Divider */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">{renderActiveModule()}</div>
        </main>
      </div>

      {/* Universal Print Modal */}
      <PrintModal
        isOpen={printModalState.isOpen}
        onClose={handleClosePrintModal}
        title={printModalState.title}
        data={printModalState.data}
        type={printModalState.type}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
