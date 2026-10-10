import React, { useState } from 'react';
import { runMobilityUnitTests, TestResult } from '../../data/tests';
import { RefreshCw, Play, CheckCircle2, XCircle, Sliders, BookOpen, Code2, ShieldAlert } from 'lucide-react';

interface SettingsAndDocsProps {
  currentSeed: number;
  totalRecordsCount: number;
  onUpdateSeed: (newSeed: number) => void;
}

export const SettingsAndDocs: React.FC<SettingsAndDocsProps> = ({
  currentSeed,
  totalRecordsCount,
  onUpdateSeed,
}) => {
  const [inputSeed, setInputSeed] = useState<number>(currentSeed);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [hasRunTests, setHasRunTests] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'methodology' | 'tests' | 'python_desktop'>('methodology');

  const handleRunTests = () => {
    const results = runMobilityUnitTests();
    setTestResults(results);
    setHasRunTests(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Settings, Methodology & Technical Verification
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthetic dataset seed configuration, mathematical assumptions, Python Streamlit package, and live unit tests.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'methodology' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Methodology & Assumptions
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'tests' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Live Unit Test Runner
          </button>
          <button
            onClick={() => setActiveTab('python_desktop')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'python_desktop' ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Python Desktop Architecture
          </button>
        </div>
      </div>

      {/* Dataset Generation Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Reproducible Synthetic Data Generator</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Currently generating 365 daily records across 8 major Indian metro corridors with Mulberry32 PRNG.
          </p>
          <div className="flex items-center gap-3 font-mono text-xs text-slate-400 mt-2">
            <span>
              Current Active Seed: <strong className="text-cyan-400">#{currentSeed}</strong>
            </span>
            <span>·</span>
            <span>
              Total Dataset Size: <strong className="text-white">{totalRecordsCount.toLocaleString()}</strong> records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={inputSeed}
            onChange={(e) => setInputSeed(Number(e.target.value))}
            className="w-24 bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-mono"
          />
          <button
            onClick={() => onUpdateSeed(inputSeed)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Dataset</span>
          </button>
        </div>
      </div>

      {/* TAB 1: METHODOLOGY & ASSUMPTIONS */}
      {activeTab === 'methodology' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Core Metric Definitions & Revenue Principles</span>
            </div>
            <p className="text-slate-300">
              <strong className="text-white">Simulated Mock Data Notice:</strong> All passenger counts, financial
              figures, and forecasts displayed in this dashboard are high-fidelity synthetic estimates generated for
              executive benchmarking, planning and algorithmic validation.
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Passenger vs Trip:</strong> A passenger represents an individual
              one-way journey. A trip represents a single vehicular transit service (e.g. 1 scheduled bus departure, 1
              train rake service, 1 commercial aircraft flight, or 1 automobile road journey).
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Strict Revenue Isolation:</strong> Commercial ticket revenue (Buses,
              Trains, Airplanes) is accounted strictly as transit provider revenue. Private car road expenditure (fuel
              and electronic FASTag tolls) is modeled as consumer road outlay and isolated in a separate ledger.
            </p>
          </div>

          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Modal Capacity & Occupancy Assumptions</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>
                <strong className="text-white">Intercity Bus:</strong> 42 to 48 seats per coach (Multi-axle Volvo/Scania
                sleeper or semi-sleeper). Average load factor: 68% to 94%.
              </li>
              <li>
                <strong className="text-white">Private Passenger Car:</strong> 2.85 to 3.20 persons per vehicle
                (surging to 3.5+ during festivals and holiday weekends). Road cost modeled at ~₹9.00/km (Fuel ~₹7/km + FASTag ~₹2/km).
              </li>
              <li>
                <strong className="text-white">Indian Railways Rake:</strong> 1,100 berths/seats per standard 16-20 coach rake.
                Average utilization: 86% to 98% (surging above 100% capacity via waitlists during Diwali & Pongal).
              </li>
              <li>
                <strong className="text-white">Domestic Airplane:</strong> 186 seats (A320neo / B737 narrowbody). Average
                Passenger Load Factor (PLF): 78% to 93%. Dynamic fare multiplier surges up to 1.75x during festival windows.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE UNIT TEST RUNNER */}
      {activeTab === 'tests' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Live In-Browser Analytics Unit Test Suite</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Executes formal assertions against the synthetic generator, revenue isolation logic, and statistical forecasting models.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Test Suite</span>
            </button>
          </div>

          {hasRunTests ? (
            <div className="flex flex-col gap-2 mt-2">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                    t.passed ? 'bg-slate-950/80 border-slate-800' : 'bg-rose-950/30 border-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{t.category}]</span>
                      </div>
                      <p className="text-slate-300 mt-0.5 text-[11px]">{t.message}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{t.durationMs}ms</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-lg text-xs">
              Click &quot;Run Test Suite&quot; above to execute the 6 core mathematical test suites live in your browser.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PYTHON DESKTOP ARCHITECTURE */}
      {activeTab === 'python_desktop' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Python Desktop & Streamlit Standalone Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In addition to this rich desktop browser-based application, a complete standalone Python Streamlit
            implementation is included in the project directory under <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono">/python_desktop/</code>.
            It provides identical analytics, Plotly charts, data generators, and unit tests for local offline Python execution.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300">
            <div className="text-slate-500 mb-1"># How to run locally via Python:</div>
            <div>cd python_desktop</div>
            <div>pip install -r requirements.txt</div>
            <div>streamlit run app.py</div>
          </div>
        </div>
      )}
    </div>
  );
};
