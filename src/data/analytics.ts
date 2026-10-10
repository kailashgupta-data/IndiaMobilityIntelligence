import { AnomalyRecord, CapacityRisk, FilterState, ForecastPoint, KPISummary, MobilityRecord, TransportMode } from '../types';
import { CORRIDORS } from './constants';

export function filterRecords(records: MobilityRecord[], filters: FilterState): MobilityRecord[] {
  return records.filter((r) => {
    if (filters.dateStart && r.date < filters.dateStart) return false;
    if (filters.dateEnd && r.date > filters.dateEnd) return false;
    if (filters.origin !== 'all' && r.origin !== filters.origin) return false;
    if (filters.destination !== 'all' && r.destination !== filters.destination) return false;
    if (filters.mode !== 'all' && r.mode !== filters.mode) return false;
    if (filters.dayType === 'weekday' && r.isWeekend) return false;
    if (filters.dayType === 'weekend' && !r.isWeekend) return false;
    if (filters.dayType === 'holiday' && !r.isHoliday) return false;
    if (filters.route !== 'all') {
      const routeStr = `${r.origin} - ${r.destination}`;
      const revRouteStr = `${r.destination} - ${r.origin}`;
      if (routeStr !== filters.route && revRouteStr !== filters.route && r.routeId !== filters.route) {
        return false;
      }
    }
    if (filters.subCategory !== 'all' && r.subCategory !== filters.subCategory) return false;
    return true;
  });
}

export function computeKPISummary(filtered: MobilityRecord[], allRecords: MobilityRecord[], filters: FilterState): KPISummary {
  const totalPassengers = filtered.reduce((s, r) => s + r.passengers, 0);
  const totalTicketRevenue = filtered.reduce((s, r) => s + r.ticketRevenue, 0);
  const totalCarExpenditure = filtered.reduce((s, r) => s + r.carExpenditure, 0);
  const totalValue = totalTicketRevenue + totalCarExpenditure;
  const totalTrips = filtered.reduce((s, r) => s + r.trips, 0);
  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const avgOccupancyRate = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  const commercialPax = filtered.filter((r) => r.mode !== 'Car').reduce((s, r) => s + r.passengers, 0);
  const avgRevenuePerPax = commercialPax > 0 ? Math.round(totalTicketRevenue / commercialPax) : 0;

  // Active routes count
  const routeSet = new Set(filtered.map((r) => `${r.origin} → ${r.destination}`));
  const activeRoutesCount = routeSet.size;

  // Route volumes & Mode revenues
  const routeVolumeMap = new Map<string, number>();
  const modeRevenueMap = new Map<TransportMode, number>();

  for (const r of filtered) {
    const pair = `${r.origin} ↔ ${r.destination}`;
    routeVolumeMap.set(pair, (routeVolumeMap.get(pair) || 0) + r.passengers);
    modeRevenueMap.set(r.mode, (modeRevenueMap.get(r.mode) || 0) + r.ticketRevenue);
  }

  let topVolumeRoute = { route: 'N/A', volume: 0 };
  for (const [route, vol] of routeVolumeMap.entries()) {
    if (vol > topVolumeRoute.volume) {
      topVolumeRoute = { route, volume: vol };
    }
  }

  let topRevenueMode: { mode: TransportMode; revenue: number } = { mode: 'Airplane', revenue: 0 };
  for (const [mode, rev] of modeRevenueMap.entries()) {
    if (rev > topRevenueMode.revenue) {
      topRevenueMode = { mode, revenue: rev };
    }
  }

  // Previous Period Calculation
  // Find duration in days between filters.dateStart and filters.dateEnd
  const startMs = new Date(filters.dateStart).getTime();
  const endMs = new Date(filters.dateEnd).getTime();
  const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

  const prevEnd = new Date(startMs - 1000 * 60 * 60 * 24);
  const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 1000 * 60 * 60 * 24);
  const prevStartStr = prevStart.toISOString().split('T')[0];
  const prevEndStr = prevEnd.toISOString().split('T')[0];

  const prevFiltered = allRecords.filter((r) => {
    if (r.date < prevStartStr || r.date > prevEndStr) return false;
    if (filters.origin !== 'all' && r.origin !== filters.origin) return false;
    if (filters.destination !== 'all' && r.destination !== filters.destination) return false;
    if (filters.mode !== 'all' && r.mode !== filters.mode) return false;
    if (filters.dayType === 'weekday' && r.isWeekend) return false;
    if (filters.dayType === 'weekend' && !r.isWeekend) return false;
    if (filters.dayType === 'holiday' && !r.isHoliday) return false;
    return true;
  });

  const prevPassengers = prevFiltered.reduce((s, r) => s + r.passengers, 0);
  const prevTicketRevenue = prevFiltered.reduce((s, r) => s + r.ticketRevenue, 0);

  const passengerGrowthPct = prevPassengers > 0
    ? Number((((totalPassengers - prevPassengers) / prevPassengers) * 100).toFixed(1))
    : 0;

  const revenueGrowthPct = prevTicketRevenue > 0
    ? Number((((totalTicketRevenue - prevTicketRevenue) / prevTicketRevenue) * 100).toFixed(1))
    : 0;

  return {
    totalPassengers,
    prevPassengers,
    passengerGrowthPct,
    totalTicketRevenue,
    prevTicketRevenue,
    revenueGrowthPct,
    totalCarExpenditure,
    totalValue,
    avgRevenuePerPax,
    avgOccupancyRate: Number(avgOccupancyRate.toFixed(1)),
    totalTrips,
    activeRoutesCount,
    topVolumeRoute,
    topRevenueMode,
  };
}

export function computeDailyTimeseries(records: MobilityRecord[]) {
  const map = new Map<string, { date: string; passengers: number; ticketRevenue: number; carExpenditure: number; trips: number; isHoliday: boolean }>();
  for (const r of records) {
    const entry = map.get(r.date) || {
      date: r.date,
      passengers: 0,
      ticketRevenue: 0,
      carExpenditure: 0,
      trips: 0,
      isHoliday: r.isHoliday,
    };
    entry.passengers += r.passengers;
    entry.ticketRevenue += r.ticketRevenue;
    entry.carExpenditure += r.carExpenditure;
    entry.trips += r.trips;
    map.set(r.date, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeModeBreakdown(records: MobilityRecord[]) {
  const modes: TransportMode[] = ['Bus', 'Car', 'Train', 'Airplane'];
  const totalPax = records.reduce((s, r) => s + r.passengers, 0) || 1;
  const totalRev = records.reduce((s, r) => s + r.ticketRevenue, 0) || 1;
  const totalVal = records.reduce((s, r) => s + r.totalValue, 0) || 1;

  return modes.map((mode) => {
    const modeRecords = records.filter((r) => r.mode === mode);
    const passengers = modeRecords.reduce((s, r) => s + r.passengers, 0);
    const ticketRevenue = modeRecords.reduce((s, r) => s + r.ticketRevenue, 0);
    const carExpenditure = modeRecords.reduce((s, r) => s + r.carExpenditure, 0);
    const totalValue = ticketRevenue + carExpenditure;
    const trips = modeRecords.reduce((s, r) => s + r.trips, 0);
    const capacity = modeRecords.reduce((s, r) => s + r.capacity, 0);
    const operatingCost = modeRecords.reduce((s, r) => s + r.operatingCost, 0);
    const operatingMargin = ticketRevenue - operatingCost;

    return {
      mode,
      passengers,
      paxShare: Number(((passengers / totalPax) * 100).toFixed(1)),
      ticketRevenue,
      revShare: Number(((ticketRevenue / totalRev) * 100).toFixed(1)),
      carExpenditure,
      totalValue,
      valShare: Number(((totalValue / totalVal) * 100).toFixed(1)),
      trips,
      occupancy: capacity > 0 ? Number(((passengers / capacity) * 100).toFixed(1)) : 0,
      avgFareOrExp: passengers > 0 ? Math.round(totalValue / passengers) : 0,
      operatingCost,
      operatingMargin,
      marginPct: ticketRevenue > 0 ? Number(((operatingMargin / ticketRevenue) * 100).toFixed(1)) : 0,
    };
  });
}

export function computeODMatrix(records: MobilityRecord[]) {
  const citySet = new Set<string>();
  records.forEach((r) => {
    citySet.add(r.origin);
    citySet.add(r.destination);
  });
  const cities = Array.from(citySet).sort();

  const matrix: Record<string, Record<string, { passengers: number; revenue: number; trips: number }>> = {};
  for (const orig of cities) {
    matrix[orig] = {};
    for (const dest of cities) {
      matrix[orig][dest] = { passengers: 0, revenue: 0, trips: 0 };
    }
  }

  for (const r of records) {
    if (matrix[r.origin] && matrix[r.origin][r.destination]) {
      matrix[r.origin][r.destination].passengers += r.passengers;
      matrix[r.origin][r.destination].revenue += r.ticketRevenue;
      matrix[r.origin][r.destination].trips += r.trips;
    }
  }

  return { cities, matrix };
}

export function computeDirectionalComparison(records: MobilityRecord[]) {
  // Compare Origin -> Destination vs Destination -> Origin
  const corridorMap = new Map<string, {
    corridor: string;
    cityA: string;
    cityB: string;
    aToBPassengers: number;
    bToAPassengers: number;
    aToBRevenue: number;
    bToARevenue: number;
    imbalancePct: number;
  }>();

  for (const corr of CORRIDORS) {
    const a = corr.origin;
    const b = corr.destination;
    const key = `${a} ↔ ${b}`;

    const aToB = records.filter((r) => r.origin === a && r.destination === b);
    const bToA = records.filter((r) => r.origin === b && r.destination === a);

    const aToBPassengers = aToB.reduce((s, r) => s + r.passengers, 0);
    const bToAPassengers = bToA.reduce((s, r) => s + r.passengers, 0);
    const aToBRevenue = aToB.reduce((s, r) => s + r.ticketRevenue, 0);
    const bToARevenue = bToA.reduce((s, r) => s + r.ticketRevenue, 0);

    const maxPax = Math.max(aToBPassengers, bToAPassengers, 1);
    const imbalancePct = Number(((Math.abs(aToBPassengers - bToAPassengers) / maxPax) * 100).toFixed(1));

    corridorMap.set(key, {
      corridor: key,
      cityA: a,
      cityB: b,
      aToBPassengers,
      bToAPassengers,
      aToBRevenue,
      bToARevenue,
      imbalancePct,
    });
  }

  return Array.from(corridorMap.values());
}

// Statistical Anomaly Detection (Z-Score on daily volume per corridor)
export function detectAnomalies(records: MobilityRecord[]): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];
  // Group by routeId + mode
  const groupMap = new Map<string, { date: string; passengers: number; isHoliday: boolean; holidayName: string | null }[]>();

  for (const r of records) {
    const key = `${r.origin} → ${r.destination} | ${r.mode}`;
    const list = groupMap.get(key) || [];
    list.push({ date: r.date, passengers: r.passengers, isHoliday: r.isHoliday, holidayName: r.holidayName });
    groupMap.set(key, list);
  }

  for (const [routeMode, list] of groupMap.entries()) {
    if (list.length < 14) continue;
    const [route, mode] = routeMode.split(' | ') as [string, TransportMode];
    const mean = list.reduce((s, x) => s + x.passengers, 0) / list.length;
    const variance = list.reduce((s, x) => s + Math.pow(x.passengers - mean, 2), 0) / list.length;
    const stdDev = Math.sqrt(variance) || 1;

    for (const pt of list) {
      const zScore = (pt.passengers - mean) / stdDev;
      if (Math.abs(zScore) >= 2.2) {
        anomalies.push({
          date: pt.date,
          route,
          mode,
          passengers: pt.passengers,
          expectedPassengers: Math.round(mean),
          zScore: Number(zScore.toFixed(2)),
          type: zScore > 0 ? 'spike' : 'drop',
          reason: pt.isHoliday
            ? `Festival Surge: ${pt.holidayName || 'Holiday Demand Spike'}`
            : zScore > 0
            ? 'High-demand weekend congestion anomaly'
            : 'Unusual low traffic slump',
        });
      }
    }
  }

  // Sort by absolute z-score descending
  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)).slice(0, 30);
}

// Baseline Statistical Demand Forecast (Exponential Smoothing + Seasonality + Confidence Bounds)
export function generateDemandForecast(records: MobilityRecord[], daysAhead = 14): ForecastPoint[] {
  const daily = computeDailyTimeseries(records);
  if (daily.length === 0) return [];

  // Recent 60 days
  const recent = daily.slice(-60);
  const lastDate = new Date(recent[recent.length - 1].date);

  // Day-of-week index
  const dowAverages = [0, 0, 0, 0, 0, 0, 0];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];

  recent.forEach((pt) => {
    const d = new Date(pt.date).getDay();
    dowAverages[d] += pt.passengers;
    dowCounts[d]++;
  });

  const overallMean = recent.reduce((s, pt) => s + pt.passengers, 0) / recent.length;
  const dowSeasonalFactors = dowAverages.map((sum, i) => (dowCounts[i] > 0 ? (sum / dowCounts[i]) / overallMean : 1.0));

  // Trend slope using simple linear regression on recent 30 days
  const n = Math.min(30, recent.length);
  const subset = recent.slice(-n);
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += subset[i].passengers;
    sumXY += i * subset[i].passengers;
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const stdError = Math.sqrt(
    subset.reduce((acc, pt, i) => {
      const pred = (sumY - slope * sumX) / n + slope * i;
      return acc + Math.pow(pt.passengers - pred, 2);
    }, 0) / (n - 2 || 1)
  );

  const forecastPoints: ForecastPoint[] = [];

  // Include recent 14 days historical for context
  const histContext = recent.slice(-14);
  histContext.forEach((pt) => {
    forecastPoints.push({
      date: pt.date,
      actual: pt.passengers,
      predicted: pt.passengers,
      lower80: pt.passengers,
      upper80: pt.passengers,
      lower95: pt.passengers,
      upper95: pt.passengers,
    });
  });

  // Project forward
  const lastActual = recent[recent.length - 1].passengers;
  for (let i = 1; i <= daysAhead; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    const dateStr = nextDate.toISOString().split('T')[0];
    const dow = nextDate.getDay();
    const seasonalFactor = dowSeasonalFactors[dow] || 1.0;

    const basePredicted = (lastActual + slope * i) * 0.4 + (overallMean * seasonalFactor) * 0.6;
    const predicted = Math.round(basePredicted);

    // Growing uncertainty interval
    const uncertaintyFactor = Math.sqrt(i);
    const z80 = 1.28;
    const z95 = 1.96;
    const margin80 = Math.round(stdError * uncertaintyFactor * z80);
    const margin95 = Math.round(stdError * uncertaintyFactor * z95);

    forecastPoints.push({
      date: dateStr,
      predicted,
      lower80: Math.max(0, predicted - margin80),
      upper80: predicted + margin80,
      lower95: Math.max(0, predicted - margin95),
      upper95: predicted + margin95,
    });
  }

  return forecastPoints;
}

// Capacity Planning Risk Assessment
export function computeCapacityRisks(records: MobilityRecord[]): CapacityRisk[] {
  const map = new Map<string, {
    route: string;
    mode: TransportMode;
    totalPax: number;
    totalCap: number;
    peakPax: number;
    peakCap: number;
    peakDate: string;
  }>();

  for (const r of records) {
    if (r.mode === 'Car') continue; // Private cars don't have scheduled capacity bounds in the same sense
    const key = `${r.origin} → ${r.destination} | ${r.mode}`;
    const curr = map.get(key) || {
      route: `${r.origin} → ${r.destination}`,
      mode: r.mode,
      totalPax: 0,
      totalCap: 0,
      peakPax: 0,
      peakCap: 1,
      peakDate: r.date,
    };
    curr.totalPax += r.passengers;
    curr.totalCap += r.capacity;
    if (r.occupancyRate > (curr.peakPax / curr.peakCap)) {
      curr.peakPax = r.passengers;
      curr.peakCap = r.capacity;
      curr.peakDate = r.date;
    }
    map.set(key, curr);
  }

  const risks: CapacityRisk[] = [];
  for (const item of map.values()) {
    const avgOccupancy = item.totalCap > 0 ? (item.totalPax / item.totalCap) * 100 : 0;
    const peakOccupancy = (item.peakPax / item.peakCap) * 100;

    let riskLevel: 'Critical' | 'High' | 'Moderate' = 'Moderate';
    let recommendedAction = 'Standard operational scheduling adequate.';

    if (avgOccupancy >= 88 || peakOccupancy >= 96) {
      riskLevel = 'Critical';
      recommendedAction = item.mode === 'Train'
        ? 'Deploy 2 extra Vande Bharat/Special holiday rakes; expand Tatkal quota.'
        : item.mode === 'Airplane'
        ? 'Request DGCA slot addition; upgrade narrowbody to widebody / high-density A321.'
        : 'Induct 20 additional multi-axle sleeper buses from feeder routes.';
    } else if (avgOccupancy >= 80 || peakOccupancy >= 90) {
      riskLevel = 'High';
      recommendedAction = item.mode === 'Train'
        ? 'Augment existing rakes with +2 3-Tier AC coaches on weekend runs.'
        : item.mode === 'Airplane'
        ? 'Optimize turn-around time to add 1 daily return frequency.'
        : 'Increase night-departure frequency by 15% on Friday/Sunday.';
    }

    risks.push({
      route: item.route,
      mode: item.mode,
      avgOccupancy: Number(avgOccupancy.toFixed(1)),
      peakOccupancy: Number(peakOccupancy.toFixed(1)),
      peakDate: item.peakDate,
      riskLevel,
      recommendedAction,
    });
  }

  return risks.sort((a, b) => b.peakOccupancy - a.peakOccupancy);
}
