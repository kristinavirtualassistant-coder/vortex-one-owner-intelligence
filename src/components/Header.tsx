import React from 'react';
import {
  Building2,
  Bookmark,
  FileSpreadsheet,
  ClipboardList,
  Search,
  Server,
  ShieldCheck,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { AuthWidget } from './AuthWidget';

interface HeaderProps {
  activeTab: 'search' | 'bulk' | 'portfolios' | 'research' | 'saved' | 'audit';
  setActiveTab: (tab: 'search' | 'bulk' | 'portfolios' | 'research' | 'saved' | 'audit') => void;
  savedCount: number;
  researchCount: number;
  onOpenBatchModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  researchCount,
  onOpenBatchModal,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-blue-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-md shadow-blue-600/20">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Vortex One <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">v4.1 Pro</span>
                  </h1>
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  Web-Hosted Property Intelligence & Owner Resolution Platform
                </p>
              </div>
            </div>

            {/* Mobile Batch Trigger */}
            <button
              onClick={onOpenBatchModal}
              className="md:hidden flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Batch CSV</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-blue-50/70 p-2 rounded-2xl border border-blue-200 w-full md:w-auto overflow-x-auto shadow-inner">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-white text-blue-900 font-bold shadow-sm border border-blue-300'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-blue-100/60'
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Property Search</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'bulk'
                  ? 'bg-white text-blue-900 font-bold shadow-sm border border-blue-300'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-blue-100/60'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Bulk Area Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolios')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'portfolios'
                  ? 'bg-white text-blue-900 font-bold shadow-sm border border-blue-300'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-blue-100/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Owner Portfolios</span>
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === 'research'
                  ? 'bg-white text-blue-900 font-bold shadow-sm border border-blue-300'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-blue-100/60'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Research Tasks</span>
              {researchCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-amber-200 text-amber-900 text-xs font-bold rounded-full border border-amber-300">
                  {researchCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'saved'
                  ? 'bg-white text-blue-900 font-bold shadow-sm border border-blue-300'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-blue-100/60'
              }`}
            >
              <Bookmark className="w-4 h-4 text-blue-600" />
              <span>Saved ({savedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-white text-blue-900 font-bold shadow-sm border border-blue-300'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-blue-100/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>GIS Audit</span>
            </button>
          </div>

          {/* Platform Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <AuthWidget />

            <button
              onClick={onOpenBatchModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Batch CSV Skip-Trace</span>
            </button>

            <div className="flex items-center space-x-2 px-3.5 py-2 bg-blue-50 rounded-xl border border-blue-200 text-xs text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-blue-900 font-bold">OC FIPS 06059</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
