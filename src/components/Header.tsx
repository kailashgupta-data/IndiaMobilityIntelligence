import React from 'react';
import { Compass, Download, Printer, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentSeed: number;
  totalRecordsCount: number;
  onRegenerateData: () => void;
  onExportCSV: () => void;
  onOpenPrintReport: () => void;
  onOpenAIInsights: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSeed,
  totalRecordsCount,
  onRegenerateData,
  onExportCSV,
  onOpenPrintReport,
  onOpenAIInsights,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/10">
          <Compass className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              India Mobility Intelligence
            </h1>
            <span className="text-[10px] font-mono font-medium bg-slate-900 text-cyan-400 border border-slate-700/80 px-1.5 py-0.5 rounded">
              v2.4 Desktop
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Analytics Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Intercity Multi-Modal Passenger Movement, Holiday Surges & Revenue Intelligence
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Synthetic Seed Badge & Trigger */}
        <button
          onClick={onRegenerateData}
          title="Regenerate synthetic dataset with a new reproducible seed"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Seed:</span>
          <span className="text-cyan-400 font-bold">#{currentSeed}</span>
        </button>

        {/* AI Quick Launch */}
        <button
          onClick={onOpenAIInsights}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/80 rounded-lg hover:bg-amber-950/70 hover:border-amber-700 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Insights</span>
        </button>

        {/* Export CSV */}
        <button
          onClick={onExportCSV}
          title="Export currently filtered dataset to CSV"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        {/* Printable Executive Report */}
        <button
          onClick={onOpenPrintReport}
          title="Generate clean printable executive PDF brief"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Report PDF</span>
        </button>
      </div>
    </header>
  );
};
