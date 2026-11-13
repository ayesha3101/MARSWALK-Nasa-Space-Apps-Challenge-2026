import { describe, it, expect } from 'vitest';
import { calculateGaleSolar } from '../utils/solar';

describe('Gale Crater Solar Ephemeris Model', () => {
  it('correctly computes morning departure at 08:30 LMST', () => {
    const solar = calculateGaleSolar(0); // 0 minutes elapsed
    expect(solar.lmstTimeStr).toContain('08:30:00');
    expect(solar.solarElevationDeg).toBeGreaterThan(15);
    expect(solar.solarElevationDeg).toBeLessThan(45);
    expect(solar.sunState).toBe('DAYLIGHT');
    expect(solar.surfaceIrradianceWm2).toBeGreaterThan(50);
  });

  it('correctly computes local midday zenith around 12:00-12:30 LMST', () => {
    // 210 minutes elapsed = 3.5 hours -> 12:00 LMST
    const solar = calculateGaleSolar(210);
    expect(solar.lmstTimeStr).toContain('12:00:00');
    // Near equator at solar noon, elevation should exceed 60 degrees
    expect(solar.solarElevationDeg).toBeGreaterThan(60);
    expect(solar.sunState).toBe('ZENITH');
    // Surface irradiance should reach near-maximum (~240-450 W/m^2 depending on optical depth)
    expect(solar.surfaceIrradianceWm2).toBeGreaterThan(240);
  });

  it('correctly calculates shadow length ratio shortening toward midday', () => {
    const morning = calculateGaleSolar(0);
    const midday = calculateGaleSolar(210);
    expect(midday.shadowLengthRatio).toBeLessThan(morning.shadowLengthRatio);
  });

  it('handles post-sunset night state gracefully', () => {
    // 600 minutes elapsed = 10 hours -> 18:30 LMST (dusk/night on Mars)
    const solar = calculateGaleSolar(600);
    expect(solar.surfaceIrradianceWm2).toBe(0);
    expect(solar.solarElevationDeg).toBeLessThan(0);
  });
});
