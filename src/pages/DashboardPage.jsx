import React from 'react';
import {
  Boxes,
  Clock,
  Store,
  Layers,
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Building2,
  PieChart,
  Calendar
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SummaryCard } from '../components/common/SummaryCard';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { PageHeader } from '../components/common/PageHeader';

export const DashboardPage = ({ onNavigate, onViewIndentDetail }) => {
  const { indents } = useStore();

  // Metrics calculation memoized for high performance
  const {
    totalIndents,
    pendingProcesses,
    regularVendorPending,
    needMoreVendorPending,
    pendingApprovals,
    approvedCount,
    rejectedCount,
    delayedCount,
    deptData,
    statusMap,
    attentionRequired,
    recentActivity
  } = React.useMemo(() => {
    const totalIndents = indents.length;
    const pendingProcesses = indents.filter((i) => i.currentStage === 'Vendor Process' || i.currentStage === 'Quotation Collection').length;
    const regularVendorPending = indents.filter((i) => i.processType === 'Regular Vendor' && i.currentStage === 'Vendor Process').length;
    const needMoreVendorPending = indents.filter((i) => i.processType === 'Need More Vendor' && (i.currentStage === 'Vendor Process' || i.currentStage === 'Quotation Collection')).length;
    const pendingApprovals = indents.filter((i) => i.currentStage === 'Approval Queue').length;
    const approvedCount = indents.filter((i) => i.status === 'Approved').length;
    const rejectedCount = indents.filter((i) => i.status === 'Rejected').length;
    const delayedCount = indents.filter((i) => i.delayDays > 0 || i.status === 'Delayed').length;

    const deptMap = {};
    indents.forEach((i) => {
      deptMap[i.department] = (deptMap[i.department] || 0) + 1;
    });
    const deptData = Object.entries(deptMap);

    const statusMap = {
      'In Progress': indents.filter((i) => i.status === 'In Progress').length,
      'Ready for Approval': indents.filter((i) => i.status === 'Ready for Approval').length,
      'Approved': approvedCount,
      'Rejected': rejectedCount,
      'Delayed': delayedCount
    };

    const attentionRequired = indents.filter((i) => i.delayDays > 0 || i.currentStage === 'Approval Queue' || i.status === 'Delayed');
    const recentActivity = [...indents].slice(0, 5);

    return {
      totalIndents,
      pendingProcesses,
      regularVendorPending,
      needMoreVendorPending,
      pendingApprovals,
      approvedCount,
      rejectedCount,
      delayedCount,
      deptData,
      statusMap,
      attentionRequired,
      recentActivity
    };
  }, [indents]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top Header */}
      <PageHeader
        title="Executive Procurement Dashboard"
        breadcrumbs={['Overview', 'Dashboard']}
        actions={
          <button
            onClick={() => onNavigate('create-indent')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-xs hover:bg-slate-800 transition-all shadow-xs"
          >
            + Create New Indent
          </button>
        }
      />

      {/* 1. Summary Cards (2 Columns per row on Mobile, 4 Columns on Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          icon={Boxes}
          value={totalIndents}
          label="Total Indents"
          trend="+14% MoM"
          trendType="up"
          onClick={() => onNavigate('all-indents')}
        />
        <SummaryCard
          icon={Clock}
          value={pendingProcesses}
          label="Pending Processes"
          trend="Action Required"
          trendType="warning"
          onClick={() => onNavigate('pending-processes')}
        />
        <SummaryCard
          icon={Store}
          value={regularVendorPending}
          label="Regular Vendor Pending"
          trend={`${regularVendorPending} items`}
          trendType="neutral"
          onClick={() => onNavigate('regular-vendor')}
        />
        <SummaryCard
          icon={Layers}
          value={needMoreVendorPending}
          label="Need More Vendor Pending"
          trend={`${needMoreVendorPending} items`}
          trendType="neutral"
          onClick={() => onNavigate('need-more-vendor')}
        />
        <SummaryCard
          icon={CheckSquare}
          value={pendingApprovals}
          label="Pending Approvals"
          trend="Review Queue"
          trendType="warning"
          onClick={() => onNavigate('approval-queue')}
        />
        <SummaryCard
          icon={CheckCircle2}
          value={approvedCount}
          label="Approved Indents"
          trend="Cleared"
          trendType="up"
          onClick={() => onNavigate('history')}
        />
        <SummaryCard
          icon={XCircle}
          value={rejectedCount}
          label="Rejected Indents"
          trend="Closed"
          trendType="down"
          onClick={() => onNavigate('history')}
        />
        <SummaryCard
          icon={AlertTriangle}
          value={delayedCount}
          label="Delayed Processes"
          trend="Overdue"
          trendType="danger"
          onClick={() => onNavigate('pending-processes')}
        />
      </div>

      {/* 2. Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Indents by Department</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Current Month</span>
          </div>

          <div className="space-y-3.5">
            {deptData.map(([dept, count]) => {
              const pct = Math.round((count / totalIndents) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate max-w-[220px]">{dept}</span>
                    <span className="font-bold text-slate-900">
                      {count} indents ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Process Status Distribution</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Real-Time Ratio</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">In Progress</div>
              <div className="text-xl font-bold text-blue-700 mt-1">{statusMap['In Progress']}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Active vendor quote stage</p>
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
              <div className="text-[11px] font-semibold text-indigo-700 uppercase">Ready for Approval</div>
              <div className="text-xl font-bold text-indigo-800 mt-1">{statusMap['Ready for Approval']}</div>
              <p className="text-[10px] text-indigo-600 mt-0.5">Awaiting Manager sign-off</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase">Approved</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">{statusMap['Approved']}</div>
              <p className="text-[10px] text-emerald-600 mt-0.5">PO generated & cleared</p>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
              <div className="text-[11px] font-semibold text-rose-700 uppercase">Delayed</div>
              <div className="text-xl font-bold text-rose-800 mt-1">{statusMap['Delayed']}</div>
              <p className="text-[10px] text-rose-600 mt-0.5">Exceeding SLA timeline</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Third Section: Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Recent Purchase Indent Activity</h3>
          </div>
          <button
            onClick={() => onNavigate('all-indents')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Indent Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewIndentDetail(item)}
                      className="font-bold text-slate-900 hover:underline flex items-center gap-1"
                    >
                      {item.id}
                      <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.productName}</td>
                  <td className="py-3 px-4 text-slate-600">{item.department}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {item.currentStage}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500">{item.updatedTime}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewIndentDetail(item)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Fourth Section: Attention Required */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">Attention Required Items</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {attentionRequired.length} Urgent Tasks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attentionRequired.map((item) => (
            <div key={item.id} className="p-3.5 bg-white rounded-lg border border-amber-200 flex items-start justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{item.id}</span>
                  <PriorityBadge priority={item.priority} />
                  {item.delayDays > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.5 rounded">
                      +{item.delayDays}d Delayed
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-800 mt-1 truncate max-w-xs">{item.productName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Stage: {item.currentStage} • Dept: {item.department}</p>
              </div>

              <button
                onClick={() => {
                  if (item.currentStage === 'Approval Queue') onNavigate('approval-queue');
                  else if (item.processType === 'Need More Vendor') onNavigate('need-more-vendor');
                  else onNavigate('regular-vendor');
                }}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shrink-0"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
