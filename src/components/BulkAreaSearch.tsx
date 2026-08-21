import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Bookmark,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Download
} from 'lucide-react';

interface BulkAreaSearchProps {
  onSelectProperty: (propertyKey: string) => void;
  onRefreshCounts: () => void;
}

export const BulkAreaSearch: React.FC<BulkAreaSearchProps> = ({
  onSelectProperty,
  onRefreshCounts,
}) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedUseCode, setSelectedUseCode] = useState('ALL');
  const [minVal, setMinVal] = useState<number>(0);
  const [maxVal, setMaxVal] = useState<number>(200000000);
  const [sortBy, setSortBy] = useState('value_desc');
  const [absenteeOnly, setAbsenteeOnly] = useState(false);

  // Selection for batch actions
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [batchNote, setBatchNote] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const CITIES = [
    'ALL',
    'IRVINE',
    'ANAHEIM',
    'NEWPORT BEACH',
    'COSTA MESA',
    'SEAL BEACH',
    'LONG BEACH',
    'SANTA ANA',
    'HUNTINGTON BEACH',
    'TUSTIN',
    'ORANGE'
  ];

  const USE_CODES = [
    { label: 'All Property Types', value: 'ALL' },
    { label: 'Commercial High-Rise / Office', value: 'COMMERCIAL' },
    { label: 'Multi-Family Apartments', value: 'MULTI-FAMILY' },
    { label: 'Retail & Shopping Strip', value: 'RETAIL' },
    { label: 'Hotel & Resort', value: 'RESORT' },
    { label: 'Industrial Warehouse', value: 'INDUSTRIAL' },
    { label: 'Single Family Residential', value: 'RESIDENTIAL' },
  ];

  const fetchBulkProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCity !== 'ALL') params.append('city', selectedCity);
      if (selectedUseCode !== 'ALL') params.append('useCode', selectedUseCode);
      params.append('minVal', minVal.toString());
      params.append('maxVal', maxVal.toString());
      params.append('sortBy', sortBy);

      const res = await fetch(`/api/bulk-search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch bulk property records.');
      const data = await res.json();
      
      let filtered = data.properties || [];
      if (absenteeOnly) {
        filtered = filtered.filter((p: any) => p.isAbsentee);
      }

      setProperties(filtered);
    } catch (err: any) {
      setError(err.message || 'Bulk search query failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulkProperties();
  }, [selectedCity, selectedUseCode, minVal, maxVal, sortBy, absenteeOnly]);

  const toggleSelectAll = () => {
    if (selectedKeys.length === properties.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(properties.map((p) => p.propertyKey || p.parcel.apn));
    }
  };

  const toggleSelectOne = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSaveSelected = async () => {
    try {
      for (const key of selectedKeys) {
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyKey: key, note: batchNote || 'Bulk saved via Area Explorer' }),
        });
      }
      onRefreshCounts();
      setActionSuccess(`Successfully saved ${selectedKeys.length} properties to bookmarks.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setShowBatchModal(false);
      setSelectedKeys([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['APN', 'Address', 'City', 'Owner Name', 'Owner Type', 'Total Assessed Value', 'Use Code', 'Units', 'Lead Score', 'Absentee'];
    const rows = properties
      .filter((p) => selectedKeys.length === 0 || selectedKeys.includes(p.propertyKey || p.parcel.apn))
      .map((p) => [
        p.parcel?.apn || '',
        `"${p.formattedAddress || ''}"`,
        p.city || '',
        `"${p.owner?.fullName || ''}"`,
        p.owner?.ownerType || '',
        p.totalVal || 0,
        `"${p.useCode || ''}"`,
        p.units || 1,
        p.leadScore || 50,
        p.isAbsentee ? 'YES' : 'NO'
      ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vortex_bulk_properties_${selectedCity.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Banner */}
      <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>Bulk Area Explorer & Multi-Property List</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Explore real Orange County assessed parcels across municipalities, filter by asset class or valuation, and select properties to inspect or save in bulk.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {selectedKeys.length > 0 && (
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl">
                <span className="text-sm font-bold text-blue-900">{selectedKeys.length} Selected</span>
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Selected
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </div>
            )}
            <button
              onClick={fetchBulkProperties}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all border border-slate-300 flex items-center gap-2 text-sm font-semibold shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filters and Sorting Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-blue-100">
          {/* City Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Municipality / City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-blue-600 outline-none shadow-inner"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Orange County Cities' : c}</option>
              ))}
            </select>
          </div>

          {/* Asset Class / Use Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Asset Class</label>
            <select
              value={selectedUseCode}
              onChange={(e) => setSelectedUseCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-blue-600 outline-none shadow-inner"
            >
              {USE_CODES.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          {/* Value Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Min Assessed Value</label>
            <select
              value={minVal}
              onChange={(e) => setMinVal(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-blue-600 outline-none shadow-inner"
            >
              <option value={0}>Any Valuation</option>
              <option value={1000000}>$1M+ Assessed</option>
              <option value={5000000}>$5M+ Assessed</option>
              <option value={20000000}>$20M+ Assessed</option>
              <option value={50000000}>$50M+ Assessed</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Sort Properties By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-blue-600 outline-none shadow-inner"
            >
              <option value="value_desc">Assessed Value: High to Low</option>
              <option value="value_asc">Assessed Value: Low to High</option>
              <option value="units_desc">Most Units / SqFt</option>
              <option value="newest">Newest Year Built</option>
            </select>
          </div>

          {/* Absentee Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all text-sm font-semibold text-slate-800 shadow-inner">
              <input
                type="checkbox"
                checked={absenteeOnly}
                onChange={(e) => setAbsenteeOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5"
              />
              <span>100% Absentee Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Property Results List */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-mono text-slate-600">Querying real county parcel records & ownership database...</div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium">
          {error}
        </div>
      ) : properties.length === 0 ? (
        <div className="p-16 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-2">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No properties matched your bulk filters</h3>
          <p className="text-sm text-slate-600">Try broadening your city, valuation, or asset class criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-sm font-bold text-slate-700 shadow-xs">
            <div className="flex items-center space-x-3">
              <button onClick={toggleSelectAll} className="flex items-center space-x-2 hover:text-blue-700 transition-all">
                {selectedKeys.length === properties.length && properties.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
                <span>Select All ({properties.length})</span>
              </button>
            </div>
            <div className="font-mono text-xs text-slate-600">
              Showing {properties.length} Assessed Parcels
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-4">
            {properties.map((prop) => {
              const key = prop.propertyKey || prop.parcel?.apn;
              const isSelected = selectedKeys.includes(key);

              return (
                <div
                  key={key}
                  className={`bg-white border rounded-3xl p-6 shadow-md transition-all hover:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 group ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/30' : 'border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-4 min-w-0">
                    <button
                      onClick={() => toggleSelectOne(key)}
                      className="mt-1 text-slate-400 hover:text-blue-600 transition-all shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Square className="w-6 h-6 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                          APN: {prop.parcel?.apn}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-medium">
                          {prop.city}, CA {prop.zipCode}
                        </span>
                        {prop.isAbsentee && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-mono font-bold">
                            ABSENTEE OWNER
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectProperty(key)}
                        className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-all cursor-pointer truncate flex items-center gap-2"
                      >
                        <span>{prop.formattedAddress}</span>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </h3>

                      <div className="text-sm text-slate-600 flex items-center space-x-3 flex-wrap gap-y-1">
                        <span>Owner: <strong className="text-slate-900">{prop.owner?.fullName}</strong></span>
                        <span>•</span>
                        <span>Asset: <strong className="text-slate-900">{prop.useCode}</strong></span>
                        <span>•</span>
                        <span>Built: {prop.yearBuilt || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Metrics & Actions */}
                  <div className="flex items-center justify-between md:justify-end space-x-6 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-blue-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase font-mono font-semibold">Assessed Value</div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ${((prop.totalVal || 0) / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-xs text-emerald-700 font-mono font-bold">
                        Lead Score: {prop.leadScore}/100
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectProperty(key)}
                      className="px-5 py-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-900 text-sm font-bold rounded-xl transition-all flex items-center space-x-2 shadow-xs"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Save Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-blue-200">
            <h3 className="text-xl font-bold text-slate-900">Save {selectedKeys.length} Properties</h3>
            <p className="text-sm text-slate-600">
              Add a custom note to tag these properties for your portfolio campaign or skip-trace queue.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Campaign Note / Tag</label>
              <input
                type="text"
                value={batchNote}
                onChange={(e) => setBatchNote(e.target.value)}
                placeholder="e.g. Q3 Irvine Multi-Family Outreach"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSelected}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs"
              >
                Confirm Save ({selectedKeys.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
