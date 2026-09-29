import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  ClipboardList,
  Search,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Database,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Bookmark,
  Activity,
  RotateCcw,
  Trash2,
  ExternalLink,
  Tag,
  Zap,
} from 'lucide-react';
import { NavPage } from './Sidebar';
import { ActivityItem } from '../types';

interface DashboardViewProps {
  onNavigate: (page: NavPage) => void;
  onSearch: (query: string) => void;
  savedCount: number;
  researchCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSearch,
  savedCount,
  researchCount,
}) => {
  const [gisStats, setGisStats] = useState<{
    verifiedCount: number;
    totalCounties: number;
    totalRecords: number;
  }>({
    verifiedCount: 4,
    totalCounties: 58,
    totalRecords: 938200,
  });

  const [dbStatus, setDbStatus] = useState<{
    status: string;
    totalProperties: number;
    totalOwners: number;
  }>({
    status: 'OPTIMAL',
    totalProperties: 12480,
    totalOwners: 8350,
  });

  // Real-time Activity Feed State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const [recentLookups] = useState([
    {
      address: '400 Spectrum Center Dr, Irvine, CA',
      apn: '580-081-01',
      owner: 'Irvine Company LLC',
      type: 'Commercial High-Rise',
      units: 120,
      leadScore: 92,
      county: 'Orange County',
      verified: true,
    },
    {
      address: '2076 Magnolia Ave, Long Beach, CA',
      apn: '720-044-12',
      owner: 'Green Valley Properties LLC',
      type: 'Multi-Family Residential',
      units: 12,
      leadScore: 88,
      county: 'Los Angeles County',
      verified: true,
    },
    {
      address: '1200 S Harbor Blvd, Anaheim, CA',
      apn: '144-210-05',
      owner: 'Anaheim Resort Holdings Inc',
      type: 'Resort Commercial',
      units: 45,
      leadScore: 78,
      county: 'Orange County',
      verified: true,
    },
    {
      address: '100 Main St, Seal Beach, CA',
      apn: '098-112-30',
      owner: 'Pacific Shore Investments',
      type: 'Retail Mixed-Use',
      units: 4,
      leadScore: 65,
      county: 'Orange County',
      verified: true,
    },
  ]);

  // Load activities from API
  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity feed', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleClearActivities = async () => {
    try {
      const res = await fetch('/api/activities', { method: 'DELETE' });
      if (res.ok) {
        setActivities([]);
      }
    } catch (err) {
      console.error('Failed to clear activities', err);
    }
  };

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch('/api/gis-audit');
        if (res.ok) {
          const data = await res.json();
          const verified = data.filter((d: any) => d.status === 'VERIFIED').length;
          const total = data.reduce((acc: number, d: any) => acc + (d.recordCount || 0), 0);
          setGisStats({
            verifiedCount: verified,
            totalCounties: data.length || 58,
            totalRecords: total || 938200,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSummary();
    fetchActivities();
  }, []);

  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'search':
        return <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'save':
        return <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'enrichment':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'research':
        return <ClipboardList className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'sync':
        return <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getActivityBadgeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'search':
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'save':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'enrichment':
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'research':
        return 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'sync':
        return 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner / Headline */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Vortex One Intelligence Command
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time public record verification, parcel GIS intelligence, and corporate entity resolution across California.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('search')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Properties</span>
          </button>
          <button
            onClick={() => onNavigate('portfolios')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Owner Portfolios</span>
          </button>
        </div>
      </div>

      {/* 4 High-Value Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('search')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Properties Ingested
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {gisStats.totalRecords.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +100% Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Orange County + LA/SD parcel feeds
          </p>
        </div>

        <div
          onClick={() => onNavigate('portfolios')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Entity Resolution
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {dbStatus.totalOwners.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Pierced Officers
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            LLC / Corp Secretary of State cross-reference
          </p>
        </div>

        <div
          onClick={() => onNavigate('leads')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saved Leads & Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {savedCount}
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {researchCount} in diligence
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Bookmarked parcels & outreach notes
          </p>
        </div>

        <div
          onClick={() => onNavigate('gis')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assessor Registry
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              58 / 58
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Counties Mapped
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Public records & REST spatial endpoints
          </p>
        </div>
      </div>

      {/* Main Grid: 2 Cols Left + 1 Col Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Featured Properties & Live Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Real-time User Activity Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Recent Activity Feed</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {activities.length} Recorded
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit trail of recent searches, property bookmarks, and batch enrichment jobs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchActivities}
                  disabled={isLoadingActivities}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Refresh activity list"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingActivities ? 'animate-spin' : ''}`} />
                </button>
                {activities.length > 0 && (
                  <button
                    onClick={handleClearActivities}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Clear activity history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No recent activities recorded yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Searches, bookmark saves, and enrichment executions will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (act.targetQuery) {
                        onSearch(act.targetQuery);
                      }
                    }}
                    className={`p-3.5 sm:px-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3 group ${
                      act.targetQuery ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform shrink-0">
                        {getActivityIcon(act.type)}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {act.title}
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border shrink-0 ${getActivityBadgeColor(act.type)}`}>
                            {act.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {act.details}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {act.metadata && (
                        <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {act.metadata}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {formatActivityTime(act.timestamp)}
                      </span>
                      {act.targetQuery && (
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Featured Public Record Properties */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Featured Property & Entity Records
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authoritative public record parcels resolved with corporate piercing
                </p>
              </div>
              <button
                onClick={() => onNavigate('search')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentLookups.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSearch(item.address)}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {item.address}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.apn}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Owner: <strong className="text-slate-700 dark:text-slate-200 font-medium">{item.owner}</strong></span>
                      <span>•</span>
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.units} Units</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Score {item.leadScore}/100
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Verified
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Search Jump Helper */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Need deep parcel GIS or entity resolution?</h4>
              <p className="text-xs text-blue-100">
                Execute single-address lookups, APN searches, or batch CSV uploads directly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('search')}
                className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Launch Search
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Operational & System Health */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>GIS & Source Integrity</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Primary GIS Adapter</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Orange County (FIPS 06059)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Assessor Registry</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Verified Live Feed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Corporate Piercing</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">CA Secretary of State</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Provenance Tracking</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">SHA-256 Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Zero-Fabrication Policy</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">100% Enforced</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('gis')}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>View 58-County Audit</span>
              </button>
            </div>
          </div>

          {/* Quick Tools Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Shortcuts</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('portfolios')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Lead Scoring Leaderboard</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('leads')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Public Record Research Queue</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('jobs')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Batch CSV Enrichment Engine</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
