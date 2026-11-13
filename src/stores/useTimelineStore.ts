import { create } from 'zustand';
import { useRouteStore } from './useRouteStore';
import { calculateMetabolicRates } from '../utils/marsMath';
import { calculateSurfaceRadiation } from '../utils/radiationModel';

interface TimelineState {
  isPlaying: boolean;
  playbackSpeed: 1 | 5 | 20;
  currentTimeSec: number;
  currentGrid: [number, number];
  currentCoord: [number, number];
  currentElevation: number;
  currentSlope: number;
  
  // Dynamic consumables (throttled to avoid 60fps React thrashing)
  o2RemainingPercent: number;
  o2RemainingHours: number;
  batteryRemainingPercent: number;
  suitCoreTempC: number;
  metabolicKcalHr: number;
  cumulativeRadUSv: number;
  instantDoseRateUSvHr: number;
  warnings: string[];

  // Actions
  play: () => void;
  pause: () => void;
  setSpeed: (speed: 1 | 5 | 20) => void;
  scrubToTime: (timeSec: number) => void;
  updateTelemetryForTime: (timeSec: number) => void;
}

let lastTelemetryTime = 0;
let cachedWarnings: string[] = [];

export const useTimelineStore = create<TimelineState>((set, get) => ({
  isPlaying: false,
  playbackSpeed: 5,
  currentTimeSec: 0,
  currentGrid: [36, 42],
  currentCoord: [137.343, -4.683],
  currentElevation: -4450.0,
  currentSlope: 2.1,

  o2RemainingPercent: 100,
  o2RemainingHours: 6.5,
  batteryRemainingPercent: 100,
  suitCoreTempC: 21.4,
  metabolicKcalHr: 280,
  cumulativeRadUSv: 0.0,
  instantDoseRateUSvHr: 27.2,
  warnings: [],

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),

  scrubToTime: (timeSec: number) => {
    get().updateTelemetryForTime(timeSec);
  },

  updateTelemetryForTime: (timeSec: number) => {
    const { solvedRoute } = useRouteStore.getState();
    if (!solvedRoute || solvedRoute.allPathIndices.length === 0) return;

    const totalTime = Math.max(1, solvedRoute.totalTimeSeconds);
    const ratio = Math.max(0, Math.min(1, timeSec / totalTime));

    const totalPts = solvedRoute.allPathIndices.length;
    const ptIndex = Math.min(totalPts - 1, Math.floor(ratio * (totalPts - 1)));

    const grid = solvedRoute.allPathIndices[ptIndex];
    const coord = solvedRoute.allPathCoords[ptIndex];
    const profilePt = solvedRoute.elevationProfile[ptIndex] || { elevationM: -4440, slopeDeg: 3 };

    // Continuous motion attributes (updated smoothly)
    const now = performance.now();
    const shouldUpdateTelemetry = (now - lastTelemetryTime) > 200; // Update consumable numbers at 5Hz to avoid 60fps re-render thrashing

    if (shouldUpdateTelemetry) {
      lastTelemetryTime = now;
      const o2ConsumedLiters = solvedRoute.totalO2UsedLiters * ratio;
      const o2TotalCapacityLiters = 550.0;
      const o2RemainingPct = Math.max(5, Math.round(((o2TotalCapacityLiters - o2ConsumedLiters) / o2TotalCapacityLiters) * 100));
      const o2Hours = Number(((o2TotalCapacityLiters - o2ConsumedLiters) / (o2TotalCapacityLiters / 6.5)).toFixed(1));

      const batteryPct = Math.max(8, Math.round(100 - ratio * 48));
      const metabolic = calculateMetabolicRates(profilePt.slopeDeg);
      const suitCoreTemp = Number((21.2 + (metabolic.energyKcalPerHour - 280) * 0.002).toFixed(1));
      const rad = calculateSurfaceRadiation(profilePt.elevationM, profilePt.slopeDeg);
      const cumulativeRad = Number((solvedRoute.totalRadDoseUSv * ratio).toFixed(2));

      const newWarnings: string[] = [];
      if (profilePt.slopeDeg > 15.0) {
        newWarnings.push(`CAUTION: Steep slope gradient (${profilePt.slopeDeg.toFixed(1)}°)`);
      }
      if (metabolic.metabolicLevel === 'CRITICAL' || metabolic.metabolicLevel === 'ELEVATED') {
        newWarnings.push(`ELEVATED METABOLIC: ${metabolic.energyKcalPerHour} kcal/hr`);
      }
      if (o2RemainingPct < 25) {
        newWarnings.push(`LOW O2 WARNING: ${o2RemainingPct}% remaining`);
      }
      if (rad.alertLevel === 'HIGH') {
        newWarnings.push(`ELEVATED RAD EXPOSURE: ${rad.doseRateUSvHr} µSv/h`);
      }

      // Only update warnings if content changed
      const warningsChanged = JSON.stringify(newWarnings) !== JSON.stringify(cachedWarnings);
      if (warningsChanged) {
        cachedWarnings = newWarnings;
      }

      set({
        currentTimeSec: timeSec,
        currentGrid: grid,
        currentCoord: coord,
        currentElevation: profilePt.elevationM,
        currentSlope: profilePt.slopeDeg,
        o2RemainingPercent: o2RemainingPct,
        o2RemainingHours: o2Hours,
        batteryRemainingPercent: batteryPct,
        suitCoreTempC: suitCoreTemp,
        metabolicKcalHr: metabolic.energyKcalPerHour,
        cumulativeRadUSv: cumulativeRad,
        instantDoseRateUSvHr: rad.doseRateUSvHr,
        warnings: cachedWarnings
      });
    } else {
      // Light update: only coordinate and time
      set({
        currentTimeSec: timeSec,
        currentGrid: grid,
        currentCoord: coord,
        currentElevation: profilePt.elevationM,
        currentSlope: profilePt.slopeDeg
      });
    }
  }
}));
