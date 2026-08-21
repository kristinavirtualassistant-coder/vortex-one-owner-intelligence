import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, Hash, Sparkles, X, Filter } from 'lucide-react';

interface SuggestionItem {
  type: string;
  display: string;
  searchKey: string;
  apn?: string;
}

interface PropertySearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  currentQuery?: string;
}

export const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  isLoading,
  currentQuery = '',
}) => {
  const [query, setQuery] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync state if currentQuery changes from parent
  useEffect(() => {
    if (currentQuery) {
      setQuery(currentQuery);
    }
  }, [currentQuery]);

  // Autocomplete suggestions fetch
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to hide suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    onSearch(query.trim());
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    const val = item.searchKey.replace(/^city:/, '').replace(/^property:/, '');
    setQuery(item.display);
    setShowSuggestions(false);
    onSearch(val);
  };

  const sampleProperties = [
    { label: 'Commercial High-Rise', address: '400 Spectrum Center Dr, Irvine, CA' },
    { label: 'Multifamily 12-Unit', address: '2076 Magnolia Ave, Long Beach, CA' },
    { label: 'Single-Family Res', address: '100 Main St, Seal Beach, CA' },
    { label: 'Resort Commercial', address: '1200 S Harbor Blvd, Anaheim, CA' },
    { label: 'Retail Strip Center', address: '456 Harbor Blvd, Costa Mesa, CA' },
  ];

  return (
    <div className="w-full space-y-3" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-indigo-600 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search Orange County property by Address, APN (e.g. 580-081-01), City, or Owner Name..."
            className="w-full pl-12 pr-28 py-4 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-900 placeholder-slate-400 text-sm md:text-base outline-none transition-all shadow-xs focus:ring-2 focus:ring-indigo-600/10"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-24 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50 divide-y divide-slate-100">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-all flex items-center space-x-3 group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                  {item.type === 'city' ? (
                    <MapPin className="w-4 h-4" />
                  ) : item.apn ? (
                    <Hash className="w-4 h-4" />
                  ) : (
                    <Building className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{item.display}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{item.type === 'city' ? 'City Jurisdiction' : 'Orange County Assessor Record'}</span>
                    {item.apn && <span className="font-mono text-indigo-600 text-[11px]">APN: {item.apn}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Quick Sample Queries */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-slate-400" />
          <span>Quick Samples:</span>
        </span>

        {sampleProperties.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(sample.address);
              onSearch(sample.address);
            }}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-indigo-600 transition-all flex items-center space-x-1.5"
          >
            <span className="font-medium">{sample.label}:</span>
            <span className="text-slate-500 text-[11px] truncate max-w-[140px]">{sample.address}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
