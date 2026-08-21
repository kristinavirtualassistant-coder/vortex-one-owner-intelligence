import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  Download,
  AlertCircle,
  Play,
  Database,
  Sparkles,
} from 'lucide-react';

interface BatchEnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchEnrichmentModal: React.FC<BatchEnrichmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [enrichedCsvResult, setEnrichedCsvResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadSampleDataset = () => {
    const sample = `Name,Address,City,State,Zip Code,Property Type,Num Units,Cost
Leon Green,2076 Magnolia Ave,Long Beach,CA,90806,Multi-Family,12,3600000
Irvine Company LLC,400 Spectrum Center Dr,Irvine,CA,92618,Commercial,120,130000000
John Doe,100 Main St,Seal Beach,CA,90740,Single-Family,1,1300000
Anaheim Resort Ventures,1200 S Harbor Blvd,Anaheim,CA,92805,Resort Commercial,45,1900000
Costa Mesa Retail Group,456 Harbor Blvd,Costa Mesa,CA,92626,Retail,8,6000000
Pacific Coast Holdings,191 Kennebec Ave #201,Long Beach,CA,90803,Multi-Family,6,2200000`;
    setCsvContent(sample);
    setError(null);
    setEnrichedCsvResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setError(null);
      setEnrichedCsvResult(null);
    };
    reader.readAsText(file);
  };

  const handleProcessBatch = async () => {
    if (!csvContent.trim()) {
      setError('Please upload or paste CSV content first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setEnrichedCsvResult(null);

    const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
    setProgress({ current: 0, total: Math.max(lines.length - 1, 1) });

    try {
      const res = await fetch('/api/batch-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvContent }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Batch processing failed.');
      }

      const csvResult = await res.text();
      setEnrichedCsvResult(csvResult);
      setProgress({ current: lines.length - 1, total: lines.length - 1 });
    } catch (err: any) {
      setError(err.message || 'Batch enrichment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!enrichedCsvResult) return;

    const blob = new Blob([enrichedCsvResult], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'enriched_leads_vortex_one.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-blue-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-blue-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Batch CSV Skip-Trace & Lead Enrichment
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                High-concurrency batch geocoding, APN resolution, corporate piercing & lead scoring
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Sample Dataset Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
          <button
            onClick={handleLoadSampleDataset}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 text-sm font-semibold flex items-center space-x-2 transition-all shadow-xs"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Load Pre-Loaded CRM Dataset Sample</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 text-sm font-semibold flex items-center space-x-2 transition-all cursor-pointer shadow-xs">
            <UploadCloud className="w-4 h-4 text-teal-600" />
            <span>Upload Custom CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* CSV Textarea or Preview */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-800 block flex items-center justify-between">
            <span>CSV Input Data (Name, Address, City, State, Zip, etc.)</span>
            <span className="text-xs text-slate-500 font-mono">
              {csvContent.split('\n').filter((l) => l.trim()).length} lines detected
            </span>
          </label>
          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="Paste CSV text or load sample dataset above..."
            rows={6}
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-slate-900 font-mono text-xs outline-none shadow-inner"
          />
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Process Button & Progress */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {isProcessing ? (
            <div className="flex items-center space-x-3 font-mono text-sm text-slate-700">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Enriching and geocoding batch records...</span>
            </div>
          ) : (
            <button
              onClick={handleProcessBatch}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Batch Skip-Trace & Scoring</span>
            </button>
          )}

          {enrichedCsvResult && (
            <button
              onClick={handleDownloadResult}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Enriched CSV Results</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
