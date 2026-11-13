import React, { useRef, useMemo, useEffect, memo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../../stores/useMissionStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useTimelineStore } from '../../stores/useTimelineStore';

const TerrainMesh: React.FC = memo(() => {
  const heightmapTexture = useLoader(THREE.TextureLoader, '/data/dem_heightmap.png');
  const opticalTexture = useLoader(THREE.TextureLoader, '/data/layers/hirise_optical.jpg');

  opticalTexture.wrapS = THREE.ClampToEdgeWrapping;
  opticalTexture.wrapT = THREE.ClampToEdgeWrapping;
  opticalTexture.generateMipmaps = true;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[100, 100, 192, 192]} />
      <meshStandardMaterial
        map={opticalTexture}
        displacementMap={heightmapTexture}
        displacementScale={14}
        roughness={0.85}
        metalness={0.15}
      />
    </mesh>
  );
});

TerrainMesh.displayName = 'TerrainMesh';

const DrapedRoute3D: React.FC = memo(() => {
  const solvedRoute = useRouteStore((s) => s.solvedRoute);
  const demPayload = useMissionStore((s) => s.demPayload);

  const linePoints = useMemo(() => {
    if (!solvedRoute || !demPayload || solvedRoute.allPathIndices.length === 0) return [];

    const pts: THREE.Vector3[] = [];
    const { elevationMin, elevationMax } = demPayload.metadata;
    const elevSpan = elevationMax - elevationMin || 1;

    solvedRoute.allPathIndices.forEach(([gx, gy]) => {
      const x = (gx / 255 - 0.5) * 100;
      const z = (gy / 255 - 0.5) * 100;
      const elev = demPayload.elevationGrid[gy][gx];
      const normY = ((elev - elevationMin) / elevSpan) * 14 + 0.55;

      pts.push(new THREE.Vector3(x, normY, z));
    });

    return pts;
  }, [solvedRoute, demPayload]);

  const lineGeometry = useMemo(() => {
    if (linePoints.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [linePoints]);

  if (!lineGeometry) return null;

  return (
    <primitive object={new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0x4FD1C5, linewidth: 3 })
    )} />
  );
});

DrapedRoute3D.displayName = 'DrapedRoute3D';

const WaypointMarkers3D: React.FC = memo(() => {
  const waypoints = useMissionStore((s) => s.waypoints);
  const demPayload = useMissionStore((s) => s.demPayload);
  const selectWaypoint = useMissionStore((s) => s.selectWaypoint);

  if (!demPayload) return null;
  const { elevationMin, elevationMax } = demPayload.metadata;
  const elevSpan = elevationMax - elevationMin || 1;

  return (
    <>
      {waypoints.map((wp, idx) => {
        const [gx, gy] = wp.grid;
        const x = (gx / 255 - 0.5) * 100;
        const z = (gy / 255 - 0.5) * 100;
        const elev = demPayload.elevationGrid[gy][gx];
        const y = ((elev - elevationMin) / elevSpan) * 14 + 2.5;

        const isHab = wp.role === 'START_END';
        const isRover = wp.role === 'ROVER_RENDEZVOUS';
        const color = isHab ? '#E2572B' : isRover ? '#F6B042' : '#4FD1C5';
        const label = isHab ? 'HAB' : `S${idx}`;

        return (
          <group key={wp.id} position={[x, y, z]}>
            <mesh position={[0, -1.2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 2.4, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>

            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.85, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
            </mesh>

            <Html distanceFactor={45} position={[0, 1.2, 0]} center>
              <div 
                className="px-2 py-0.5 rounded bg-black/85 border border-white/20 text-[10px] font-mono text-white whitespace-nowrap cursor-pointer hover:border-mars-cyan transition-all"
                onClick={() => selectWaypoint(wp.id)}
              >
                <span className="font-bold" style={{ color }}>{label}: </span>
                {wp.name}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
});

WaypointMarkers3D.displayName = 'WaypointMarkers3D';

const Astronaut3D: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  const demPayload = useMissionStore.getState().demPayload;

  // Direct rAF update in Three.js animation frame
  useFrame(() => {
    if (!meshRef.current || !demPayload) return;
    const currentGrid = useTimelineStore.getState().currentGrid;
    const [gx, gy] = currentGrid;
    const x = (gx / 255 - 0.5) * 100;
    const z = (gy / 255 - 0.5) * 100;
    const { elevationMin, elevationMax } = demPayload.metadata;
    const elev = demPayload.elevationGrid[gy][gx];
    const y = ((elev - elevationMin) / (elevationMax - elevationMin || 1)) * 14 + 1.2;

    meshRef.current.position.set(x, y, z);
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#4FD1C5" emissive="#4FD1C5" emissiveIntensity={0.8} />
      </mesh>
      <Html distanceFactor={35} position={[0, 1.4, 0]} center>
        <div className="px-1.5 py-0.2 rounded bg-mars-card/90 border border-mars-cyan text-[9px] font-mono font-bold text-mars-cyan whitespace-nowrap animate-pulse">
          EV-1
        </div>
      </Html>
    </group>
  );
};

import { useHudStore } from '../../stores/useHudStore';

export const Terrain3DView: React.FC = memo(() => {
  const controlsRef = useRef<any>(null);
  const viewMode = useHudStore((s) => s.viewMode);

  return (
    <div className="relative w-full h-full bg-mars-void overflow-hidden">
      <Canvas
        camera={{ position: [0, 48, 65], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        frameloop={viewMode === '3D' ? 'always' : 'never'}
        dpr={[1, 1.5]}
        shadows
      >
        <color attach="background" args={['#07090D']} />
        <fog attach="fog" args={['#07090D', 65, 160]} />

        <ambientLight intensity={0.45} color="#FCE7D0" />
        <directionalLight
          position={[-60, 45, -60]}
          intensity={1.8}
          color="#FFE8D6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <TerrainMesh />
        <DrapedRoute3D />
        <WaypointMarkers3D />
        <Astronaut3D />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={10}
          maxDistance={120}
        />
      </Canvas>

      <div className="absolute top-16 left-4 z-20 pointer-events-none hidden sm:block">
        <div className="p-2.5 rounded bg-mars-void/80 backdrop-blur-sm border border-mars-border text-[10px] font-mono text-mars-muted space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-mars-rust animate-pulse" />
            <span className="text-mars-rust font-bold">3D TERRAIN FLYOVER</span>
          </div>
          <div>Left Click + Drag: Orbit / Tilt</div>
          <div>Right Click + Drag: Pan Camera</div>
          <div>Scroll Wheel: Zoom Altitude</div>
        </div>
      </div>
    </div>
  );
});

Terrain3DView.displayName = 'Terrain3DView';
