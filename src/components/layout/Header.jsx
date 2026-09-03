import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ShieldCheck, Menu, Info, AlertTriangle, X, LogOut, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Header = ({ pageTitle, activeTab, onGlobalSearchSelect, isMobileOpen, setIsMobileOpen }) => {
  const { notifications, currentUser, logoutUser, markNotificationsRead, indents } = useStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfilePopover(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const filtered = indents.filter(
      (item) =>
        item.id.toLowerCase().includes(query.toLowerCase()) ||
        item.productName.toLowerCase().includes(query.toLowerCase()) ||
        item.department.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 5));
    setShowSearchDropdown(true);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Title & Mobile Hamburger Button */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Toggle for Mobile & Tablet */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
          {pageTitle}
        </h2>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search Bar (HIDDEN ON MOBILE, VISIBLE ON SM+) */}
        <div className="hidden sm:block relative" ref={searchRef}>
          <div className="relative w-48 sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Global Search (ID, Product...)"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-2 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                Matching Indents
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onGlobalSearchSelect(item);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate mt-0.5">{item.productName}</p>
                    <p className="text-[11px] text-slate-500">{item.department}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs) markNotificationsRead();
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Panel */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold">Notifications Center</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {notifications.length} Total
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3.5 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                    <div className="flex items-start gap-2.5">
                      {n.type === 'approval' ? (
                        <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      ) : n.type === 'delay' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Popover Card */}
        {currentUser && (
          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setShowProfilePopover(!showProfilePopover)}
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 cursor-pointer group select-none"
            >
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
                  {currentUser.name}
                </p>
                <span className="inline-block px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold rounded mt-0.5 capitalize">
                  {currentUser.role}
                </span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 group-hover:bg-teal-600 transition-colors">
                {currentUser.avatar || (currentUser.name ? currentUser.name[0].toUpperCase() : 'U')}
              </div>
            </div>

            {/* Profile Popover Modal */}
            {showProfilePopover && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in text-xs">
                <div className="p-4 bg-slate-900 text-white space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                      {currentUser.avatar || (currentUser.name ? currentUser.name[0].toUpperCase() : 'U')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{currentUser.name}</p>
                      <span className="inline-block px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-semibold capitalize border border-teal-400/30">
                        {currentUser.role || 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-2 text-slate-700 border-b border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Username:</span>
                    <span className="font-bold text-slate-900 font-mono">{currentUser.username}</span>
                  </div>
                  {currentUser.department && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Department:</span>
                      <span className="font-bold text-slate-900">{currentUser.department}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Page Access:</span>
                    <span className="font-bold text-purple-700">{currentUser.pageAccess || 'ALL'}</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-50">
                  <button
                    onClick={() => {
                      setShowProfilePopover(false);
                      logoutUser();
                    }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
