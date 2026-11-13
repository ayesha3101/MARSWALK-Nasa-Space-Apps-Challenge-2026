import { create } from 'zustand';
import { LayerConfig } from '../types/mission';

interface LayerState {
  layers: LayerConfig[];
  toggleLayerVisibility: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerBlendMode: (id: string, blendMode: LayerConfig['blendMode']) => void;
}

const INITIAL_LAYERS: LayerConfig[] = [
  {
    id: 'optical',
    name: '1. CTX Optical Base',
    category: 'base',
    file: '/data/layers/hirise_optical.jpg',
    visible: true,
    opacity: 1.0,
    blendMode: 'normal',
    isSimulated: false,
    description: 'Calibrated MRO Context Camera (CTX) 6m surface reflectance of Mount Sharp boxwork.'
  },
  {
    id: 'hillshade',
    name: '2. Topography / Hillshade',
    category: 'elevation',
    file: '/data/layers/hillshade.png',
    visible: true,
    opacity: 0.65,
    blendMode: 'multiply',
    isSimulated: false,
    description: 'Multi-directional DEM shaded relief from NASA MOLA & Gale Crater elevation model.'
  },
  {
    id: 'slope',
    name: '3. Slope Angle Gradient',
    category: 'elevation',
    file: '/data/layers/slope_map.png',
    visible: true,
    opacity: 0.55,
    blendMode: 'screen',
    isSimulated: false,
    legend: [
      { label: '0-8° Safe', color: '#22C55E' },
      { label: '8-15° Caution', color: '#EAB308' },
      { label: '15-20° Steep', color: '#F97316' },
      { label: '>20° Blocked', color: '#EF4444' }
    ],
    description: 'Computed gradient angles. Cells exceeding 20° are suit-mobility limits.'
  },
  {
    id: 'themis',
    name: '4. THEMIS Thermal Inertia',
    category: 'spectral',
    file: '/data/layers/themis_thermal.png',
    visible: false,
    opacity: 0.60,
    blendMode: 'screen',
    isSimulated: false,
    legend: [
      { label: 'Low TI (Dust)', color: '#4338CA' },
      { label: 'High TI (Bedrock)', color: '#06B6D4' }
    ],
    description: 'Real calibrated nighttime IR (100m) from 2001 Mars Odyssey THEMIS.'
  },
  {
    id: 'crism',
    name: '5. CRISM Mineralogy',
    category: 'spectral',
    file: '/data/layers/crism_mineral.png',
    visible: false,
    opacity: 0.70,
    blendMode: 'screen',
    isSimulated: false,
    legend: [
      { label: 'Mg-Sulfates', color: '#D946EF' },
      { label: 'Smectite Clays', color: '#06B6D4' },
      { label: 'Hematite', color: '#F59E0B' }
    ],
    description: 'Hydrated mineral detections correlated with Curiosity ChemCam and MRO CRISM.'
  },
  {
    id: 'geology',
    name: '6. USGS Geologic Units',
    category: 'base',
    file: '/data/layers/usgs_geology.png',
    visible: false,
    opacity: 0.60,
    blendMode: 'screen',
    isSimulated: false,
    legend: [
      { label: 'Nb (Boxwork)', color: '#8B5CF6' },
      { label: 'Sbu (Sulfates)', color: '#EAB308' },
      { label: 'Cbu (Clays)', color: '#10B981' },
      { label: 'Ad (Dunes)', color: '#78350F' }
    ],
    description: 'USGS SIM-3482 digitized stratigraphic unit contacts for lower Mount Sharp.'
  },
  {
    id: 'hazard',
    name: '7. Hazard Exclusion Mask',
    category: 'hazard',
    file: '/data/layers/hazard_mask.png',
    visible: true,
    opacity: 0.85,
    blendMode: 'normal',
    isSimulated: false,
    description: 'Active tactical exclusion: slopes >20°, scarp gradient drops, and roughness.'
  }
];

export const useLayerStore = create<LayerState>((set) => ({
  layers: INITIAL_LAYERS,

  toggleLayerVisibility: (id: string) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    }));
  },

  setLayerOpacity: (id: string, opacity: number) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, opacity } : l))
    }));
  },

  setLayerBlendMode: (id: string, blendMode: LayerConfig['blendMode']) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, blendMode } : l))
    }));
  }
}));
