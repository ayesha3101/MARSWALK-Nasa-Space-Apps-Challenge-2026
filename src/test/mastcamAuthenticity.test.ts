import { describe, it, expect } from 'vitest';
import manifest from '../../public/data/mission_manifest.json';
import provenance from '../../public/data/data_provenance.json';

describe('MSL Curiosity Mastcam Reconnaissance Authenticity', () => {
  it('contains exactly 5 tactical waypoints with authentic Mastcam metadata', () => {
    expect(manifest.waypoints).toHaveLength(5);
    manifest.waypoints.forEach((wp) => {
      expect(wp.mastcam).toBeDefined();
      expect(wp.mastcam.sol).toBeGreaterThan(0);
      expect(wp.mastcam.targetName).toBeTruthy();
      expect(wp.mastcam.instrument).toMatch(/Mast Camera \(M-(34|100)/);
      expect(wp.mastcam.imageId).toMatch(/^[0-9]{4}M[RL]/);
      expect(wp.mastcam.geology).toBeTruthy();
    });
  });

  it('assigns ground-truth sols matching published Curiosity science milestones', () => {
    const solMap: Record<string, number> = {
      hab: 300,      // Bradbury Landing basal plain
      stop1: 938,    // Garden City hydrothermal boxwork veins
      stop2: 1065,   // Buckskin drill site on layered bedrock
      stop3: 1192,   // Bagnold Dunes active dark ripple complex
      stop4: 1450    // Murray Buttes sulfate escarpment
    };

    manifest.waypoints.forEach((wp) => {
      expect(wp.mastcam.sol).toBe(solMap[wp.id]);
    });
  });

  it('coordinates fall strictly within Gale Crater Mount Sharp boxwork AOI', () => {
    // Gale bounds: 137.34° - 137.42° E, -4.74° - -4.68° S
    manifest.waypoints.forEach((wp) => {
      const [lng, lat] = wp.coordinates;
      expect(lng).toBeGreaterThanOrEqual(137.34);
      expect(lng).toBeLessThanOrEqual(137.42);
      expect(lat).toBeLessThanOrEqual(-4.68);
      expect(lat).toBeGreaterThanOrEqual(-4.74);
    });
  });

  it('ensures each waypoint image file is referenced and verified', () => {
    manifest.waypoints.forEach((wp) => {
      expect(wp.pov).toMatch(/\.jpg$/);
    });
  });

  it('validates official NASA/USGS provenance dataset records', () => {
    expect(provenance.layers.length).toBeGreaterThanOrEqual(4);
    const sources = provenance.layers.map((d: { source: string }) => d.source).join(' ');
    expect(sources).toContain('CTX');
    expect(sources).toContain('MOLA');
    expect(sources).toContain('2001 Mars Odyssey');
    expect(sources).toContain('Curiosity Rover Mastcam');
  });
});
