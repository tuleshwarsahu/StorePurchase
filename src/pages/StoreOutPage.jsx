import React, { useState, useMemo } from 'react';
import { PackageMinus, Clock, History, PlusCircle, CheckCircle2, AlertCircle, Building2, User, Layers, Tag, Send, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { formatISTDateTime } from '../utils/dateUtils';

export const StoreOutPage = () => {
  const { storeInRecords, storeOutRecords, createStoreOutIndent, issueStoreOutProduct, currentUser, addToast } = useStore();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [isFormCardOpen, setIsFormCardOpen] = useState(true);
  const [selectedIssueItem, setSelectedIssueItem] = useState(null);

  // Auto-calculated next Store Out Number e.g. SOUT/2026/0001
  const nextStoreOutNo = useMemo(() => {
    let maxSeq = 0;
    (storeOutRecords || []).forEach((r) => {
      const soutNo = String(r.storeOutNo || r.id || '');
      if (soutNo.startsWith('SOUT/2026/')) {
        const num = parseInt(soutNo.replace('SOUT/2026/', ''), 10);
        if (!isNaN(num)) maxSeq = Math.max(maxSeq, num);
      }
    });
    return `SOUT/2026/${String(maxSeq + 1).padStart(4, '0')}`;
  }, [storeOutRecords]);

  // Form State containing ALL exact columns present in the STORE OUT sheet (Cols B to M)
  const [formState, setFormState] = useState({
    storeOutNo: '',
    indentorName: currentUser?.name || 'Pawan Tiwari',
    department: currentUser?.department || 'Rolling Mill',
    area: '',
    groupHead: '',
    productName: '',
    qty: '',
    unit: 'PCS',
    reason: '',
    planned: '',
    actual: '',
    status: 'Pending Issue'
  });

  // Filter Store Out records into Pending Issue vs Store Out History
  const { pendingItems, historyItems } = useMemo(() => {
    const pending = [];
    const history = [];

    (storeOutRecords || []).forEach((item) => {
      const st = String(item.status || '').trim();
      if (st === 'Issued' || (item.actual && String(item.actual).trim() !== '')) {
        history.push(item);
      } else {
        pending.push(item);
      }
    });

    return { pendingItems: pending, historyItems: history };
  }, [storeOutRecords]);

  const currentTableData = activeTab === 'Pending' ? pendingItems : historyItems;

  const handleResetForm = () => {
    setFormState({
      storeOutNo: '',
      indentorName: currentUser?.name || 'Pawan Tiwari',
      department: currentUser?.department || 'Rolling Mill',
      area: '',
      groupHead: '',
      productName: '',
      qty: '',
      unit: 'PCS',
      reason: '',
      planned: '',
      actual: '',
      status: 'Pending Issue'
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();

    if (!formState.indentorName || !formState.indentorName.trim()) {
      addToast('Validation Error', 'Please enter Indentor Name (Col C).', 'warning');
      return;
    }
    if (!formState.department || !formState.department.trim()) {
      addToast('Validation Error', 'Please enter Department (Col D).', 'warning');
      return;
    }
    if (!formState.productName || !formState.productName.trim()) {
      addToast('Validation Error', 'Please enter Product Name (Col G).', 'warning');
      return;
    }
    if (!formState.qty || isNaN(formState.qty) || Number(formState.qty) <= 0) {
      addToast('Validation Error', 'Please enter valid Quantity (Col H).', 'warning');
      return;
    }

    const soutId = (formState.storeOutNo && formState.storeOutNo.trim()) || nextStoreOutNo;
    const nowStr = new Date().toLocaleString('en-GB');

    createStoreOutIndent({
      storeOutNo: soutId,
      indentorName: formState.indentorName.trim(),
      department: formState.department.trim(),
      area: formState.area.trim(),
      groupHead: formState.groupHead.trim(),
      productName: formState.productName.trim(),
      qty: Number(formState.qty),
      unit: formState.unit || 'PCS',
      reason: formState.reason.trim(),
      planned: formState.planned.trim() || nowStr,
      actual: formState.actual.trim(),
      status: formState.status || 'Pending Issue'
    });

    handleResetForm();
  };

  const handleConfirmIssue = (item) => {
    issueStoreOutProduct(item.storeOutNo || item.id, item.productName);
    setSelectedIssueItem(null);
  };

  const pendingColumns = [
    {
      header: 'Store Out No.',
      accessor: 'storeOutNo',
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap">{row.storeOutNo || row.id}</span>
    },
    {
      header: 'Indentor Name',
      accessor: 'indentorName',
      cell: (row) => <span className="font-semibold text-slate-800 whitespace-nowrap">{row.indentorName || 'Pawan Tiwari'}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-700 whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Area',
      accessor: 'area',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.area || 'N/A'}</span>
    },
    {
      header: 'Group Head',
      accessor: 'groupHead',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.groupHead || 'N/A'}</span>
    },
    {
      header: 'Product Name',
      accessor: 'productName',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 line-clamp-2">{row.productName}</p>
        </div>
      )
    },
    {
      header: 'Qty',
      cell: (row) => (
        <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 whitespace-nowrap">
          {Number(row.qty || row.quantity || 0).toLocaleString()} {row.unit || row.unitOfMeasurement || 'PCS'}
        </span>
      )
    },
    {
      header: 'Reason',
      accessor: 'reason',
      cell: (row) => <span className="text-xs text-slate-600 max-w-[150px] truncate block">{row.reason || 'N/A'}</span>
    },
    {
      header: 'Planned',
      accessor: 'planned',
      cell: (row) => <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{formatISTDateTime(row.planned || row.timeStamp)}</span>
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => setSelectedIssueItem(row)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-all shadow-2xs whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> Issue Item
        </button>
      )
    }
  ];

  const historyColumns = [
    {
      header: 'Timestamp',
      accessor: 'timeStamp',
      cell: (row) => <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{formatISTDateTime(row.timeStamp)}</span>
    },
    {
      header: 'Store Out No.',
      accessor: 'storeOutNo',
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap">{row.storeOutNo || row.id}</span>
    },
    {
      header: 'Indentor Name',
      accessor: 'indentorName',
      cell: (row) => <span className="font-semibold text-slate-800 whitespace-nowrap">{row.indentorName}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-700 whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Area',
      accessor: 'area',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.area || 'N/A'}</span>
    },
    {
      header: 'Group Head',
      accessor: 'groupHead',
      cell: (row) => <span className="text-slate-600 whitespace-nowrap">{row.groupHead || 'N/A'}</span>
    },
    {
      header: 'Product Name',
      accessor: 'productName',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 line-clamp-2">{row.productName}</p>
        </div>
      )
    },
    {
      header: 'Qty Issued',
      cell: (row) => (
        <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 whitespace-nowrap">
          {Number(row.qty || row.quantity || 0).toLocaleString()} {row.unit || row.unitOfMeasurement || 'PCS'}
        </span>
      )
    },
    {
      header: 'Reason',
      accessor: 'reason',
      cell: (row) => <span className="text-xs text-slate-600 max-w-[150px] truncate block">{row.reason || 'N/A'}</span>
    },
    {
      header: 'Actual (Issued)',
      accessor: 'actual',
      cell: (row) => <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{formatISTDateTime(row.actual || row.timeStamp)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
          {row.status || 'Issued'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-12 text-xs">
      <PageHeader
        title="Store Issue (Store Out)"
        breadcrumbs={['Indent Management', 'Store Out']}
      />

      {/* DEDICATED STORE OUT ENTRY FORM CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <div
          onClick={() => setIsFormCardOpen(!isFormCardOpen)}
          className="flex items-center justify-between p-4 bg-slate-900 text-white cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Store Out Indent Form (All Sheet Column Fields)</h3>
              <p className="text-[11px] text-slate-400">Fill details to submit store out issue entry into STORE OUT sheet</p>
            </div>
          </div>
          <button type="button" className="p-1 text-slate-300 hover:text-white shrink-0">
            {isFormCardOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isFormCardOpen && (
          <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 space-y-4 text-xs bg-slate-50/50">
            {/* AUTO GENERATED STORE OUT NO. DISPLAY & QUICK SELECT */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900">Auto-Generated Store Out No:</span>
                <span className="px-2.5 py-1 rounded-md bg-purple-900 text-white font-bold text-xs shadow-2xs">
                  {nextStoreOutNo}
                </span>
              </div>

              {/* Quick Select Store In Stock Item */}
              {storeInRecords && storeInRecords.length > 0 && (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const item = storeInRecords.find((r) => `${r.id}_${r.productName}` === val || r.productName === val);
                      if (item) {
                        setFormState((prev) => ({
                          ...prev,
                          productName: item.productName || '',
                          department: item.department || prev.department,
                          qty: String(item.receivedQuantity || item.quantity || '')
                        }));
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-purple-300 rounded-lg text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                  >
                    <option value="">-- Auto-Fill from Received Store Stock --</option>
                    {storeInRecords.map((r, idx) => (
                      <option key={idx} value={`${r.id}_${r.productName}`}>
                        {r.productName} ({r.id}) — Rec Qty: {r.receivedQuantity || r.quantity} (Dept: {r.department || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* FORM INPUT FIELDS (Col C to Col J) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Col C: Indentor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Indentor Name <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Col C)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.indentorName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, indentorName: e.target.value }))}
                  placeholder="e.g. Pawan Tiwari"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              {/* Col D: Department */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Department <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Col D)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.department}
                  onChange={(e) => setFormState((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Rolling Mill"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              {/* Col E: Area */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Area <span className="text-slate-400 font-normal">(Col E)</span>
                </label>
                <input
                  type="text"
                  value={formState.area}
                  onChange={(e) => setFormState((prev) => ({ ...prev, area: e.target.value }))}
                  placeholder="e.g. xyz / Machine Area"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              {/* Col F: Group Head */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Group Head <span className="text-slate-400 font-normal">(Col F)</span>
                </label>
                <input
                  type="text"
                  value={formState.groupHead}
                  onChange={(e) => setFormState((prev) => ({ ...prev, groupHead: e.target.value }))}
                  placeholder="e.g. Section Head"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              {/* Col G: Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Product Name <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Col G)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.productName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, productName: e.target.value }))}
                  placeholder="e.g. bearing / Kit"
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              {/* Col H: Qty */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Qty <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Col H)</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formState.qty}
                  onChange={(e) => setFormState((prev) => ({ ...prev, qty: e.target.value }))}
                  placeholder="e.g. 8"
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>

              {/* Col I: Unit Of Measurement */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Unit Of Measurement <span className="text-slate-400 font-normal">(Col I)</span>
                </label>
                <select
                  value={formState.unit}
                  onChange={(e) => setFormState((prev) => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                >
                  <option value="PCS">PCS</option>
                  <option value="Kgs">Kgs</option>
                  <option value="Ltrs">Ltrs</option>
                  <option value="Mtrs">Mtrs</option>
                  <option value="Set">Set</option>
                  <option value="Nos">Nos</option>
                </select>
              </div>

              {/* Col J: Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Reason for Issue <span className="text-slate-400 font-normal">(Col J)</span>
                </label>
                <input
                  type="text"
                  value={formState.reason}
                  onChange={(e) => setFormState((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason / Purpose"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            {/* Form Submit & Reset Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
              >
                Reset Fields
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Send className="w-4 h-4 text-emerald-400 shrink-0" /> Submit Store Out Entry to Sheet
              </button>
            </div>
          </form>
        )}
      </div>

      {/* HEADER TABS BAR FOR PENDING vs HISTORY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 rounded-xl shadow-2xs">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl shrink-0 sm:flex sm:items-center">
          <button
            onClick={() => setActiveTab('Pending')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'Pending' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Pending Issue
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-300">
              {pendingItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('History')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'History' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> Store Out History
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-200">
              {historyItems.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-semibold text-right sm:pr-2">
          Showing {activeTab === 'Pending' ? 'Pending Requests' : 'Issued History'} ({currentTableData.length} Items)
        </span>
      </div>

      {/* TABLE DATA */}
      <DataTable
        columns={activeTab === 'Pending' ? pendingColumns : historyColumns}
        data={currentTableData}
        pageSize={8}
        emptyTitle={activeTab === 'Pending' ? 'No Pending Store Out Requests' : 'No Store Out History Yet'}
        emptyMessage={
          activeTab === 'Pending'
            ? 'All store out requests have been issued.'
            : 'No issued store out records found in the STORE OUT sheet tab.'
        }
      />

      {/* CONFIRM ISSUE MODAL */}
      {selectedIssueItem && (
        <Modal
          isOpen={!!selectedIssueItem}
          onClose={() => setSelectedIssueItem(null)}
          title={`Confirm Issue — ${selectedIssueItem.storeOutNo || selectedIssueItem.id}`}
          maxWidth="max-w-md"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setSelectedIssueItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmIssue(selectedIssueItem)}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" /> Confirm & Issue Item
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">Are you sure you want to issue this product from the store?</p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
              <div>Store Out No: <strong className="text-slate-900 font-bold">{selectedIssueItem.storeOutNo || selectedIssueItem.id}</strong></div>
              <div>Product Name: <strong className="text-slate-900 font-bold">{selectedIssueItem.productName}</strong></div>
              <div>Quantity: <strong className="text-emerald-700 font-bold">{selectedIssueItem.qty || selectedIssueItem.quantity} {selectedIssueItem.unit || selectedIssueItem.unitOfMeasurement || 'PCS'}</strong></div>
              <div>Indentor Name: <strong className="text-slate-900 font-semibold">{selectedIssueItem.indentorName || 'Pawan Tiwari'}</strong></div>
              <div>Department: <strong className="text-slate-900 font-semibold">{selectedIssueItem.department}</strong></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
