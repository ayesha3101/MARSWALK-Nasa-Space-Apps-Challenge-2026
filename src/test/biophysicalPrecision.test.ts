import { describe, it, expect } from 'vitest';
import { calculateMetabolicRates, slopeAdjustedSpeed } from '../utils/marsMath';
import { calculateSurfaceRadiation } from '../utils/radiationModel';

describe('Biophysical & Radiation Precision Equations', () => {
  describe('Santee & Margaria-Minetti Metabolic Calculations', () => {
    it('calculates nominal flat walking metabolic power', () => {
      const flat = calculateMetabolicRates(0, 0.95);
      expect(flat.o2BurnRateLitersPerMin).toBeGreaterThan(1.2);
      expect(flat.o2BurnRateLitersPerMin).toBeLessThan(1.5);
      expect(flat.energyKcalPerHour).toBeGreaterThan(350);
      expect(flat.energyKcalPerHour).toBeLessThan(450);
      expect(flat.metabolicLevel).toBe('NOMINAL');
    });

    it('predicts increased metabolic cost on uphill ascents', () => {
      const flat = calculateMetabolicRates(0, 0.95);
      const steepUphill = calculateMetabolicRates(15, 0.95);
      expect(steepUphill.o2BurnRateLitersPerMin).toBeGreaterThan(flat.o2BurnRateLitersPerMin * 1.5);
      expect(steepUphill.energyKcalPerHour).toBeGreaterThan(flat.energyKcalPerHour * 1.5);
      expect(['ELEVATED', 'CRITICAL']).toContain(steepUphill.metabolicLevel);
    });

    it('models slight metabolic relief on shallow descents and braking penalty on steep descents', () => {
      const flat = calculateMetabolicRates(0, 0.95);
      const gentleDown = calculateMetabolicRates(-6, 0.95);
      expect(gentleDown.o2BurnRateLitersPerMin).toBeLessThan(flat.o2BurnRateLitersPerMin);

      const steepDown = calculateMetabolicRates(-18, 0.95);
      expect(steepDown.o2BurnRateLitersPerMin).toBeGreaterThan(gentleDown.o2BurnRateLitersPerMin);
    });

    it('clamps speed to 0 for slopes exceeding the 20° suit mobility cutoff', () => {
      expect(slopeAdjustedSpeed(21)).toBe(0);
      expect(slopeAdjustedSpeed(25)).toBe(0);
      expect(slopeAdjustedSpeed(10)).toBeGreaterThan(0.4);
    });
  });

  describe('MSL RAD Surface Radiation Exposure Calculations', () => {
    it('matches baseline Gale Crater floor GCR dose rate (~27.2 uSv/h)', () => {
      const rad = calculateSurfaceRadiation(-4450, 0);
      expect(rad.doseRateUSvHr).toBeCloseTo(27.2, 1);
      expect(rad.alertLevel).toBe('NORMAL');
    });

    it('models higher radiation dose at higher elevations due to thinner atmospheric column', () => {
      const floor = calculateSurfaceRadiation(-4450, 0);
      const highPlateau = calculateSurfaceRadiation(-3950, 0); // 500m higher
      expect(highPlateau.doseRateUSvHr).toBeGreaterThan(floor.doseRateUSvHr);
    });

    it('accounts for topographic ridge shadowing attenuation', () => {
      const unshielded = calculateSurfaceRadiation(-4200, 2);
      const ridgeShielded = calculateSurfaceRadiation(-4200, 15);
      expect(ridgeShielded.shadowAttenuation).toBeLessThan(unshielded.shadowAttenuation);
      expect(ridgeShielded.doseRateUSvHr).toBeLessThan(unshielded.doseRateUSvHr);
    });
  });
});
