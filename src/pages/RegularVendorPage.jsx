import React, { useState } from 'react';
import { Store, Plus, FileText, Check, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { PriorityBadge } from '../components/common/StatusBadge';

export const RegularVendorPage = ({ initialOpenItem }) => {
  const { indents, saveRegularVendorOffer } = useStore();

  const [selectedIndent, setSelectedIndent] = useState(initialOpenItem || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!!initialOpenItem);

  const [form, setForm] = useState({
    vendorName: '',
    rate: '',
    paymentTerm: 'Net 30 Days',
    unit: 'Pcs',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  // Filter pending regular vendor items
  const regularPendingIndents = indents.filter(
    (i) => i.processType === 'Regular Vendor' && (i.currentStage === 'Vendor Process' || i.status === 'In Progress')
  );

  const handleOpenDrawer = (item) => {
    setSelectedIndent(item);
    setForm({
      vendorName: '',
      rate: '',
      paymentTerm: 'Net 30 Days',
      unit: item.unit || 'Pcs',
      remarks: ''
    });
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedIndent(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.vendorName.trim()) errs.vendorName = 'Vendor name is required';
    if (!form.rate || Number(form.rate) <= 0) errs.rate = 'Valid rate is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    saveRegularVendorOffer(selectedIndent.id, form);
    handleCloseDrawer();
  };

  const columns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => <span className="font-bold text-slate-900">{row.id}</span>
    },
    {
      header: 'Product Name',
      accessor: 'productName',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{row.productName}</p>
          <div className="mt-0.5">
            <PriorityBadge priority={row.priority} />
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 font-medium">{row.department}</span>
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
      header: 'Planned Date',
      accessor: 'plannedVendorDate',
      cell: (row) => <span className="text-slate-600">{row.plannedVendorDate}</span>
    },
    {
      header: 'Delay',
      accessor: 'delayDays',
      cell: (row) =>
        row.delayDays > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
            <AlertTriangle className="w-3 h-3" /> +{row.delayDays}d
          </span>
        ) : (
          <span className="text-emerald-600 font-medium text-[11px]">On Time</span>
        )
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleOpenDrawer(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" /> Add Vendor Offer
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <PageHeader
        title="Regular Vendor Processing"
        breadcrumbs={['Vendor Management', 'Regular Vendor']}
      />

      <DataTable
        columns={columns}
        data={regularPendingIndents}
        pageSize={8}
        emptyTitle="No Pending Regular Vendor Processing"
        emptyMessage="All regular vendor purchase indents have submitted rate offers and advanced to the approval stage."
      />

      {/* Side Drawer for Add Vendor Offer */}
      {selectedIndent && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          title="Add Regular Vendor Offer"
          subtitle={`Indent ID: ${selectedIndent.id}`}
          footer={
            <>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm transition-all"
              >
                <Check className="w-4 h-4 text-teal-400" /> Save Vendor Offer
              </button>
            </>
          }
        >
          {/* Top Indent Information Header */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Indent Information</h4>
            <div className="text-sm font-bold text-slate-900">{selectedIndent.productName}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/80">
              <div>
                Department: <strong className="text-slate-800">{selectedIndent.department}</strong>
              </div>
              <div>
                Quantity:{' '}
                <strong className="text-slate-800">
                  {selectedIndent.quantity.toLocaleString()} {selectedIndent.unit}
                </strong>
              </div>
              <div>
                Required Date: <strong className="text-slate-800">{selectedIndent.requiredDate}</strong>
              </div>
              <div>
                Priority: <strong className="text-slate-800">{selectedIndent.priority}</strong>
              </div>
            </div>
          </div>

          {/* VENDOR INFORMATION Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Vendor Offer Details
            </h4>

            {/* Vendor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                placeholder="e.g. SKF Bearings India Commercial Ltd"
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${errors.vendorName ? 'border-rose-500' : 'border-slate-300'
                  }`}
              />
              {errors.vendorName && <p className="text-[11px] text-rose-500 mt-1">{errors.vendorName}</p>}
            </div>

            {/* Rate & UOM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Rate (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  placeholder="e.g. 1850"
                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${errors.rate ? 'border-rose-500' : 'border-slate-300'
                    }`}
                />
                {errors.rate && <p className="text-[11px] text-rose-500 mt-1">{errors.rate}</p>}
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

            {/* Payment Term */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Term</label>
              <select
                value={form.paymentTerm}
                onChange={(e) => setForm({ ...form, paymentTerm: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
              >
                <option value="Net 30 Days">Net 30 Days Credit</option>
                <option value="Net 15 Days">Net 15 Days Credit</option>
                <option value="Advance 100%">100% Advance Payment</option>
                <option value="50% Advance, 50% Delivery">50% Advance, 50% Delivery</option>
                <option value="Immediate Cash">Immediate Cash</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Remarks / Warranty Details</label>
              <textarea
                rows="3"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="e.g. Original OEM grade, test certificate will be supplied with shipment..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
              />
            </div>
          </form>
        </Drawer>
      )}
    </div>
  );
};
