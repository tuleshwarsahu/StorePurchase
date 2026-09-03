import React, { useState, useMemo } from 'react';
import { CheckSquare, Store, Layers, ShieldCheck, CheckCircle2, XCircle, Clock, History, Check, User, Building2, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const ApprovalQueuePage = () => {
  const { indents, approvedIndents, approveIndent, rejectIndent } = useStore();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Map of winning vendor name per productName: { [productName]: winningVendorName }
  const [selectedVendorsMap, setSelectedVendorsMap] = useState({});
  const [remarks, setRemarks] = useState('');

  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);

  /**
   * Filter pending & history indents
   */
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isApprovedOrRejected = item.status === 'Approved' || item.status === 'Rejected' || item.currentStage === 'Completed';
      if (isApprovedOrRejected) return false;
      return item.processTypeSelected || item.currentStage === 'Approval Queue' || item.status === 'Ready for Approval';
    });
  }, [indents]);

  const historyIndents = useMemo(() => {
    return (approvedIndents && approvedIndents.length > 0)
      ? approvedIndents
      : indents.filter((item) => item.status === 'Approved' && (item.selectedVendor || item.vendorName));
  }, [approvedIndents, indents]);

  // Group pending indents into 1 single row per Indent Number
  const groupedPendingIndents = useMemo(() => {
    const map = {};
    pendingIndents.forEach((item) => {
      if (!map[item.id]) {
        map[item.id] = {
          id: item.id,
          indentorName: item.indentorName || item.assignedTo || 'Rajesh Kumar',
          department: item.department || 'Stores',
          areaOfMachine: item.areaOfMachine || '',
          groupHead: item.groupHead || '',
          items: []
        };
      }
      map[item.id].items.push(item);
    });
    return Object.values(map);
  }, [pendingIndents]);

  // Group history indents into 1 single row per Indent Number
  const groupedHistoryIndents = useMemo(() => {
    const map = {};
    historyIndents.forEach((item) => {
      if (!map[item.id]) {
        map[item.id] = {
          id: item.id,
          indentorName: item.indentorName || item.assignedTo || 'Rajesh Kumar',
          department: item.department || 'Stores',
          areaOfMachine: item.areaOfMachine || '',
          groupHead: item.groupHead || '',
          items: []
        };
      }
      map[item.id].items.push(item);
    });
    return Object.values(map);
  }, [historyIndents]);

  const currentCategoryData = activeTab === 'pending' ? groupedPendingIndents : groupedHistoryIndents;

  const handleOpenGroupReview = (group) => {
    setSelectedGroup(group);
    setSelectedItemIndex(0);

    const initialVendors = {};
    group.items.forEach((item) => {
      if (item.regularVendorOffer?.vendorName) {
        initialVendors[item.productName] = item.regularVendorOffer.vendorName;
      } else if (item.vendorQuotations && item.vendorQuotations.length > 0) {
        initialVendors[item.productName] = item.vendorQuotations[0].vendorName;
      } else if (item.selectedVendor) {
        initialVendors[item.productName] = item.selectedVendor;
      }
    });

    setSelectedVendorsMap(initialVendors);
    setRemarks('');
    setIsReviewOpen(true);
  };

  const handleCloseReview = () => {
    setIsReviewOpen(false);
    setSelectedGroup(null);
    setSelectedItemIndex(0);
    setSelectedVendorsMap({});
  };

  const handleApproveClick = () => {
    setShowConfirmApprove(true);
  };

  const handleRejectClick = () => {
    setShowConfirmReject(true);
  };

  const confirmApprove = () => {
    if (selectedGroup) {
      approveIndent(selectedGroup.id, selectedVendorsMap, remarks);
      setShowConfirmApprove(false);
      handleCloseReview();
    }
  };

  const confirmReject = () => {
    if (selectedGroup) {
      rejectIndent(selectedGroup.id, remarks);
      setShowConfirmReject(false);
      handleCloseReview();
    }
  };

  const pendingColumns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => (
        <span className="font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          {row.id}
        </span>
      )
    },
    {
      header: 'Material Items List',
      cell: (row) => (
        <div className="space-y-1 max-w-xs sm:max-w-md">
          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold rounded">
            {row.items.length} Item{row.items.length > 1 ? 's' : ''}
          </span>
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
            {row.items.map((i) => `${i.productName} (${i.quantity} ${i.unit || 'Pcs'})`).join(', ')}
          </p>
        </div>
      )
    },
    {
      header: 'Indentor',
      accessor: 'indentorName',
      cell: (row) => <span className="text-slate-700 font-medium whitespace-nowrap">{row.indentorName || 'N/A'}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Process Summary',
      cell: (row) => {
        const types = Array.from(new Set(row.items.map((i) => typeof i.processType === 'string' ? i.processType : (i.processType?.processType || 'Regular Vendor'))));
        return (
          <div className="flex flex-wrap gap-1">
            {types.map((t) => (
              <span
                key={t}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                  t === 'Need More Vendor'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleOpenGroupReview(row)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Review & Approve ({row.items.length})
        </button>
      )
    }
  ];

  const historyColumns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Material Items List',
      cell: (row) => (
        <div className="space-y-1 max-w-xs sm:max-w-md">
          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded">
            {row.items.length} Item{row.items.length > 1 ? 's' : ''} Approved
          </span>
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
            {row.items.map((i) => `${i.productName} (${i.selectedVendor || i.vendorName || 'Approved'})`).join(', ')}
          </p>
        </div>
      )
    },
    {
      header: 'Indentor',
      accessor: 'indentorName',
      cell: (row) => <span className="text-slate-700 font-medium whitespace-nowrap">{row.indentorName || 'N/A'}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Status',
      cell: () => (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
          Approved
        </span>
      )
    }
  ];

  const activeSelectedItem = useMemo(() => {
    if (!selectedGroup || !selectedGroup.items || selectedGroup.items.length === 0) return null;
    return selectedGroup.items[selectedItemIndex] || selectedGroup.items[0];
  }, [selectedGroup, selectedItemIndex]);

  return (
    <div className="space-y-5 animate-fade-in pb-8 text-xs">
      <PageHeader title="Approval Queue & History" breadcrumbs={['Approval', 'Approval Workspace']} />

      {/* CATEGORY TABS: PENDING vs HISTORY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 rounded-xl shadow-2xs">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Pending Approvals
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-amber-300">
              {groupedPendingIndents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> Approval History
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-200">
              {groupedHistoryIndents.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-semibold text-right sm:pr-2">
          {currentCategoryData.length} Indent Group{currentCategoryData.length > 1 ? 's' : ''} ({activeTab === 'pending' ? 'Pending' : 'History'})
        </span>
      </div>

      {/* TABLE DATA */}
      <DataTable
        columns={activeTab === 'pending' ? pendingColumns : historyColumns}
        data={currentCategoryData}
        pageSize={8}
        emptyTitle={activeTab === 'pending' ? 'Approval Queue Clear' : 'No Approval History Yet'}
        emptyMessage={
          activeTab === 'pending'
            ? 'All submitted purchase indents have been reviewed.'
            : 'No approved or processed indents found in history.'
        }
      />

      {/* APPROVAL REVIEW MODAL (MULTI-ITEM PER-ITEM VENDOR SELECTION) */}
      {selectedGroup && (
        <Modal
          isOpen={isReviewOpen}
          onClose={handleCloseReview}
          title={`Review & Approve Indent ${selectedGroup.id} (${selectedGroup.items.length} Items)`}
          maxWidth="max-w-4xl"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
              <button
                type="button"
                onClick={handleRejectClick}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <XCircle className="w-4 h-4 shrink-0" /> Reject Indent
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApproveClick}
                  className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  Approve Indent ({selectedGroup.items.length} Items)
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Header summary card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Indent ID: {selectedGroup.id}</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 text-[11px]">
                  {selectedGroup.items.length} Material Items
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                <div>Indentor: <strong className="text-slate-900">{selectedGroup.indentorName || 'N/A'}</strong></div>
                <div>Department: <strong className="text-slate-900">{selectedGroup.department}</strong></div>
                <div>Area Machine: <strong className="text-slate-900">{selectedGroup.areaOfMachine || 'N/A'}</strong></div>
                <div>Group Head: <strong className="text-slate-900">{selectedGroup.groupHead || 'N/A'}</strong></div>
              </div>
            </div>

            {/* ITEM SELECTOR TABS BAR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Item to Review & Choose Winning Vendor:
              </label>

              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                {selectedGroup.items.map((item, idx) => {
                  const selVendor = selectedVendorsMap[item.productName];
                  return (
                    <button
                      key={item.productName || idx}
                      type="button"
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedItemIndex === idx
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">Item #{idx + 1}: {item.productName}</span>
                      {selVendor && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-0.5 shrink-0">
                          <Check className="w-3 h-3" /> {selVendor}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE SELECTED ITEM DETAILS & VENDOR SELECTION */}
            {activeSelectedItem && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activeSelectedItem.productName}</h4>
                    <p className="text-xs text-slate-500">
                      Quantity: <strong>{activeSelectedItem.quantity} {activeSelectedItem.unit || 'Pcs'}</strong> | Specs: {activeSelectedItem.productMakeSpecs || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      activeSelectedItem.processType === 'Need More Vendor'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {activeSelectedItem.processType || 'Regular Vendor'}
                  </span>
                </div>

                {/* Regular Vendor vs Need More Vendor Options */}
                {activeSelectedItem.processType === 'Regular Vendor' ? (
                  <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 space-y-2">
                    <h5 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">Submitted Regular Purchase Offer</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                      <div>Vendor: <strong className="text-slate-900 font-bold">{activeSelectedItem.regularVendorOffer?.vendorName || activeSelectedItem.vendorName || 'N/A'}</strong></div>
                      <div>Quoted Rate: <strong className="text-teal-800 font-bold text-sm">₹{Number(activeSelectedItem.regularVendorOffer?.rate || activeSelectedItem.rate || 0).toLocaleString()}</strong></div>
                      <div>Payment Term: <strong className="text-slate-800">{activeSelectedItem.regularVendorOffer?.paymentTerm || activeSelectedItem.paymentTerm || 'Net 30 Days'}</strong></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Select Winning Vendor Quote for "{activeSelectedItem.productName}"
                    </h5>

                    {(activeSelectedItem.vendorQuotations || []).length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 font-semibold uppercase">
                              <th className="py-2.5 px-3">Select</th>
                              <th className="py-2.5 px-3">Vendor Name</th>
                              <th className="py-2.5 px-3">Rate (₹)</th>
                              <th className="py-2.5 px-3">Payment Term</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(activeSelectedItem.vendorQuotations || []).map((q) => {
                              const isSelected = selectedVendorsMap[activeSelectedItem.productName] === q.vendorName;
                              return (
                                <tr
                                  key={q.id || Math.random()}
                                  onClick={() => setSelectedVendorsMap((prev) => ({ ...prev, [activeSelectedItem.productName]: q.vendorName }))}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected ? 'bg-emerald-50/90 font-semibold text-emerald-950' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="radio"
                                      name={`winningVendor_${activeSelectedItem.productName}`}
                                      checked={isSelected}
                                      onChange={() => setSelectedVendorsMap((prev) => ({ ...prev, [activeSelectedItem.productName]: q.vendorName }))}
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-900 font-bold whitespace-nowrap">{q.vendorName}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">₹{Number(q.rate || 0).toLocaleString()}</td>
                                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{q.paymentTerm}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        No vendor quotations submitted for "{activeSelectedItem.productName}".
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Approver Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approver Remarks</label>
              <textarea
                rows="2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval or rejection comments..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION DIALOGS */}
      <ConfirmationDialog
        isOpen={showConfirmApprove}
        onClose={() => setShowConfirmApprove(false)}
        onConfirm={confirmApprove}
        title="Confirm Indent Approval"
        message={`Are you sure you want to approve all items under Indent ${selectedGroup?.id}? This will record the approved winning vendors into the APPROVE INDENT sheet.`}
        confirmText="Approve Indent"
        cancelText="Cancel"
        type="success"
      />

      <ConfirmationDialog
        isOpen={showConfirmReject}
        onClose={() => setShowConfirmReject(false)}
        onConfirm={confirmReject}
        title="Confirm Indent Rejection"
        message={`Are you sure you want to reject Indent ${selectedGroup?.id}?`}
        confirmText="Reject Indent"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
