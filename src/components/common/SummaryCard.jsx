import React from 'react';

export const SummaryCard = ({ icon: Icon, value, label, trend, trendType = 'neutral', onClick, active = false }) => {
  let trendColor = 'text-slate-500 bg-slate-100';
  if (trendType === 'up') trendColor = 'text-emerald-700 bg-emerald-50';
  if (trendType === 'down') trendColor = 'text-rose-700 bg-rose-50';
  if (trendType === 'warning') trendColor = 'text-amber-800 bg-amber-50';
  if (trendType === 'danger') trendColor = 'text-red-700 bg-red-50 font-medium';

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-lg border transition-all duration-150 shadow-xs ${
        onClick ? 'cursor-pointer hover:border-slate-400 hover:shadow-sm' : ''
      } ${active ? 'ring-2 ring-slate-800 border-transparent' : 'border-slate-200'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <div className="p-2 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
