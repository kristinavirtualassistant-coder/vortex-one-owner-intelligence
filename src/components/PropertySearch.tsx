import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Building,
  Hash,
  User,
  Globe,
  Sparkles,
  X,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { SearchSuggestion } from '../types';

interface PropertySearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  currentQuery?: string;
  onFilterChange?: (filters: any) => void;
}

export const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  isLoading,
  currentQuery = '',
  onFilterChange,
}) => {
  const [query, setQuery] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Compact Filters
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCounty, setSelectedCounty] = useState('ALL');
  const [absenteeOnly, setAbsenteeOnly] = useState(false);
  const [minUnits, setMinUnits] = useState('');
  const [minValue, setMinValue] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

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
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: SearchSuggestion[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 120);

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
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }
    if (!query.trim()) return;
    setShowSuggestions(false);
    onSearch(query.trim());
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    const val = item.searchKey || item.display;
    setQuery(item.display);
    setShowSuggestions(false);
    onSearch(val);
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
        return <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'apn':
        return <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'city':
        return <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'address':
      default:
        return <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const sampleProperties = [
    { label: 'Commercial High-Rise', address: '400 Spectrum Center Dr, Irvine, CA' },
    { label: 'Multifamily 12-Unit', address: '2076 Magnolia Ave, Long Beach, CA' },
    { label: 'Resort Commercial', address: '1200 S Harbor Blvd, Anaheim, CA' },
    { label: 'Single-Family Res', address: '100 Main St, Seal Beach, CA' },
    { label: 'Retail Strip Center', address: '456 Harbor Blvd, Costa Mesa, CA' },
  ];

  return (
    <div className="w-full space-y-3" ref={searchRef}>
      {/* Primary Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-blue-600 dark:text-blue-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            id="main-property-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search address, owner, APN (e.g. 580-081-01), city, ZIP..."
            className="w-full pl-12 pr-44 py-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm md:text-base outline-none transition-all shadow-xs focus:ring-2 focus:ring-blue-600/10"
          />

          <div className="absolute right-28 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold select-none pointer-events-none shadow-2xs">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Quick-Type Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
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
                  className={`w-full px-4 py-3 text-left transition-all flex items-center space-x-3 group ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-800/60'
                      : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                  }`}>
                    {getSuggestionIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate flex items-center gap-2">
                      <span className="truncate">{item.title}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {item.category || item.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 mt-0.5">
                      <span>{item.subtitle}</span>
                      {item.apn && (
                        <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                          APN: {item.apn}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'
                  }`} />
                </button>
              );
            })}
          </div>
        )}
      </form>

      {/* Compact Quick Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {sampleProperties.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(sample.address);
                onSearch(sample.address);
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <span className="font-medium">{sample.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            showAdvanced
              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Filters</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 text-xs animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Property Category
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Commercial">Commercial / Office</option>
                <option value="Residential">Residential (1-4 Units)</option>
                <option value="Multi-Family">Multi-Family (5+ Units)</option>
                <option value="Industrial">Industrial / Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                County / Region
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="ALL">All Counties (58 California)</option>
                <option value="Orange">Orange County (Primary Verified)</option>
                <option value="Los Angeles">Los Angeles County</option>
                <option value="San Diego">San Diego County</option>
                <option value="Riverside">Riverside County</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Units
              </label>
              <input
                type="number"
                value={minUnits}
                onChange={(e) => setMinUnits(e.target.value)}
                placeholder="e.g. 5"
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ownership Status
              </label>
              <div className="flex items-center h-9">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={absenteeOnly}
                    onChange={(e) => setAbsenteeOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Absentee Owner / Non-Occupant Only
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
