import { describe, it, expect } from 'vitest';
import { findRouteAStar, CostGridData } from '../utils/astar';

describe('A* Slope-Aware Pathfinding Engine', () => {
  const GRID_SIZE = 10;
  const CELL_SIZE = 20.0; // 20m per cell

  function createTestGrids(fillElev = 0, fillSlope = 2.0) {
    const elevationGrid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(fillElev)
    );
    const slopeGrid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(fillSlope)
    );
    return { elevationGrid, slopeGrid };
  }

  it('finds direct path on flat safe terrain', () => {
    const { elevationGrid, slopeGrid } = createTestGrids(0, 1.0);
    const data: CostGridData = {
      gridSize: GRID_SIZE,
      cellSizeMeters: CELL_SIZE,
      elevationGrid,
      slopeGrid,
      maxAllowedSlopeDeg: 20.0,
      routingMode: 'fastest'
    };

    const path = findRouteAStar([1, 1], [1, 5], data);
    expect(path.length).toBe(5);
    expect(path[0]).toEqual([1, 1]);
    expect(path[path.length - 1]).toEqual([1, 5]);
  });

  it('strictly avoids and routes around blocked slopes > 20°', () => {
    const { elevationGrid, slopeGrid } = createTestGrids(0, 1.0);
    // Place a steep wall at x=2, y=0..4 with slope = 28° (> 20° suit mobility limit)
    for (let y = 0; y <= 4; y++) {
      slopeGrid[y][2] = 28.0;
    }

    const data: CostGridData = {
      gridSize: GRID_SIZE,
      cellSizeMeters: CELL_SIZE,
      elevationGrid,
      slopeGrid,
      maxAllowedSlopeDeg: 20.0,
      routingMode: 'fastest'
    };

    const path = findRouteAStar([1, 2], [3, 2], data);
    // Verify no step in path touches the blocked cells (x=2, y<=4)
    path.forEach(([x, y]) => {
      expect(slopeGrid[y][x]).toBeLessThanOrEqual(20.0);
    });
    expect(path[0]).toEqual([1, 2]);
    expect(path[path.length - 1]).toEqual([3, 2]);
  });

  it('returns single point when start equals goal', () => {
    const { elevationGrid, slopeGrid } = createTestGrids();
    const data: CostGridData = {
      gridSize: GRID_SIZE,
      cellSizeMeters: CELL_SIZE,
      elevationGrid,
      slopeGrid,
      maxAllowedSlopeDeg: 20.0,
      routingMode: 'safest'
    };

    const path = findRouteAStar([4, 4], [4, 4], data);
    expect(path).toEqual([[4, 4]]);
  });
});
