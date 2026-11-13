import React, { memo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Layers,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Wind,
  Thermometer,
  Sun,
  Radiation,
  Flame,
  Activity,
  Sliders
} from 'lucide-react';
import { useLayerStore } from '../../stores/useLayerStore';
import { useHudStore, RightTab } from '../../stores/useHudStore';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useIsPhone } from '../../hooks/useMediaQuery';
import { BottomSheet } from '../ui/BottomSheet';
import { LayerConfig } from '../../types/mission';
import { marsVoice } from '../../utils/speech';

/** Layer List and Presets View */
const LayersTabContent: React.FC = () => {
  const { layers, toggleLayerVisibility, setLayerOpacity, setLayerBlendMode } = useLayerStore();
  const { openModal } = useHudStore();

  const handlePreset = (type: 'optical' | 'science' | 'hazard') => {
    layers.forEach((l) => {
      if (type === 'optical') {
        if (l.id === 'optical') {
          if (!l.visible) toggleLayerVisibility(l.id);
          setLayerOpacity(l.id, 1.0);
        } else if (l.id === 'hillshade') {
          if (!l.visible) toggleLayerVisibility(l.id);
          setLayerOpacity(l.id, 0.4);
        } else {
          if (l.visible) toggleLayerVisibility(l.id);
        }
      } else if (type === 'science') {
        if (['optical', 'hillshade', 'crism', 'themis'].includes(l.id)) {
          if (!l.visible) toggleLayerVisibility(l.id);
          setLayerOpacity(l.id, l.id === 'optical' ? 0.6 : 0.75);
        } else {
          if (l.visible) toggleLayerVisibility(l.id);
        }
      } else if (type === 'hazard') {
        if (['optical', 'slope', 'hazard'].includes(l.id)) {
          if (!l.visible) toggleLayerVisibility(l.id);
          setLayerOpacity(l.id, l.id === 'hazard' ? 0.9 : 0.7);
        } else {
          if (l.visible) toggleLayerVisibility(l.id);
        }
      }
    });
  };

  return (
    <div className="space-y-3 p-3">
      {/* Tactical Quick Presets */}
      <div className="p-2.5 rounded-xl bg-mars-dark/60 border border-mars-border">
        <span className="text-[10px] font-mono text-mars-muted uppercase tracking-wider block mb-1.5">
          Cartographic Presets
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handlePreset('optical')}
            className="py-1.5 px-2 rounded-lg bg-mars-void border border-mars-border text-[10px] font-mono text-mars-text hover:border-mars-rust active:bg-mars-rust/10 transition-all text-center"
          >
            Optical
          </button>
          <button
            onClick={() => handlePreset('science')}
            className="py-1.5 px-2 rounded-lg bg-mars-void border border-mars-border text-[10px] font-mono text-mars-cyan hover:border-mars-cyan active:bg-mars-cyan/10 transition-all text-center"
          >
            Spectral
          </button>
          <button
            onClick={() => handlePreset('hazard')}
            className="py-1.5 px-2 rounded-lg bg-mars-void border border-mars-border text-[10px] font-mono text-mars-amber hover:border-mars-red active:bg-mars-red/10 transition-all text-center"
          >
            Hazards
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`p-2.5 rounded-xl border transition-all ${
              layer.visible
                ? 'bg-mars-card/80 border-mars-border shadow-sm'
                : 'bg-mars-void/30 border-mars-border/30 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className={`p-1 rounded-md transition-all shrink-0 ${
                    layer.visible
                      ? 'text-mars-cyan hover:text-white bg-mars-cyan/10'
                      : 'text-mars-dim hover:text-mars-muted'
                  }`}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <span className="text-xs font-heading font-medium text-mars-text truncate">
                  {layer.name}
                </span>
              </div>

              {layer.isSimulated && (
                <button
                  onClick={() => openModal('honesty')}
                  title="Simulated Layer. Click to inspect data provenance & models."
                  className="px-1.5 py-0.5 rounded bg-mars-amber/20 border border-mars-amber/40 text-[9px] font-mono text-mars-amber flex items-center space-x-1 shrink-0 ml-1"
                >
                  <span>SIMULATED</span>
                  <Info className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <p className="text-[10px] text-mars-muted mt-1 font-mono line-clamp-2">
              {layer.description}
            </p>

            {/* Opacity & Blend Controls if Visible */}
            {layer.visible && (
              <div className="mt-2 pt-2 border-t border-mars-border/40 space-y-2">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-mars-muted">
                  <span className="w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                    className="flex-1 accent-mars-cyan cursor-pointer h-1.5 bg-mars-dark rounded"
                  />
                  <span className="w-8 text-right font-bold text-mars-text tabular-nums">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] font-mono text-mars-muted">
                  <span className="w-12">Blend:</span>
                  <select
                    value={layer.blendMode}
                    onChange={(e) => setLayerBlendMode(layer.id, e.target.value as LayerConfig['blendMode'])}
                    className="flex-1 bg-mars-dark border border-mars-border rounded px-1.5 py-0.5 text-[10px] text-mars-text font-mono focus:outline-none focus:border-mars-cyan"
                  >
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply (Darken)</option>
                    <option value="screen">Screen (Lighten)</option>
                    <option value="overlay">Overlay (Contrast)</option>
                  </select>
                </div>

                {layer.legend && (
                  <div className="flex flex-wrap gap-1.5 mt-1 pt-1">
                    {layer.legend.map((item, i) => (
                      <div key={i} className="flex items-center space-x-1 text-[9px] font-mono text-mars-muted">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Safety, Environment & Emergency Abort Content */
const SafetyTabContent: React.FC = () => {
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

  return (
    <div className="space-y-3 p-3 font-mono text-xs">
      {/* Emergency Abort Banner */}
      {isAbortActive && abortRoute && (
        <div className="p-3 rounded-xl bg-mars-red/20 border border-mars-red text-center space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-mars-red font-heading font-bold text-xs tracking-wider">
            <AlertOctagon className="w-4 h-4 animate-spin" />
            <span>EMERGENCY ESCAPE VECTOR ACTIVE</span>
          </div>
          <p className="text-[10px] text-white">
            Direct path to Hab: <span className="font-bold text-mars-amber">{abortRoute.distanceMeters}m</span> (~{abortRoute.estimatedMinutes} min walking)
          </p>
        </div>
      )}

      {/* Emergency Abort Action Button */}
      <button
        onClick={handleAbort}
        className={`w-full py-3 px-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md ${
          isAbortActive
            ? 'bg-mars-void border border-mars-cyan text-mars-cyan hover:bg-mars-cyan/15'
            : 'bg-mars-red hover:bg-red-600 text-white shadow-red-glow animate-pulse'
        }`}
      >
        <AlertOctagon className="w-4 h-4" />
        <span>{isAbortActive ? 'DISENGAGE ESCAPE VECTOR' : 'EMERGENCY RETURN // ABORT TO HAB'}</span>
      </button>

      {/* Active Warnings Box */}
      {warnings.length > 0 && (
        <div className="p-2.5 rounded-xl bg-mars-amber/15 border border-mars-amber/40 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[10px] text-mars-amber font-bold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>ACTIVE HAZARDS ({warnings.length})</span>
          </div>
          {warnings.map((w, idx) => (
            <div key={idx} className="text-[10px] text-mars-amber/90 pl-5">
              • {w}
            </div>
          ))}
        </div>
      )}

      {/* Atmospheric Telemetry (Curiosity REMS + RAD) */}
      <div>
        <span className="text-[10px] text-mars-muted uppercase tracking-wider block mb-1.5">
          In-Situ Meteorology (MSL REMS)
        </span>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded-xl bg-mars-void/60 border border-mars-border">
            <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
              <Wind className="w-3 h-3 text-mars-cyan" />
              <span>ATM. PRESSURE</span>
            </div>
            <span className="font-bold text-mars-text">752 Pa (7.5 mbar)</span>
          </div>

          <div className="p-2 rounded-xl bg-mars-void/60 border border-mars-border">
            <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
              <Thermometer className="w-3 h-3 text-mars-cyan" />
              <span>SURFACE / AIR</span>
            </div>
            <span className="font-bold text-mars-text">-22°C / -58°C</span>
          </div>

          <div className="p-2 rounded-xl bg-mars-void/60 border border-mars-border">
            <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
              <Sun className="w-3 h-3 text-mars-amber" />
              <span>DUST OPACITY (τ)</span>
            </div>
            <span className="font-bold text-mars-text">0.64 (Moderate)</span>
          </div>

          <div className="p-2 rounded-xl bg-mars-void/60 border border-mars-border">
            <div className="flex items-center space-x-1 text-mars-muted mb-0.5">
              <Radiation className="w-3 h-3 text-mars-amber" />
              <span>RAD DOSE RATE</span>
            </div>
            <span className="font-bold text-mars-text">{instantDoseRateUSvHr} µSv/h</span>
          </div>
        </div>
      </div>

      {/* Astronaut Metabolic & Suit Life Support */}
      <div>
        <span className="text-[10px] text-mars-muted uppercase tracking-wider block mb-1.5">
          Suit EMU & Physiological Load
        </span>
        <div className="p-2.5 rounded-xl bg-mars-void/50 border border-mars-border text-[10px] space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-mars-muted">Metabolic Expenditure:</span>
            <span className="text-mars-cyan font-bold">{metabolicKcalHr} kcal/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-mars-muted">Suit Core Temperature:</span>
            <span className="text-mars-text font-bold">{suitCoreTempC}°C</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-mars-muted">Cumulative Rad Dose:</span>
            <span className="text-mars-amber font-bold">{cumulativeRadUSv} µSv</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LayersDrawer: React.FC = memo(() => {
  const {
    isLayersDrawerOpen,
    toggleLayersDrawer,
    closeAllDrawers,
    activeRightTab,
    setActiveRightTab
  } = useHudStore();
  const isPhone = useIsPhone();

  // Mobile BottomSheet rendition
  if (isPhone) {
    return (
      <BottomSheet
        isOpen={isLayersDrawerOpen}
        onClose={closeAllDrawers}
        initialSnap="half"
        title={activeRightTab === 'layers' ? 'Cartographic Layers' : 'Safety & Environment'}
        titleIcon={activeRightTab === 'layers' ? <Layers className="w-4 h-4 text-mars-cyan" /> : <ShieldAlert className="w-4 h-4 text-mars-amber" />}
      >
        {/* Tab switcher inside sheet */}
        <div className="px-3 pt-1 pb-2 flex space-x-2 border-b border-mars-border">
          <button
            onClick={() => setActiveRightTab('layers')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeRightTab === 'layers'
                ? 'bg-mars-cyan/20 border border-mars-cyan text-mars-cyan'
                : 'bg-mars-void text-mars-muted'
            }`}
          >
            LAYERS
          </button>
          <button
            onClick={() => setActiveRightTab('safety')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeRightTab === 'safety'
                ? 'bg-mars-amber/20 border border-mars-amber text-mars-amber'
                : 'bg-mars-void text-mars-muted'
            }`}
          >
            SAFETY
          </button>
        </div>

        {activeRightTab === 'layers' ? <LayersTabContent /> : <SafetyTabContent />}
      </BottomSheet>
    );
  }

  // Desktop/Tablet Unified Right Drawer
  return (
    <>
      {/* Floating Toggle Tab when closed */}
      {!isLayersDrawerOpen && (
        <div className="fixed right-0 top-20 z-40 flex flex-col space-y-1">
          <button
            onClick={() => toggleLayersDrawer('layers')}
            className="p-2 rounded-l-xl bg-mars-card/90 backdrop-blur-hud border border-r-0 border-mars-border text-mars-cyan hover:text-white transition-all shadow-hud-glow"
            title="Open Cartographic Layers"
          >
            <div className="flex items-center space-x-1 text-xs font-mono">
              <span className="writing-mode-vertical">LAYERS</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
          </button>
          <button
            onClick={() => toggleLayersDrawer('safety')}
            className="p-2 rounded-l-xl bg-mars-card/90 backdrop-blur-hud border border-r-0 border-mars-border text-mars-amber hover:text-white transition-all shadow-hud-glow"
            title="Open Safety & Telemetry"
          >
            <div className="flex items-center space-x-1 text-xs font-mono">
              <span className="writing-mode-vertical">SAFETY</span>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Unified Right Command Drawer */}
      <aside
        className={`fixed right-0 top-14 bottom-14 z-50 w-80 lg:w-92 bg-mars-card/95 backdrop-blur-hud border-l border-mars-border flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isLayersDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-br" />

        {/* Drawer Header with Dual Tabs */}
        <div className="p-2.5 border-b border-mars-border flex items-center justify-between bg-mars-void/60">
          <div className="flex items-center space-x-1.5 p-0.5 rounded-lg bg-mars-dark border border-mars-border">
            <button
              onClick={() => setActiveRightTab('layers')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                activeRightTab === 'layers'
                  ? 'bg-mars-cyan/20 border border-mars-cyan text-mars-cyan shadow-hud-glow'
                  : 'text-mars-muted hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>LAYERS</span>
            </button>
            <button
              onClick={() => setActiveRightTab('safety')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                activeRightTab === 'safety'
                  ? 'bg-mars-amber/20 border border-mars-amber text-mars-amber shadow-amber-glow'
                  : 'text-mars-muted hover:text-white border border-transparent'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SAFETY</span>
            </button>
          </div>

          <button
            onClick={() => toggleLayersDrawer()}
            className="p-1 rounded-lg text-mars-muted hover:text-white hover:bg-white/10 transition-all"
            title="Close Drawer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeRightTab === 'layers' ? <LayersTabContent /> : <SafetyTabContent />}
        </div>
      </aside>
    </>
  );
});

LayersDrawer.displayName = 'LayersDrawer';
