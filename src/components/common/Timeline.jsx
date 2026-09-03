import React from 'react';
import { Check, Clock, AlertTriangle, ArrowDown, ArrowRight } from 'lucide-react';

export const Timeline = ({ indent, layout = 'vertical' }) => {
  if (!indent) return null;

  // Determine stage states based on indent stage & status
  // Stages: 1. Indent Created, 2. Vendor Process, 3. Approval Queue, 4. Process Completed
  const getStageState = (stageKey) => {
    if (indent.status === 'Rejected') {
      if (stageKey === 'approval') return { status: 'rejected', label: 'Rejected' };
      if (stageKey === 'completed') return { status: 'failed', label: 'Process Terminated' };
    }

    if (indent.currentStage === 'Completed' || indent.status === 'Approved') {
      return { status: 'completed', label: 'Completed' };
    }

    switch (stageKey) {
      case 'created':
        return { status: 'completed', label: 'Completed' };

      case 'vendor':
        if (indent.currentStage === 'Vendor Process' || indent.currentStage === 'Quotation Collection') {
          return indent.delayDays > 0
            ? { status: 'delayed', label: 'Delayed' }
            : { status: 'in_progress', label: 'In Progress' };
        }
        if (['Approval Queue', 'Completed'].includes(indent.currentStage)) {
          return { status: 'completed', label: 'Completed' };
        }
        return { status: 'pending', label: 'Pending' };

      case 'approval':
        if (indent.currentStage === 'Approval Queue') {
          return { status: 'in_progress', label: 'Ready for Review' };
        }
        if (indent.currentStage === 'Completed') {
          return { status: 'completed', label: 'Approved' };
        }
        return { status: 'pending', label: 'Pending' };

      case 'completed':
        if (indent.currentStage === 'Completed') {
          return { status: 'completed', label: 'Completed' };
        }
        return { status: 'pending', label: 'Pending' };

      default:
        return { status: 'pending', label: 'Pending' };
    }
  };

  const stages = [
    {
      id: 'created',
      name: 'Indent Created',
      plannedDate: indent.createdDate,
      actualDate: indent.createdDate,
      state: getStageState('created'),
      assigned: indent.assignedTo || 'Initiator'
    },
    {
      id: 'vendor',
      name: indent.processType === 'Need More Vendor' ? 'Quotation Collection' : 'Vendor Offer Processing',
      plannedDate: indent.plannedVendorDate || '2026-08-28',
      actualDate: indent.actualVendorDate || (indent.currentStage === 'Approval Queue' ? '2026-08-30' : null),
      state: getStageState('vendor'),
      assigned: indent.assignedTo
    },
    {
      id: 'approval',
      name: 'Approval Queue Review',
      plannedDate: indent.plannedApprovalDate || '2026-08-31',
      actualDate: indent.actualApprovalDate,
      state: getStageState('approval'),
      assigned: indent.approvedBy || 'Procurement Approver'
    },
    {
      id: 'completed',
      name: 'Indent Fulfillment & PO',
      plannedDate: indent.requiredDate,
      actualDate: indent.status === 'Approved' ? (indent.approvedDate || '2026-09-01') : null,
      state: getStageState('completed'),
      assigned: 'Stores / Purchase Dept'
    }
  ];

  if (layout === 'horizontal') {
    return (
      <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">Process Timeline Progress</h4>
        <div className="flex items-start justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 z-0" />

          {stages.map((stage, idx) => {
            const isCompleted = stage.state.status === 'completed';
            const isInProgress = stage.state.status === 'in_progress';
            const isDelayed = stage.state.status === 'delayed';
            const isRejected = stage.state.status === 'rejected';

            let nodeStyle = 'bg-white border-2 border-slate-300 text-slate-400';
            if (isCompleted) nodeStyle = 'bg-emerald-600 border-2 border-emerald-600 text-white';
            if (isInProgress) nodeStyle = 'bg-blue-600 border-2 border-blue-600 text-white ring-4 ring-blue-100';
            if (isDelayed) nodeStyle = 'bg-rose-600 border-2 border-rose-600 text-white ring-4 ring-rose-100';
            if (isRejected) nodeStyle = 'bg-slate-700 border-2 border-slate-700 text-white';

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center text-center max-w-[180px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${nodeStyle}`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isDelayed ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  ) : isInProgress ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-900 mt-2">{stage.name}</span>

                <div className="mt-1 space-y-0.5 text-[11px]">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 mb-1">
                    {stage.state.label}
                  </span>
                  <div className="text-slate-500">Planned: <span className="font-medium text-slate-700">{stage.plannedDate}</span></div>
                  <div className="text-slate-500">
                    Actual: <span className="font-medium text-slate-700">{stage.actualDate || '--'}</span>
                  </div>
                  {isDelayed && indent.delayDays > 0 && (
                    <div className="text-rose-600 font-semibold text-[10px]">Delay: {indent.delayDays} Days</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Workflow Process Timeline</h4>
        {indent.delayDays > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Delayed by {indent.delayDays} Days
          </span>
        )}
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200">
        {stages.map((stage, idx) => {
          const isCompleted = stage.state.status === 'completed';
          const isInProgress = stage.state.status === 'in_progress';
          const isDelayed = stage.state.status === 'delayed';
          const isRejected = stage.state.status === 'rejected';

          let nodeStyle = 'bg-white border-2 border-slate-300 text-slate-400';
          if (isCompleted) nodeStyle = 'bg-emerald-600 border-2 border-emerald-600 text-white';
          if (isInProgress) nodeStyle = 'bg-blue-600 border-2 border-blue-600 text-white ring-4 ring-blue-100';
          if (isDelayed) nodeStyle = 'bg-rose-600 border-2 border-rose-600 text-white ring-4 ring-rose-100';
          if (isRejected) nodeStyle = 'bg-rose-600 border-2 border-rose-600 text-white';

          return (
            <div key={stage.id} className="relative flex items-start gap-4 pl-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${nodeStyle}`}>
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isDelayed ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="flex-1 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-slate-900">{stage.name}</h5>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isInProgress
                        ? 'bg-blue-100 text-blue-800'
                        : isDelayed
                        ? 'bg-rose-100 text-rose-800 font-semibold'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {stage.state.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-500">Planned Date:</span>{' '}
                    <span className="font-semibold text-slate-700">{stage.plannedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Actual Date:</span>{' '}
                    <span className="font-semibold text-slate-700">{stage.actualDate || 'Not Completed'}</span>
                  </div>
                </div>

                {stage.assigned && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    Assigned: <span className="text-slate-700 font-medium">{stage.assigned}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
