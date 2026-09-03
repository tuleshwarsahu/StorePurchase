import React, { useState, useMemo } from 'react';
import { Store, Layers, Plus, Trash2, CheckCircle2, ArrowRight, X, Send, StoreIcon, Layers3, Package, Check, Clock, History } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const VendorManagementPage = ({ initialOpenItem, defaultCategory = 'All' }) => {
  const { indents, saveRegularVendorOffer, addVendorQuotation, removeVendorQuotation, completeVendorCollection, addToast } = useStore();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [activeCategory, setActiveCategory] = useState(defaultCategory); // 'All', 'Regular Vendor', 'Need More Vendor'
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0); // Active tab for per-item vendor details entry
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form state for Regular Vendor offer
  const [regularForm, setRegularForm] = useState({
    vendorName: '',
    rate: '',
    paymentTerm: 'Net 30 Days',
    unit: 'Pcs',
    remarks: ''
  });

  // Form state for Need More Vendor quotation
  const [multiQuoteForm, setMultiQuoteForm] = useState({
    vendorName: '',
    rate: '',
    paymentTerm: 'Net 30 Days',
    unit: 'Pcs'
  });

  const [formErrors, setFormErrors] = useState({});

  // Helper to check if an item has completed vendor process (Column O / Actual 2 or Column R / Actual 3 is not null)
  const isHistoryItem = (item) => {
    const hasActual2 = !!(item.actual2 && String(item.actual2).trim() !== '');
    const hasActual3 = !!(item.actual3 && String(item.actual3).trim() !== '');
    const isCompletedStage = item.currentStage === 'Approval Queue' || item.status === 'Ready for Approval' || item.status === 'Approved';
    return hasActual2 || hasActual3 || isCompletedStage;
  };

  // Separate indents into Pending vs History
  const { pendingIndents, historyIndents } = useMemo(() => {
    const pending = [];
    const history = [];

    indents.forEach((item) => {
      const pType = typeof item.processType === 'string' ? item.processType : (item.processType?.processType || '');
      if (!pType) return; // Must have a processType selected

      if (isHistoryItem(item)) {
        history.push(item);
      } else {
        pending.push(item);
      }
    });

    return { pendingIndents: pending, historyIndents: history };
  }, [indents]);

  // Distinct group counters for header tabs
  const groupPendingCount = useMemo(() => {
    const set = new Set();
    pendingIndents.forEach((item) => {
      const pType = typeof item.processType === 'string' ? item.processType : (item.processType?.processType || 'Regular Vendor');
      set.add(`${item.id}_${pType}`);
    });
    return set.size;
  }, [pendingIndents]);

  const groupHistoryCount = useMemo(() => {
    const set = new Set();
    historyIndents.forEach((item) => {
      const pType = typeof item.processType === 'string' ? item.processType : (item.processType?.processType || 'Regular Vendor');
      set.add(`${item.id}_${pType}`);
    });
    return set.size;
  }, [historyIndents]);

  // Target indents for active main tab (Pending vs History)
  const targetTabIndents = activeTab === 'Pending' ? pendingIndents : historyIndents;

  // Filter target indents by active category ('All', 'Regular Vendor', 'Need More Vendor')
  const categorisedIndents = useMemo(() => {
    return targetTabIndents.filter((item) => {
      const type = typeof item.processType === 'string' ? item.processType : (item.processType?.processType || '');
      if (activeCategory === 'Regular Vendor') return type === 'Regular Vendor';
      if (activeCategory === 'Need More Vendor') return type === 'Need More Vendor';
      return true; // 'All'
    });
  }, [targetTabIndents, activeCategory]);

  // Group categorised indents by (Indent ID + Vendor Process Type)
  const groupedCategorisedIndents = useMemo(() => {
    const map = {};
    categorisedIndents.forEach((item) => {
      const pType = typeof item.processType === 'string' ? item.processType : (item.processType?.processType || 'Regular Vendor');
      const groupKey = `${item.id}_${pType}`;

      if (!map[groupKey]) {
        map[groupKey] = {
          groupKey: groupKey,
          id: item.id,
          indentorName: item.indentorName || item.assignedTo || 'Rajesh Kumar',
          department: item.department || 'Stores',
          areaOfMachine: item.areaOfMachine || '',
          groupHead: item.groupHead || '',
          processType: pType,
          items: []
        };
      }
      map[groupKey].items.push(item);
    });
    return Object.values(map);
  }, [categorisedIndents]);

  const activeGroup = useMemo(() => {
    if (!selectedGroupKey) return null;
    return groupedCategorisedIndents.find((g) => g.groupKey === selectedGroupKey) || null;
  }, [groupedCategorisedIndents, selectedGroupKey]);

  const activeSelectedItem = useMemo(() => {
    if (!activeGroup || !activeGroup.items || activeGroup.items.length === 0) return null;
    const baseItem = activeGroup.items[selectedItemIndex] || activeGroup.items[0];
    if (!baseItem) return null;

    // Direct live lookup from indents store array
    const liveMatch = indents.find((i) =>
      i.id === activeGroup.id &&
      String(i.productName || '').trim().toLowerCase() === String(baseItem.productName || '').trim().toLowerCase()
    );
    return liveMatch || baseItem;
  }, [indents, activeGroup, selectedItemIndex]);

  const handleSelectGroupForProcessing = (group) => {
    setSelectedGroupKey(group.groupKey);
    setSelectedItemIndex(0);
    setFormErrors({});

    const firstItem = group.items[0] || {};
    if (group.processType === 'Need More Vendor') {
      setMultiQuoteForm({
        vendorName: '',
        rate: '',
        paymentTerm: 'Net 30 Days',
        unit: firstItem?.unit || 'Pcs'
      });
    } else {
      setRegularForm({
        vendorName: '',
        rate: '',
        paymentTerm: 'Net 30 Days',
        unit: firstItem?.unit || 'Pcs',
        remarks: ''
      });
    }
  };

  const handleCloseForm = () => {
    setSelectedGroupKey(null);
    setSelectedItemIndex(0);
    setFormErrors({});
  };

  // Submit Regular Vendor offer for selected item / group
  const handleSubmitRegularOffer = (e) => {
    e.preventDefault();
    const errs = {};
    if (!regularForm.vendorName.trim()) errs.vendorName = 'Vendor name is required';
    if (!regularForm.rate || Number(regularForm.rate) <= 0) errs.rate = 'Valid unit rate is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    if (activeGroup?.id) {
      saveRegularVendorOffer(activeGroup.id, regularForm, activeSelectedItem?.productName);
    }
    handleCloseForm();
  };

  // Add Multi Vendor quotation specifically for the selected item
  const handleAddMultiQuote = (shouldClear = true) => {
    const errs = {};
    if (!multiQuoteForm.vendorName.trim()) errs.vendorName = 'Vendor name is required';
    if (!multiQuoteForm.rate || Number(multiQuoteForm.rate) <= 0) errs.rate = 'Valid rate is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    if (activeGroup?.id) {
      addVendorQuotation(activeGroup.id, multiQuoteForm, activeSelectedItem?.productName);
    }

    if (shouldClear) {
      setMultiQuoteForm({
        vendorName: '',
        rate: '',
        paymentTerm: 'Net 30 Days',
        unit: activeSelectedItem?.unit || 'Pcs'
      });
      setFormErrors({});
    }
  };

  // Complete Multi Vendor collection
  const handleCompleteMultiCollection = () => {
    const totalQuotes = activeGroup?.items.reduce((acc, it) => acc + (it.vendorQuotations || []).length, 0);

    if (totalQuotes === 0) {
      addToast('Add At Least 1 Quotation', 'Please add at least one vendor quotation for material items before completing collection.', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCompleteMulti = () => {
    if (activeGroup?.id) {
      completeVendorCollection(activeGroup.id);
    }
    setShowConfirmModal(false);
    handleCloseForm();
  };

  const tableColumns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => (
        <span className="font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
          <Layers className="w-4 h-4 text-purple-700 shrink-0" />
          {row.id}
        </span>
      )
    },
    {
      header: 'Material Items List',
      cell: (row) => (
        <div className="space-y-1 max-w-xs sm:max-w-md">
          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold rounded">
            {row.items.length} Item{row.items.length > 1 ? 's' : ''} ({row.processType})
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
      header: 'Vendor Process Type',
      accessor: 'processType',
      cell: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
            row.processType === 'Need More Vendor'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-teal-100 text-teal-800 border border-teal-200'
          }`}
        >
          {row.processType}
        </span>
      )
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleSelectGroupForProcessing(row)}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs whitespace-nowrap ${
            activeTab === 'History'
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {activeTab === 'History' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> View Offers ({row.items.length})
            </>
          ) : row.processType === 'Need More Vendor' ? (
            <>
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Manage Quotes ({row.items.length})
            </>
          ) : (
            <>
              <Store className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Enter Rate Offer ({row.items.length})
            </>
          )}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-12 text-xs">
      {/* HEADER WITH SIDE TABS FOR PENDING & HISTORY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-5 rounded-2xl shadow-2xs">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0" />
            Vendor Workspace
          </h1>
        </div>

        {/* PENDING AND HISTORY TABS WITH ROW COUNTERS */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-xl shrink-0 sm:flex sm:items-center">
          <button
            onClick={() => {
              setActiveTab('Pending');
              handleCloseForm();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'Pending' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Pending</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'Pending' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {groupPendingCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('History');
              handleCloseForm();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'History' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>History</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'History' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {groupHistoryCount}
            </span>
          </button>
        </div>
      </div>

      {/* CATEGORY TABS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 rounded-xl shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => {
              setActiveCategory('All');
              handleCloseForm();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers3 className="w-3.5 h-3.5 shrink-0" /> All ({categorisedIndents.length})
          </button>

          <button
            onClick={() => {
              setActiveCategory('Regular Vendor');
              handleCloseForm();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'Regular Vendor' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" /> Regular Offers
          </button>

          <button
            onClick={() => {
              setActiveCategory('Need More Vendor');
              handleCloseForm();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'Need More Vendor' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" /> Multi Bids
          </button>
        </div>

        <span className="text-xs text-slate-500 font-semibold text-right sm:pr-2">
          {groupedCategorisedIndents.length} Indent Group{groupedCategorisedIndents.length > 1 ? 's' : ''} ({activeTab})
        </span>
      </div>

      {/* INDENTS TABLE FOR CATEGORY */}
      <DataTable
        columns={tableColumns}
        data={groupedCategorisedIndents}
        pageSize={8}
        emptyTitle="No Indents in this Category"
        emptyMessage="No active purchase indents match the selected category filter."
      />

      {/* POPUP MODAL WINDOW FOR VENDOR QUOTE & RATE SELECTION */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up text-xs">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-5 bg-slate-50 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeGroup.processType === 'Need More Vendor'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {activeGroup.processType}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Workspace - Indent {activeGroup.id} ({activeGroup.items.length} Items)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Select item tab below to enter vendor offers & quotations individually.
                </p>
              </div>

              <button
                onClick={handleCloseForm}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* ITEM SELECTOR TABS BAR (PER-ITEM VENDOR DETAILS SELECTION) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Item to Fill Vendor Details:
                </label>

                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                  {activeGroup.items.map((it, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedItemIndex(idx);
                        setMultiQuoteForm((prev) => ({ ...prev, unit: it.unit || 'Pcs' }));
                        setRegularForm((prev) => ({ ...prev, unit: it.unit || 'Pcs' }));
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedItemIndex === idx
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Package className={`w-3.5 h-3.5 shrink-0 ${selectedItemIndex === idx ? 'text-teal-400' : 'text-purple-600'}`} />
                      <span className="truncate max-w-[140px] sm:max-w-none">Item #{idx + 1}: {it.productName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-800/20 rounded font-normal shrink-0">
                        {it.quantity} {it.unit || 'Pcs'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIVE SELECTED ITEM DETAILS CARD */}
              {activeSelectedItem && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-900 text-[11px] font-bold rounded">
                      Active Item: #{selectedItemIndex + 1}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      Indent ID: <strong className="text-slate-900">{activeGroup.id}</strong>
                    </span>
                  </div>

                  <div className="text-sm sm:text-base font-bold text-slate-900">{activeSelectedItem.productName}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-600 pt-2 border-t border-purple-200/60">
                    <div>Quantity: <strong className="text-slate-900">{activeSelectedItem.quantity} {activeSelectedItem.unit || 'Pcs'}</strong></div>
                    <div>Department: <strong className="text-slate-900">{activeGroup.department}</strong></div>
                    <div>Indentor: <strong className="text-slate-900">{activeGroup.indentorName}</strong></div>
                    <div>Specs: <strong className="text-slate-900">{activeSelectedItem.productMakeSpecs || 'N/A'}</strong></div>
                  </div>
                </div>
              )}

              {/* FORM TYPE 1: REGULAR VENDOR SINGLE OFFER FORM */}
              {activeGroup.processType !== 'Need More Vendor' ? (
                <form onSubmit={handleSubmitRegularOffer} className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Rate Entry for Item: "{activeSelectedItem?.productName}"
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vendor Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={regularForm.vendorName}
                        onChange={(e) => setRegularForm({ ...regularForm, vendorName: e.target.value })}
                        placeholder="e.g. SKF Bearings India Ltd"
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${
                          formErrors.vendorName ? 'border-rose-500' : 'border-slate-300'
                        }`}
                      />
                      {formErrors.vendorName && <p className="text-[11px] text-rose-500 mt-1">{formErrors.vendorName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quoted Unit Rate (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={regularForm.rate}
                        onChange={(e) => setRegularForm({ ...regularForm, rate: e.target.value })}
                        placeholder="e.g. 1850"
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${
                          formErrors.rate ? 'border-rose-500' : 'border-slate-300'
                        }`}
                      />
                      {formErrors.rate && <p className="text-[11px] text-rose-500 mt-1">{formErrors.rate}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Term</label>
                      <select
                        value={regularForm.paymentTerm}
                        onChange={(e) => setRegularForm({ ...regularForm, paymentTerm: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
                      >
                        <option value="Net 30 Days">Net 30 Days Credit</option>
                        <option value="Net 15 Days">Net 15 Days Credit</option>
                        <option value="100% Advance">100% Advance Payment</option>
                        <option value="50% Advance, 50% Delivery">50% Advance, 50% Delivery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                      <input
                        type="text"
                        value={regularForm.unit}
                        onChange={(e) => setRegularForm({ ...regularForm, unit: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Warranty Details</label>
                    <textarea
                      rows="2"
                      value={regularForm.remarks}
                      onChange={(e) => setRegularForm({ ...regularForm, remarks: e.target.value })}
                      placeholder="e.g. Original OEM grade item with test certificate..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Submit Regular Offer
                    </button>
                  </div>
                </form>
              ) : (
                /* FORM TYPE 2: NEED MORE VENDOR MULTI QUOTE WORKSPACE PER ITEM */
                <div className="space-y-5">
                  {/* Collected Quotations List for Selected Item */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Collected Quotations for "{activeSelectedItem?.productName}" ({(activeSelectedItem?.vendorQuotations || []).length})
                    </h4>

                    {(activeSelectedItem?.vendorQuotations || []).length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 font-semibold uppercase">
                              <th className="py-2.5 px-3">Vendor Name</th>
                              <th className="py-2.5 px-3">Rate (₹)</th>
                              <th className="py-2.5 px-3">Payment Term</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(activeSelectedItem?.vendorQuotations || []).map((q) => (
                              <tr key={q.id || Math.random()} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{q.vendorName}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">₹{Number(q.rate || 0).toLocaleString()} / {q.unit || 'Pcs'}</td>
                                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{q.paymentTerm}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => removeVendorQuotation(activeGroup.id, q.id, activeSelectedItem?.productName, q.vendorName)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        No vendor quotations added yet for "{activeSelectedItem?.productName}". Use form below to record vendor bids.
                      </p>
                    )}
                  </div>

                  {/* Add New Vendor Form for Selected Item */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-purple-600 shrink-0" /> Add Supplier Quotation
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Vendor Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={multiQuoteForm.vendorName}
                          onChange={(e) => setMultiQuoteForm({ ...multiQuoteForm, vendorName: e.target.value })}
                          placeholder="e.g. Jindal Steel Ltd"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${
                            formErrors.vendorName ? 'border-rose-500' : 'border-slate-300'
                          }`}
                        />
                        {formErrors.vendorName && <p className="text-[11px] text-rose-500 mt-1">{formErrors.vendorName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Quoted Rate (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={multiQuoteForm.rate}
                          onChange={(e) => setMultiQuoteForm({ ...multiQuoteForm, rate: e.target.value })}
                          placeholder="e.g. 34500"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${
                            formErrors.rate ? 'border-rose-500' : 'border-slate-300'
                          }`}
                        />
                        {formErrors.rate && <p className="text-[11px] text-rose-500 mt-1">{formErrors.rate}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Term</label>
                        <select
                          value={multiQuoteForm.paymentTerm}
                          onChange={(e) => setMultiQuoteForm({ ...multiQuoteForm, paymentTerm: e.target.value })}
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
                          value={multiQuoteForm.unit}
                          onChange={(e) => setMultiQuoteForm({ ...multiQuoteForm, unit: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAddMultiQuote(false)}
                        className="px-3.5 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors text-center"
                      >
                        Save & Add Another Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddMultiQuote(true)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs text-center"
                      >
                        Add Quotation for Item #{selectedItemIndex + 1}
                      </button>
                    </div>
                  </div>

                  {/* Complete Action Footer */}
                  <div className="flex items-center justify-end border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={handleCompleteMultiCollection}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-lg hover:bg-purple-800 transition-all shadow-md"
                    >
                      <Send className="w-4 h-4 shrink-0" /> Complete Vendor Collection & Send to Approval
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCompleteMulti}
        title="Complete Vendor Collection"
        message={`Are you sure required vendor quotations have been collected for Indent ${activeGroup?.id}? This will move all ${activeGroup?.items.length} items in this group to the Approval Queue.`}
        confirmText="Complete Collection"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};
