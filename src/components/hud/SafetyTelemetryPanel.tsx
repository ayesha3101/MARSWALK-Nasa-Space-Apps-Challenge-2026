import React, { useState, memo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Radiation,
  ShieldAlert,
  Sun,
  Thermometer,
  Wind
} from 'lucide-react';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useIsPhone } from '../../hooks/useMediaQuery';
import { marsVoice } from '../../utils/speech';

export const SafetyTelemetryPanel: React.FC = memo(() => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isPhone = useIsPhone();

  const instantDoseRateUSvHr = useTimelineStore((s) => s.instantDoseRateUSvHr);
  const cumulativeRadUSv = useTimelineStore((s) => s.cumulativeRadUSv);
  const suitCoreTempC = useTimelineStore((s) => s.suitCoreTempC);
  const metabolicKcalHr = useTimelineStore((s) => s.metabolicKcalHr);
  const warnings = useTimelineStore((s) => s.warnings);

  const triggerEmergencyAbort = useRouteStore((s) => s.triggerEmergencyAbort);
  const isAbortActive = useRouteStore((s) => s.isAbortActive);
  const clearEmergencyAbort = useRouteStore((s) => s.clearEmergencyAbort);
  const abortRoute = useRouteStore((s) => s.abortRoute);

  const handleAbort = () => {
    if (isAbortActive) {
      clearEmergencyAbort();
    } else {
      const currentGrid = useTimelineStore.getState().currentGrid;
      triggerEmergencyAbort(currentGrid);
      marsVoice.announceAbort();
    }
  };

  // On phone, this panel is accessed via modal or compacted
  if (isPhone) {
    return (
      <>
        {/* Compact floating abort button on phone */}
        <div className="fixed top-14 right-2 z-20">
          {/* Warning badge */}
          {warnings.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-mars-amber text-[8px] text-black font-bold flex items-center justify-center animate-pulse z-10">
              {warnings.length}
            </div>
          )}
          <button
            onClick={handleAbort}
            className={`p-2.5 rounded-xl border-2 transition-all shadow-lg ${
              isAbortActive
                ? 'bg-mars-void border-mars-cyan text-mars-cyan'
                : 'bg-mars-red/90 border-mars-red text-white animate-pulse'
            }`}
          >
            <AlertOctagon className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Banner if active */}
        {isAbortActive && abortRoute && (
          <div className="fixed top-28 left-2 right-2 z-20 p-2.5 rounded-xl bg-mars-red/20 border border-mars-red backdrop-blur-sm text-center">
            <div className="flex items-center justify-center space-x-1.5 text-mars-red font-heading font-bold text-xs tracking-wider">
              <AlertOctagon className="w-4 h-4 animate-spin" />
              <span>ESCAPE VECTOR ACTIVE</span>
            </div>
            <p className="text-[10px] font-mono text-white mt-1">
              Hab: <span className="font-bold text-mars-amber">{abortRoute.distanceMeters}m</span> (~{abortRoute.estimatedMinutes}min)
            </p>
            <button
              onClick={handleAbort}
              className="mt-1.5 px-3 py-1 rounded bg-mars-void border border-mars-cyan text-mars-cyan text-[10px] font-mono"
            >
              DISENGAGE
            </button>
          </div>
        )}
      </>
    );
  }

  // Desktop/tablet layout
  return (
    <div className="fixed top-16 right-4 z-20 w-72 sm:w-80 pointer-events-auto">
      <div className={`hud-panel rounded-lg overflow-hidden transition-all duration-200 ${
        isAbortActive ? 'border-mars-red shadow-red-glow' : 'border-mars-border'
      }`}>
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Panel Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2.5 bg-mars-dark/90 border-b border-mars-border flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className={`w-4 h-4 ${isAbortActive ? 'text-mars-red animate-pulse' : 'text-mars-amber'}`} />
            <span className="font-heading font-bold text-xs tracking-wider text-mars-text uppercase">
              Safety & Environment
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {warnings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-mars-amber/20 border border-mars-amber text-[9px] text-mars-amber font-mono animate-pulse">
                {warnings.length} ALERT
              </span>
            )}
            <button className="text-mars-muted hover:text-white">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Emergency Abort Banner */}
        {isAbortActive && abortRoute && (
          <div className="p-2.5 bg-mars-red/20 border-b border-mars-red text-center">
            <div className="flex items-center justify-center space-x-1.5 text-mars-red font-heading font-bold text-xs tracking-wider">
              <AlertOctagon className="w-4 h-4 animate-spin" />
              <span>EMERGENCY ESCAPE VECTOR ENGAGED</span>
            </div>
            <p className="text-[10px] font-mono text-white mt-1">
              Direct safe path to Hab: <span className="font-bold text-mars-amber">{abortRoute.distanceMeters}m</span> (~{abortRoute.estimatedMinutes} min walking)
            </p>
          </div>
        )}

        {isExpanded && (
          <div className="p-3 space-y-3 font-mono text-xs">
            {/* Live Weather & Atmospheric Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-mars-void/60 border border-mars-border">
                <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
                  <Wind className="w-3 h-3 text-mars-cyan" />
                  <span>ATM. PRESSURE</span>
                </div>
                <span className="font-bold text-mars-text">752 Pa (7.5 mbar)</span>
              </div>

              <div className="p-2 rounded bg-mars-void/60 border border-mars-border">
                <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
                  <Thermometer className="w-3 h-3 text-mars-cyan" />
                  <span>GROUND / AMB</span>
                </div>
                <span className="font-bold text-mars-text">-22°C / -58°C</span>
              </div>

              <div className="p-2 rounded bg-mars-void/60 border border-mars-border">
                <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
                  <Sun className="w-3 h-3 text-mars-amber" />
                  <span>DUST OPACITY (τ)</span>
                </div>
                <span className="font-bold text-mars-text">0.64 (Moderate)</span>
              </div>

              <div className="p-2 rounded bg-mars-void/60 border border-mars-border">
                <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
                  <Radiation className="w-3 h-3 text-mars-amber" />
                  <span>RAD DOSE RATE</span>
                </div>
                <span className="font-bold text-mars-text">{instantDoseRateUSvHr} µSv/h</span>
              </div>
            </div>

            {/* Astronaut Metabolic & Suit Core Status */}
            <div className="p-2 rounded bg-mars-void/40 border border-mars-border text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-mars-muted">Metabolic Expenditure:</span>
                <span className="text-mars-cyan font-bold">{metabolicKcalHr} kcal/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mars-muted">Suit Core Temperature:</span>
                <span className="text-mars-text font-bold">{suitCoreTempC}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mars-muted">Cumulative Rad Dose:</span>
                <span className="text-mars-amber font-bold">{cumulativeRadUSv} µSv</span>
              </div>
            </div>

            {/* Active Warnings Box */}
            {warnings.length > 0 && (
              <div className="p-2 rounded bg-mars-amber/10 border border-mars-amber/40 space-y-1">
                {warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-[10px] text-mars-amber">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Emergency Abort Action Button */}
            <button
              onClick={handleAbort}
              className={`w-full py-2.5 px-3 rounded-lg font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                isAbortActive
                  ? 'bg-mars-void border border-mars-cyan text-mars-cyan hover:bg-mars-cyan/20'
                  : 'bg-mars-red hover:bg-red-600 text-white shadow-red-glow animate-pulse'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{isAbortActive ? 'DISENGAGE ESCAPE VECTOR' : 'EMERGENCY RETURN // ABORT TO HAB'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

SafetyTelemetryPanel.displayName = 'SafetyTelemetryPanel';
