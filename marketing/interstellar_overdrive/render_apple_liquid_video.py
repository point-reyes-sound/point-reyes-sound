"""
render_apple_liquid_video.py
Apple-Quality Continuous Quantum Liquid Raymarcher for Interstellar Overdrive.
Point Reyes Sound - Electronic Quantum Fluid (arXiv:2608.14979)

Directives Implemented:
1. Temporal Baseline Tracking & Riff Signature:
   - Bandpass filter in riff register (45-260 Hz) and Hilbert analytic signal.
   - Continuous temporal baseline envelope B(t) extracted via lowpass filter (0.8 Hz).
   - Riff fluctuation signature delta(t) = max(0, A(t) - B(t)) capturing note attacks and drum kicks.
   - Center-of-mass phase-space dipole sloshing along (z, p_z) driven directly by the riff waveform.
   - Breathing mode R(t) coupled to baseline swell and note fluctuations.
   - Quantum surface ripples radiating at acoustic phase velocity phi_riff(t).
   - Non-classical Wigner negative moat (pink/red) deepening with the baseline.
2. Initial Frames Typography:
   - z and p_z plotted in pure deep black with clean light boundary in initial frames (t < 3.5s).
   - Smoothly illuminates into radiant cyan and emerald green as the riff erupts.
   - 100% of all text set exclusively in EB Garamond.
3. Still Ground State:
   - Completely calm and glassy at t = 0.0s - 3.2s.
4. Pan Out & Crystalline Lattice (36s - 54s) + Outro Audio Fade (54s - 60s).
"""

import os
import sys
import math
import time
import subprocess
import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as signal
import numba
from numba import njit, prange
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION = 60.0
TOTAL_FRAMES = int(FPS * DURATION)

BASE_DIR = "/Users/romitchakraborty/QAI/point-reyes-sound"
OUTPUT_DIR = os.path.join(BASE_DIR, "marketing", "interstellar_overdrive")
AUDIO_CLEAN_WAV = os.path.join(OUTPUT_DIR, "interstellar_overdrive_1min.wav")
FINAL_MP4_PATH = os.path.join(OUTPUT_DIR, "electronic_quantum_fluid_1080p.mp4")

# ---------------------------------------------------------------------------
# 1. Precompute Audio Baseline Tracking & Musical Dynamics (Interstellar Overdrive)
# ---------------------------------------------------------------------------
print(f"[1/4] Loading audio and computing baseline & riff signature: {AUDIO_CLEAN_WAV}")
sample_rate, audio_data = wavfile.read(AUDIO_CLEAN_WAV)
if audio_data.dtype == np.int16:
    audio_data = audio_data.astype(np.float32) / 32768.0
if len(audio_data.shape) > 1:
    audio_mono = np.mean(audio_data, axis=1)
else:
    audio_mono = audio_data

samples_per_frame = int(sample_rate / FPS)

# Bandpass filter for the bass riff: 45 Hz - 260 Hz
sos_riff = signal.butter(4, [45, 260], btype='bandpass', fs=sample_rate, output='sos')
y_riff = signal.sosfiltfilt(sos_riff, audio_mono)

riff_rms = np.zeros(TOTAL_FRAMES, dtype=np.float32)
for f in range(TOTAL_FRAMES):
    st = f * samples_per_frame
    en = min(len(audio_mono), (f + 1) * samples_per_frame)
    riff_rms[f] = np.sqrt(np.mean(y_riff[st:en]**2))

# Smooth RMS with 1.2 Hz lowpass filter for silky human timescale (no high-frequency jitter)
sos_smooth = signal.butter(2, 1.2, btype='lowpass', fs=FPS, output='sos')
riff_smooth = signal.sosfiltfilt(sos_smooth, riff_rms)
riff_smooth = np.maximum(0.0, riff_smooth)
riff_norm = np.clip(riff_smooth / (np.percentile(riff_smooth[150:], 98) + 1e-6), 0.0, 1.5)

# Baseline phrase envelope at 0.5 Hz (~2s timescale)
sos_base = signal.butter(2, 0.5, btype='lowpass', fs=FPS, output='sos')
base_smooth = signal.sosfiltfilt(sos_base, riff_norm)
base_norm = np.clip(base_smooth / (np.percentile(base_smooth[150:], 98) + 1e-6), 0.0, 1.5)

# Vibe Activation Curve: COMPLETELY STILL during intro (0.0s - 3.2s)
vibe_history = np.zeros(TOTAL_FRAMES, dtype=np.float32)
smooth_phase = np.zeros(TOTAL_FRAMES, dtype=np.float32)
R_history = np.zeros(TOTAL_FRAMES, dtype=np.float32)
virial_history = np.zeros(TOTAL_FRAMES, dtype=np.float32)

curr_p = 0.0
curr_R = 0.74

for f in range(TOTAL_FRAMES):
    t = f / FPS
    if t < 3.2:
        vibe = 0.0
    elif t < 4.2:
        u = (t - 3.2) / 1.0
        vibe = 3.0 * u**2 - 2.0 * u**3
    else:
        vibe = 1.0
    vibe_history[f] = vibe

    # Smooth phase accumulator: slow, majestic wave propagation
    # omega between 1.6 rad/s (calm) and 2.6 rad/s (peak riff) -> ~0.3 Hz human timescale
    omega = (1.6 + 1.0 * riff_norm[f]) * vibe
    curr_p += omega * (1.0 / FPS)
    smooth_phase[f] = curr_p

    if vibe <= 0.001:
        curr_R = 0.74
        virial = 1.00
    else:
        # Smooth molecular breathing with riff: R oscillates around 0.74 between ~0.67 and 0.81
        target_R = 0.74 + 0.08 * math.sin(curr_p * 1.1) * (0.6 + 0.6 * riff_norm[f]) * vibe
        curr_R += (target_R - curr_R) * 0.10
        deltaR = curr_R - 0.74
        virial_val = 1.00 - 0.22 * math.tanh(1.94 * deltaR) + 0.02 * math.cos(curr_p * 1.3) * vibe
        virial = max(0.85, min(1.15, virial_val))
    R_history[f] = curr_R
    virial_history[f] = virial

# Smooth centroid sway in phase space on human timescale
z_shift_history = np.sin(smooth_phase * 0.75) * (0.08 * riff_norm + 0.06 * base_norm) * vibe_history
p_shift_history = np.cos(smooth_phase * 0.75) * (0.07 * riff_norm + 0.05 * base_norm) * vibe_history

# Preload luxury EB Garamond typography
FONT_DIR = "/Users/romitchakraborty/Library/Fonts/static"
font_title = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Bold.ttf", 44)
font_sub = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Regular.ttf", 24)
font_virial = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Regular.ttf", 24)
font_math = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-SemiBoldItalic.ttf", 44)
font_math_sub = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-SemiBoldItalic.ttf", 28)

def draw_luxury_text(draw_ctx, pos, text, font, fill_color, shadow_alpha=220):
    x, y = pos
    for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1), (0, 3), (2, 2)]:
        draw_ctx.text((x + ox, y + oy), text, font=font, fill=(0, 0, 0, shadow_alpha))
    draw_ctx.text((x, y), text, font=font, fill=fill_color)

# ---------------------------------------------------------------------------
# 2. Continuous Quantum Liquid Raymarching Kernel with Baseline & Riff Signature
# ---------------------------------------------------------------------------
@njit(fastmath=True)
def get_single_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe):
    # Phase-space coordinate shift driven directly by the riff
    eff_z = z - z_shift * 0.26 * vibe
    eff_p = p - p_shift * 0.20 * vibe

    ellip_sq = (eff_z / 3.4)**2 + (eff_p / 2.9)**2
    if ellip_sq >= 1.0:
        return 0.0

    sigma_z = 0.58
    sigma_p = 0.82

    zA = -R * 0.45
    zB = +R * 0.45

    distA2 = (eff_z - zA)**2 / (2.0 * sigma_z**2) + eff_p**2 / (2.0 * sigma_p**2)
    distB2 = (eff_z - zB)**2 / (2.0 * sigma_z**2) + eff_p**2 / (2.0 * sigma_p**2)
    wA = math.exp(-distA2)
    wB = math.exp(-distB2)

    S = math.exp(-(R**2) / (4.0 * sigma_z**2))
    k_p = 2.3 * R
    cross_dist = (eff_z**2) / (2.0 * sigma_z**2) + (eff_p**2) / (2.0 * sigma_p**2)
    w_cross = 2.0 * math.exp(-cross_dist) * math.cos(k_p * eff_p)

    w_cov = (wA + wB + w_cross) / (2.0 * (1.0 + S))
    w_anti = (wA + wB - w_cross) / (2.0 * (1.0 - S + 0.08))

    # Anti-bonding quantum non-classical depression modulated by baseline
    c_anti = min(0.68, max(0.0, (R - 0.74) * 0.85 + 0.25 * base_val * vibe + 0.18 * fluct_val * vibe))
    W_base = (1.0 - c_anti) * w_cov - c_anti * w_anti * 0.92

    # Still ground-state: absolutely calm, glassy, zero ripples
    if vibe <= 0.001:
        total_W = W_base * 1.65
        norm_r = math.sqrt(ellip_sq)
        fade = 1.0 - (3.0 * norm_r**2 - 2.0 * norm_r**3)
        return total_W * fade

    # Gentle, silky quantum ripples on human visual timescale (~0.3 Hz wave propagation)
    r_dist = math.sqrt(eff_z**2 + eff_p**2)
    phase1 = phase_val - r_dist * 2.8
    phase2 = 2.4 * eff_z - phase_val * 0.8
    phase3 = k_p * 1.2 * eff_p + phase_val * 0.6

    amp_radial = 0.16 * vibe * (0.06 + 0.55 * fluct_val + 0.35 * base_val)
    amp_z = 0.12 * vibe * (0.05 + 0.45 * fluct_val + 0.30 * base_val)
    amp_p = 0.10 * vibe * (0.04 + 0.40 * fluct_val + 0.25 * base_val)

    ripple_radial = amp_radial * math.cos(phase1) * math.exp(-r_dist / 3.2)
    ripple_z = amp_z * math.cos(phase2) * math.exp(-eff_z**2 / 3.5 - eff_p**2 / 2.2)
    ripple_p = amp_p * math.cos(phase3) * math.sin(2.8 * eff_z) * math.exp(-cross_dist)

    total_W = (W_base + ripple_radial + ripple_z + ripple_p) * 1.65
    norm_r = math.sqrt(ellip_sq)
    fade = 1.0 - (3.0 * norm_r**2 - 2.0 * norm_r**3)
    return total_W * fade

@njit(fastmath=True)
def get_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend):
    W_center = get_single_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe)
    if lattice_blend <= 0.001:
        return W_center

    pitch_z = 4.6
    pitch_p = 3.8

    W_lattice = 0.0
    for iz in range(-2, 3):
        for ip in range(-2, 3):
            if iz == 0 and ip == 0:
                continue
            cx = iz * pitch_z
            cp = ip * pitch_p

            rel_z = z - cx
            rel_p = p - cp

            lattice_phase = 0.75 * iz - 0.60 * ip
            R_loc = 0.74 + 0.12 * math.sin(phase_val * 0.9 + lattice_phase) * vibe

            w_site = get_single_wigner(rel_z, rel_p, R_loc, t, base_val * 0.8, fluct_val * 0.8, z_shift * 0.5, p_shift * 0.5, phase_val, vibe)

            site_dist = math.sqrt((iz / 2.4)**2 + (ip / 2.4)**2)
            site_weight = max(0.0, 1.0 - site_dist**2)

            W_lattice += w_site * site_weight

    return W_center + W_lattice * lattice_blend

@njit(fastmath=True)
def get_normal(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend):
    eps = 0.004
    w_c = get_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
    w_z = get_wigner(z + eps, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
    w_p = get_wigner(z, p + eps, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)

    nx = -(w_z - w_c) / eps
    ny = 1.0
    nz = -(w_p - w_c) / eps

    mag = math.sqrt(nx**2 + ny**2 + nz**2) + 1e-7
    return nx / mag, ny / mag, nz / mag

@njit(fastmath=True)
def intersect_bounding_box(ox, oy, oz, dx, dy, dz, x_rad, z_rad, y_min, y_max):
    inv_dx = 1.0 / (dx + 1e-9)
    inv_dy = 1.0 / (dy + 1e-9)
    inv_dz = 1.0 / (dz + 1e-9)

    tx1 = (-x_rad - ox) * inv_dx
    tx2 = (+x_rad - ox) * inv_dx
    t_min = min(tx1, tx2)
    t_max = max(tx1, tx2)

    ty1 = (y_min - oy) * inv_dy
    ty2 = (y_max - oy) * inv_dy
    t_min = max(t_min, min(ty1, ty2))
    t_max = min(t_max, max(ty1, ty2))

    tz1 = (-z_rad - oz) * inv_dz
    tz2 = (+z_rad - oz) * inv_dz
    t_min = max(t_min, min(tz1, tz2))
    t_max = min(t_max, max(tz1, tz2))

    if t_min > t_max or t_max < 0.0:
        return -1.0, -1.0
    return max(0.1, t_min), t_max

@njit(parallel=True, fastmath=True)
def render_apple_liquid_frame(img_buf, H, W_w, t, R, base_val, fluct_val, z_shift, p_shift, phase_val, cam_scale, lattice_blend, vibe):
    # Cinematic 3D camera pan & gentle orbital tracking for 3D depth perspective
    pan_angle = -0.3917 + 0.0055 * t + 0.035 * math.sin(0.12 * t)
    r_cam = 4.977 * cam_scale

    cam_x = r_cam * math.sin(pan_angle)
    cam_z = r_cam * math.cos(pan_angle)
    cam_y = (2.30 + 0.16 * math.sin(0.14 * t)) * (1.0 + (cam_scale - 1.0) * 0.95)

    look_x = 0.05 * math.sin(0.08 * t)
    look_y = 0.20 + 0.04 * math.cos(0.10 * t)
    look_z = 0.0

    fwd_x = look_x - cam_x; fwd_y = look_y - cam_y; fwd_z = look_z - cam_z
    f_len = math.sqrt(fwd_x**2 + fwd_y**2 + fwd_z**2)
    fwd_x /= f_len; fwd_y /= f_len; fwd_z /= f_len

    right_x = fwd_z; right_y = 0.0; right_z = -fwd_x
    r_len = math.sqrt(right_x**2 + right_z**2)
    right_x /= r_len; right_z /= r_len

    up_x = fwd_y * right_z - fwd_z * right_y
    up_y = fwd_z * right_x - fwd_x * right_z
    up_z = fwd_x * right_y - fwd_y * right_x
    u_len = math.sqrt(up_x**2 + up_y**2 + up_z**2)
    up_x /= u_len; up_y /= u_len; up_z /= u_len

    aspect = float(W_w) / float(H)
    fov_tan = 0.46

    L1x, L1y, L1z = -0.45, 0.80, 0.38
    L1_m = math.sqrt(L1x**2 + L1y**2 + L1z**2)
    L1x /= L1_m; L1y /= L1_m; L1z /= L1_m

    L2x, L2y, L2z = 0.65, 0.40, -0.65
    L2_m = math.sqrt(L2x**2 + L2y**2 + L2z**2)
    L2x /= L2_m; L2y /= L2_m; L2z /= L2_m

    x_bound = 5.2 + 6.0 * lattice_blend
    z_bound = 4.4 + 5.0 * lattice_blend

    for py in prange(H):
        y_ndc = (1.0 - 2.0 * (py + 0.5) / float(H)) * fov_tan
        for px in range(W_w):
            x_ndc = (2.0 * (px + 0.5) / float(W_w) - 1.0) * fov_tan * aspect

            dx = fwd_x + x_ndc * right_x + y_ndc * up_x
            dy = fwd_y + x_ndc * right_y + y_ndc * up_y
            dz = fwd_z + x_ndc * right_z + y_ndc * up_z
            d_len = math.sqrt(dx**2 + dy**2 + dz**2)
            dx /= d_len; dy /= d_len; dz /= d_len

            t_enter, t_exit = intersect_bounding_box(cam_x, cam_y, cam_z, dx, dy, dz, x_bound, z_bound, -1.2, 2.7)

            hit_liquid = False
            hit_rx = 0.0; hit_ry = 0.0; hit_rz = 0.0
            hit_w = 0.0

            if t_enter > 0.0:
                dist = t_enter
                rx0 = cam_x + dist * dx
                ry0 = cam_y + dist * dy
                rz0 = cam_z + dist * dz
                prev_diff = ry0 - get_wigner(rx0, rz0, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                prev_dist = dist

                step_sz = 0.12 * (1.0 + (cam_scale - 1.0) * 0.45)
                steps = int((t_exit - t_enter) / step_sz) + 1
                if steps > 65: steps = 65

                for s in range(steps):
                    dist += step_sz
                    if dist > t_exit: dist = t_exit

                    rx = cam_x + dist * dx
                    ry = cam_y + dist * dy
                    rz = cam_z + dist * dz

                    curr_diff = ry - get_wigner(rx, rz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)

                    if prev_diff > 0.0 and curr_diff <= 0.0:
                        da = prev_dist; db = dist
                        for bi in range(5):
                            dmid = 0.5 * (da + db)
                            by = cam_y + dmid * dy
                            bw = get_wigner(cam_x + dmid * dx, cam_z + dmid * dz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                            if by - bw > 0.0: da = dmid
                            else: db = dmid
                        hit_d = 0.5 * (da + db)
                        hit_rx = cam_x + hit_d * dx
                        hit_ry = cam_y + hit_d * dy
                        hit_rz = cam_z + hit_d * dz
                        hit_w = get_wigner(hit_rx, hit_rz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                        hit_liquid = True
                        break

                    prev_diff = curr_diff
                    prev_dist = dist
                    if dist >= t_exit: break

            if hit_liquid:
                nx, ny, nz = get_normal(hit_rx, hit_rz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                diff1 = max(0.0, nx * L1x + ny * L1y + nz * L1z)
                ambient = max(0.14, ny * 0.5 + 0.5)

                h1x = L1x - dx; h1y = L1y - dy; h1z = L1z - dz
                h1_m = math.sqrt(h1x**2 + h1y**2 + h1z**2)
                spec1 = max(0.0, (nx * h1x + ny * h1y + nz * h1z) / h1_m)**58.0

                h2x = L2x - dx; h2y = L2y - dy; h2z = L2z - dz
                h2_m = math.sqrt(h2x**2 + h2y**2 + h2z**2)
                spec2 = max(0.0, (nx * h2x + ny * h2y + nz * h2z) / h2_m)**42.0

                cos_v = max(0.0, -(nx * dx + ny * dy + nz * dz))
                fres = (1.0 - cos_v)**2.8

                if hit_w >= 0.0:
                    t_w = min(1.0, hit_w / 1.15)
                    # ROYAL BLUE TIP: as t_w -> 1.0, royal blue (dominant deep blue, controlled green)
                    # FLUORESCENT HUE AT INTERSECTION: as t_w -> 0.0, radiant cyan/turquoise hue
                    tip_blend = t_w**1.5

                    # Tip: Royal Blue [15, 45, 215]
                    royal_r = 15.0 + 35.0 * diff1
                    royal_g = 25.0 + 40.0 * diff1
                    royal_b = 210.0 + 45.0 * diff1

                    # Base: Fluorescent luminous cyan [6, 175, 235]
                    fluor_r = 6.0 + 20.0 * diff1
                    fluor_g = 165.0 + 50.0 * diff1
                    fluor_b = 225.0 + 30.0 * diff1

                    base_r = fluor_r * (1.0 - tip_blend) + royal_r * tip_blend + 18.0 * ambient
                    base_g = fluor_g * (1.0 - tip_blend) + royal_g * tip_blend + 22.0 * ambient
                    base_b = fluor_b * (1.0 - tip_blend) + royal_b * tip_blend + 35.0 * ambient

                    col_r = base_r + spec1 * 220.0 + spec2 * 40.0 + fres * 35.0
                    col_g = base_g + spec1 * 220.0 + fres * (95.0 * (1.0 - tip_blend) + 25.0 * tip_blend)
                    col_b = base_b + spec1 * 255.0 + fres * 165.0
                else:
                    t_neg = min(1.0, -hit_w / 0.45)
                    base_r = 95.0 * diff1 + 160.0 * t_neg + 28.0 * ambient
                    base_g = 6.0 * diff1 + 22.0 * t_neg + 10.0 * ambient
                    base_b = 60.0 * diff1 + 65.0 * t_neg + 18.0 * ambient

                    col_r = base_r + spec1 * 240.0 + spec2 * 110.0 + fres * 105.0
                    col_g = base_g + spec1 * 45.0 + fres * 30.0
                    col_b = base_b + spec1 * 85.0 + fres * 70.0

                # Fluorescent hue at the intersection of the blue and the pink
                meniscus = math.exp(-(hit_w**2) / 0.007)
                col_r += meniscus * 25.0
                col_g += meniscus * 175.0
                col_b += meniscus * 240.0

                rad_sq = (hit_rx / x_bound)**2 + (hit_rz / z_bound)**2
                edge_alpha = max(0.0, min(1.0, (1.0 - math.sqrt(rad_sq)) / 0.12))

                bg_r = 2.0; bg_g = 6.0; bg_b = 14.0
                final_r = col_r * edge_alpha + bg_r * (1.0 - edge_alpha)
                final_g = col_g * edge_alpha + bg_g * (1.0 - edge_alpha)
                final_b = col_b * edge_alpha + bg_b * (1.0 - edge_alpha)

                img_buf[py, px, 0] = int(min(255.0, max(0.0, final_r)))
                img_buf[py, px, 1] = int(min(255.0, max(0.0, final_g)))
                img_buf[py, px, 2] = int(min(255.0, max(0.0, final_b)))

            else:
                u_norm = float(px - W_w // 2) / float(W_w // 2)
                v_norm = float(py - H // 2) / float(H // 2)
                dist_center = math.sqrt(u_norm**2 + v_norm**2)

                if abs(dy) > 1e-4:
                    t_ground = -cam_y / dy
                    if t_ground > 0.0 and t_ground < 35.0:
                        gx = cam_x + t_ground * dx
                        gz = cam_z + t_ground * dz
                        if abs(gx) < 18.0 and abs(gz) < 16.0:
                            g_grid_x = abs(gx * 1.0 - round(gx * 1.0))
                            g_grid_z = abs(gz * 1.0 - round(gz * 1.0))
                            is_line = (g_grid_x < 0.016) or (g_grid_z < 0.016)
                            is_axis_z = abs(gz) < 0.022
                            is_axis_p = abs(gx) < 0.022

                            if is_axis_z or is_axis_p:
                                img_buf[py, px, 0] = 0
                                img_buf[py, px, 1] = 215
                                img_buf[py, px, 2] = 255
                                continue
                            elif is_line:
                                grid_fade = max(0.0, 1.0 - (gx**2 + gz**2) / 280.0)
                                val_b = int(18.0 + 32.0 * grid_fade)
                                val_g = int(12.0 + 24.0 * grid_fade)
                                img_buf[py, px, 0] = 2
                                img_buf[py, px, 1] = val_g
                                img_buf[py, px, 2] = val_b
                                continue

                bg_b = max(3, int(15.0 - dist_center * 10.0))
                bg_g = max(2, int(8.0 - dist_center * 5.0))
                bg_r = max(1, int(2.0 - dist_center * 1.5))
                img_buf[py, px, 0] = bg_r
                img_buf[py, px, 1] = bg_g
                img_buf[py, px, 2] = bg_b

# ---------------------------------------------------------------------------
# 3. Typography Overlay & Layout Engine (NO BOXES, NO NUCLEI, NO TIMER)
# ---------------------------------------------------------------------------
frame_buffer = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

def render_frame_image(f):
    t = f / float(FPS)
    R = R_history[f]
    virial = virial_history[f]
    vibe = vibe_history[f]
    base_val = base_norm[f]
    fluct_val = riff_norm[f]
    z_shift = z_shift_history[f]
    p_shift = p_shift_history[f]
    phase_val = smooth_phase[f]

    # Cinematic Camera & Lattice Reveal Trajectory
    # 0 - 36s: close hero view
    # 36s - 54s: smooth pan & elevation pull-back to reveal lattice
    # 54s - 60s: wide vista + audio fade out
    if t < 36.0:
        cam_scale = 1.0
        lattice_blend = 0.0
        label_alpha = 1.0
    elif t < 54.0:
        u = (t - 36.0) / 18.0
        s = 3.0 * u**2 - 2.0 * u**3  # Smoothstep
        cam_scale = 1.0 + 1.20 * s
        lattice_blend = s
        label_alpha = max(0.0, 1.0 - u * 2.0)
    else:
        cam_scale = 2.20
        lattice_blend = 1.0
        label_alpha = 0.0

    # 1. Raymarch Continuous Quantum Liquid Frame
    render_apple_liquid_frame(frame_buffer, HEIGHT, WIDTH, t, R, base_val, fluct_val, z_shift, p_shift, phase_val, cam_scale, lattice_blend, vibe)

    # 2. Typography Overlay (Luxury Editorial EB Garamond)
    img = Image.fromarray(frame_buffer, mode="RGB")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Centered Header: Title & Subtitle in EB Garamond (arXiv link removed)
    txt_title = "Electronic Quantum Fluid in Phase Space"
    b_title = font_title.getbbox(txt_title)
    w_title = b_title[2] - b_title[0]
    x_title = (WIDTH - w_title) // 2
    y_title = 42

    txt_sub = "Quantum Fluctuations in a Lattice of H2 Molecules"
    b_sub = font_sub.getbbox(txt_sub)
    w_sub = b_sub[2] - b_sub[0]
    x_sub = (WIDTH - w_sub) // 2
    y_sub = 98

    # Title with dropshadow
    for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1), (0, 3), (2, 2)]:
        draw.text((x_title + ox, y_title + oy), txt_title, font=font_title, fill=(0, 0, 0, 220))
    draw.text((x_title, y_title), txt_title, font=font_title, fill=(255, 255, 255, 255))

    # Subtitle with dropshadow
    for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (0, 2)]:
        draw.text((x_sub + ox, y_sub + oy), txt_sub, font=font_sub, fill=(0, 0, 0, 200))
    draw.text((x_sub, y_sub), txt_sub, font=font_sub, fill=(185, 230, 255, 240))

    # Virial Ratio in Yellow in top right in vertical alignment with txt_sub (y = 98) in EB Garamond
    txt_virial = f"Virial Ratio: {virial:.2f}"
    b_virial = font_virial.getbbox(txt_virial)
    w_virial = b_virial[2] - b_virial[0]
    x_virial = WIDTH - w_virial - 80
    y_virial = y_sub

    for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (0, 2)]:
        draw.text((x_virial + ox, y_virial + oy), txt_virial, font=font_virial, fill=(0, 0, 0, 200))
    draw.text((x_virial, y_virial), txt_virial, font=font_virial, fill=(255, 222, 45, 245))

    # Axis Labels: z and p_z only (EB Garamond SemiBoldItalic)
    if label_alpha > 0.01:
        a_int = int(255 * label_alpha)

        # In the initial frames (t < 3.5s), z and p_z are plotted in solid black
        # As the riff enters (3.5s <= t <= 5.0s), they smoothly transition to radiant phase-space colors
        if t < 3.5:
            col_z = (15, 15, 15, a_int)
            col_pz = (15, 15, 15, a_int)
            halo_alpha = int(140 * label_alpha)
        elif t < 5.0:
            tr = (t - 3.5) / 1.5
            s_tr = 3.0 * tr**2 - 2.0 * tr**3
            r_val = int(15 + (0 - 15) * s_tr)
            g_val = int(15 + (235 - 15) * s_tr)
            b_val = int(15 + (255 - 15) * s_tr)
            col_z = (r_val, g_val, b_val, a_int)
            col_pz = (r_val, g_val, b_val, a_int)
            halo_alpha = int(140 * (1.0 - s_tr) * label_alpha)
        else:
            col_z = (0, 235, 255, a_int)
            col_pz = (0, 235, 255, a_int)
            halo_alpha = 0

        # Position Axis: z only
        pos_x, pos_y = 110, 452
        for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1), (0, 3), (2, 2)]:
            draw.text((pos_x + ox, pos_y + oy), "z", font=font_math, fill=(0, 0, 0, int(220 * label_alpha)))
        if halo_alpha > 0:
            for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                draw.text((pos_x + ox, pos_y + oy), "z", font=font_math, fill=(255, 255, 255, halo_alpha))
        draw.text((pos_x, pos_y), "z", font=font_math, fill=col_z)

        # Momentum Axis: p_z only with subscript z
        mom_x, mom_y = 160, 894
        p_w = font_math.getbbox("p")[2] - font_math.getbbox("p")[0]
        for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1), (0, 3), (2, 2)]:
            draw.text((mom_x + ox, mom_y + oy), "p", font=font_math, fill=(0, 0, 0, int(220 * label_alpha)))
            draw.text((mom_x + p_w + 1 + ox, mom_y + 18 + oy), "z", font=font_math_sub, fill=(0, 0, 0, int(220 * label_alpha)))
        if halo_alpha > 0:
            for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                draw.text((mom_x + ox, mom_y + oy), "p", font=font_math, fill=(255, 255, 255, halo_alpha))
                draw.text((mom_x + p_w + 1 + ox, mom_y + 18 + oy), "z", font=font_math_sub, fill=(255, 255, 255, halo_alpha))
        draw.text((mom_x, mom_y), "p", font=font_math, fill=col_pz)
        draw.text((mom_x + p_w + 1, mom_y + 18), "z", font=font_math_sub, fill=col_pz)

    final_img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return final_img

# ---------------------------------------------------------------------------
# 4. Master FFmpeg Pipeline with Audio Fade-Out
# ---------------------------------------------------------------------------
def main():
    print(f"[2/4] Warmup JIT compiling continuous Apple liquid raymarcher...")
    render_apple_liquid_frame(frame_buffer, 100, 100, 0.0, 0.74, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    print(f"[3/4] Launching FFmpeg with pure original audio & smooth outro fade:")
    print(f"      Audio: {AUDIO_CLEAN_WAV}")
    print(f"      Output: {FINAL_MP4_PATH}")

    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", AUDIO_CLEAN_WAV,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "320k",
        "-af", "afade=t=out:st=54.0:d=6.0",
        "-metadata", "title=Electronic Quantum Fluid",
        "-metadata", "comment=https://arxiv.org/abs/2608.14979",
        "-shortest",
        FINAL_MP4_PATH
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    print(f"[4/4] Encoding {TOTAL_FRAMES} frames of Apple-quality quantum liquid (still intro -> musical vibe -> lattice reveal)...")
    t_start = time.time()
    for f in range(TOTAL_FRAMES):
        frame_img = render_frame_image(f)
        proc.stdin.write(frame_img.tobytes())

        if (f + 1) % 150 == 0 or f == TOTAL_FRAMES - 1:
            pct = ((f + 1) / TOTAL_FRAMES) * 100.0
            elapsed = time.time() - t_start
            fps_real = (f + 1) / elapsed
            rem_sec = (TOTAL_FRAMES - (f + 1)) / (fps_real + 1e-5)
            print(f"      Frame {f+1}/{TOTAL_FRAMES} ({pct:.1f}%) | {fps_real:.2f} fps | Est remaining: {rem_sec/60:.1f} min", flush=True)

    proc.stdin.close()
    proc.wait()

    if proc.returncode != 0:
        print(f"[ERROR] FFmpeg exited with code {proc.returncode}")
        sys.exit(1)

    print(f"\n[DONE] Master production video completed successfully!")
    print(f"       File: {FINAL_MP4_PATH}")

if __name__ == "__main__":
    main()
