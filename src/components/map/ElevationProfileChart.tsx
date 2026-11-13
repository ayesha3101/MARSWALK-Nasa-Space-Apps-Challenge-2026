import React, { useRef, useMemo, useEffect, memo } from 'react';
import { ChevronUp, ChevronDown, Mountain, TrendingUp } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useHudStore } from '../../stores/useHudStore';

export const ElevationProfileChart: React.FC = memo(() => {
  const solvedRoute = useRouteStore((s) => s.solvedRoute);
  const hoveredProfileIndex = useRouteStore((s) => s.hoveredProfileIndex);
  const setHoveredProfileIndex = useRouteStore((s) => s.setHoveredProfileIndex);

  const isElevationExpanded = useHudStore((s) => s.isElevationExpanded);
  const toggleElevation = useHudStore((s) => s.toggleElevation);

  const svgRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement>(null);

  const profile = solvedRoute?.elevationProfile || [];

  const { minElev, maxElev, totalDist, pointsString, gradientStops } = useMemo(() => {
    if (profile.length === 0) {
      return { minElev: -4460, maxElev: -4310, totalDist: 5000, pointsString: '', gradientStops: [] };
    }

    let min = Infinity;
    let max = -Infinity;
    profile.forEach((p) => {
      if (p.elevationM < min) min = p.elevationM;
      if (p.elevationM > max) max = p.elevationM;
    });

    min = Math.floor(min - 5);
    max = Math.ceil(max + 10);
    const dist = profile[profile.length - 1].distanceM || 1;

    const w = 1000;
    const h = 100;
    const pts: string[] = [];

    pts.push(`0,${h}`);

    const stops: { offset: string; color: string }[] = [];

    profile.forEach((p, i) => {
      const x = (p.distanceM / dist) * w;
      const y = h - ((p.elevationM - min) / (max - min)) * (h - 25) - 10;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);

      if (i % 8 === 0 || i === profile.length - 1) {
        let color = '#22C55E';
        if (p.slopeDeg > 15) color = '#EF4444';
        else if (p.slopeDeg > 11) color = '#F97316';
        else if (p.slopeDeg > 7) color = '#EAB308';
        stops.push({ offset: `${((p.distanceM / dist) * 100).toFixed(1)}%`, color });
      }
    });

    pts.push(`${w},${h}`);

    return {
      minElev: min,
      maxElev: max,
      totalDist: dist,
      pointsString: pts.join(' '),
      gradientStops: stops
    };
  }, [profile]);

  // Subscribe directly to timeline time without triggering React re-renders
  useEffect(() => {
    const unsubscribe = useTimelineStore.subscribe((state) => {
      if (!needleRef.current || !solvedRoute || solvedRoute.totalTimeSeconds <= 0) return;
      const ratio = Math.max(0, Math.min(1, state.currentTimeSec / solvedRoute.totalTimeSeconds));
      const activeX = ratio * 1000;
      needleRef.current.setAttribute('transform', `translate(${activeX}, 0)`);
    });

    return () => unsubscribe();
  }, [solvedRoute]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || profile.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetIdx = Math.min(profile.length - 1, Math.floor(ratio * profile.length));
    setHoveredProfileIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoveredProfileIndex(null);
  };

  const hoveredPoint = hoveredProfileIndex !== null ? profile[hoveredProfileIndex] : null;

  return (
    <div className="w-full flex flex-col items-center pointer-events-auto">
      {/* Sleek Minimalist Elevation Toggle Pill */}
      <button
        onClick={toggleElevation}
        className="mb-0.5 px-3 py-1 rounded-t-xl bg-mars-dark/95 backdrop-blur-hud border border-b-0 border-mars-border text-[10px] font-mono text-mars-muted hover:text-mars-cyan hover:border-mars-cyan/40 transition-all flex items-center space-x-2 shadow-lg"
        title={isElevationExpanded ? 'Minimize Elevation Profile' : 'Expand Elevation Profile'}
      >
        <Mountain className="w-3 h-3 text-mars-cyan" />
        <span className="font-heading font-bold uppercase tracking-wider text-mars-text">
          {isElevationExpanded ? 'TOPOGRAPHY PROFILE' : 'ELEVATION PROFILE'}
        </span>
        {solvedRoute && (
          <span className="text-mars-muted hidden sm:inline">
            // {Math.round(minElev)}m to {Math.round(maxElev)}m • MAX {solvedRoute.maxSlopeDeg}°
          </span>
        )}
        {isElevationExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expandable Chart Canvas */}
      {isElevationExpanded && (
        <div className="w-full bg-mars-dark/95 backdrop-blur-hud border-t border-mars-border px-3 py-2 font-mono select-none animate-fadeIn transition-all">
          <div className="max-w-7xl mx-auto">
            {/* Header Telemetry row */}
            <div className="flex items-center justify-between text-[10px] text-mars-muted mb-1">
              <div className="flex items-center space-x-3">
                <span className="text-mars-cyan font-bold">
                  {Math.round(totalDist)}m TRANSECT
                </span>
                <span className="hidden sm:inline text-mars-dim">|</span>
                <span className="hidden sm:inline">
                  Range: {Math.round(minElev)}m → {Math.round(maxElev)}m
                </span>
              </div>

              {hoveredPoint ? (
                <div className="flex items-center space-x-3 text-mars-text">
                  <span>Dist: <strong className="text-mars-cyan">{Math.round(hoveredPoint.distanceM)}m</strong></span>
                  <span>Elev: <strong className="text-white">{Math.round(hoveredPoint.elevationM)}m</strong></span>
                  <span>Slope: <strong className={hoveredPoint.slopeDeg > 14 ? 'text-mars-red' : 'text-mars-amber'}>{hoveredPoint.slopeDeg.toFixed(1)}°</strong></span>
                </div>
              ) : (
                <span className="text-[9px] text-mars-muted italic">Hover profile to sync crosshair</span>
              )}
            </div>

            {/* SVG Profile Chart */}
            <div className="relative w-full h-20 sm:h-24 bg-mars-void/60 rounded-lg border border-mars-border/40 overflow-hidden">
              <svg
                ref={svgRef}
                viewBox="0 0 1000 100"
                preserveAspectRatio="none"
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="slopeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    {gradientStops.map((s, idx) => (
                      <stop key={idx} offset={s.offset} stopColor={s.color} stopOpacity={0.7} />
                    ))}
                  </linearGradient>

                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4FD1C5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#07090D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="0" y1="25" x2="1000" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <line x1="0" y1="75" x2="1000" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                {/* Profile Area */}
                {pointsString && (
                  <>
                    <polygon points={pointsString} fill="url(#areaGradient)" />
                    <polyline
                      points={pointsString.split(' ').slice(1, -1).join(' ')}
                      fill="none"
                      stroke="url(#slopeGradient)"
                      strokeWidth="2.5"
                    />
                  </>
                )}

                {/* Current Timeline Needle (driven by rAF outside React) */}
                <g ref={needleRef} transform="translate(0, 0)">
                  <line x1="0" y1="0" x2="0" y2="100" stroke="#E2572B" strokeWidth="2" />
                  <polygon points="-4,0 4,0 0,6" fill="#E2572B" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ElevationProfileChart.displayName = 'ElevationProfileChart';
