/**
 * Martian Coordinate Transformations & Scale Utilities
 * Gale Crater Center: ~4.725° S, 137.385° E
 */

import { DemMetadata } from '../types/mission';

export const MARS_RADIUS_METERS = 3389500;
export const MARS_METERS_PER_DEG_LAT = 59160; // Approximate at equator

export function gridToGeo(
  x: number,
  y: number,
  metadata: DemMetadata
): [number, number] {
  const { bounds, gridSize } = metadata;
  const lonSpan = bounds.east - bounds.west;
  const latSpan = bounds.north - bounds.south;

  const lon = bounds.west + (x / gridSize) * lonSpan;
  const lat = bounds.north - (y / gridSize) * latSpan;
  return [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
}

export function geoToGrid(
  lon: number,
  lat: number,
  metadata: DemMetadata
): [number, number] {
  const { bounds, gridSize } = metadata;
  const lonSpan = bounds.east - bounds.west;
  const latSpan = bounds.north - bounds.south;

  const x = Math.round(((lon - bounds.west) / lonSpan) * gridSize);
  const y = Math.round(((bounds.north - lat) / latSpan) * gridSize);

  const clampedX = Math.max(0, Math.min(gridSize - 1, x));
  const clampedY = Math.max(0, Math.min(gridSize - 1, y));
  return [clampedX, clampedY];
}

/**
 * Calculates surface distance between two [lon, lat] coordinates on Mars in meters.
 */
export function marsDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return MARS_RADIUS_METERS * c;
}
