/**
 * QuantumSonificationEngine.js
 * "The Physics Is the Sound"
 * Concert Grand Piano Acoustic Synthesizer with Solid Bass Backbone,
 * Synchronous Strong Backbeat, and Multi-Tier Phase-Locked Virtuoso Solo Lines (Canon in D)
 * - Layer 1 (p-polarization excitation): 16th-note lyrical descending runs.
 * - Layer 2 (d-polarization excitation): Double-speed rapid arpeggiated string-crossing flourish.
 */

// Note frequencies in Hz (A4 = 440 Hz) across 6 octaves
const N = {
  // Octave 1
  C1: 32.70, Cs1: 34.65, Db1: 34.65, D1: 36.71, Ds1: 38.89, Eb1: 38.89, E1: 41.20, F1: 43.65, Fs1: 46.25, Gb1: 46.25, G1: 49.00, Gs1: 51.91, Ab1: 51.91, A1: 55.00, As1: 58.27, Bb1: 58.27, B1: 61.74,
  // Octave 2
  C2: 65.41, Cs2: 69.30, Db2: 69.30, D2: 73.42, Ds2: 77.78, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, Gb2: 92.50, G2: 98.00, Gs2: 103.83, Ab2: 103.83, A2: 110.00, As2: 116.54, Bb2: 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, Cs3: 138.59, Db3: 138.59, D3: 146.83, Ds3: 155.56, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, Gb3: 185.00, G3: 196.00, Gs3: 207.65, Ab3: 207.65, A3: 220.00, As3: 233.08, Bb3: 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, Cs4: 277.18, Db4: 277.18, D4: 293.66, Ds4: 311.13, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, Gb4: 369.99, G4: 392.00, Gs4: 415.30, Ab4: 415.30, A4: 440.00, As4: 466.16, Bb4: 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, Cs5: 554.37, Db5: 554.37, D5: 587.33, Ds5: 622.25, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, Gb5: 739.99, G5: 783.99, Gs5: 830.61, Ab5: 830.61, A5: 880.00, As5: 932.33, Bb5: 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.50, Cs6: 1108.73, Db6: 1108.73, D6: 1174.66, Ds6: 1244.51, Eb6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, Gb6: 1479.98, G6: 1567.98, Gs6: 1661.22, Ab6: 1661.22, A6: 1760.00, Bb6: 1864.66, B6: 1975.53
};

// ============================================================================
// 1. PACHELBEL'S CANON IN D (For H₂ / Covalent Ground State)
// ============================================================================
const CANON_PROGRESSION = [
  // 1. D Major: Heavy Low Bass (D1 + A1 + D2), Chords (F#3, A3, D4, F#4)
  {
    bassRoot: N.D1, bassOctave: N.D2, bassFifth: N.A1,
    arpeggio: [N.Fs3, N.A3, N.D4, N.Fs4],
    name: "D Major"
  },
  // 2. A Major: Heavy Low Bass (A1 + E2 + A2), Chords (E3, A3, Cs4, E4)
  {
    bassRoot: N.A1, bassOctave: N.A2, bassFifth: N.E2,
    arpeggio: [N.E3, N.A3, N.Cs4, N.E4],
    name: "A Major"
  },
  // 3. B Minor: Heavy Low Bass (B1 + F#2 + B2), Chords (D3, F#3, B3, D4)
  {
    bassRoot: N.B1, bassOctave: N.B2, bassFifth: N.Fs2,
    arpeggio: [N.D3, N.Fs3, N.B3, N.D4],
    name: "B Minor"
  },
  // 4. F# Minor: Heavy Low Bass (F#1 + C#2 + F#2), Chords (Cs3, F#3, A3, Cs4)
  {
    bassRoot: N.Fs1, bassOctave: N.Fs2, bassFifth: N.Cs2,
    arpeggio: [N.Cs3, N.Fs3, N.A3, N.Cs4],
    name: "F# Minor"
  },
  // 5. G Major: Heavy Low Bass (G1 + D2 + G2), Chords (D3, G3, B3, D4)
  {
    bassRoot: N.G1, bassOctave: N.G2, bassFifth: N.D2,
    arpeggio: [N.D3, N.G3, N.B3, N.D4],
    name: "G Major"
  },
  // 6. D Major: Heavy Low Bass (D1 + A1 + D2), Chords (A2, D3, F#3, A3)
  {
    bassRoot: N.D1, bassOctave: N.D2, bassFifth: N.A1,
    arpeggio: [N.A2, N.D3, N.Fs3, N.A3],
    name: "D Major"
  },
  // 7. G Major: Heavy Low Bass (G1 + D2 + G2), Chords (D3, G3, B3, G4)
  {
    bassRoot: N.G1, bassOctave: N.G2, bassFifth: N.D2,
    arpeggio: [N.D3, N.G3, N.B3, N.G4],
    name: "G Major"
  },
  // 8. A Major: Heavy Low Bass (A1 + E2 + A2), Chords (E3, A3, Cs4, A4)
  {
    bassRoot: N.A1, bassOctave: N.A2, bassFifth: N.E2,
    arpeggio: [N.E3, N.A3, N.Cs4, N.A4],
    name: "A Major"
  }
];

const CANON_MELODY = [
  N.Fs4, N.E4, N.D4, N.Cs4, N.B3, N.A3, N.B3, N.Cs4
];

const CANON_SOLO_LAYER_1 = [
  // Bar 1 (D Major)
  N.Fs5, N.E5, N.Fs5, N.G5, N.A5, N.B5, N.A5, N.G5,
  // Bar 2 (A Major)
  N.Fs5, N.D5, N.E5, N.Fs5, N.E5, N.D5, N.Cs5, N.B4,
  // Bar 3 (B Minor)
  N.Cs5, N.D5, N.Cs5, N.B4, N.A4, N.G4, N.A4, N.B4,
  // Bar 4 (F# Minor)
  N.A4, N.G4, N.Fs4, N.E4, N.D4, N.E4, N.Fs4, N.G4,
  // Bar 5 (G Major)
  N.Fs4, N.D4, N.G4, N.Fs4, N.E4, N.B4, N.A4, N.G4,
  // Bar 6 (D Major)
  N.Fs4, N.D4, N.E4, N.Fs4, N.G4, N.A4, N.B4, N.Cs5,
  // Bar 7 (G Major)
  N.D5, N.Cs5, N.B4, N.A4, N.B4, N.Cs5, N.D5, N.E5,
  // Bar 8 (A Major)
  N.Cs5, N.B4, N.A4, N.G4, N.A4, N.B4, N.Cs5, N.D5
];

const CANON_SOLO_LAYER_2 = [
  // Bar 1 (D Major)
  N.Fs5, N.D5, N.A5, N.Fs5, N.D5, N.Fs5, N.A5, N.D6,
  // Bar 2 (A Major)
  N.E5, N.Cs5, N.A5, N.E5, N.Cs5, N.E5, N.A5, N.Cs6,
  // Bar 3 (B Minor)
  N.D5, N.B4, N.Fs5, N.D5, N.B4, N.D5, N.Fs5, N.B5,
  // Bar 4 (F# Minor)
  N.Cs5, N.A4, N.E5, N.Cs5, N.A4, N.Cs5, N.E5, N.A5,
  // Bar 5 (G Major)
  N.B4, N.G4, N.D5, N.B4, N.G4, N.B4, N.D5, N.G5,
  // Bar 6 (D Major)
  N.A4, N.Fs4, N.D5, N.A4, N.Fs4, N.A4, N.D5, N.Fs5,
  // Bar 7 (G Major)
  N.B4, N.G4, N.D5, N.B4, N.G4, N.B4, N.D5, N.G5,
  // Bar 8 (A Major)
  N.Cs5, N.A4, N.E5, N.Cs5, N.A4, N.Cs5, N.E5, N.A5
];

// ============================================================================
// 2. CLAUDE DEBUSSY — PREMIÈRE ARABESQUE IN E MAJOR (For He₂ / Dispersion Dimer)
// ============================================================================
const ARABESQUE_PROGRESSION = [
  // 1. E Major (Ground): Soft Open Bass (E1 + B1 + E2), Floating Chords (G#3, B3, E4, G#4)
  {
    bassRoot: N.E1, bassOctave: N.E2, bassFifth: N.B1,
    arpeggio: [N.Gs3, N.B3, N.E4, N.Gs4],
    name: "E Major"
  },
  // 2. A Major / E (Suspended Dispersion): Bass (E1 + A2), Chords (A3, C#4, E4, A4)
  {
    bassRoot: N.E1, bassOctave: N.A2, bassFifth: N.E2,
    arpeggio: [N.A3, N.Cs4, N.E4, N.A4],
    name: "A Major / E"
  },
  // 3. F# Minor 7: Bass (F#1 + C#2 + F#2), Chords (A3, C#4, E4, F#4)
  {
    bassRoot: N.Fs1, bassOctave: N.Fs2, bassFifth: N.Cs2,
    arpeggio: [N.A3, N.Cs4, N.E4, N.Fs4],
    name: "F# Minor 7"
  },
  // 4. B Dominant 7 / Susp: Bass (B1 + F#2 + B2), Chords (A3, D#4, F#4, B4)
  {
    bassRoot: N.B1, bassOctave: N.B2, bassFifth: N.Fs2,
    arpeggio: [N.A3, N.Ds4, N.Fs4, N.B4],
    name: "B7"
  },
  // 5. G# Minor 7: Bass (G#1 + D#2 + G#2), Chords (B3, D#4, F#4, G#4)
  {
    bassRoot: N.Gs1, bassOctave: N.Gs2, bassFifth: N.Ds2,
    arpeggio: [N.B3, N.Ds4, N.Fs4, N.Gs4],
    name: "G# Minor 7"
  },
  // 6. C# Minor 7: Bass (C#1 + G#2 + C#2), Chords (E3, G#3, B3, E4)
  {
    bassRoot: N.Cs1, bassOctave: N.Cs2, bassFifth: N.Gs2,
    arpeggio: [N.E3, N.Gs3, N.B3, N.E4],
    name: "C# Minor 7"
  },
  // 7. Aadd9 / F#: Bass (F#1 + C#2 + A2), Chords (A3, B3, E4, G#4)
  {
    bassRoot: N.Fs1, bassOctave: N.Fs2, bassFifth: N.Cs2,
    arpeggio: [N.A3, N.B3, N.E4, N.Gs4],
    name: "Aadd9"
  },
  // 8. E Major Full Release: Bass (E1 + B1 + E2), Chords (G#3, B3, E4, B4)
  {
    bassRoot: N.E1, bassOctave: N.E2, bassFifth: N.B1,
    arpeggio: [N.Gs3, N.B3, N.E4, N.B4],
    name: "E Major"
  }
];

const ARABESQUE_MELODY = [
  N.B4, N.Cs5, N.A4, N.Gs4, N.B4, N.Gs4, N.Fs4, N.E4
];

// Layer 1: p-polarization excitation (16th-note flowing Debussy Arabesque cascades)
const ARABESQUE_SOLO_LAYER_1 = [
  // Bar 1 (E Major) - Descending curved arabesque
  N.B5, N.Gs5, N.Fs5, N.E5, N.Ds5, N.Cs5, N.B4, N.Gs4,
  // Bar 2 (A Major)
  N.Cs5, N.B4, N.A4, N.Gs4, N.Fs4, N.E4, N.Ds4, N.Cs4,
  // Bar 3 (F# Minor 7) - Lyrical rise & fall
  N.Fs4, N.A4, N.Cs5, N.E5, N.Fs5, N.E5, N.Ds5, N.Cs5,
  // Bar 4 (B7)
  N.Ds5, N.Cs5, N.B4, N.A4, N.Gs4, N.Fs4, N.E4, N.Ds4,
  // Bar 5 (G# Minor 7)
  N.Gs4, N.B4, N.Ds5, N.Fs5, N.Gs5, N.Fs5, N.E5, N.Ds5,
  // Bar 6 (C# Minor 7)
  N.E5, N.Ds5, N.Cs5, N.B4, N.A4, N.Gs4, N.Fs4, N.E4,
  // Bar 7 (Aadd9) - Flowing scalar return
  N.Fs4, N.Gs4, N.A4, N.B4, N.Cs5, N.Ds5, N.E5, N.Fs5,
  // Bar 8 (E Major)
  N.Gs5, N.Fs5, N.E5, N.Ds5, N.Cs5, N.B4, N.A4, N.Gs4
];

// Layer 2: d-polarization excitation (Rapid Virtuoso 3-Octave Shimmering Arabesque Flourish)
const ARABESQUE_SOLO_LAYER_2 = [
  // Bar 1 (E Major - high octave dispersion ripple)
  N.E5, N.Gs5, N.B5, N.E6, N.B5, N.Gs5, N.E5, N.B4,
  // Bar 2 (A Major)
  N.A4, N.Cs5, N.E5, N.A5, N.E5, N.Cs5, N.A4, N.E4,
  // Bar 3 (F# Minor 7)
  N.Fs4, N.A4, N.Cs5, N.Fs5, N.Cs5, N.A4, N.Fs4, N.Cs4,
  // Bar 4 (B7)
  N.B4, N.Ds5, N.Fs5, N.B5, N.Fs5, N.Ds5, N.B4, N.Fs4,
  // Bar 5 (G# Minor 7)
  N.Gs4, N.B4, N.Ds5, N.Gs5, N.Ds5, N.B4, N.Gs4, N.Ds4,
  // Bar 6 (C# Minor 7)
  N.Cs4, N.E4, N.Gs4, N.Cs5, N.E5, N.Gs5, N.Cs6, N.Gs5,
  // Bar 7 (Aadd9) - Ascending shimmer
  N.A4, N.Cs5, N.E5, N.A5, N.B5, N.Cs6, N.Ds6, N.E6,
  // Bar 8 (E Major) - Grand cascading resolution
  N.E6, N.B5, N.Gs5, N.E5, N.B4, N.Gs4, N.E4, N.B3
];

// ============================================================================
// 3. FRÉDÉRIC CHOPIN — NOCTURNE IN E-FLAT MAJOR, OP. 9, NO. 2 (For Li₂ / Metallic Covalent Dimer)
// ============================================================================
const CHOPIN_NOCTURNE_PROGRESSION = [
  // 1. Eb Major (Ground Warmth): Deep 10th Bass (Eb1 + Bb1 + Eb2), Cantabile Chords (G3, Bb3, Eb4, G4)
  {
    bassRoot: N.Eb1, bassOctave: N.Eb2, bassFifth: N.Bb1,
    arpeggio: [N.G3, N.Bb3, N.Eb4, N.G4],
    name: "Eb Major"
  },
  // 2. C Minor 7 (Metallic Core Shift): Bass (C2 + G2 + C3), Chords (Eb3, G3, Bb3, Eb4)
  {
    bassRoot: N.C2, bassOctave: N.C3, bassFifth: N.G2,
    arpeggio: [N.Eb3, N.G3, N.Bb3, N.Eb4],
    name: "Cm7"
  },
  // 3. F Minor 7 (Subdominant Warmth): Bass (F1 + C2 + F2), Chords (Ab3, C4, Eb4, Ab4)
  {
    bassRoot: N.F1, bassOctave: N.F2, bassFifth: N.C2,
    arpeggio: [N.Ab3, N.C4, N.Eb4, N.Ab4],
    name: "Fm7"
  },
  // 4. Bb Dominant 7 (Polarizing Tension): Bass (Bb1 + F2 + Bb2), Chords (Ab3, D4, F4, Bb4)
  {
    bassRoot: N.Bb1, bassOctave: N.Bb2, bassFifth: N.F2,
    arpeggio: [N.Ab3, N.D4, N.F4, N.Bb4],
    name: "Bb7"
  },
  // 5. Eb Major (Lyrical Swell): Bass (Eb1 + Bb1 + Eb2), Chords (G3, Bb3, Eb4, Bb4)
  {
    bassRoot: N.Eb1, bassOctave: N.Eb2, bassFifth: N.Bb1,
    arpeggio: [N.G3, N.Bb3, N.Eb4, N.Bb4],
    name: "Eb Major"
  },
  // 6. G Minor (Inner Core Modulation): Bass (G1 + D2 + G2), Chords (Bb3, D4, G4, Bb4)
  {
    bassRoot: N.G1, bassOctave: N.G2, bassFifth: N.D2,
    arpeggio: [N.Bb3, N.D4, N.G4, N.Bb4],
    name: "Gm"
  },
  // 7. Ab Major / Fm7 (Expanded Orbital Cloud): Bass (Ab1 + Eb2 + Ab2), Chords (C4, Eb4, Ab4, C5)
  {
    bassRoot: N.Ab1, bassOctave: N.Ab2, bassFifth: N.Eb2,
    arpeggio: [N.C4, N.Eb4, N.Ab4, N.C5],
    name: "Ab Major"
  },
  // 8. Bb7 -> Eb Cadence (Delocalized Ground Settlement): Bass (Bb1 + F2 + Eb2), Chords (Ab3, D4, F4, Eb4)
  {
    bassRoot: N.Bb1, bassOctave: N.Eb2, bassFifth: N.F2,
    arpeggio: [N.Ab3, N.D4, N.F4, N.Eb4],
    name: "Bb7 / Eb"
  }
];

const CHOPIN_NOCTURNE_MELODY = [
  N.Bb4, N.G4, N.F4, N.Eb4, N.C5, N.Bb4, N.Ab4, N.Eb4
];

// Layer 1: p-polarization excitation (16th-note Chopin Lyrical Turns & Chromatic Runs)
const CHOPIN_NOCTURNE_SOLO_LAYER_1 = [
  // Bar 1 (Eb Major) - Opening cantabile turn ornament
  N.Bb4, N.C5, N.Bb4, N.A4, N.Bb4, N.G4, N.F4, N.Eb4,
  // Bar 2 (Cm7) - Expressive ascending arch
  N.F4, N.G4, N.Ab4, N.Bb4, N.C5, N.D5, N.Eb5, N.F5,
  // Bar 3 (Fm7) - Graceful descending sweep
  N.Ab5, N.G5, N.F5, N.Eb5, N.D5, N.C5, N.Bb4, N.Ab4,
  // Bar 4 (Bb7) - Dominant chromatic preparation
  N.D5, N.Eb5, N.F5, N.D5, N.Bb4, N.Ab4, N.G4, N.F4,
  // Bar 5 (Eb Major) - Luminous arpeggiated bloom
  N.G4, N.Bb4, N.Eb5, N.G5, N.F5, N.Eb5, N.D5, N.C5,
  // Bar 6 (Gm) - Expressive chromatic sigh
  N.D5, N.F5, N.Bb5, N.A5, N.Bb5, N.G5, N.F5, N.Eb5,
  // Bar 7 (Ab Major) - High soaring scalar ascent
  N.C5, N.D5, N.Eb5, N.F5, N.G5, N.Ab5, N.Bb5, N.C6,
  // Bar 8 (Bb7 / Eb) - Gentle descending cadential cascade
  N.D6, N.C6, N.Bb5, N.Ab5, N.G5, N.F5, N.Eb5, N.D5
];

// Layer 2: d-polarization excitation (Virtuoso 22-Tuplet Chromatic Fiorituras)
const CHOPIN_NOCTURNE_SOLO_LAYER_2 = [
  // Bar 1 (Eb Major - 3-octave high fioritura cascade)
  N.Eb5, N.G5, N.Bb5, N.Eb6, N.D6, N.C6, N.Bb5, N.G5,
  // Bar 2 (Cm7 - Chromatic turn in upper register)
  N.F5, N.Ab5, N.C6, N.Eb6, N.D6, N.C6, N.B5, N.C6,
  // Bar 3 (Fm7 - Virtuoso soaring arc)
  N.Ab5, N.C6, N.Eb6, N.F6, N.Eb6, N.D6, N.C6, N.Bb5,
  // Bar 4 (Bb7 - Chromatic scalar descent)
  N.Bb5, N.D6, N.F6, N.Ab6, N.G6, N.F6, N.Eb6, N.D6,
  // Bar 5 (Eb Major - Double-speed sparkling flourish)
  N.Eb6, N.Bb5, N.G5, N.Eb5, N.G5, N.Bb5, N.Eb6, N.G6,
  // Bar 6 (Gm - Rapid octave shift)
  N.D6, N.Bb5, N.G5, N.D5, N.F5, N.Bb5, N.D6, N.F6,
  // Bar 7 (Ab Major - Brilliant peak fioritura)
  N.C6, N.Eb6, N.Ab6, N.G6, N.F6, N.Eb6, N.D6, N.C6,
  // Bar 8 (Bb7 / Eb - Grand luminous resolving cascade)
  N.Bb5, N.Ab5, N.G5, N.F5, N.Eb5, N.D5, N.C5, N.Bb4
];

export class QuantumSonificationEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.volume = 0.85;
    this.currentPiece = "canon"; // "canon" (H2 default) or "arabesque" (He2)

    // Master Nodes
    this.masterGain = null;
    this.compressor = null;
    this.bassBooster = null;
    this.soundboardFilter = null;

    // Dual Analyzers: Ground vs. Excited Field Spectrum
    this.groundAnalyser = null;
    this.excitedAnalyser = null;
    this.excitedBusGain = null;

    // Concert Soundboard Reverb
    this.reverbGain = null;
    this.convolver = null;

    // Musical timing (Phase-Locked 16th Note Master Clock)
    this.bpm = 68;
    this.beatDuration = 60.0 / this.bpm; // ~0.88s per quarter beat
    this.sixteenthDuration = this.beatDuration * 0.25; // ~0.22s per 16th tick
    this.masterTimer = 0;
    this.masterStep = 0; // 0 to 63 (64 sixteenth notes per 8-bar loop)

    // Custom Piano Harmonic Wave Table
    this.pianoWave = null;

    // Quantum coupling pulse
    this.quantumBeatPulse = 0;

    // Visualizer data buffers
    this.groundFrequencyData = new Uint8Array(64);
    this.groundTimeDomainData = new Uint8Array(128);
    this.excitedFrequencyData = new Uint8Array(64);
    this.excitedTimeDomainData = new Uint8Array(128);
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.audioCtx = new AudioContext();

    // 1. Generate Acoustic Piano Periodic Harmonic Series
    const real = new Float32Array([0, 1.0, 0.65, 0.35, 0.18, 0.09, 0.05, 0.02, 0.01]);
    const imag = new Float32Array(real.length);
    this.pianoWave = this.audioCtx.createPeriodicWave(real, imag);

    // 2. Studio Master Compressor for Grand Piano Dynamics
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.audioCtx.currentTime);
    this.compressor.ratio.setValueAtTime(4.5, this.audioCtx.currentTime);

    // 3. Dedicated Solid Low-End Bass Peaking EQ (Weighty Piano Soundboard)
    this.bassBooster = this.audioCtx.createBiquadFilter();
    this.bassBooster.type = 'lowshelf';
    this.bassBooster.frequency.setValueAtTime(140, this.audioCtx.currentTime);
    this.bassBooster.gain.setValueAtTime(5.5, this.audioCtx.currentTime);

    // 4. Warm Soundboard Lowpass Filter
    this.soundboardFilter = this.audioCtx.createBiquadFilter();
    this.soundboardFilter.type = 'lowpass';
    this.soundboardFilter.frequency.setValueAtTime(4500, this.audioCtx.currentTime);
    this.soundboardFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

    // 5. Dual Analyzers (Ground & Excited Spectral Buses)
    this.groundAnalyser = this.audioCtx.createAnalyser();
    this.groundAnalyser.fftSize = 128;
    this.groundAnalyser.smoothingTimeConstant = 0.82;

    this.excitedAnalyser = this.audioCtx.createAnalyser();
    this.excitedAnalyser.fftSize = 128;
    this.excitedAnalyser.smoothingTimeConstant = 0.75;

    this.excitedBusGain = this.audioCtx.createGain();
    this.excitedBusGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    this.excitedBusGain.connect(this.excitedAnalyser);
    this.excitedAnalyser.connect(this.soundboardFilter);

    // 6. Master Output Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);

    // 7. Concert Hall Impulse Reverb
    this.createConcertReverb();

    // Master Bus Signal Flow:
    this.soundboardFilter.connect(this.bassBooster);
    this.bassBooster.connect(this.groundAnalyser);
    this.groundAnalyser.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.audioCtx.destination);
  }

  createConcertReverb() {
    const rate = this.audioCtx.sampleRate;
    const length = Math.floor(rate * 2.2);
    const impulse = this.audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.55));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolver = this.audioCtx.createConvolver();
    this.convolver.buffer = impulse;

    this.reverbGain = this.audioCtx.createGain();
    this.reverbGain.gain.setValueAtTime(0.28, this.audioCtx.currentTime);

    this.soundboardFilter.connect(this.convolver);
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  start() {
    this.init();
    if (!this.audioCtx) return false;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().then(() => {
          if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setValueAtTime(this.volume * 0.65, this.audioCtx.currentTime);
          }
        }).catch(() => {});
      }
    } catch (e) {}

    this.isPlaying = true;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.65, this.audioCtx.currentTime);
    }
    return true;
  }

  ensureRunning() {
    this.unlockMobileAudio();
  }

  unlockMobileAudio() {
    this.init();
    if (!this.audioCtx) return;

    try {
      // Play a 1-sample silent buffer to unlock iOS Safari AudioContext permanently
      const buffer = this.audioCtx.createBuffer(1, 1, 22050);
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start(0);
    } catch (e) {}

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => {
        if (this.masterGain && this.audioCtx) {
          this.masterGain.gain.setValueAtTime(this.volume * 0.65, this.audioCtx.currentTime);
        }
      }).catch(() => {});
    }
    this.isPlaying = true;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.65, this.audioCtx.currentTime);
    }
  }

  stop() {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
    }
    this.isPlaying = false;
    return false;
  }

  toggle() {
    return this.isPlaying ? this.stop() : this.start();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.isPlaying && this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.65, this.audioCtx.currentTime, 0.03);
    }
  }

  /**
   * Play an acoustic concert grand piano voice
   */
  playPianoKey(freq, duration = 2.4, velocity = 0.8, isBass = false, isSolo = false) {
    if (!this.audioCtx || !this.isPlaying) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    try {
      const now = this.audioCtx.currentTime;

      const noteGain = this.audioCtx.createGain();
      const noteFilter = this.audioCtx.createBiquadFilter();
      noteFilter.type = 'lowpass';

      const startCutoff = isBass 
        ? Math.min(3800, 1200 + velocity * 2200) 
        : isSolo 
          ? Math.min(10500, 4200 + velocity * 5500)
          : Math.min(7500, 2400 + velocity * 4500);
      const endCutoff = isBass ? 450 : isSolo ? 1600 : 950;
      
      noteFilter.frequency.setValueAtTime(startCutoff, now);
      noteFilter.frequency.exponentialRampToValueAtTime(endCutoff, now + 0.35);

      // 1. Hammer Strike Transient
      const hammer = this.audioCtx.createOscillator();
      const hammerGain = this.audioCtx.createGain();
      hammer.type = 'sine';
      hammer.frequency.setValueAtTime(isBass ? freq * 2.5 : freq * 4.0, now);
      hammerGain.gain.setValueAtTime(velocity * (isBass ? 0.35 : 0.25), now);
      hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
      hammer.connect(hammerGain);
      hammerGain.connect(noteGain);
      hammer.start(now);
      hammer.stop(now + 0.025);

      // 2. Grand Piano Paired String Unison
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      if (this.pianoWave) {
        osc1.setPeriodicWave(this.pianoWave);
        osc2.setPeriodicWave(this.pianoWave);
      } else {
        osc1.type = 'triangle';
        osc2.type = 'sine';
      }
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-1.4, now);
      osc2.detune.setValueAtTime(1.4, now);

      const stringGain1 = this.audioCtx.createGain();
      const stringGain2 = this.audioCtx.createGain();
      const strVol = velocity * (isBass ? 0.55 : isSolo ? 0.50 : 0.42);
      stringGain1.gain.setValueAtTime(strVol, now);
      stringGain2.gain.setValueAtTime(strVol, now);

      osc1.connect(stringGain1);
      osc2.connect(stringGain2);
      stringGain1.connect(noteFilter);
      stringGain2.connect(noteFilter);

      // 3. Sub-Harmonic Weight for Deep Bass Notes
      if (isBass && freq < 120) {
        const subOsc = this.audioCtx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq * 0.5, now);
        const subGain = this.audioCtx.createGain();
        subGain.gain.setValueAtTime(velocity * 0.35, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.8);
        subOsc.connect(subGain);
        subGain.connect(noteFilter);
        subOsc.start(now);
        subOsc.stop(now + duration);
      }

      // 4. Acoustic Concert Piano Decay Envelope
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(1.0, now + 0.004);
      noteGain.gain.exponentialRampToValueAtTime(0.65, now + 0.18);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noteFilter.connect(noteGain);

      // Route Excited Solo voice to dedicated Excited Spectrum Analyzer
      if (isSolo && this.excitedBusGain) {
        noteGain.connect(this.excitedBusGain);
      } else {
        noteGain.connect(this.soundboardFilter);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
    } catch (e) {
      console.warn("playPianoKey warning:", e);
    }
  }

  triggerBackbeatKick(now, velocity = 0.8) {
    if (!this.audioCtx || !this.isPlaying) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);

    gain.gain.setValueAtTime(velocity * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.bassBooster);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  triggerBackbeatSnare(now, velocity = 0.7) {
    if (!this.audioCtx || !this.isPlaying) return;

    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

    oscGain.gain.setValueAtTime(velocity * 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.soundboardFilter);
    osc.start(now);
    osc.stop(now + 0.14);

    const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.12);
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.32, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.soundboardFilter);

    whiteNoise.start(now);
  }

  setElement(symbol) {
    if (symbol === "He") {
      this.currentPiece = "arabesque";
    } else if (symbol === "Li") {
      this.currentPiece = "chopin";
    } else {
      this.currentPiece = "canon";
    }
  }

  setPiece(pieceName) {
    this.currentPiece = pieceName;
  }

  update(dt, quantumState) {
    if (!this.audioCtx || !this.isPlaying) return;

    this.quantumBeatPulse = Math.max(0, this.quantumBeatPulse - dt * 2.5);

    this.masterTimer += dt;
    if (this.masterTimer >= this.sixteenthDuration) {
      this.masterTimer = 0;
      this.masterStep = (this.masterStep + 1) % 64; // 64 16th-notes per 8-measure progression
      const now = this.audioCtx.currentTime;

      // Select active score arrays based on molecule (Canon in D vs Debussy Arabesque vs Chopin Nocturne)
      const activeProgression = this.currentPiece === "chopin"
        ? CHOPIN_NOCTURNE_PROGRESSION
        : this.currentPiece === "arabesque" 
          ? ARABESQUE_PROGRESSION 
          : CANON_PROGRESSION;

      const activeMelody = this.currentPiece === "chopin"
        ? CHOPIN_NOCTURNE_MELODY
        : this.currentPiece === "arabesque" 
          ? ARABESQUE_MELODY 
          : CANON_MELODY;

      const activeSolo1 = this.currentPiece === "chopin"
        ? CHOPIN_NOCTURNE_SOLO_LAYER_1
        : this.currentPiece === "arabesque" 
          ? ARABESQUE_SOLO_LAYER_1 
          : CANON_SOLO_LAYER_1;

      const activeSolo2 = this.currentPiece === "chopin"
        ? CHOPIN_NOCTURNE_SOLO_LAYER_2
        : this.currentPiece === "arabesque" 
          ? ARABESQUE_SOLO_LAYER_2 
          : CANON_SOLO_LAYER_2;

      // Each bar = 8 sixteenth-note steps (2 beats = 8 sixteenths)
      const barIndex = Math.floor(this.masterStep / 8) % activeProgression.length;
      const stepInBar = this.masterStep % 8;
      const prog = activeProgression[barIndex];
      const pExc = quantumState.pExcitation || 0.0;
      const dExc = quantumState.dExcitation || 0.0;
      const perturb = quantumState.perturbation || 0.0;

      // ============================================================
      // 1. SOLID BASS BACKBONE (On Step 0 of each bar)
      // ============================================================
      if (stepInBar === 0) {
        this.quantumBeatPulse = 1.0;
        const bassVel = 0.92 * (0.8 + 0.2 * (quantumState.occ0 / 2.0));
        const bassTail = this.beatDuration * 3.8;

        this.playPianoKey(prog.bassRoot, bassTail, bassVel, true);
        this.playPianoKey(prog.bassOctave, bassTail * 0.9, bassVel * 0.85, true);
        if (prog.bassFifth) {
          this.playPianoKey(prog.bassFifth, bassTail * 0.75, bassVel * 0.65, true);
        }
      } else if (stepInBar === 4) {
        // Mid-bar walking bass pulse
        this.playPianoKey(prog.bassOctave, this.beatDuration * 1.8, 0.65, true);
      }

      // ============================================================
      // 2. SYNCHRONOUS STRONG BACKBEAT (Perturbation)
      // ============================================================
      if (perturb > 0.04) {
        const beatGain = Math.min(1.0, perturb * 1.15);
        if (stepInBar === 0) {
          this.triggerBackbeatKick(now, 0.88 * beatGain);
        } else if (stepInBar === 2 || stepInBar === 6) {
          this.triggerBackbeatSnare(now, 0.78 * beatGain);
        } else if (stepInBar === 4) {
          this.triggerBackbeatKick(now, 0.70 * beatGain);
        }
      }

      // ============================================================
      // 3. MULTI-TIER PHASE-LOCKED VIRTUOSO SOLO (s -> p -> d)
      // ============================================================
      if (dExc > 0.04) {
        // Tier 3: d-polarization excitation (Solo Layer 2: Rapid Virtuoso Arpeggios)
        const soloNote = activeSolo2[this.masterStep % activeSolo2.length];
        const soloVel = 0.92 * Math.min(1.0, dExc * 1.35);
        this.playPianoKey(soloNote, this.sixteenthDuration * 1.6, soloVel, false, true);

        // Also add rapid 32nd-note sparkle echo on off-beats
        const echoNote = activeSolo1[(this.masterStep + 1) % activeSolo1.length];
        this.playPianoKey(echoNote, this.sixteenthDuration * 0.9, soloVel * 0.45, false, true);
      } else if (pExc > 0.04) {
        // Tier 2: p-polarization excitation (Solo Layer 1: 16th-Note Scalar Runs)
        const soloNote = activeSolo1[this.masterStep % activeSolo1.length];
        const soloVel = 0.86 * Math.min(1.0, pExc * 1.25);
        this.playPianoKey(soloNote, this.sixteenthDuration * 1.8, soloVel, false, true);
      }

      // ============================================================
      // 4. FLOWING MIDDLE-HAND ARPEGGIOS & CLASSICAL MELODY
      // ============================================================
      if (stepInBar % 2 === 0) {
        const arpIdx = Math.floor(stepInBar / 2) % prog.arpeggio.length;
        const arpNote = prog.arpeggio[arpIdx];
        const arpVel = 0.52 * (0.85 + 0.15 * Math.sin(quantumState.R));
        this.playPianoKey(arpNote, this.beatDuration * 1.4, arpVel, false);

        if (pExc <= 0.25 && dExc <= 0.25 && stepInBar === 0) {
          const melNote = activeMelody[barIndex % activeMelody.length];
          const melodyVel = 0.78 * (0.85 + 0.2 * quantumState.coherence);
          this.playPianoKey(melNote, this.beatDuration * 1.8, melodyVel, false);
        }
      }
    }

    // Dynamic Soundboard Lowpass Modulation by Entropy S_vN
    const pExcLevel = quantumState.pExcitation || 0.0;
    const dExcLevel = quantumState.dExcitation || 0.0;
    const brightness = Math.max(2800, Math.min(7800, 3800 + quantumState.entropy * 2400 + pExcLevel * 1800 + dExcLevel * 2400));
    this.soundboardFilter.frequency.setTargetAtTime(brightness, this.audioCtx.currentTime, 0.05);
  }

  getVisualizerData() {
    if (this.groundAnalyser) {
      this.groundAnalyser.getByteFrequencyData(this.groundFrequencyData);
      this.groundAnalyser.getByteTimeDomainData(this.groundTimeDomainData);
    }
    if (this.excitedAnalyser) {
      this.excitedAnalyser.getByteFrequencyData(this.excitedFrequencyData);
      this.excitedAnalyser.getByteTimeDomainData(this.excitedTimeDomainData);
    }
    return {
      freq: this.groundFrequencyData,
      wave: this.groundTimeDomainData,
      excitedFreq: this.excitedFrequencyData,
      excitedWave: this.excitedTimeDomainData
    };
  }
}
