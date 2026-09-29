import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Globe,
  Bookmark,
  FileSpreadsheet,
  Server,
  Cpu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Clock,
  History,
  Trash2,
  X,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';
import { DatabaseStatus } from './DatabaseStatus';
import { AuthWidget } from './AuthWidget';
import { RecentSearchItem } from '../types';

export type NavPage =
  | 'dashboard'
  | 'search'
  | 'portfolios'
  | 'gis'
  | 'leads'
  | 'jobs'
  | 'admin'
  | 'compare';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  savedCount: number;
  researchCount: number;
  compareCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAIChat?: () => void;
  recentSearches?: RecentSearchItem[];
  onSelectRecentSearch?: (query: string) => void;
  onClearRecentSearches?: () => void;
  onRemoveRecentSearch?: (id: string) => void;
  currentQuery?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  savedCount,
  researchCount,
  compareCount,
  collapsed,
  onToggleCollapse,
  onOpenAIChat,
  recentSearches = [],
  onSelectRecentSearch,
  onClearRecentSearches,
  onRemoveRecentSearch,
  currentQuery,
}) => {
  // Dark mode state with persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vortex_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Recent searches collapsible section state
  const [isRecentSearchesOpen, setIsRecentSearchesOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vortex_sidebar_recent_open');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const toggleRecentSearches = () => {
    setIsRecentSearchesOpen((prev) => {
      const next = !prev;
      localStorage.setItem('vortex_sidebar_recent_open', String(next));
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('vortex_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavPage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'search' as NavPage,
      label: 'Property Search',
      icon: Search,
      badge: null,
    },
    {
      id: 'portfolios' as NavPage,
      label: 'Owner Intelligence',
      icon: Briefcase,
      badge: null,
    },
    {
      id: 'gis' as NavPage,
      label: 'GIS & Data',
      icon: Globe,
      badge: '58 Co',
    },
    {
      id: 'leads' as NavPage,
      label: 'Leads & Research',
      icon: Bookmark,
      badge: savedCount + researchCount > 0 ? `${savedCount + researchCount}` : null,
    },
    {
      id: 'jobs' as NavPage,
      label: 'Jobs & Importer',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'admin' as NavPage,
      label: 'System Admin',
      icon: Server,
      badge: null,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 print:hidden ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight truncate">
                  Vortex One
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">
                CMC VR1
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links & Collapsible Recent Searches */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Main Nav Items */}
        <div className="space-y-1.5">
          <div className={`px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? '•••' : 'Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-800 whitespace-nowrap hidden group-hover:block z-50">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}

          {/* Side-by-side comparison shortcut if compare count > 0 */}
          {compareCount > 0 && (
            <button
              onClick={() => onNavigate('compare')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                activePage === 'compare'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-950/50 border border-indigo-500/30'
              } ${collapsed ? 'justify-center' : ''}`}
              title="Side-by-side property comparison"
            >
              <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
              {!collapsed && (
                <span className="truncate flex-1 text-left">Comparison Queue</span>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                {compareCount}
              </span>
            </button>
          )}
        </div>

        {/* Collapsible Recent Searches Section */}
        <div className="pt-2 border-t border-slate-800/80">
          {!collapsed ? (
            <div className="space-y-2">
              {/* Section Header with Expand/Collapse & Clear Button */}
              <div className="flex items-center justify-between px-2 py-1">
                <button
                  id="toggle-recent-searches-button"
                  type="button"
                  onClick={toggleRecentSearches}
                  className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer group"
                >
                  <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span>Recent Searches</span>
                  {recentSearches.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700/80">
                      {recentSearches.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      isRecentSearchesOpen ? '' : '-rotate-90'
                    }`}
                  />
                </button>

                {recentSearches.length > 0 && onClearRecentSearches && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearRecentSearches();
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Clear recent searches history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Collapsible Content List */}
              {isRecentSearchesOpen && (
                <div className="space-y-1">
                  {recentSearches.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                      No recent searches yet. Search any property to build your jump list.
                    </div>
                  ) : (
                    recentSearches.slice(0, 8).map((item) => {
                      const isCurrent =
                        activePage === 'search' &&
                        currentQuery &&
                        (currentQuery.toLowerCase() === item.query.toLowerCase() ||
                          currentQuery.toLowerCase() === item.title.toLowerCase());

                      return (
                        <div
                          key={item.id}
                          className={`group/item flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-900/40 text-blue-200 border border-blue-700/50 shadow-2xs font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                          }`}
                          onClick={() => {
                            if (onSelectRecentSearch) {
                              onSelectRecentSearch(item.query);
                            }
                          }}
                          title={`Jump to ${item.title}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isCurrent
                                  ? 'text-blue-400'
                                  : 'text-slate-500 group-hover/item:text-blue-400 transition-colors'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs leading-snug">
                                {item.title}
                              </p>
                              {(item.subtitle || item.apn) && (
                                <p className="truncate text-[10px] text-slate-500 group-hover/item:text-slate-400">
                                  {item.apn ? `APN: ${item.apn}` : item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1.5">
                            {item.timestamp && (
                              <span className="text-[9px] text-slate-500 font-mono group-hover/item:hidden">
                                {formatTimeAgo(item.timestamp)}
                              </span>
                            )}
                            {onRemoveRecentSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveRecentSearch(item.id);
                                }}
                                className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-all cursor-pointer"
                                title="Remove item"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Sidebar View: Icon with Badge and Tooltip */
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onNavigate('search')}
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all relative group cursor-pointer"
                title="Recent Searches"
              >
                <History className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                {recentSearches.length > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-500"></span>
                )}
                {/* Collapsed Tooltip */}
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-800 whitespace-nowrap hidden group-hover:block z-50">
                  Recent Searches ({recentSearches.length})
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Theme Toggle & AI Assistant Quick Trigger */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Dark Mode Toggle Switch */}
        <button
          id="theme-toggle-button"
          type="button"
          onClick={toggleTheme}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all border border-slate-700/60 group relative cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            {!collapsed && (
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            )}
          </div>

          {!collapsed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-400 border border-slate-700/50">
              {theme === 'dark' ? 'ON' : 'OFF'}
            </span>
          )}

          {collapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-800 whitespace-nowrap hidden group-hover:block z-50">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </div>
          )}
        </button>

        {onOpenAIChat && (
          <button
            onClick={onOpenAIChat}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium transition-all group cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Open AI Research Assistant"
          >
            <Sparkles className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="truncate text-xs font-semibold">AI Assistant</span>}
          </button>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <DatabaseStatus />
        </div>
        {!collapsed && (
          <div className="pt-2 border-t border-slate-800/60">
            <AuthWidget />
          </div>
        )}
      </div>
    </aside>
  );
};

