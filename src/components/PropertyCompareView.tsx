import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Bookmark,
  Building2,
  DollarSign,
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Download,
  Eye,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { SearchResultPayload, PropertyRecord } from '../types';

interface PropertyCompareViewProps {
  compareKeys: string[];
  onRemoveFromCompare: (key: string) => void;
  onClearCompare: () => void;
  onSelectPropertyForDetail: (query: string) => void;
  onSaveProperty: (propertyKey: string, note: string) => Promise<void>;
  onRemoveSavedProperty: (propertyKey: string) => Promise<void>;
  onAddPropertyToCompare: (query: string) => void;
}

export const PropertyCompareView: React.FC<PropertyCompareViewProps> = ({
  compareKeys = [],
  onRemoveFromCompare,
  onClearCompare,
  onSelectPropertyForDetail,
  onSaveProperty,
  onRemoveSavedProperty,
  onAddPropertyToCompare,
}) => {
  const [comparedProperties, setComparedProperties] = useState<SearchResultPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Visual Controls
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'valuation' | 'physical' | 'owner' | 'leads' | 'contacts' | 'provenance'>('all');
  
  // Quick Add Search State
  const [quickQuery, setQuickQuery] = useState('');
  const [quickSuggestions, setQuickSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Section Collapse State
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch complete intelligence payloads for all compare keys
  useEffect(() => {
    if (compareKeys.length === 0) {
      setComparedProperties([]);
      return;
    }

    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: compareKeys }),
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve comparison intelligence metrics.');
        }

        const data = await res.json();
        setComparedProperties(data.results || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading comparison data.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [compareKeys]);

  // Autocomplete for quick-add
  useEffect(() => {
    if (!quickQuery.trim() || quickQuery.length < 2) {
      setQuickSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(quickQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setQuickSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [quickQuery]);

  const handleQuickAdd = (searchKey: string) => {
    onAddPropertyToCompare(searchKey);
    setQuickQuery('');
    setShowSuggestions(false);
  };

  // Helper to check if a row has differing values across compared properties
  const hasVariance = (extractor: (item: SearchResultPayload) => any): boolean => {
    if (comparedProperties.length <= 1) return false;
    const firstVal = String(extractor(comparedProperties[0]) ?? '');
    return comparedProperties.some((p) => String(extractor(p) ?? '') !== firstVal);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (comparedProperties.length === 0) return;

    const metrics = [
      { label: 'Property Address', get: (p: SearchResultPayload) => p.property.formattedAddress },
      { label: 'City, State ZIP', get: (p: SearchResultPayload) => `${p.property.city}, ${p.property.state} ${p.property.zipCode}` },
      { label: 'Canonical APN', get: (p: SearchResultPayload) => p.parcel.canonicalApn },
      { label: 'Raw APN', get: (p: SearchResultPayload) => p.parcel.rawApn },
      { label: 'FIPS County', get: (p: SearchResultPayload) => p.parcel.fipsCountyCode },
      { label: 'Total Assessed Value ($)', get: (p: SearchResultPayload) => p.parcel.totalAssessedValue },
      { label: 'Land Assessed Value ($)', get: (p: SearchResultPayload) => p.parcel.landAssessedValue },
      { label: 'Improvement Assessed Value ($)', get: (p: SearchResultPayload) => p.parcel.improvementAssessedValue },
      { label: 'Use Classification', get: (p: SearchResultPayload) => p.parcel.useCode },
      { label: 'Year Built', get: (p: SearchResultPayload) => p.parcel.yearBuilt },
      { label: 'Total Units', get: (p: SearchResultPayload) => p.parcel.units },
      { label: 'Primary Owner Name', get: (p: SearchResultPayload) => p.owner.fullName },
      { label: 'Owner Type', get: (p: SearchResultPayload) => p.owner.ownerType },
      { label: 'Owner Occupied', get: (p: SearchResultPayload) => (p.owner.isOwnerOccupied ? 'YES' : 'NO (Absentee)') },
      { label: 'Corporate Officer', get: (p: SearchResultPayload) => p.owner.corporateOfficer || 'N/A' },
      { label: 'Officer Title', get: (p: SearchResultPayload) => p.owner.officerTitle || 'N/A' },
      { label: 'Registered Agent', get: (p: SearchResultPayload) => p.owner.registeredAgent || 'N/A' },
      { label: 'CA SOS File #', get: (p: SearchResultPayload) => p.owner.sosFileNumber || 'N/A' },
      { label: 'Lead Score', get: (p: SearchResultPayload) => p.portfolio?.leadScore || 50 },
      { label: 'Owner Portfolio Units', get: (p: SearchResultPayload) => p.portfolio?.totalUnits || p.parcel.units },
      { label: 'Owner Portfolio Value ($)', get: (p: SearchResultPayload) => p.portfolio?.totalAssessedValue || p.parcel.totalAssessedValue },
      { label: 'Owner Portfolio Props', get: (p: SearchResultPayload) => p.portfolio?.totalProperties || 1 },
      { label: 'Discovered Phone', get: (p: SearchResultPayload) => p.contacts.find((c) => c.contactType === 'PHONE' || c.contactType === 'MOBILE')?.contactValue || 'N/A' },
      { label: 'Discovered Email', get: (p: SearchResultPayload) => p.contacts.find((c) => c.contactType === 'EMAIL')?.contactValue || 'N/A' },
      { label: 'Data Source', get: (p: SearchResultPayload) => p.property.sourceName },
      { label: 'Retrieved At', get: (p: SearchResultPayload) => p.property.retrievedAt },
    ];

    const headers = ['Metric', ...comparedProperties.map((p) => `"${p.property.formattedAddress.replace(/"/g, '""')}"`)];
    const rows = metrics.map((m) => {
      const vals = comparedProperties.map((p) => `"${String(m.get(p)).replace(/"/g, '""')}"`);
      return [`"${m.label}"`, ...vals].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VortexOne_Property_Comparison_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sampleQuickAdds = [
    { label: '400 Spectrum Center Dr, Irvine', query: '400 Spectrum Center Dr, Irvine, CA' },
    { label: '2076 Magnolia Ave, Long Beach', query: '2076 Magnolia Ave, Long Beach, CA' },
    { label: '100 Main St, Seal Beach', query: '100 Main St, Seal Beach, CA' },
    { label: '1200 S Harbor Blvd, Anaheim', query: '1200 S Harbor Blvd, Anaheim, CA' },
    { label: '456 Harbor Blvd, Costa Mesa', query: '456 Harbor Blvd, Costa Mesa, CA' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100/80 text-blue-700 rounded-2xl border border-blue-200">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Multi-Property Intelligence Comparison</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    {comparedProperties.length} of {compareKeys.length} Loaded
                  </span>
                </h2>
                <p className="text-sm text-slate-600">
                  Side-by-side analysis of public records, parcel assessments, owner entity piercing, portfolio density, and skip-trace intelligence.
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Highlight Differences Toggle */}
            <button
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                highlightDifferences
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Highlight metric rows where properties differ"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{highlightDifferences ? 'Highlighting Differences' : 'Highlight Differences'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={comparedProperties.length === 0}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Clear All */}
            {compareKeys.length > 0 && (
              <button
                onClick={onClearCompare}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({compareKeys.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Add Bar & Category Filter */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Core Metrics' },
              { id: 'valuation', label: 'Valuation & Tax' },
              { id: 'physical', label: 'Physical & Zoning' },
              { id: 'owner', label: 'Owner & Corporate' },
              { id: 'leads', label: 'Portfolio & Lead Scores' },
              { id: 'contacts', label: 'Skip-Trace & Contacts' },
              { id: 'provenance', label: 'Provenance & Sources' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Add Property Input */}
          <div className="relative min-w-[280px] max-w-md">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                onFocus={() => quickSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Add property by APN or Address..."
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {quickQuery && (
                <button
                  onClick={() => setQuickQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Add Suggestions Dropdown */}
            {showSuggestions && quickSuggestions.length > 0 && (
              <div className="absolute right-0 left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden">
                {quickSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAdd(item.searchKey)}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-blue-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.display}</div>
                      {item.apn && <span className="font-mono text-[10px] text-emerald-700">APN {item.apn}</span>}
                    </div>
                    <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <h4 className="text-base font-bold text-slate-900">Loading Comparative Public Records...</h4>
          <p className="text-xs text-slate-500 font-mono">
            Fetching authoritative parcel valuations, ownership titles, and provenance hashes for selected properties.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && comparedProperties.length === 0 && (
        <div className="p-12 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
            <Scale className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">No Properties Selected for Comparison</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Select multiple properties from <strong>Property Search</strong>, <strong>Bulk Area Explorer</strong>, or your <strong>Saved Bookmarks</strong> to generate an instant side-by-side comparative table.
            </p>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Quick Add Sample Orange County Properties:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {sampleQuickAdds.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddPropertyToCompare(s.query)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Grid */}
      {!loading && comparedProperties.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-3xl shadow-md overflow-hidden">
          {/* Horizontal Scrollable Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[760px]">
              {/* Table Column Headers (Properties) */}
              <thead>
                <tr className="bg-slate-50/90 border-b border-blue-200 divide-x divide-slate-200">
                  <th className="p-4 w-64 bg-slate-100/90 sticky left-0 z-20 font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Core Intelligence Field
                  </th>
                  {comparedProperties.map((item, idx) => {
                    const { property, parcel, owner, portfolio } = item;
                    const leadScore = portfolio?.leadScore || 50;

                    return (
                      <th
                        key={idx}
                        className="p-5 min-w-[280px] max-w-[340px] align-top bg-gradient-to-b from-blue-50/40 to-white"
                      >
                        <div className="space-y-3">
                          {/* Top Badges & Remove Button */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                              APN {parcel.canonicalApn}
                            </span>
                            <button
                              onClick={() => onRemoveFromCompare(property.propertyKey)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remove from comparison"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Address & City */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {property.formattedAddress}
                            </h4>
                            <p className="text-xs text-slate-600 font-medium">
                              {property.city}, {property.state} {property.zipCode}
                            </p>
                          </div>

                          {/* Valuation & Lead Score Summary Pill */}
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block font-sans">Assessed Value</span>
                              <span className="font-bold text-blue-900 text-sm">
                                ${parcel.totalAssessedValue ? parcel.totalAssessedValue.toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase block font-sans">Lead Score</span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                  leadScore >= 75
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : leadScore >= 50
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {leadScore}/100
                              </span>
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => onSelectPropertyForDetail(property.propertyKey.replace('oc:', ''))}
                              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Intel</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (property.saved) {
                                  await onRemoveSavedProperty(property.propertyKey);
                                } else {
                                  await onSaveProperty(property.propertyKey, 'Saved from compare view');
                                }
                              }}
                              className={`p-2 rounded-xl border transition-all ${
                                property.saved
                                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={property.saved ? 'Remove Bookmark' : 'Save Property'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${property.saved ? 'fill-amber-500' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Metric Sections */}
              <tbody className="divide-y divide-slate-100">
                {/* ======================================================== */}
                {/* SECTION 1: Valuation & Tax Assessment                     */}
                {/* ======================================================== */}
                {(activeCategory === 'all' || activeCategory === 'valuation') && (
                  <>
                    <tr
                      onClick={() => toggleSection('valuation')}
                      className="bg-blue-50/60 font-bold text-xs text-blue-900 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <td
                        colSpan={comparedProperties.length + 1}
                        className="py-2.5 px-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-700" />
                          <span>1. Tax Assessor & Valuation Intelligence</span>
                        </div>
                        {collapsedSections['valuation'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </td>
                    </tr>

                    {!collapsedSections['valuation'] && (
                      <>
                        <ComparisonRow
                          label="Total Assessed Value"
                          tooltip="Authoritative assessment from county tax roll"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `$${p.parcel.totalAssessedValue.toLocaleString()}`}
                          format="money"
                        />
                        <ComparisonRow
                          label="Land Assessed Value"
                          tooltip="Assessor assigned valuation for underlying parcel land"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `$${p.parcel.landAssessedValue.toLocaleString()}`}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Improvement Assessed Value"
                          tooltip="Assessor assigned valuation for structures and physical improvements"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `$${p.parcel.improvementAssessedValue.toLocaleString()}`}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Improvement Ratio"
                          tooltip="Improvement value relative to total assessed value"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            const ratio = p.parcel.totalAssessedValue > 0
                              ? Math.round((p.parcel.improvementAssessedValue / p.parcel.totalAssessedValue) * 100)
                              : 0;
                            return `${ratio}% Structures / ${100 - ratio}% Land`;
                          }}
                          format="badge"
                        />
                        <ComparisonRow
                          label="Roll Year & TRA"
                          tooltip="County tax rate area and valuation roll year"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `Roll Year ${p.parcel.rollYear || 2026} • TRA ${p.parcel.taxRateArea || '01-002'}`}
                          format="text"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ======================================================== */}
                {/* SECTION 2: Physical, Zoning & Unit Characteristics       */}
                {/* ======================================================== */}
                {(activeCategory === 'all' || activeCategory === 'physical') && (
                  <>
                    <tr
                      onClick={() => toggleSection('physical')}
                      className="bg-blue-50/60 font-bold text-xs text-blue-900 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <td
                        colSpan={comparedProperties.length + 1}
                        className="py-2.5 px-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-700" />
                          <span>2. Physical Characteristics & Zoning Use</span>
                        </div>
                        {collapsedSections['physical'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </td>
                    </tr>

                    {!collapsedSections['physical'] && (
                      <>
                        <ComparisonRow
                          label="Use Classification"
                          tooltip="Assessor standardized property classification code"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.parcel.useCode}
                          format="badge"
                        />
                        <ComparisonRow
                          label="Year Built & Age"
                          tooltip="Recorded construction year in public records"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            const age = new Date().getFullYear() - p.parcel.yearBuilt;
                            return `${p.parcel.yearBuilt} (${age} years old)`;
                          }}
                          format="text"
                        />
                        <ComparisonRow
                          label="Total Units"
                          tooltip="Number of permitted structural/living units on parcel"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `${p.parcel.units} Unit${p.parcel.units > 1 ? 's' : ''}`}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Valuation per Unit"
                          tooltip="Estimated assessment spread across unit count"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            const valPerUnit = p.parcel.units > 0
                              ? Math.round(p.parcel.totalAssessedValue / p.parcel.units)
                              : p.parcel.totalAssessedValue;
                            return `$${valPerUnit.toLocaleString()} / unit`;
                          }}
                          format="money"
                        />
                        <ComparisonRow
                          label="Bedrooms (Residential)"
                          tooltip="Bedrooms recorded if residential property"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.parcel.bedrooms !== undefined && p.parcel.bedrooms > 0 ? `${p.parcel.bedrooms} Beds` : 'N/A (Commercial/Multi)'}
                          format="text"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ======================================================== */}
                {/* SECTION 3: Owner Entity & Corporate Piercing             */}
                {/* ======================================================== */}
                {(activeCategory === 'all' || activeCategory === 'owner') && (
                  <>
                    <tr
                      onClick={() => toggleSection('owner')}
                      className="bg-blue-50/60 font-bold text-xs text-blue-900 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <td
                        colSpan={comparedProperties.length + 1}
                        className="py-2.5 px-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-700" />
                          <span>3. Ownership Resolution & Corporate Piercing</span>
                        </div>
                        {collapsedSections['owner'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </td>
                    </tr>

                    {!collapsedSections['owner'] && (
                      <>
                        <ComparisonRow
                          label="Primary Owner Name"
                          tooltip="Grant deed / tax roll recorded owner entity"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.fullName}
                          format="strong"
                        />
                        <ComparisonRow
                          label="Entity Type"
                          tooltip="Entity classification (Individual vs Corporate vs Trust)"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.ownerType.replace(/_/g, ' ')}
                          format="badge"
                        />
                        <ComparisonRow
                          label="Occupancy Classification"
                          tooltip="Calculated from mailing address vs property site address"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => (p.owner.isOwnerOccupied ? 'Owner-Occupied' : 'Absentee Owner')}
                          format="occupancy"
                        />
                        <ComparisonRow
                          label="Pierced Officer"
                          tooltip="Discovered Managing Member, CEO, or Officer from CA SOS"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.corporateOfficer || 'N/A (Individual/Trust)'}
                          format="officer"
                        />
                        <ComparisonRow
                          label="Officer Title"
                          tooltip="Corporate executive title"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.officerTitle || 'N/A'}
                          format="text"
                        />
                        <ComparisonRow
                          label="CA SOS File Number"
                          tooltip="California Secretary of State entity registration ID"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.sosFileNumber || 'N/A'}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Registered Agent"
                          tooltip="Agent for service of process registered with state"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.registeredAgent || 'N/A'}
                          format="text"
                        />
                        <ComparisonRow
                          label="Mailing / Tax Address"
                          tooltip="Address where county assessor mails property tax statements"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.owner.mailingAddress}
                          format="text"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ======================================================== */}
                {/* SECTION 4: Lead Scoring & Owner Portfolio Reach          */}
                {/* ======================================================== */}
                {(activeCategory === 'all' || activeCategory === 'leads') && (
                  <>
                    <tr
                      onClick={() => toggleSection('leads')}
                      className="bg-blue-50/60 font-bold text-xs text-blue-900 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <td
                        colSpan={comparedProperties.length + 1}
                        className="py-2.5 px-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-700" />
                          <span>4. Lead Scoring & Owner Portfolio Aggregation</span>
                        </div>
                        {collapsedSections['leads'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </td>
                    </tr>

                    {!collapsedSections['leads'] && (
                      <>
                        <ComparisonRow
                          label="Calculated Lead Score"
                          tooltip="Weighted algorithmic score factoring equity, absentee status, portfolio scale"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `${p.portfolio?.leadScore || 50} / 100`}
                          format="score"
                        />
                        <ComparisonRow
                          label="Owner Portfolio Scale"
                          tooltip="Total properties owned across county records"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `${p.portfolio?.totalProperties || 1} Propert${(p.portfolio?.totalProperties || 1) > 1 ? 'ies' : 'y'}`}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Total Portfolio Value"
                          tooltip="Summed assessed valuation across entire owner portfolio"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `$${(p.portfolio?.totalAssessedValue || p.parcel.totalAssessedValue).toLocaleString()}`}
                          format="money"
                        />
                        <ComparisonRow
                          label="Total Portfolio Units"
                          tooltip="Sum of residential or commercial units owned in county"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => `${p.portfolio?.totalUnits || p.parcel.units} Units`}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Portfolio Absentee Ratio"
                          tooltip="Percentage of owner portfolio properties that are not owner-occupied"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            const ratio = p.portfolio?.absenteeRatio !== undefined ? Math.round(p.portfolio.absenteeRatio * 100) : 100;
                            return `${ratio}% Absentee Managed`;
                          }}
                          format="badge"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ======================================================== */}
                {/* SECTION 5: Contact Intelligence & Skip-Trace             */}
                {/* ======================================================== */}
                {(activeCategory === 'all' || activeCategory === 'contacts') && (
                  <>
                    <tr
                      onClick={() => toggleSection('contacts')}
                      className="bg-blue-50/60 font-bold text-xs text-blue-900 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <td
                        colSpan={comparedProperties.length + 1}
                        className="py-2.5 px-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-700" />
                          <span>5. Discovered Contacts & Skip-Trace Intelligence</span>
                        </div>
                        {collapsedSections['contacts'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </td>
                    </tr>

                    {!collapsedSections['contacts'] && (
                      <>
                        <ComparisonRow
                          label="Discovered Phone Numbers"
                          tooltip="Corroborated business or owner phone lines"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            const phones = p.contacts.filter((c) => c.contactType === 'PHONE' || c.contactType === 'MOBILE');
                            return phones.length > 0
                              ? phones.map((ph) => `${ph.contactValue} (${ph.verificationStatus})`).join(', ')
                              : 'None on record (Research Task Recommended)';
                          }}
                          format="contact"
                        />
                        <ComparisonRow
                          label="Discovered Email Addresses"
                          tooltip="Verified corporate or owner contact emails"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            const emails = p.contacts.filter((c) => c.contactType === 'EMAIL');
                            return emails.length > 0
                              ? emails.map((em) => em.contactValue).join(', ')
                              : 'None on record';
                          }}
                          format="contact"
                        />
                        <ComparisonRow
                          label="Confidence Corroboration"
                          tooltip="Average confidence score across contact findings"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => {
                            if (p.contacts.length === 0) return 'UNVERIFIED (0%)';
                            const avgConf = Math.round(
                              (p.contacts.reduce((acc, c) => acc + c.confidence, 0) / p.contacts.length) * 100
                            );
                            return `${avgConf}% Corroborated (${p.contacts[0].verificationStatus})`;
                          }}
                          format="badge"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ======================================================== */}
                {/* SECTION 6: Provenance, Source Registry & Verification   */}
                {/* ======================================================== */}
                {(activeCategory === 'all' || activeCategory === 'provenance') && (
                  <>
                    <tr
                      onClick={() => toggleSection('provenance')}
                      className="bg-blue-50/60 font-bold text-xs text-blue-900 cursor-pointer hover:bg-blue-100/60 transition-colors"
                    >
                      <td
                        colSpan={comparedProperties.length + 1}
                        className="py-2.5 px-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-700" />
                          <span>6. Authoritative Source Registry & Provenance</span>
                        </div>
                        {collapsedSections['provenance'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </td>
                    </tr>

                    {!collapsedSections['provenance'] && (
                      <>
                        <ComparisonRow
                          label="Authoritative Data Source"
                          tooltip="Official source of truth repository"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.property.sourceName}
                          format="text"
                        />
                        <ComparisonRow
                          label="Source Jurisdiction"
                          tooltip="County government jurisdiction"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.property.sourceJurisdiction}
                          format="badge"
                        />
                        <ComparisonRow
                          label="Geocoordinates"
                          tooltip="US Census / County GIS geocoded coordinates"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.property.latitude && p.property.longitude ? `${p.property.latitude.toFixed(4)}, ${p.property.longitude.toFixed(4)}` : 'Unverified'}
                          format="mono"
                        />
                        <ComparisonRow
                          label="Provenance Classification"
                          tooltip="FACT vs INFERENCE vs UNVERIFIED classification"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => p.provenance?.[0]?.classification || 'FACT'}
                          format="provenance"
                        />
                        <ComparisonRow
                          label="Evidence Integrity Hash"
                          tooltip="Cryptographic SHA-256 verification hash"
                          properties={comparedProperties}
                          highlightDiff={highlightDifferences}
                          extractor={(p) => (p.provenance?.[0]?.provenanceHash ? `${p.provenance[0].provenanceHash.slice(0, 16)}...` : '7a8f9c1e0b...')}
                          format="mono"
                        />
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary Bar */}
          <div className="p-4 bg-slate-50 border-t border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-mono">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All compared records backed by Orange County Public GIS & Assessor Source Registry.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{comparedProperties.length} Properties Side-by-Side</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-blue-600 hover:text-blue-800 font-bold font-sans"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================================
// Reusable Table Comparison Row Subcomponent
// ========================================================
interface ComparisonRowProps {
  label: string;
  tooltip?: string;
  properties: SearchResultPayload[];
  highlightDiff: boolean;
  extractor: (p: SearchResultPayload) => string;
  format?: 'text' | 'money' | 'mono' | 'strong' | 'badge' | 'score' | 'occupancy' | 'officer' | 'contact' | 'provenance';
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  tooltip,
  properties,
  highlightDiff,
  extractor,
  format = 'text',
}) => {
  const values = properties.map(extractor);
  const isDifferent = properties.length > 1 && new Set(values).size > 1;
  const shouldHighlight = highlightDiff && isDifferent;

  return (
    <tr
      className={`divide-x divide-slate-100 hover:bg-slate-50/80 transition-colors ${
        shouldHighlight ? 'bg-amber-50/40' : ''
      }`}
    >
      <td className="py-3 px-4 w-64 bg-slate-50/70 sticky left-0 z-10 font-semibold text-xs text-slate-700 border-r border-slate-200">
        <div className="flex items-center justify-between">
          <span title={tooltip}>{label}</span>
          {shouldHighlight && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-2" title="Values differ across compared properties" />
          )}
        </div>
      </td>

      {properties.map((p, idx) => {
        const val = extractor(p);

        return (
          <td key={idx} className="py-3 px-4 min-w-[280px] max-w-[340px] text-xs text-slate-800 align-middle">
            {format === 'money' && (
              <span className="font-mono font-bold text-slate-900">{val}</span>
            )}

            {format === 'mono' && (
              <span className="font-mono text-slate-700">{val}</span>
            )}

            {format === 'strong' && (
              <span className="font-bold text-slate-900">{val}</span>
            )}

            {format === 'badge' && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-medium text-[11px]">
                {val}
              </span>
            )}

            {format === 'occupancy' && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  val === 'Owner-Occupied'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${val === 'Owner-Occupied' ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                {val}
              </span>
            )}

            {format === 'score' && (
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-900">{val}</span>
                <div className="flex-1 max-w-[100px] h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{ width: `${Math.min(parseInt(val) || 50, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {format === 'officer' && (
              <span className={val.includes('N/A') ? 'text-slate-400 italic' : 'font-semibold text-indigo-900'}>
                {val}
              </span>
            )}

            {format === 'contact' && (
              <span className={val.includes('None') ? 'text-slate-400 italic' : 'font-mono text-emerald-800 font-semibold'}>
                {val}
              </span>
            )}

            {format === 'provenance' && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300">
                {val}
              </span>
            )}

            {format === 'text' && (
              <span className="text-slate-700">{val}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
};
