import React from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Building2, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';

export const AnalyticsPage = () => {
  const { indents } = useStore();

  const total = indents.length;
  const approvedCount = indents.filter((i) => i.status === 'Approved').length;
  const avgCompletionDays = 3.8;
  const delayedSlaCount = indents.filter((i) => i.delayDays > 0).length;

  const deptCounts = {
    'Mechanical Maintenance': indents.filter((i) => i.department === 'Mechanical Maintenance').length,
    'Machining Division': indents.filter((i) => i.department === 'Machining Division').length,
    'Plant Operations': indents.filter((i) => i.department === 'Plant Operations').length,
    'Safety & Administration': indents.filter((i) => i.department === 'Safety & Administration').length,
    'Electrical & Automation': indents.filter((i) => i.department === 'Electrical & Automation').length
  };

  const monthlyTrend = [
    { month: 'Apr 2026', count: 18, avgDays: 4.2 },
    { month: 'May 2026', count: 24, avgDays: 3.9 },
    { month: 'Jun 2026', count: 31, avgDays: 3.5 },
    { month: 'Jul 2026', count: 28, avgDays: 3.6 },
    { month: 'Aug 2026', count: 35, avgDays: 3.8 }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader title="Procurement Analytics & Management Reports" breadcrumbs={['Reports', 'Analytics']} />

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp} value={total} label="Total Indents Processed" trend="YTD" trendType="neutral" />
        <SummaryCard icon={Clock} value={`${avgCompletionDays} Days`} label="Avg Completion Time" trend="-0.4d vs Target" trendType="up" />
        <SummaryCard icon={AlertTriangle} value={`${delayedSlaCount} Indents`} label="Delayed Process Count" trend="SLA Breach" trendType="danger" />
        <SummaryCard icon={ShieldCheck} value={`${Math.round((approvedCount / total) * 100)}%`} label="Approval Win Rate" trend="High Compliance" trendType="up" />
      </div>

      {/* Main Visual Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Total Indents by Department */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Total Indents by Department</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Monthly Breakdown</span>
          </div>

          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{dept}</span>
                    <span className="text-slate-900">{count} Indents ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Monthly Purchase Indent Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Monthly Purchase Indent Trend</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Volume & Cycle Time</span>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-4 px-2">
            {monthlyTrend.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-bold text-slate-800">{item.count}</span>
                <div
                  className="w-full bg-teal-600 hover:bg-teal-700 rounded-t transition-all"
                  style={{ height: `${(item.count / 40) * 100}%` }}
                />
                <span className="text-[10px] font-medium text-slate-500 truncate max-w-full">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Delayed Process Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Delayed Process SLA Bottlenecks</h3>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-900">Vendor Quotation Collection Stage</span>
                <p className="text-slate-600 text-[11px] mt-0.5">Average delay: 2.8 days per vendor response</p>
              </div>
              <span className="px-2 py-1 bg-rose-600 text-white font-bold rounded text-[11px]">High Impact</span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900">Manager Approval Review Stage</span>
                <p className="text-slate-600 text-[11px] mt-0.5">Average delay: 1.1 days per sign-off</p>
              </div>
              <span className="px-2 py-1 bg-amber-600 text-white font-bold rounded text-[11px]">Medium Impact</span>
            </div>
          </div>
        </div>

        {/* 4. Vendor Selection Statistics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Vendor Selection Statistics</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Lowest Rate Selection Rate</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">85%</div>
              <p className="text-[10px] text-slate-500 mt-0.5">L1 quote selected in multi-vendor</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Average Quotes per Indent</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">2.6 Bids</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Competitive bidding depth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
