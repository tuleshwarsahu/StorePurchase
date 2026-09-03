import React, { useState } from 'react';
import { Store, Layers, CheckCircle2, ArrowRight, Layers3, CheckSquare, Square, Check, RefreshCw, Package } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

export const ProcessSelectionPage = ({ indent, onSelectProcess, onNavigate }) => {
  if (!indent) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No indent selected for process stage.</p>
        <button
          onClick={() => onNavigate('all-indents')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold"
        >
          Go to All Indents
        </button>
      </div>
    );
  }

  // Normalize items array
  const itemsList = indent.items && Array.isArray(indent.items) && indent.items.length > 0
    ? indent.items
    : [indent];

  // Initialize per-item process type selections (Default: 'Need More Vendor')
  const [selections, setSelections] = useState(() => {
    const initial = {};
    itemsList.forEach((_, idx) => {
      initial[idx] = 'Need More Vendor';
    });
    return initial;
  });

  // Track checked items for processing
  const [checkedIndexes, setCheckedIndexes] = useState(() => itemsList.map((_, idx) => idx));

  const toggleCheckAll = () => {
    if (checkedIndexes.length === itemsList.length) {
      setCheckedIndexes([]);
    } else {
      setCheckedIndexes(itemsList.map((_, idx) => idx));
    }
  };

  const toggleCheckItem = (index) => {
    if (checkedIndexes.includes(index)) {
      setCheckedIndexes((prev) => prev.filter((i) => i !== index));
    } else {
      setCheckedIndexes((prev) => [...prev, index]);
    }
  };

  const handleProcessChange = (index, value) => {
    setSelections((prev) => ({ ...prev, [index]: value }));
  };

  const handleBulkSetProcess = (value) => {
    setSelections((prev) => {
      const updated = { ...prev };
      checkedIndexes.forEach((idx) => {
        updated[idx] = value;
      });
      return updated;
    });
  };

  const handleSaveSelections = () => {
    const payload = itemsList
      .filter((_, idx) => checkedIndexes.includes(idx))
      .map((item, idx) => ({
        productName: item.productName,
        processType: selections[idx] || 'Need More Vendor'
      }));

    onSelectProcess(indent.id, payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      <PageHeader
        title={`Process Stage Selection - Indent ${indent.id}`}
        breadcrumbs={['Indent Management', 'Pending Processes', 'Process Selection']}
      />

      {/* Success Notification Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-emerald-900">
            Indent {indent.id} Created with {itemsList.length} Material Item(s)!
          </h3>
          <p className="text-xs text-emerald-700 mt-0.5">
            Assign individual procurement process pathways (Regular Vendor vs Need More Vendor) for each material item under this Indent Number.
          </p>
        </div>
      </div>

      {/* Indent Meta Summary Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-purple-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-700" /> Target Indent ID: {indent.id}
          </h4>
          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-full text-[11px]">
            {itemsList.length} Material Item{itemsList.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 pt-2 border-t border-slate-100">
          <div>Indentor: <strong className="text-slate-900">{indent.indentorName || 'Rajesh Kumar'}</strong></div>
          <div>Department: <strong className="text-slate-900">{indent.department || 'Stores'}</strong></div>
          <div>Area: <strong className="text-slate-900">{indent.areaOfMachine || 'N/A'}</strong></div>
          <div>Group Head: <strong className="text-slate-900">{indent.groupHead || 'N/A'}</strong></div>
        </div>
      </div>

      {/* BULK ACTION CONTROL BAR */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={toggleCheckAll}
            className="flex items-center gap-1.5 hover:text-teal-300 transition-colors"
          >
            {checkedIndexes.length === itemsList.length ? (
              <CheckSquare className="w-4 h-4 text-teal-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({checkedIndexes.length}/{itemsList.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Bulk Set Selected Items:</span>
          <button
            type="button"
            onClick={() => handleBulkSetProcess('Regular Vendor')}
            className="px-3 py-1.5 bg-teal-600/30 text-teal-300 hover:bg-teal-600/50 border border-teal-500/40 rounded-lg text-xs font-bold transition-all"
          >
            Regular Vendor (Single Offer)
          </button>
          <button
            type="button"
            onClick={() => handleBulkSetProcess('Need More Vendor')}
            className="px-3 py-1.5 bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg text-xs font-bold transition-all"
          >
            Need More Vendor (Multi-Bids)
          </button>
        </div>
      </div>

      {/* MATERIAL ITEMS PROCESS SELECTION LIST */}
      <div className="space-y-3">
        {itemsList.map((item, idx) => {
          const isChecked = checkedIndexes.includes(idx);
          const currentType = selections[idx] || 'Need More Vendor';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isChecked ? 'bg-white border-purple-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Item Details */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCheckItem(idx)}
                    className="mt-0.5 text-slate-700 hover:text-purple-700 transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-purple-700" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.productName}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[11px]">
                        {item.quantity} {item.unit || 'Pcs'}
                      </span>
                    </div>
                    {item.productMakeSpecs && (
                      <p className="text-xs text-slate-500 mt-0.5">Specs: {item.productMakeSpecs}</p>
                    )}
                  </div>
                </div>

                {/* Per-Item Radio Selector */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 shrink-0">
                  <label
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                      currentType === 'Regular Vendor'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`process_${idx}`}
                      value="Regular Vendor"
                      checked={currentType === 'Regular Vendor'}
                      onChange={() => handleProcessChange(idx, 'Regular Vendor')}
                      className="sr-only"
                    />
                    <Store className="w-3.5 h-3.5" /> Regular Vendor
                  </label>

                  <label
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                      currentType === 'Need More Vendor'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`process_${idx}`}
                      value="Need More Vendor"
                      checked={currentType === 'Need More Vendor'}
                      onChange={() => handleProcessChange(idx, 'Need More Vendor')}
                      className="sr-only"
                    />
                    <Layers3 className="w-3.5 h-3.5" /> Need More Vendor
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onNavigate('pending-processes')}
          className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSaveSelections}
          disabled={checkedIndexes.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-md"
        >
          <Check className="w-4 h-4 text-teal-400" /> Save & Proceed Process Pathways ({checkedIndexes.length} Items)
        </button>
      </div>
    </div>
  );
};
