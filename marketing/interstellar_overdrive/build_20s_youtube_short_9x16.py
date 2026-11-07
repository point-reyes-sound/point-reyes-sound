"""
build_20s_youtube_short_9x16.py
Renders the native 9:16 (1080x1920, 30 fps, 20.0s) YouTube Short for
Point Reyes Sound, Inc. — 'Electronic Quantum Fluid in Phase Space:
Quantum Fluctuations in a Lattice of H₂ Molecules'.

Aesthetic & Engineering Directives (Anti-Kitsch / Sovereign Monograph):
1. Native 9:16 3D Phase-Space Raymarching (1080x1920 portrait frustum):
   - Zero blurry letterbox bars, zero horizontal crop seams.
   - Sculpted 3D circular meniscus island floating on the dark phase-space coordinate grid.
2. YouTube Shorts UI Safe-Zone Architecture:
   - Upper 148..490px: Standalone Point Reyes Sound Phi (Φ) crest (zero text beside logo),
     1px surgical hairline rule, 2-line monumental EB Garamond Bold headline,
     EB Garamond Regular subtitle ('Lattice of H₂ Molecules'), and italic Virial Ratio readout.
   - Center 520..1520px: Unobstructed 3D quantum liquid & 5x5 H₂ lattice stage.
   - Bottom 1540..1920px: Clean dark coordinate grid safe zone so YouTube Shorts' bottom/right
     UI chrome (handle, caption, audio marquee, action buttons) never collides with content.
3. Engagement-Optimized 20s Timeline (Synced to 112 BPM EDM Track):
   - 0.00s - 4.29s: Single H₂ molecule quantum fluctuations + snare/riser build.
   - 4.29s - 11.50s: EDM Drop at 4.29s triggers continuous camera pull-back revealing the 5x5 H₂ lattice.
   - 11.50s - 20.00s: Full 8.5s vista of the 5x5 vibrating H₂ lattice + smooth audio fade-out for loop replay.
"""

import os
import sys
import math
import time
import shutil
import subprocess
import cv2
import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as signal
from numba import njit, prange
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "/Users/romitchakraborty/QAI/point-reyes-sound"
OUT_DIR = os.path.join(BASE_DIR, "marketing", "interstellar_overdrive")
PUBLIC_MEDIA_DIR = os.path.join(BASE_DIR, "public", "media", "interstellar")

AUDIO_WAV = os.path.join(OUT_DIR, "syd_barrett_techno_disco_20s.wav")
LOGO_PATH = os.path.join(OUT_DIR, "prs_phi_insignia.jpg")
OUTPUT_SHORT_MP4 = os.path.join(OUT_DIR, "point_reyes_sound_h2_lattice_short_9x16.mp4")
OUTPUT_SHORT_THUMB = os.path.join(OUT_DIR, "youtube_short_thumbnail_9x16.png")

# Raymarch grid (810x1440) -> Lanczos4 upsampled to 1080x1920 before native 1080x1920 typography
RW, RH = 810, 1440
OW, OH = 1080, 1920
FPS = 30
DURATION = 20.0
TOTAL_FRAMES = int(FPS * DURATION)  # 600 frames

FONT_DIR = "/Users/romitchakraborty/Library/Fonts/static"
font_title = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Bold.ttf", 58)
font_sub = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Regular.ttf", 28)
font_sub_2 = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Regular.ttf", 20)
font_virial = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-Italic.ttf", 24)
font_math = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-SemiBoldItalic.ttf", 44)
font_math_sub = ImageFont.truetype(f"{FONT_DIR}/EBGaramond-SemiBoldItalic.ttf", 28)

logo_size = 76
logo_img = Image.open(LOGO_PATH).convert("RGBA").resize((logo_size, logo_size), Image.Resampling.LANCZOS)
logo_mask = Image.new("L", (logo_size, logo_size), 0)
ImageDraw.Draw(logo_mask).rounded_rectangle([0, 0, logo_size - 1, logo_size - 1], radius=6, fill=255)


def compute_audio_trajectories():
    """Extracts bass/riff envelope and phase trajectories from the 20s 112 BPM EDM WAV."""
    sr, data = wavfile.read(AUDIO_WAV)
    if data.dtype == np.int16:
        data = data.astype(np.float32) / 32768.0
    mono = np.mean(data, axis=1) if data.ndim > 1 else data
    spf = int(sr / FPS)

    sos_riff = signal.butter(4, [45, 260], btype="bandpass", fs=sr, output="sos")
    y_riff = signal.sosfiltfilt(sos_riff, mono)

    riff_rms = np.zeros(TOTAL_FRAMES, dtype=np.float32)
    for f in range(TOTAL_FRAMES):
        st = f * spf
        en = min(len(mono), (f + 1) * spf)
        riff_rms[f] = np.sqrt(np.mean(y_riff[st:en] ** 2) + 1e-12)

    sos_smooth = signal.butter(2, 1.5, btype="lowpass", fs=FPS, output="sos")
    riff_smooth = np.maximum(0.0, signal.sosfiltfilt(sos_smooth, riff_rms))
    riff_norm = np.clip(riff_smooth / (np.percentile(riff_smooth, 96) + 1e-6), 0.0, 1.45)

    sos_base = signal.butter(2, 0.6, btype="lowpass", fs=FPS, output="sos")
    base_smooth = np.maximum(0.0, signal.sosfiltfilt(sos_base, riff_norm))
    base_norm = np.clip(base_smooth / (np.percentile(base_smooth, 96) + 1e-6), 0.0, 1.45)

    vibe_hist = np.ones(TOTAL_FRAMES, dtype=np.float32)
    smooth_phase = np.zeros(TOTAL_FRAMES, dtype=np.float32)
    R_hist = np.zeros(TOTAL_FRAMES, dtype=np.float32)
    virial_hist = np.zeros(TOTAL_FRAMES, dtype=np.float32)

    curr_p = 2.4
    curr_R = 0.74
    for f in range(TOTAL_FRAMES):
        t = f / float(FPS)
        # Gentle awakening during Bar 1 -> full energy by the drop at 4.29s
        vibe = min(1.0, 0.55 + 0.45 * (t / 2.5))
        vibe_hist[f] = vibe
        omega = (1.85 + 1.15 * riff_norm[f]) * vibe
        curr_p += omega * (1.0 / FPS)
        smooth_phase[f] = curr_p

        target_R = 0.74 + 0.085 * math.sin(curr_p * 1.1) * (0.6 + 0.6 * riff_norm[f]) * vibe
        curr_R += (target_R - curr_R) * 0.12
        deltaR = curr_R - 0.74
        virial_val = 1.00 - 0.22 * math.tanh(1.94 * deltaR) + 0.02 * math.cos(curr_p * 1.3) * vibe
        R_hist[f] = curr_R
        virial_hist[f] = max(0.85, min(1.15, virial_val))

    z_shift_hist = np.sin(smooth_phase * 0.75) * (0.08 * riff_norm + 0.06 * base_norm) * vibe_hist
    p_shift_hist = np.cos(smooth_phase * 0.75) * (0.07 * riff_norm + 0.05 * base_norm) * vibe_hist
    return R_hist, virial_hist, vibe_hist, base_norm, riff_norm, z_shift_hist, p_shift_hist, smooth_phase


@njit(fastmath=True)
def get_single_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe):
    eff_z = z - z_shift * 0.26 * vibe
    eff_p = p - p_shift * 0.20 * vibe
    ellip_sq = (eff_z / 3.4) ** 2 + (eff_p / 2.9) ** 2
    if ellip_sq >= 1.0:
        return 0.0
    sigma_z = 0.58
    sigma_p = 0.82
    zA = -R * 0.45
    zB = +R * 0.45
    inv2sz = 1.0 / (2.0 * sigma_z ** 2)
    inv2sp = 1.0 / (2.0 * sigma_p ** 2)
    ep2 = (eff_p ** 2) * inv2sp
    wA = math.exp(-((eff_z - zA) ** 2) * inv2sz - ep2)
    wB = math.exp(-((eff_z - zB) ** 2) * inv2sz - ep2)
    S = math.exp(-(R ** 2) / (4.0 * sigma_z ** 2))
    k_p = 2.3 * R
    cross_dist = (eff_z ** 2) * inv2sz + ep2
    exp_cross = math.exp(-cross_dist)
    w_cross = 2.0 * exp_cross * math.cos(k_p * eff_p)
    w_cov = (wA + wB + w_cross) / (2.0 * (1.0 + S))
    w_anti = (wA + wB - w_cross) / (2.0 * (1.0 - S + 0.08))
    c_anti = min(0.68, max(0.0, (R - 0.74) * 0.85 + 0.25 * base_val * vibe + 0.18 * fluct_val * vibe))
    W_base = (1.0 - c_anti) * w_cov - c_anti * w_anti * 0.92
    if vibe <= 0.001:
        norm_r = math.sqrt(ellip_sq)
        return W_base * 1.65 * (1.0 - (3.0 * norm_r ** 2 - 2.0 * norm_r ** 3))
    r_dist = math.sqrt(eff_z ** 2 + eff_p ** 2)
    amp_radial = 0.16 * vibe * (0.06 + 0.55 * fluct_val + 0.35 * base_val)
    amp_z = 0.12 * vibe * (0.05 + 0.45 * fluct_val + 0.30 * base_val)
    amp_p = 0.10 * vibe * (0.04 + 0.40 * fluct_val + 0.25 * base_val)
    ripple_radial = amp_radial * math.cos(phase_val - r_dist * 2.8) * math.exp(-r_dist / 3.2)
    ripple_z = amp_z * math.cos(2.4 * eff_z - phase_val * 0.8) * math.exp(-(eff_z ** 2) / 3.5 - (eff_p ** 2) / 2.2)
    ripple_p = amp_p * math.cos(k_p * 1.2 * eff_p + phase_val * 0.6) * math.sin(2.8 * eff_z) * exp_cross
    norm_r = math.sqrt(ellip_sq)
    return (W_base + ripple_radial + ripple_z + ripple_p) * 1.65 * (1.0 - (3.0 * norm_r ** 2 - 2.0 * norm_r ** 3))


@njit(fastmath=True)
def get_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend):
    W_total = 0.0
    if abs(z) < 3.42 and abs(p) < 2.92:
        W_total = get_single_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe)
    if lattice_blend <= 0.001:
        return W_total
    pitch_z = 4.6
    pitch_p = 3.8
    iz0 = int(math.floor(z / pitch_z))
    ip0 = int(math.floor(p / pitch_p))
    W_lattice = 0.0
    for iz in range(max(-2, iz0), min(2, iz0 + 1) + 1):
        rel_z = z - iz * pitch_z
        if abs(rel_z) >= 3.42:
            continue
        for ip in range(max(-2, ip0), min(2, ip0 + 1) + 1):
            if iz == 0 and ip == 0:
                continue
            rel_p = p - ip * pitch_p
            if abs(rel_p) >= 2.92:
                continue
            site_dist_sq = (iz / 2.4) ** 2 + (ip / 2.4) ** 2
            if site_dist_sq >= 1.0:
                continue
            R_loc = 0.74 + 0.12 * math.sin(phase_val * 0.9 + 0.75 * iz - 0.60 * ip) * vibe
            w_site = get_single_wigner(
                rel_z, rel_p, R_loc, t, base_val * 0.8, fluct_val * 0.8, z_shift * 0.5, p_shift * 0.5, phase_val, vibe
            )
            W_lattice += w_site * (1.0 - site_dist_sq)
    return W_total + W_lattice * lattice_blend


@njit(fastmath=True)
def get_normal(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend):
    eps = 0.004
    w_c = get_wigner(z, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
    w_z = get_wigner(z + eps, p, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
    w_p = get_wigner(z, p + eps, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
    nx = -(w_z - w_c) / eps
    ny = 1.0
    nz = -(w_p - w_c) / eps
    mag = math.sqrt(nx ** 2 + ny ** 2 + nz ** 2) + 1e-7
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
def render_vertical_frame(img_buf, H, W_w, t, R, base_val, fluct_val, z_shift, p_shift, phase_val, cam_scale, lattice_blend, vibe):
    pan_angle = -0.3917 + 0.0055 * t + 0.035 * math.sin(0.12 * t)
    r_cam = 5.35 * cam_scale
    cam_x = r_cam * math.sin(pan_angle)
    cam_z = r_cam * math.cos(pan_angle)
    cam_y = (2.60 + 0.16 * math.sin(0.14 * t)) * (1.0 + (cam_scale - 1.0) * 1.02)
    look_x = 0.05 * math.sin(0.08 * t)
    look_y = 0.16 + 0.04 * math.cos(0.10 * t)
    look_z = 0.0
    fwd_x = look_x - cam_x
    fwd_y = look_y - cam_y
    fwd_z = look_z - cam_z
    f_len = math.sqrt(fwd_x ** 2 + fwd_y ** 2 + fwd_z ** 2)
    fwd_x /= f_len
    fwd_y /= f_len
    fwd_z /= f_len
    right_x = fwd_z
    right_y = 0.0
    right_z = -fwd_x
    r_len = math.sqrt(right_x ** 2 + right_z ** 2)
    right_x /= r_len
    right_z /= r_len
    up_x = fwd_y * right_z - fwd_z * right_y
    up_y = fwd_z * right_x - fwd_x * right_z
    up_z = fwd_x * right_y - fwd_y * right_x
    u_len = math.sqrt(up_x ** 2 + up_y ** 2 + up_z ** 2)
    up_x /= u_len
    up_y /= u_len
    up_z /= u_len

    fov_x = 0.60
    fov_y = fov_x * (float(H) / float(W_w))
    y_center = 0.515 * float(H)

    L1x, L1y, L1z = -0.45, 0.80, 0.38
    L1_m = math.sqrt(L1x ** 2 + L1y ** 2 + L1z ** 2)
    L1x /= L1_m
    L1y /= L1_m
    L1z /= L1_m
    L2x, L2y, L2z = 0.65, 0.40, -0.65
    L2_m = math.sqrt(L2x ** 2 + L2y ** 2 + L2z ** 2)
    L2x /= L2_m
    L2y /= L2_m
    L2z /= L2_m

    x_bound = 3.45 + 7.35 * lattice_blend
    z_bound = 2.95 + 6.15 * lattice_blend

    y_top_start = 0.255 * float(H)
    y_top_span = 0.065 * float(H)
    y_bot_end = 0.945 * float(H)
    y_bot_span = 0.105 * float(H)

    for py in prange(H):
        y_ndc = ((y_center - (py + 0.5)) / (0.5 * float(H))) * fov_y
        top_fade = min(1.0, max(0.0, (py - y_top_start) / y_top_span))
        bot_fade = min(1.0, max(0.0, (y_bot_end - py) / y_bot_span))
        top_s = top_fade * top_fade * (3.0 - 2.0 * top_fade)
        bot_s = bot_fade * bot_fade * (3.0 - 2.0 * bot_fade)
        scene_fade = top_s * bot_s

        for px in range(W_w):
            u_norm = float(px - W_w // 2) / float(W_w // 2)
            v_norm = float(py - H // 2) / float(H // 2)
            dist_center = math.sqrt(u_norm ** 2 + v_norm ** 2)
            bg_b = max(3, int(15.0 - dist_center * 10.0))
            bg_g = max(2, int(8.0 - dist_center * 5.0))
            bg_r = max(1, int(2.0 - dist_center * 1.5))

            if scene_fade <= 0.001:
                img_buf[py, px, 0] = bg_r
                img_buf[py, px, 1] = bg_g
                img_buf[py, px, 2] = bg_b
                continue

            x_ndc = (2.0 * (px + 0.5) / float(W_w) - 1.0) * fov_x
            dx = fwd_x + x_ndc * right_x + y_ndc * up_x
            dy = fwd_y + x_ndc * right_y + y_ndc * up_y
            dz = fwd_z + x_ndc * right_z + y_ndc * up_z
            d_len = math.sqrt(dx ** 2 + dy ** 2 + dz ** 2)
            dx /= d_len
            dy /= d_len
            dz /= d_len

            t_enter, t_exit = intersect_bounding_box(cam_x, cam_y, cam_z, dx, dy, dz, x_bound, z_bound, -0.52, 1.32)
            hit_liquid = False
            hit_rx = 0.0
            hit_ry = 0.0
            hit_rz = 0.0
            hit_w = 0.0

            if t_enter > 0.0:
                dist = t_enter
                rx0 = cam_x + dist * dx
                ry0 = cam_y + dist * dy
                rz0 = cam_z + dist * dz
                prev_diff = ry0 - get_wigner(rx0, rz0, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                prev_dist = dist
                step_sz = 0.14 * (1.0 + (cam_scale - 1.0) * 0.45)
                steps = min(42, int((t_exit - t_enter) / step_sz) + 1)
                for s in range(steps):
                    dist += step_sz
                    if dist > t_exit:
                        dist = t_exit
                    rx = cam_x + dist * dx
                    ry = cam_y + dist * dy
                    rz = cam_z + dist * dz
                    curr_diff = ry - get_wigner(rx, rz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                    if prev_diff > 0.0 and curr_diff <= 0.0:
                        da = prev_dist
                        db = dist
                        for bi in range(4):
                            dmid = 0.5 * (da + db)
                            by = cam_y + dmid * dy
                            bw = get_wigner(
                                cam_x + dmid * dx, cam_z + dmid * dz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend
                            )
                            if by - bw > 0.0:
                                da = dmid
                            else:
                                db = dmid
                        hit_d = 0.5 * (da + db)
                        hit_rx = cam_x + hit_d * dx
                        hit_ry = cam_y + hit_d * dy
                        hit_rz = cam_z + hit_d * dz
                        hit_w = get_wigner(hit_rx, hit_rz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                        hit_liquid = True
                        break
                    prev_diff = curr_diff
                    prev_dist = dist
                    if dist >= t_exit:
                        break

            if hit_liquid:
                nx, ny, nz = get_normal(hit_rx, hit_rz, R, t, base_val, fluct_val, z_shift, p_shift, phase_val, vibe, lattice_blend)
                diff1 = max(0.0, nx * L1x + ny * L1y + nz * L1z)
                ambient = max(0.14, ny * 0.5 + 0.5)
                h1x = L1x - dx
                h1y = L1y - dy
                h1z = L1z - dz
                h1_m = math.sqrt(h1x ** 2 + h1y ** 2 + h1z ** 2)
                spec1 = max(0.0, (nx * h1x + ny * h1y + nz * h1z) / h1_m) ** 58.0
                h2x = L2x - dx
                h2y = L2y - dy
                h2z = L2z - dz
                h2_m = math.sqrt(h2x ** 2 + h2y ** 2 + h2z ** 2)
                spec2 = max(0.0, (nx * h2x + ny * h2y + nz * h2z) / h2_m) ** 42.0
                cos_v = max(0.0, -(nx * dx + ny * dy + nz * dz))
                fres = (1.0 - cos_v) ** 2.8
                if hit_w >= 0.0:
                    t_w = min(1.0, hit_w / 1.15)
                    tip_blend = t_w ** 1.5
                    royal_r = 15.0 + 35.0 * diff1
                    royal_g = 25.0 + 40.0 * diff1
                    royal_b = 210.0 + 45.0 * diff1
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
                meniscus = math.exp(-(hit_w ** 2) / 0.007)
                col_r += meniscus * 25.0
                col_g += meniscus * 175.0
                col_b += meniscus * 240.0
                rad_sq = (hit_rx / x_bound) ** 2 + (hit_rz / z_bound) ** 2
                edge_alpha = max(0.0, min(1.0, (1.0 - math.sqrt(rad_sq)) / 0.14)) * scene_fade
                final_r = col_r * edge_alpha + bg_r * (1.0 - edge_alpha)
                final_g = col_g * edge_alpha + bg_g * (1.0 - edge_alpha)
                final_b = col_b * edge_alpha + bg_b * (1.0 - edge_alpha)
                img_buf[py, px, 0] = int(min(255.0, max(0.0, final_r)))
                img_buf[py, px, 1] = int(min(255.0, max(0.0, final_g)))
                img_buf[py, px, 2] = int(min(255.0, max(0.0, final_b)))
            else:
                out_r = float(bg_r)
                out_g = float(bg_g)
                out_b = float(bg_b)
                if abs(dy) > 1e-4:
                    t_ground = -cam_y / dy
                    if t_ground > 0.0 and t_ground < 35.0:
                        gx = cam_x + t_ground * dx
                        gz = cam_z + t_ground * dz
                        if abs(gx) < 18.0 and abs(gz) < 16.0:
                            g_grid_x = abs(gx - round(gx))
                            g_grid_z = abs(gz - round(gz))
                            is_line = (g_grid_x < 0.016) or (g_grid_z < 0.016)
                            is_axis_z = abs(gz) < 0.022
                            is_axis_p = abs(gx) < 0.022
                            grid_fade = max(0.0, 1.0 - (gx ** 2 + gz ** 2) / 260.0) * scene_fade
                            if is_axis_z or is_axis_p:
                                out_r = out_r * (1.0 - grid_fade)
                                out_g = 215.0 * grid_fade + out_g * (1.0 - grid_fade)
                                out_b = 255.0 * grid_fade + out_b * (1.0 - grid_fade)
                            elif is_line:
                                val_b = 18.0 + 32.0 * grid_fade
                                val_g = 12.0 + 24.0 * grid_fade
                                out_r = 2.0 * grid_fade + out_r * (1.0 - grid_fade)
                                out_g = val_g * grid_fade + out_g * (1.0 - grid_fade)
                                out_b = val_b * grid_fade + out_b * (1.0 - grid_fade)
                img_buf[py, px, 0] = int(out_r)
                img_buf[py, px, 1] = int(out_g)
                img_buf[py, px, 2] = int(out_b)


def build_static_header_overlay():
    """
    Pre-renders the static upper sovereign header (Phi crest, hairline rule,
    2-line EB Garamond Bold title, and 'Lattice of H₂ Molecules' subtitle)
    at native 1080x1920 resolution for zero-overhead per-frame compositing.
    """
    overlay = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. Centered Standalone Point Reyes Sound Phi (Φ) Crest
    lx = (OW - logo_size) // 2
    ly = 148
    draw.rounded_rectangle([lx - 2, ly - 2, lx + logo_size + 2, ly + logo_size + 2], radius=8, fill=(0, 0, 0, 190))
    overlay.paste(logo_img, (lx, ly), logo_mask)

    # 2. Surgical Hairline Divider Rule
    rule_y = 248
    draw.line([(OW // 2 - 28, rule_y), (OW // 2 + 28, rule_y)], fill=(185, 230, 255, 85), width=1)

    # 3. Monumental 2-Line Editorial Title (EB Garamond Bold)
    t1 = "Electronic Quantum Fluid"
    t2 = "in Phase Space"
    w_t1 = font_title.getbbox(t1)[2] - font_title.getbbox(t1)[0]
    w_t2 = font_title.getbbox(t2)[2] - font_title.getbbox(t2)[0]
    x_t1 = (OW - w_t1) // 2
    x_t2 = (OW - w_t2) // 2
    y_t1 = 266
    y_t2 = 332

    for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (0, 3)]:
        draw.text((x_t1 + ox, y_t1 + oy), t1, font=font_title, fill=(0, 0, 0, 220))
        draw.text((x_t2 + ox, y_t2 + oy), t2, font=font_title, fill=(0, 0, 0, 220))
    draw.text((x_t1, y_t1), t1, font=font_title, fill=(255, 255, 255, 255))
    draw.text((x_t2, y_t2), t2, font=font_title, fill=(255, 255, 255, 255))

    # 4. Scientific Subtitle with Typographic Subscript ₂
    p1 = "Quantum Fluctuations in a Lattice of H"
    ps = "2"
    p2 = " Molecules"
    w1 = font_sub.getbbox(p1)[2] - font_sub.getbbox(p1)[0]
    ws = font_sub_2.getbbox(ps)[2] - font_sub_2.getbbox(ps)[0]
    w2 = font_sub.getbbox(p2)[2] - font_sub.getbbox(p2)[0]
    total_w = w1 + ws + w2
    xs = (OW - total_w) // 2
    ys = 416
    for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1), (0, 2)]:
        draw.text((xs + ox, ys + oy), p1, font=font_sub, fill=(0, 0, 0, 210))
        draw.text((xs + w1 + 1 + ox, ys + 10 + oy), ps, font=font_sub_2, fill=(0, 0, 0, 210))
        draw.text((xs + w1 + ws + 1 + ox, ys + oy), p2, font=font_sub, fill=(0, 0, 0, 210))
    sub_col = (185, 230, 255, 242)
    draw.text((xs, ys), p1, font=font_sub, fill=sub_col)
    draw.text((xs + w1 + 1, ys + 10), ps, font=font_sub_2, fill=sub_col)
    draw.text((xs + w1 + ws + 1, ys), p2, font=font_sub, fill=sub_col)

    return overlay


def composite_frame(rgb_1080x1920, static_header_rgba, virial_val, label_alpha):
    """Composites static header + dynamic Virial Ratio and phase-space axis notation."""
    overlay = static_header_rgba.copy()
    draw = ImageDraw.Draw(overlay)

    tv = f"Virial Ratio: {virial_val:.2f}"
    wv = font_virial.getbbox(tv)[2] - font_virial.getbbox(tv)[0]
    xv = (OW - wv) // 2
    yv = 464
    for ox, oy in [(-1, 0), (1, 0), (0, 1)]:
        draw.text((xv + ox, yv + oy), tv, font=font_virial, fill=(0, 0, 0, 200))
    draw.text((xv, yv), tv, font=font_virial, fill=(245, 216, 110, 230))

    if label_alpha > 0.01:
        a_int = int(255 * label_alpha)
        col_ax = (0, 235, 255, a_int)
        pos_x, pos_y = 82, 875
        mom_x, mom_y = 148, 1265
        p_w = font_math.getbbox("p")[2] - font_math.getbbox("p")[0]
        for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (0, 3)]:
            draw.text((pos_x + ox, pos_y + oy), "z", font=font_math, fill=(0, 0, 0, int(220 * label_alpha)))
            draw.text((mom_x + ox, mom_y + oy), "p", font=font_math, fill=(0, 0, 0, int(220 * label_alpha)))
            draw.text((mom_x + p_w + 1 + ox, mom_y + 18 + oy), "z", font=font_math_sub, fill=(0, 0, 0, int(220 * label_alpha)))
        draw.text((pos_x, pos_y), "z", font=font_math, fill=col_ax)
        draw.text((mom_x, mom_y), "p", font=font_math, fill=col_ax)
        draw.text((mom_x + p_w + 1, mom_y + 18), "z", font=font_math_sub, fill=col_ax)

    base_img = Image.fromarray(rgb_1080x1920, mode="RGB").convert("RGBA")
    return np.array(Image.alpha_composite(base_img, overlay).convert("RGB"))


def main():
    print("[1/4] Computing audio-reactive trajectories from 20s 112 BPM EDM master...")
    R_hist, virial_hist, vibe_hist, base_norm, riff_norm, z_shift_hist, p_shift_hist, smooth_phase = compute_audio_trajectories()

    print("[2/4] Warmup JIT compiling 9:16 vertical raymarcher...")
    ray_buf = np.zeros((RH, RW, 3), dtype=np.uint8)
    render_vertical_frame(ray_buf, RH, RW, 0.0, 0.74, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0)
    static_header_rgba = build_static_header_overlay()

    print(f"[3/4] Encoding 600 frames (20.0s @ 30fps, 1080x1920) -> {OUTPUT_SHORT_MP4}")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{OW}x{OH}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", AUDIO_WAV,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "17",
        "-g", "30",
        "-keyint_min", "30",
        "-bf", "2",
        "-profile:v", "high",
        "-level:v", "4.1",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "320k",
        "-ar", "48000",
        "-movflags", "+faststart",
        "-shortest",
        OUTPUT_SHORT_MP4,
    ]
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    t_drop = 4.285714
    t_full = 11.50
    t_start = time.time()

    for f in range(TOTAL_FRAMES):
        t = f / float(FPS)
        # Orbital camera time mapped to match the 16:9 master's majestic sweep
        if t <= t_drop:
            cam_scale = 1.0
            lattice_blend = 0.0
            label_alpha = 1.0
            t_cam = 31.714 + t
        elif t <= t_full:
            u = (t - t_drop) / (t_full - t_drop)
            s = 3.0 * (u ** 2) - 2.0 * (u ** 3)
            cam_scale = 1.0 + 1.48 * s
            lattice_blend = s
            label_alpha = max(0.0, 1.0 - u * 2.2)
            t_cam = 36.0 + 18.0 * s
        else:
            u = (t - t_full) / (20.0 - t_full)
            cam_scale = 2.48
            lattice_blend = 1.0
            label_alpha = 0.0
            t_cam = 54.0 + 5.95 * u

        render_vertical_frame(
            ray_buf,
            RH,
            RW,
            t_cam,
            R_hist[f],
            base_norm[f],
            riff_norm[f],
            z_shift_hist[f],
            p_shift_hist[f],
            smooth_phase[f],
            cam_scale,
            lattice_blend,
            vibe_hist[f],
        )
        up_rgb = cv2.resize(ray_buf, (OW, OH), interpolation=cv2.INTER_LANCZOS4)
        out_rgb = composite_frame(up_rgb, static_header_rgba, virial_hist[f], label_alpha)
        proc.stdin.write(out_rgb.tobytes())

        if f == int(14.0 * FPS):
            Image.fromarray(out_rgb, mode="RGB").save(OUTPUT_SHORT_THUMB)

        if (f + 1) % 100 == 0 or f == TOTAL_FRAMES - 1:
            elapsed = time.time() - t_start
            fps_real = (f + 1) / (elapsed + 1e-6)
            rem = (TOTAL_FRAMES - (f + 1)) / (fps_real + 1e-6)
            print(f"      Frame {f+1}/{TOTAL_FRAMES} ({(f+1)/TOTAL_FRAMES*100:.0f}%) | {fps_real:.1f} fps | rem: {rem:.1f}s", flush=True)

    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        print(f"[ERROR] FFmpeg exited with {proc.returncode}")
        sys.exit(1)

    os.makedirs(PUBLIC_MEDIA_DIR, exist_ok=True)
    shutil.copyfile(OUTPUT_SHORT_MP4, os.path.join(PUBLIC_MEDIA_DIR, "point_reyes_sound_h2_lattice_short_9x16.mp4"))
    shutil.copyfile(OUTPUT_SHORT_THUMB, os.path.join(PUBLIC_MEDIA_DIR, "youtube_short_thumbnail_9x16.png"))
    print(f"[4/4] Successfully created 9:16 YouTube Short: {OUTPUT_SHORT_MP4}")


if __name__ == "__main__":
    main()

