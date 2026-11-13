import React, { useRef, useEffect, useState, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/** Procedural Mars sphere that zooms into Gale Crater */
const MarsSphere: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  // Gale Crater coordinates on the sphere (lon=137.4°E, lat=-4.7°S)
  const galeLon = (137.4 * Math.PI) / 180;
  const galeLat = (-4.7 * Math.PI) / 180;

  // Target camera position (zoomed in near Gale)
  const targetPos = new THREE.Vector3(
    2.2 * Math.cos(galeLat) * Math.cos(galeLon),
    2.2 * Math.sin(galeLat),
    2.2 * Math.cos(galeLat) * Math.sin(galeLon)
  );

  useFrame((_, delta) => {
    if (completedRef.current) return;

    progressRef.current += delta * 0.18; // ~5.5 second intro
    const t = Math.min(1, progressRef.current);

    // Eased progress (ease-in-out cubic)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Slow rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.06 * (1 - eased * 0.9);
    }

    // Camera zoom: start at z=8 → end near surface
    const startPos = new THREE.Vector3(0, 1, 8);
    camera.position.lerpVectors(startPos, targetPos, eased);
    camera.lookAt(0, 0, 0);

    if (t >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <>
      <Stars radius={100} depth={60} count={3000} factor={3} saturation={0} fade speed={0.5} />

      {/* Ambient Mars atmosphere glow */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 4]} intensity={1.2} color="#FFF5E6" />
      <pointLight position={[-3, -2, -3]} intensity={0.3} color="#E2572B" />

      {/* Mars sphere */}
      <mesh ref={meshRef} rotation={[0, -galeLon + 0.5, galeLat * 0.3]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#C1603D"
          roughness={0.92}
          metalness={0.08}
          emissive="#3D1008"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Atmospheric haze ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.01, 2.15, 64]} />
        <meshBasicMaterial color="#E2572B" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Gale Crater marker pulse */}
      <GalePulse lat={galeLat} lon={galeLon} />
    </>
  );
};

/** Pulsing beacon at Gale Crater coordinates */
const GalePulse: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const ref = useRef<THREE.Mesh>(null!);
  const r = 2.02;
  const x = r * Math.cos(lat) * Math.cos(lon);
  const y = r * Math.sin(lat);
  const z = r * Math.cos(lat) * Math.sin(lon);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 0.02 + 0.015 * Math.sin(clock.elapsedTime * 3);
    ref.current.scale.setScalar(s * 50);
  });

  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshBasicMaterial color="#4FD1C5" transparent opacity={0.9} />
    </mesh>
  );
};

/** Full-screen cinematic intro overlay */
export const MarsGlobeIntro: React.FC<{ onDismiss: () => void }> = memo(({ onDismiss }) => {
  const [phase, setPhase] = useState<'globe' | 'text' | 'out'>('globe');
  const [textOpacity, setTextOpacity] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGlobeComplete = () => {
    setPhase('text');
    // Stagger text fade-in
    setTimeout(() => setTextOpacity(1), 200);
    // Auto-dismiss after showing text
    timerRef.current = setTimeout(() => {
      setPhase('out');
      setTimeout(onDismiss, 800);
    }, 2800);
  };

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('out');
    setTimeout(onDismiss, 400);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[60] bg-black transition-opacity duration-700 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 1, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <MarsSphere onComplete={handleGlobeComplete} />
      </Canvas>

      {/* HUD Text Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity, transition: 'opacity 0.8s ease-out' }}
      >
        {/* Thin top line */}
        <div className="absolute top-6 left-0 right-0 flex justify-center">
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-mars-cyan/50 to-transparent" />
        </div>

        {/* Main title cluster */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-[1px] w-12 bg-mars-rust/60" />
            <span className="text-[10px] font-mono text-mars-rust tracking-[0.4em] uppercase">
              NASA Space Apps 2026
            </span>
            <div className="h-[1px] w-12 bg-mars-rust/60" />
          </div>

          <h1 className="font-heading font-bold text-5xl sm:text-7xl tracking-[0.15em] text-white">
            MARSWALK
          </h1>

          <div className="flex items-center justify-center space-x-4 text-xs font-mono text-mars-cyan/80 tracking-widest">
            <span>SOL 001</span>
            <span className="text-mars-muted">•</span>
            <span>EVA-1</span>
            <span className="text-mars-muted">•</span>
            <span>GALE CRATER</span>
          </div>

          <p className="text-xs font-mono text-mars-muted/70 tracking-wider max-w-md mx-auto mt-2">
            EXTRAVEHICULAR ACTIVITY PLANNING & TELEMETRY SYSTEM
          </p>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-12 left-0 right-0 text-center">
          <p className="text-[10px] font-mono text-mars-muted/50 tracking-[0.3em]">
            LOWER MOUNT SHARP // BOXWORK RIDGE EXPEDITION
          </p>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-6 right-6 z-10 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-mars-muted hover:text-white hover:border-white/30 transition-all pointer-events-auto"
      >
        SKIP INTRO →
      </button>

      {/* Scanline overlay for cinematic feel */}
      <div className="scanlines absolute inset-0 opacity-20 pointer-events-none" />
    </div>
  );
});

MarsGlobeIntro.displayName = 'MarsGlobeIntro';
