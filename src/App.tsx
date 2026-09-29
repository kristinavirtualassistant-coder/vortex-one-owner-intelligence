import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { PropertySearch } from './components/PropertySearch';
import { PropertyDetailView } from './components/PropertyDetailView';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { GisDataView } from './components/GisDataView';
import { LeadsView } from './components/LeadsView';
import { JobsView } from './components/JobsView';
import { AdminView } from './components/AdminView';
import { PropertyCompareView } from './components/PropertyCompareView';
import { ComparisonTray } from './components/ComparisonTray';
import { BatchEnrichmentModal } from './components/BatchEnrichmentModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { SearchResultPayload, RecentSearchItem } from './types';
import { AlertCircle, RefreshCw, Search, Building2 } from 'lucide-react';

const DEFAULT_RECENT_SEARCHES: RecentSearchItem[] = [
  {
    id: 'rec-1',
    query: '400 Spectrum Center Dr, Irvine, CA',
    title: '400 Spectrum Center Dr',
    subtitle: 'Irvine, CA',
    apn: '580-081-01',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'rec-2',
    query: '2076 Magnolia Ave, Long Beach, CA',
    title: '2076 Magnolia Ave',
    subtitle: 'Long Beach, CA',
    apn: '7268-015-024',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: 'rec-3',
    query: '1200 S Harbor Blvd, Anaheim, CA',
    title: '1200 S Harbor Blvd',
    subtitle: 'Anaheim, CA',
    apn: '082-190-42',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'rec-4',
    query: '100 Main St, Seal Beach, CA',
    title: '100 Main St',
    subtitle: 'Seal Beach, CA',
    apn: '199-061-12',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search State & Recent Searches List
  const [searchQuery, setSearchQuery] = useState('400 Spectrum Center Dr, Irvine, CA');
  const [searchResult, setSearchResult] = useState<SearchResultPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('vortex_recent_searches');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Failed to parse recent searches from storage', err);
      }
    }
    return DEFAULT_RECENT_SEARCHES;
  });

  // Record a recent search
  const recordRecentSearch = (queryStr: string, resultData?: SearchResultPayload | null) => {
    setRecentSearches((prev) => {
      const cleanQ = queryStr.trim();
      if (!cleanQ) return prev;

      const title = resultData?.property?.formattedAddress || cleanQ;
      const subtitle = resultData?.property ? `${resultData.property.city}, CA` : undefined;
      const apn = resultData?.parcel?.apn || undefined;

      const filtered = prev.filter(
        (item) =>
          item.query.toLowerCase() !== cleanQ.toLowerCase() &&
          item.title.toLowerCase() !== title.toLowerCase()
      );

      const updated: RecentSearchItem[] = [
        {
          id: `search-${Date.now()}`,
          query: cleanQ,
          title,
          subtitle,
          apn,
          timestamp: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 15);

      try {
        localStorage.setItem('vortex_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('vortex_recent_searches');
  };

  const handleRemoveRecentSearch = (id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('vortex_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Portfolio Dashboard Filter State
  const [portfolioOwnerFilter, setPortfolioOwnerFilter] = useState('');

  // Counts & Modals
  const [savedCount, setSavedCount] = useState(0);
  const [researchCount, setResearchCount] = useState(0);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Compare Queue State
  const [compareKeys, setCompareKeys] = useState<string[]>([]);

  // Fetch initial counts
  const fetchCounts = async () => {
    try {
      const [savedRes, researchRes] = await Promise.all([
        fetch('/api/saved'),
        fetch('/api/research-tasks'),
      ]);
      if (savedRes.ok) {
        const data = await savedRes.json();
        setSavedCount(data.count || 0);
      }
      if (researchRes.ok) {
        const data = await researchRes.json();
        setResearchCount(data.count || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform search
  const executeSearch = async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Property search failed.');
      }
      const data: SearchResultPayload = await res.json();
      setSearchResult(data);
      recordRecentSearch(query, data);
      setActivePage('search');
    } catch (err: any) {
      setError(err.message || 'Failed to resolve property intelligence.');
      setSearchResult(null);
      recordRecentSearch(query, null);
    } finally {
      setIsLoading(false);
      fetchCounts();
    }
  };

  // Initial load
  useEffect(() => {
    executeSearch('400 Spectrum Center Dr, Irvine, CA');
    fetchCounts();
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / slash)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.isContentEditable);
      const isSlash = e.key === '/' && !isInput;

      if (isCmdK || isSlash) {
        e.preventDefault();

        // Navigate to search page if not already there
        setActivePage('search');

        // Focus search input after render
        setTimeout(() => {
          const mainInput = document.getElementById(
            'main-property-search-input'
          ) as HTMLInputElement | null;
          if (mainInput) {
            mainInput.focus();
            mainInput.select();
          } else {
            const headerInput = document.getElementById(
              'global-header-search-input'
            ) as HTMLInputElement | null;
            headerInput?.focus();
            headerInput?.select();
          }
        }, 30);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveProperty = async (propertyKey: string, note: string) => {
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyKey, note }),
      });
      fetchCounts();
      if (searchResult) {
        setSearchResult({
          ...searchResult,
          property: {
            ...searchResult.property,
            saved: true,
            savedNote: note,
          },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveProperty = async (propertyKey: string) => {
    try {
      await fetch(`/api/saved/${encodeURIComponent(propertyKey)}`, {
        method: 'DELETE',
      });
      fetchCounts();
      if (searchResult) {
        setSearchResult({
          ...searchResult,
          property: {
            ...searchResult.property,
            saved: false,
            savedNote: '',
          },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzePortfolio = (ownerName: string) => {
    setPortfolioOwnerFilter(ownerName);
    setActivePage('portfolios');
  };

  const handleTriggerResearchTask = (entityId: string, entityName: string, reason: string) => {
    setResearchCount((prev) => prev + 1);
    setActivePage('leads');
  };

  // Compare queue handlers
  const handleToggleCompare = (propertyKey: string) => {
    setCompareKeys((prev) => {
      const clean = propertyKey.replace(/^oc:/, '');
      const exists = prev.some((k) => k.replace(/^oc:/, '') === clean);
      if (exists) {
        return prev.filter((k) => k.replace(/^oc:/, '') !== clean);
      } else {
        if (prev.length >= 10) {
          alert('You can compare up to 10 properties simultaneously.');
          return prev;
        }
        return [...prev, propertyKey];
      }
    });
  };

  const handleCompareMultiple = (propertyKeys: string[]) => {
    setCompareKeys((prev) => {
      const set = new Set(prev.map((k) => k.replace(/^oc:/, '')));
      const newItems = [...prev];
      for (const k of propertyKeys) {
        const clean = k.replace(/^oc:/, '');
        if (!set.has(clean)) {
          set.add(clean);
          newItems.push(k);
        }
      }
      return newItems.slice(0, 10);
    });
    setActivePage('compare');
  };

  const handleRemoveCompareKey = (key: string) => {
    const clean = key.replace(/^oc:/, '');
    setCompareKeys((prev) => prev.filter((k) => k.replace(/^oc:/, '') !== clean));
  };

  const handleClearCompareKeys = () => {
    setCompareKeys([]);
  };

  const currentResultIsCompared = Boolean(
    searchResult &&
      compareKeys.some(
        (k) =>
          k.replace(/^oc:/, '') ===
          searchResult.property.propertyKey.replace(/^oc:/, '')
      )
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans text-sm selection:bg-blue-600 selection:text-white flex">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(p) => {
          setActivePage(p);
          setMobileMenuOpen(false);
        }}
        savedCount={savedCount}
        researchCount={researchCount}
        compareCount={compareKeys.length}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        recentSearches={recentSearches}
        onSelectRecentSearch={(query) => {
          executeSearch(query);
          setActivePage('search');
          setMobileMenuOpen(false);
        }}
        onClearRecentSearches={handleClearRecentSearches}
        onRemoveRecentSearch={handleRemoveRecentSearch}
        currentQuery={searchQuery}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-20 lg:hidden"
        />
      )}

      {/* 2. Main Content Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <TopHeader
          activePage={activePage}
          onNavigate={setActivePage}
          onGlobalSearch={executeSearch}
          compareCount={compareKeys.length}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenAIChat={() => setIsAIChatOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={() => executeSearch(searchQuery)}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all text-rose-900"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* PAGE ROUTING */}
          {activePage === 'dashboard' && (
            <DashboardView
              onNavigate={setActivePage}
              onSearch={executeSearch}
              savedCount={savedCount}
              researchCount={researchCount}
            />
          )}

          {activePage === 'search' && (
            <div className="space-y-6">
              {/* Primary Search Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <PropertySearch
                  onSearch={executeSearch}
                  isLoading={isLoading}
                  currentQuery={searchQuery}
                />
              </div>

              {/* Loading Skeleton */}
              {isLoading ? (
                <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Querying California Assessor & GIS Feeds...
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      APN normalization, Secretary of State corporate piercing, and PostGIS boundary lookup.
                    </p>
                  </div>
                </div>
              ) : searchResult ? (
                <PropertyDetailView
                  data={searchResult}
                  onSaveProperty={handleSaveProperty}
                  onRemoveProperty={handleRemoveProperty}
                  onTriggerResearchTask={handleTriggerResearchTask}
                  isCompared={currentResultIsCompared}
                  onToggleCompare={handleToggleCompare}
                  onAnalyzePortfolio={handleAnalyzePortfolio}
                />
              ) : (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Property Selected</h3>
                  <p className="text-xs text-slate-500">
                    Use the search bar above to look up any California property by Address, APN, or Owner.
                  </p>
                </div>
              )}
            </div>
          )}

          {activePage === 'portfolios' && (
            <PortfolioDashboard
              initialOwnerFilter={portfolioOwnerFilter}
              onSelectOwnerProperty={(ownerName) => {
                executeSearch(ownerName);
              }}
            />
          )}

          {activePage === 'gis' && (
            <GisDataView
              onSelectProperty={(key) => executeSearch(key)}
              onRefreshCounts={fetchCounts}
              compareKeys={compareKeys}
              onToggleCompare={handleToggleCompare}
              onCompareMultiple={handleCompareMultiple}
            />
          )}

          {activePage === 'leads' && (
            <LeadsView
              onSelectProperty={(query) => executeSearch(query)}
              onRemoveSavedProperty={handleRemoveProperty}
              compareKeys={compareKeys}
              onToggleCompare={handleToggleCompare}
              onCompareMultiple={handleCompareMultiple}
              savedCount={savedCount}
              researchCount={researchCount}
            />
          )}

          {activePage === 'jobs' && <JobsView />}

          {activePage === 'admin' && <AdminView />}

          {activePage === 'compare' && (
            <PropertyCompareView
              compareKeys={compareKeys}
              onRemoveFromCompare={handleRemoveCompareKey}
              onClearCompare={handleClearCompareKeys}
              onSelectPropertyForDetail={(query) => executeSearch(query)}
              onSaveProperty={handleSaveProperty}
              onRemoveSavedProperty={handleRemoveProperty}
              onAddPropertyToCompare={(query) => handleToggleCompare(query)}
            />
          )}
        </main>
      </div>

      {/* Comparison Tray Floating Indicator */}
      <ComparisonTray
        compareKeys={compareKeys}
        onRemoveKey={handleRemoveCompareKey}
        onClearAll={handleClearCompareKeys}
        onViewComparison={() => setActivePage('compare')}
        isVisible={activePage !== 'compare' && compareKeys.length > 0}
      />

      {/* Batch Enrichment Modal */}
      <BatchEnrichmentModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      {/* AI Assistant Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </div>
  );
}
