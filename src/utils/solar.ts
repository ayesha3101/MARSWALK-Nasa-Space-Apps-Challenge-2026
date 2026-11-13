// Mars Gale Crater Solar Ephemeris Calculator
// Coordinates: 4.5895° S, 137.4417° E (Aeolis Mons / Gale Crater)
// Calculates Local Solar Time (LMST), Solar Elevation, Azimuth, and Direct Surface Irradiance

export interface SolarEphemeris {
  lmstTimeStr: string;
  lmstHours: number;
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  surfaceIrradianceWm2: number;
  shadowLengthRatio: number;
  sunState: 'DAWN' | 'DAYLIGHT' | 'ZENITH' | 'DUSK' | 'NIGHT';
}

const GALE_LAT_RAD = (-4.5895 * Math.PI) / 180; // 4.59° S
const MARS_SOLAR_CONSTANT = 590; // W/m^2 at 1.52 AU
const DUST_OPTICAL_DEPTH_TAU = 0.65; // MSL REMS typical optical depth

/**
 * Calculates Gale Crater solar ephemeris for a given elapsed EVA time in minutes.
 * Mission starts at 08:30 LMST (Local Mean Solar Time).
 */
export function calculateGaleSolar(elapsedMinutes: number, lsDeg = 70.0): SolarEphemeris {
  const startHour = 8.5; // 08:30 LMST
  const currentHour = (startHour + elapsedMinutes / 60) % 24;

  const hh = Math.floor(currentHour);
  const mm = Math.floor((currentHour - hh) * 60);
  const ss = Math.floor(((currentHour - hh) * 60 - mm) * 60);
  const lmstTimeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} LMST`;

  // Solar declination for given Mars solar longitude Ls (obliquity 25.19°)
  const obliquityRad = (25.19 * Math.PI) / 180;
  const lsRad = (lsDeg * Math.PI) / 180;
  const declinationRad = Math.asin(Math.sin(obliquityRad) * Math.sin(lsRad));

  // Hour angle h: (hour - 12) * 15°
  const hourAngleDeg = (currentHour - 12) * 15;
  const hourAngleRad = (hourAngleDeg * Math.PI) / 180;

  // Solar Elevation: sin(alpha) = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(h)
  const sinAlpha =
    Math.sin(GALE_LAT_RAD) * Math.sin(declinationRad) +
    Math.cos(GALE_LAT_RAD) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  
  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinAlpha)));
  const elevationDeg = (elevationRad * 180) / Math.PI;

  // Solar Azimuth: cos(az) = (sin(alpha)*sin(phi) - sin(delta)) / (cos(alpha)*cos(phi))
  const cosElevation = Math.cos(elevationRad);
  let azimuthDeg = 180;
  if (Math.abs(cosElevation) > 0.001) {
    const cosAz =
      (sinAlpha * Math.sin(GALE_LAT_RAD) - Math.sin(declinationRad)) /
      (cosElevation * Math.cos(GALE_LAT_RAD));
    const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
    let az = (Math.acos(clampedCosAz) * 180) / Math.PI;
    if (Math.sin(hourAngleRad) > 0) {
      az = 360 - az;
    }
    azimuthDeg = (az + 180) % 360;
  }

  // Surface Irradiance with atmospheric dust extinction
  let surfaceIrradianceWm2 = 0;
  let shadowLengthRatio = 99;
  if (elevationDeg > 0) {
    const airmass = 1 / Math.max(0.12, Math.sin(elevationRad));
    surfaceIrradianceWm2 = Math.round(
      MARS_SOLAR_CONSTANT * Math.sin(elevationRad) * Math.exp(-DUST_OPTICAL_DEPTH_TAU * airmass)
    );
    shadowLengthRatio = Number((1 / Math.tan(Math.max(0.05, elevationRad))).toFixed(2));
  }

  let sunState: SolarEphemeris['sunState'] = 'DAYLIGHT';
  if (elevationDeg < -6) sunState = 'NIGHT';
  else if (elevationDeg < 5) sunState = 'DAWN';
  else if (elevationDeg > 58) sunState = 'ZENITH';
  else if (currentHour > 17) sunState = 'DUSK';

  return {
    lmstTimeStr,
    lmstHours: currentHour,
    solarElevationDeg: Number(elevationDeg.toFixed(1)),
    solarAzimuthDeg: Number(azimuthDeg.toFixed(1)),
    surfaceIrradianceWm2,
    shadowLengthRatio,
    sunState
  };
}
