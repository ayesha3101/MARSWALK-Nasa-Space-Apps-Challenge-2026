import React, { memo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Footprints,
  MapPin,
  ShieldCheck,
  Truck,
  Volume2,
  Zap
} from 'lucide-react';
import { useMissionStore } from '../../stores/useMissionStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useHudStore } from '../../stores/useHudStore';
import { useIsPhone } from '../../hooks/useMediaQuery';
import { BottomSheet } from '../ui/BottomSheet';
import { marsVoice } from '../../utils/speech';

/** Inner content — shared between side drawer and bottom sheet */
const MissionContent: React.FC = () => {
  const { waypoints, selectedWaypointId, selectWaypoint } = useMissionStore();
  const { solvedRoute, routingMode, setRoutingMode, isCalculating } = useRouteStore();
  const { openModal, isVoiceEnabled } = useHudStore();

  const handleStopClick = (stopId: string) => {
    selectWaypoint(stopId);
    const stop = waypoints.find(w => w.id === stopId);
    if (stop && isVoiceEnabled) {
      marsVoice.speak(`Selected ${stop.name}. ${stop.desc}`);
    }
  };

  const handleAnnounceLeg = (legIdx: number) => {
    if (!solvedRoute || !solvedRoute.legs[legIdx]) return;
    const leg = solvedRoute.legs[legIdx];
    marsVoice.announceWaypoint(leg.toName, leg.distanceMeters, leg.maxSlopeDeg);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  return (
    <>
      {/* Safest vs Fastest Mode Selector */}
      <div className="p-3 border-b border-mars-border bg-mars-dark/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono text-mars-muted uppercase tracking-wider">
            Route Solver Profile
          </span>
          {isCalculating && (
            <span className="text-[10px] font-mono text-mars-cyan animate-pulse">
              Recalculating A*...
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded bg-mars-void border border-mars-border">
          <button
            onClick={() => setRoutingMode('safest')}
            className={`py-2 sm:py-1.5 px-2 rounded text-xs font-mono flex items-center justify-center space-x-1.5 transition-all ${
              routingMode === 'safest'
                ? 'bg-mars-cyan/20 border border-mars-cyan text-mars-cyan font-bold shadow-hud-glow'
                : 'text-mars-muted hover:text-white border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SAFEST (&lt;15°)</span>
          </button>
          <button
            onClick={() => setRoutingMode('fastest')}
            className={`py-2 sm:py-1.5 px-2 rounded text-xs font-mono flex items-center justify-center space-x-1.5 transition-all ${
              routingMode === 'fastest'
                ? 'bg-mars-rust/20 border border-mars-rust text-mars-rust font-bold shadow-rust-glow'
                : 'text-mars-muted hover:text-white border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>FASTEST</span>
          </button>
        </div>
        <p className="text-[10px] text-mars-muted mt-1.5 font-mono">
          {routingMode === 'safest'
            ? 'Hugs low-slope valleys, minimizes suit metabolic strain & slip hazards.'
            : 'Direct vector optimization for minimal traversal time.'}
        </p>
      </div>

      {/* Mission Traverse Summary Badges */}
      {solvedRoute && (
        <div className="grid grid-cols-3 gap-1 p-2.5 border-b border-mars-border bg-mars-void/30 text-center font-mono">
          <div className="p-1.5 rounded bg-mars-card border border-mars-border">
            <span className="text-[9px] text-mars-muted block">TOTAL DIST</span>
            <span className="text-xs font-bold text-mars-text">
              {(solvedRoute.totalDistanceMeters / 1000).toFixed(2)} km
            </span>
          </div>
          <div className="p-1.5 rounded bg-mars-card border border-mars-border">
            <span className="text-[9px] text-mars-muted block">EST. TIME</span>
            <span className="text-xs font-bold text-mars-cyan">
              {formatTime(solvedRoute.totalTimeSeconds)}
            </span>
          </div>
          <div className="p-1.5 rounded bg-mars-card border border-mars-border">
            <span className="text-[9px] text-mars-muted block">MAX SLOPE</span>
            <span className={`text-xs font-bold ${solvedRoute.maxSlopeDeg > 15 ? 'text-mars-amber' : 'text-mars-text'}`}>
              {solvedRoute.maxSlopeDeg}°
            </span>
          </div>
        </div>
      )}

      {/* Waypoints & Stops List */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-mars-muted mb-1">
          <span>TACTICAL STOPS (DRAG ON MAP)</span>
          <span>{waypoints.length} WAYPOINTS</span>
        </div>

        {waypoints.map((wp, idx) => {
          const isSelected = selectedWaypointId === wp.id;
          const leg = solvedRoute?.legs[idx];

          return (
            <div
              key={wp.id}
              onClick={() => handleStopClick(wp.id)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer active:scale-[0.98] ${
                isSelected
                  ? 'bg-mars-rust/15 border-mars-rust shadow-rust-glow'
                  : 'bg-mars-card/70 border-mars-border hover:border-mars-border-active'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      wp.role === 'START_END'
                        ? 'bg-mars-rust text-white'
                        : wp.role === 'ROVER_RENDEZVOUS'
                        ? 'bg-mars-amber text-black'
                        : 'bg-mars-cyan/20 text-mars-cyan border border-mars-cyan/40'
                    }`}
                  >
                    {wp.role === 'START_END' ? 'HAB' : `S${idx}`}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-heading font-semibold text-mars-text truncate">
                      {wp.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-mars-muted">
                      <span>{wp.coordinates[0].toFixed(3)}°E, {Math.abs(wp.coordinates[1]).toFixed(3)}°S</span>
                      {wp.stayDurationMin > 0 && (
                        <span className="text-mars-cyan">Dwell: {wp.stayDurationMin}m</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('pov', wp.id);
                    }}
                    title="View Mastcam POV & Briefing"
                    className="p-1.5 sm:p-1 rounded bg-mars-dark hover:bg-mars-rust/30 text-mars-muted hover:text-white transition-all"
                  >
                    <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  {isVoiceEnabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnnounceLeg(idx);
                      }}
                      title="Voice Readout"
                      className="p-1.5 sm:p-1 rounded bg-mars-dark hover:bg-mars-cyan/30 text-mars-muted hover:text-mars-cyan transition-all"
                    >
                      <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-mars-muted mt-1.5 line-clamp-2">
                {wp.science || wp.desc}
              </p>

              {/* Per-Leg Stats Breakdown */}
              {leg && (
                <div className="mt-2 pt-2 border-t border-mars-border/40 grid grid-cols-4 gap-1 text-[9px] font-mono text-mars-muted">
                  <div>
                    <span className="block text-[8px] text-mars-dim">LEG DIST</span>
                    <span className="text-mars-text">{leg.distanceMeters}m</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-mars-dim">TIME</span>
                    <span className="text-mars-cyan">{Math.round(leg.timeSeconds / 60)}m</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-mars-dim">MAX SLOPE</span>
                    <span className={leg.maxSlopeDeg > 14 ? 'text-mars-amber' : 'text-mars-text'}>
                      {leg.maxSlopeDeg}°
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-mars-dim">O₂ USED</span>
                    <span className="text-mars-text">{leg.o2UsedLiters}L</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export const MissionStopsDrawer: React.FC = memo(() => {
  const { isMissionDrawerOpen, toggleMissionDrawer, closeAllDrawers } = useHudStore();
  const isPhone = useIsPhone();

  // Phone: render as BottomSheet
  if (isPhone) {
    return (
      <BottomSheet
        isOpen={isMissionDrawerOpen}
        onClose={closeAllDrawers}
        initialSnap="half"
        title="Mission Route"
        titleIcon={<Compass className="w-4 h-4 text-mars-rust" />}
      >
        <MissionContent />
      </BottomSheet>
    );
  }

  // Desktop/tablet: side drawer
  return (
    <>
      {/* Floating Toggle Tab when closed */}
      {!isMissionDrawerOpen && (
        <button
          onClick={toggleMissionDrawer}
          className="fixed left-0 top-20 z-40 p-2 rounded-r-xl bg-mars-card/90 backdrop-blur-hud border border-l-0 border-mars-border text-mars-cyan hover:text-white transition-all shadow-hud-glow"
        >
          <div className="flex items-center space-x-1 text-xs font-mono">
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="writing-mode-vertical">MISSION</span>
          </div>
        </button>
      )}

      {/* Main Mission Drawer */}
      <aside
        className={`fixed left-0 top-14 bottom-14 z-50 w-80 sm:w-96 bg-mars-card/95 backdrop-blur-hud border-r border-mars-border flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isMissionDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-bl" />

        {/* Drawer Header */}
        <div className="p-3 border-b border-mars-border flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-mars-rust" />
              <h2 className="font-heading font-bold text-sm tracking-wider uppercase text-mars-text">
                Mission Route
              </h2>
            </div>
            <p className="text-[10px] font-mono text-mars-muted">Sol 1, EVA 1 // Gale Mount Sharp Boxwork</p>
          </div>
          <button
            onClick={toggleMissionDrawer}
            className="p-1 rounded text-mars-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <MissionContent />
        </div>
      </aside>
    </>
  );
});

MissionStopsDrawer.displayName = 'MissionStopsDrawer';
