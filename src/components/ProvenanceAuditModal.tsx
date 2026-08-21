import React from 'react';
import { X, ShieldCheck, Hash, ExternalLink, FileText, Lock } from 'lucide-react';
import { ProvenanceLog } from '../types';

interface ProvenanceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  provenanceLogs: ProvenanceLog[];
  propertyAddress: string;
}

export const ProvenanceAuditModal: React.FC<ProvenanceAuditModalProps> = ({
  isOpen,
  onClose,
  provenanceLogs,
  propertyAddress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-blue-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-blue-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Cryptographic Provenance Audit Trace
              </h2>
              <p className="text-sm text-slate-600 font-mono mt-0.5">{propertyAddress}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Explanation */}
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-sm text-slate-700 leading-relaxed space-y-2 font-mono">
          <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-wider text-xs">
            <Lock className="w-4 h-4" />
            <span>Zero-Fabrication Immutable Evidence Ledger</span>
          </div>
          <p className="font-sans">
            Every property record, APN, owner name, valuation, phone number, and email in Vortex One is cryptographic SHA-256 hashed and traced back to its authoritative public record source. Facts are strictly segregated from inferences.
          </p>
        </div>

        {/* Logs Table */}
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {provenanceLogs.map((log) => (
            <div
              key={log.id}
              className="p-5 bg-white rounded-2xl border border-blue-200 shadow-xs space-y-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      log.classification === 'FACT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : log.classification === 'INFERENCE'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : log.classification === 'UNVERIFIED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {log.classification}
                  </span>

                  <span className="font-mono text-slate-900 font-bold">
                    {log.entityType}.{log.fieldName}
                  </span>
                </div>

                <span className="text-xs text-slate-500 font-mono font-semibold">
                  Confidence: {(log.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Source ID: </span>
                  <span className="text-slate-800 font-semibold">{log.sourceId}</span>
                </div>

                <div>
                  <span className="text-slate-500">Recorded Value: </span>
                  <span className="text-emerald-700 font-bold">{log.valueRecorded}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                <div className="flex items-center space-x-1.5 truncate max-w-[400px]">
                  <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">Hash: {log.provenanceHash}</span>
                </div>
                <span>{new Date(log.recordedAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-blue-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-all"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
