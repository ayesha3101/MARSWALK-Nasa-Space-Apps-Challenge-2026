import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  Layers, 
  Play, 
  ShieldAlert, 
  Sparkles, 
  X,
  CheckCircle2
} from 'lucide-react';
import { useHudStore } from '../../stores/useHudStore';

export const GuidedTourModal: React.FC = () => {
  const { activeModal, closeModal } = useHudStore();
  const [currentStep, setCurrentStep] = useState(0);

  if (activeModal !== 'tour') return null;

  const steps = [
    {
      title: 'Welcome to MARSWALK',
      subtitle: 'EVA Planning & Telemetry HUD for Gale Crater',
      icon: Sparkles,
      iconColor: 'text-mars-cyan',
      description:
        'MARSWALK is the tactical navigation tablet for the first astronauts walking on Mars. It synthesizes real NASA topography, Curiosity in-situ radiation, slope constraints, and suit oxygen consumption into a live tactical system.',
      tip: 'The top bar displays live Martian Local Mean Solar Time (LMST), Sol clock, and your next satellite communication pass.'
    },
    {
      title: 'Slope-Aware Route Engine',
      subtitle: 'A* Pathfinding on 19.5m Elevation Cost Grid',
      icon: Compass,
      iconColor: 'text-mars-rust',
      description:
        'Slopes exceeding 20° are suit-mobility hard limits and blocked. You can toggle between "Safest" (favors valleys, minimal metabolic strain) and "Fastest" modes. Drag any waypoint marker on the map to recompute the route live in a background Web Worker.',
      tip: 'Click any waypoint in the left drawer to inspect scientific directives and view real Curiosity Mastcam reconnaissance photos.'
    },
    {
      title: 'Scientific Data Layers',
      subtitle: 'Multi-Spectral & Geological Overlays',
      icon: Layers,
      iconColor: 'text-mars-cyan',
      description:
        'Toggle and blend 8 distinct layers: HiRISE optical base, DEM hillshade, slope gradient, THEMIS thermal inertia, CRISM hydrated minerals, and USGS geologic units. Adjust opacities and blend modes seamlessly.',
      tip: 'All synthetic layers are explicitly tagged [SIMULATED] in our Data Honesty commitment. Never fake silently.'
    },
    {
      title: 'EVA Timeline & Emergency Abort',
      subtitle: 'Dynamic Scrubber & Life Support Safeguards',
      icon: ShieldAlert,
      iconColor: 'text-mars-red',
      description:
        'Use the bottom timeline scrubber to simulate the entire 3+ hour traverse at 1x, 5x, or 20x speed. Watch the astronaut marker navigate the terrain while real-time O2 reserves, suit battery, and metabolic burn update live.',
      tip: 'If an anomaly occurs, press "EMERGENCY RETURN // ABORT TO HAB" to immediately calculate the fastest slope-safe escape vector home.'
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeModal();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-lg bg-mars-dark border border-mars-border rounded-xl shadow-2xl overflow-hidden text-xs">
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Header */}
        <div className="p-3.5 bg-mars-void border-b border-mars-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-mars-rust/20 border border-mars-rust text-[10px] text-mars-rust font-bold">
              STEP {currentStep + 1} OF {steps.length}
            </span>
            <span className="font-heading font-bold text-xs uppercase text-mars-text">
              Tactical Tour
            </span>
          </div>
          <button onClick={closeModal} className="p-1 rounded text-mars-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-mars-void border border-mars-border">
              <StepIcon className={`w-6 h-6 ${step.iconColor}`} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-mars-text">
                {step.title}
              </h3>
              <p className="text-[11px] text-mars-cyan">
                {step.subtitle}
              </p>
            </div>
          </div>

          <p className="text-mars-text leading-relaxed text-[11px]">
            {step.description}
          </p>

          <div className="p-2.5 rounded bg-mars-void/60 border border-mars-border text-[10px] text-mars-muted flex items-start space-x-2">
            <span className="text-mars-amber font-bold shrink-0">TACTICAL TIP:</span>
            <span>{step.tip}</span>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-1.5 pt-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-6 bg-mars-cyan shadow-hud-glow'
                    : 'w-2 bg-mars-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-3.5 bg-mars-void border-t border-mars-border flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded border text-xs flex items-center space-x-1 font-heading transition-all ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed border-transparent text-mars-dim'
                : 'border-mars-border text-mars-muted hover:text-white hover:border-mars-border-active'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded bg-mars-rust hover:bg-mars-rust-light text-white font-heading font-bold text-xs uppercase tracking-wider shadow-rust-glow transition-all flex items-center space-x-1.5"
          >
            <span>{currentStep === steps.length - 1 ? 'Start Mission' : 'Next'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
