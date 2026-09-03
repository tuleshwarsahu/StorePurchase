import React, { useState, useMemo } from 'react';
import { PackageCheck, Clock, History, CheckCircle2, AlertTriangle, Building2, Package, Check, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { formatISTDateTime } from '../utils/dateUtils';

export const StoreInPage = () => {
  const { indents, approvedIndents, storeInRecords, recordStoreIn, addToast } = useStore();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Store Receiving Entry
  const [formState, setFormState] = useState({
    billNo: '',
    receivedQuantity: '',
    statusOfReceived: 'Completed' // 'Completed' or 'Partially Received'
  });

  // Warning state for over-delivery or partial completion
  const [validationWarning, setValidationWarning] = useState(null);

  // Calculate items eligible for Store In (ONLY approved indents where PO Number IS GENERATED!)
  const itemsWithPO = useMemo(() => {
    const rawList = (approvedIndents && approvedIndents.length > 0)
      ? approvedIndents
      : indents.filter((i) => (i.status === 'Approved' || i.poNumber) && (i.selectedVendor || i.vendorName));

    return rawList.filter((i) => !!(i.poNumber && String(i.poNumber).trim() !== ''));
  }, [approvedIndents, indents]);

  // Lookup map of previous store in submissions by key `${indentId}_${productNameNorm}`
  const previousSubmissionMap = useMemo(() => {
    const map = {};
    (storeInRecords || []).forEach((r) => {
      const pNorm = String(r.productName || r.productsName || '').toLowerCase().trim();
      const key = `${r.id}_${pNorm}`;
      const recQty = Number(r.receivedQuantity || r.quantity || 0);
      const st = String(r.statusOfReceived || r.billStatus || '').trim();

      if (!map[key]) {
        map[key] = {
          billNo: r.billNo || '',
          totalReceivedQty: recQty,
          isCompleted: st === 'Completed',
          lastStatus: st || 'Partially Received'
        };
      } else {
        if (r.billNo && !map[key].billNo) map[key].billNo = r.billNo;
        map[key].totalReceivedQty += recQty;
        if (st === 'Completed') {
          map[key].isCompleted = true;
          map[key].lastStatus = 'Completed';
        }
      }
    });
    return map;
  }, [storeInRecords]);

  // Set of completed indent_product keys that should NOT appear in pending
  const completedKeysSet = useMemo(() => {
    const set = new Set();
    Object.keys(previousSubmissionMap).forEach((key) => {
      const entry = previousSubmissionMap[key];
      if (entry.isCompleted || entry.lastStatus === 'Completed') {
        set.add(key);
      }
    });
    return set;
  }, [previousSubmissionMap]);

  // Separate items into Pending Store In vs Store In History
  const { pendingStoreInItems, historyStoreInItems } = useMemo(() => {
    const pending = [];

    itemsWithPO.forEach((item) => {
      const pNorm = String(item.productName || '').toLowerCase().trim();
      const key = `${item.id}_${pNorm}`;
      const prevSub = previousSubmissionMap[key];
      const totalRec = prevSub ? prevSub.totalReceivedQty : Number(item.receivedQty || 0);
      const indentQty = Number(item.quantity || item.indentQuantity || 0);

      const isCompletedInStore = item.storeInStatus === 'Completed' ||
        item.statusOfReceived === 'Completed' ||
        completedKeysSet.has(key) ||
        (indentQty > 0 && totalRec >= indentQty);

      if (isCompletedInStore) {
        // Item receiving is fully completed -> Removed from Pending!
      } else {
        pending.push(item);
      }
    });

    return {
      pendingStoreInItems: pending,
      historyStoreInItems: storeInRecords || []
    };
  }, [itemsWithPO, storeInRecords, previousSubmissionMap, completedKeysSet]);

  const currentTableData = activeTab === 'Pending' ? pendingStoreInItems : historyStoreInItems;

  const handleOpenStoreInModal = (item) => {
    setSelectedItem(item);

    const pNorm = String(item.productName || '').toLowerCase().trim();
    const key = `${item.id}_${pNorm}`;
    const prevSub = previousSubmissionMap[key];

    // Pre-fill Bill No from previous submission if present
    const initialBillNo = (prevSub && prevSub.billNo) || item.billNo || '';

    // Calculate remaining quantity = total indent qty - previously received qty
    const totalIndentQty = Number(item.quantity || item.indentQuantity || 0);
    const prevReceivedQty = prevSub ? prevSub.totalReceivedQty : Number(item.receivedQty || 0);
    const remainingQty = Math.max(0, totalIndentQty - prevReceivedQty);

    setFormState({
      billNo: initialBillNo,
      receivedQuantity: remainingQty > 0 ? String(remainingQty) : String(totalIndentQty),
      statusOfReceived: 'Completed'
    });
    setValidationWarning(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormState({ billNo: '', receivedQuantity: '', statusOfReceived: 'Completed' });
    setValidationWarning(null);
  };

  const executeStoreInSubmission = () => {
    const indentQty = Number(selectedItem.quantity || selectedItem.indentQuantity || 0);
    const currentRecQty = Number(formState.receivedQuantity);

    recordStoreIn({
      indentId: selectedItem.id,
      statusOfReceived: formState.statusOfReceived,
      billNo: formState.billNo.trim(),
      vendorName: selectedItem.vendorName || selectedItem.selectedVendor || 'Approved Vendor',
      productName: selectedItem.productName,
      indentQuantity: indentQty,
      department: selectedItem.department || '',
      receivedQuantity: currentRecQty
    });

    handleCloseModal();
  };

  const handleSubmitStoreIn = (e) => {
    e.preventDefault();

    if (!formState.billNo || !formState.billNo.trim()) {
      addToast('Validation Error', 'Please enter a valid Bill Number (Col D).', 'warning');
      return;
    }

    const currentRecQty = Number(formState.receivedQuantity);
    const indentQty = Number(selectedItem.quantity || selectedItem.indentQuantity || 0);

    if (isNaN(currentRecQty) || currentRecQty <= 0) {
      addToast('Validation Error', 'Please enter a valid Received Quantity (Col I).', 'warning');
      return;
    }

    // CALCULATE CUMULATIVE RECEIVED QUANTITY = PREVIOUSLY RECEIVED + CURRENT ENTERED
    const pNorm = String(selectedItem.productName || '').toLowerCase().trim();
    const key = `${selectedItem.id}_${pNorm}`;
    const prevSub = previousSubmissionMap[key];
    const prevReceivedQty = prevSub ? prevSub.totalReceivedQty : 0;
    const totalCumulativeRec = prevReceivedQty + currentRecQty;

    // CHECK VALIDATION RULES AGAINST TOTAL CUMULATIVE RECEIVED QUANTITY:
    // Rule 1: Total Cumulative Received Qty > Indent Qty (Over-delivery)
    if (totalCumulativeRec > indentQty && !validationWarning) {
      setValidationWarning({
        type: 'over_delivery',
        message: `Warning: Total Cumulative Received Quantity (${totalCumulativeRec} = ${prevReceivedQty} previous + ${currentRecQty} current) is GREATER than Indent Quantity (${indentQty}). Are you sure you want to log this entry?`
      });
      return;
    }

    // Rule 2: Status === 'Completed' but Total Cumulative Received Qty < Indent Qty (Under-delivery)
    if (formState.statusOfReceived === 'Completed' && totalCumulativeRec < indentQty && !validationWarning) {
      setValidationWarning({
        type: 'under_completed',
        message: `Warning: Status is set to "Completed", but Total Cumulative Received Quantity (${totalCumulativeRec} = ${prevReceivedQty} previous + ${currentRecQty} current) is LESS than Indent Quantity (${indentQty}). If saved as Completed, this item will move to History.`
      });
      return;
    }

    executeStoreInSubmission();
  };

  const pendingColumns = [
    {
      header: 'Indent No.',
      accessor: 'id',
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Products Name',
      accessor: 'productName',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 line-clamp-2">{row.productName}</p>
        </div>
      )
    },
    {
      header: 'Vendor Name',
      cell: (row) => (
        <span className="font-semibold text-slate-800 whitespace-nowrap">
          {row.vendorName || row.selectedVendor || 'Approved Vendor'}
        </span>
      )
    },
    {
      header: 'Indent Quantity',
      cell: (row) => (
        <span className="font-bold text-slate-800 whitespace-nowrap">
          {Number(row.quantity || row.indentQuantity || 0).toLocaleString()} {row.unit || 'Pcs'}
        </span>
      )
    },
    {
      header: 'PO Number',
      accessor: 'poNumber',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
          {row.poNumber || 'PO Generated'}
        </span>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleOpenStoreInModal(row)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs whitespace-nowrap"
        >
          <PackageCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Record Store In
        </button>
      )
    }
  ];

  // HISTORY COLUMNS MATCHING EXACT GOOGLE SHEET HEADERS (Col A to I)
  const historyColumns = [
    {
      header: 'Timestamp',
      accessor: 'timeStamp',
      cell: (row) => <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{formatISTDateTime(row.timeStamp)}</span>
    },
    {
      header: 'Indent No.',
      accessor: 'id',
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Status Of Recived',
      accessor: 'statusOfReceived',
      cell: (row) => {
        const st = row.statusOfReceived || row.billStatus || 'Completed';
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${st === 'Completed'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
          >
            {st}
          </span>
        );
      }
    },
    {
      header: 'Bill No.',
      accessor: 'billNo',
      cell: (row) => (
        <span className="font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 whitespace-nowrap">
          {row.billNo}
        </span>
      )
    },
    {
      header: 'Vendor Name',
      accessor: 'vendorName',
      cell: (row) => <span className="text-slate-800 font-semibold whitespace-nowrap">{row.vendorName}</span>
    },
    {
      header: 'Products Name',
      accessor: 'productName',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 line-clamp-2">{row.productName}</p>
        </div>
      )
    },
    {
      header: 'Indent Quantity',
      accessor: 'indentQuantity',
      cell: (row) => (
        <span className="font-bold text-slate-800 whitespace-nowrap">
          {Number(row.indentQuantity || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Received Quantity',
      accessor: 'receivedQuantity',
      cell: (row) => (
        <span className="font-bold text-emerald-700 text-xs sm:text-sm whitespace-nowrap">
          {Number(row.receivedQuantity || row.quantity || 0).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-12 text-xs">
      <PageHeader
        title="Store Receiving (Store In)"
        breadcrumbs={['Indent Management', 'Store In']}
      />

      {/* HEADER TABS BAR FOR PENDING vs HISTORY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 rounded-xl shadow-2xs">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl shrink-0 sm:flex sm:items-center">
          <button
            onClick={() => {
              setActiveTab('Pending');
              handleCloseModal();
            }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'Pending' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Pending Store In
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-300">
              {pendingStoreInItems.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('History');
              handleCloseModal();
            }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'History' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> Store In History
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-200">
              {historyStoreInItems.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-semibold text-right sm:pr-2">
          Showing {activeTab === 'Pending' ? 'Pending Receiving' : 'Received Entries'} ({currentTableData.length} Items)
        </span>
      </div>

      {/* TABLE DATA */}
      <DataTable
        columns={activeTab === 'Pending' ? pendingColumns : historyColumns}
        data={currentTableData}
        pageSize={8}
        emptyTitle={activeTab === 'Pending' ? 'No Items Pending Store In' : 'No Store In History Yet'}
        emptyMessage={
          activeTab === 'Pending'
            ? 'All items with generated POs have been received in store.'
            : 'No store receiving entries found in the STORE IN sheet tab.'
        }
      />

      {/* STORE RECEIVING ENTRY MODAL */}
      {selectedItem && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={`Record Store Receiving — Indent ${selectedItem.id}`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitStoreIn}
                className={`flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm ${validationWarning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                {validationWarning ? 'Confirm & Submit Anyway' : 'Save Store In Entry'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmitStoreIn} className="space-y-4 text-xs">
            {/* Item Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedItem.productName}</span>
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-800 text-[11px] border border-purple-200 shrink-0">
                  {selectedItem.poNumber || 'PO Generated'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <div>Vendor: <strong className="text-slate-900 font-semibold">{selectedItem.vendorName || selectedItem.selectedVendor || 'Approved Vendor'}</strong></div>
                <div>Department: <strong className="text-slate-900 font-semibold">{selectedItem.department}</strong></div>
                <div>Indent Quantity: <strong className="text-slate-900 font-bold">{selectedItem.quantity || selectedItem.indentQuantity} {selectedItem.unit || 'Pcs'}</strong></div>
                <div>Area Machine: <strong className="text-slate-900 font-semibold">{selectedItem.areaOfMachine || 'N/A'}</strong></div>
              </div>

              {/* Previous Submission Info Badge */}
              {(() => {
                const pNorm = String(selectedItem.productName || '').toLowerCase().trim();
                const key = `${selectedItem.id}_${pNorm}`;
                const prevSub = previousSubmissionMap[key];
                if (!prevSub || !prevSub.billNo) return null;
                return (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-amber-950 mt-2 font-semibold">
                    <span>Previous Bill No: <strong className="text-purple-900 bg-purple-100 px-2 py-0.5 rounded">{prevSub.billNo}</strong></span>
                    <span className="text-amber-900">Already Received: <strong>{prevSub.totalReceivedQty}</strong> / {selectedItem.quantity || selectedItem.indentQuantity} {selectedItem.unit || 'Pcs'}</span>
                  </div>
                );
              })()}
            </div>

            {/* Validation Warning Alert Box */}
            {validationWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs">Confirmation Warning</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{validationWarning.message}</p>
                </div>
              </div>
            )}

            {/* Form Input Fields */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Bill Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.billNo}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, billNo: e.target.value }));
                    setValidationWarning(null);
                  }}
                  placeholder="Enter Vendor Invoice / Bill No. (e.g. 96385274)"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Received Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    value={formState.receivedQuantity}
                    onChange={(e) => {
                      setFormState((prev) => ({ ...prev, receivedQuantity: e.target.value }));
                      setValidationWarning(null);
                    }}
                    placeholder="Enter received quantity"
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    {selectedItem.unit || 'Pcs'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Status Of Recived <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formState.statusOfReceived}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, statusOfReceived: e.target.value }));
                    setValidationWarning(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                >
                  <option value="Completed">Completed</option>
                  <option value="Partially Received">Partially Received</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
