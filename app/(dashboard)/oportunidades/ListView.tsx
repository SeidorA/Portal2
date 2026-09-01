import React, { useState, useMemo } from 'react';
import { Opportunity } from './mockData';
import { CaralIcon } from 'iconcaral2';

interface ListViewProps {
  opportunities: Opportunity[];
  stages?: any[];
  onOpportunityClick?: (opportunity: Opportunity) => void;
}

export default function ListView({ opportunities, stages = [], onOpportunityClick }: ListViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Opportunity | null, direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  const handleSort = (key: keyof Opportunity) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOpportunities = useMemo(() => {
    let sortableItems = [...opportunities];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key!];
        let bVal = b[sortConfig.key!];

        if (sortConfig.key === 'status') {
          aVal = stages.find(s => s.id === a.status)?.name || a.status;
          bVal = stages.find(s => s.id === b.status)?.name || b.status;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [opportunities, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: keyof Opportunity }) => {
    if (sortConfig.key !== columnKey) {
      return <CaralIcon name="chevron-down" size={16} className="text-transparent group-hover:text-neutral-300 ml-1 transition-colors" />;
    }
    return (
      <CaralIcon 
        name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} 
        size={16} 
        className="text-info-main ml-1" 
      />
    );
  };

  return (
    <div className="w-full h-full overflow-auto bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <th 
              className="p-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => handleSort('productName')}
            >
              <div className="flex items-center">
                Producto/Servicio <SortIcon columnKey="productName" />
              </div>
            </th>
            <th 
              className="p-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => handleSort('clientName')}
            >
              <div className="flex items-center">
                Cliente <SortIcon columnKey="clientName" />
              </div>
            </th>
            <th 
              className="p-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => handleSort('industry')}
            >
              <div className="flex items-center">
                Industria <SortIcon columnKey="industry" />
              </div>
            </th>
            <th 
              className="p-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => handleSort('country')}
            >
              <div className="flex items-center">
                País/Ciudad <SortIcon columnKey="country" />
              </div>
            </th>
            <th 
              className="p-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => handleSort('repName')}
            >
              <div className="flex items-center">
                Representante <SortIcon columnKey="repName" />
              </div>
            </th>
            <th 
              className="p-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Estado <SortIcon columnKey="status" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sortedOpportunities.map((opp) => (
            <tr 
              key={opp.id} 
              onClick={() => onOpportunityClick && onOpportunityClick(opp)}
              className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
            >
              <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">{opp.productName}</td>
              <td className="p-4 text-neutral-600 dark:text-neutral-400">{opp.clientName}</td>
              <td className="p-4 text-neutral-600 dark:text-neutral-400">{opp.industry || '-'}</td>
              <td className="p-4 text-neutral-600 dark:text-neutral-400">
                {opp.country ? `${opp.country}${opp.city ? `, ${opp.city}` : ''}` : '-'}
              </td>
              <td className="p-4 text-neutral-600 dark:text-neutral-400">{opp.repName || '-'}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-semibold">
                    {stages.find(s => s.id === opp.status)?.name || opp.status}
                  </span>
                  {opp.requiresIntervention ? (
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-main opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-main"></span>
                    </div>
                  ) : (opp.missingRequirements || opp.missingFeatures) ? (
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-main opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-success-main"></span>
                    </div>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {opportunities.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-neutral-500">
                No hay oportunidades disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
