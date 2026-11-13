import { create } from 'zustand';
import { DemPayload, MissionManifest, Waypoint } from '../types/mission';

interface MissionState {
  manifest: MissionManifest | null;
  demPayload: DemPayload | null;
  waypoints: Waypoint[];
  selectedWaypointId: string | null;
  isLoaded: boolean;
  maxSlopeLimitDeg: number;
  
  // Actions
  loadMissionData: () => Promise<void>;
  updateWaypointPosition: (id: string, grid: [number, number], coords: [number, number]) => void;
  selectWaypoint: (id: string | null) => void;
  setMaxSlopeLimit: (deg: number) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  manifest: null,
  demPayload: null,
  waypoints: [],
  selectedWaypointId: null,
  isLoaded: false,
  maxSlopeLimitDeg: 20.0,

  loadMissionData: async () => {
    try {
      const [manifestRes, demRes] = await Promise.all([
        fetch('/data/mission_manifest.json'),
        fetch('/data/dem_gale_boxwork.json')
      ]);

      const manifest: MissionManifest = await manifestRes.json();
      const demPayload: DemPayload = await demRes.json();

      set({
        manifest,
        demPayload,
        waypoints: manifest.waypoints,
        isLoaded: true,
        maxSlopeLimitDeg: manifest.limits.maxSuitSlopeDeg || 20.0
      });
    } catch (err) {
      console.error('Failed to load mission data:', err);
    }
  },

  updateWaypointPosition: (id: string, grid: [number, number], coords: [number, number]) => {
    const { waypoints } = get();
    const updated = waypoints.map((wp) => {
      if (wp.id === id) {
        return { ...wp, grid, coordinates: coords };
      }
      return wp;
    });
    set({ waypoints: updated });
  },

  selectWaypoint: (id: string | null) => {
    set({ selectedWaypointId: id });
  },

  setMaxSlopeLimit: (deg: number) => {
    set({ maxSlopeLimitDeg: deg });
  }
}));
