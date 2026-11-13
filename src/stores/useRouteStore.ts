import { create } from 'zustand';
import { SolvedRoute } from '../types/mission';
import { requestRouteSolve, requestAbortSolve } from '../workers/workerClient';
import { useMissionStore } from './useMissionStore';

interface AbortData {
  pathIndices: [number, number][];
  pathCoords: [number, number][];
  distanceMeters: number;
  estimatedMinutes: number;
}

interface RouteState {
  solvedRoute: SolvedRoute | null;
  routingMode: 'safest' | 'fastest';
  isCalculating: boolean;
  abortRoute: AbortData | null;
  isAbortActive: boolean;
  hoveredProfileIndex: number | null;

  // Actions
  recalculateRoute: () => Promise<void>;
  setRoutingMode: (mode: 'safest' | 'fastest') => void;
  triggerEmergencyAbort: (currentGrid: [number, number]) => Promise<void>;
  clearEmergencyAbort: () => void;
  setHoveredProfileIndex: (idx: number | null) => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  solvedRoute: null,
  routingMode: 'safest',
  isCalculating: false,
  abortRoute: null,
  isAbortActive: false,
  hoveredProfileIndex: null,

  recalculateRoute: async () => {
    const { waypoints, demPayload, maxSlopeLimitDeg } = useMissionStore.getState();
    if (!demPayload || waypoints.length < 2) return;

    set({ isCalculating: true });
    try {
      const { routingMode } = get();
      const route = await requestRouteSolve(
        waypoints,
        demPayload,
        routingMode,
        maxSlopeLimitDeg
      );
      set({ solvedRoute: route, isCalculating: false });
    } catch (err) {
      console.error('Route calculation failed:', err);
      set({ isCalculating: false });
    }
  },

  setRoutingMode: (mode: 'safest' | 'fastest') => {
    set({ routingMode: mode });
    get().recalculateRoute();
  },

  triggerEmergencyAbort: async (currentGrid: [number, number]) => {
    const { waypoints, demPayload, maxSlopeLimitDeg } = useMissionStore.getState();
    if (!demPayload || waypoints.length === 0) return;

    const habWp = waypoints.find(w => w.role === 'START_END') || waypoints[0];
    set({ isCalculating: true });

    try {
      const abortData = await requestAbortSolve(
        currentGrid,
        habWp.grid,
        demPayload,
        maxSlopeLimitDeg
      );
      set({
        abortRoute: abortData,
        isAbortActive: true,
        isCalculating: false
      });
    } catch (err) {
      console.error('Abort solve failed:', err);
      set({ isCalculating: false });
    }
  },

  clearEmergencyAbort: () => {
    set({ abortRoute: null, isAbortActive: false });
  },

  setHoveredProfileIndex: (idx: number | null) => {
    set({ hoveredProfileIndex: idx });
  }
}));
