import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Building2,
  Briefcase,
  Layers,
  MapPin,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Building,
  Search,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { PortfolioRecord } from '../types';

interface PortfolioDashboardProps {
  onSelectOwnerProperty: (query: string) => void;
  initialOwnerFilter?: string;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  onSelectOwnerProperty,
  initialOwnerFilter = '',
}) => {
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CORPORATE' | 'ABSENTEE'>('ALL');
  const [searchOwnerQuery, setSearchOwnerQuery] = useState(initialOwnerFilter);

  useEffect(() => {
    if (initialOwnerFilter) {
      setSearchOwnerQuery(initialOwnerFilter);
    }
  }, [initialOwnerFilter]);

  useEffect(() => {
    async function fetchPortfolios() {
      try {
        const res = await fetch('/api/portfolios');
        if (res.ok) {
          const data = await res.json();
          setPortfolios(data.portfolios || []);
        }
      } catch (err) {
        console.error('Failed to fetch portfolios:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolios();
  }, []);

  const filteredPortfolios = portfolios.filter((p) => {
    if (filterType === 'CORPORATE' && p.ownerType !== 'CORPORATE_ENTITY') return false;
    if (filterType === 'ABSENTEE' && !p.isAbsenteePortfolio) return false;
    if (
      searchOwnerQuery.trim() &&
      !p.ownerName.toLowerCase().includes(searchOwnerQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalAssessedSum = portfolios.reduce((acc, p) => acc + (p.totalAssessedValue || 0), 0);
  const totalUnitsSum = portfolios.reduce((acc, p) => acc + (p.totalUnits || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Owner Intelligence & Portfolio Aggregation</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated multi-asset holdings, corporate entity resolutions, and 0–100 prospecting scores.
          </p>
        </div>

        {/* Search Bar for Owner Entities */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by owner or LLC..."
            value={searchOwnerQuery}
            onChange={(e) => setSearchOwnerQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Aggregated Portfolios
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">{portfolios.length} Entities</div>
          </div>
          <Users className="w-5 h-5 text-blue-600" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Ingested Units
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalUnitsSum.toLocaleString()} Units</div>
          </div>
          <Building2 className="w-5 h-5 text-indigo-600" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Aggregated Valuation
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ${(totalAssessedSum / 1000000).toFixed(1)}M
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit text-xs">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filterType === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Portfolios ({portfolios.length})
        </button>

        <button
          onClick={() => setFilterType('CORPORATE')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filterType === 'CORPORATE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Corporate Entities / LLCs
        </button>

        <button
          onClick={() => setFilterType('ABSENTEE')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filterType === 'ABSENTEE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Absentee Portfolios
        </button>
      </div>

      {/* Portfolio Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading aggregated portfolio records...
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <p className="text-sm font-semibold text-slate-800">No owner portfolios match your filter.</p>
          <p className="text-xs text-slate-500">Try resetting your search query or switching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs space-y-4 transition-all group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        portfolio.ownerType === 'CORPORATE_ENTITY'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {portfolio.ownerType}
                    </span>

                    {portfolio.isAbsenteePortfolio && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                        ABSENTEE PORTFOLIO
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {portfolio.ownerName}
                  </h3>
                </div>

                {/* Score Pill */}
                <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm shrink-0">
                  <span>{portfolio.leadScore}</span>
                  <span className="text-[9px] uppercase tracking-wider text-blue-600 font-medium">SCORE</span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Assessed Value</span>
                  <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                    ${(portfolio.totalAssessedValue / 1000000).toFixed(1)}M
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Units</span>
                  <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                    {portfolio.totalUnits} Units
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Holdings</span>
                  <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                    {portfolio.totalProperties} Assets
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectOwnerProperty(portfolio.ownerName)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-transparent transition-all flex items-center justify-center gap-1.5"
              >
                <span>Inspect Properties in Portfolio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
