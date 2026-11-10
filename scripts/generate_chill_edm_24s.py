#!/usr/bin/env python3
"""
Synthesize a bespoke 36.0-second Stereo Chill EDM / Melodic Deep House Soundtrack (48 kHz, 16-bit)
at a slower, hypnotic 90 BPM tempo for the 36-second Point Reyes Sound Flagship LinkedIn Animated Carousel Reel.

Musical Arc (90 BPM = 0.6667s/beat, 2.6667s/bar, 36.0s total):
- 0.0s - 6.0s (Slow Atmospheric Intro — Feature 1):
  Warm low-pass filtered analog 9th chord pads slowly swelling in (0.0 - 3.8s), subtle deep sub-bass drone,
  floating stereo-delayed Rhodes/glass plucks, and a soft heartbeat pulse kick entering at 4.0s.
- 6.0s - 29.3s (90 BPM Accentuated Chill Melodic EDM Vibe — Features 2, 3, 4, 5):
  Slower, deeper 90 BPM accentuated four-on-the-floor deep house kick with smooth sidechain breathing,
  crisp off-beat hats, 16th-note ghost shakers, snappy rim/clap on beats 2 & 4, warm sub-bassline,
  and floating arpeggio plucks.
- 29.3s - 36.0s (Ethereal Outro & Long Smooth Fade-Out — Feature 6):
  Beat drops out into a warm suspended Dmaj9 -> F#m11 ambient chord wash and shimmering delay tail,
  gently closing the low-pass filter and fading smoothly to silence at 36.0s.
"""

from pathlib import Path
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "marketing" / "linkedin_campaign"
WAV_PATH = OUT_DIR / "chill_edm_36s_master.wav"
MP4_PATH = OUT_DIR / "LINKEDIN_CAROUSEL_REEL_1080x1350.mp4"

SR = 48000
DURATION = 36.0
N_SAMPLES = int(SR * DURATION)

BPM = 90.0
BEAT_SEC = 60.0 / BPM        # 0.6667s per beat
BAR_SEC = 4.0 * BEAT_SEC     # 2.6667s per bar


def midi_to_hz(midi_note: float) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69.0) / 12.0))


def lowpass(sig: np.ndarray, cutoff_hz: float, order: int = 3) -> np.ndarray:
    nyq = 0.5 * SR
    norm_cutoff = min(max(cutoff_hz / nyq, 0.002), 0.98)
    b, a = butter(order, norm_cutoff, btype="low")
    return lfilter(b, a, sig)


def highpass(sig: np.ndarray, cutoff_hz: float, order: int = 2) -> np.ndarray:
    nyq = 0.5 * SR
    norm_cutoff = min(max(cutoff_hz / nyq, 0.001), 0.98)
    b, a = butter(order, norm_cutoff, btype="high")
    return lfilter(b, a, sig)


def time_varying_lowpass(sig: np.ndarray, cutoff_curve: np.ndarray, chunk_size: int = 1200) -> np.ndarray:
    """Apply a smooth time-varying low-pass filter across chunks."""
    out = np.zeros_like(sig)
    n = len(sig)
    nyq = 0.5 * SR
    zi = None
    for start in range(0, n, chunk_size):
        end = min(start + chunk_size, n)
        c_hz = float(np.mean(cutoff_curve[start:end]))
        norm_c = min(max(c_hz / nyq, 0.003), 0.95)
        b, a = butter(2, norm_c, btype="low")
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1)
        out[start:end], zi = lfilter(b, a, sig[start:end], zi=zi)
    return out


def stereo_ping_pong_delay(left: np.ndarray, right: np.ndarray, delay_sec: float = 0.50, feedback: float = 0.45, mix: float = 0.36):
    """Apply warm low-passed stereo ping-pong delay (dotted 8th note at 90 BPM = 0.50s)."""
    d_samples = int(delay_sec * SR)
    wet_l = np.zeros_like(left)
    wet_r = np.zeros_like(right)

    src_mono = 0.5 * (left + right)
    for tap in range(1, 8):
        offset = tap * d_samples
        if offset >= len(src_mono):
            break
        gain = (feedback ** tap)
        tap_sig = np.zeros_like(src_mono)
        tap_sig[offset:] = src_mono[:-offset] * gain
        tap_sig = lowpass(highpass(tap_sig, 180.0), 2600.0 - tap * 200.0)
        if tap % 2 == 1:
            wet_l += tap_sig * 0.85
            wet_r += tap_sig * 0.25
        else:
            wet_r += tap_sig * 0.85
            wet_l += tap_sig * 0.25

    return left + mix * wet_l, right + mix * wet_r


def synth_warm_juno_pad(t: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Synthesize lush stereo detuned analog Juno/Prophet 9th chords across the 36.0s (6s per card):
      0.0 - 6.0s  (Card 1): F#m9   (F#2, C#3, E3, G#3, A3, C#4)
      6.0 - 12.0s (Card 2): Dmaj9  (D2, A2, C#3, E3, F#3, A3)
      12.0- 18.0s (Card 3): Bm9    (B1, F#2, A2, C#3, D3, F#3)
      18.0- 24.0s (Card 4): E6/9   (E2, B2, C#3, F#3, G#3, B3)
      24.0- 30.0s (Card 5): C#m9 -> F#m9 (C#2, G#2, B2, D#3, E3, G#3)
      30.0- 36.0s (Card 6): Dmaj9 -> F#m11 resolve (D2, A2, C#3, E3, F#3, G#3, A3)
    """
    chords = [
        (0.0, 6.0, [42, 49, 52, 56, 57, 61]),
        (6.0, 12.0, [38, 45, 49, 52, 54, 57]),
        (12.0, 18.0, [35, 42, 45, 49, 50, 54]),
        (18.0, 24.0, [40, 47, 49, 54, 56, 59]),
        (24.0, 30.0, [37, 44, 47, 51, 52, 56]),
        (30.0, 36.0, [38, 45, 49, 52, 54, 56, 61]),
    ]

    pad_l = np.zeros(N_SAMPLES, dtype=np.float64)
    pad_r = np.zeros(N_SAMPLES, dtype=np.float64)

    detunes_l = [-11.0, -4.0, 2.5, 8.5]
    detunes_r = [-8.5, -2.5, 4.0, 11.0]

    for start_s, end_s, notes in chords:
        s_idx = max(0, int((start_s - 0.65) * SR))
        e_idx = min(N_SAMPLES, int((end_s + 0.85) * SR))
        seg_t = t[s_idx:e_idx] - start_s
        seg_len = e_idx - s_idx

        env = np.ones(seg_len, dtype=np.float64)
        fade_in = int(0.75 * SR)
        fade_out = int(0.85 * SR)
        if fade_in < seg_len:
            env[:fade_in] = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0, 1, fade_in)))
        if fade_out < seg_len:
            env[-fade_out:] *= 0.5 * (1.0 + np.cos(np.pi * np.linspace(0, 1, fade_out)))

        chord_l = np.zeros(seg_len, dtype=np.float64)
        chord_r = np.zeros(seg_len, dtype=np.float64)

        for n_idx, midi_n in enumerate(notes):
            base_hz = midi_to_hz(midi_n)
            note_weight = 1.0 if n_idx > 0 else 0.75
            for det_c in detunes_l:
                f_hz = base_hz * (2.0 ** (det_c / 1200.0))
                phase = 2.0 * np.pi * f_hz * seg_t + (n_idx * 1.13 + det_c)
                wave = 0.55 * np.sin(phase)
                for h in range(2, 7):
                    wave += (0.45 / h) * np.sin(h * phase)
                chord_l += note_weight * wave
            for det_c in detunes_r:
                f_hz = base_hz * (2.0 ** (det_c / 1200.0))
                phase = 2.0 * np.pi * f_hz * seg_t + (n_idx * 2.07 - det_c)
                wave = 0.55 * np.sin(phase)
                for h in range(2, 7):
                    wave += (0.45 / h) * np.sin(h * phase)
                chord_r += note_weight * wave

        pad_l[s_idx:e_idx] += chord_l * env / (len(notes) * len(detunes_l))
        pad_r[s_idx:e_idx] += chord_r * env / (len(notes) * len(detunes_r))

    cutoff_curve = np.interp(
        t,
        [0.0, 3.5, 6.0, 18.0, 28.5, 32.5, 36.0],
        [280.0, 620.0, 1450.0, 1880.0, 1550.0, 680.0, 260.0],
    )
    pad_l = time_varying_lowpass(pad_l, cutoff_curve)
    pad_r = time_varying_lowpass(pad_r, cutoff_curve)

    return pad_l, pad_r


def synth_warm_sub_bass(t: np.ndarray) -> np.ndarray:
    """Deep, smooth deep-house sub-bassline following the 6-card progression."""
    bass_events = [
        (0.0, 6.0, 30, 0.55),    # F#1 intro swell
        (6.0, 12.0, 38, 0.92),   # D2
        (12.0, 18.0, 35, 0.94),  # B1
        (18.0, 24.0, 40, 0.90),  # E2
        (24.0, 29.5, 37, 0.90),  # C#2
        (29.5, 35.2, 38, 0.65),  # D2 warm outro resolve
    ]
    bass = np.zeros(N_SAMPLES, dtype=np.float64)
    for start_s, end_s, midi_n, amp in bass_events:
        s_idx = int(start_s * SR)
        e_idx = min(N_SAMPLES, int(end_s * SR))
        seg_t = t[s_idx:e_idx] - start_s
        f_hz = midi_to_hz(midi_n)
        wave = (
            0.80 * np.sin(2.0 * np.pi * f_hz * seg_t)
            + 0.16 * np.sin(2.0 * np.pi * (2.0 * f_hz) * seg_t)
            + 0.04 * np.sin(2.0 * np.pi * (3.0 * f_hz) * seg_t)
        )
        env = np.ones(len(seg_t), dtype=np.float64)
        fi = min(int(0.12 * SR), len(seg_t))
        fo = min(int(0.22 * SR), len(seg_t))
        env[:fi] = np.linspace(0.0, 1.0, fi)
        env[-fo:] = np.linspace(1.0, 0.0, fo)
        bass[s_idx:e_idx] += amp * wave * env

    return lowpass(bass, 190.0)


def synth_floating_plucks(t: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Hypnotic 90 BPM plucked synth arpeggio (16th-note grid = 0.1667s per step).
    """
    step_sec = BEAT_SEC / 4.0  # 0.1667s
    total_steps = int(DURATION / step_sec)

    patterns = [
        (0.0, 6.0, [61, 64, 66, 69, 66, 64, 61, 57]),
        (6.0, 12.0, [61, 64, 66, 73, 69, 66, 64, 61]),
        (12.0, 18.0, [59, 62, 66, 69, 73, 69, 66, 62]),
        (18.0, 24.0, [64, 68, 71, 73, 76, 73, 71, 68]),
        (24.0, 30.0, [61, 64, 68, 73, 68, 64, 61, 56]),
        (30.0, 34.0, [61, 64, 66, 69, 66, 64, 61, 57]),
    ]

    pluck_l = np.zeros(N_SAMPLES, dtype=np.float64)
    pluck_r = np.zeros(N_SAMPLES, dtype=np.float64)

    for step in range(total_steps):
        onset_s = step * step_sec
        if onset_s >= 33.6:
            break

        active_notes = None
        for p_start, p_end, p_notes in patterns:
            if p_start <= onset_s < p_end:
                active_notes = p_notes
                break
        if not active_notes:
            continue

        # Sparser notes during slow intro (0 - 3.5s) and outro (30.0 - 33.6s)
        if onset_s < 3.5 and (step % 2 == 1):
            continue
        if onset_s >= 30.0 and (step % 2 == 1):
            continue

        midi_n = active_notes[step % len(active_notes)]
        f_hz = midi_to_hz(midi_n)

        vel = 0.85 if (step % 4 == 0) else (0.62 if (step % 3 == 0) else 0.42)
        if onset_s < 6.0:
            vel *= np.interp(onset_s, [0.0, 6.0], [0.22, 0.85])
        elif onset_s > 28.5:
            vel *= np.interp(onset_s, [28.5, 33.6], [0.88, 0.12])

        s_idx = int(onset_s * SR)
        note_dur = min(0.48, DURATION - onset_s)
        n_len = int(note_dur * SR)
        if n_len <= 10:
            continue

        nt = np.arange(n_len, dtype=np.float64) / SR
        amp_env = (1.0 - np.exp(-nt / 0.005)) * np.exp(-nt / 0.19)
        mod_env = np.exp(-nt / 0.05)
        mod_sig = 1.10 * mod_env * np.sin(2.0 * np.pi * (2.0 * f_hz) * nt)
        tone = (
            0.78 * np.sin(2.0 * np.pi * f_hz * nt + mod_sig)
            + 0.22 * np.sin(2.0 * np.pi * (2.0 * f_hz) * nt)
        ) * amp_env * vel

        pan = 0.5 + 0.32 * np.sin(step * 0.65)
        pluck_l[s_idx : s_idx + n_len] += tone * np.sqrt(1.0 - pan)
        pluck_r[s_idx : s_idx + n_len] += tone * np.sqrt(pan)

    return stereo_ping_pong_delay(pluck_l, pluck_r, delay_sec=0.50, feedback=0.45, mix=0.42)


def synth_chill_drums_and_sidechain(t: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generate an accentuated 90 BPM four-on-the-floor melodic deep-house beat:
    - Subtle low-passed heartbeat pulse kick starts at Beat 5 (3.33s - 6.0s)
    - Full accentuated kick + crisp off-beat hats + snappy rim/clap + 16th-note shaker groove from Beat 9 (6.0s) through Beat 44 (29.33s)
    """
    drums_l = np.zeros(N_SAMPLES, dtype=np.float64)
    drums_r = np.zeros(N_SAMPLES, dtype=np.float64)
    sidechain = np.ones(N_SAMPLES, dtype=np.float64)

    rng = np.random.default_rng(42)

    first_pulse_beat = 5
    first_groove_beat = 9
    last_groove_beat = 44

    for beat_idx in range(first_pulse_beat, last_groove_beat + 1):
        beat_s = beat_idx * BEAT_SEC
        s_idx = int(beat_s * SR)
        if s_idx >= N_SAMPLES:
            break

        is_intro_pulse = beat_idx < first_groove_beat
        if is_intro_pulse:
            kick_gain = 0.32 + 0.15 * (beat_idx - first_pulse_beat)
        elif beat_idx == last_groove_beat:
            kick_gain = 0.45
        else:
            kick_gain = 1.0

        # 1. Accentuated Deep-House Kick (punchy transient click + chest thump at 90 Hz + deep 52 Hz sub body)
        k_len = min(int(0.36 * SR), N_SAMPLES - s_idx)
        kt = np.arange(k_len, dtype=np.float64) / SR
        freq_t = 52.0 + 115.0 * np.exp(-kt / 0.018) + 220.0 * np.exp(-kt / 0.004)
        phase = 2.0 * np.pi * np.cumsum(freq_t) / SR
        k_env = (1.0 - np.exp(-kt / 0.0012)) * np.exp(-kt / 0.155)
        click_transient = np.exp(-kt / 0.0035) * np.sin(2.0 * np.pi * 1400.0 * kt) * (0.12 if not is_intro_pulse else 0.03)
        kick = kick_gain * (0.95 * np.sin(phase) + 0.22 * np.sin(2.0 * phase) * np.exp(-kt / 0.04) + click_transient) * k_env
        if is_intro_pulse:
            kick = lowpass(kick, 220.0)
        drums_l[s_idx : s_idx + k_len] += kick
        drums_r[s_idx : s_idx + k_len] += kick

        # Sidechain ducking curve on each kick
        sc_len = min(int(BEAT_SEC * SR), N_SAMPLES - s_idx)
        sct = np.arange(sc_len, dtype=np.float64) / SR
        duck_depth = 0.58 if not is_intro_pulse else 0.25
        duck = 1.0 - (duck_depth * kick_gain) * np.exp(-sct / 0.19) * (1.0 - np.exp(-sct / 0.006))
        sidechain[s_idx : s_idx + sc_len] = np.minimum(sidechain[s_idx : s_idx + sc_len], duck)

        if is_intro_pulse or beat_idx == last_groove_beat:
            continue

        # 2. Crisp off-beat open/closed hat on the "&" of each beat
        hat_s = beat_s + 0.5 * BEAT_SEC
        h_idx = int(hat_s * SR)
        h_len = min(int(0.15 * SR), N_SAMPLES - h_idx)
        if h_len > 10:
            ht = np.arange(h_len, dtype=np.float64) / SR
            noise = rng.standard_normal(h_len)
            hat_env = (1.0 - np.exp(-ht / 0.003)) * np.exp(-ht / 0.045)
            hat = highpass(lowpass(noise, 11000.0), 5400.0) * hat_env * 0.24 * kick_gain
            drums_l[h_idx : h_idx + h_len] += hat * 0.90
            drums_r[h_idx : h_idx + h_len] += hat * 1.10

        # Subtle 16th-note ghost shakers on steps 1 and 3 of the beat
        for sub_step, pan_lr in [(0.25, (1.08, 0.92)), (0.75, (0.92, 1.08))]:
            sh_s = beat_s + sub_step * BEAT_SEC
            sh_idx = int(sh_s * SR)
            sh_len = min(int(0.065 * SR), N_SAMPLES - sh_idx)
            if sh_len > 10:
                sht = np.arange(sh_len, dtype=np.float64) / SR
                sh_noise = highpass(lowpass(rng.standard_normal(sh_len), 9800.0), 6200.0)
                sh_env = (1.0 - np.exp(-sht / 0.002)) * np.exp(-sht / 0.019)
                shaker = sh_noise * sh_env * 0.09 * kick_gain
                drums_l[sh_idx : sh_idx + sh_len] += shaker * pan_lr[0]
                drums_r[sh_idx : sh_idx + sh_len] += shaker * pan_lr[1]

        # 3. Snappy layered rim/clap on beats 2 and 4 of each bar
        if beat_idx % 2 == 1:
            c_len = min(int(0.17 * SR), N_SAMPLES - s_idx)
            ct = np.arange(c_len, dtype=np.float64) / SR
            c_noise = highpass(lowpass(rng.standard_normal(c_len), 4200.0), 850.0)
            c_env = (1.0 - np.exp(-ct / 0.0018)) * np.exp(-ct / 0.055)
            rim_tone = np.sin(2.0 * np.pi * 480.0 * ct) * np.exp(-ct / 0.012) * 0.25
            clap = (c_noise * c_env + rim_tone) * 0.22 * kick_gain
            drums_l[s_idx : s_idx + c_len] += clap * 1.06
            drums_r[s_idx : s_idx + c_len] += clap * 0.94

    return drums_l, drums_r, sidechain


def synth_card_slide_air_Swells(t: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Silky filtered air swells synchronized with the 5 slow 2.4s card transitions
    (centered at t = 4.8s, 10.8s, 16.8s, 22.8s, 28.8s).
    """
    rng = np.random.default_rng(108)
    sw_l = np.zeros(N_SAMPLES, dtype=np.float64)
    sw_r = np.zeros(N_SAMPLES, dtype=np.float64)

    slide_centers = [4.80, 10.80, 16.80, 22.80, 28.80]
    for sc_t in slide_centers:
        s_idx = max(0, int((sc_t - 1.20) * SR))
        e_idx = min(N_SAMPLES, int((sc_t + 1.20) * SR))
        n_len = e_idx - s_idx
        local_t = np.linspace(-1.0, 1.0, n_len)
        bell = np.exp(-3.0 * (local_t ** 2))
        pink = lowpass(highpass(rng.standard_normal(n_len), 380.0), 2100.0) * bell * 0.06
        pan_l = np.linspace(0.3, 0.85, n_len)
        pan_r = 1.0 - pan_l
        sw_l[s_idx:e_idx] += pink * pan_l
        sw_r[s_idx:e_idx] += pink * pan_r

    return sw_l, sw_r


def generate_chill_edm_24s() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    t = np.arange(N_SAMPLES, dtype=np.float64) / SR

    print("Synthesizing 36.0s Stereo Chill EDM Soundtrack (90 BPM, F#m9 / Dmaj9)...")
    pad_l, pad_r = synth_warm_juno_pad(t)
    bass = synth_warm_sub_bass(t)
    pluck_l, pluck_r = synth_floating_plucks(t)
    drums_l, drums_r, sidechain = synth_chill_drums_and_sidechain(t)
    swell_l, swell_r = synth_card_slide_air_Swells(t)

    # Apply smooth sidechain breathing to pads and bass, with accentuated drum presence
    mix_l = (0.44 * pad_l + 0.40 * bass) * sidechain + 0.32 * pluck_l + 0.84 * drums_l + swell_l
    mix_r = (0.44 * pad_r + 0.40 * bass) * sidechain + 0.32 * pluck_r + 0.84 * drums_r + swell_r

    # Global Master Envelope:
    # - Slow, smooth 3.8-second fade-in at the start (0.0s -> 3.8s)
    # - Full warm vibe through the middle (3.8s -> 29.5s)
    # - Lush, gradual 6.5-second cosine fade-out at the end (29.5s -> 36.0s)
    master_env = np.ones(N_SAMPLES, dtype=np.float64)
    fi_samples = int(3.8 * SR)
    fo_samples = int(6.5 * SR)
    master_env[:fi_samples] = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0.0, 1.0, fi_samples)))
    master_env[-fo_samples:] = 0.5 * (1.0 + np.cos(np.pi * np.linspace(0.0, 1.0, fo_samples)))

    mix_l *= master_env
    mix_r *= master_env

    mix_l = np.tanh(mix_l * 1.15)
    mix_r = np.tanh(mix_r * 1.15)
    peak = max(np.max(np.abs(mix_l)), np.max(np.abs(mix_r)), 1e-6)
    target_peak = 0.89
    stereo = np.column_stack([mix_l / peak * target_peak, mix_r / peak * target_peak])
    stereo_int16 = np.clip(stereo * 32767.0, -32768, 32767).astype(np.int16)

    wavfile.write(str(WAV_PATH), SR, stereo_int16)
    print(f"    ✓ Saved 36.0s stereo soundtrack: {WAV_PATH}")
    return WAV_PATH


if __name__ == "__main__":
    generate_chill_edm_24s()
