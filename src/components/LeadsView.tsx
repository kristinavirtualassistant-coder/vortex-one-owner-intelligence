import React, { useState } from 'react';
import {
  Bookmark,
  ClipboardList,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { SavedPropertiesView } from './SavedPropertiesView';
import { ResearchQueueView } from './ResearchQueueView';

interface LeadsViewProps {
  onSelectProperty: (query: string) => void;
  onRemoveSavedProperty: (propertyKey: string) => Promise<void>;
  compareKeys?: string[];
  onToggleCompare?: (propertyKey: string) => void;
  onCompareMultiple?: (propertyKeys: string[]) => void;
  savedCount: number;
  researchCount: number;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  onSelectProperty,
  onRemoveSavedProperty,
  compareKeys = [],
  onToggleCompare,
  onCompareMultiple,
  savedCount,
  researchCount,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'research'>('saved');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Subnavigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'saved'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Properties & CRM Leads</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'saved' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {savedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('research')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'research'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Public Record Research Tasks</span>
            {researchCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeSubTab === 'research' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {researchCount}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:block text-xs text-slate-500 font-medium pr-2">
          CRM Lead Generation & Prospecting
        </div>
      </div>

      {/* Subtab Contents */}
      {activeSubTab === 'saved' ? (
        <SavedPropertiesView
          onSelectProperty={onSelectProperty}
          onRemoveSavedProperty={onRemoveSavedProperty}
          compareKeys={compareKeys}
          onToggleCompare={onToggleCompare}
          onCompareMultiple={onCompareMultiple}
        />
      ) : (
        <ResearchQueueView onSelectEntity={onSelectProperty} />
      )}
    </div>
  );
};
