import React from 'react';
import { KPISummary, FilterState } from '../types';
import { Printer, X, Compass, FileText, CheckCircle2 } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: KPISummary;
  filters: FilterState;
  dateGenerated: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  kpis,
  filters,
  dateGenerated,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-sm">Executive Brief & Printable Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 bg-white text-slate-900 flex flex-col gap-6 text-xs" id="printable-report">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-slate-900 stroke-[2.5]" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  INDIA MOBILITY INTELLIGENCE
                </h1>
              </div>
              <p className="text-slate-600 text-xs mt-0.5">
                Executive Intercity Passenger Movement & Revenue Performance Brief
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-500">
              <div>Date Generated: {dateGenerated}</div>
              <div>Report Reference: IMI-EXECUTIVE-{filters.dateStart.slice(0, 4)}</div>
            </div>
          </div>

          {/* Scope & Filter Criteria */}
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">Analysis Date Window:</span>
              <strong className="text-slate-900">{filters.dateStart} → {filters.dateEnd}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Geographic Scope:</span>
              <strong className="text-slate-900">
                {filters.origin === 'all' ? 'National Metros' : filters.origin} →{' '}
                {filters.destination === 'all' ? 'All Destinations' : filters.destination}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Transport Modes:</span>
              <strong className="text-slate-900">{filters.mode === 'all' ? 'All 4 Modes (Bus/Car/Train/Air)' : filters.mode}</strong>
            </div>
          </div>

          {/* Executive Summary Metrics Grid */}
          <div>
            <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
              National Key Performance Indicators
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 border border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Total Passengers</span>
                <span className="text-lg font-black font-mono text-slate-900">{kpis.totalPassengers.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                  {kpis.passengerGrowthPct > 0 ? '+' : ''}{kpis.passengerGrowthPct}% vs prior period
                </span>
              </div>
              <div className="p-3 border border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Operator Ticket Revenue</span>
                <span className="text-lg font-black font-mono text-emerald-700">
                  ₹{(kpis.totalTicketRevenue / 10000000).toFixed(2)} Cr
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Excludes private car costs</span>
              </div>
              <div className="p-3 border border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Private Road Outlay</span>
                <span className="text-lg font-black font-mono text-amber-700">
                  ₹{(kpis.totalCarExpenditure / 10000000).toFixed(2)} Cr
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Consumer fuel & FASTag</span>
              </div>
              <div className="p-3 border border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Average Load Factor</span>
                <span className="text-lg font-black font-mono text-slate-900">{kpis.avgOccupancyRate}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ₹{kpis.avgRevenuePerPax.toLocaleString()} / commercial pax
                </span>
              </div>
            </div>
          </div>

          {/* Executive Findings */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col gap-2">
            <h3 className="font-bold text-slate-900 text-xs">Executive Analytical Findings:</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
              <li>
                <strong>Corridor Volume Leader:</strong> {kpis.topVolumeRoute.route} recorded the highest intercity
                passenger movement ({kpis.topVolumeRoute.volume.toLocaleString()} passengers).
              </li>
              <li>
                <strong>Commercial Revenue Driver:</strong> {kpis.topRevenueMode.mode} contributed the highest
                operator ticket revenue, driven by superior passenger yield per seat.
              </li>
              <li>
                <strong>Festival Surge Pattern:</strong> Demand spikes during national festival windows (Diwali, Pongal)
                exceeded seasonal baselines by up to +95%, requiring targeted rake and fleet augmentations.
              </li>
              <li>
                <strong>Accounting Standards:</strong> Strict boundary maintained between operator commercial revenues
                and private automobile highway consumption outlays.
              </li>
            </ul>
          </div>

          {/* Footer Sign-off */}
          <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>India Mobility Intelligence Platform · Official Analytics Brief</span>
            <span>Confidential & Proprietary Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
