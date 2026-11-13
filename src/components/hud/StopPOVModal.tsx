import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Crosshair,
  Volume2,
  X,
  Compass,
  MapPin,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { useHudStore } from '../../stores/useHudStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { marsVoice } from '../../utils/speech';
import { marsAudio } from '../../utils/audio';

type FilterMode = 'rgb' | 'dstretch' | 'nearir';

export const StopPOVModal: React.FC = () => {
  const { activeModal, activePovStopId, closeModal, isVoiceEnabled } = useHudStore();
  const { waypoints } = useMissionStore();
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('rgb');
  const [isZoomed, setIsZoomed] = useState(false);

  if (activeModal !== 'pov' || !activePovStopId) return null;

  const stop = waypoints.find((w) => w.id === activePovStopId) || waypoints[0];
  const mastcam = stop.mastcam;

  const handleVoicePlay = () => {
    setIsPlayingAudio(true);
    marsAudio.playClick(1000, 0.05);
    marsVoice.speak(
      `Tactical in-situ briefing for ${stop.name}. ${stop.desc}. Scientific objective: ${stop.science}. Target feature: ${mastcam?.targetName || 'Mount Sharp Boxwork'}.`
    );
    setTimeout(() => setIsPlayingAudio(false), 6000);
  };

  const getFilterStyle = (): React.CSSProperties => {
    switch (filterMode) {
      case 'dstretch':
        return {
          filter: 'contrast(165%) saturate(140%) brightness(105%) hue-rotate(-10deg)',
          transition: 'filter 0.3s ease'
        };
      case 'nearir':
        return {
          filter: 'contrast(180%) saturate(180%) hue-rotate(90deg) brightness(95%)',
          transition: 'filter 0.3s ease'
        };
      case 'rgb':
      default:
        return {
          filter: 'none',
          transition: 'filter 0.3s ease'
        };
    }
  };

  const nasaArchiveUrl = mastcam
    ? `https://mars.nasa.gov/msl/multimedia/raw-images/?order=sol+desc&mission=msl&sol=${mastcam.sol}`
    : 'https://mars.nasa.gov/msl/multimedia/raw-images/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full ${
          isFullscreenImage ? 'max-w-5xl' : 'max-w-2xl'
        } max-h-[94vh] bg-mars-dark/98 border border-mars-border rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col transition-all duration-300`}
      >
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Modal Header */}
        <div className="p-3 bg-mars-void border-b border-mars-border flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <Camera className="w-4 h-4 text-mars-cyan shrink-0 animate-pulse" />
            <h3 className="font-heading font-bold text-xs sm:text-sm tracking-wider text-mars-text uppercase truncate">
              MSL Mastcam Recon // {stop.name}
            </h3>
            {mastcam && (
              <span className="px-2 py-0.5 rounded bg-mars-rust/20 border border-mars-rust/40 text-[9px] text-mars-rust font-bold shrink-0 hidden sm:inline">
                SOL {mastcam.sol}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => {
                setIsFullscreenImage(!isFullscreenImage);
                marsAudio.playClick(1100, 0.03);
              }}
              className="p-1 rounded-lg text-mars-muted hover:text-white hover:bg-white/10 transition-all"
              title={isFullscreenImage ? 'Standard View' : 'Enlarge Imagery'}
            >
              {isFullscreenImage ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                closeModal();
                marsAudio.playClick(800, 0.03);
              }}
              className="p-1 rounded-lg text-mars-muted hover:text-white hover:bg-white/10 transition-all"
              title="Close Recon Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Authentic Mastcam Photograph with HUD Reticle */}
          <div
            className={`relative ${
              isFullscreenImage ? 'h-80 sm:h-96' : 'h-60 sm:h-72'
            } w-full bg-black overflow-hidden select-none cursor-crosshair`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={`/data/pov/${stop.pov}`}
              alt={stop.name}
              style={getFilterStyle()}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isZoomed ? 'scale-150' : 'scale-100 hover:scale-105'
              }`}
            />
            {/* Scanline CRT overlay */}
            <div className="scanlines absolute inset-0 pointer-events-none opacity-25" />

            {/* Tactical Camera Spec Badge */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm border border-mars-cyan/40 text-[9px] text-mars-cyan flex items-center space-x-1.5">
              <Crosshair className="w-3 h-3 animate-spin" />
              <span>{mastcam?.instrument || 'MAST CAMERA (MASTCAM)'}</span>
            </div>

            {/* PDS Archive Image ID */}
            {mastcam && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm border border-mars-amber/40 text-[9px] text-mars-amber font-mono hidden sm:block">
                PDS ID: {mastcam.imageId}
              </div>
            )}

            {/* Ground Coordinates */}
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm border border-white/20 text-[9px] text-mars-text flex items-center space-x-2">
              <MapPin className="w-3 h-3 text-mars-rust" />
              <span>
                {stop.coordinates[0].toFixed(4)}°E, {Math.abs(stop.coordinates[1]).toFixed(4)}°S
              </span>
            </div>

            {/* Geological Filter Mode Selector on Image */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterMode('rgb');
                  marsAudio.playClick(1000, 0.03);
                }}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-colors ${
                  filterMode === 'rgb'
                    ? 'bg-mars-cyan text-black'
                    : 'text-mars-muted hover:text-white'
                }`}
              >
                BAYER RGB
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterMode('dstretch');
                  marsAudio.playClick(1050, 0.03);
                }}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-colors ${
                  filterMode === 'dstretch'
                    ? 'bg-mars-amber text-black'
                    : 'text-mars-muted hover:text-white'
                }`}
              >
                D-STRETCH
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterMode('nearir');
                  marsAudio.playClick(1100, 0.03);
                }}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-colors ${
                  filterMode === 'nearir'
                    ? 'bg-purple-500 text-white'
                    : 'text-mars-muted hover:text-white'
                }`}
              >
                1013nm IR
              </button>
            </div>
          </div>

          {/* Stop Content & Briefing */}
          <div className="p-3 sm:p-4 space-y-3 text-xs font-mono">
            {/* Geologic Target Banner */}
            {mastcam && (
              <div className="p-2.5 rounded-xl bg-mars-void/70 border border-mars-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] text-mars-muted uppercase tracking-wider block">
                    Planetary Geological Target
                  </span>
                  <span className="text-xs font-heading font-bold text-mars-cyan">
                    {mastcam.targetName}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[9px] text-mars-muted uppercase tracking-wider block">
                    Stratigraphic Setting
                  </span>
                  <span className="text-[10px] text-mars-text">{mastcam.geology}</span>
                </div>
              </div>
            )}

            {/* Scientific Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-mars-void/40 border border-mars-border/60">
                <span className="text-mars-muted uppercase text-[8.5px] block">Instrument Optical Parameters</span>
                <span className="text-mars-text font-bold">
                  {mastcam?.instrument.includes('M-100')
                    ? '100mm f/10 Telephoto (5.1° FOV, 0.074 mrad/px)'
                    : '34mm f/8 Wide Angle (15° FOV, 0.22 mrad/px)'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-mars-void/40 border border-mars-border/60">
                <span className="text-mars-muted uppercase text-[8.5px] block">PDS Raw Resolution</span>
                <span className="text-mars-cyan font-bold tabular-nums">
                  {mastcam?.resolution || '1344 x 1200'} // 100% NASA MSL PDS RAW
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-mars-cyan font-bold mb-1 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Terrain & What Astronauts Will Encounter</span>
              </h4>
              <p className="text-mars-text text-[11px] leading-relaxed">{stop.desc}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-mars-void/50 border border-mars-border">
              <h4 className="text-[10px] uppercase tracking-wider text-mars-amber font-bold mb-1 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Primary Scientific Directives</span>
              </h4>
              <p className="text-mars-muted text-[11px] leading-relaxed">{stop.science}</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between border-t border-mars-border/40 gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleVoicePlay}
                  className={`py-1.5 px-3 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-heading font-semibold ${
                    isPlayingAudio
                      ? 'bg-mars-cyan text-black border-mars-cyan shadow-hud-glow animate-pulse'
                      : 'bg-mars-card border-mars-cyan text-mars-cyan hover:bg-mars-cyan/15'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio ? 'Transmitting Audio...' : 'Audio Briefing'}</span>
                </button>

                <a
                  href={nasaArchiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2.5 rounded-xl border border-mars-border/70 bg-mars-void/60 text-mars-muted hover:text-white hover:border-mars-cyan transition-all flex items-center space-x-1 text-[10px]"
                  title="Verify authentic raw images directly on NASA MSL PDS Archive"
                >
                  <span>NASA PDS Raw</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <button
                onClick={() => {
                  closeModal();
                  marsAudio.playClick(900, 0.03);
                }}
                className="py-1.5 px-4 rounded-xl bg-mars-rust hover:bg-mars-rust-light text-white font-heading font-bold text-xs uppercase tracking-wider shadow-rust-glow transition-all active:scale-95"
              >
                Acknowledge Directive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
