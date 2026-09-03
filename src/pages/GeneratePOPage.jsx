import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle2, ShoppingBag, Calendar, ArrowRight, Printer, Sparkles, AlertCircle, Layers, Edit3, DollarSign, UserCheck, Clock, History } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const GeneratePOPage = () => {
  const { indents, approvedIndents, generatePO } = useStore();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Manual PO Number input field state
  const [poNumberInput, setPoNumberInput] = useState('');

  // Filter approved indents directly from APPROVE INDENT sheet tab
  const displayApprovedIndents = useMemo(() => {
    return (approvedIndents && approvedIndents.length > 0)
      ? approvedIndents
      : indents.filter((i) => i.status === 'Approved' && (i.selectedVendor || i.vendorName));
  }, [approvedIndents, indents]);

  // Helper to check if PO Number has been generated
  const isPoGenerated = (item) => {
    return !!(item.poNumber && String(item.poNumber).trim() !== '');
  };

  // Separate approved indents into Pending vs History based on PO Number generation
  const { pendingPoIndents, historyPoIndents } = useMemo(() => {
    const pending = [];
    const history = [];

    displayApprovedIndents.forEach((item) => {
      if (isPoGenerated(item)) {
        history.push(item);
      } else {
        pending.push(item);
      }
    });

    return { pendingPoIndents: pending, historyPoIndents: history };
  }, [displayApprovedIndents]);

  const currentTabIndents = activeTab === 'Pending' ? pendingPoIndents : historyPoIndents;

  const handleOpenPoModal = (item) => {
    setSelectedIndent(item);

    // Default sequential PO Number calculation if not already assigned
    let defaultPoNo = item.poNumber || '';
    if (!defaultPoNo) {
      let maxPoSeq = 0;
      displayApprovedIndents.forEach((i) => {
        if (i.poNumber && i.poNumber.startsWith('PO/2026/')) {
          const num = parseInt(i.poNumber.replace('PO/2026/', ''), 10);
          if (!isNaN(num)) maxPoSeq = Math.max(maxPoSeq, num);
        }
      });
      defaultPoNo = `PO/2026/${String(maxPoSeq + 1).padStart(4, '0')}`;
    }

    setPoNumberInput(defaultPoNo);
    setIsPoModalOpen(true);
  };

  const handleClosePoModal = () => {
    setIsPoModalOpen(false);
    setSelectedIndent(null);
  };

  const handleGenerateClick = () => {
    setShowConfirmModal(true);
  };

  const confirmGeneratePO = () => {
    if (selectedIndent) {
      const vendorName = selectedIndent.vendorName || selectedIndent.selectedVendor || '';
      const rate = selectedIndent.rate || 0;
      generatePO(selectedIndent.id, poNumberInput, rate, vendorName);
      setShowConfirmModal(false);
      handleClosePoModal();
    }
  };

  const columns = [
    {
      header: 'Store Indent No.',
      accessor: 'id',
      cell: (row) => <span className="font-bold text-slate-900 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Product Name',
      accessor: 'productName',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-semibold text-slate-900 leading-tight line-clamp-2">{row.productName}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="font-semibold text-slate-900 whitespace-nowrap">{row.department || 'Stores'}</span>
    },

    {
      header: 'Approved Vendor',
      cell: (row) => (
        <span className="font-bold text-slate-900 whitespace-nowrap">
          {row.vendorName || row.selectedVendor || (row.regularVendorOffer ? row.regularVendorOffer.vendorName : 'N/A')}
        </span>
      )
    },
    {
      header: 'Approved Rate (₹)',
      cell: (row) => {
        const rate = row.rate || (row.regularVendorOffer ? row.regularVendorOffer.rate : 0);
        return <span className="font-bold text-emerald-700 whitespace-nowrap">₹{Number(rate).toLocaleString()}</span>;
      }
    },
    {
      header: 'Quantity',
      cell: (row) => (
        <span className="font-bold text-slate-800 whitespace-nowrap">
          {Number(row.quantity || 0).toLocaleString()} {row.unit || 'Pcs'}
        </span>
      )
    },
    {
      header: 'PO Status & Number',
      cell: (row) => (
        row.poNumber ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 shrink-0" /> {row.poNumber}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Pending PO
          </span>
        )
      )
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => handleOpenPoModal(row)}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs whitespace-nowrap ${
            row.poNumber
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-purple-700 text-white hover:bg-purple-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          {row.poNumber ? 'View / Edit PO' : 'Generate PO'}
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
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0" />
            Generate Purchase Order (PO)
          </h1>
        </div>

        {/* PENDING AND HISTORY TABS WITH ROW COUNTERS */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-xl shrink-0 sm:flex sm:items-center">
          <button
            onClick={() => {
              setActiveTab('Pending');
              handleClosePoModal();
            }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'Pending' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Pending PO</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'Pending' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pendingPoIndents.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('History');
              handleClosePoModal();
            }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'History' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>PO History</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'History' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {historyPoIndents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Approved Indents Table */}
      <DataTable
        columns={columns}
        data={currentTabIndents}
        pageSize={8}
        emptyTitle={activeTab === 'Pending' ? 'No Approved Indents Pending PO' : 'No PO History Found'}
        emptyMessage={
          activeTab === 'Pending'
            ? 'There are currently no approved purchase indents in the APPROVE INDENT sheet tab waiting for PO generation.'
            : 'No PO generation history found (Column J is empty).'
        }
      />

      {/* PO PREVIEW & EDITABLE GENERATION MODAL */}
      {selectedIndent && (
        <Modal
          isOpen={isPoModalOpen}
          onClose={handleClosePoModal}
          title={selectedIndent.poNumber ? `Purchase Order Details - ${selectedIndent.poNumber}` : `Generate Purchase Order for ${selectedIndent.id}`}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
              <button
                type="button"
                onClick={handleClosePoModal}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
              >
                Close
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedIndent.poNumber && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-teal-400 shrink-0" /> Print PO
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGenerateClick}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-lg hover:bg-purple-800 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-purple-300 shrink-0" /> {selectedIndent.poNumber ? 'Update & Save PO' : 'Confirm & Save PO'}
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* PO FORM SECTION: MANUAL PO NUMBER + AUTO-FILLED VENDOR & AMOUNT */}
            <div className="bg-purple-50/80 border-2 border-purple-200 rounded-xl p-3.5 sm:p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs sm:text-sm">
                  <Edit3 className="w-4 h-4 text-purple-700 shrink-0" /> Purchase Order Creation Form
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Approved Vendor Data Auto-Filled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. MANUAL PO NUMBER INPUT FIELD */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                    PO Number <span className="text-red-500">* (Manual Input)</span>
                  </label>
                  <input
                    type="text"
                    value={poNumberInput}
                    onChange={(e) => setPoNumberInput(e.target.value)}
                    placeholder="Enter PO Number (e.g. PO/2026/0001)"
                    className="w-full px-3 py-2 bg-white border-2 border-purple-500 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-xs shadow-2xs"
                  />
                </div>

                {/* 2. AUTO-FILLED VENDOR NAME */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Approved Vendor (Auto-Filled)
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-bold text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{selectedIndent.vendorName || selectedIndent.selectedVendor || selectedIndent.regularVendorOffer?.vendorName || 'N/A'}</span>
                  </div>
                </div>

                {/* 3. AUTO-FILLED TOTAL AMOUNT */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Total Amount
                  </label>
                  <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-black text-xs flex items-center gap-1.5">
                    <span>
                      ₹{((Number(selectedIndent.rate || selectedIndent.regularVendorOffer?.rate || 0)) * (Number(selectedIndent.quantity || 0))).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ₹{Number(selectedIndent.rate || selectedIndent.regularVendorOffer?.rate || 0).toLocaleString()} × {selectedIndent.quantity || 0} {selectedIndent.unit || 'Pcs'}
                  </p>
                </div>
              </div>
            </div>

            {/* PO DOCUMENT PREVIEW CARD */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-md">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">PURCHASE ORDER</h2>
                  <p className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase mt-0.5">PURCHASE INDENT MANAGEMENT SYSTEM</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 bg-purple-900 text-white rounded font-bold text-xs">
                    {poNumberInput || 'DRAFT PO'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {/* Vendor & Indent Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">SUPPLIER / VENDOR DETAILS</h4>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    {selectedIndent.vendorName || selectedIndent.selectedVendor || selectedIndent.regularVendorOffer?.vendorName || 'N/A'}
                  </p>
                  <p className="text-slate-600 mt-0.5">Payment Term: <strong className="text-slate-800">{selectedIndent.paymentTerm || selectedIndent.regularVendorOffer?.paymentTerm || 'Net 30 Days'}</strong></p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">INDENT & SHIPMENT DETAILS</h4>
                  <p className="font-bold text-slate-900">Indent ID: {selectedIndent.id}</p>
                  <p className="text-slate-600">Department: <strong className="text-slate-800">{selectedIndent.department || 'Stores'}</strong></p>
                  <p className="text-slate-600">Indentor: <strong className="text-slate-800">{selectedIndent.indentorName || selectedIndent.assignedTo || selectedIndent.indentor}</strong></p>
                </div>
              </div>

              {/* Material Items Table */}
              <div className="border border-slate-300 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const rate = Number(selectedIndent.rate || selectedIndent.regularVendorOffer?.rate || 0);
                      const qty = Number(selectedIndent.quantity || 0);
                      const total = rate * qty;
                      return (
                        <tr>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900 whitespace-nowrap">{selectedIndent.productName}</p>
                            {selectedIndent.productMakeSpecs && (
                              <p className="text-[11px] text-slate-500 whitespace-nowrap">{selectedIndent.productMakeSpecs}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">{qty} {selectedIndent.unit || 'Pcs'}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">₹{rate.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-bold text-teal-800 text-xs sm:text-sm whitespace-nowrap">₹{total.toLocaleString()}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Sheet Target Column Notice */}
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between text-purple-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="text-[11px] sm:text-xs">
                    Saving will record <strong>Actual Timestamp</strong> in <strong>Col J</strong> and PO Number <code>{poNumberInput}</code> in <strong>Col K</strong> of the <code>APPROVE INDENT</code> Google Sheet tab.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmGeneratePO}
        title="Confirm Purchase Order Save"
        message={`Are you sure you want to save PO '${poNumberInput}' for indent ${selectedIndent?.id}? This will write Col J (Actual) & Col K (PO Number) in Google Sheets.`}
        confirmText="Save PO"
        cancelText="Cancel"
        type="success"
      />
    </div>
  );
};
