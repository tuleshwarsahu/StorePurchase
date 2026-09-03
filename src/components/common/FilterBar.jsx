import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterBar = ({
  department,
  setDepartment,
  status,
  setStatus,
  processType,
  setProcessType,
  priority,
  setPriority,
  dateRange,
  setDateRange,
  onReset
}) => {
  const departments = [
    'All Departments',
    'Mechanical Maintenance',
    'Machining Division',
    'Plant Operations',
    'Safety & Administration',
    'Electrical & Automation'
  ];

  const statuses = [
    'All Statuses',
    'Pending',
    'In Progress',
    'Ready for Approval',
    'Approved',
    'Rejected',
    'Delayed'
  ];

  const processTypes = [
    'All Process Types',
    'Regular Vendor',
    'Need More Vendor'
  ];

  const priorities = [
    'All Priorities',
    'Urgent',
    'High',
    'Medium',
    'Low'
  ];

  const dateRanges = [
    'All Time',
    'Today',
    'This Week',
    'This Month',
    'Last 30 Days'
  ];

  const hasActiveFilters =
    (department && department !== 'All Departments') ||
    (status && status !== 'All Statuses') ||
    (processType && processType !== 'All Process Types') ||
    (priority && priority !== 'All Priorities') ||
    (dateRange && dateRange !== 'All Time');

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 sm:pr-2.5 sm:border-r border-slate-300">
        <Filter className="w-3.5 h-3.5 text-teal-600" /> Filter By:
      </div>

      {/* Department Filter */}
      {setDepartment && (
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      )}

      {/* Status Filter */}
      {setStatus && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
        >
          {statuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      )}

      {/* Process Type Filter */}
      {setProcessType && (
        <select
          value={processType}
          onChange={(e) => setProcessType(e.target.value)}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
        >
          {processTypes.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>
      )}

      {/* Priority Filter */}
      {setPriority && (
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
        >
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}

      {/* Date Range Filter */}
      {setDateRange && (
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-slate-800 outline-none"
        >
          {dateRanges.map((dr) => (
            <option key={dr} value={dr}>
              {dr}
            </option>
          ))}
        </select>
      )}

      {/* Clear Filters button */}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="col-span-2 sm:col-span-1 sm:ml-auto flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset Filters
        </button>
      )}
    </div>
  );
};
