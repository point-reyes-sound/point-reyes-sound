/**
 * EdmQuantumFluxSonifier.js
 * Rhythmic EDM Quantum Flux & Phase-Space Render Sonification Engine
 * - 126 BPM deep-tech sidechained sub-kick + lush D-Dorian harmonic pad
 * - 16th-note arpeggiated quantum flux plucks modulated live by bond stretch (R) & entropy (S_config)
 * - Interactive click-to-excite harmonic wavepacket plucks
 */

const DORIAN_SCALE_HZ = [
  146.83, // D3
  174.61, // F3
  220.00, // A3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
];

export class EdmQuantumFluxSonifier {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.padGain = null;
    this.padFilter = null;
    this.padOscs = [];
    this.timerId = null;
    this.isPlaying = false;
    this.stepIndex = 0;
    this.bpm = 126;

    // Live simulation telemetry [0, 1]
    this.telemetry = {
      stretchNorm: 0.45,
      entropyNorm: 0.55,
      couplingNorm: 0.5,
    };
  }

  ensureContext() {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  updateTelemetry({ stretchNorm = 0.45, entropyNorm = 0.55, couplingNorm = 0.5 } = {}) {
    this.telemetry.stretchNorm = Math.max(0, Math.min(1, stretchNorm));
    this.telemetry.entropyNorm = Math.max(0, Math.min(1, entropyNorm));
    this.telemetry.couplingNorm = Math.max(0, Math.min(1, couplingNorm));

    if (this.ctx && this.padFilter && this.isPlaying) {
      const now = this.ctx.currentTime;
      const cutoff = 320 + this.telemetry.stretchNorm * 1400 + this.telemetry.couplingNorm * 650;
      this.padFilter.frequency.setTargetAtTime(cutoff, now, 0.08);
    }
  }

  start() {
    const ctx = this.ensureContext();
    if (!ctx || this.isPlaying) return;

    const now = ctx.currentTime;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.24, now + 0.35);
    this.masterGain.connect(ctx.destination);

    // Warm sidechained sub-pad (D2 + A2 + F3)
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.setValueAtTime(680, now);
    this.padFilter.Q.setValueAtTime(1.8, now);

    this.padGain = ctx.createGain();
    this.padGain.gain.setValueAtTime(0.22, now);
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.masterGain);

    const padFreqs = [73.42, 110.0, 174.61, 261.63];
    this.padOscs = padFreqs.map((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx < 2 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1.5) * 7, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(idx < 2 ? 0.18 : 0.12, now);
      osc.connect(g);
      g.connect(this.padFilter);
      osc.start(now);
      return osc;
    });

    this.isPlaying = true;
    this.stepIndex = 0;

    const stepMs = (60 / this.bpm / 4) * 1000; // 16th-note grid at 126 BPM (~119 ms)
    this.timerId = window.setInterval(() => this._tickStep(), stepMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
      } catch {
        // ignore
      }
    }
    const oldOscs = this.padOscs;
    this.padOscs = [];
    setTimeout(() => {
      oldOscs.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      });
    }, 280);
  }

  _tickStep() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const step = this.stepIndex % 16;
    const { stretchNorm, entropyNorm, couplingNorm } = this.telemetry;

    // 1. 4-on-the-floor EDM sub-kick + sidechain pump on beats 0, 4, 8, 12
    if (step % 4 === 0) {
      this._triggerKick(now);
      if (this.padGain) {
        this.padGain.gain.cancelScheduledValues(now);
        this.padGain.gain.setValueAtTime(0.06, now);
        this.padGain.gain.exponentialRampToValueAtTime(0.24, now + 0.19);
      }
    }

    // 2. Crisp off-beat hi-hat / quantum static shimmer on 2, 6, 10, 14
    if (step % 4 === 2) {
      this._triggerHat(now, 0.045 + entropyNorm * 0.04);
    }

    // 3. Polyrhythmic 16th-note EDM quantum flux arpeggio driven by entropy & stretch
    const activePattern =
      entropyNorm > 0.65
        ? [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0]
        : entropyNorm > 0.3
        ? [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1]
        : [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];

    if (activePattern[step]) {
      const baseIdx = Math.floor(stretchNorm * 4);
      const arpOffset = [0, 2, 4, 5, 7, 4, 6, 2][step % 8];
      const noteIdx = Math.min(DORIAN_SCALE_HZ.length - 1, baseIdx + arpOffset);
      const freq = DORIAN_SCALE_HZ[noteIdx];
      const filterPeak = 750 + stretchNorm * 2800 + couplingNorm * 900;
      this._triggerFluxPluck(now, freq, filterPeak, 0.14 + entropyNorm * 0.08);
    }

    this.stepIndex += 1;
  }

  _triggerKick(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(118, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.085);

    gain.gain.setValueAtTime(0.58, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  _triggerHat(now, level) {
    const osc = this.ctx.createOscillator();
    const hp = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(6400 + Math.random() * 1400, now);
    hp.type = "highpass";
    hp.frequency.setValueAtTime(5200, now);

    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.055);

    osc.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  _triggerFluxPluck(now, freq, filterPeak, level) {
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    sub.type = "triangle";
    sub.frequency.setValueAtTime(freq * 1.5, now);

    filter.type = "lowpass";
    filter.Q.setValueAtTime(4.2, now);
    filter.frequency.setValueAtTime(filterPeak, now);
    filter.frequency.exponentialRampToValueAtTime(240, now + 0.14);

    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.18);
    sub.stop(now + 0.18);
  }

  /**
   * Interactive click-to-excite harmonic wavepacket pluck (works even if EDM loop is paused).
   */
  triggerQuantumPluck(pitchNorm = 0.5, intensity = 0.8) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const idx = Math.min(
      DORIAN_SCALE_HZ.length - 1,
      Math.max(0, Math.round(pitchNorm * (DORIAN_SCALE_HZ.length - 1)))
    );
    const freq = DORIAN_SCALE_HZ[idx];

    const dest = this.masterGain || ctx.destination;
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    mod.type = "triangle";
    mod.frequency.setValueAtTime(freq * 2.0, now);
    modGain.gain.setValueAtTime(freq * 0.9 * intensity, now);
    modGain.gain.exponentialRampToValueAtTime(1, now + 0.25);

    gain.gain.setValueAtTime(0.16 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.45);

    mod.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    mod.start(now);
    osc.stop(now + 0.48);
    mod.stop(now + 0.48);
  }
}
