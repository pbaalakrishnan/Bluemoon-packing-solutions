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
import { LoginPage } from './components/LoginPage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F4F1] flex items-center justify-center p-6 text-[#121212] font-sans">
          <div className="max-w-md w-full bg-white border border-black/20 p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-black">Something went wrong</h2>
            <p className="text-xs text-black/70">
              An unexpected error occurred in the workspace interface.
            </p>
            <div className="p-3 bg-[#F8F8F5] border border-black/10 text-[11px] font-mono text-rose-800 break-words">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2 bg-black text-white text-xs font-mono uppercase tracking-wider font-semibold"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainWorkspace: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Universal print modal state
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

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainWorkspace key={currentUser.id || currentUser.email} />;
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
