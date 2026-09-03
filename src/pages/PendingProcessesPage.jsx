import React, { useMemo } from 'react';
import { Clock, ArrowRight, Layers3, Package, Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';

export const PendingProcessesPage = ({ onNavigate, onProcessItem }) => {
  const { indents } = useStore();

  // Group pending indents by Indent Number (id)
  const groupedPendingIndents = useMemo(() => {
    const map = {};
    indents.forEach((item) => {
      if (!item.processTypeSelected && (!item.processType || item.processType === '' || item.processType === 'Pending Selection')) {
        if (!map[item.id]) {
          map[item.id] = {
            groupKey: item.id,
            id: item.id,
            indentorName: item.indentorName || item.assignedTo || 'Rajesh Kumar',
            department: item.department || 'Stores',
            areaOfMachine: item.areaOfMachine || '',
            groupHead: item.groupHead || '',
            items: []
          };
        }
        map[item.id].items.push(item);
      }
    });
    return Object.values(map);
  }, [indents]);

  const columns = [
    {
      header: 'Indent Number',
      accessor: 'id',
      cell: (row) => (
        <span className="font-bold text-slate-900 inline-flex items-center gap-1.5 whitespace-nowrap">
          <Layers className="w-4 h-4 text-purple-700 shrink-0" />
          {row.id}
        </span>
      )
    },
    {
      header: 'Material Items',
      cell: (row) => (
        <div className="space-y-1 max-w-xs sm:max-w-md">
          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold rounded">
            {row.items.length} Item{row.items.length > 1 ? 's' : ''} Categorized
          </span>
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
            {row.items.map((i) => `${i.productName} (${i.quantity} ${i.unit || 'Pcs'})`).join(', ')}
          </p>
        </div>
      )
    },
    {
      header: 'Indentor',
      accessor: 'indentorName',
      cell: (row) => <span className="text-slate-700 font-medium whitespace-nowrap">{row.indentorName}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (row) => <span className="text-slate-600 font-medium whitespace-nowrap">{row.department}</span>
    },
    {
      header: 'Process Status',
      cell: () => (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
          Pending Selection
        </span>
      )
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => onProcessItem(row)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs whitespace-nowrap"
        >
          <Layers3 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Select Process ({row.items.length})</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-8 text-xs">
      <PageHeader
        title="Pending Processes Queue"
        breadcrumbs={['Indent Management', 'Pending Processes']}
      />

      <DataTable
        columns={columns}
        data={groupedPendingIndents}
        pageSize={10}
        emptyTitle="No Pending Processes"
        emptyMessage="Great! All active purchase indents have completed their process selection stage."
      />
    </div>
  );
};
