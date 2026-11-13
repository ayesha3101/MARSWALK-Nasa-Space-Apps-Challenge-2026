import React, { useEffect, useState } from 'react';
import { TopStatusBar } from './components/hud/TopStatusBar';
import { MissionStopsDrawer } from './components/hud/MissionStopsDrawer';
import { LayersDrawer } from './components/hud/LayersDrawer';
import { ElevationProfileChart } from './components/map/ElevationProfileChart';
import { TimelineScrubber } from './components/timeline/TimelineScrubber';
import { Map2DView } from './components/map/Map2DView';
import { LayerSwipeCompare } from './components/map/LayerSwipeCompare';
import { Terrain3DView } from './components/terrain3d/Terrain3DView';
import { StopPOVModal } from './components/hud/StopPOVModal';
import { DataHonestyModal } from './components/hud/DataHonestyModal';
import { GuidedTourModal } from './components/hud/GuidedTourModal';
import { PDFExportModal } from './components/hud/PDFExportModal';
import { MarsGlobeIntro } from './components/intro/MarsGlobeIntro';
import { useMissionStore } from './stores/useMissionStore';
import { useHudStore } from './stores/useHudStore';
import { useIsPhone } from './hooks/useMediaQuery';
import { useDemoController } from './hooks/useDemoController';
import { Radio, Eye, Compass, Layers, ShieldAlert, Map } from 'lucide-react';

export const App: React.FC = () => {
  const { loadMissionData, isLoaded } = useMissionStore();
  const viewMode = useHudStore((s) => s.viewMode);
  const isGloveMode = useHudStore((s) => s.isGloveMode);
  const isScanning = useHudStore((s) => s.isScanning);
  const setScanning = useHudStore((s) => s.setScanning);
  const openModal = useHudStore((s) => s.openModal);
  const showIntro = useHudStore((s) => s.showIntro);
  const dismissIntro = useHudStore((s) => s.dismissIntro);
  const isZenMode = useHudStore((s) => s.isZenMode);
  const toggleZenMode = useHudStore((s) => s.toggleZenMode);
  const isPhone = useIsPhone();

  // Automatic demonstration mode narrator & tour controller
  useDemoController();

  const [initProgress, setInitProgress] = useState(20);

  useEffect(() => {
    loadMissionData();

    // Check first load for guided tour
    const hasSeenTour = localStorage.getItem('marswalk_tour_seen');
    if (!hasSeenTour) {
      setTimeout(() => {
        openModal('tour');
        localStorage.setItem('marswalk_tour_seen', 'true');
      }, 1400);
    }

    // High performance radar boot sequence
    const interval = setInterval(() => {
      setInitProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setScanning(false), 300);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-screen h-[100dvh] overflow-hidden bg-mars-void text-mars-text ${isGloveMode ? 'glove-mode' : ''}`}>
      {/* Cinematic Mars Globe Intro */}
      {showIntro && (
        <MarsGlobeIntro onDismiss={dismissIntro} />
      )}

      {/* Initializing Radar Sweep Loader */}
      {isScanning && !showIntro && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mars-void font-mono">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-mars-cyan/30 animate-ping opacity-30" />
            <div className="absolute inset-3 rounded-full border-2 border-mars-rust/50" />
            <div className="absolute inset-8 rounded-full border border-dashed border-mars-cyan/40" />
            <div className="absolute inset-0 rounded-full animate-radar-sweep border-t-2 border-r-2 border-mars-cyan/80" />
            <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-mars-cyan animate-pulse" />
          </div>

          <h2 className="font-heading font-bold text-lg sm:text-xl tracking-widest text-mars-text uppercase mb-2">
            MARSWALK // EVA HUD
          </h2>
          <p className="text-[10px] sm:text-xs text-mars-muted tracking-wider mb-4 text-center px-4">
            SYNCHRONIZING GALE CRATER QUAD // ELEVATION MATRIX &amp; RADAR FIX
          </p>

          <div className="w-48 sm:w-64 h-1.5 rounded-full bg-mars-dark border border-mars-border overflow-hidden">
            <div
              className="h-full bg-mars-cyan transition-all duration-150"
              style={{ width: `${initProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-mars-cyan mt-2 font-bold">{initProgress}% LOADED</span>
        </div>
      )}

      {/* Zen Mode Floating Restore Button */}
      {isZenMode && (
        <button
          onClick={toggleZenMode}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-xl bg-mars-dark/90 backdrop-blur-hud border border-mars-cyan/60 text-xs font-mono text-mars-cyan hover:bg-mars-cyan/15 transition-all shadow-hud-glow flex items-center space-x-1.5 animate-fadeIn"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>EXIT ZEN VIEW</span>
        </button>
      )}

      {/* Main Top Status Bar (Hidden in Zen Mode) */}
      <div className={`transition-opacity duration-300 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <TopStatusBar />
      </div>

      {/* Persistent Dual Viewport: 2D Map & 3D Terrain Flyover */}
      <main className="absolute inset-0 pt-12 sm:pt-14 pb-12 sm:pb-14 overflow-hidden z-0 isolate">
        {isLoaded ? (
          <>
            <div
              className={`w-full h-full relative ${
                viewMode === '2D' ? 'block' : 'hidden'
              }`}
            >
              <Map2DView />
              <LayerSwipeCompare />
            </div>

            <div
              className={`w-full h-full ${
                viewMode === '3D' ? 'block' : 'hidden'
              }`}
            >
              <Terrain3DView />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-sm text-mars-muted">
            Acquiring Gale DEM Raster Layers...
          </div>
        )}
      </main>

      {/* Left Mission Waypoints Drawer (Hidden in Zen Mode) */}
      <div className={`transition-opacity duration-300 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <MissionStopsDrawer />
      </div>

      {/* Right Cartographic Layers & Safety Drawer (Hidden in Zen Mode) */}
      <div className={`transition-opacity duration-300 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <LayersDrawer />
      </div>

      {/* Bottom Area: Collapsible Elevation Profile & EVA Timeline Scrubber */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col transition-opacity duration-300 ${
          isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ElevationProfileChart />
        <TimelineScrubber />
      </div>

      {/* Mobile Bottom Navigation — phone only */}
      {isPhone && !isZenMode && (
        <MobileBottomNav />
      )}

      {/* Dialog Modals */}
      <StopPOVModal />
      <DataHonestyModal />
      <GuidedTourModal />
      <PDFExportModal />
    </div>
  );
};

const MobileBottomNav: React.FC = () => {
  const toggleMissionDrawer = useHudStore((s) => s.toggleMissionDrawer);
  const toggleLayersDrawer = useHudStore((s) => s.toggleLayersDrawer);
  const viewMode = useHudStore((s) => s.viewMode);
  const setViewMode = useHudStore((s) => s.setViewMode);
  const isMissionDrawerOpen = useHudStore((s) => s.isMissionDrawerOpen);
  const isLayersDrawerOpen = useHudStore((s) => s.isLayersDrawerOpen);
  const activeRightTab = useHudStore((s) => s.activeRightTab);

  return (
    <div className="fixed bottom-[64px] left-3 right-3 z-35 flex items-center justify-around py-1.5 px-2 rounded-2xl bg-mars-void/90 backdrop-blur-hud border border-mars-border shadow-2xl safe-area-bottom">
      <button
        onClick={toggleMissionDrawer}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isMissionDrawerOpen ? 'text-mars-rust font-bold bg-mars-rust/10' : 'text-mars-muted hover:text-white'
        }`}
      >
        <Compass className="w-4 h-4" />
        <span className="text-[8px] font-mono mt-0.5">ROUTE</span>
      </button>

      <button
        onClick={() => toggleLayersDrawer('layers')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isLayersDrawerOpen && activeRightTab === 'layers'
            ? 'text-mars-cyan font-bold bg-mars-cyan/10'
            : 'text-mars-muted hover:text-white'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span className="text-[8px] font-mono mt-0.5">LAYERS</span>
      </button>

      <button
        onClick={() => toggleLayersDrawer('safety')}
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isLayersDrawerOpen && activeRightTab === 'safety'
            ? 'text-mars-amber font-bold bg-mars-amber/10'
            : 'text-mars-muted hover:text-white'
        }`}
      >
        <ShieldAlert className="w-4 h-4" />
        <span className="text-[8px] font-mono mt-0.5">SAFETY</span>
      </button>

      <button
        onClick={() => setViewMode(viewMode === '2D' ? '3D' : '2D')}
        className="flex flex-col items-center py-1 px-3 rounded-xl text-mars-muted hover:text-white transition-all"
      >
        <Map className="w-4 h-4" />
        <span className="text-[8px] font-mono mt-0.5">{viewMode === '2D' ? '3D' : '2D'}</span>
      </button>
    </div>
  );
};

export default App;
