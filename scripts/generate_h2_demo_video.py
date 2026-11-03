import os
import sys
import time
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Configuration & Constants
# ---------------------------------------------------------------------------
WIDTH = 1280
HEIGHT = 720
FPS = 15
TOTAL_FRAMES = 450 # 30 seconds at 15 fps
OUTPUT_DIR = "/tmp/h2_demo_frames"
AUDIO_PATH = "/Users/romitchakraborty/QAI/point-reyes-sound/public/audio/h2_phase_space_voiceover.mp3"
FINAL_VIDEO_PATH = "/Users/romitchakraborty/QAI/point-reyes-sound/public/media/h2_phase_space_demo.mp4"
ARTIFACT_VIDEO_PATH = "/Users/romitchakraborty/.gemini/antigravity-ide/brain/e0965ef3-f5af-49e6-9f8f-8b3ff916b8f1/h2_phase_space_demo.mp4"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs("/Users/romitchakraborty/QAI/point-reyes-sound/public/media", exist_ok=True)

# Font resolution
FONT_SANS_BOLD = "/System/Library/Fonts/Helvetica.ttc"
FONT_MONO = "/System/Library/Fonts/Monaco.ttf"

def get_font(size, is_mono=False):
    try:
        path = FONT_MONO if is_mono else FONT_SANS_BOLD
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

font_title = get_font(20)
font_header = get_font(15, True)
font_label = get_font(12, True)
font_body = get_font(14)
font_small = get_font(11, True)
font_tiny = get_font(9, True)

# Color Palette (Point Reyes Sound Obsidian / Emerald / Cyan)
BG_OBSIDIAN = (2, 9, 5)
CARD_BG = (3, 14, 7)
CARD_BORDER = (35, 100, 60)
EMERALD = (53, 255, 130)
CYAN = (0, 229, 255)
BLUE = (0, 136, 255)
RED = (255, 51, 75)
TEXT_WHITE = (240, 245, 242)
TEXT_MUTED = (140, 160, 150)
ACCENT_ORANGE = (255, 170, 50)

# Precompute trajectory parameters for R(t)
# R sweeps from 0.74 -> 3.20 -> 0.74 over frames 60 to 450 (390 frames = 26 seconds)
def get_state_at_frame(f):
    if f < 60:
        return 0.74, 1.98, 0.02, -22.84, 0.02, 0.0 # R, nBond, nAntibond, E_eV, SvN, progress
    progress = (f - 60) / 390.0
    # Ping-pong sinusoidal motion: 0.5 to 3.2 Å
    cycle = 0.5 * (1.0 - math.cos(progress * 2.0 * math.pi))
    r = 0.50 + 2.70 * cycle
    r_sing = 1.20
    if r <= r_sing:
        nb = 1.98
        na = 0.02
        e = -22.84 + 1.2 * (r - 0.74)**2
        svn = 0.02
    else:
        diff = min(1.0, (r - r_sing) / 1.6)
        nb = max(1.0, 1.98 - 0.98 * diff)
        na = min(1.0, 0.02 + 0.98 * diff)
        e = -22.84 + 4.75 * (1.0 - math.exp(-1.94 * (r - 0.74)))**2 - 4.75
        svn = min(1.0, 0.02 + 0.98 * diff)
    return r, nb, na, e, svn, progress

# Wigner distribution function
def compute_wigner_image(r, nb, na, grid_size=90):
    z = np.linspace(-3.2, 3.2, grid_size)
    p = np.linspace(-3.2, 3.2, grid_size)
    Z, P = np.meshgrid(z, p)
    sigma = 0.85
    zA, zB = -r * 0.5, r * 0.5
    distA2 = (Z - zA)**2 + P**2
    distB2 = (Z - zB)**2 + P**2
    wA = np.exp(-distA2 / (sigma**2))
    wB = np.exp(-distB2 / (sigma**2))
    S = math.exp(-(r**2) / (4.0 * sigma**2))
    cross = 2.0 * np.exp(-(Z**2 + P**2) / (sigma**2)) * np.cos(2.0 * Z * r * 0.85)
    w_sig_g = (wA + wB + cross) / (2.0 + 2.0 * S)
    w_sig_u = (wA + wB - cross) / (2.0 - 2.0 * S + 0.06)
    W = (nb * w_sig_g - na * w_sig_u) / 2.0
    
    # Map W to RGB colormap
    # Negative: Red, Zero: Dark Obsidian, Positive: Cyan/Blue/White
    norm = np.clip(W, -0.4, 0.8)
    img_arr = np.zeros((grid_size, grid_size, 3), dtype=np.uint8)
    pos_mask = norm > 0
    neg_mask = norm <= 0
    
    # Positives
    p_val = norm[pos_mask] / 0.8
    img_arr[pos_mask, 0] = (p_val * 40).astype(np.uint8)
    img_arr[pos_mask, 1] = (p_val * 220 + 35).astype(np.uint8)
    img_arr[pos_mask, 2] = (p_val * 255).astype(np.uint8)
    
    # Negatives
    n_val = np.abs(norm[neg_mask]) / 0.4
    img_arr[neg_mask, 0] = (n_val * 240 + 15).astype(np.uint8)
    img_arr[neg_mask, 1] = (n_val * 30).astype(np.uint8)
    img_arr[neg_mask, 2] = (n_val * 50).astype(np.uint8)
    
    return Image.fromarray(img_arr).resize((320, 200), Image.Resampling.BILINEAR)

# Render Single Frame
def render_frame(f):
    im = Image.new("RGB", (WIDTH, HEIGHT), BG_OBSIDIAN)
    draw = ImageDraw.Draw(im)

    if f < 60:
        # -------------------------------------------------------------------
        # Phase 1: Voiceover Prompt Question (Frames 0 to 60)
        # -------------------------------------------------------------------
        # Brand Header Lockup
        draw.text((40, 35), "POINT REYES SOUND", font=font_title, fill=EMERALD)
        draw.text((255, 40), "·  Q-BOLTZ AGENT CONSOLE", font=font_header, fill=TEXT_MUTED)

        # Floating Center Console Card
        cx, cy = WIDTH // 2, HEIGHT // 2
        card_w, card_h = 760, 240
        x0, y0 = cx - card_w // 2, cy - card_h // 2
        x1, y1 = cx + card_w // 2, cy + card_h // 2

        # Card body with glowing border
        draw.rectangle([x0, y0, x1, y1], fill=CARD_BG, outline=EMERALD, width=2)
        draw.rectangle([x0+4, y0+4, x1-4, y0+36], fill=(5, 20, 10))
        draw.text((x0+15, y0+10), "⚛ Q-BOLTZ AGENT", font=font_header, fill=EMERALD)
        draw.text((x0+165, y0+12), "Audio Voice Prompt Active", font=font_small, fill=CYAN)

        # Voice audio waveform animation
        wave_x = x0 + 20
        wave_y = y0 + 65
        draw.text((wave_x, wave_y), "🎙 Voice Input Stream:", font=font_label, fill=CYAN)
        for i in range(28):
            bar_h = 6 + int(18 * abs(math.sin(f * 0.35 + i * 0.4)))
            bx = wave_x + 190 + i * 14
            draw.rectangle([bx, wave_y + 12 - bar_h // 2, bx + 8, wave_y + 12 + bar_h // 2], fill=CYAN)

        # Typed query string
        full_text = "Conceptualize and envision the dissociation of H2 in phase space."
        chars_shown = min(len(full_text), int((f / 45.0) * len(full_text)))
        typed = full_text[:chars_shown]
        
        # Search Box
        box_y = y0 + 110
        draw.rectangle([x0+20, box_y, x1-20, box_y+46], fill=(2, 8, 4), outline=(40, 140, 80), width=1)
        draw.text((x0+35, box_y+14), typed + ("_" if (f // 4) % 2 == 0 else ""), font=font_body, fill=TEXT_WHITE)

        # Submit / Voiceover status button
        btn_x = x1 - 180
        btn_col = EMERALD if f >= 50 else CYAN
        draw.rectangle([btn_x, box_y+6, x1-30, box_y+40], fill=btn_col)
        draw.text((btn_x+18, box_y+15), "Solving..." if f >= 50 else "Ask Q-Boltz ↗", font=font_small, fill=(2, 9, 5))

        # Benchmark preset chips
        chips_y = box_y + 60
        draw.text((x0+20, chips_y+5), "PRESETS:", font=font_small, fill=TEXT_MUTED)
        chips = ["H₂ Phase Space", "H₃ Conical Intersection", "BeH₂ Avoided Crossing", "N₂ Triple Bond"]
        chip_x = x0 + 85
        for i, c in enumerate(chips):
            cw = len(c) * 7 + 16
            draw.rectangle([chip_x, chips_y, chip_x+cw, chips_y+24], fill=(10, 30, 18), outline=(30, 90, 50), width=1)
            draw.text((chip_x+8, chips_y+6), c, font=font_tiny, fill=EMERALD if i == 0 else TEXT_MUTED)
            chip_x += cw + 12

    else:
        # -------------------------------------------------------------------
        # Phase 2: Fullscreen 4-Panel Visual Workstation (Frames 60 to 450)
        # -------------------------------------------------------------------
        r_val, nb_val, na_val, e_val, svn_val, prog = get_state_at_frame(f)

        # Top Bar
        draw.rectangle([0, 0, WIDTH, 38], fill=(3, 14, 7), outline=(20, 80, 45), width=1)
        draw.text((20, 10), "⚛ Q-BOLTZ", font=font_header, fill=EMERALD)
        draw.text((125, 11), "p1_qbescf Live", font=font_small, fill=CYAN)
        draw.text((245, 11), "H₂ Homolytic Bond Dissociation", font=font_small, fill=TEXT_WHITE)
        draw.text((WIDTH - 210, 11), "Point Reyes Sound, Inc.", font=font_small, fill=TEXT_MUTED)

        # Dynamic Playback Toolbar
        tb_y = 44
        draw.rectangle([20, tb_y, WIDTH-20, tb_y+36], fill=(4, 18, 9), outline=EMERALD, width=1)
        draw.rectangle([30, tb_y+6, 125, tb_y+30], fill=(16, 185, 129))
        draw.text((42, tb_y+11), "⏸ PAUSE LOOP", font=font_small, fill=(2, 9, 5))

        draw.rectangle([135, tb_y+6, 265, tb_y+30], fill=(10, 35, 20), outline=EMERALD, width=1)
        draw.text((145, tb_y+11), f"DISTANCE: {r_val:.2f} Å", font=font_small, fill=EMERALD)

        draw.rectangle([275, tb_y+6, 380, tb_y+30], fill=(10, 30, 20))
        draw.text((285, tb_y+11), "⏱ PACE: 180ms", font=font_small, fill=TEXT_MUTED)

        draw.text((WIDTH - 420, tb_y+11), "0.50 Å ⇄ 3.50 Å CONTINUOUS DISSOCIATION (ΔR = 0.05 Å)", font=font_tiny, fill=CYAN)

        # Workstation Grid Layout
        # Left Panel (Narrative & Query): x in [20, 360], y in [86, 700]
        lx0, ly0, lx1, ly1 = 20, 86, 360, 700
        draw.rectangle([lx0, ly0, lx1, ly1], fill=CARD_BG, outline=CARD_BORDER, width=1)

        # Left query input
        draw.rectangle([lx0+10, ly0+10, lx1-10, ly0+42], fill=(2, 8, 4), outline=(30, 90, 50))
        draw.text((lx0+18, ly0+18), "H2 phase space dissociation...", font=font_small, fill=TEXT_MUTED)

        # Narrative Box
        draw.rectangle([lx0+10, ly0+50, lx1-10, ly0+480], fill=(2, 10, 6), outline=(20, 60, 35))
        draw.text((lx0+20, ly0+60), "⚛ Q-BOLTZ:", font=font_header, fill=EMERALD)

        # Stream narrative synchronized with Ludwig Boltzmann's voice
        narrative_lines = [
            "In phase space (z, p_z),",
            "the dissociation of H2 unfolds",
            "as continuous kinetic transport",
            "of the one-particle reduced density",
            "matrix.",
            "",
            f"At R = {r_val:.2f} Å, the active-space",
            f"occupations relax to:",
            f"  [ {nb_val:.3f},  {na_val:.3f} ]",
            f"Correlation Entropy: {svn_val:.3f} bits",
            f"Total Energy: {e_val:.2f} eV",
            "",
            "Notice how the kinetic collision",
            "operator regularizes the mean-field",
            "singularity, recovering the GVB",
            "entangled limit with exact spin purity."
        ]
        line_y = ly0 + 88
        for nl in narrative_lines:
            draw.text((lx0+20, line_y), nl, font=font_small, fill=TEXT_WHITE if "H2" in nl or "[" in nl else TEXT_MUTED)
            line_y += 18

        # Left presets drawer
        draw.text((lx0+15, ly0+500), "SWITCH BENCHMARK", font=font_tiny, fill=TEXT_MUTED)
        benchmarks = ["H₂ Dissociation in Phase Space", "H₃ D₃ₕ Conical Intersection", "BeH₂ Avoided Crossing", "N₂ Triple Bond"]
        by = ly0 + 520
        for i, bm in enumerate(benchmarks):
            draw.rectangle([lx0+12, by, lx1-12, by+28], fill=(8, 24, 14), outline=EMERALD if i == 0 else (25, 60, 40))
            draw.text((lx0+20, by+7), bm, font=font_tiny, fill=EMERALD if i == 0 else TEXT_MUTED)
            by += 34

        # Right 4-Panel Workstation: x in [372, WIDTH-20], y in [86, 700]
        rx0, ry0, rx1, ry1 = 372, 86, WIDTH - 20, 700
        mid_x = (rx0 + rx1) // 2
        mid_y = (ry0 + ry1) // 2

        # -------------------------------------------------------------------
        # Panel 1: Top-Left - Bonding Orbital (1σ_g)
        # -------------------------------------------------------------------
        p1 = [rx0, ry0, mid_x - 5, mid_y - 5]
        draw.rectangle(p1, fill=(2, 8, 4), outline=CARD_BORDER, width=1)
        draw.rectangle([p1[0], p1[1], p1[2], p1[1]+28], fill=(4, 16, 8))
        draw.text((p1[0]+12, p1[1]+7), "BONDING ORBITAL", font=font_small, fill=BLUE)
        draw.text((p1[0]+140, p1[1]+8), "1σ_g", font=font_header, fill=TEXT_WHITE)
        draw.text((p1[2]-75, p1[1]+8), f"n = {nb_val:.3f}", font=font_small, fill=EMERALD)

        # 3D Orbital Canvas Simulation (Two nuclei + bonding oval lobe)
        c1_x, c1_y = (p1[0] + p1[2]) // 2, (p1[1] + p1[3]) // 2 + 10
        theta = f * 0.08
        dx = int((r_val * 32) * math.cos(theta))
        dy = int((r_val * 16) * math.sin(theta))
        
        # Bonding Lobe (Electric Blue Oval encompassing nuclei)
        lobe_rx = int(max(40, (r_val * 32) + 36 * (nb_val / 2.0)))
        lobe_ry = int(38 * (nb_val / 2.0))
        draw.ellipse([c1_x - lobe_rx, c1_y - lobe_ry, c1_x + lobe_rx, c1_y + lobe_ry], fill=(0, 70, 160), outline=BLUE, width=2)
        # Inner core
        draw.ellipse([c1_x - lobe_rx + 15, c1_y - lobe_ry + 10, c1_x + lobe_rx - 15, c1_y + lobe_ry - 10], fill=(0, 120, 240))
        # Nuclei spheres
        draw.ellipse([c1_x - dx - 8, c1_y - dy - 8, c1_x - dx + 8, c1_y - dy + 8], fill=(255, 255, 255))
        draw.ellipse([c1_x + dx - 8, c1_y + dy - 8, c1_x + dx + 8, c1_y + dy + 8], fill=(255, 255, 255))
        draw.text((p1[0]+12, p1[3]-20), "+ψ Electric Blue Lobe", font=font_tiny, fill=BLUE)

        # -------------------------------------------------------------------
        # Panel 2: Top-Right - Antibonding Orbital (1σ_u*)
        # -------------------------------------------------------------------
        p2 = [mid_x + 5, ry0, rx1, mid_y - 5]
        draw.rectangle(p2, fill=(2, 8, 4), outline=CARD_BORDER, width=1)
        draw.rectangle([p2[0], p2[1], p2[2], p2[1]+28], fill=(4, 16, 8))
        draw.text((p2[0]+12, p2[1]+7), "ANTIBONDING ORBITAL", font=font_small, fill=RED)
        draw.text((p2[0]+165, p2[1]+8), "1σ_u*", font=font_header, fill=TEXT_WHITE)
        draw.text((p2[2]-75, p2[1]+8), f"n = {na_val:.3f}", font=font_small, fill=RED)

        # 3D Antibonding Viewport (Two opposite phase lobes + nodal plane)
        c2_x, c2_y = (p2[0] + p2[2]) // 2, (p2[1] + p2[3]) // 2 + 10
        # Positive Lobe (Blue) on left nucleus
        lb_size = int(max(18, 38 * (na_val / 1.0)))
        draw.ellipse([c2_x - dx - lb_size, c2_y - dy - lb_size, c2_x - dx + lb_size, c2_y - dy + lb_size], fill=(0, 90, 190), outline=BLUE, width=2)
        # Negative Lobe (Red) on right nucleus
        draw.ellipse([c2_x + dx - lb_size, c2_y + dy - lb_size, c2_x + dx + lb_size, c2_y + dy + lb_size], fill=(180, 20, 40), outline=RED, width=2)
        # Nodal line in center
        draw.line([c2_x - dy, c2_y + dx, c2_x + dy, c2_y - dx], fill=(120, 140, 130), width=1)
        # Nuclei spheres
        draw.ellipse([c2_x - dx - 7, c2_y - dy - 7, c2_x - dx + 7, c2_y - dy + 7], fill=(255, 255, 255))
        draw.ellipse([c2_x + dx - 7, c2_y + dy - 7, c2_x + dx + 7, c2_y + dy + 7], fill=(255, 255, 255))
        draw.text((p2[0]+12, p2[3]-20), "+ψ Blue / -ψ Red Lobes · Nodal Plane", font=font_tiny, fill=TEXT_MUTED)

        # -------------------------------------------------------------------
        # Panel 3: Bottom-Left - Dissociation Potential Energy Surface (PES)
        # -------------------------------------------------------------------
        p3 = [rx0, mid_y + 5, mid_x - 5, ry1]
        draw.rectangle(p3, fill=(2, 8, 4), outline=CARD_BORDER, width=1)
        draw.rectangle([p3[0], p3[1], p3[2], p3[1]+28], fill=(4, 16, 8))
        draw.text((p3[0]+12, p3[1]+7), "DISSOCIATION PES", font=font_small, fill=EMERALD)
        draw.text((p3[0]+145, p3[1]+8), "QBE-SCF vs RHF Limit", font=font_small, fill=TEXT_WHITE)

        # Plot curves
        plot_x0, plot_y0 = p3[0] + 35, p3[1] + 45
        plot_w, plot_h = p3[2] - p3[0] - 65, 145
        draw.rectangle([plot_x0, plot_y0, plot_x0 + plot_w, plot_y0 + plot_h], fill=(1, 5, 2), outline=(20, 60, 30))

        # Coulson-Fischer singularity marker
        cf_px = plot_x0 + int(plot_w * ((1.20 - 0.5) / 2.7))
        draw.line([cf_px, plot_y0, cf_px, plot_y0 + plot_h], fill=ACCENT_ORANGE, width=1)
        draw.text((cf_px - 35, plot_y0 + 5), "Coulson-Fischer", font=font_tiny, fill=ACCENT_ORANGE)

        # Draw curves
        qbe_pts = []
        rhf_pts = []
        for step in range(50):
            step_r = 0.5 + 2.7 * (step / 49.0)
            sx = plot_x0 + int(plot_w * (step / 49.0))
            # QBE curve
            e_q = -22.84 + 4.75 * (1.0 - math.exp(-1.94 * (step_r - 0.74)))**2 - 4.75
            sy_q = plot_y0 + plot_h - int(plot_h * ((e_q + 28.0) / 10.0))
            qbe_pts.append((sx, sy_q))
            # RHF curve
            e_r = e_q if step_r <= 1.20 else e_q + 2.5 * (1.0 - math.exp(-1.4 * (step_r - 1.20)))
            sy_r = plot_y0 + plot_h - int(plot_h * ((e_r + 28.0) / 10.0))
            rhf_pts.append((sx, sy_r))

        draw.line(qbe_pts, fill=EMERALD, width=2)
        draw.line(rhf_pts, fill=RED, width=1)

        # Live dot on PES
        curr_dot_x = plot_x0 + int(plot_w * ((r_val - 0.5) / 2.7))
        curr_e_q = -22.84 + 4.75 * (1.0 - math.exp(-1.94 * (r_val - 0.74)))**2 - 4.75
        curr_dot_y = plot_y0 + plot_h - int(plot_h * ((curr_e_q + 28.0) / 10.0))
        draw.ellipse([curr_dot_x-5, curr_dot_y-5, curr_dot_x+5, curr_dot_y+5], fill=CYAN, outline=TEXT_WHITE)

        # Quantum Observables Sub-cards
        obs_y = plot_y0 + plot_h + 12
        card_w_sub = (plot_w - 16) // 3
        draw.rectangle([plot_x0, obs_y, plot_x0 + card_w_sub, p3[3] - 10], fill=(5, 18, 10), outline=(20, 60, 30))
        draw.text((plot_x0 + 8, obs_y + 6), "QBE-SCF Energy", font=font_tiny, fill=TEXT_MUTED)
        draw.text((plot_x0 + 8, obs_y + 20), f"{e_val:.2f} eV", font=font_small, fill=EMERALD)

        draw.rectangle([plot_x0 + card_w_sub + 8, obs_y, plot_x0 + 2*card_w_sub + 8, p3[3] - 10], fill=(5, 18, 10), outline=(20, 60, 30))
        draw.text((plot_x0 + card_w_sub + 16, obs_y + 6), "Standard RHF", font=font_tiny, fill=TEXT_MUTED)
        draw.text((plot_x0 + card_w_sub + 16, obs_y + 20), "Cusp" if r_val >= 1.20 else "RHF Limit", font=font_small, fill=RED)

        draw.rectangle([plot_x0 + 2*card_w_sub + 16, obs_y, plot_x0 + plot_w, p3[3] - 10], fill=(5, 22, 12), outline=EMERALD)
        draw.text((plot_x0 + 2*card_w_sub + 22, obs_y + 6), "Entropy S_vN", font=font_tiny, fill=TEXT_MUTED)
        draw.text((plot_x0 + 2*card_w_sub + 22, obs_y + 20), f"{svn_val:.3f} bits", font=font_small, fill=CYAN)

        # -------------------------------------------------------------------
        # Panel 4: Bottom-Right - Wigner Distribution in Phase Space
        # -------------------------------------------------------------------
        p4 = [mid_x + 5, mid_y + 5, rx1, ry1]
        draw.rectangle(p4, fill=(2, 8, 4), outline=CARD_BORDER, width=1)
        draw.rectangle([p4[0], p4[1], p4[2], p4[1]+28], fill=(4, 16, 8))
        draw.text((p4[0]+12, p4[1]+7), "PHASE SPACE", font=font_small, fill=CYAN)
        draw.text((p4[0]+115, p4[1]+8), "Wigner Quasiprobability W(z, p_z)", font=font_small, fill=TEXT_WHITE)

        # Paste dynamically computed Wigner heatmap
        wigner_img = compute_wigner_image(r_val, nb_val, na_val)
        w_x = (p4[0] + p4[2] - 320) // 2
        w_y = p4[1] + 36
        im.paste(wigner_img, (w_x, w_y))

        # Coordinate axes & labels
        draw.line([w_x + 160, w_y, w_x + 160, w_y + 200], fill=(40, 90, 60), width=1) # p_z axis
        draw.line([w_x, w_y + 100, w_x + 320, w_y + 100], fill=(40, 90, 60), width=1) # z axis
        draw.text((w_x + 165, w_y + 5), "p_z (Momentum)", font=font_tiny, fill=TEXT_MUTED)
        draw.text((w_x + 230, w_y + 85), "z (Position Å)", font=font_tiny, fill=TEXT_MUTED)

        # Droplet indicators
        zA_px = w_x + 160 - int(r_val * 24)
        zB_px = w_x + 160 + int(r_val * 24)
        draw.ellipse([zA_px-4, w_y+96, zA_px+4, w_y+104], fill=(255, 255, 255))
        draw.ellipse([zB_px-4, w_y+96, zB_px+4, w_y+104], fill=(255, 255, 255))
        draw.text((w_x + 15, w_y + 205), f"Wigner droplets bifurcated at z = ±{r_val/2:.2f} Å", font=font_tiny, fill=CYAN)

    frame_path = f"{OUTPUT_DIR}/frame_{f:04d}.png"
    im.save(frame_path)
    return frame_path

print(f"[*] Rendering {TOTAL_FRAMES} synchronized frames at {FPS} FPS...")
t0 = time.time()
for f in range(TOTAL_FRAMES):
    render_frame(f)
    if f % 45 == 0:
        print(f"    Progress: {f}/{TOTAL_FRAMES} frames ({f/TOTAL_FRAMES*100:.1f}%)")

print(f"[*] All {TOTAL_FRAMES} frames rendered in {time.time()-t0:.2f} seconds.")

# Encode Video with FFmpeg + Combined Voiceover Audio
print(f"[*] Compositing MP4 with voiceover audio: {AUDIO_PATH}...")
cmd = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i", f"{OUTPUT_DIR}/frame_%04d.png",
    "-i", AUDIO_PATH,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    FINAL_VIDEO_PATH
]
subprocess.run(cmd, check=True)
print(f"[✓] Successfully generated video: {FINAL_VIDEO_PATH}")

# Copy to artifact directory for markdown embedding
import shutil
shutil.copyfile(FINAL_VIDEO_PATH, ARTIFACT_VIDEO_PATH)
print(f"[✓] Copied to artifact directory: {ARTIFACT_VIDEO_PATH}")
