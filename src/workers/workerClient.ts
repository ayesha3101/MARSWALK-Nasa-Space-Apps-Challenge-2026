import { DemPayload, SolvedRoute, Waypoint } from '../types/mission';

let workerInstance: Worker | null = null;
let pendingRouteResolve: ((route: SolvedRoute) => void) | null = null;
let pendingAbortResolve: ((abortData: { pathIndices: [number, number][]; pathCoords: [number, number][]; distanceMeters: number; estimatedMinutes: number }) => void) | null = null;

export function getRouteWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./routeSolver.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerInstance.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'ROUTE_SOLVED' && pendingRouteResolve) {
        pendingRouteResolve(payload);
        pendingRouteResolve = null;
      } else if (type === 'ABORT_SOLVED' && pendingAbortResolve) {
        pendingAbortResolve(payload);
        pendingAbortResolve = null;
      }
    };
  }
  return workerInstance;
}

export function requestRouteSolve(
  waypoints: Waypoint[],
  demPayload: DemPayload,
  routingMode: 'safest' | 'fastest',
  maxAllowedSlopeDeg: number
): Promise<SolvedRoute> {
  const worker = getRouteWorker();
  return new Promise((resolve) => {
    pendingRouteResolve = resolve;
    worker.postMessage({
      type: 'SOLVE_ROUTE',
      payload: { waypoints, demPayload, routingMode, maxAllowedSlopeDeg }
    });
  });
}

export function requestAbortSolve(
  currentGrid: [number, number],
  habGrid: [number, number],
  demPayload: DemPayload,
  maxAllowedSlopeDeg: number
): Promise<{ pathIndices: [number, number][]; pathCoords: [number, number][]; distanceMeters: number; estimatedMinutes: number }> {
  const worker = getRouteWorker();
  return new Promise((resolve) => {
    pendingAbortResolve = resolve;
    worker.postMessage({
      type: 'SOLVE_ABORT',
      payload: { currentGrid, habGrid, demPayload, maxAllowedSlopeDeg }
    });
  });
}
