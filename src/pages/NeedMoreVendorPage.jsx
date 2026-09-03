import React, { useState } from 'react';
import { Layers, Plus, Trash2, CheckCircle2, AlertTriangle, Layers3, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const NeedMoreVendorPage = ({ initialOpenItem }) => {
  const { indents, addVendorQuotation, removeVendorQuotation, completeVendorCollection, addToast } = useStore();

  const [selectedIndent, setSelectedIndent] = useState(initialOpenItem || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!!initialOpenItem);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [form, setForm] = useState({
    vendorName: '',
    rate: '',
    paymentTerm: 'Net 30 Days',
    unit: 'Pcs'
  });

  const [errors, setErrors] = useState({});

  // Pending Need More Vendor items
  const needMoreIndents = indents.filter(
    (i) => i.processType === 'Need More Vendor' && (i.currentStage === 'Quotation Collection' || i.currentStage === 'Vendor Process')
  );

  const handleOpenWorkspace = (item) => {
    setSelectedIndent(item);
    setForm({
      vendorName: '',
      rate: '',
      paymentTerm: 'Net 30 Days',
      unit: item.unit || 'Pcs'
    });
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedIndent(null);
  };

  const handleAddVendor = (shouldClear = true) => {
    const errs = {};
    if (!form.vendorName.trim()) errs.vendorName = 'Vendor name is required';
    if (!form.rate || Number(form.rate) <= 0) errs.rate = 'Valid rate is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    addVendorQuotation(selectedIndent.id, form);

    if (shouldClear) {
      setForm({
        vendorName: '',
        rate: '',
        paymentTerm: 'Net 30 Days',
        unit: selectedIndent.unit || 'Pcs'
      });
      setErrors({});
    }
    return true;
  };

  const handleCompleteCollection = () => {
    if (selectedIndent.vendorQuotations.length === 0) {
      addToast('Cannot Complete Collection', 'Please add at least 1 vendor quotation before submitting.', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmComplete = () => {
    completeVendorCollection(selectedIndent.id);
    setShowConfirmModal(false);
    handleCloseDrawer();
  };

  // Sync selected indent with context store to reflect newly added quotes immediately
  const currentIndentInStore = selectedIndent
    ? indents.find((i) => i.id === selectedIndent.id) || selectedIndent
    : null;

  const columns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => <span className="font-bold text-slate-900">{row.id}</span>
    },
    {
      header: 'Product Name',
      accessor: 'productName',
      cell: (row) => <span className="font-semibold text-slate-900">{row.productName}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600">{row.department}</span>
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      cell: (row) => (
        <span className="font-bold text-slate-800">
          {Number(row.quantity || 0).toLocaleString()} {row.unit}
        </span>
      )
    },
    {
      header: 'Vendors Added',
      accessor: 'vendorQuotations',
      cell: (row) => {
        const count = (row.vendorQuotations || []).length;
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              count >= 2
                ? 'bg-emerald-100 text-emerald-800'
                : count === 1
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {count} Quotes Collected
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <span className="font-medium text-slate-700">{row.status}</span>
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleOpenWorkspace(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs"
        >
          <Layers className="w-3.5 h-3.5 text-teal-400" /> Manage Vendors
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <PageHeader
        title="Need More Vendor Quotations"
        breadcrumbs={['Vendor Management', 'Need More Vendor']}
      />

      <DataTable
        columns={columns}
        data={needMoreIndents}
        pageSize={8}
        emptyTitle="No Pending Multi-Vendor Collections"
        emptyMessage="All indents requiring competitive quotations have finished collection and moved to approval."
      />

      {/* Drawer Workspace */}
      {currentIndentInStore && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          title="Vendor Quotation Collection Workspace"
          subtitle={`Indent ID: ${currentIndentInStore.id} • ${currentIndentInStore.productName}`}
          width="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close Drawer
              </button>

              <button
                type="button"
                onClick={handleCompleteCollection}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-lg hover:bg-teal-700 transition-all shadow-md"
              >
                <Send className="w-4 h-4" /> Complete Vendor Collection
              </button>
            </div>
          }
        >
          {/* Top Section: Target Indent Information */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indent Summary</h4>
            <div className="text-sm font-bold text-slate-900">{currentIndentInStore.productName}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
              <div>
                Dept: <strong className="text-slate-800">{currentIndentInStore.department}</strong>
              </div>
              <div>
                Qty:{' '}
                <strong className="text-slate-800">
                  {Number(currentIndentInStore?.quantity || 0).toLocaleString()} {currentIndentInStore?.unit || ''}
                </strong>
              </div>
              <div>
                Required: <strong className="text-slate-800">{currentIndentInStore?.requiredDate || 'N/A'}</strong>
              </div>
              <div>
                Priority: <strong className="text-slate-800">{currentIndentInStore?.priority || 'Medium'}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Existing Vendor Quotations Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Collected Vendor Quotations ({(currentIndentInStore?.vendorQuotations || []).length})
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">At least 2 quotes recommended</span>
            </div>

            {(currentIndentInStore?.vendorQuotations || []).length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold uppercase">
                      <th className="py-2.5 px-3">Vendor Name</th>
                      <th className="py-2.5 px-3">Rate (₹)</th>
                      <th className="py-2.5 px-3">Payment Term</th>
                      <th className="py-2.5 px-3">Added On</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(currentIndentInStore?.vendorQuotations || []).map((q) => (
                      <tr key={q.id || Math.random()} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{q.vendorName}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">₹{Number(q.rate || 0).toLocaleString()} / {q.unit || 'Pcs'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{q.paymentTerm}</td>
                        <td className="py-2.5 px-3 text-slate-500">{q.addedOn || 'Today'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => removeVendorQuotation(currentIndentInStore.id, q.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Quote"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                No vendor quotations added yet. Use the form below to record vendor bids.
              </p>
            )}
          </div>

          {/* Section 3: Add New Vendor Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-600" /> Add New Vendor Quotation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.vendorName}
                  onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                  placeholder="e.g. Jindal Steel Suppliers Ltd"
                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${
                    errors.vendorName ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {errors.vendorName && <p className="text-[11px] text-rose-500 mt-1">{errors.vendorName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quoted Rate (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  placeholder="e.g. 34500"
                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${
                    errors.rate ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {errors.rate && <p className="text-[11px] text-rose-500 mt-1">{errors.rate}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Term</label>
                <select
                  value={form.paymentTerm}
                  onChange={(e) => setForm({ ...form, paymentTerm: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
                >
                  <option value="Net 30 Days">Net 30 Days Credit</option>
                  <option value="Net 15 Days">Net 15 Days Credit</option>
                  <option value="Advance 20%">Advance 20%</option>
                  <option value="Advance 100%">100% Advance Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAddVendor(false)}
                className="px-3.5 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors"
              >
                Save & Add Another
              </button>
              <button
                type="button"
                onClick={() => handleAddVendor(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Add Vendor
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Confirmation Dialog before completion */}
      <ConfirmationDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmComplete}
        title="Complete Vendor Collection"
        message="Are you sure all required vendor quotations have been collected? This will move the indent to the Approval Queue for final manager review."
        confirmText="Complete Collection"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};
