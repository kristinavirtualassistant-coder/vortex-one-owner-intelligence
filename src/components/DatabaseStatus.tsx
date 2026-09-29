import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  Info,
  ExternalLink,
} from 'lucide-react';
import { DatabaseConnectionStatus } from '../types';

interface DatabaseStatusProps {
  pollIntervalMs?: number;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({
  pollIntervalMs = 15000,
}) => {
  const [status, setStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data: DatabaseConnectionStatus = await res.json();
        setStatus(data);
      } else {
        // Fallback error state
        setStatus({
          connected: false,
          status: 'disconnected',
          strictMode: false,
          indicator: 'red',
          driver: 'none',
          latencyMs: 0,
          pool: { totalCount: 0, idleCount: 0, waitingCount: 0 },
          error: `HTTP ${res.status}: ${res.statusText}`,
          databaseUrlConfigured: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setStatus({
        connected: false,
        status: 'disconnected',
        strictMode: false,
        indicator: 'red',
        driver: 'none',
        latencyMs: 0,
        pool: { totalCount: 0, idleCount: 0, waitingCount: 0 },
        error: err?.message || 'Network error polling database endpoint.',
        databaseUrlConfigured: false,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine indicator visuals respecting strict mode
  const isPostgresConnected = status?.connected === true;
  const isStrict = status?.strictMode === true;

  // Visual state calculation
  let dotColor = 'bg-slate-400';
  let badgeBorder = 'border-slate-300';
  let badgeBg = 'bg-slate-50 hover:bg-slate-100 text-slate-700';
  let statusText = 'Checking DB...';

  if (!isLoading && status) {
    if (isPostgresConnected) {
      dotColor = 'bg-emerald-500 shadow-emerald-500/50';
      badgeBorder = 'border-emerald-200';
      badgeBg = 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900';
      statusText = 'PostgreSQL Live';
    } else if (isStrict) {
      // Strict mode violation: PostgreSQL must be connected
      dotColor = 'bg-rose-600 animate-ping';
      badgeBorder = 'border-rose-300';
      badgeBg = 'bg-rose-50 hover:bg-rose-100 text-rose-900';
      statusText = 'Strict: PG Offline';
    } else if (status.status === 'fallback') {
      dotColor = 'bg-amber-500';
      badgeBorder = 'border-amber-300';
      badgeBg = 'bg-amber-50 hover:bg-amber-100 text-amber-900';
      statusText = 'Embedded DB';
    } else {
      dotColor = 'bg-rose-600';
      badgeBorder = 'border-rose-300';
      badgeBg = 'bg-rose-50 hover:bg-rose-100 text-rose-900';
      statusText = 'DB Disconnected';
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Header Pill Button */}
      <button
        type="button"
        id="btn-database-status-indicator"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-2xs select-none ${badgeBg} ${badgeBorder}`}
        title="View PostgreSQL / PostGIS connection diagnostics"
      >
        <span className="relative flex h-2.5 w-2.5">
          {isPostgresConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          {isStrict && !isPostgresConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`}></span>
        </span>

        <span className="font-mono">{statusText}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Diagnostics Dropdown Popover */}
      {isOpen && (
        <div
          id="popover-database-diagnostics"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800"
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-2xl ${isPostgresConnected ? 'bg-emerald-100 text-emerald-700' : isStrict ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Database Connectivity</span>
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'Polling...'}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchStatus(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
              title="Test Connection Now"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Core Status Summary */}
          <div className="mt-3.5 space-y-3">
            <div className={`p-3 rounded-2xl border text-xs ${isPostgresConnected ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : isStrict ? 'bg-rose-50/70 border-rose-200 text-rose-950' : 'bg-amber-50/70 border-amber-200 text-amber-950'}`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {isPostgresConnected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isStrict ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {isPostgresConnected
                      ? 'PostgreSQL 16 Connection Active'
                      : isStrict
                      ? 'Strict Mode: Connection Failed'
                      : 'Operating with Embedded Engine'}
                  </span>
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-current shadow-2xs">
                  {status?.latencyMs ?? 0}ms
                </span>
              </div>
              <p className="text-[11px] mt-1 opacity-80 leading-relaxed font-sans">
                {isPostgresConnected
                  ? 'Authoritative PostgreSQL pool is connected and processing live queries.'
                  : isStrict
                  ? 'DATABASE_STRICT_MODE is ENABLED. Embedded fallbacks are forbidden in production.'
                  : 'PostgreSQL instance is offline. Permissive mode is routing queries to the embedded Orange County dataset.'}
              </p>
            </div>

            {/* Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">Strict Mode</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {isStrict ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={`font-bold ${isStrict ? 'text-rose-700' : 'text-slate-700'}`}>
                    {isStrict ? 'STRICT (true)' : 'PERMISSIVE (false)'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">PostGIS Extension</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-700">
                    {status?.postgisInstalled ? 'PostGIS Active' : 'Not Loaded'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">Driver Layer</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold text-slate-700 truncate">
                    {status?.driver === 'postgres' ? 'pg-pool' : 'embedded_engine'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">Pool Connections</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-slate-700">
                    {status?.pool ? `${status.pool.idleCount} idle / ${status.pool.totalCount} total` : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error / Diagnostic Trace if any */}
            {status?.error && (
              <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 text-rose-900 text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-rose-700 block">Connection Diagnostic</span>
                <p className="font-mono text-[11px] break-all leading-tight text-rose-800">
                  {status.error}
                </p>
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Auto-polls every {pollIntervalMs / 1000}s</span>
              </span>

              <button
                type="button"
                onClick={() => fetchStatus(true)}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
