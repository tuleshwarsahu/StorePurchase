import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, FileCheck, Layers } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  switch (status) {
    case 'Approved':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      Icon = CheckCircle2;
      break;
    case 'Rejected':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      Icon = XCircle;
      break;
    case 'Delayed':
      badgeStyle = 'bg-red-100 text-red-800 border-red-300 font-semibold animate-pulse';
      Icon = AlertTriangle;
      break;
    case 'Ready for Approval':
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium';
      Icon = FileCheck;
      break;
    case 'Vendor Collection':
    case 'Quotation Collection':
      badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
      Icon = Layers;
      break;
    case 'In Progress':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      Icon = RefreshCw;
      break;
    case 'Pending':
    default:
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      Icon = Clock;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${badgeStyle}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  let color = 'bg-slate-100 text-slate-700';
  if (priority === 'Urgent') color = 'bg-red-600 text-white font-semibold';
  else if (priority === 'High') color = 'bg-amber-100 text-amber-800 font-medium';
  else if (priority === 'Medium') color = 'bg-blue-50 text-blue-700';
  else if (priority === 'Low') color = 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase tracking-wide ${color}`}>
      {priority}
    </span>
  );
};
