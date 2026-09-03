import React from 'react';
import { ArrowLeft, Edit3, History, Calendar, Building2, Package, Layers, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { Timeline } from '../components/common/Timeline';

export const IndentDetailPage = ({ indent, onBack, onNavigate }) => {
  if (!indent) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      <PageHeader
        title={`Purchase Indent Detail - ${indent.id}`}
        breadcrumbs={['Indent Management', 'All Indents', indent.id]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to List
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              <History className="w-4 h-4" /> View Full History Log
            </button>
          </div>
        }
      />

      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{indent.id}</h2>
              <StatusBadge status={indent.status} />
              <PriorityBadge priority={indent.priority} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Process Pathway: <strong className="text-slate-800">{indent.processType}</strong> • Current Stage:{' '}
              <strong className="text-slate-800">{indent.currentStage}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {indent.status === 'Ready for Approval' && (
              <button
                onClick={() => onNavigate('approval-queue')}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Go to Approval Queue
              </button>
            )}
          </div>
        </div>

        {/* 5 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Product Name</span>
            <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={indent.productName}>
              {indent.productName}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Department</span>
            <p className="text-xs font-bold text-slate-900 mt-1 truncate">{indent.department}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Quantity</span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              {indent.quantity.toLocaleString()} {indent.unit}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Required Date</span>
            <p className="text-xs font-bold text-slate-900 mt-1">{indent.requiredDate}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Created Date</span>
            <p className="text-xs font-bold text-slate-900 mt-1">{indent.createdDate}</p>
          </div>
        </div>

        {/* Technical Description */}
        {indent.description && (
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
            <span className="font-bold text-slate-800">Description / Technical Specifications:</span>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{indent.description}</p>
          </div>
        )}
      </div>

      {/* PROCESS TIMELINE (Major Visual Component) */}
      <Timeline indent={indent} layout="vertical" />

      {/* Vendor & Quotation Summary Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
          Vendor & Quotation Details
        </h3>

        {indent.processType === 'Regular Vendor' ? (
          indent.regularVendorOffer ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{indent.regularVendorOffer.vendorName}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Regular Vendor</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                <div>
                  <span className="text-slate-500">Offered Rate:</span>{' '}
                  <strong className="text-slate-900">₹{indent.regularVendorOffer.rate.toLocaleString()} / {indent.regularVendorOffer.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Payment Term:</span>{' '}
                  <strong className="text-slate-900">{indent.regularVendorOffer.paymentTerm}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Submitted On:</span>{' '}
                  <strong className="text-slate-900">{indent.regularVendorOffer.submittedAt}</strong>
                </div>
              </div>
              {indent.regularVendorOffer.remarks && (
                <p className="text-slate-600 italic border-t border-slate-200 pt-2 mt-2">
                  "{indent.regularVendorOffer.remarks}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No regular vendor offer recorded yet.</p>
          )
        ) : indent.vendorQuotations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold uppercase">
                  <th className="py-2.5 px-3 border-b">Vendor Name</th>
                  <th className="py-2.5 px-3 border-b">Rate (₹)</th>
                  <th className="py-2.5 px-3 border-b">Payment Term</th>
                  <th className="py-2.5 px-3 border-b">Date Added</th>
                  <th className="py-2.5 px-3 border-b">Selection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {indent.vendorQuotations.map((q) => {
                  const isSelected = indent.selectedVendor === q.vendorName;
                  return (
                    <tr key={q.id} className={isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{q.vendorName}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-bold">₹{q.rate.toLocaleString()} / {q.unit}</td>
                      <td className="py-2.5 px-3 text-slate-600">{q.paymentTerm}</td>
                      <td className="py-2.5 px-3 text-slate-500">{q.addedOn}</td>
                      <td className="py-2.5 px-3">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                            <UserCheck className="w-3 h-3" /> Selected Vendor
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Quoted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No vendor quotations added yet.</p>
        )}

        {/* Approver Remarks */}
        {indent.approverRemarks && (
          <div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-700" /> Approver Decision Log
            </div>
            <p className="text-slate-700 leading-relaxed pt-1">"{indent.approverRemarks}"</p>
            <p className="text-[11px] text-slate-500 pt-1">
              Decision by: <strong className="text-slate-800">{indent.approvedBy || 'Approver'}</strong> on{' '}
              {indent.approvedDate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
