import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Layers, X, Sliders, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useHudStore } from '../../stores/useHudStore';
import { useLayerStore } from '../../stores/useLayerStore';
import { marsAudio } from '../../utils/audio';

export const LayerSwipeCompare: React.FC = () => {
  const {
    isCompareMode,
    compareLayerId,
    compareSplitPercent,
    setCompareMode,
    setCompareLayerId,
    setCompareSplitPercent
  } = useHudStore();

  const layers = useLayerStore((s) => s.layers);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const compareLayer = layers.find((l) => l.id === compareLayerId) || layers[3]; // default themis
  const baseLayer = layers.find((l) => l.id === 'optical') || layers[0];

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPct = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(5, Math.min(95, Math.round(rawPct)));
      setCompareSplitPercent(clamped);
    },
    [setCompareSplitPercent]
  );

  const onMouseDown = () => {
    setIsDragging(true);
    marsAudio.playClick(900, 0.03);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handlePointerMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handlePointerMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handlePointerMove]);

  if (!isCompareMode) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden"
    >
      {/* Clipped Comparison Image Layer Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-none"
        style={{
          clipPath: `inset(0 0 0 ${compareSplitPercent}%)`
        }}
      >
        <img
          src={compareLayer.file}
          alt={compareLayer.name}
          className="w-full h-full object-cover opacity-90 filter contrast-125"
        />
        <div className="absolute inset-0 bg-mars-dark/15 mix-blend-overlay" />
      </div>

      {/* Floating Tactical Top Controls for Swipe Mode */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center space-x-2 p-1.5 rounded-2xl bg-mars-void/90 backdrop-blur-md border border-mars-cyan/40 shadow-hud-glow font-mono text-xs">
        <div className="flex items-center space-x-1.5 px-2 text-mars-cyan font-bold tracking-wider text-[11px]">
          <Sliders className="w-3.5 h-3.5 animate-spin" />
          <span>SPECTRAL SWIPE</span>
        </div>

        {/* Secondary Layer Picker */}
        <select
          value={compareLayerId}
          onChange={(e) => {
            setCompareLayerId(e.target.value);
            marsAudio.playClick(1000, 0.04);
          }}
          className="bg-mars-dark/80 border border-mars-border text-mars-text rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-mars-cyan"
        >
          {layers
            .filter((l) => l.id !== 'optical')
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </select>

        {/* Quick Percent Presets */}
        <div className="hidden sm:flex items-center space-x-1 border-l border-mars-border/50 pl-2">
          {[25, 50, 75].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                setCompareSplitPercent(pct);
                marsAudio.playClick(1100, 0.03);
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                compareSplitPercent === pct
                  ? 'bg-mars-cyan text-black font-bold'
                  : 'text-mars-muted hover:text-white'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setCompareMode(false);
            marsAudio.playClick(800, 0.04);
          }}
          className="p-1 rounded-lg hover:bg-white/10 text-mars-muted hover:text-white transition-colors"
          title="Exit Swipe Compare"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Draggable Vertical Divider Line */}
      <div
        className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize will-change-transform flex items-center justify-center"
        style={{
          left: `${compareSplitPercent}%`,
          transform: 'translateX(-50%)'
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
      >
        {/* Glowing Divider Line */}
        <div className="w-[2px] h-full bg-mars-cyan shadow-[0_0_12px_rgba(79,209,197,0.8)]" />

        {/* Center Draggable Tactical Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-14 rounded-full bg-mars-void/95 border-2 border-mars-cyan shadow-hud-glow flex flex-col items-center justify-center space-y-1 hover:scale-105 active:scale-95 transition-transform">
          <div className="flex items-center space-x-0.5 text-mars-cyan">
            <ChevronLeft className="w-3 h-3 -mr-1" />
            <ChevronRight className="w-3 h-3 -ml-1" />
          </div>
          <div className="w-2.5 h-[1.5px] bg-mars-cyan/60" />
        </div>

        {/* Left Side Label (Base Optical) */}
        <div className="absolute top-28 -translate-x-full pr-3 pointer-events-none whitespace-nowrap">
          <div className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-mars-cyan/50 text-[10px] font-mono text-mars-cyan font-bold flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>CTX OPTICAL (6m)</span>
          </div>
        </div>

        {/* Right Side Label (Comparison Layer) */}
        <div className="absolute top-28 translate-x-3 pointer-events-none whitespace-nowrap">
          <div className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-mars-amber/50 text-[10px] font-mono text-mars-amber font-bold flex items-center space-x-1">
            <Layers className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{compareLayer.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
