import { describe, it, expect } from 'vitest';
import { calculateMetabolicRates, slopeAdjustedSpeed, getMartianLMST } from '../utils/marsMath';
import { marsDistanceMeters } from '../utils/coordinates';

describe('Martian Biophysics & Planetary Calculations', () => {
  it('calculates resting vs uphill metabolic O2 consumption', () => {
    const flatMetabolic = calculateMetabolicRates(0.0);
    const uphillMetabolic = calculateMetabolicRates(15.0);

    expect(flatMetabolic.o2BurnRateLitersPerMin).toBeGreaterThanOrEqual(1.0);
    expect(uphillMetabolic.o2BurnRateLitersPerMin).toBeGreaterThan(flatMetabolic.o2BurnRateLitersPerMin);
    expect(uphillMetabolic.energyKcalPerHour).toBeGreaterThan(flatMetabolic.energyKcalPerHour);
  });

  it('adjusts walking speed according to terrain slope and stops at > 20°', () => {
    const flatSpeed = slopeAdjustedSpeed(0.0);
    const steepSpeed = slopeAdjustedSpeed(15.0);
    const impassableSpeed = slopeAdjustedSpeed(22.0);

    expect(flatSpeed).toBeGreaterThan(steepSpeed);
    expect(impassableSpeed).toBe(0.0);
  });

  it('computes realistic Martian surface distances', () => {
    // 0.01 deg latitude on Mars is ~591 meters
    const p1: [number, number] = [137.385, -4.725];
    const p2: [number, number] = [137.385, -4.735];
    const dist = marsDistanceMeters(p1, p2);

    expect(dist).toBeGreaterThan(580);
    expect(dist).toBeLessThan(605);
  });

  it('formats Martian LMST string cleanly', () => {
    const { lmstString, sol } = getMartianLMST();
    expect(sol).toBe(1);
    expect(lmstString).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
