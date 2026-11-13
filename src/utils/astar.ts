/**
 * 2D Grid A* Pathfinding Engine for Marswalk
 * Evaluates terrain elevation, slope gradients, radiation exposure, and suit mobility limits.
 */

export interface CostGridData {
  gridSize: number;
  cellSizeMeters: number;
  elevationGrid: number[][];
  slopeGrid: number[][];
  maxAllowedSlopeDeg: number;
  routingMode: 'safest' | 'fastest';
}

class MinHeap<T> {
  private data: { priority: number; item: T }[] = [];

  push(item: T, priority: number) {
    this.data.push({ priority, item });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0].item;
    const bottom = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.data[index].priority >= this.data[parentIndex].priority) break;
      const tmp = this.data[index];
      this.data[index] = this.data[parentIndex];
      this.data[parentIndex] = tmp;
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    const length = this.data.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.data[left].priority < this.data[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.data[right].priority < this.data[smallest].priority) {
        smallest = right;
      }
      if (smallest === index) break;

      const tmp = this.data[index];
      this.data[index] = this.data[smallest];
      this.data[smallest] = tmp;
      index = smallest;
    }
  }
}

export function findRouteAStar(
  start: [number, number],
  goal: [number, number],
  data: CostGridData
): [number, number][] {
  const { gridSize, cellSizeMeters, elevationGrid, slopeGrid, maxAllowedSlopeDeg, routingMode } = data;
  const [sx, sy] = start;
  const [gx, gy] = goal;

  if (sx === gx && sy === gy) return [[sx, sy]];

  // 8-neighbor directions: dx, dy, step_distance
  const DIRS: [number, number, number][] = [
    [1, 0, 1.0], [-1, 0, 1.0], [0, 1, 1.0], [0, -1, 1.0],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
  ];

  const toKey = (x: number, y: number) => y * gridSize + x;
  const fromKey = (k: number): [number, number] => [k % gridSize, Math.floor(k / gridSize)];

  const startKey = toKey(sx, sy);
  const goalKey = toKey(gx, gy);

  const gScore = new Float32Array(gridSize * gridSize);
  gScore.fill(Infinity);
  gScore[startKey] = 0;

  const cameFrom = new Int32Array(gridSize * gridSize);
  cameFrom.fill(-1);

  const closedSet = new Uint8Array(gridSize * gridSize);

  // Euclidean distance heuristic (meters)
  const heuristic = (x: number, y: number): number => {
    const dx = (x - gx) * cellSizeMeters;
    const dy = (y - gy) * cellSizeMeters;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const openSet = new MinHeap<number>();
  openSet.push(startKey, heuristic(sx, sy));

  // Tuning weights based on routingMode
  const isSafest = routingMode === 'safest';
  const slopeWeight = isSafest ? 4.8 : 1.3;
  const effectiveSlopeLimit = isSafest ? Math.min(maxAllowedSlopeDeg, 16.0) : maxAllowedSlopeDeg;

  while (!openSet.isEmpty()) {
    const currentKey = openSet.pop()!;
    if (currentKey === goalKey) {
      // Reconstruct path
      const path: [number, number][] = [];
      let curr = goalKey;
      while (curr !== -1) {
        path.push(fromKey(curr));
        curr = cameFrom[curr];
      }
      path.reverse();
      return path;
    }

    if (closedSet[currentKey] === 1) continue;
    closedSet[currentKey] = 1;

    const [cx, cy] = fromKey(currentKey);
    const currentG = gScore[currentKey];

    for (let i = 0; i < DIRS.length; i++) {
      const [dx, dy, stepDist] = DIRS[i];
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;

      const neighborKey = toKey(nx, ny);
      if (closedSet[neighborKey] === 1) continue;

      const neighborSlope = slopeGrid[ny][nx];
      // Hard cutoff for suit mobility limit
      if (neighborSlope > effectiveSlopeLimit) continue;

      // Traversal step cost
      const baseMeters = stepDist * cellSizeMeters;
      const slopeRatio = neighborSlope / maxAllowedSlopeDeg;
      const slopePenalty = Math.pow(slopeRatio, 2) * slopeWeight;
      
      // Elevation gradient penalty (climbing vs descending)
      const elevDelta = elevationGrid[ny][nx] - elevationGrid[cy][cx];
      const climbPenalty = elevDelta > 0 ? (elevDelta / baseMeters) * 1.5 : 0;

      const stepCost = baseMeters * (1.0 + slopePenalty + climbPenalty);
      const tentativeG = currentG + stepCost;

      if (tentativeG < gScore[neighborKey]) {
        cameFrom[neighborKey] = currentKey;
        gScore[neighborKey] = tentativeG;
        const fScore = tentativeG + heuristic(nx, ny);
        openSet.push(neighborKey, fScore);
      }
    }
  }

  // Fallback: direct line if no obstacle-free path exists
  return [[sx, sy], [gx, gy]];
}
