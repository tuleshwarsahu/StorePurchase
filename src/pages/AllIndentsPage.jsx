import React, { useState } from 'react';
import { Download, FilePlus, Eye, Clock, Edit3, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { formatISTDateTime } from '../utils/dateUtils';

export const AllIndentsPage = ({ onNavigate, onViewIndentDetail }) => {
  const { indents, addToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [status, setStatus] = useState('All Statuses');
  const [processType, setProcessType] = useState('All Process Types');
  const [priority, setPriority] = useState('All Priorities');
  const [dateRange, setDateRange] = useState('All Time');

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartment('All Departments');
    setStatus('All Statuses');
    setProcessType('All Process Types');
    setPriority('All Priorities');
    setDateRange('All Time');
  };

  const handleExport = () => {
    addToast('Export Generated', 'All Indents dataset exported to CSV format.', 'info');
  };

  // Filter logic memoized for smooth searching & zero latency
  const filteredIndents = React.useMemo(() => {
    return indents.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        if (!matchId && !matchProduct && !matchDept) return false;
      }

      if (department !== 'All Departments' && item.department !== department) return false;
      if (status !== 'All Statuses' && item.status !== status) return false;
      if (processType !== 'All Process Types' && item.processType !== processType) return false;
      if (priority !== 'All Priorities' && item.priority !== priority) return false;

      return true;
    });
  }, [indents, searchQuery, department, status, processType, priority]);

  const columns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewIndentDetail(row);
          }}
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
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{row.productName}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <PriorityBadge priority={row.priority} />
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 font-medium">{row.department}</span>
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      cell: (row) => (
        <span className="font-bold text-slate-800">
          {row.quantity.toLocaleString()} {row.unit}
        </span>
      )
    },
    {
      header: 'Process Type',
      accessor: 'processType',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            row.processType === 'Need More Vendor' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.processType}
        </span>
      )
    },
    {
      header: 'Current Stage',
      accessor: 'currentStage',
      cell: (row) => <span className="font-medium text-slate-700">{row.currentStage}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Created Date',
      accessor: 'createdDate',
      cell: (row) => <span className="text-slate-500 whitespace-nowrap">{formatISTDateTime(row.createdDate || row.timeStamp)}</span>
    },
    {
      header: 'Delay',
      accessor: 'delayDays',
      cell: (row) =>
        row.delayDays > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
            <AlertTriangle className="w-3 h-3" /> +{row.delayDays}d
          </span>
        ) : (
          <span className="text-emerald-600 font-medium text-[11px]">On Time</span>
        )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onViewIndentDetail(row)}
            title="View Details"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewIndentDetail(row)}
            title="Track Process Timeline"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-8 text-xs">
      <PageHeader
        title="All Purchase Indents"
        breadcrumbs={['Indent Management', 'All Indents']}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => onNavigate('create-indent')}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
            >
              <FilePlus className="w-4 h-4 text-teal-400" /> Create New Indent
            </button>
          </div>
        }
      />

      {/* Filter & Search Bar Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <span className="text-xs text-slate-500 font-medium text-right sm:text-left">
            Showing <strong className="text-slate-800">{filteredIndents.length}</strong> of {indents.length} Indents
          </span>
        </div>

        <FilterBar
          department={department}
          setDepartment={setDepartment}
          status={status}
          setStatus={setStatus}
          processType={processType}
          setProcessType={setProcessType}
          priority={priority}
          setPriority={setPriority}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredIndents}
        onRowClick={onViewIndentDetail}
        pageSize={8}
        emptyTitle="No Indents Found"
        emptyMessage="No purchase indents match your selected search query and filters."
      />
    </div>
  );
};
