import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
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

// Helper map for legacy page IDs to URL paths
const routeMap = {
  dashboard: '/',
  'create-indent': '/create-indent',
  'all-indents': '/all-indents',
  'pending-processes': '/pending-processes',
  'vendor-management': '/vendor-management',
  'regular-vendor': '/regular-vendor',
  'need-more-vendor': '/need-more-vendor',
  'approval-queue': '/approval-queue',
  'generate-po': '/generate-po',
  'store-in': '/store-in',
  'store-out': '/store-out',
  'history': '/history',
  'analytics': '/analytics',
  'settings': '/settings',
  'select-process': '/select-process',
  'indent-detail': '/indent-detail'
};

// Route Security Guard Component (Redirects to /login if unauthenticated)
function ProtectedRoute({ pageId, children }) {
  const { currentUser, hasPageAccess } = useStore();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (pageId && !hasPageAccess(pageId)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Main App Layout Wrapper with Header and Sidebar
function AppLayout() {
  const { selectProcess } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedIndentForDetail, setSelectedIndentForDetail] = useState(null);
  const [selectedIndentForProcess, setSelectedIndentForProcess] = useState(null);
  const [initialVendorItem, setInitialVendorItem] = useState(null);

  const handleNavigate = (tabId) => {
    const targetRoute = routeMap[tabId] || (tabId.startsWith('/') ? tabId : `/${tabId}`);
    setInitialVendorItem(null);
    navigate(targetRoute);
  };

  const handleIndentCreated = () => {
    navigate('/all-indents');
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
    navigate('/vendor-management');
  };

  const handleViewIndentDetail = (indent) => {
    setSelectedIndentForDetail(indent);
    navigate('/indent-detail');
  };

  const handleProcessItem = (indent) => {
    setSelectedIndentForProcess(indent);
    navigate('/select-process');
  };

  const handleGlobalSearchSelect = (indent) => {
    setSelectedIndentForDetail(indent);
    navigate('/indent-detail');
  };

  const getPageTitle = (path) => {
    if (path === '/' || path === '/dashboard') return 'Procurement Dashboard';
    if (path === '/create-indent') return 'Create New Indent';
    if (path === '/select-process') return 'Process Selection Form';
    if (path === '/all-indents') return 'All Purchase Indents';
    if (path === '/pending-processes') return 'Pending Processes Queue';
    if (path === '/vendor-management') return 'Vendor Management & Quotation Workspace';
    if (path === '/regular-vendor') return 'Vendor Management (Regular Vendor)';
    if (path === '/need-more-vendor') return 'Vendor Management (Multi-Bids)';
    if (path === '/approval-queue') return 'Approval Queue & History';
    if (path === '/generate-po') return 'Generate Purchase Order (PO)';
    if (path === '/store-in') return 'Store Receiving (Store In)';
    if (path === '/store-out') return 'Store Issue (Store Out)';
    if (path === '/history') return 'Purchase History Log';
    if (path === '/analytics') return 'Procurement Analytics';
    if (path === '/settings') return 'User & System Settings';
    if (path === '/indent-detail') return `Indent Details (${selectedIndentForDetail?.id || ''})`;
    return 'Purchase Indent System';
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          pageTitle={getPageTitle(location.pathname)}
          onGlobalSearchSelect={handleGlobalSearchSelect}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Viewport Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet context={{
            handleNavigate,
            handleIndentCreated,
            handleSelectProcess,
            handleViewIndentDetail,
            handleProcessItem,
            selectedIndentForDetail,
            selectedIndentForProcess,
            initialVendorItem
          }} />
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastNotification />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes Wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={
            <ProtectedRoute pageId="dashboard">
              <DashboardRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute pageId="dashboard">
              <DashboardRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-indent"
          element={
            <ProtectedRoute pageId="create-indent">
              <CreateIndentRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/all-indents"
          element={
            <ProtectedRoute pageId="all-indents">
              <AllIndentsRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/indent-detail"
          element={
            <ProtectedRoute pageId="all-indents">
              <IndentDetailRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-processes"
          element={
            <ProtectedRoute pageId="pending-processes">
              <PendingProcessesRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/select-process"
          element={
            <ProtectedRoute pageId="pending-processes">
              <ProcessSelectionRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor-management"
          element={
            <ProtectedRoute pageId="vendor-management">
              <VendorManagementRoute defaultCategory="All" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/regular-vendor"
          element={
            <ProtectedRoute pageId="vendor-management">
              <VendorManagementRoute defaultCategory="Regular Vendor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/need-more-vendor"
          element={
            <ProtectedRoute pageId="vendor-management">
              <VendorManagementRoute defaultCategory="Need More Vendor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approval-queue"
          element={
            <ProtectedRoute pageId="approval-queue">
              <ApprovalQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate-po"
          element={
            <ProtectedRoute pageId="generate-po">
              <GeneratePOPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store-in"
          element={
            <ProtectedRoute pageId="store-in">
              <StoreInPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store-out"
          element={
            <ProtectedRoute pageId="store-out">
              <StoreOutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute pageId="all-indents">
              <HistoryRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute pageId="dashboard">
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute pageId="settings">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route -> Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// Route Helper Wrappers using Outlet context
import { useOutletContext } from 'react-router-dom';

function DashboardRoute() {
  const { handleNavigate, handleViewIndentDetail } = useOutletContext();
  return <DashboardPage onNavigate={handleNavigate} onViewIndentDetail={handleViewIndentDetail} />;
}

function CreateIndentRoute() {
  const { handleNavigate, handleIndentCreated } = useOutletContext();
  return <CreateIndentPage onNavigate={handleNavigate} onIndentCreated={handleIndentCreated} />;
}

function AllIndentsRoute() {
  const { handleNavigate, handleViewIndentDetail } = useOutletContext();
  return <AllIndentsPage onNavigate={handleNavigate} onViewIndentDetail={handleViewIndentDetail} />;
}

function IndentDetailRoute() {
  const { selectedIndentForDetail, handleNavigate } = useOutletContext();
  return (
    <IndentDetailPage
      indent={selectedIndentForDetail}
      onBack={() => handleNavigate('all-indents')}
      onNavigate={handleNavigate}
    />
  );
}

function PendingProcessesRoute() {
  const { handleNavigate, handleProcessItem } = useOutletContext();
  return <PendingProcessesPage onNavigate={handleNavigate} onProcessItem={handleProcessItem} />;
}

function ProcessSelectionRoute() {
  const { selectedIndentForProcess, handleSelectProcess, handleNavigate } = useOutletContext();
  return (
    <ProcessSelectionPage
      indent={selectedIndentForProcess}
      onSelectProcess={handleSelectProcess}
      onNavigate={handleNavigate}
    />
  );
}

function VendorManagementRoute({ defaultCategory }) {
  const { initialVendorItem } = useOutletContext();
  return <VendorManagementPage initialOpenItem={initialVendorItem} defaultCategory={defaultCategory} />;
}

function HistoryRoute() {
  const { handleViewIndentDetail } = useOutletContext();
  return <HistoryPage onViewIndentDetail={handleViewIndentDetail} />;
}

export default function App() {
  return (
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  );
}
