import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Boxes,
  Clock,
  Store,
  CheckSquare,
  FileText,
  PackageCheck,
  PackageMinus,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const { currentUser, logoutUser, hasPageAccess } = useStore();

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-indent', label: 'Create Indent', icon: FilePlus },
    { id: 'all-indents', label: 'All Indents', icon: Boxes },
    { id: 'pending-processes', label: 'Pending Processes', icon: Clock },
    { id: 'vendor-management', label: 'Vendor Workspace', icon: Store },
    { id: 'approval-queue', label: 'Approval Queue', icon: CheckSquare },
    { id: 'generate-po', label: 'Generate PO', icon: FileText },
    { id: 'store-in', label: 'Store In', icon: PackageCheck },
    { id: 'store-out', label: 'Store Out', icon: PackageMinus },
    { id: 'settings', label: 'User & System Settings', icon: Settings }
  ];

  // Filter menu items dynamically by user permissions
  const visibleMenuItems = allMenuItems.filter((item) => hasPageAccess(item.id));

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false); // Close mobile drawer automatically when clicking a link
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-[100dvh] max-h-screen shrink-0 border-r border-slate-800 shadow-md transition-transform duration-300 ease-in-out z-50 overflow-hidden ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl'
            : 'fixed lg:sticky inset-y-0 left-0 top-0 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Application Branding Header (Fixed top) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black tracking-wider text-base shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight">Store & Purchase</h2>
              <p className="text-[11px] text-slate-400 font-medium">Management System</p>
            </div>
          </div>

          {/* Close button for Mobile/Tablet drawer */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links (Scrollable middle container) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs border-l-3 border-teal-400 pl-2.5 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            );
          })}
        </div>

        {/* Footer Profile & Logout (ALWAYS FIXED TO BOTTOM) */}
        {currentUser && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 shrink-0 mt-auto">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.avatar || (currentUser.name ? currentUser.name[0].toUpperCase() : 'U')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 truncate capitalize">{currentUser.role || 'User'}</p>
                </div>
              </div>
              <button
                onClick={logoutUser}
                title="Logout Session"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
