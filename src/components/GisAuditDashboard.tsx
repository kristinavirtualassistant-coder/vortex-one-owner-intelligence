import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Database,
  Globe,
  Clock,
  Search,
} from 'lucide-react';
import { GisAuditRecord } from '../types';

export const GisAuditDashboard: React.FC = () => {
  const [auditData, setAuditData] = useState<GisAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gis-audit');
      if (!res.ok) {
        throw new Error('Failed to fetch GIS audit results');
      }
      const data = await res.json();
      setAuditData(data.counties || []);
    } catch (err: any) {
      setError(err.message || 'Audit service unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const verifiedCount = auditData.filter((a) => a.status === 'VERIFIED').length;
  const configuredCount = auditData.filter((a) => a.sourceConfigured).length;
  const totalRecords = auditData.reduce((acc, curr) => acc + curr.recordCount, 0);

  const filteredData = auditData.filter(
    (c) =>
      c.countyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fips.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">California 58-County GIS & Source Audit</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time verification status of county assessor portals, GIS endpoints, and public record ingestion registries.
          </p>
        </div>

        <button
          onClick={fetchAudit}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{verifiedCount} / 58</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Verified Counties
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{configuredCount} Counties</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Source Registry Active
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalRecords.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Indexed Parcel Records
            </div>
          </div>
        </div>
      </div>

      {/* Audit Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            California County Source Registry
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by county name or FIPS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600 font-medium">Auditing GIS endpoints across California jurisdictions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 flex items-center justify-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 font-bold text-slate-500 uppercase bg-slate-50/70">
                  <th className="px-5 py-3">County / FIPS</th>
                  <th className="px-5 py-3">Source Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Schema</th>
                  <th className="px-5 py-3 text-right">Indexed Records</th>
                  <th className="px-5 py-3">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => (
                  <tr key={row.fips} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <span>{row.countyName}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">FIPS {row.fips}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {row.sourceName || (
                        <span className="text-slate-400 italic">Unconfigured</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          row.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          row.schemaStatus === 'VALID'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {row.schemaStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                      {row.recordCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {row.lastVerified ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(row.lastVerified).toLocaleTimeString()}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
