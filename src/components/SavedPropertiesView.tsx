import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Trash2,
  ArrowUpRight,
  FileText,
  Calendar,
  Scale,
  CheckSquare,
  Square,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { PropertyRecord } from '../types';

interface SavedPropertiesViewProps {
  onSelectProperty: (query: string) => void;
  onRemoveSavedProperty: (propertyKey: string) => Promise<void>;
  compareKeys?: string[];
  onToggleCompare?: (propertyKey: string) => void;
  onCompareMultiple?: (propertyKeys: string[]) => void;
}

export const SavedPropertiesView: React.FC<SavedPropertiesViewProps> = ({
  onSelectProperty,
  onRemoveSavedProperty,
  compareKeys = [],
  onToggleCompare,
  onCompareMultiple,
}) => {
  const [savedProperties, setSavedProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedProperties(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (propertyKey: string) => {
    await onRemoveSavedProperty(propertyKey);
    setSelectedKeys((prev) => prev.filter((k) => k !== propertyKey));
    fetchSaved();
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === savedProperties.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(savedProperties.map((p) => p.propertyKey));
    }
  };

  const handleCompareSelected = () => {
    if (selectedKeys.length === 0) return;
    if (onCompareMultiple) {
      onCompareMultiple(selectedKeys);
    } else if (onToggleCompare) {
      selectedKeys.forEach((key) => {
        if (!compareKeys.includes(key)) {
          onToggleCompare(key);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Saved Properties & Bookmarks</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bookmarked California properties, custom solicitation notes, and comparison lists.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedProperties.length > 0 && (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition-all"
              >
                {selectedKeys.length === savedProperties.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {selectedKeys.length === savedProperties.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              {selectedKeys.length > 0 && (
                <button
                  onClick={handleCompareSelected}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare Selected ({selectedKeys.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </>
          )}

          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 font-bold">
            {savedProperties.length} Saved
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading saved properties...
        </div>
      ) : savedProperties.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Saved Properties</h3>
          <p className="text-xs text-slate-500">
            Search for a property and click "Save Property" to bookmark it to your CRM workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedProperties.map((prop) => {
            const isChecked = selectedKeys.includes(prop.propertyKey);
            const isInCompare =
              compareKeys.includes(prop.propertyKey) ||
              compareKeys.includes(prop.propertyKey.replace('oc:', ''));

            return (
              <div
                key={prop.id}
                className={`p-5 bg-white border rounded-2xl shadow-xs space-y-3 font-sans text-xs relative transition-all ${
                  isChecked
                    ? 'border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <button
                      onClick={() => toggleSelect(prop.propertyKey)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title={isChecked ? 'Deselect' : 'Select for compare'}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-mono font-bold">
                          APN {prop.propertyKey.replace('oc:', '')}
                        </span>
                        {isInCompare && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                            <Scale className="w-2.5 h-2.5" />
                            <span>In Compare</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                        {prop.formattedAddress}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {prop.city}, {prop.state} {prop.zipCode}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(prop.propertyKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {prop.savedNote && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs space-y-1">
                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                      Note:
                    </span>
                    <p className="font-sans">{prop.savedNote}</p>
                  </div>
                )}

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{prop.savedAt ? new Date(prop.savedAt).toLocaleDateString() : 'Saved'}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {onToggleCompare && (
                      <button
                        onClick={() => onToggleCompare(prop.propertyKey)}
                        className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all text-xs border ${
                          isInCompare
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Scale className="w-3 h-3 text-blue-600" />
                        <span>{isInCompare ? 'Compared' : 'Compare'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectProperty(prop.propertyKey.replace('oc:', ''))}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
