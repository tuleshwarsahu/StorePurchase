import React, { useState } from 'react';
import { History, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';

export const HistoryPage = ({ onViewIndentDetail }) => {
  const { indents } = useStore();

  const [activeTab, setActiveTab] = useState('All');
  const [department, setDepartment] = useState('All Departments');
  const [processType, setProcessType] = useState('All Process Types');
  const [dateRange, setDateRange] = useState('All Time');

  const tabs = [
    { id: 'All', label: 'All History', icon: History },
    { id: 'Approved', label: 'Approved', icon: CheckCircle2 },
    { id: 'Rejected', label: 'Rejected', icon: XCircle },
    { id: 'Completed Processes', label: 'Processed Indents', icon: Clock }
  ];

  // Processed indents = indents where process selection has been done (Col M is set)
  const historyIndents = indents.filter(
    (item) => item.processTypeSelected || (item.processType && item.processType !== 'Pending Selection') || item.status === 'Approved' || item.status === 'Rejected'
  );

  // Filtering logic
  const filteredIndents = historyIndents.filter((item) => {
    // Tab filter
    if (activeTab === 'Approved' && item.status !== 'Approved') return false;
    if (activeTab === 'Rejected' && item.status !== 'Rejected') return false;
    if (activeTab === 'Completed Processes' && !item.processTypeSelected && !item.processType) return false;

    // Dropdown filters
    if (department !== 'All Departments' && item.department !== department) return false;
    if (processType !== 'All Process Types' && item.processType !== processType) return false;

    return true;
  });

  const columns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => (
        <button
          onClick={() => onViewIndentDetail(row)}
          className="font-bold text-slate-900 hover:text-teal-600 hover:underline flex items-center gap-1"
        >
          {row.id}
          <ArrowUpRight className="w-3 h-3 text-slate-400" />
        </button>
      )
    },
    {
      header: 'Product Name',
      accessor: 'productName',
      cell: (row) => <span className="font-semibold text-slate-900">{row.productName}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600">{row.department}</span>
    },
    {
      header: 'Process Type (Col M)',
      accessor: 'processType',
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
            row.processType === 'Need More Vendor'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-teal-100 text-teal-800'
          }`}
        >
          {row.processType || 'Regular Vendor'}
        </span>
      )
    },
    {
      header: 'Process Date (Col L)',
      cell: (row) => (
        <span className="text-slate-600 font-mono text-[11px]">
          {row.actualProcessDate || row.timeStamp || 'N/A'}
        </span>
      )
    },
    {
      header: 'Approval Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <PageHeader title="Purchase Indent History Log" breadcrumbs={['Reports', 'History']} />

      {/* History Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-slate-900 text-slate-900 bg-slate-50/80 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <FilterBar
        department={department}
        setDepartment={setDepartment}
        processType={processType}
        setProcessType={setProcessType}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* History Table */}
      <DataTable
        columns={columns}
        data={filteredIndents}
        pageSize={10}
        emptyTitle="No History Records"
        emptyMessage="No processed purchase indents match the selected filters."
      />
    </div>
  );
};
