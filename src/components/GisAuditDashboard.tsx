import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, Database, CheckCircle2, Clock, Globe } from 'lucide-react';

interface GisAuditRecord {
  county: string;
  state: string;
  fipsCode: string;
  sourceConfigured: boolean;
  status: string;
  schemaStatus: string;
  recordCount: number;
  lastVerifiedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  endpointUrl: string | null;
  sources: {
    category: string;
    sourceName: string;
    agencyName: string;
    status: string;
    schemaStatus: string;
    recordCount: number;
    lastVerifiedAt: string | null;
  }[];
}

export const GisAuditDashboard: React.FC = () => {
  const [auditData, setAuditData] = useState<GisAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gis-audit');
      if (!res.ok) throw new Error('Failed to fetch GIS audit records.');
      const data = await res.json();
      setAuditData(data);
    } catch (err: any) {
      setError(err.message || 'Error loading GIS audit data.');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">California 58-County GIS & Source Audit</h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Real-time verification status of county assessor portals, GIS endpoints, and public record ingestion registries.
          </p>
        </div>

        <button
          onClick={fetchAudit}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{verifiedCount} / 58</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Verified Counties</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{configuredCount} Counties</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Source Registry Active</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalRecords.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Indexed Parcel Records</div>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-3xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">California County Source Registry</h3>
          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            Database Source of Truth
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-600 font-medium">Auditing GIS endpoints across California jurisdictions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-blue-100 text-xs font-bold text-slate-600 uppercase bg-slate-50/70">
                  <th className="px-6 py-3.5">County</th>
                  <th className="px-6 py-3.5">State</th>
                  <th className="px-6 py-3.5">Source Name</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Schema</th>
                  <th className="px-6 py-3.5 text-right">Records</th>
                  <th className="px-6 py-3.5">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 text-sm">
                {auditData.map((item) => {
                  const primarySource = item.sources[0];
                  return (
                    <tr key={item.fipsCode} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-2">
                        <span>{item.county}</span>
                        <span className="text-xs font-mono text-slate-600 font-normal">({item.fipsCode})</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{item.state}</td>
                      <td className="px-6 py-4">
                        {primarySource ? (
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{primarySource.sourceName}</div>
                            <div className="text-xs text-slate-600">{primarySource.agencyName}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No endpoint registered</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.status === 'PROBABLE'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          {item.schemaStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        {item.recordCount > 0 ? item.recordCount.toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {item.lastVerifiedAt ? new Date(item.lastVerifiedAt).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
