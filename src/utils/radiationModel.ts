/**
 * Martian Surface Radiation Exposure Model
 * Grounded in MSL Curiosity RAD (Radiation Assessment Detector) measurements.
 * 
 * Baseline Galactic Cosmic Ray (GCR) dose rate at Gale Crater floor:
 * ~27.2 uSv/h (0.65 mSv/sol), modulated by atmospheric column thickness (elevation).
 */

export interface RadiationSample {
  doseRateUSvHr: number;
  elevEffectUSvHr: number;
  shadowAttenuation: number;
  alertLevel: 'NORMAL' | 'ELEVATED' | 'HIGH';
}

export function calculateSurfaceRadiation(
  elevationMeters: number,
  slopeDeg: number,
  sunAzimuthDeg: number = 315.0
): RadiationSample {
  // Gale base datum ~ -4450m
  // Thicker atmosphere at lower elevations provides marginal GCR shielding (~0.8 uSv/h per 100m)
  const elevDelta = (elevationMeters - (-4450.0)) / 100.0;
  const elevEffect = elevDelta * 0.75;
  
  // Steep terrain facing away from incoming solar energetic particles provides topographic shielding
  const isShelteredByRidge = slopeDeg > 10.0;
  const shadowFactor = isShelteredByRidge ? 0.88 : 1.0;
  
  const baseGcrDoseRate = 27.2; // uSv/h
  const netDoseRate = Math.max(22.0, (baseGcrDoseRate + elevEffect) * shadowFactor);
  
  let alertLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' = 'NORMAL';
  if (netDoseRate > 45.0) {
    alertLevel = 'HIGH';
  } else if (netDoseRate > 32.0) {
    alertLevel = 'ELEVATED';
  }

  return {
    doseRateUSvHr: Number(netDoseRate.toFixed(2)),
    elevEffectUSvHr: Number(elevEffect.toFixed(2)),
    shadowAttenuation: Number(shadowFactor.toFixed(2)),
    alertLevel
  };
}
