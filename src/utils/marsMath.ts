/**
 * Biophysical, Orbital & Chronological Mathematics for Mars EVA
 */

// Gale Crater Boxwork Longitude: 137.385° E
export const GALE_LON_EAST_DEG = 137.385;

/**
 * Calculates Martian Local Mean Solar Time (LMST) for Gale Crater.
 * Martian sol is 24h 39m 35.244s = 88,775.244 seconds.
 */
export function getMartianLMST(date: Date = new Date()): {
  sol: number;
  lmstString: string;
  fractionalHours: number;
} {
  // Reference epoch: MSD (Mars Sol Date) 44796.0 corresponds to Jan 6, 2000 00:00:00 UTC
  const millisSince2000 = date.getTime() - Date.UTC(2000, 0, 6, 0, 0, 0);
  const daysSince2000 = millisSince2000 / 86400000;
  
  // Mars Sol Date calculation (Allison & McEwen, 2000)
  const msd = (daysSince2000 - 4.5) / 1.027491252 + 44796.0 - 0.00096;
  const solNumber = Math.floor(msd) % 1000 + 1; // Sol 1 of campaign
  
  // Local Mean Solar Time = MSD + (lon_east / 360)
  const lmstDayFrac = (msd + GALE_LON_EAST_DEG / 360.0) % 1.0;
  const totalMartianSeconds = lmstDayFrac * 86400; // 24 martian hours scale
  
  const h = Math.floor(totalMartianSeconds / 3600);
  const m = Math.floor((totalMartianSeconds % 3600) / 60);
  const s = Math.floor(totalMartianSeconds % 60);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    sol: 1, // Sol 1 Hero mission
    lmstString: `${pad(h)}:${pad(m)}:${pad(s)}`,
    fractionalHours: h + m / 60 + s / 3600
  };
}

/**
 * Santee & Margaria-Minetti Metabolic Cost Equation
 * Evaluates oxygen burn rate (Liters / min) and energy expenditure (kcal / hr)
 * as a function of suit weight, terrain slope angle, and traversal speed.
 * 
 * Suit + Crew Mass: ~140 kg (effective weight on Mars: 140 * 0.38 = 53.2 kg)
 */
export function calculateMetabolicRates(
  slopeDeg: number,
  speedMps: number = 0.95
): {
  o2BurnRateLitersPerMin: number;
  energyKcalPerHour: number;
  metabolicLevel: 'LOW' | 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
} {
  const restingO2Lpm = 0.82;
  const absSlope = Math.abs(slopeDeg);
  
  // Normalized slope relative to 20° suit mobility limit
  const slopeRatio = Math.min(1.0, absSlope / 20.0);
  
  // Margaria uphill vs downhill asymmetric factor
  let slopeFactor = 0;
  if (slopeDeg >= 0) {
    // Uphill: quadratic power curve
    slopeFactor = Math.pow(slopeRatio, 1.85) * 3.2;
  } else {
    // Downhill: braking cost (metabolic reduction up to -8°, then increases due to braking load)
    if (absSlope < 9.0) {
      slopeFactor = -0.25 * (absSlope / 9.0);
    } else {
      slopeFactor = 0.15 * ((absSlope - 9.0) / 11.0);
    }
  }

  // Base walking cost at 0.95 m/s (~3.4 km/h) on Martian regolith
  const baseWalkingO2 = 0.55 * (speedMps / 0.95);
  const totalO2Lpm = Math.max(0.65, restingO2Lpm + baseWalkingO2 + (baseWalkingO2 * slopeFactor));
  
  // 1 Liter O2 consumed is approximately equivalent to 4.86 kcal of metabolic energy
  const kcalPerHour = totalO2Lpm * 60 * 4.86;

  let metabolicLevel: 'LOW' | 'NOMINAL' | 'ELEVATED' | 'CRITICAL' = 'NOMINAL';
  if (totalO2Lpm > 2.3) {
    metabolicLevel = 'CRITICAL';
  } else if (totalO2Lpm > 1.6) {
    metabolicLevel = 'ELEVATED';
  } else if (totalO2Lpm < 0.9) {
    metabolicLevel = 'LOW';
  }

  return {
    o2BurnRateLitersPerMin: Number(totalO2Lpm.toFixed(2)),
    energyKcalPerHour: Math.round(kcalPerHour),
    metabolicLevel
  };
}

/**
 * Returns estimated walking speed (m/s) as a function of terrain slope.
 * Astronauts slow down on steep climbs or hazardous descents.
 */
export function slopeAdjustedSpeed(slopeDeg: number): number {
  const absSlope = Math.abs(slopeDeg);
  if (absSlope > 20.0) return 0.0; // Impassable
  // Tobler's hiking function adapted for Mars gravity & suit stiffness
  // Base speed: 1.05 m/s on flat (0°) down to 0.35 m/s at 19°
  const speed = 1.05 * Math.exp(-3.5 * Math.abs(Math.tan(absSlope * Math.PI / 180) + 0.05));
  return Math.max(0.35, Math.min(1.1, speed));
}
