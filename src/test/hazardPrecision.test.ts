import { describe, it, expect } from 'vitest';
import { findRouteAStar, CostGridData } from '../utils/astar';

describe('Tactical Hazard & Routing Optimization Modes', () => {
  const GRID_SIZE = 12;
  const CELL_SIZE = 20.0;

  function createTestGrids(fillElev = 0, fillSlope = 2.0) {
    const elevationGrid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(fillElev)
    );
    const slopeGrid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(fillSlope)
    );
    return { elevationGrid, slopeGrid };
  }

  it('safest mode prioritizes lowest slope path over shortest distance', () => {
    const { elevationGrid, slopeGrid } = createTestGrids(0, 1.0);
    // Direct path has moderate slope (8°), detour has flat 0.5° slope
    for (let x = 1; x <= 6; x++) {
      slopeGrid[2][x] = 8.5; // Direct corridor
    }
    for (let x = 1; x <= 6; x++) {
      slopeGrid[4][x] = 0.5; // Detour corridor
    }

    const fastestData: CostGridData = {
      gridSize: GRID_SIZE,
      cellSizeMeters: CELL_SIZE,
      elevationGrid,
      slopeGrid,
      maxAllowedSlopeDeg: 20.0,
      routingMode: 'fastest'
    };

    const safestData: CostGridData = {
      gridSize: GRID_SIZE,
      cellSizeMeters: CELL_SIZE,
      elevationGrid,
      slopeGrid,
      maxAllowedSlopeDeg: 20.0,
      routingMode: 'safest'
    };

    const fastestPath = findRouteAStar([1, 2], [6, 2], fastestData);
    const safestPath = findRouteAStar([1, 2], [6, 2], safestData);

    expect(fastestPath.length).toBeLessThanOrEqual(safestPath.length);
    // Average slope of safest path should be lower or equal
    const avgSlopeFastest =
      fastestPath.reduce((acc, [x, y]) => acc + slopeGrid[y][x], 0) / fastestPath.length;
    const avgSlopeSafest =
      safestPath.reduce((acc, [x, y]) => acc + slopeGrid[y][x], 0) / safestPath.length;
    expect(avgSlopeSafest).toBeLessThanOrEqual(avgSlopeFastest);
  });

  it('fails gracefully and returns direct line when completely walled off', () => {
    const { elevationGrid, slopeGrid } = createTestGrids(0, 1.0);
    // Completely enclose goal [8, 8] with 35° cliff walls
    for (let x = 7; x <= 9; x++) {
      for (let y = 7; y <= 9; y++) {
        if (x !== 8 || y !== 8) {
          slopeGrid[y][x] = 35.0; // Blocked cliff
        }
      }
    }

    const data: CostGridData = {
      gridSize: GRID_SIZE,
      cellSizeMeters: CELL_SIZE,
      elevationGrid,
      slopeGrid,
      maxAllowedSlopeDeg: 20.0,
      routingMode: 'fastest'
    };

    const path = findRouteAStar([1, 1], [8, 8], data);
    // A* falls back gracefully to direct straight line points
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual([1, 1]);
    expect(path[path.length - 1]).toEqual([8, 8]);
  });
});
