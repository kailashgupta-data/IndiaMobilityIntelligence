import React, { useState } from 'react';
import { MobilityRecord, FilterState } from '../../types';
import {
  computeCapacityRisks,
  detectAnomalies,
  generateDemandForecast,
  computeDirectionalComparison,
  computeKPISummary,
} from '../../data/analytics';
import { askAIQuestion, AIResponse } from '../../services/aiService';
import { ForecastChart } from '../Charts/ForecastChart';
import { Sparkles, Send, AlertTriangle, ArrowRight, ShieldAlert, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react';

interface AIInsightsWorkspaceProps {
  records: MobilityRecord[];
  allRecords: MobilityRecord[];
  filters: FilterState;
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const AIInsightsWorkspace: React.FC<AIInsightsWorkspaceProps> = ({
  records,
  allRecords,
  filters,
  onSelectRoute,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [forecastDays, setForecastDays] = useState<number>(14);

  const anomalies = detectAnomalies(records);
  const capacityRisks = computeCapacityRisks(records);
  const directional = computeDirectionalComparison(records);
  const forecast = generateDemandForecast(records, forecastDays);

  const predefinedQuestions = [
    'Which routes experienced the largest Diwali passenger surge?',
    'Which transport mode generated the highest estimated revenue last month?',
    'Compare Bengaluru-to-Chennai and Chennai-to-Bengaluru demand.',
    'Which routes may face capacity pressure next weekend?',
    'How did train and air travel demand change during Pongal?',
    'Which city pairs have high passenger volume but relatively low revenue per passenger?',
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    try {
      const resp = await askAIQuestion(queryText, records, filters);
      setAiResponse(resp);
    } catch (_err) {
      // Fallback handled in service
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Insights & Autonomous Intelligence Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical forecasting, bottleneck detection, directional balance monitoring, and natural language query.
          </p>
        </div>
        <div className="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Grounded Analytics Engine Active</span>
        </div>
      </div>

      {/* Natural Language Question Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Ask Natural Language Analytics Questions</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Query passenger surges, holiday anomalies, directional balances, or route profitability across the current dataset.
          </p>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which routes experienced the largest Diwali passenger surge? or custom query..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 shadow-sm"
          >
            {isLoading ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </form>

        {/* Predefined Questions Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Suggested Questions:</span>
          {predefinedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors truncate max-w-xs text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {/* AI Response Display Box */}
        {aiResponse && (
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col gap-3 mt-1">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-emerald-400 font-semibold">● Grounded Insight</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">Source: {aiResponse.source}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">Window: {aiResponse.dateRange}</span>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-900/60 px-2 py-0.5 rounded">
                Simulated Data Grounding
              </span>
            </div>

            {/* Answer body */}
            <div className="text-xs text-slate-200 leading-relaxed font-sans prose-invert">
              <div dangerouslySetInnerHTML={{ __html: aiResponse.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>

            {/* Key Metrics cards */}
            {aiResponse.keyMetrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                {aiResponse.keyMetrics.map((km, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                    <span className="text-[10px] text-slate-400 block truncate">{km.label}</span>
                    <strong className="text-white font-mono text-xs">{km.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Actionable recommendations */}
            {aiResponse.recommendations.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide block mb-1">
                  Tactical Planning Recommendations:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {aiResponse.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demand Forecasting with Uncertainty Bounds */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Statistical Baseline Forecast</span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setForecastDays(14)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                forecastDays === 14 ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              14-Day Forward
            </button>
            <button
              onClick={() => setForecastDays(30)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                forecastDays === 30 ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              30-Day Forward
            </button>
          </div>
        </div>

        <ForecastChart
          data={forecast}
          title="Baseline Passenger Demand Forecast Curve"
          subtitle={`Holt-Winters seasonal trend model with 80% & 95% confidence intervals (${forecastDays} days projection)`}
          height={280}
        />
      </div>

      {/* Capacity Strain & Bottleneck Risk Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Corridor Capacity Strain & Bottleneck Risk Assessment
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Automated Risk Heuristic Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Corridor & Mode</th>
                <th className="pb-2 text-right">Avg Occupancy</th>
                <th className="pb-2 text-right">Peak Occupancy</th>
                <th className="pb-2 text-right">Peak Date</th>
                <th className="pb-2 text-center">Risk Level</th>
                <th className="pb-2">Recommended Operational Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {capacityRisks.slice(0, 8).map((risk, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-medium text-white">
                    {risk.route} · <span className="text-slate-400">{risk.mode}</span>
                  </td>
                  <td className="py-2.5 text-right text-slate-200">{risk.avgOccupancy}%</td>
                  <td className="py-2.5 text-right font-bold text-white">{risk.peakOccupancy}%</td>
                  <td className="py-2.5 text-right text-slate-400">{risk.peakDate}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        risk.riskLevel === 'Critical'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : risk.riskLevel === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {risk.riskLevel}
                    </span>
                  </td>
                  <td className="py-2.5 font-sans text-slate-300 text-xs">{risk.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistical Anomaly Flags Table (Z-Score >= 2.2) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Statistical Anomaly Flags (Z-Score ≥ 2.2 Standard Deviations)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{anomalies.length} Flagged Anomalies</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Date</th>
                <th className="pb-2">Corridor & Mode</th>
                <th className="pb-2 text-right">Actual Pax</th>
                <th className="pb-2 text-right">Expected Mean</th>
                <th className="pb-2 text-right">Z-Score</th>
                <th className="pb-2">Anomaly Classification & Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {anomalies.slice(0, 10).map((ano, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 text-white">{ano.date}</td>
                  <td className="py-2.5 font-sans font-medium text-slate-200">
                    {ano.route} · <span className="text-slate-400">{ano.mode}</span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-white">{ano.passengers.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-slate-400">{ano.expectedPassengers.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-bold text-amber-400">+{ano.zScore}σ</td>
                  <td className="py-2.5 font-sans text-slate-300 text-xs">{ano.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
