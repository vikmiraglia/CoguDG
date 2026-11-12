/**
 * Procedural Web Audio synthesizer & haptic feedback engine for COGU
 * Zero external audio dependencies; generates rich tactile sounds for cards, tension, and loss.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public triggerHaptic(pattern: number | number[]) {
    if (!this.enabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }

  /**
   * Subtle crisp click for UI buttons
   */
  public playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const pitchShift = 0.95 + Math.random() * 0.1;
      osc.frequency.setValueAtTime(520 * pitchShift, now);
      osc.frequency.exponentialRampToValueAtTime(240 * pitchShift, now + 0.045);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      this.triggerHaptic(8);
    } catch {}
  }

  /**
   * Suspenseful heartbeat & rising shimmer when pressing/drawing a card
   * Scales pitch with tension intensity [0..1]
   */
  public playSuspenseRoll(intensity: number = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Low heartbeat thump
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(95 + intensity * 35, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(42, now + 0.22);

      thumpGain.gain.setValueAtTime(0.001, now);
      thumpGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.25);

      // Mystical rising chime
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sine';
      const baseFreq = 320 + intensity * 180;
      shimmerOsc.frequency.setValueAtTime(baseFreq, now + 0.05);
      shimmerOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.32);

      shimmerGain.gain.setValueAtTime(0.001, now + 0.05);
      shimmerGain.gain.linearRampToValueAtTime(0.07, now + 0.12);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 0.05);
      shimmerOsc.stop(now + 0.36);

      this.triggerHaptic([15, 40, 20]);
    } catch {}
  }

  /**
   * Crisp card flip & mystical chord reveal when surviving the draw
   */
  public playCardReveal(intensity: number = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Filtered noise burst for physical card snap
      const bufferSize = ctx.sampleRate * 0.09;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // Warm golden reveal harmonic (two oscillators)
      const freqs = [440 + intensity * 60, 659.25 + intensity * 90];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f * 0.92, now + 0.03);
        osc.frequency.exponentialRampToValueAtTime(f, now + 0.22);

        gain.gain.setValueAtTime(0.001, now + 0.03);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.09 : 0.05, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.03);
        osc.stop(now + 0.4);
      });

      this.triggerHaptic(25);
    } catch {}
  }

  /**
   * Dramatic "VIRE O COPO!" siren + sub-bass drop when the player loses
   */
  public playLossSiren() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Sub-bass impact drop
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(210, now);
      subOsc.frequency.exponentialRampToValueAtTime(52, now + 0.65);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.24, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.75);

      // Dissonant brassy alarm chord
      const alarmFreqs = [311.13, 370.0, 440.0];
      alarmFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        osc.frequency.linearRampToValueAtTime(freq * 0.78, now + 0.58);

        gain.gain.setValueAtTime(0.001, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.04 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 0.68);
      });

      this.triggerHaptic([80, 50, 120, 50, 220]);
    } catch {}
  }

  /**
   * Celebratory fanfare when shuffling or surviving all 60 cards
   */
  public playFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + i * 0.075;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      });
      this.triggerHaptic([20, 30, 40]);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
