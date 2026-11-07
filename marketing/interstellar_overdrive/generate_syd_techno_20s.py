"""
generate_syd_techno_20s.py
Synthesizes and masters a 20-second Danceable 112 BPM EDM backing track (100% original
E-Dorian composition) optimized for the 16s-21s LinkedIn/YouTube engagement window:

Timeline (112 BPM, 2.1429s per bar):
- 0.00s -> 4.29s (Bars 0-1): Quiet filtered intro (-28 dBFS) swelling rapidly with an
  EDM pitch/noise riser + accelerating snare roll build into the Drop at t = 4.29s.
- 4.29s -> 15.20s (Bars 2-6): THE EDM DROP (Full Loudness, -4.5 dBFS) synced to the
  H2 Lattice Reveal (4.29s -> 11.5s) and Full 5x5 Lattice Dance (11.5s -> 15.2s).
- 15.20s -> 20.00s (Bars 7-9): Smooth 4.8s EDM fade-out to silence at 20.0s.
"""

import os
import math
import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as signal

SR = 48000
DURATION = 20.0
N_SAMPLES = int(SR * DURATION)

BPM = 112.0
BEAT_SEC = 60.0 / BPM          # 0.535714 s per beat
EIGHTH_SEC = BEAT_SEC / 2.0    # 0.267857 s per 8th note
STEP_SEC = BEAT_SEC / 4.0      # 0.133929 s per 16th note
BAR_SEC = BEAT_SEC * 4.0       # 2.142857 s per bar
DROP_TIME = BAR_SEC * 2.0      # 4.285714 s (Exact start of Bar 2 & H2 Lattice Reveal!)

BASE_DIR = "/Users/romitchakraborty/QAI/point-reyes-sound"
OUT_DIR = os.path.join(BASE_DIR, "marketing", "interstellar_overdrive")
OUT_WAV = os.path.join(OUT_DIR, "syd_barrett_techno_disco_20s.wav")


def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))


def binson_echorec_stereo(sig_l, sig_r, sr=SR):
    """Tempo-synced stereo delay (8th, dotted-8th, quarter) for spacious dance echo."""
    out_l = sig_l.copy()
    out_r = sig_r.copy()
    taps = [
        (EIGHTH_SEC,        0.30, 0.14),
        (EIGHTH_SEC * 1.5,  0.15, 0.28),
        (BEAT_SEC,          0.22, 0.12),
        (BEAT_SEC * 1.5,    0.12, 0.18),
    ]
    sos_tape = signal.butter(2, [240, 3600], btype="bandpass", fs=sr, output="sos")
    wet_l = signal.sosfilt(sos_tape, np.tanh(sig_l * 1.25))
    wet_r = signal.sosfilt(sos_tape, np.tanh(sig_r * 1.25))

    for delay_s, gl, gr in taps:
        d = int(delay_s * sr)
        if d < len(sig_l):
            out_l[d:] += wet_l[:-d] * gl
            out_r[d:] += wet_r[:-d] * gr
    return out_l, out_r


def guitar_cabinet_ir(sig, sr=SR):
    """British 4x12 guitar cabinet simulation with punchy dance-rock midrange."""
    sos_hp = signal.butter(3, 95.0, btype="highpass", fs=sr, output="sos")
    b_pk, a_pk = signal.iirpeak(2300.0, Q=1.35, fs=sr)
    b_notch, a_notch = signal.iirnotch(3800.0, Q=3.0, fs=sr)
    sos_lp = signal.butter(4, 4800.0, btype="lowpass", fs=sr, output="sos")

    y = signal.sosfilt(sos_hp, sig)
    y = signal.lfilter(b_pk, a_pk, y) * 1.35 + y * 0.65
    y = signal.lfilter(b_notch, a_notch, y)
    y = signal.sosfilt(sos_lp, y)
    return y


def synth_edm_kick(n_len, sr=SR):
    """Punchy, club-grade EDM four-on-the-floor kick drum."""
    t = np.arange(n_len) / float(sr)
    f_env = 46.0 + 110.0 * np.exp(-t * 36.0) + 95.0 * np.exp(-t * 220.0)
    phase = 2.0 * np.pi * np.cumsum(f_env) / float(sr)
    sub_body = np.sin(phase) * np.exp(-t * 7.8)
    click = np.sin(2.0 * np.pi * 2400.0 * t) * np.exp(-t * 280.0) * 0.38
    punch = np.tanh((sub_body * 1.35 + click) * 1.45)
    return punch * 0.98


def synth_edm_clap_snare(n_len, sr=SR, rng=None):
    """Big stereo EDM festival clap + punchy electronic snare on beats 2 & 4."""
    t = np.arange(n_len) / float(sr)
    f_env = 140.0 + 80.0 * np.exp(-t * 50.0)
    phase = 2.0 * np.pi * np.cumsum(f_env) / float(sr)
    tone = np.sin(phase) * np.exp(-t * 22.0) * 0.58

    noise = rng.standard_normal(n_len)
    sos_bp = signal.butter(3, [1000.0, 7800.0], btype="bandpass", fs=sr, output="sos")
    c_noise = signal.sosfilt(sos_bp, noise)

    env_clap = (
        0.65 * np.exp(-np.maximum(0.0, t) * 170.0)
        + 0.75 * np.exp(-np.maximum(0.0, t - 0.010) * 160.0) * (t >= 0.010)
        + 0.95 * np.exp(-np.maximum(0.0, t - 0.020) * 14.5) * (t >= 0.020)
    )
    return np.tanh((tone + c_noise * env_clap * 0.72) * 1.45)


def synth_edm_hihat(n_len, open_hat=False, sr=SR, rng=None):
    """Crisp 909/EDM open off-beat hi-hat ('tss') and tight closed shaker-hat."""
    t = np.arange(n_len) / float(sr)
    freqs = [840.0, 1180.0, 1620.0, 2260.0, 3240.0, 4680.0]
    metal = np.zeros_like(t)
    for f in freqs:
        metal += np.sign(np.sin(2.0 * np.pi * f * t))
    metal /= len(freqs)
    noise = rng.standard_normal(n_len)
    raw = 0.38 * metal + 0.62 * noise
    sos_hp = signal.butter(4, 7200.0, btype="highpass", fs=sr, output="sos")
    filt = signal.sosfilt(sos_hp, raw)
    decay = 7.2 if open_hat else 46.0
    env = (1.0 - np.exp(-t * 450.0)) * np.exp(-t * decay)
    return filt * env


def synth_plucked_string(freq, dur_s, sr=SR, drive=1.0, pick_pos=0.18, rng=None):
    """Picked electric guitar/bass waveguide with tight dance attack."""
    n = int(dur_s * sr)
    t = np.arange(n) / float(sr)
    out = np.zeros(n, dtype=np.float64)
    max_h = min(22, int((sr * 0.42) / max(freq, 20.0)))
    for h in range(1, max_h + 1):
        comb = abs(math.sin(math.pi * h * pick_pos))
        h_decay = 1.4 + 0.75 * (h ** 1.22)
        amp = (1.0 / (h ** 0.78)) * comb
        f_h = freq * h * (1.0 + 0.00011 * (h ** 2))
        out += amp * np.sin(2.0 * np.pi * f_h * t) * np.exp(-t * h_decay)

    if rng is not None:
        click_noise = rng.standard_normal(n) * np.exp(-t * 150.0) * 0.22
        out += click_noise

    att = np.minimum(1.0, t / 0.002)
    rel = np.minimum(1.0, (dur_s - t) / 0.020)
    out *= att * np.maximum(0.0, rel)

    if drive > 1.0:
        x = out * drive
        pos = np.tanh(x * 1.15)
        neg = np.tanh(x * 0.76) * 0.86
        out = np.where(x >= 0.0, pos, neg)
    return out


def synth_supersaw_chord(notes, dur_s, sr=SR):
    """Lush, wide stereo EDM supersaw synth layer to glue the distortion guitars."""
    n = int(dur_s * sr)
    t = np.arange(n) / float(sr)
    out_l = np.zeros(n, dtype=np.float64)
    out_r = np.zeros(n, dtype=np.float64)
    detunes = [-0.0075, -0.0032, 0.0, 0.0034, 0.0078]
    pan_l_weights = [0.9, 0.7, 0.5, 0.3, 0.1]

    for nm in notes:
        f0 = midi_to_freq(nm)
        for det, pl in zip(detunes, pan_l_weights):
            f = f0 * (1.0 + det)
            saw = np.zeros(n, dtype=np.float64)
            for h in range(1, 11):
                if f * h < sr * 0.42:
                    saw += ((-1.0) ** (h + 1)) * (np.sin(2.0 * np.pi * f * h * t) / h)
            out_l += saw * pl
            out_r += saw * (1.0 - pl)

    env = np.minimum(1.0, t / 0.015) * np.minimum(1.0, (dur_s - t) / 0.04)
    sos_lp = signal.butter(3, 3800.0, btype="lowpass", fs=sr, output="sos")
    return signal.sosfilt(sos_lp, out_l * env * 0.14), signal.sosfilt(sos_lp, out_r * env * 0.14)


def apply_edm_dynamic_arc(mix_l, mix_r, sr=SR):
    """
    Quiet Intro (0s - 4.29s) -> Full EDM Drop & Lattice Climax (4.29s - 15.2s) -> Smooth Fade-Out (15.2s - 20s).
    """
    n = len(mix_l)
    t = np.arange(n) / float(sr)

    sos_warm = signal.butter(3, 520.0, btype="lowpass", fs=sr, output="sos")
    warm_l = signal.sosfilt(sos_warm, mix_l)
    warm_r = signal.sosfilt(sos_warm, mix_r)

    alpha_bright = np.ones(n, dtype=np.float64)
    for i, ti in enumerate(t):
        if ti < DROP_TIME:
            u = ti / DROP_TIME
            s = u ** 2.0
            alpha_bright[i] = 0.14 + 0.86 * s
        elif ti < 15.2:
            alpha_bright[i] = 1.0
        else:
            u = (ti - 15.2) / 4.8
            s = 3.0 * (u ** 2) - 2.0 * (u ** 3)
            alpha_bright[i] = 1.0 - 0.60 * s

    filt_l = warm_l * (1.0 - alpha_bright) + mix_l * alpha_bright
    filt_r = warm_r * (1.0 - alpha_bright) + mix_r * alpha_bright

    filt_l = np.tanh(filt_l * 1.22)
    filt_r = np.tanh(filt_r * 1.22)
    raw_peak = max(np.max(np.abs(filt_l)), np.max(np.abs(filt_r)), 1e-6)
    filt_l /= raw_peak
    filt_r /= raw_peak

    amp_env = np.zeros(n, dtype=np.float64)
    for i, ti in enumerate(t):
        if ti < 0.20:
            amp_env[i] = 0.045 * (ti / 0.20)
        elif ti < DROP_TIME:
            u = (ti - 0.20) / (DROP_TIME - 0.20)
            swell = 0.45 * (u ** 1.6) + 0.55 * (u ** 2.5)
            amp_env[i] = 0.045 + (1.0 - 0.045) * swell
        elif ti < 15.2:
            amp_env[i] = 1.0
        else:
            u = np.clip((20.0 - ti) / 4.8, 0.0, 1.0)
            s = 3.0 * (u ** 2) - 2.0 * (u ** 3)
            amp_env[i] = s * (u ** 0.5)

    return filt_l * amp_env * 0.95, filt_r * amp_env * 0.95


def generate_track():
    rng = np.random.default_rng(1967)

    drums_l = np.zeros(N_SAMPLES, dtype=np.float64)
    drums_r = np.zeros(N_SAMPLES, dtype=np.float64)
    sidechain_env = np.ones(N_SAMPLES, dtype=np.float64)

    # -----------------------------------------------------------------------
    # 1. EDM RHYTHM SECTION (112 BPM — Drop at Bar 2 / t = 4.29s!)
    # -----------------------------------------------------------------------
    total_steps = int(DURATION / STEP_SEC) + 2

    for step in range(0, total_steps):
        bar_idx = step // 16
        step_in_bar = step % 16
        swing_s = 0.010 if (step_in_bar % 2 == 1) else 0.0
        t_step = step * STEP_SEC + swing_s
        idx = int(t_step * SR)
        if idx >= N_SAMPLES:
            break

        # Pre-drop snare build is at the end of Bar 1 (steps 12..15, t = 3.75s -> 4.29s)
        in_pre_drop_fill = (bar_idx == 1 and step_in_bar >= 12)
        if (step_in_bar % 4 == 0) and not in_pre_drop_fill:
            k_len = min(int(0.45 * SR), N_SAMPLES - idx)
            k_wave = synth_edm_kick(k_len, SR)
            drums_l[idx:idx + k_len] += k_wave * 0.96
            drums_r[idx:idx + k_len] += k_wave * 0.96

            sc_t = np.arange(k_len) / float(SR)
            pump_depth = 0.74 if bar_idx >= 2 else 0.55
            duck = 1.0 - pump_depth * np.exp(-sc_t * 10.5)
            sidechain_env[idx:idx + k_len] = np.minimum(sidechain_env[idx:idx + k_len], duck)

        if step_in_bar in (4, 12) and not in_pre_drop_fill:
            s_len = min(int(0.38 * SR), N_SAMPLES - idx)
            s_wave_l = synth_edm_clap_snare(s_len, SR, rng)
            s_wave_r = synth_edm_clap_snare(s_len, SR, rng)
            s_gain = 0.45 if bar_idx == 0 else 0.72
            drums_l[idx:idx + s_len] += s_wave_l * s_gain
            drums_r[idx:idx + s_len] += s_wave_r * s_gain

        # Pre-Drop EDM Snare Roll in Bar 1 (steps 8..15, t = 3.21s -> 4.29s)
        if bar_idx == 1 and step_in_bar >= 8:
            roll_prog = (step_in_bar - 8) / 7.0
            s_len = min(int(0.22 * SR), N_SAMPLES - idx)
            s_wave_l = synth_edm_clap_snare(s_len, SR, rng) * (0.35 + 0.55 * roll_prog)
            s_wave_r = synth_edm_clap_snare(s_len, SR, rng) * (0.35 + 0.55 * roll_prog)
            drums_l[idx:idx + s_len] += s_wave_l
            drums_r[idx:idx + s_len] += s_wave_r

        # Second mini-fill at end of Bar 4 (t ~ 10.4s) right as full 5x5 lattice locks in!
        if bar_idx == 4 and step_in_bar in (14, 15):
            s_len = min(int(0.20 * SR), N_SAMPLES - idx)
            s_wave = synth_edm_clap_snare(s_len, SR, rng) * 0.55
            drums_l[idx:idx + s_len] += s_wave
            drums_r[idx:idx + s_len] += s_wave

        is_open = (step_in_bar % 4 == 2)
        h_dur = 0.28 if is_open else 0.07
        h_len = min(int(h_dur * SR), N_SAMPLES - idx)
        h_wave = synth_edm_hihat(h_len, open_hat=is_open, sr=SR, rng=rng)
        if is_open:
            gain_h = 0.38 if bar_idx >= 2 else 0.25
        else:
            gain_h = 0.14 if (step_in_bar % 2 == 1) else 0.09
        drums_l[idx:idx + h_len] += h_wave * gain_h * 1.07
        drums_r[idx:idx + h_len] += h_wave * gain_h * 0.93

    # EDM White-Noise & Pitch Riser (t = 2.0s -> 4.29s) + Crash Impact at Drop (t = 4.29s)
    riser_st = int(2.0 * SR)
    riser_en = int(DROP_TIME * SR)
    n_riser = riser_en - riser_st
    t_ris = np.arange(n_riser) / float(SR)
    u_ris = t_ris / (n_riser / float(SR))
    f_ris = 220.0 * (2.0 ** (u_ris * 2.58))
    ph_ris = 2.0 * np.pi * np.cumsum(f_ris) / float(SR)
    ris_tone = np.sin(ph_ris) * (u_ris ** 2) * 0.28
    ris_noise = rng.standard_normal(n_riser) * (u_ris ** 2.4) * 0.24
    sos_ris = signal.butter(2, [600.0, 7500.0], btype="bandpass", fs=SR, output="sos")
    ris_sig = (ris_tone + signal.sosfilt(sos_ris, ris_noise)) * sidechain_env[riser_st:riser_en]
    drums_l[riser_st:riser_en] += ris_sig
    drums_r[riser_st:riser_en] += ris_sig

    n_crash = int(2.2 * SR)
    for crash_idx in (riser_en, int(BAR_SEC * 5.0 * SR)):
        if crash_idx + n_crash < N_SAMPLES:
            t_cr = np.arange(n_crash) / float(SR)
            cr_noise = signal.sosfilt(
                signal.butter(3, 5200.0, btype="highpass", fs=SR, output="sos"),
                rng.standard_normal(n_crash),
            ) * np.exp(-t_cr * 1.8) * 0.34
            drums_l[crash_idx:crash_idx + n_crash] += cr_noise * 1.05
            drums_r[crash_idx:crash_idx + n_crash] += cr_noise * 0.95

    # -----------------------------------------------------------------------
    # 2. 100% ORIGINAL E-DORIAN EDM DANCE BASS GUITAR + SUB BASS
    # -----------------------------------------------------------------------
    bass_track = np.zeros(N_SAMPLES, dtype=np.float64)

    bar_bass_eighths = [
        # Bar 0 (0.00s - 2.14s): E Dorian deep intro bounce
        [28, 40, 28, 40, 31, 43, 33, 45],
        # Bar 1 (2.14s - 4.29s): Pre-drop riser build A -> C -> D -> B
        [33, 45, 36, 48, 38, 50, 35, 47],
        # Bar 2 (4.29s - 6.43s, THE DROP!): Massive French-Touch octave bass (Em -> G -> A)
        [28, 40, 28, 40, 31, 43, 33, 45],
        # Bar 3 (6.43s - 8.57s): Cmaj7 -> D -> Bm7 -> Em
        [36, 48, 38, 50, 35, 47, 28, 40],
        # Bar 4 (8.57s - 10.71s): Second phrase Em -> G -> A -> C
        [28, 40, 31, 43, 33, 45, 36, 48],
        # Bar 5 (10.71s - 12.86s, Full 5x5 Lattice Locked In!): D -> B -> G -> E
        [38, 50, 35, 47, 31, 43, 28, 40],
        # Bar 6 (12.86s - 15.00s): Full Lattice Vista groove Em -> A -> C -> B
        [28, 40, 33, 45, 36, 48, 35, 47],
        # Bar 7 (15.00s - 17.14s): C -> D -> Bm -> Em melodic outro groove
        [36, 48, 38, 50, 35, 47, 28, 40],
        # Bar 8+ (17.14s - 20.00s): Final E Dorian pedal into fade-out
        [31, 43, 28, 40, 28, 40, 28, 40],
    ]

    total_eighths = int(DURATION / EIGHTH_SEC) + 2
    for e_step in range(0, total_eighths):
        bar_i = min(e_step // 8, len(bar_bass_eighths) - 1)
        e_in_bar = e_step % 8
        swing_s = 0.010 if (e_in_bar % 2 == 1) else 0.0
        t_step = e_step * EIGHTH_SEC + swing_s
        idx = int(t_step * SR)
        if idx >= N_SAMPLES:
            break

        note_midi = bar_bass_eighths[bar_i][e_in_bar]
        b_freq = midi_to_freq(note_midi)
        note_dur = EIGHTH_SEC * 1.12
        b_sig = synth_plucked_string(b_freq, note_dur, SR, drive=2.3, pick_pos=0.19, rng=rng)
        tt = np.arange(len(b_sig)) / float(SR)
        sub_osc = (
            0.58 * np.sin(2.0 * np.pi * b_freq * tt)
            + 0.25 * np.tanh(np.sin(2.0 * np.pi * b_freq * tt) * 2.2)
        ) * np.exp(-tt * 5.2)
        b_comb = b_sig * 0.75 + sub_osc
        end_i = min(N_SAMPLES, idx + len(b_comb))
        bass_track[idx:end_i] += b_comb[:end_i - idx]

    sos_bass_lp = signal.butter(3, 1900.0, btype="lowpass", fs=SR, output="sos")
    sos_bass_hp = signal.butter(2, 34.0, btype="highpass", fs=SR, output="sos")
    bass_track = signal.sosfilt(sos_bass_hp, signal.sosfilt(sos_bass_lp, np.tanh(bass_track * 1.50)))
    bass_track *= sidechain_env

    # -----------------------------------------------------------------------
    # 3. 100% ORIGINAL E-DORIAN DISTORTION GUITARS + EDM SUPERSAW CHORDS
    # -----------------------------------------------------------------------
    gtr_l = np.zeros(N_SAMPLES, dtype=np.float64)
    gtr_r = np.zeros(N_SAMPLES, dtype=np.float64)
    saw_l = np.zeros(N_SAMPLES, dtype=np.float64)
    saw_r = np.zeros(N_SAMPLES, dtype=np.float64)

    dance_chords = [
        # Bar 0 & 1 (Beats 0 - 8, 0.00s - 4.29s): Filtered Intro & Build
        (0.0, 2.0, [52, 59, 64, 67], 4.5),        # Em
        (2.0, 1.0, [55, 62, 67], 4.8),            # G5
        (3.0, 1.0, [57, 64, 69], 5.0),            # A5
        (4.0, 1.5, [57, 64, 69, 73], 5.4),        # A major (Dorian IV)
        (5.5, 1.5, [60, 67, 72], 5.8),            # C5
        (7.0, 1.0, [59, 66, 71], 6.2),            # B5 build peak
        # Bar 2 & 3 (Beats 8 - 16, 4.29s - 8.57s): THE EDM DROP & LATTICE REVEAL!
        (8.0,  2.0, [52, 59, 64, 67, 71], 6.5),   # Em9 drop chord!
        (10.0, 1.0, [55, 62, 67, 71], 6.2),       # Gmaj7
        (11.0, 1.0, [57, 64, 69, 73], 6.4),       # A (Dorian IV)
        (12.0, 1.5, [60, 67, 72, 76], 6.4),       # Cmaj7
        (13.5, 1.5, [62, 69, 74, 78], 6.2),       # Dmaj9
        (15.0, 1.0, [59, 66, 71], 6.2),           # Bm
        # Bar 4 & 5 (Beats 16 - 24, 8.57s - 12.86s): Second Drop Phrase -> Full 5x5 Lattice!
        (16.0, 2.0, [52, 59, 64, 67, 71], 6.5),   # Em9
        (18.0, 1.0, [57, 64, 69, 73], 6.3),       # A
        (19.0, 1.0, [60, 67, 72, 76], 6.3),       # Cmaj7
        (20.0, 1.5, [62, 69, 74, 78], 6.4),       # Dmaj9
        (21.5, 1.5, [59, 66, 71], 6.2),           # Bm
        (23.0, 1.0, [52, 59, 64, 67], 6.0),       # Em
        # Bar 6 (Beats 24 - 28, 12.86s - 15.00s): Full Lattice Vista Dance Groove
        (24.0, 1.5, [52, 59, 64, 67, 71], 6.2),   # Em9
        (25.5, 1.5, [57, 64, 69, 73], 6.0),       # A6
        (27.0, 1.0, [60, 67, 72, 76], 5.8),       # Cmaj7
        # Bar 7 & 8 (Beats 28 - 37.3, 15.00s - 20.00s): Melodic EDM Outro into Fade-Out
        (28.0, 2.0, [60, 67, 72, 76], 5.6),       # Cmaj7
        (30.0, 2.0, [62, 69, 74, 78], 5.4),       # D6
        (32.0, 2.0, [59, 66, 71, 74], 5.0),       # Bm7
        (34.0, 3.5, [52, 59, 64, 67, 71], 4.8),   # Em9 sustained fade
    ]

    for st_beat, dur_beats, notes, drv in dance_chords:
        t0 = st_beat * BEAT_SEC
        if t0 >= DURATION:
            continue
        idx = int(t0 * SR)
        dur_s = min(dur_beats * BEAT_SEC * 1.08, DURATION - t0)
        if dur_s <= 0.01:
            continue

        chord_l = np.zeros(int(dur_s * SR), dtype=np.float64)
        chord_r = np.zeros(int(dur_s * SR), dtype=np.float64)
        for i_n, nm in enumerate(notes):
            f_l = midi_to_freq(nm) * (1.0 - 0.0017 * (i_n + 1))
            f_r = midi_to_freq(nm) * (1.0 + 0.0020 * (i_n + 1))
            chord_l += synth_plucked_string(f_l, dur_s, SR, drive=1.2, pick_pos=0.16, rng=rng)
            chord_r += synth_plucked_string(f_r, dur_s, SR, drive=1.2, pick_pos=0.23, rng=rng)

        fuzz_l = np.tanh(chord_l * drv) + 0.32 * np.tanh(chord_l * drv * 2.3)
        fuzz_r = np.tanh(chord_r * drv) + 0.32 * np.tanh(chord_r * drv * 2.3)

        end_i = min(N_SAMPLES, idx + len(fuzz_l))
        gtr_l[idx:end_i] += fuzz_l[:end_i - idx] * 0.38
        gtr_r[idx:end_i] += fuzz_r[:end_i - idx] * 0.38

        if st_beat >= 8.0:
            s_l, s_r = synth_supersaw_chord(notes, dur_s, SR)
            saw_l[idx:end_i] += s_l[:end_i - idx]
            saw_r[idx:end_i] += s_r[:end_i - idx]

    # 100% Original E-Dorian Lead Guitar / Synth Hook starting at the Drop (Beat 8 = 4.29s)
    lead_melody = [
        # Bar 2 (4.29s - 6.43s): Original syncopated Dorian hook (E5 -> B5 -> C#6 -> B5 -> A5 -> G5)
        (8.0,  0.75, 76), (8.75,  0.75, 83), (9.5,  0.5, 85),
        (10.0, 1.0,  83), (11.0,  0.5,  81), (11.5, 0.5, 79),
        # Bar 3 (6.43s - 8.57s): Soaring Cmaj7 -> D6 turnaround (G5 -> A5 -> B5 -> D6 -> B5)
        (12.0, 0.75, 79), (12.75, 0.75, 81), (13.5, 0.5, 83),
        (14.0, 1.0,  86), (15.0,  1.0,  83),
        # Bar 4 (8.57s - 10.71s): Second phrase peak (E6 = 88 -> D6 = 86 -> C#6 = 85 -> B5 = 83)
        (16.0, 0.75, 88), (16.75, 0.75, 86), (17.5, 0.5, 85),
        (18.0, 1.0,  83), (19.0,  1.0,  81),
        # Bar 5 (10.71s - 12.86s, Full 5x5 Lattice Climax!):
        (20.0, 0.75, 86), (20.75, 0.75, 85), (21.5, 0.5, 83),
        (22.0, 2.0,  76),
        # Bar 6 (12.86s - 15.00s): Wide Lattice Dance Riff
        (24.0, 0.75, 76), (24.75, 0.75, 83), (25.5, 0.5, 85),
        (26.0, 1.0,  83), (27.0,  1.0,  79),
        # Bar 7 & 8 (15.00s - 20.00s): Outro melodic echoes
        (28.0, 1.5,  81), (29.5,  1.5,  79), (31.0, 1.0, 78),
        (32.0, 2.0,  76), (34.0,  3.0,  64),
    ]

    for st_b, dur_b, m_note in lead_melody:
        t0 = st_b * BEAT_SEC
        if t0 >= DURATION:
            continue
        idx = int(t0 * SR)
        dur_s = min(dur_b * BEAT_SEC * 1.05, DURATION - t0)
        f0 = midi_to_freq(m_note)
        n_l = int(dur_s * SR)
        tl = np.arange(n_l) / float(SR)
        vib = 1.0 + 0.006 * np.sin(2.0 * np.pi * 5.2 * tl)
        ph = 2.0 * np.pi * np.cumsum(f0 * vib) / float(SR)
        raw_lead = np.sin(ph) + 0.55 * np.sin(2.0 * ph + 0.3) + 0.35 * np.sin(3.0 * ph + 0.9)
        env_l = np.minimum(1.0, tl / 0.008) * np.exp(-tl * 2.2)
        fuzz_lead = np.tanh(raw_lead * 3.6) * env_l * 0.34
        end_i = min(N_SAMPLES, idx + n_l)
        gtr_l[idx:end_i] += fuzz_lead[:end_i - idx] * 0.92
        gtr_r[idx:end_i] += fuzz_lead[:end_i - idx] * 1.08

    gtr_l = guitar_cabinet_ir(gtr_l, SR)
    gtr_r = guitar_cabinet_ir(gtr_r, SR)
    gtr_l, gtr_r = binson_echorec_stereo(gtr_l, gtr_r, SR)

    gtr_l = (gtr_l + saw_l) * sidechain_env
    gtr_r = (gtr_r + saw_r) * sidechain_env

    # -----------------------------------------------------------------------
    # 4. MASTER MIX & QUIET -> LOUD EDM DROP -> FADE-OUT ENVELOPE
    # -----------------------------------------------------------------------
    raw_l = drums_l * 1.00 + bass_track * 0.92 + gtr_l * 0.78
    raw_r = drums_r * 1.00 + bass_track * 0.92 + gtr_r * 0.78

    mix_l, mix_r = apply_edm_dynamic_arc(raw_l, raw_r, SR)

    stereo_int16 = np.column_stack([
        np.clip(mix_l * 32767.0, -32768, 32767).astype(np.int16),
        np.clip(mix_r * 32767.0, -32768, 32767).astype(np.int16),
    ])
    wavfile.write(OUT_WAV, SR, stereo_int16)

    print(f"[DONE] Wrote 112 BPM EDM master audio (Drop @ 4.29s): {OUT_WAV}")
    for sec in range(0, 20, 2):
        s0, s1 = sec * SR, (sec + 2) * SR
        rms = math.sqrt(np.mean(mix_l[s0:s1] ** 2))
        db = 20.0 * math.log10(max(rms, 1e-6))
        print(f"       t = {sec:2d}s - {sec+2:2d}s | RMS = {rms:.4f} ({db:6.1f} dBFS)")


if __name__ == "__main__":
    generate_track()
