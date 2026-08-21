import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PropertySearch } from './components/PropertySearch';
import { PropertyDetailView } from './components/PropertyDetailView';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { ResearchQueueView } from './components/ResearchQueueView';
import { SavedPropertiesView } from './components/SavedPropertiesView';
import { BulkAreaSearch } from './components/BulkAreaSearch';
import { BatchEnrichmentModal } from './components/BatchEnrichmentModal';
import { GisAuditDashboard } from './components/GisAuditDashboard';
import { AIChatDrawer } from './components/AIChatDrawer';
import { SearchResultPayload } from './types';
import { Building2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'bulk' | 'portfolios' | 'research' | 'saved' | 'audit'>('search');
  const [searchQuery, setSearchQuery] = useState('400 Spectrum Center Dr, Irvine, CA');
  const [searchResult, setSearchResult] = useState<SearchResultPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedCount, setSavedCount] = useState(0);
  const [researchCount, setResearchCount] = useState(0);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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
      setActiveTab('search');
    } catch (err: any) {
      setError(err.message || 'Failed to resolve property intelligence.');
      setSearchResult(null);
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

  const handleTriggerResearchTask = (entityId: string, entityName: string, reason: string) => {
    setResearchCount((prev) => prev + 1);
    setActiveTab('research');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-white to-sky-50/50 text-slate-900 font-sans text-base selection:bg-blue-600 selection:text-white">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedCount}
        researchCount={researchCount}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Bar Section - Visible across tabs for fast lookup */}
        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-md">
          <PropertySearch
            onSearch={executeSearch}
            isLoading={isLoading}
            currentQuery={searchQuery}
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => executeSearch(searchQuery)}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all text-rose-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'search' && (
          <>
            {isLoading ? (
              <div className="p-16 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Querying Orange County GIS & Public Records...</h3>
                  <p className="text-sm text-slate-600 mt-1 font-mono">
                    Executing US Census Geocoding, APN Normalization & Corporate Entity Piercing
                  </p>
                </div>
              </div>
            ) : searchResult ? (
              <PropertyDetailView
                data={searchResult}
                onSaveProperty={handleSaveProperty}
                onRemoveProperty={handleRemoveProperty}
                onTriggerResearchTask={handleTriggerResearchTask}
              />
            ) : null}
          </>
        )}

        {activeTab === 'bulk' && (
          <BulkAreaSearch
            onSelectProperty={(key) => executeSearch(key)}
            onRefreshCounts={fetchCounts}
          />
        )}

        {activeTab === 'portfolios' && (
          <PortfolioDashboard
            onSelectOwnerProperty={(ownerName) => {
              executeSearch(ownerName);
            }}
          />
        )}

        {activeTab === 'research' && (
          <ResearchQueueView
            onSelectEntity={(entityName) => {
              executeSearch(entityName);
            }}
          />
        )}

        {activeTab === 'saved' && (
          <SavedPropertiesView
            onSelectProperty={(query) => {
              executeSearch(query);
            }}
            onRemoveSavedProperty={handleRemoveProperty}
          />
        )}

        {activeTab === 'audit' && <GisAuditDashboard />}
      </main>

      {/* Batch Enrichment Modal */}
      <BatchEnrichmentModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      {/* AI Assistant Chat Drawer */}
      <AIChatDrawer />
    </div>
  );
}
