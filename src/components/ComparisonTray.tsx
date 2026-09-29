import React from 'react';
import { Scale, ArrowRight, X, Trash2, Eye } from 'lucide-react';

interface ComparisonTrayProps {
  compareKeys: string[];
  onRemoveKey: (key: string) => void;
  onClearAll: () => void;
  onViewComparison: () => void;
  isVisible: boolean;
}

export const ComparisonTray: React.FC<ComparisonTrayProps> = ({
  compareKeys,
  onRemoveKey,
  onClearAll,
  onViewComparison,
  isVisible,
}) => {
  if (!isVisible || compareKeys.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-3xl border border-slate-700 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Badge & Selected Chips */}
        <div className="flex items-center space-x-3 w-full sm:w-auto overflow-hidden">
          <div className="p-2.5 bg-blue-600 rounded-2xl shrink-0 shadow-md shadow-blue-600/30">
            <Scale className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Compare Queue
              </span>
              <span className="px-2 py-0.2 bg-blue-500/20 text-blue-300 rounded-full text-[11px] font-mono font-bold border border-blue-500/30">
                {compareKeys.length} {compareKeys.length === 1 ? 'Property' : 'Properties'}
              </span>
            </div>

            {/* Chips scrollable list */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
              {compareKeys.map((key) => {
                const cleanKey = key.replace(/^oc:/, '');
                return (
                  <span
                    key={key}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono shrink-0"
                  >
                    <span className="max-w-[140px] truncate">{cleanKey}</span>
                    <button
                      onClick={() => onRemoveKey(key)}
                      className="hover:text-rose-400 text-slate-400 p-0.5 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={onClearAll}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear Queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onViewComparison}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all"
          >
            <span>Compare Side-by-Side</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
