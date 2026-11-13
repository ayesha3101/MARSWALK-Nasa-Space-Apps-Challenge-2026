import React, { useEffect, useRef, memo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMissionStore } from '../../stores/useMissionStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useLayerStore } from '../../stores/useLayerStore';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useHudStore } from '../../stores/useHudStore';
import { geoToGrid } from '../../utils/coordinates';

export const Map2DView: React.FC = memo(() => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const astronautMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hoverMarkerRef = useRef<maplibregl.Marker | null>(null);

  const viewMode = useHudStore((s) => s.viewMode);

  // Granular store selectors to prevent unnecessary re-renders
  const demPayload = useMissionStore((s) => s.demPayload);
  const waypoints = useMissionStore((s) => s.waypoints);
  const updateWaypointPosition = useMissionStore((s) => s.updateWaypointPosition);
  const selectWaypoint = useMissionStore((s) => s.selectWaypoint);

  const solvedRoute = useRouteStore((s) => s.solvedRoute);
  const recalculateRoute = useRouteStore((s) => s.recalculateRoute);
  const abortRoute = useRouteStore((s) => s.abortRoute);
  const isAbortActive = useRouteStore((s) => s.isAbortActive);

  const layers = useLayerStore((s) => s.layers);

  // 1. Initialize MapLibre Map once
  useEffect(() => {
    if (!mapContainer.current || !demPayload || mapRef.current) return;

    const { bounds, center } = demPayload.metadata;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#07090D' }
          }
        ]
      },
      center: [center[1], center[0]],
      zoom: 12.8,
      minZoom: 10,
      maxZoom: 16.5,
      maxBounds: [
        [bounds.west - 0.08, bounds.south - 0.08],
        [bounds.east + 0.08, bounds.north + 0.08]
      ],
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      const imgCoordinates: [[number, number], [number, number], [number, number], [number, number]] = [
        [bounds.west, bounds.north],
        [bounds.east, bounds.north],
        [bounds.east, bounds.south],
        [bounds.west, bounds.south]
      ];

      // Add raster image sources and layers mounted permanently
      layers.forEach((layer) => {
        const sourceId = `src-${layer.id}`;
        const layerId = `layer-${layer.id}`;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'image',
            url: layer.file,
            coordinates: imgCoordinates
          });

          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': layer.visible ? layer.opacity : 0,
              'raster-fade-duration': 250
            }
          });
        }
      });

      // Curiosity Historical Traverse Layer (Reference Track)
      map.addSource('curiosity-track-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [137.350, -4.690],
              [137.358, -4.700],
              [137.365, -4.712],
              [137.376, -4.720],
              [137.385, -4.725]
            ]
          }
        }
      });

      map.addLayer({
        id: 'curiosity-track-line',
        type: 'line',
        source: 'curiosity-track-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#F6B042',
          'line-width': 1.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.7
        }
      });

      // Primary Route Sources (Double-buffered for cross-fading)
      map.addSource('route-source-active', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Soft glow under-layer
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-source-active',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#4FD1C5',
          'line-width': 8,
          'line-opacity': 0.35,
          'line-blur': 4
        }
      });

      // Sharp dashed tactical vector line
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source-active',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#4FD1C5',
          'line-width': 3,
          'line-dasharray': [2, 1]
        }
      });

      // Emergency Abort Source and Layer
      map.addSource('abort-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'abort-line',
        type: 'line',
        source: 'abort-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#EF4444',
          'line-width': 4,
          'line-dasharray': [1, 1],
          'line-opacity': 0.9
        }
      });

      // Initial route solve
      recalculateRoute();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [demPayload]);

  // Resize MapLibre when switching back to 2D view
  useEffect(() => {
    if (viewMode === '2D' && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.resize();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // 2. Direct Store Subscriptions (Zero React re-render during playback)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Create Astronaut marker if not exists
    if (!astronautMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center pointer-events-none will-change-transform';
      el.innerHTML = `
        <div class="w-5 h-5 rounded-full bg-mars-cyan border-2 border-white shadow-hud-glow flex items-center justify-center animate-pulse">
          <div class="w-2 h-2 rounded-full bg-black"></div>
        </div>
        <div class="absolute -top-6 px-1.5 py-0.5 rounded bg-mars-card/90 border border-mars-cyan text-[9px] font-mono font-bold text-mars-cyan whitespace-nowrap">
          EV-1 THORNE
        </div>
      `;

      astronautMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(useTimelineStore.getState().currentCoord)
        .addTo(map);
    }

    // Subscribe to timeline position changes outside React render cycle
    const unsubscribeTimeline = useTimelineStore.subscribe(
      (state) => {
        if (astronautMarkerRef.current && state.currentCoord) {
          astronautMarkerRef.current.setLngLat(state.currentCoord);
        }
      }
    );

    // Subscribe to hovered elevation profile point outside React render cycle
    const unsubscribeRouteHover = useRouteStore.subscribe(
      (state) => {
        const idx = state.hoveredProfileIndex;
        const profile = state.solvedRoute?.elevationProfile;
        if (idx !== null && profile && profile[idx]) {
          const pt = profile[idx];
          if (!hoverMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'pointer-events-none will-change-transform';
            el.innerHTML = `
              <div class="w-4 h-4 rounded-full border-2 border-mars-amber bg-mars-amber/40 animate-ping"></div>
            `;
            hoverMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat(pt.coord)
              .addTo(map);
          } else {
            hoverMarkerRef.current.setLngLat(pt.coord);
          }
        } else if (hoverMarkerRef.current) {
          hoverMarkerRef.current.remove();
          hoverMarkerRef.current = null;
        }
      }
    );

    return () => {
      unsubscribeTimeline();
      unsubscribeRouteHover();
    };
  }, []);

  // 3. Smooth Raster Opacity Adjustments (Using setPaintProperty, never re-creating sources)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    layers.forEach((layer) => {
      const layerId = `layer-${layer.id}`;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(
          layerId,
          'raster-opacity',
          layer.visible ? layer.opacity : 0
        );
      }
    });
  }, [layers]);

  // 4. Update Solved Route GeoJSON without blank frames
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource('route-source-active')) return;

    const source = map.getSource('route-source-active') as maplibregl.GeoJSONSource;

    if (solvedRoute && solvedRoute.allPathCoords.length > 1) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: solvedRoute.allPathCoords
        }
      });
    } else {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [solvedRoute]);

  // 5. Update Emergency Abort GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource('abort-source')) return;

    const source = map.getSource('abort-source') as maplibregl.GeoJSONSource;

    if (isAbortActive && abortRoute && abortRoute.pathCoords.length > 1) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: abortRoute.pathCoords
        }
      });
    } else {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [isAbortActive, abortRoute]);

  // 6. Manage Draggable Waypoint Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !demPayload) return;

    // Clear old markers cleanly
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    waypoints.forEach((wp, idx) => {
      const el = document.createElement('div');
      el.className = 'group cursor-grab active:cursor-grabbing will-change-transform';

      const isHab = wp.role === 'START_END';
      const isRover = wp.role === 'ROVER_RENDEZVOUS';
      const color = isHab ? '#E2572B' : isRover ? '#F6B042' : '#4FD1C5';
      const label = isHab ? 'HAB' : `S${idx}`;

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div style="background-color: ${color};" class="w-7 h-7 rounded-full border-2 border-white/80 shadow-lg flex items-center justify-center font-mono font-bold text-[10px] text-black transition-transform group-hover:scale-110">
            ${label}
          </div>
          <div style="background-color: ${color};" class="w-1.5 h-1.5 rounded-full mt-0.5"></div>
          <div class="px-1.5 py-0.5 mt-1 rounded bg-black/85 border border-white/20 text-[9px] font-mono text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            ${wp.name}
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat(wp.coordinates)
        .addTo(map);

      el.addEventListener('click', () => {
        selectWaypoint(wp.id);
      });

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        const newCoords: [number, number] = [
          Number(lngLat.lng.toFixed(6)),
          Number(lngLat.lat.toFixed(6))
        ];
        const newGrid = geoToGrid(newCoords[0], newCoords[1], demPayload.metadata);
        updateWaypointPosition(wp.id, newGrid, newCoords);
        recalculateRoute();
      });

      markersRef.current.push(marker);
    });
  }, [waypoints, demPayload]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-mars-void">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Static Scanline Texture (No dynamic GPU redraws) */}
      <div className="scanlines absolute inset-0 pointer-events-none z-10 opacity-30" />
      <div className="crt-vignette absolute inset-0 pointer-events-none z-10 opacity-60" />

      {/* Legend Badge in Top Left */}
      <div className="absolute top-16 left-4 z-20 pointer-events-none hidden sm:block">
        <div className="p-2 rounded bg-mars-void/80 backdrop-blur-sm border border-mars-border text-[10px] font-mono text-mars-muted space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-mars-cyan animate-pulse" />
            <span className="text-mars-cyan font-bold">2D TACTICAL QUAD</span>
          </div>
          <div>DATUM: Gale Mt. Sharp Boxwork</div>
          <div className="flex items-center space-x-1.5 text-mars-amber">
            <span className="w-3 h-0.5 bg-mars-amber border-b border-dashed border-white inline-block"></span>
            <span>Curiosity Traverse Track (Ref)</span>
          </div>
        </div>
      </div>
    </div>
  );
});

Map2DView.displayName = 'Map2DView';
