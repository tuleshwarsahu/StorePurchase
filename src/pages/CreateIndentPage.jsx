import React, { useState } from 'react';
import { User, Building2, Wrench, UserCheck, Package, Save, X, FileCheck, Plus, Trash2, Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';

export const CreateIndentPage = ({ onNavigate, onIndentCreated }) => {
  const { createIndent, addToast, currentUser } = useStore();

  // Shared Indent Meta Information (Cols C, D, E, F)
  const [metaData, setMetaData] = useState({
    indentorName: currentUser?.name || 'Rajesh Kumar',
    department: 'Mechanical Maintenance',
    areaOfMachine: '',
    groupHead: ''
  });

  // Multiple Material Items list for the SAME Indent ID
  const [items, setItems] = useState([
    {
      id: Date.now(),
      productName: '',
      quantity: '',
      unit: 'Kgs',
      productMakeSpecs: ''
    }
  ]);

  const [errors, setErrors] = useState({});

  const handleMetaChange = (field, value) => {
    setMetaData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (errors[`item_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: null }));
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        productName: '',
        quantity: '',
        unit: 'Kgs',
        productMakeSpecs: ''
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!metaData.indentorName.trim()) errs.indentorName = 'Indentor Name is required';
    if (!metaData.department.trim()) errs.department = 'Department is required';

    items.forEach((item, idx) => {
      if (!item.productName.trim()) {
        errs[`item_${idx}_productName`] = `Product Name is required for Item #${idx + 1}`;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        errs[`item_${idx}_quantity`] = `Valid Qty is required for Item #${idx + 1}`;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...metaData,
      items: items
    };

    const createdRecord = createIndent(payload);
    if (onIndentCreated) {
      onIndentCreated(createdRecord);
    } else {
      onNavigate('all-indents');
    }
  };

  const handleSaveDraft = () => {
    addToast('Draft Saved', 'Multi-item indent draft saved locally.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16 text-xs">
      <PageHeader
        title="Create New Indent (Multi-Item)"
        breadcrumbs={['Indent Management', 'Create Indent']}
        actions={
          <button
            onClick={() => onNavigate('all-indents')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: GENERAL INDENT INFORMATION */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-700" /> General Indent Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* 1. Indentor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Indentor Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={metaData.indentorName}
                  onChange={(e) => handleMetaChange('indentorName', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-slate-800 outline-none ${errors.indentorName ? 'border-rose-500' : 'border-slate-300'
                    }`}
                />
              </div>
              {errors.indentorName && <p className="text-[11px] text-rose-500 mt-1">{errors.indentorName}</p>}
            </div>

            {/* 2. Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={metaData.department}
                  onChange={(e) => handleMetaChange('department', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
                >
                  <option value="Mechanical Maintenance">Mechanical Maintenance</option>
                  <option value="Machining Division">Machining Division</option>
                  <option value="Plant Operations">Plant Operations</option>
                  <option value="Safety & Administration">Safety & Administration</option>
                  <option value="Electrical & Automation">Electrical & Automation</option>
                </select>
              </div>
            </div>

            {/* 3. Area Of Machine */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area Of Machine</label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={metaData.areaOfMachine}
                  onChange={(e) => handleMetaChange('areaOfMachine', e.target.value)}
                  placeholder="e.g. Rolling Mill #2 / Hopper 3"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
            </div>

            {/* 4. Group Head */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Group Head</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={metaData.groupHead}
                  onChange={(e) => handleMetaChange('groupHead', e.target.value)}
                  placeholder="e.g. D.K. Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: INDENT MATERIAL ITEMS (MULTI-ITEM CREATOR) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-700 shrink-0" /> Material Items List ({items.length} Item
              {items.length > 1 ? 's' : ''})
            </h3>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-800 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Another Item
            </button>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 transition-all relative hover:border-purple-300"
            >
              {/* Item Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-900 font-bold rounded-md text-xs border border-purple-200">
                  <Layers className="w-3.5 h-3.5" /> Item #{index + 1}
                </span>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Item
                  </button>
                )}
              </div>

              {/* Item Fields: Product Name, Qty, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2 md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      placeholder="e.g. HR Steel Plate 12mm Grade E250"
                      className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${errors[`item_${index}_productName`] ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                  </div>
                  {errors[`item_${index}_productName`] && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors[`item_${index}_productName`]}</p>
                  )}
                </div>

                {/* Qty */}
                <div className="sm:col-span-1 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="e.g. 500"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none ${errors[`item_${index}_quantity`] ? 'border-rose-500' : 'border-slate-300'
                      }`}
                  />
                  {errors[`item_${index}_quantity`] && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors[`item_${index}_quantity`]}</p>
                  )}
                </div>

                {/* Unit of Measurement */}
                <div className="sm:col-span-1 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of measurement</label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
                  >
                    <option value="Kgs">Kgs</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="MT">MT (Metric Tons)</option>
                    <option value="Liters">Liters</option>
                    <option value="Barrels">Barrels</option>
                    <option value="Meters">Meters</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>
              </div>

              {/* Product Make Name / Specifications */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Make Name / Specifications
                </label>
                <textarea
                  rows="2"
                  value={item.productMakeSpecs}
                  onChange={(e) => handleItemChange(index, 'productMakeSpecs', e.target.value)}
                  placeholder="e.g. Tata Steel / Jindal OEM grade ISMB 200..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs hover:bg-slate-200 transition-colors border border-slate-300"
          >
            <Plus className="w-4 h-4" /> Add Another Item
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate('all-indents')}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md transition-all"
            >
              <FileCheck className="w-4 h-4 text-teal-400" /> Create Indent ({items.length} Item
              {items.length > 1 ? 's' : ''})
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
