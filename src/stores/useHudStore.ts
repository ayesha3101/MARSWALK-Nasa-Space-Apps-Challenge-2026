import { create } from 'zustand';

export type RightTab = 'layers' | 'safety';

interface HudState {
  isGloveMode: boolean;
  viewMode: '2D' | '3D';
  activeModal: 'pov' | 'honesty' | 'tour' | 'pdf' | null;
  activePovStopId: string | null;
  isVoiceEnabled: boolean;
  isScanning: boolean;
  
  // Drawer visibility — default closed for clean, uncluttered map viewing
  isLayersDrawerOpen: boolean;
  isMissionDrawerOpen: boolean;
  activeRightTab: RightTab;
  
  // Bottom deck elevation profile expansion
  isElevationExpanded: boolean;
  
  // Zen / Cinematic mode (hides floating HUD for pure immersion)
  isZenMode: boolean;

  // Split Screen Comparison Slider Mode
  isCompareMode: boolean;
  compareLayerId: string;
  compareSplitPercent: number;

  // Tactical Audio Synthesizer
  isAudioMuted: boolean;
  
  // Intro & Demo
  showIntro: boolean;
  isDemoMode: boolean;

  // Actions
  toggleGloveMode: () => void;
  setViewMode: (mode: '2D' | '3D') => void;
  openModal: (modal: 'pov' | 'honesty' | 'tour' | 'pdf', stopId?: string) => void;
  closeModal: () => void;
  toggleVoice: () => void;
  setScanning: (scanning: boolean) => void;
  
  // Clean drawer toggles (mutually exclusive to avoid screen cramping)
  toggleLayersDrawer: (tab?: RightTab) => void;
  toggleMissionDrawer: () => void;
  setActiveRightTab: (tab: RightTab) => void;
  closeAllDrawers: () => void;
  
  toggleElevation: () => void;
  toggleZenMode: () => void;
  setCompareMode: (enabled: boolean) => void;
  setCompareLayerId: (id: string) => void;
  setCompareSplitPercent: (pct: number) => void;
  toggleAudioMute: () => void;
  dismissIntro: () => void;
  toggleDemoMode: () => void;
}

export const useHudStore = create<HudState>((set) => ({
  isGloveMode: false,
  viewMode: '2D',
  activeModal: null,
  activePovStopId: null,
  isVoiceEnabled: false,
  isScanning: true,
  
  // Default to closed so the map breathes and user is not overwhelmed
  isLayersDrawerOpen: false,
  isMissionDrawerOpen: false,
  activeRightTab: 'layers',
  
  isElevationExpanded: false,
  isZenMode: false,
  isCompareMode: false,
  compareLayerId: 'themis',
  compareSplitPercent: 50,
  isAudioMuted: false,
  showIntro: !localStorage.getItem('marswalk_intro_seen'),
  isDemoMode: false,

  toggleGloveMode: () => set((state) => ({ isGloveMode: !state.isGloveMode })),
  setViewMode: (mode) => set({ viewMode: mode }),
  openModal: (modal, stopId) => set({ activeModal: modal, activePovStopId: stopId || null }),
  closeModal: () => set({ activeModal: null, activePovStopId: null }),
  toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
  setScanning: (scanning) => set({ isScanning: scanning }),

  toggleLayersDrawer: (tab) => set((state) => {
    const nextTab = tab || state.activeRightTab;
    const isOpening = !state.isLayersDrawerOpen || (tab && state.activeRightTab !== tab);
    return {
      isLayersDrawerOpen: isOpening,
      activeRightTab: nextTab,
      // Mutually close left drawer when right opens to prevent cramping
      isMissionDrawerOpen: isOpening ? false : state.isMissionDrawerOpen
    };
  }),

  toggleMissionDrawer: () => set((state) => {
    const isOpening = !state.isMissionDrawerOpen;
    return {
      isMissionDrawerOpen: isOpening,
      // Mutually close right drawer when left opens
      isLayersDrawerOpen: isOpening ? false : state.isLayersDrawerOpen
    };
  }),

  setActiveRightTab: (tab) => set({ activeRightTab: tab, isLayersDrawerOpen: true }),
  closeAllDrawers: () => set({ isLayersDrawerOpen: false, isMissionDrawerOpen: false }),

  toggleElevation: () => set((state) => ({ isElevationExpanded: !state.isElevationExpanded })),
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  setCompareMode: (enabled) => set({ isCompareMode: enabled }),
  setCompareLayerId: (id) => set({ compareLayerId: id }),
  setCompareSplitPercent: (pct) => set({ compareSplitPercent: pct }),
  toggleAudioMute: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
  
  dismissIntro: () => {
    localStorage.setItem('marswalk_intro_seen', 'true');
    set({ showIntro: false });
  },
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
}));
