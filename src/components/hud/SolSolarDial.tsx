import React, { useMemo } from 'react';
import { Sun, Compass, Zap, Moon } from 'lucide-react';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { calculateGaleSolar } from '../../utils/solar';

export const SolSolarDial: React.FC = () => {
  const currentTimeSec = useTimelineStore((s) => s.currentTimeSec);

  const solar = useMemo(() => {
    return calculateGaleSolar(currentTimeSec / 60);
  }, [currentTimeSec]);

  // Map solar elevation (-10° to 90°) to arc angle (0 to 180 deg)
  const angleDeg = Math.max(0, Math.min(180, (solar.solarElevationDeg / 90) * 180));
  // Needle position on SVG semi-circle
  const cx = 36;
  const cy = 36;
  const r = 26;
  // Radian from horizontal left (180 deg) to right (0 deg)
  const rad = Math.PI - (solar.solarElevationDeg / 90) * Math.PI;
  const sunX = cx + r * Math.cos(rad);
  const sunY = cy - r * Math.sin(rad);

  return (
    <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-mars-void/80 backdrop-blur-md border border-mars-border text-xs font-mono select-none">
      {/* Mini SVG Solar Trajectory Arc */}
      <div className="relative w-10 h-7 flex items-end justify-center overflow-hidden">
        <svg className="w-10 h-10 -mb-3" viewBox="0 0 72 72">
          {/* Horizon ground line */}
          <line x1="6" y1="36" x2="66" y2="36" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="2,2" />
          {/* Solar dome path arc */}
          <path
            d="M 10,36 A 26,26 0 0,1 62,36"
            fill="none"
            stroke="#1F2937"
            strokeWidth="3"
          />
          <path
            d="M 10,36 A 26,26 0 0,1 62,36"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="4,2"
            opacity="0.6"
          />
          {/* Glowing Sun Position */}
          {solar.solarElevationDeg > 0 ? (
            <circle
              cx={sunX}
              cy={sunY}
              r="3.5"
              fill="#F6B042"
              className="filter drop-shadow-[0_0_4px_#F6B042]"
            />
          ) : (
            <circle
              cx="10"
              cy="36"
              r="2.5"
              fill="#4FD1C5"
              opacity="0.5"
            />
          )}
        </svg>
      </div>

      {/* Solar Ephemeris Telemetry Numbers */}
      <div className="flex flex-col text-[9px] leading-tight font-mono">
        <div className="flex items-center space-x-1.5">
          <Sun className="w-3 h-3 text-mars-amber shrink-0 animate-pulse" />
          <span className="font-bold text-mars-amber">{solar.lmstTimeStr}</span>
        </div>
        <div className="flex items-center space-x-2 text-mars-muted text-[8.5px]">
          <span>ELEV: <b className="text-mars-text">{solar.solarElevationDeg}°</b></span>
          <span>AZ: <b className="text-mars-text">{solar.solarAzimuthDeg}°</b></span>
          <span className="hidden sm:inline">FLUX: <b className="text-mars-cyan">{solar.surfaceIrradianceWm2} W/m²</b></span>
        </div>
      </div>
    </div>
  );
};
