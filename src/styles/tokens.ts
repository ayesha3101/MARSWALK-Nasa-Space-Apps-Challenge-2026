/**
 * MARSWALK Design Tokens
 * NASA-grade tactical HUD aesthetic specification
 */

export const TOKENS = {
  colors: {
    void: '#07090D', // Deep space near-black
    card: 'rgba(12, 17, 24, 0.85)',
    panel: 'rgba(10, 14, 20, 0.90)',
    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    borderHover: 'rgba(255, 255, 255, 0.28)',
    borderActive: 'rgba(226, 87, 43, 0.65)',
    marsRust: '#E2572B', // Mars regolith primary rust
    marsRustLight: '#F07548',
    marsGlow: 'rgba(226, 87, 43, 0.28)',
    dataCyan: '#4FD1C5', // Primary telemetry and safe paths
    dataCyanDark: '#1F7A70',
    dataCyanGlow: 'rgba(79, 209, 197, 0.25)',
    amberWarning: '#F6B042', // Moderate slope / cautions
    hazardRed: '#EF4444', // Danger, >20° slope, abort
    textPrimary: '#E8E6E1', // High contrast NASA off-white
    textMuted: '#8E96A4', // Secondary telemetry
    textDim: '#4A5568',
  },
  typography: {
    heading: '"Space Grotesk", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  limits: {
    maxSuitSlopeDeg: 20.0,
    cautionSlopeDeg: 12.0,
    maxAllowedRadDoseRate: 60.0, // uSv/h
    critO2HoursRemaining: 1.5,
    critBatteryPercent: 20,
  }
} as const;
