/**
 * Voice narration engine using the Web Speech Synthesis API.
 * 100% native in all browsers (Android, iOS Safari, Chrome, Edge),
 * zero latency, zero external API keys needed, works offline.
 */

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  public enabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private initialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer high-quality Brazilian Portuguese voices
    const ptVoices = voices.filter(
      (v) => v.lang === 'pt-BR' || v.lang.startsWith('pt')
    );

    // Prefer natural/Google/Luciana/Felipe/Francisca voices if present
    const best =
      ptVoices.find((v) => /natural|google|luciana|felipe|francisca/i.test(v.name)) ||
      ptVoices.find((v) => v.lang === 'pt-BR') ||
      ptVoices[0] ||
      null;

    this.selectedVoice = best;
    this.initialized = true;
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.enabled || !this.synth || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel previous speech if still talking
      this.synth.cancel();

      // Clean up punctuation and formatting for natural spoken speech
      const cleanText = text
        .replace(/["“”«»]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.02; // natural lively party rhythm
      utterance.pitch = 1.0;

      if (!this.selectedVoice && !this.initialized) {
        this.initVoices();
      }

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      // Resume if browser suspended audio context
      if (this.synth.paused) {
        this.synth.resume();
      }

      this.synth.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public cancel() {
    try {
      if (this.synth) {
        this.synth.cancel();
      }
    } catch {}
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

export const speechEngine = new SpeechEngine();
