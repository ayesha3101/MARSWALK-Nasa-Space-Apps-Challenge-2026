export interface Waypoint {
  id: string;
  name: string;
  role: 'START_END' | 'SCIENCE_CORE' | 'ROVER_RENDEZVOUS' | 'SAMPLE_CACHE' | 'HIGH_ELEVATION' | 'CUSTOM';
  grid: [number, number]; // [x, y] in [0, 255]
  coordinates: [number, number]; // [lon, lat]
  elevation?: number;
  slope?: number;
  targetTimeMin: number;
  stayDurationMin: number;
  pov: string;
  desc: string;
  science: string;
  mastcam?: {
    sol: number;
    targetName: string;
    instrument: string;
    imageId: string;
    geology: string;
    resolution: string;
  };
}

export interface Astronaut {
  id: string;
  name: string;
  role: string;
}

export interface RoverInfo {
  name: string;
  status: string;
  dropPointStopId: string;
}

export interface MissionManifest {
  missionName: string;
  astronauts: Astronaut[];
  rover: RoverInfo;
  limits: {
    maxSuitSlopeDeg: number;
    nominalO2Hours: number;
    maxAllowedDoseRateUSv: number;
    nominalBatteryKWh: number;
  };
  waypoints: Waypoint[];
}

export interface DemMetadata {
  name: string;
  center: [number, number];
  bounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  gridSize: number;
  cellSizeMeters: number;
  areaKm: [number, number];
  elevationMin: number;
  elevationMax: number;
  maxSlopeDeg: number;
  meanSlopeDeg: number;
}

export interface DemPayload {
  metadata: DemMetadata;
  elevationGrid: number[][];
  slopeGrid: number[][];
}

export interface RouteLeg {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  distanceMeters: number;
  timeSeconds: number;
  maxSlopeDeg: number;
  meanSlopeDeg: number;
  o2UsedLiters: number;
  radiationDoseUSv: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  pathIndices: [number, number][]; // [[x, y], ...]
  pathCoords: [number, number][]; // [[lon, lat], ...]
  elevations: number[];
  slopes: number[];
}

export interface SolvedRoute {
  totalDistanceMeters: number;
  totalTimeSeconds: number; // including stay times
  totalWalkingTimeSeconds: number;
  totalO2UsedLiters: number;
  totalRadDoseUSv: number;
  maxSlopeDeg: number;
  meanSlopeDeg: number;
  legs: RouteLeg[];
  allPathIndices: [number, number][];
  allPathCoords: [number, number][];
  elevationProfile: {
    distanceM: number;
    elevationM: number;
    slopeDeg: number;
    legIndex: number;
    coord: [number, number];
  }[];
}

export interface LayerConfig {
  id: string;
  name: string;
  category: 'base' | 'elevation' | 'spectral' | 'hazard';
  file: string;
  visible: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'lighten';
  isSimulated: boolean;
  legend?: { label: string; color: string }[];
  description: string;
}

export interface TelemetryState {
  sol: number;
  lmst: string; // "10:14:22"
  mroPassSeconds: number; // Countdown to MRO communication pass
  o2PressureKpa: number; // Nominal ~29.6 kPa
  o2RemainingPercent: number;
  batteryRemainingPercent: number;
  suitCoreTempC: number;
  metabolicRateKcalHr: number;
  ambientTempC: number;
  groundTempC: number;
  atmosphericPressurePa: number;
  dustTau: number;
  instantDoseRateUSvHr: number;
  cumulativeDoseUSv: number;
}
