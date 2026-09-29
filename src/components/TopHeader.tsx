import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Layers,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Clock,
  MapPin,
  Building,
  User,
  Hash,
  Globe,
  Menu,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { NavPage } from './Sidebar';
import { AuthWidget } from './AuthWidget';
import { GisFreshnessInfo, SearchSuggestion } from '../types';

interface TopHeaderProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  onGlobalSearch: (query: string) => void;
  compareCount: number;
  onOpenBatchModal: () => void;
  onOpenAIChat?: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activePage,
  onNavigate,
  onGlobalSearch,
  compareCount,
  onOpenBatchModal,
  onOpenAIChat,
  onToggleMobileMenu,
}) => {
  const [quickQuery, setQuickQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Data Freshness State
  const [freshness, setFreshness] = useState<GisFreshnessInfo>({
    lastSyncAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    county: 'Orange County, CA',
    fipsCode: '06059',
    sourceName: 'Orange County Assessor & Public GIS REST Portal',
    status: 'VERIFIED',
    recordCount: 850000,
    lastVerifiedLatencyMs: 38,
  });
  const [isSyncingGis, setIsSyncingGis] = useState(false);
  const [showFreshnessTooltip, setShowFreshnessTooltip] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // Fetch initial data freshness
  const fetchFreshness = async () => {
    try {
      const res = await fetch('/api/gis/freshness');
      if (res.ok) {
        const data = await res.json();
        setFreshness(data);
      }
    } catch (err) {
      console.error('Failed to fetch GIS freshness', err);
    }
  };

  useEffect(() => {
    fetchFreshness();
    const interval = setInterval(fetchFreshness, 60000);
    return () => clearInterval(interval);
  }, []);

  // Manual GIS Sync Refresh
  const handleManualGisSync = async () => {
    if (isSyncingGis) return;
    setIsSyncingGis(true);
    setSyncFeedback('Syncing GIS feeds...');
    try {
      const res = await fetch('/api/gis/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFreshness(data.freshness);
        setSyncFeedback('Records synced just now!');
        setTimeout(() => setSyncFeedback(null), 3500);
      } else {
        setSyncFeedback('Sync error');
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Failed to trigger manual GIS sync', err);
      setSyncFeedback('Sync failed');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncingGis(false);
    }
  };

  // Live Suggestion Fetching (Quick-Type)
  useEffect(() => {
    if (!quickQuery.trim() || quickQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(quickQuery.trim())}`);
        if (res.ok) {
          const data: SearchSuggestion[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to fetch autocomplete suggestions', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [quickQuery]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Time Ago
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'recent';
    }
  };

  const getPageTitle = (page: NavPage) => {
    switch (page) {
      case 'dashboard':
        return { title: 'Operational Dashboard', subtitle: 'Real-time property intelligence & GIS metrics' };
      case 'search':
        return { title: 'Property Search', subtitle: 'Public record search, parcel GIS & owner resolution' };
      case 'portfolios':
        return { title: 'Owner Intelligence', subtitle: 'Corporate entity piercing, portfolio analytics & lead scores' };
      case 'gis':
        return { title: 'GIS & Data Registry', subtitle: 'California 58-county assessor feeds & area explorer' };
      case 'leads':
        return { title: 'Leads & Research', subtitle: 'Bookmarked properties, outreach notes & research queue' };
      case 'jobs':
        return { title: 'Jobs & Importer', subtitle: 'Batch CSV enrichment & background GIS streaming' };
      case 'admin':
        return { title: 'System Administration', subtitle: 'Infrastructure health, database status & diagnostics' };
      case 'compare':
        return { title: 'Property Comparison', subtitle: 'Side-by-side multi-property intelligence audit' };
      default:
        return { title: 'Vortex One', subtitle: 'CMC VR1 Property Intelligence' };
    }
  };

  const { title, subtitle } = getPageTitle(activePage);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }
    if (!quickQuery.trim()) return;
    onGlobalSearch(quickQuery.trim());
    setShowSuggestions(false);
    setQuickQuery('');
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    const val = item.searchKey || item.display;
    setQuickQuery('');
    setShowSuggestions(false);
    onGlobalSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'owner':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      case 'apn':
        return <Hash className="w-3.5 h-3.5 text-blue-600" />;
      case 'city':
        return <Globe className="w-3.5 h-3.5 text-emerald-600" />;
      case 'address':
      default:
        return <MapPin className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors duration-200 print:hidden">
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Center Global Quick-Type Search */}
      <form
        ref={searchContainerRef}
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center flex-1 max-w-md mx-4 relative"
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          id="global-header-search-input"
          ref={inputRef}
          type="text"
          value={quickQuery}
          onChange={(e) => setQuickQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Quick jump (Address, APN, Owner, City)..."
          className="w-full pl-9 pr-14 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
        />
        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
          {isSearchingSuggestions ? (
            <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-300 shadow-2xs">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          )}
        </div>

        {/* Quick-Type Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-96 overflow-y-auto">
            <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Public Record & Owner Matches</span>
              <span className="text-[10px] text-slate-400">↑↓ to navigate · Enter to select</span>
            </div>
            {suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3.5 py-2.5 text-left transition-colors flex items-center gap-3 group ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-800/60'
                      : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                  }`}>
                    {getSuggestionIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                      <span className="truncate">{item.title}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {item.category || item.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle}
                    </div>
                  </div>

                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'
                  }`} />
                </button>
              );
            })}
          </div>
        )}
      </form>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Data Freshness Indicator */}
        <div className="relative">
          <div
            onMouseEnter={() => setShowFreshnessTooltip(true)}
            onMouseLeave={() => setShowFreshnessTooltip(false)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            <span className="hidden xl:inline text-slate-500 dark:text-slate-400 font-medium">
              GIS Sync:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatTimeAgo(freshness.lastSyncAt)}
            </span>

            <button
              id="manual-gis-refresh-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleManualGisSync();
              }}
              disabled={isSyncingGis}
              className="ml-1 p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Manually refresh GIS & Assessor feed"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingGis ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            </button>
          </div>

          {/* Freshness Popover Tooltip */}
          {showFreshnessTooltip && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 text-xs space-y-2 text-slate-700 dark:text-slate-200 pointer-events-none">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GIS Data Freshness</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {freshness.status}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Jurisdiction:</span>
                  <span className="font-medium">{freshness.county}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Last Assessor Sync:</span>
                  <span className="font-medium">{new Date(freshness.lastSyncAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Parcels Indexed:</span>
                  <span className="font-medium font-mono">{freshness.recordCount.toLocaleString()}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Feed Latency:</span>
                  <span className="font-medium font-mono text-emerald-600">{freshness.lastVerifiedLatencyMs}ms</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-1.5">
                Public GIS REST layer synced with Orange County Secured Tax Roll.
              </p>
            </div>
          )}

          {/* Sync feedback badge */}
          {syncFeedback && (
            <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in">
              {syncFeedback}
            </div>
          )}
        </div>

        {/* Comparison Queue Pill */}
        {compareCount > 0 && (
          <button
            onClick={() => onNavigate('compare')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-all shadow-2xs"
            title="View Comparison Queue"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Compare</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px]">
              {compareCount}
            </span>
          </button>
        )}

        {/* Batch CSV Shortcut */}
        <button
          onClick={onOpenBatchModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          title="Batch CSV Enrichment"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span className="hidden sm:inline">Batch CSV</span>
        </button>

        {/* AI Assistant Button */}
        {onOpenAIChat && (
          <button
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-all"
            title="Ask AI Intelligence Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        {/* Auth status indicator */}
        <div className="hidden lg:block">
          <AuthWidget />
        </div>
      </div>
    </header>
  );
};
