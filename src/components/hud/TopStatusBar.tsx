import React, { useEffect, useState, memo } from 'react';
import {
  Activity,
  Battery,
  HelpCircle,
  Radio,
  Volume2,
  VolumeX,
  FileText,
  Hand,
  Play,
  Compass,
  Layers,
  ShieldAlert,
  Eye,
  EyeOff,
  Maximize2,
  Sliders,
  Bell,
  BellOff
} from 'lucide-react';
import { getMartianLMST } from '../../utils/marsMath';
import { useHudStore } from '../../stores/useHudStore';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useIsPhone, useIsDesktop } from '../../hooks/useMediaQuery';
import { ArcGauge } from '../ui/ArcGauge';
import { marsVoice } from '../../utils/speech';
import { marsAudio } from '../../utils/audio';
import { SolSolarDial } from './SolSolarDial';

export const TopStatusBar: React.FC = memo(() => {
  const viewMode = useHudStore((s) => s.viewMode);
  const setViewMode = useHudStore((s) => s.setViewMode);
  const isGloveMode = useHudStore((s) => s.isGloveMode);
  const toggleGloveMode = useHudStore((s) => s.toggleGloveMode);
  const isVoiceEnabled = useHudStore((s) => s.isVoiceEnabled);
  const toggleVoice = useHudStore((s) => s.toggleVoice);
  const openModal = useHudStore((s) => s.openModal);
  const isDemoMode = useHudStore((s) => s.isDemoMode);
  const toggleDemoMode = useHudStore((s) => s.toggleDemoMode);

  const isMissionDrawerOpen = useHudStore((s) => s.isMissionDrawerOpen);
  const toggleMissionDrawer = useHudStore((s) => s.toggleMissionDrawer);
  const isLayersDrawerOpen = useHudStore((s) => s.isLayersDrawerOpen);
  const activeRightTab = useHudStore((s) => s.activeRightTab);
  const toggleLayersDrawer = useHudStore((s) => s.toggleLayersDrawer);
  const isZenMode = useHudStore((s) => s.isZenMode);
  const toggleZenMode = useHudStore((s) => s.toggleZenMode);

  const isCompareMode = useHudStore((s) => s.isCompareMode);
  const setCompareMode = useHudStore((s) => s.setCompareMode);
  const isAudioMuted = useHudStore((s) => s.isAudioMuted);
  const toggleAudioMute = useHudStore((s) => s.toggleAudioMute);

  const isAbortActive = useRouteStore((s) => s.isAbortActive);
  const warnings = useTimelineStore((s) => s.warnings);

  const o2RemainingPercent = useTimelineStore((s) => s.o2RemainingPercent);
  const batteryRemainingPercent = useTimelineStore((s) => s.batteryRemainingPercent);
  const currentElevation = useTimelineStore((s) => Math.round(s.currentElevation));

  const isPhone = useIsPhone();
  const isDesktop = useIsDesktop();

  const [lmst, setLmst] = useState('10:14:02');
  const [mroCountdown, setMroCountdown] = useState(2450);

  useEffect(() => {
    const timer = setInterval(() => {
      const { lmstString } = getMartianLMST();
      setLmst(lmstString);
      setMroCountdown((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMroTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVoiceToggle = () => {
    const nextState = !isVoiceEnabled;
    toggleVoice();
    marsVoice.setEnabled(nextState);
    if (nextState) {
      marsVoice.speak('Marswalk telemetry voice active.');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 sm:h-14 bg-mars-void/90 backdrop-blur-hud border-b border-mars-border px-2 sm:px-3 md:px-4 flex items-center justify-between text-xs font-mono text-mars-text shadow-xl">
      {/* Left: Branding & Mission Clock */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-mars-rust animate-ping" />
          <span className="font-heading font-bold text-xs sm:text-sm tracking-widest text-mars-text">
            MARSWALK
          </span>
          {!isPhone && (
            <span className="px-1.5 py-0.5 rounded bg-mars-rust/20 border border-mars-rust/40 text-[9px] text-mars-rust font-mono font-bold">
              EVA-1
            </span>
          )}
        </div>

        {!isPhone && <div className="h-4 w-[1px] bg-mars-border hidden sm:block" />}

        {/* Mars Time Readouts */}
        {isDesktop && (
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-mars-muted uppercase tracking-wider">Mission Clock</span>
              <span className="text-mars-cyan font-bold tracking-wider">SOL 001 // {lmst}</span>
            </div>
            <SolSolarDial />
          </div>
        )}

        {isPhone && (
          <span className="text-[10px] text-mars-cyan font-bold tracking-wider truncate">
            SOL 1 {lmst}
          </span>
        )}
      </div>

      {/* Center Command Pills (Desktop & Tablet) */}
      {!isPhone && (
        <div className="flex items-center space-x-1 sm:space-x-2 bg-mars-dark/80 border border-mars-border rounded-xl p-0.5 shadow-inner">
          {/* Mission Route Drawer Toggle */}
          <button
            onClick={toggleMissionDrawer}
            className={`px-2.5 py-1 rounded-lg text-xs font-heading font-bold flex items-center space-x-1.5 transition-all ${
              isMissionDrawerOpen
                ? 'bg-mars-rust text-white shadow-rust-glow'
                : 'text-mars-muted hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Mission Stops & Routing Profile"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ROUTE</span>
          </button>

          {/* Cartographic Layers Drawer Toggle */}
          <button
            onClick={() => {
              toggleLayersDrawer('layers');
              marsAudio.playClick(900, 0.03);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-heading font-bold flex items-center space-x-1.5 transition-all ${
              isLayersDrawerOpen && activeRightTab === 'layers'
                ? 'bg-mars-cyan text-black shadow-hud-glow'
                : 'text-mars-muted hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Cartographic Layers (Optical, DEM, Slope, THEMIS)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LAYERS</span>
          </button>

          {/* Swipe Compare Mode Toggle */}
          <button
            onClick={() => {
              setCompareMode(!isCompareMode);
              marsAudio.playClick(1000, 0.04);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-heading font-bold flex items-center space-x-1.5 transition-all ${
              isCompareMode
                ? 'bg-mars-cyan text-black shadow-hud-glow'
                : 'text-mars-muted hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Spectral Swipe Comparison (Optical CTX vs THEMIS/MOLA)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">SWIPE</span>
          </button>

          {/* Safety & Telemetry Drawer Toggle */}
          <button
            onClick={() => toggleLayersDrawer('safety')}
            className={`px-2.5 py-1 rounded-lg text-xs font-heading font-bold flex items-center space-x-1.5 transition-all ${
              isAbortActive
                ? 'bg-mars-red text-white animate-pulse shadow-red-glow'
                : isLayersDrawerOpen && activeRightTab === 'safety'
                ? 'bg-mars-amber text-black shadow-amber-glow'
                : 'text-mars-muted hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Environmental Telemetry & Safety Abort"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SAFETY</span>
            {warnings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-mars-amber animate-ping" />
            )}
          </button>

          <div className="h-4 w-[1px] bg-mars-border mx-1" />

          {/* 2D / 3D Mode Switcher */}
          <div className="flex rounded-md bg-mars-void p-0.5 border border-mars-border/60">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-2 py-0.5 rounded text-[11px] font-heading font-semibold transition-all ${
                viewMode === '2D'
                  ? 'bg-mars-cyan/20 text-mars-cyan border border-mars-cyan/40'
                  : 'text-mars-muted hover:text-white'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-2 py-0.5 rounded text-[11px] font-heading font-semibold transition-all ${
                viewMode === '3D'
                  ? 'bg-mars-cyan/20 text-mars-cyan border border-mars-cyan/40'
                  : 'text-mars-muted hover:text-white'
              }`}
            >
              3D
            </button>
          </div>
        </div>
      )}

      {/* Right: Telemetry Gauges & Tools */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Arc Gauges on Desktop */}
        {isDesktop && (
          <div className="flex items-center space-x-2 mr-1">
            <ArcGauge
              value={o2RemainingPercent}
              label="O₂"
              size={36}
              strokeWidth={3}
              strokeColor="#4FD1C5"
              warnBelow={25}
            />
            <ArcGauge
              value={batteryRemainingPercent}
              label="BATT"
              size={36}
              strokeWidth={3}
              strokeColor="#F6B042"
              warnBelow={20}
            />
          </div>
        )}

        {/* Compact Phone O2/Batt readout */}
        {isPhone && (
          <div className="flex items-center space-x-1.5 mr-1 text-[10px] font-bold">
            <span className={o2RemainingPercent < 25 ? 'text-mars-red animate-pulse' : 'text-mars-cyan'}>
              O₂{o2RemainingPercent}%
            </span>
            <span className="text-mars-amber">⚡{batteryRemainingPercent}%</span>
          </div>
        )}

        {/* Demo Mode Button */}
        {!isPhone && (
          <button
            onClick={toggleDemoMode}
            title={isDemoMode ? 'Stop Demo Mode' : 'Start Automated Cinematic Demo'}
            className={`p-1.5 rounded-lg border transition-all ${
              isDemoMode
                ? 'bg-mars-rust border-mars-rust text-white shadow-rust-glow animate-pulse'
                : 'bg-mars-card border-mars-border text-mars-muted hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Zen / Cinematic Mode Toggle */}
        <button
          onClick={toggleZenMode}
          title={isZenMode ? 'Exit Zen Mode (Show HUD)' : 'Enter Zen Mode (Hide HUD for pure Mars view)'}
          className={`p-1.5 rounded-lg border transition-all ${
            isZenMode
              ? 'bg-mars-cyan/20 border-mars-cyan text-mars-cyan'
              : 'bg-mars-card border-mars-border text-mars-muted hover:text-white'
          }`}
        >
          {isZenMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Glove Mode Toggle */}
        <button
          onClick={toggleGloveMode}
          title="Toggle Spacesuit Glove Mode"
          className={`p-1.5 rounded-lg border transition-all ${
            isGloveMode
              ? 'bg-mars-cyan/20 border-mars-cyan text-mars-cyan shadow-hud-glow'
              : 'bg-mars-card border-mars-border text-mars-muted hover:text-white'
          }`}
        >
          <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Audio Synthesizer Chimes Toggle */}
        <button
          onClick={() => {
            toggleAudioMute();
            if (isAudioMuted) marsAudio.playClick(1200, 0.05);
          }}
          title={isAudioMuted ? 'Unmute Tactical Chimes' : 'Mute Tactical Chimes'}
          className={`p-1.5 rounded-lg border transition-all ${
            !isAudioMuted
              ? 'bg-mars-cyan/20 border-mars-cyan text-mars-cyan shadow-hud-glow'
              : 'bg-mars-card border-mars-border text-mars-muted hover:text-white'
          }`}
        >
          {!isAudioMuted ? <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Voice Toggle */}
        <button
          onClick={handleVoiceToggle}
          title={isVoiceEnabled ? 'Mute Suit Voice' : 'Enable Suit Audio Readout'}
          className={`p-1.5 rounded-lg border transition-all ${
            isVoiceEnabled
              ? 'bg-mars-cyan/20 border-mars-cyan text-mars-cyan shadow-hud-glow'
              : 'bg-mars-card border-mars-border text-mars-muted hover:text-white'
          }`}
        >
          {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Data Honesty Modal */}
        {isDesktop && (
          <button
            onClick={() => openModal('honesty')}
            className="px-2 py-1 rounded-lg bg-mars-card border border-mars-border text-[11px] text-mars-muted hover:text-mars-cyan hover:border-mars-cyan transition-all"
            title="Inspect NASA / USGS Provenance"
          >
            HONESTY
          </button>
        )}

        {/* Guided Tour */}
        {!isPhone && (
          <button
            onClick={() => openModal('tour')}
            title="Start Guided System Tour"
            className="p-1.5 rounded-lg bg-mars-card border border-mars-border text-mars-muted hover:text-white transition-all"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
});

TopStatusBar.displayName = 'TopStatusBar';
