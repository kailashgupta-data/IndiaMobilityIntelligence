import { MobilityRecord, TransportMode } from '../types';
import { CORRIDORS, HOLIDAYS, BUS_OPERATORS, TRAIN_CATEGORIES, CAR_MODELS } from './constants';

// Pseudo-random generator with reproducible seed (Mulberry32)
function createRng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticMobilityData(seed = 42, dayCount = 365, startDateStr = '2025-10-15'): MobilityRecord[] {
  const rng = createRng(seed);
  const records: MobilityRecord[] = [];

  const startDate = new Date(startDateStr);

  // Pre-calculate holiday lookup map
  const holidayDateMap = new Map<string, { name: string; multiplier: number; regions: string[] }>();
  for (const h of HOLIDAYS) {
    const hDate = new Date(h.date);
    for (let d = -1; d <= h.durationDays; d++) {
      const cur = new Date(hDate);
      cur.setDate(cur.getDate() + d);
      const iso = cur.toISOString().split('T')[0];
      // Peak weight near the actual holiday
      const distanceFactor = Math.max(0.6, 1.0 - Math.abs(d) * 0.12);
      const mult = 1.0 + (h.demandMultiplier - 1.0) * distanceFactor;
      holidayDateMap.set(iso, {
        name: h.name,
        multiplier: mult,
        regions: h.primaryRegions,
      });
    }
  }

  const modes: TransportMode[] = ['Bus', 'Car', 'Train', 'Airplane'];

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    const curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + dayIndex);
    const dateStr = curDate.toISOString().split('T')[0];
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const holidayInfo = holidayDateMap.get(dateStr) || null;
    const isHoliday = !!holidayInfo;
    const holidayName = holidayInfo ? holidayInfo.name : null;

    for (const corr of CORRIDORS) {
      // Both directions: A -> B and B -> A
      const directions = [
        { origin: corr.origin, destination: corr.destination, dirLabel: 'Outbound' as const },
        { origin: corr.destination, destination: corr.origin, dirLabel: 'Inbound' as const },
      ];

      for (const dir of directions) {
        const routeId = `${dir.origin.slice(0, 3).toUpperCase()}-${dir.destination.slice(0, 3).toUpperCase()}`;
        const distKm = corr.roadDistanceKm;

        // Base corridor demand scale (based on metro population)
        let corridorBaseVolume = 14000;
        if (corr.origin === 'Mumbai' && corr.destination === 'Pune') corridorBaseVolume = 32000; // Hyper-dense 150km corridor
        if (corr.origin === 'Delhi' && corr.destination === 'Jaipur') corridorBaseVolume = 18000;
        if (corr.origin === 'Bengaluru' && corr.destination === 'Chennai') corridorBaseVolume = 24000;
        if (corr.origin === 'Mumbai' && corr.destination === 'Delhi') corridorBaseVolume = 26000;
        if (corr.origin === 'Bengaluru' && corr.destination === 'Hyderabad') corridorBaseVolume = 19000;

        // Determine regional holiday modifier
        let holidayMod = 1.0;
        if (holidayInfo) {
          const isSouth = ['Bengaluru', 'Chennai', 'Hyderabad'].includes(dir.origin);
          const isWest = ['Mumbai', 'Pune'].includes(dir.origin);
          const isNorth = ['Delhi', 'Jaipur'].includes(dir.origin);
          const isEast = ['Kolkata'].includes(dir.origin);

          if (holidayInfo.regions.includes('National')) {
            holidayMod = holidayInfo.multiplier;
          } else if (isSouth && holidayInfo.regions.includes('South')) {
            holidayMod = holidayInfo.multiplier * 1.15;
          } else if (isWest && holidayInfo.regions.includes('West')) {
            holidayMod = holidayInfo.multiplier * 1.18;
          } else if (isNorth && holidayInfo.regions.includes('North')) {
            holidayMod = holidayInfo.multiplier * 1.12;
          } else if (isEast && holidayInfo.regions.includes('East')) {
            holidayMod = holidayInfo.multiplier * 1.20;
          } else {
            holidayMod = 1.0 + (holidayInfo.multiplier - 1.0) * 0.35; // Mild spillover
          }
        }

        // Directional asymmetry modeling (Friday outbound peak, Sunday inbound return peak)
        let directionMultiplier = 1.0;
        if (dayOfWeek === 5) {
          // Friday: outbound surge from major commercial hub
          directionMultiplier = dir.dirLabel === 'Outbound' ? 1.22 : 0.88;
        } else if (dayOfWeek === 0) {
          // Sunday: return inbound surge
          directionMultiplier = dir.dirLabel === 'Inbound' ? 1.28 : 0.84;
        } else if (dayOfWeek === 1) {
          // Monday morning business inbound/outbound
          directionMultiplier = dir.dirLabel === 'Outbound' ? 1.10 : 0.95;
        }

        // Month-level seasonal curve (Winter peak in India Nov-Feb, Summer May-Jun, Monsoon Jul-Aug slight dip)
        const month = curDate.getMonth(); // 0 to 11
        let seasonalMonthFactor = 1.0;
        if ([10, 11, 0, 1].includes(month)) seasonalMonthFactor = 1.12; // Winter tourist & wedding season
        if ([4, 5].includes(month)) seasonalMonthFactor = 1.08; // Summer school break
        if ([6, 7].includes(month)) seasonalMonthFactor = 0.94; // Monsoon dip

        const totalCorridorDailyDemand = Math.round(
          corridorBaseVolume * holidayMod * directionMultiplier * seasonalMonthFactor * (0.92 + rng() * 0.16)
        );

        // Calculate Modal split based on distance
        let modalShare: Record<TransportMode, number>;
        if (distKm <= 200) {
          // Very short corridor (e.g. Mumbai-Pune 150km): Car & Bus high, Train high, Air tiny
          modalShare = { Car: 0.42, Bus: 0.28, Train: 0.27, Airplane: 0.03 };
        } else if (distKm <= 400) {
          // Short corridor (e.g. BLR-MAA 350km, DEL-JAI 280km): Balanced mix
          modalShare = { Train: 0.38, Bus: 0.26, Car: 0.24, Airplane: 0.12 };
        } else if (distKm <= 700) {
          // Medium corridor (e.g. BLR-HYD 570km, MAA-HYD 630km): Train & Air prominent
          modalShare = { Train: 0.40, Airplane: 0.28, Bus: 0.20, Car: 0.12 };
        } else {
          // Long corridor (>900km, e.g. BOM-DEL 1420km, DEL-CCU 1530km): Air & Train dominate
          modalShare = { Airplane: 0.52, Train: 0.42, Bus: 0.04, Car: 0.02 };
        }

        // Generate per-mode records
        for (const mode of modes) {
          const share = modalShare[mode];
          const rawPassengers = Math.round(totalCorridorDailyDemand * share * (0.94 + rng() * 0.12));
          const passengers = Math.max(80, rawPassengers);

          let trips = 0;
          let capacity = 0;
          let avgFareOrExp = 0;
          let ticketRevenue = 0;
          let carExpenditure = 0;
          let subCategory = '';
          let operatingCost = 0;

          if (mode === 'Bus') {
            const seatsPerBus = 42;
            const targetOccupancy = isWeekend || isHoliday ? 0.88 + rng() * 0.08 : 0.72 + rng() * 0.12;
            trips = Math.ceil(passengers / (seatsPerBus * Math.min(0.96, targetOccupancy)));
            capacity = trips * seatsPerBus;
            // Fare: ₹1.60 - ₹2.20 per km
            const baseFarePerKm = 1.85;
            const dynamicMultiplier = isHoliday ? 1.35 : isWeekend ? 1.15 : 1.0;
            avgFareOrExp = Math.round(distKm * baseFarePerKm * dynamicMultiplier * (0.95 + rng() * 0.10));
            ticketRevenue = passengers * avgFareOrExp;
            carExpenditure = 0;
            const op = BUS_OPERATORS[Math.floor(rng() * BUS_OPERATORS.length)];
            subCategory = op.name;
            // Estimated bus operating cost: Fuel + Toll + Driver + Maintenance (~₹42/km per bus)
            operatingCost = Math.round(trips * distKm * 44);
          } else if (mode === 'Car') {
            const carCat = CAR_MODELS[Math.floor(rng() * CAR_MODELS.length)];
            const paxPerCar = carCat.avgOccupancy + (isHoliday ? 0.35 : 0) + (rng() * 0.2 - 0.1);
            trips = Math.round(passengers / paxPerCar);
            capacity = Math.round(trips * 4.5); // Average 4.5 seats physical car capacity
            // Road travel expenditure: Fuel (₹7/km) + FASTag Toll (₹2/km) = ~₹9/km per car
            // Divided by passengers = ~₹3.10/km per passenger
            const expPerPaxKm = 3.10;
            avgFareOrExp = Math.round(distKm * expPerPaxKm * (0.95 + rng() * 0.10));
            ticketRevenue = 0; // Explicitly 0: Private car expenditure is not transit operator revenue
            carExpenditure = passengers * avgFareOrExp;
            subCategory = carCat.category;
            operatingCost = 0; // Not a transit carrier
          } else if (mode === 'Train') {
            const seatsPerTrain = 1100;
            const targetOccupancy = isHoliday ? 0.96 + rng() * 0.03 : 0.86 + rng() * 0.08;
            trips = Math.max(2, Math.ceil(passengers / (seatsPerTrain * Math.min(0.99, targetOccupancy))));
            capacity = trips * seatsPerTrain;
            // Fare: Average blend of CC, 3A, 2A, SL (~₹1.45/km)
            const baseTrainFarePerKm = 1.45;
            const dynamicMultiplier = isHoliday ? 1.20 : 1.0; // Premium Tatkal / dynamic fare
            avgFareOrExp = Math.round(distKm * baseTrainFarePerKm * dynamicMultiplier * (0.96 + rng() * 0.08));
            ticketRevenue = passengers * avgFareOrExp;
            carExpenditure = 0;
            const trainCat = TRAIN_CATEGORIES[Math.floor(rng() * TRAIN_CATEGORIES.length)];
            subCategory = trainCat.name;
            // Indian Railways estimated operating cost per rake-km (~₹420/km)
            operatingCost = Math.round(trips * distKm * 420);
          } else if (mode === 'Airplane') {
            const seatsPerFlight = 186; // Typical A320neo / B737
            const targetPLF = isHoliday ? 0.92 + rng() * 0.05 : 0.82 + rng() * 0.09;
            trips = Math.max(1, Math.ceil(passengers / (seatsPerFlight * Math.min(0.98, targetPLF))));
            capacity = trips * seatsPerFlight;
            // Air ticket pricing is highly dynamic: ₹3,500 base + ₹3.80/km + festive surge
            const baseTicket = 3200 + corr.airDistanceKm * 3.4;
            const dynamicMultiplier = isHoliday ? 1.55 : isWeekend ? 1.18 : 1.0;
            avgFareOrExp = Math.round(baseTicket * dynamicMultiplier * (0.94 + rng() * 0.12));
            ticketRevenue = passengers * avgFareOrExp;
            carExpenditure = 0;
            subCategory = 'Domestic Scheduled Carrier';
            // Operating cost: Jet fuel (ATF), crew, airport landing/parking, lease (~₹2,100 per block km)
            operatingCost = Math.round(trips * corr.airDistanceKm * 2150);
          }

          const occupancyRate = Math.min(1.0, passengers / Math.max(1, capacity));
          const totalValue = ticketRevenue + carExpenditure;
          const operatingMargin = ticketRevenue > 0 ? ticketRevenue - operatingCost : 0;

          records.push({
            id: `${dateStr}_${routeId}_${mode}_${dir.dirLabel}`,
            date: dateStr,
            dayOfWeek,
            origin: dir.origin,
            destination: dir.destination,
            routeId,
            direction: dir.dirLabel,
            mode,
            passengers,
            trips,
            avgFareOrExp,
            ticketRevenue,
            carExpenditure,
            totalValue,
            capacity,
            occupancyRate,
            isHoliday,
            holidayName,
            isWeekend,
            subCategory,
            operatingCost,
            operatingMargin,
          });
        }
      }
    }
  }

  return records;
}
