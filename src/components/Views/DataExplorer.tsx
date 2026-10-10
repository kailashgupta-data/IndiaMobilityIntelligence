import React, { useState, useMemo } from 'react';
import { MobilityRecord } from '../../types';
import { Search, Download, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet, Copy, Check } from 'lucide-react';

interface DataExplorerProps {
  records: MobilityRecord[];
  onExportCSV: () => void;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ records, onExportCSV }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof MobilityRecord>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [copied, setCopied] = useState<boolean>(false);

  // Search filter
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        r.date.includes(term) ||
        r.origin.toLowerCase().includes(term) ||
        r.destination.toLowerCase().includes(term) ||
        r.routeId.toLowerCase().includes(term) ||
        r.mode.toLowerCase().includes(term) ||
        r.subCategory.toLowerCase().includes(term) ||
        (r.holidayName && r.holidayName.toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof MobilityRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopyJSON = () => {
    const jsonStr = JSON.stringify(paginated, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Granular Data Explorer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full record-level inspection, sortable columns, multi-field search, and tabular export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Page JSON' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Table Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search city, route, mode, festival..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>
            Showing <strong className="text-white">{sorted.length.toLocaleString()}</strong> records
          </span>
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px] select-none">
                <th onClick={() => handleSort('date')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('origin')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Origin → Dest</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('mode')} className="p-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Mode</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="p-3">Operator / SubCategory</th>
                <th onClick={() => handleSort('passengers')} className="p-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Passengers</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('trips')} className="p-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Trips</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('avgFareOrExp')} className="p-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Fare/Exp</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('ticketRevenue')} className="p-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Ticket Rev</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('carExpenditure')} className="p-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Car Exp</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('occupancyRate')} className="p-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Occupancy</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="p-3 text-center">Festival</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50">
                  <td className="p-3 text-white font-semibold">{r.date}</td>
                  <td className="p-3 font-sans text-slate-200">
                    {r.origin} → {r.destination}
                  </td>
                  <td className="p-3 font-sans">
                    <span className="font-semibold text-slate-300">{r.mode}</span>
                  </td>
                  <td className="p-3 text-slate-400 font-sans truncate max-w-[150px]">
                    {r.subCategory}
                  </td>
                  <td className="p-3 text-right font-bold text-white">
                    {r.passengers.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-slate-400">
                    {r.trips.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-slate-200">
                    ₹{r.avgFareOrExp.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-emerald-400 font-semibold">
                    {r.ticketRevenue > 0 ? `₹${(r.ticketRevenue / 100000).toFixed(2)} L` : '—'}
                  </td>
                  <td className="p-3 text-right text-amber-400 font-semibold">
                    {r.carExpenditure > 0 ? `₹${(r.carExpenditure / 100000).toFixed(2)} L` : '—'}
                  </td>
                  <td className="p-3 text-right text-cyan-300">
                    {(r.occupancyRate * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-sans">
                    {r.isHoliday ? (
                      <span className="text-amber-400 text-[10px]">★ {r.holidayName}</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
