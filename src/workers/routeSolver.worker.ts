import { findRouteAStar, CostGridData } from '../utils/astar';
import { gridToGeo, marsDistanceMeters } from '../utils/coordinates';
import { calculateMetabolicRates, slopeAdjustedSpeed } from '../utils/marsMath';
import { calculateSurfaceRadiation } from '../utils/radiationModel';
import { DemPayload, RouteLeg, SolvedRoute, Waypoint } from '../types/mission';

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'SOLVE_ROUTE') {
    const { waypoints, demPayload, routingMode, maxAllowedSlopeDeg } = payload as {
      waypoints: Waypoint[];
      demPayload: DemPayload;
      routingMode: 'safest' | 'fastest';
      maxAllowedSlopeDeg: number;
    };

    const costGridData: CostGridData = {
      gridSize: demPayload.metadata.gridSize,
      cellSizeMeters: demPayload.metadata.cellSizeMeters,
      elevationGrid: demPayload.elevationGrid,
      slopeGrid: demPayload.slopeGrid,
      maxAllowedSlopeDeg,
      routingMode,
    };

    const legs: RouteLeg[] = [];
    const allPathIndices: [number, number][] = [];
    const allPathCoords: [number, number][] = [];
    const elevationProfile: SolvedRoute['elevationProfile'] = [];

    let totalDistMeters = 0;
    let totalWalkingTimeSec = 0;
    let totalStayTimeSec = 0;
    let totalO2Liters = 0;
    let totalRadUSv = 0;
    let maxSlopeObserved = 0;
    let slopeSum = 0;
    let totalPoints = 0;

    // Loop through waypoints in order: W0 -> W1 -> W2 -> ... -> Wn -> W0
    const sequence = [...waypoints, waypoints[0]];

    for (let i = 0; i < sequence.length - 1; i++) {
      const fromWp = sequence[i];
      const toWp = sequence[i + 1];

      const pathIndices = findRouteAStar(fromWp.grid, toWp.grid, costGridData);

      let legDist = 0;
      let legTimeSec = 0;
      let legO2 = 0;
      let legRad = 0;
      let legMaxSlope = 0;
      let legSlopeSum = 0;
      let elevGain = 0;
      let elevLoss = 0;

      const pathCoords: [number, number][] = [];
      const elevations: number[] = [];
      const slopes: number[] = [];

      for (let p = 0; p < pathIndices.length; p++) {
        const [px, py] = pathIndices[p];
        const coord = gridToGeo(px, py, demPayload.metadata);
        pathCoords.push(coord);

        const elev = demPayload.elevationGrid[py][px];
        const slope = demPayload.slopeGrid[py][px];
        elevations.push(elev);
        slopes.push(slope);

        if (p > 0) {
          const prevCoord = pathCoords[p - 1];
          const segmentDist = marsDistanceMeters(prevCoord, coord);
          legDist += segmentDist;

          // Speed & metabolic cost on this step
          const speed = slopeAdjustedSpeed(slope);
          const stepTimeSec = segmentDist / Math.max(0.2, speed);
          legTimeSec += stepTimeSec;

          const metabolic = calculateMetabolicRates(slope, speed);
          const stepO2 = (metabolic.o2BurnRateLitersPerMin / 60) * stepTimeSec;
          legO2 += stepO2;

          const rad = calculateSurfaceRadiation(elev, slope);
          const stepRad = (rad.doseRateUSvHr / 3600) * stepTimeSec;
          legRad += stepRad;

          // Elevation delta
          const prevElev = elevations[p - 1];
          const dElev = elev - prevElev;
          if (dElev > 0) elevGain += dElev;
          else elevLoss += Math.abs(dElev);
        }

        legMaxSlope = Math.max(legMaxSlope, slope);
        legSlopeSum += slope;

        // Profile point
        elevationProfile.push({
          distanceM: totalDistMeters + legDist,
          elevationM: elev,
          slopeDeg: slope,
          legIndex: i,
          coord
        });

        if (i === 0 || p > 0) {
          allPathIndices.push([px, py]);
          allPathCoords.push(coord);
        }
      }

      // Add waypoint stay time
      const staySec = fromWp.stayDurationMin * 60;
      totalStayTimeSec += staySec;
      // Resting O2 while stationary
      const restingO2 = (0.82 / 60) * staySec;
      legO2 += restingO2;

      const legMeanSlope = pathIndices.length > 0 ? legSlopeSum / pathIndices.length : 0;

      legs.push({
        fromId: fromWp.id,
        toId: toWp.id,
        fromName: fromWp.name,
        toName: toWp.name,
        distanceMeters: Math.round(legDist),
        timeSeconds: Math.round(legTimeSec),
        maxSlopeDeg: Number(legMaxSlope.toFixed(1)),
        meanSlopeDeg: Number(legMeanSlope.toFixed(1)),
        o2UsedLiters: Number(legO2.toFixed(1)),
        radiationDoseUSv: Number(legRad.toFixed(2)),
        elevationGainMeters: Math.round(elevGain),
        elevationLossMeters: Math.round(elevLoss),
        pathIndices,
        pathCoords,
        elevations,
        slopes
      });

      totalDistMeters += legDist;
      totalWalkingTimeSec += legTimeSec;
      totalO2Liters += legO2;
      totalRadUSv += legRad;
      maxSlopeObserved = Math.max(maxSlopeObserved, legMaxSlope);
      slopeSum += legSlopeSum;
      totalPoints += pathIndices.length;
    }

    const solvedRoute: SolvedRoute = {
      totalDistanceMeters: Math.round(totalDistMeters),
      totalTimeSeconds: Math.round(totalWalkingTimeSec + totalStayTimeSec),
      totalWalkingTimeSeconds: Math.round(totalWalkingTimeSec),
      totalO2UsedLiters: Number(totalO2Liters.toFixed(1)),
      totalRadDoseUSv: Number(totalRadUSv.toFixed(2)),
      maxSlopeDeg: Number(maxSlopeObserved.toFixed(1)),
      meanSlopeDeg: Number((totalPoints > 0 ? slopeSum / totalPoints : 0).toFixed(1)),
      legs,
      allPathIndices,
      allPathCoords,
      elevationProfile
    };

    self.postMessage({ type: 'ROUTE_SOLVED', payload: solvedRoute });
  } else if (type === 'SOLVE_ABORT') {
    const { currentGrid, habGrid, demPayload, maxAllowedSlopeDeg } = payload as {
      currentGrid: [number, number];
      habGrid: [number, number];
      demPayload: DemPayload;
      maxAllowedSlopeDeg: number;
    };

    const costGridData: CostGridData = {
      gridSize: demPayload.metadata.gridSize,
      cellSizeMeters: demPayload.metadata.cellSizeMeters,
      elevationGrid: demPayload.elevationGrid,
      slopeGrid: demPayload.slopeGrid,
      maxAllowedSlopeDeg,
      routingMode: 'safest', // Emergency abort prioritizes non-fall routes
    };

    const pathIndices = findRouteAStar(currentGrid, habGrid, costGridData);
    const pathCoords = pathIndices.map(([px, py]) => gridToGeo(px, py, demPayload.metadata));

    let dist = 0;
    for (let p = 1; p < pathCoords.length; p++) {
      dist += marsDistanceMeters(pathCoords[p - 1], pathCoords[p]);
    }

    self.postMessage({
      type: 'ABORT_SOLVED',
      payload: {
        pathIndices,
        pathCoords,
        distanceMeters: Math.round(dist),
        estimatedMinutes: Math.round((dist / 0.95) / 60)
      }
    });
  }
};
