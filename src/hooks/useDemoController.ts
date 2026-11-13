import { useEffect, useRef } from 'react';
import { useHudStore } from '../stores/useHudStore';
import { useTimelineStore } from '../stores/useTimelineStore';
import { useMissionStore } from '../stores/useMissionStore';
import { useRouteStore } from '../stores/useRouteStore';
import { marsVoice } from '../utils/speech';

/**
 * Controller for Demo Mode.
 * When enabled:
 * 1. Resets EVA simulation to t=0
 * 2. Starts 5x playback
 * 3. Narrates key mission milestones as astronaut progresses
 * 4. Switches smoothly between 2D tactical map and 3D terrain flyover
 */
export const useDemoController = () => {
  const isDemoMode = useHudStore((s) => s.isDemoMode);
  const toggleDemoMode = useHudStore((s) => s.toggleDemoMode);
  const setViewMode = useHudStore((s) => s.setViewMode);
  const openModal = useHudStore((s) => s.openModal);

  const waypoints = useMissionStore((s) => s.waypoints);
  const solvedRoute = useRouteStore((s) => s.solvedRoute);

  const play = useTimelineStore((s) => s.play);
  const pause = useTimelineStore((s) => s.pause);
  const setSpeed = useTimelineStore((s) => s.setSpeed);
  const scrubToTime = useTimelineStore((s) => s.scrubToTime);

  const announcedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isDemoMode) {
      announcedRef.current.clear();
      return;
    }

    announcedRef.current.clear();
    scrubToTime(0);
    setSpeed(5);
    play();

    marsVoice.speak("Initiating automated EVA Demonstration Mode. Commencing Gale Crater Sol 1 traverse.");

    // Listen to timeline progress to trigger automatic cinematic narration
    const unsubscribe = useTimelineStore.subscribe((state) => {
      const current = state.currentTimeSec;
      const total = solvedRoute ? solvedRoute.totalTimeSeconds : 10800;

      // Milestone 1: 15% in — Habitat egress complete
      if (current > total * 0.12 && !announcedRef.current.has('egress')) {
        announcedRef.current.add('egress');
        marsVoice.speak("Egress nominal. Astronauts EV-1 and EV-2 navigating baseline scree slope.");
      }

      // Milestone 2: 30% in — Arriving at Stop 1 Ridge Fracture Alpha
      if (current > total * 0.28 && !announcedRef.current.has('stop1')) {
        announcedRef.current.add('stop1');
        marsVoice.speak("Approaching Stop 1: Ridge Fracture Alpha. Boxwork hydrothermal vein exhumation.");
      }

      // Milestone 3: 50% in — Switch to 3D Flyover
      if (current > total * 0.48 && !announcedRef.current.has('switch3d')) {
        announcedRef.current.add('switch3d');
        setViewMode('3D');
        marsVoice.speak("Switching to 3D Flyover mode. Topography draped with real Context Camera imagery.");
      }

      // Milestone 4: 75% in — Rover rendezvous
      if (current > total * 0.72 && !announcedRef.current.has('rover')) {
        announcedRef.current.add('rover');
        marsVoice.speak("Rendezvous with Ares-4 Pressurized Rover. Sample canister transfer complete.");
      }

      // Milestone 5: 98% in — Return to Hab & finish
      if (current >= total * 0.98 && !announcedRef.current.has('finished')) {
        announcedRef.current.add('finished');
        pause();
        setViewMode('2D');
        marsVoice.speak("EVA-1 traverse concluded successfully. All science objectives accomplished.");
        toggleDemoMode();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isDemoMode, solvedRoute, play, pause, setSpeed, scrubToTime, setViewMode, toggleDemoMode]);
};
