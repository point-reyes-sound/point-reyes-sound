"""
build_20s_quantum_lattice_clip.py
Produces the 20-second 1080p YouTube master (`electronic_quantum_fluid_20s.mp4`)
from the 60-second `electronic_quantum_fluid_1080p.mp4` master, paired with the
100% original 112 BPM EDM backing track (`syd_barrett_techno_disco_20s.wav`),
updates the header subtitle to:
"Quantum Fluctuations in a Lattice of H₂ Molecules",
and brands the video with the official Point Reyes Sound Phi (Φ) company insignia.
"""

import os
import sys
import math
import subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "/Users/romitchakraborty/QAI/point-reyes-sound"
OUT_DIR = os.path.join(BASE_DIR, "marketing", "interstellar_overdrive")
INPUT_MP4 = os.path.join(OUT_DIR, "electronic_quantum_fluid_1080p.mp4")
AUDIO_WAV = os.path.join(OUT_DIR, "syd_barrett_techno_disco_20s.wav")
LOGO_PATH = os.path.join(OUT_DIR, "prs_phi_insignia.jpg")
OUTPUT_MP4 = os.path.join(OUT_DIR, "electronic_quantum_fluid_20s.mp4")

WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION = 20.0
TOTAL_OUT_FRAMES = int(FPS * DURATION)  # 600 frames


def build_subtitle_replacement_patch():
    """
    Reconstructs the exact cosmic background for the subtitle band
    (y = 99..135, x = 640..1280) and renders:
    'Quantum Fluctuations in a Lattice of H₂ Molecules'
    in EB Garamond Regular.
    """
    y0, y1 = 99, 135
    x0, x1 = 640, 1280
    h_p = y1 - y0
    w_p = x1 - x0

    bg_patch = np.zeros((h_p, w_p, 3), dtype=np.uint8)
    for py in range(y0, y1):
        v_norm = float(py - HEIGHT // 2) / float(HEIGHT // 2)
        for px in range(x0, x1):
            u_norm = float(px - WIDTH // 2) / float(WIDTH // 2)
            dist_center = math.sqrt(u_norm ** 2 + v_norm ** 2)
            bg_b = max(3, int(15.0 - dist_center * 10.0))
            bg_g = max(2, int(8.0 - dist_center * 5.0))
            bg_r = max(1, int(2.0 - dist_center * 1.5))
            bg_patch[py - y0, px - x0, 0] = bg_r
            bg_patch[py - y0, px - x0, 1] = bg_g
            bg_patch[py - y0, px - x0, 2] = bg_b

    font_dir = "/Users/romitchakraborty/Library/Fonts/static"
    font_sub = ImageFont.truetype(f"{font_dir}/EBGaramond-Regular.ttf", 24)

    sub_txt = "Quantum Fluctuations in a Lattice"
    total_w = font_sub.getbbox(sub_txt)[2] - font_sub.getbbox(sub_txt)[0]

    x_start = (WIDTH - total_w) // 2 - x0
    y_text = 98 - y0

    pil_patch = Image.fromarray(bg_patch, mode="RGB").convert("RGBA")
    overlay = Image.new("RGBA", (w_p, h_p), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (0, 2)]:
        draw.text((x_start + ox, y_text + oy), sub_txt, font=font_sub, fill=(0, 0, 0, 200))

    fill_col = (185, 230, 255, 240)
    draw.text((x_start, y_text), sub_txt, font=font_sub, fill=fill_col)

    comp = np.array(Image.alpha_composite(pil_patch, overlay).convert("RGB"))
    return y0, y1, x0, x1, comp


def build_prs_insignia_patch():
    """
    Builds the standalone Point Reyes Sound Phi (Φ) company insignia
    in the top-left header area (y = 32..126, x = 54..150), with zero text.
    """
    y0, y1 = 32, 126
    x0, x1 = 54, 150
    h_p = y1 - y0
    w_p = x1 - x0

    overlay = Image.new("RGBA", (w_p, h_p), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Load and resize the official Point Reyes Sound Phi (Φ) logo
    logo_size = 76
    logo_img = Image.open(LOGO_PATH).convert("RGBA").resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Subtle rounded-corner mask (radius = 6px) for crisp presentation
    mask = Image.new("L", (logo_size, logo_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, logo_size - 1, logo_size - 1], radius=6, fill=255)

    lx, ly = 10, 10
    # Soft dark drop-shadow behind the insignia
    draw.rounded_rectangle(
        [lx - 2, ly - 2, lx + logo_size + 2, ly + logo_size + 2],
        radius=8,
        fill=(0, 0, 0, 190),
    )
    overlay.paste(logo_img, (lx, ly), mask)

    arr = np.array(overlay)
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = (arr[:, :, 3:4].astype(np.float32)) / 255.0
    return y0, y1, x0, x1, rgb, alpha


def build_smooth_time_map(n_frames=TOTAL_OUT_FRAMES, fps=FPS):
    """
    Engagement-optimized C1-smooth mapping tau in [0, 20s] -> t_orig in [31.71s, 59.95s]:
    - 0.00s -> 4.29s  (t_orig: 31.71s -> 36.00s): 1.0x natural close-up H2 quantum fluctuations
    - 4.29s -> 11.50s (t_orig: 36.00s -> 54.00s): Camera pull-back synced to the 4.29s EDM Drop,
      revealing the full 5x5 vibrating H2 lattice by t = 11.50s (well inside the 16s watch window!)
    - 11.50s -> 20.00s (t_orig: 54.00s -> 59.95s): Full 8.5 seconds of the entire 5x5 vibrating
      H2 molecular lattice dancing in phase space.
    """
    tau = np.arange(n_frames) / float(fps)
    t_orig = np.zeros_like(tau)

    t_drop = 4.285714
    t_full = 11.50

    for i, t in enumerate(tau):
        if t <= t_drop:
            # 1.0x natural speed: 31.714s -> 36.000s
            t_orig[i] = (36.0 - t_drop) + 1.0 * t
        elif t <= t_full:
            # Smooth C1 transition across the lattice reveal (36.0s -> 54.0s over 7.214s)
            u = (t - t_drop) / (t_full - t_drop)
            # Hermite spline with continuous derivative at endpoints (v0=1.0, v1=0.70, delta_T=18.0)
            # Standard cubic Hermite on [0, 1] with m0 = 1.0 * (7.214/18.0) = 0.40, m1 = 0.70 * (7.214/18.0) = 0.28
            h00 = 2.0 * (u ** 3) - 3.0 * (u ** 2) + 1.0
            h10 = (u ** 3) - 2.0 * (u ** 2) + u
            h01 = -2.0 * (u ** 3) + 3.0 * (u ** 2)
            h11 = (u ** 3) - (u ** 2)
            s = h01 + 0.40 * h10 + 0.28 * h11
            t_orig[i] = 36.0 + 18.0 * s
        else:
            # Full 5x5 vibrating H2 lattice vista (54.0s -> 59.95s over 8.50s)
            u = (t - t_full) / (20.0 - t_full)
            t_orig[i] = 54.0 + 5.95 * u

    return t_orig


def main():
    print(f"[1/3] Loading all frames from {INPUT_MP4}...")
    cap = cv2.VideoCapture(INPUT_MP4)
    orig_frames = []
    while True:
        ret, frame_bgr = cap.read()
        if not ret:
            break
        orig_frames.append(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))
    cap.release()
    n_orig = len(orig_frames)
    print(f"      Loaded {n_orig} original 1080p frames.")

    sy0, sy1, sx0, sx1, sub_patch = build_subtitle_replacement_patch()
    ly0, ly1, lx0, lx1, logo_rgb, logo_alpha = build_prs_insignia_patch()

    t_orig_map = build_smooth_time_map(TOTAL_OUT_FRAMES, FPS)
    f_orig_map = t_orig_map * FPS

    print(f"[2/3] Encoding branded 20s 1080p YouTube master -> {OUTPUT_MP4}")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
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
        OUTPUT_MP4,
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    for out_idx in range(TOTAL_OUT_FRAMES):
        f_exact = f_orig_map[out_idx]
        i0 = min(n_orig - 1, max(0, int(np.floor(f_exact))))
        i1 = min(n_orig - 1, i0 + 1)
        alpha = f_exact - i0

        if alpha < 1e-4 or i0 == i1:
            out_rgb = orig_frames[i0].copy()
        else:
            out_rgb = cv2.addWeighted(orig_frames[i0], 1.0 - alpha, orig_frames[i1], alpha, 0.0)

        # 1. Heal any raymarch step-through micro-notches at the tips of the royal-blue peaks
        roi = out_rgb[190:650, 200:1720]
        b_chan = roi[:, :, 2]
        mask_peak = (b_chan > 140).astype(np.uint8) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (23, 9))
        closed = cv2.morphologyEx(mask_peak, cv2.MORPH_CLOSE, kernel)
        notch_mask = ((closed > 0) & (b_chan < 120)).astype(np.uint8) * 255
        if notch_mask.any():
            out_rgb[190:650, 200:1720] = cv2.inpaint(roi, notch_mask, 5, cv2.INPAINT_TELEA)

        # 2. Replace subtitle with 'Quantum Fluctuations in a Lattice'
        out_rgb[sy0:sy1, sx0:sx1] = sub_patch

        # 2. Alpha-composite the Point Reyes Sound Phi (Φ) insignia & brand lockup
        roi = out_rgb[ly0:ly1, lx0:lx1].astype(np.float32)
        out_rgb[ly0:ly1, lx0:lx1] = (logo_rgb * logo_alpha + roi * (1.0 - logo_alpha)).astype(np.uint8)

        proc.stdin.write(out_rgb.tobytes())

    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        print(f"[ERROR] FFmpeg exited with {proc.returncode}")
        sys.exit(1)

    print(f"[3/3] Successfully created branded 20-second YouTube master: {OUTPUT_MP4}")


if __name__ == "__main__":
    main()
