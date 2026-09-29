import React, { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  Building2,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { GisAuditDashboard } from './GisAuditDashboard';
import { BulkAreaSearch } from './BulkAreaSearch';

interface GisDataViewProps {
  onSelectProperty: (propertyKey: string) => void;
  onRefreshCounts: () => void;
  compareKeys?: string[];
  onToggleCompare?: (propertyKey: string) => void;
  onCompareMultiple?: (propertyKeys: string[]) => void;
}

export const GisDataView: React.FC<GisDataViewProps> = ({
  onSelectProperty,
  onRefreshCounts,
  compareKeys = [],
  onToggleCompare,
  onCompareMultiple,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'explorer'>('audit');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Subnavigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>58-County Source Audit</span>
          </button>

          <button
            onClick={() => setActiveSubTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'explorer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bulk Area GIS Explorer</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono pr-2">
          <span>Authority: CA Assessor Association</span>
        </div>
      </div>

      {/* Subtab Contents */}
      {activeSubTab === 'audit' ? (
        <GisAuditDashboard />
      ) : (
        <BulkAreaSearch
          onSelectProperty={onSelectProperty}
          onRefreshCounts={onRefreshCounts}
          compareKeys={compareKeys}
          onToggleCompare={onToggleCompare}
          onCompareMultiple={onCompareMultiple}
        />
      )}
    </div>
  );
};
