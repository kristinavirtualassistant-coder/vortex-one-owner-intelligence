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
} from 'lucide-react';
import { PortfolioRecord } from '../types';

interface PortfolioDashboardProps {
  onSelectOwnerProperty: (query: string) => void;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  onSelectOwnerProperty,
}) => {
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CORPORATE' | 'ABSENTEE'>('ALL');

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
    if (filterType === 'CORPORATE') return p.ownerType === 'CORPORATE_ENTITY';
    if (filterType === 'ABSENTEE') return p.isAbsenteePortfolio;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Owner Portfolio Aggregation & Lead Score Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated multi-property holdings across Orange County with 0–100 property-management prospecting rankings.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Owners
          </button>

          <button
            onClick={() => setFilterType('CORPORATE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'CORPORATE'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Corporate LLCs
          </button>

          <button
            onClick={() => setFilterType('ABSENTEE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'ABSENTEE'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absentee Portfolios
          </button>
        </div>
      </div>

      {/* Portfolio Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading aggregated portfolio records...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm space-y-4 transition-all group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        portfolio.ownerType === 'CORPORATE_ENTITY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {portfolio.ownerType}
                    </span>

                    {portfolio.isAbsenteePortfolio && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                        100% ABSENTEE
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-all">
                    {portfolio.ownerName}
                  </h3>
                </div>

                {/* Score Circle */}
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-xs shrink-0">
                  <span>{portfolio.leadScore}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">SCORE</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Assessed Value</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    ${(portfolio.totalAssessedValue / 1000000).toFixed(1)}M
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Total Units</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">
                    {portfolio.totalUnits} Units
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Cities</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">
                    {portfolio.distinctCities} Cities
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectOwnerProperty(portfolio.ownerName)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Inspect Properties in Portfolio</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
