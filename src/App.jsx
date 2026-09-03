import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastNotification } from './components/common/ToastNotification';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CreateIndentPage } from './pages/CreateIndentPage';
import { ProcessSelectionPage } from './pages/ProcessSelectionPage';
import { AllIndentsPage } from './pages/AllIndentsPage';
import { IndentDetailPage } from './pages/IndentDetailPage';
import { PendingProcessesPage } from './pages/PendingProcessesPage';
import { VendorManagementPage } from './pages/VendorManagementPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { GeneratePOPage } from './pages/GeneratePOPage';
import { StoreInPage } from './pages/StoreInPage';
import { StoreOutPage } from './pages/StoreOutPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

function AppContent() {
  const { currentUser, selectProcess, hasPageAccess } = useStore();

  // Persist current active tab across browser refreshes
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('store_purchase_active_tab');
    return saved || 'dashboard';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedIndentForDetail, setSelectedIndentForDetail] = useState(null);
  const [selectedIndentForProcess, setSelectedIndentForProcess] = useState(null);
  const [initialVendorItem, setInitialVendorItem] = useState(null);

  // Sync activeTab to localStorage
  React.useEffect(() => {
    if (activeTab) {
      localStorage.setItem('store_purchase_active_tab', activeTab);
    }
  }, [activeTab]);

  // Auto-redirect to first accessible page if current activeTab is not allowed for user
  React.useEffect(() => {
    if (currentUser) {
      if (!hasPageAccess(activeTab)) {
        const allTabs = [
          'dashboard', 'create-indent', 'all-indents', 'pending-processes',
          'vendor-management', 'approval-queue', 'generate-po', 'store-in',
          'store-out', 'settings'
        ];
        const firstAllowed = allTabs.find((t) => hasPageAccess(t));
        if (firstAllowed) {
          setActiveTab(firstAllowed);
          localStorage.setItem('store_purchase_active_tab', firstAllowed);
        }
      }
    }
  }, [currentUser, activeTab, hasPageAccess]);

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('store_purchase_active_tab', tabId);
    setInitialVendorItem(null);
  };

  const handleIndentCreated = (indentRecord) => {
    setActiveTab('all-indents');
  };

  const handleSelectProcess = (indent, processTypePayload) => {
    const indentId = typeof indent === 'object' ? indent.id : indent;
    selectProcess(indentId, processTypePayload);

    let processTypeStr = 'Regular Vendor';
    if (typeof processTypePayload === 'string') {
      processTypeStr = processTypePayload;
    } else if (Array.isArray(processTypePayload) && processTypePayload.length > 0) {
      processTypeStr = typeof processTypePayload[0] === 'string'
        ? processTypePayload[0]
        : (processTypePayload[0].processType || 'Regular Vendor');
    } else if (processTypePayload && typeof processTypePayload === 'object') {
      processTypeStr = processTypePayload.processType || 'Regular Vendor';
    }

    const baseObj = typeof indent === 'object' ? indent : { id: indentId };
    setInitialVendorItem({ ...baseObj, processType: processTypeStr, processTypeSelected: true });
    setActiveTab('vendor-management');
  };

  const handleViewIndentDetail = (indent) => {
    setSelectedIndentForDetail(indent);
    setActiveTab('indent-detail');
  };

  const handleProcessItem = (indent) => {
    setSelectedIndentForProcess(indent);
    setActiveTab('select-process');
  };

  const handleGlobalSearchSelect = (indent) => {
    setSelectedIndentForDetail(indent);
    setActiveTab('indent-detail');
  };

  const pageTitleMap = {
    dashboard: 'Procurement Dashboard',
    'create-indent': 'Create New Indent',
    'select-process': 'Process Selection Form',
    'all-indents': 'All Purchase Indents',
    'pending-processes': 'Pending Processes Queue',
    'vendor-management': 'Vendor Management & Quotation Workspace',
    'regular-vendor': 'Vendor Management (Regular Vendor)',
    'need-more-vendor': 'Vendor Management (Multi-Bids)',
    'approval-queue': 'Approval Queue & History',
    'generate-po': 'Generate Purchase Order (PO)',
    history: 'Purchase History Log',
    analytics: 'Procurement Analytics',
    users: 'User Access Management',
    settings: 'System & Workflow Settings',
    'indent-detail': `Indent Details (${selectedIndentForDetail?.id || ''})`
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          pageTitle={pageTitleMap[activeTab] || 'Purchase Indent System'}
          activeTab={activeTab}
          onGlobalSearchSelect={handleGlobalSearchSelect}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Viewport Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} onViewIndentDetail={handleViewIndentDetail} />
          )}

          {activeTab === 'create-indent' && (
            <CreateIndentPage onNavigate={handleNavigate} onIndentCreated={handleIndentCreated} />
          )}

          {activeTab === 'select-process' && (
            <ProcessSelectionPage
              indent={selectedIndentForProcess}
              onSelectProcess={handleSelectProcess}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'all-indents' && (
            <AllIndentsPage onNavigate={handleNavigate} onViewIndentDetail={handleViewIndentDetail} />
          )}

          {activeTab === 'indent-detail' && (
            <IndentDetailPage
              indent={selectedIndentForDetail}
              onBack={() => handleNavigate('all-indents')}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'pending-processes' && (
            <PendingProcessesPage onNavigate={handleNavigate} onProcessItem={handleProcessItem} />
          )}

          {activeTab === 'vendor-management' && (
            <VendorManagementPage initialOpenItem={initialVendorItem} defaultCategory="All" />
          )}

          {activeTab === 'regular-vendor' && (
            <VendorManagementPage initialOpenItem={initialVendorItem} defaultCategory="Regular Vendor" />
          )}

          {activeTab === 'need-more-vendor' && (
            <VendorManagementPage initialOpenItem={initialVendorItem} defaultCategory="Need More Vendor" />
          )}

          {activeTab === 'approval-queue' && <ApprovalQueuePage />}

          {activeTab === 'generate-po' && <GeneratePOPage />}

          {activeTab === 'store-in' && <StoreInPage />}

          {activeTab === 'store-out' && <StoreOutPage />}

          {activeTab === 'history' && <HistoryPage onViewIndentDetail={handleViewIndentDetail} />}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastNotification />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
