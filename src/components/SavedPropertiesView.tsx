import React, { useEffect, useState } from 'react';
import { Bookmark, Trash2, ArrowUpRight, FileText, Calendar } from 'lucide-react';
import { PropertyRecord } from '../types';

interface SavedPropertiesViewProps {
  onSelectProperty: (query: string) => void;
  onRemoveSavedProperty: (propertyKey: string) => Promise<void>;
}

export const SavedPropertiesView: React.FC<SavedPropertiesViewProps> = ({
  onSelectProperty,
  onRemoveSavedProperty,
}) => {
  const [savedProperties, setSavedProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchSaved();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Saved Properties & Bookmarks</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Bookmarked Orange County properties, custom solicitation notes, and saved timestamps.
          </p>
        </div>

        <span className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl font-mono text-sm text-blue-900 font-bold">
          {savedProperties.length} Saved Items
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-sm">
          Loading saved properties...
        </div>
      ) : savedProperties.length === 0 ? (
        <div className="p-16 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-3">
          <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Saved Properties</h3>
          <p className="text-sm text-slate-600">Search for a property and click "Save Property" to bookmark it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedProperties.map((prop) => (
            <div
              key={prop.id}
              className="p-6 bg-white border border-blue-200 hover:border-blue-300 rounded-3xl shadow-md space-y-4 font-mono text-sm relative group transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    APN {prop.propertyKey.replace('oc:', '')}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-2 font-sans">
                    {prop.formattedAddress}
                  </h4>
                </div>

                <button
                  onClick={() => handleRemove(prop.propertyKey)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {prop.savedNote && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 font-mono text-xs space-y-1">
                  <span className="text-xs text-amber-600 font-bold uppercase tracking-wider block">
                    Saved Note:
                  </span>
                  <p className="font-sans">{prop.savedNote}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-sans">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Saved: {prop.savedAt ? new Date(prop.savedAt).toLocaleDateString() : 'Recently'}</span>
                </span>

                <button
                  onClick={() => onSelectProperty(prop.propertyKey.replace('oc:', ''))}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Open Intelligence</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
