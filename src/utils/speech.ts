/**
 * Marswalk Synthesized Voice Assistant (Web Speech API)
 * Astronaut wrist/helmet audio feedback
 */

class VoiceAssistant {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const select = () => {
      const voices = this.synth!.getVoices();
      // Prefer clear English synthesized voices
      this.voice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0] ||
        null;
    };

    select();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = select;
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  public speak(text: string, priority: boolean = false) {
    if (!this.enabled || !this.synth) return;

    if (priority) {
      this.synth.cancel(); // Interrupt existing utterance for emergency
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 1.05; // Crisp, slightly brisk military/space cadence
    utterance.pitch = 0.95; // Authoritative lower pitch
    utterance.volume = 0.9;

    this.synth.speak(utterance);
  }

  public announceWaypoint(name: string, distanceMeters: number, maxSlope: number) {
    const km = (distanceMeters / 1000).toFixed(1);
    const slopeText = maxSlope > 14 ? `Caution: Maximum slope ${maxSlope} degrees.` : 'Terrain gradient nominal.';
    this.speak(`Next waypoint: ${name}. Traversal distance: ${km} kilometers. ${slopeText}`);
  }

  public announceAbort() {
    this.speak('Emergency return protocol engaged. Plotting shortest safe vector to habitat airlock. Increase pace to 1.1 meters per second.', true);
  }
}

export const marsVoice = new VoiceAssistant();
