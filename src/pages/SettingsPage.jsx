import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Layers,
  Settings
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { apiService } from '../services/api';
import { useStore } from '../context/StoreContext';

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'create-indent', label: 'Create Indent' },
  { id: 'all-indents', label: 'All Indents' },
  { id: 'pending-processes', label: 'Pending Processes' },
  { id: 'vendor-management', label: 'Vendor Workspace' },
  { id: 'approval-queue', label: 'Approval Queue' },
  { id: 'generate-po', label: 'Generate PO' },
  { id: 'store-in', label: 'Store In' },
  { id: 'store-out', label: 'Store Out' },
  { id: 'settings', label: 'User & System Settings' }
];

export const SettingsPage = () => {
  const { addToast } = useStore();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Delete Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    username: '',
    password: '',
    role: 'user',
    status: 'Active',
    accessType: 'ALL', // 'ALL' or 'CUSTOM'
    selectedPages: ['create-indent', 'all-indents', 'pending-processes', 'vendor-management']
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiService.getLoginCredentials();
      if (res && res.status === 'success' && Array.isArray(res.users)) {
        setUsersList(res.users);
      } else {
        setUsersList([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast('Error', 'Failed to load user credentials from Google Sheet', 'error');
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    // Generate next employee ID
    let maxId = 0;
    usersList.forEach((u) => {
      const n = parseInt(u.employeeId, 10);
      if (!isNaN(n)) maxId = Math.max(maxId, n);
    });

    setFormData({
      employeeId: String(maxId + 1),
      name: '',
      username: '',
      password: '',
      role: 'user',
      status: 'Active',
      accessType: 'CUSTOM',
      selectedPages: ['create-indent', 'all-indents', 'pending-processes', 'vendor-management']
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    const isAll = user.pageAccess === 'ALL';
    const pagesArray = isAll
      ? AVAILABLE_PAGES.map((p) => p.id)
      : String(user.pageAccess || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    setFormData({
      employeeId: user.employeeId || '',
      name: user.name || '',
      username: user.username || '',
      password: user.password || '',
      role: user.role || 'user',
      status: user.status || 'Active',
      accessType: isAll ? 'ALL' : 'CUSTOM',
      selectedPages: pagesArray
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handlePageCheckboxChange = (pageId) => {
    setFormData((prev) => {
      const currentPages = prev.selectedPages;
      if (currentPages.includes(pageId)) {
        return { ...prev, selectedPages: currentPages.filter((id) => id !== pageId) };
      } else {
        return { ...prev, selectedPages: [...currentPages, pageId] };
      }
    });
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      addToast('Missing Fields', 'Please fill in Name, Username, and Password.', 'error');
      return;
    }

    let finalPageAccess = 'ALL';
    if (formData.accessType === 'CUSTOM') {
      if (formData.selectedPages.length === 0) {
        addToast('Page Access Required', 'Please select at least 1 page for custom access.', 'error');
        return;
      }
      finalPageAccess = formData.selectedPages.join(',');
    }

    setSubmitting(true);

    const payload = {
      employeeId: formData.employeeId,
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim(),
      role: formData.role,
      status: formData.status,
      pageAccess: finalPageAccess
    };

    try {
      const res = await apiService.saveUserCredential(payload);
      if (res && res.status === 'success') {
        addToast(
          modalMode === 'add' ? 'User Created' : 'User Updated',
          `Successfully saved user ${payload.username} (${payload.name})`,
          'success'
        );
        setIsModalOpen(false);
        fetchUsers();
      } else {
        addToast('Error', res?.message || 'Failed to save user in Google Sheet', 'error');
      }
    } catch (err) {
      console.error('Error saving user credential:', err);
      addToast('Error', 'Network or server error while saving user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setSubmitting(true);

    try {
      const res = await apiService.deleteUserCredential({
        employeeId: userToDelete.employeeId,
        username: userToDelete.username
      });

      if (res && res.status === 'success') {
        addToast('User Deleted', `User ${userToDelete.username} deleted successfully.`, 'success');
        setUserToDelete(null);
        fetchUsers();
      } else {
        addToast('Error', res?.message || 'Failed to delete user.', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      addToast('Error', 'Network error while deleting user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatusDirect = async (user) => {
    const newStatus = user.status === 'Inactive' ? 'Active' : 'Inactive';
    const payload = {
      ...user,
      status: newStatus
    };

    try {
      const res = await apiService.saveUserCredential(payload);
      if (res && res.status === 'success') {
        addToast('Status Updated', `User ${user.username} status set to ${newStatus}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      addToast('Error', 'Failed to update user status.', 'error');
    }
  };

  const togglePasswordVisibility = (empId) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      <PageHeader
        title="User & Security Access Settings"
        breadcrumbs={['Settings', 'User Management']}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-teal-400" /> Create New User
            </button>
          </div>
        }
      />

      {/* Main Users Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">System User Accounts</h3>
            </div>
          </div>
          <span className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg self-start sm:self-auto">
            Total Users: {usersList.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold space-y-2">
            <div className="w-7 h-7 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Fetching user credentials from Google Sheet...</p>
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-semibold space-y-2">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-slate-800 font-bold text-sm">No User Accounts Found</p>
            <p className="text-xs text-slate-500">Click "Create New User" to add the first account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Page Access Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u, idx) => {
                  const isPasswordVisible = !!showPasswordMap[u.employeeId];
                  const isActive = (u.status || 'Active').toLowerCase() === 'active';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">#{u.employeeId || idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{u.name}</td>
                      <td className="py-3.5 px-4 font-bold text-purple-950 font-mono bg-purple-50/40 rounded">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {isPasswordVisible ? u.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.employeeId)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                            title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${u.role === 'admin'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                        >
                          <Shield className="w-3 h-3" /> {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.pageAccess === 'ALL' ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                            ALL (Full Access)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {String(u.pageAccess || '')
                              .split(',')
                              .map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200"
                                >
                                  {p.trim()}
                                </span>
                              ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatusDirect(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
                            }`}
                          title="Click to toggle Status"
                        >
                          {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all"
                            title="Edit User Credentials & Access"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-400" />
                  <h3 className="font-bold text-sm">
                    {modalMode === 'add' ? 'Create New User Account' : 'Edit User Account & Permissions'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitUser} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Emp ID */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  {/* Employee Name */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Employee Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pawan Tiwari"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      User Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. pawan"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-purple-900 outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3313"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="admin">admin (Full Control)</option>
                      <option value="user">user (Restricted Controls)</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Page Access Selector */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <label className="block font-bold text-slate-900">Page Access Permissions</label>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="accessType"
                        value="ALL"
                        checked={formData.accessType === 'ALL'}
                        onChange={() => setFormData({ ...formData, accessType: 'ALL' })}
                        className="w-4 h-4 text-slate-900 accent-slate-900"
                      />
                      <span>ALL (Full Access to All Pages)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="accessType"
                        value="CUSTOM"
                        checked={formData.accessType === 'CUSTOM'}
                        onChange={() => setFormData({ ...formData, accessType: 'CUSTOM' })}
                        className="w-4 h-4 text-slate-900 accent-slate-900"
                      />
                      <span>Select Specific Pages</span>
                    </label>
                  </div>

                  {formData.accessType === 'CUSTOM' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fade-in">
                      <p className="text-[11px] text-slate-500 font-medium mb-1">
                        Select which pages this user can see in the sidebar navigation:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_PAGES.map((page) => {
                          const isChecked = formData.selectedPages.includes(page.id);
                          return (
                            <label
                              key={page.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${isChecked
                                ? 'bg-purple-50 border-purple-300 text-purple-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 font-medium'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handlePageCheckboxChange(page.id)}
                                className="w-3.5 h-3.5 accent-purple-600 rounded"
                              />
                              <span>{page.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> Save User Credentials
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Confirm User Deletion</h3>
                  <p className="text-xs text-slate-500">This action will permanently delete user from sheet.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <p className="font-bold text-slate-900">
                  User Name: <span className="text-purple-900">{userToDelete.username}</span>
                </p>
                <p className="text-slate-600">Employee Name: {userToDelete.name}</p>
                <p className="text-slate-600">Emp ID: #{userToDelete.employeeId}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Yes, Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
