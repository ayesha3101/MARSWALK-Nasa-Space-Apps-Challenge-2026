// Web Audio Tactical Sound Synthesizer for Mars EVA HUD
// Pure Web Audio API — works 100% offline with zero external audio assets

import { useHudStore } from '../stores/useHudStore';

class MarsAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private isMuted(): boolean {
    return useHudStore.getState().isAudioMuted;
  }

  /**
   * Subtle tactical click for buttons, tabs, toggles
   */
  public playClick(freq = 1200, duration = 0.04) {
    if (this.isMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Resonant double-pulse beacon chime for selecting a Waypoint
   */
  public playWaypointBeacon() {
    if (this.isMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [
        { f: 880, start: 0, dur: 0.08 },
        { f: 1320, start: 0.09, dur: 0.12 }
      ].forEach(({ f, start, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + start);

        gain.gain.setValueAtTime(0.06, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Silently catch
    }
  }

  /**
   * Route locked / recalculated ascending sequence
   */
  public playRouteSolved() {
    if (this.isMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [
        { f: 523.25, start: 0, dur: 0.06 },   // C5
        { f: 659.25, start: 0.05, dur: 0.06 }, // E5
        { f: 783.99, start: 0.10, dur: 0.12 }  // G5
      ].forEach(({ f, start, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + start);

        gain.gain.setValueAtTime(0.05, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Silently catch
    }
  }

  /**
   * Caution pulse for slope limit / hazard proximity
   */
  public playWarning() {
    if (this.isMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.18);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Silently catch
    }
  }
}

export const marsAudio = new MarsAudioSynthesizer();
