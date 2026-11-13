import React, { memo } from 'react';

interface ArcGaugeProps {
  /** 0-100 */
  value: number;
  label: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  /** Tailwind color class for the arc fill */
  color?: string;
  /** Hex color for the SVG stroke */
  strokeColor?: string;
  /** Warning threshold (0-100), below which the gauge turns red */
  warnBelow?: number;
  /** Whether to pulse when in warning state */
  warnPulse?: boolean;
  className?: string;
}

/**
 * SVG arc gauge — cinematic HUD-style radial indicator.
 * Renders a 270° arc (from 135° to 405°) with smooth transitions.
 */
export const ArcGauge: React.FC<ArcGaugeProps> = memo(({
  value,
  label,
  unit = '%',
  size = 64,
  strokeWidth = 4,
  strokeColor = '#4FD1C5',
  warnBelow = 25,
  warnPulse = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  // 270° arc from 135° to 405°
  const startAngle = 135;
  const totalAngle = 270;
  const circumference = (totalAngle / 360) * 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - clampedValue / 100);
  
  const isWarning = clampedValue < warnBelow;
  const activeColor = isWarning ? '#EF4444' : strokeColor;
  
  // Convert angle to SVG arc coordinates
  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad)
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(startAngle + totalAngle);
  const largeArc = totalAngle > 180 ? 1 : 0;

  // Background track path
  const trackPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={isWarning && warnPulse ? 'animate-pulse' : ''}
      >
        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active fill */}
        <path
          d={trackPath}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 4px ${activeColor}40)`
          }}
        />
        {/* Center value text */}
        <text
          x={center}
          y={center - 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={activeColor}
          fontSize={size * 0.22}
          fontFamily='"JetBrains Mono", monospace'
          fontWeight="700"
        >
          {Math.round(clampedValue)}
        </text>
        <text
          x={center}
          y={center + size * 0.16}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(142,150,164,0.9)"
          fontSize={size * 0.12}
          fontFamily='"JetBrains Mono", monospace'
        >
          {unit}
        </text>
      </svg>
      <span className="text-[8px] font-mono text-mars-muted uppercase tracking-wider mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
});

ArcGauge.displayName = 'ArcGauge';
