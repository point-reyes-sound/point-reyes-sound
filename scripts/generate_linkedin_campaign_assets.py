#!/usr/bin/env python3
"""
Generate Point Reyes Sound LinkedIn Video & Swipeable PDF Carousel Campaign Assets.
Strict Deep-Tech Scientific Aesthetic:
- Exactly ONE scientific sentence per slide / card.
- Zero hex codes, zero CLI flags, zero marketing clutter.
- Full-stage 3D quantum phase-space manifold in --noir and --azure card styling.
"""

import os
import subprocess
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
MEDIA_QVA = ROOT / "public" / "media" / "qva"
SHORTS_DIR = ROOT / "marketing" / "interstellar_overdrive" / "shorts_10s_edm"
OUT_DIR = ROOT / "marketing" / "linkedin_campaign"
PDF_SLIDES_DIR = OUT_DIR / "pdf_slides"
STANDALONE_DIR = OUT_DIR / "standalone_1080x1350"
LOGO_PATH = ROOT / "public" / "PRS_logo_v2.jpeg"

W, H = 1080, 1350
FPS = 30

CARDS = [
    {
        "id": "azure",
        "phenomenon": "Quantum Fluctuations in a Crystal Lattice",
        "sentence": "Periodic positive peaks show delocalized electrons coalescing at lattice sites while sub-horizon troughs capture inter-site quantum interference.",
        "accent": (56, 189, 248),
        "card_bg": (8, 13, 22),
        "card_border": (45, 130, 195),
        "video_demo": MEDIA_QVA / "demo_2_cherenkov.mp4",
        "audio_wav": SHORTS_DIR / "SHORT_10S_6_LATTICE_CHERENKOV_CYAN.wav",
        "thumb_16x9": MEDIA_QVA / "THUMB_16x9_2_AZURE.png",
    },
    {
        "id": "arctic",
        "phenomenon": "Zero-Point Quantum Crystal",
        "sentence": "Standing-wave ridges surrounded by an entanglement moat reveal zero-point kinetic fluctuations preventing classical localization at absolute zero.",
        "accent": (148, 185, 235),
        "card_bg": (9, 13, 20),
        "card_border": (110, 135, 175),
        "video_demo": MEDIA_QVA / "demo_5_arctic.mp4",
        "audio_wav": SHORTS_DIR / "SHORT_10S_4_COVALENT_ARCTIC_PLATINUM.wav",
        "thumb_16x9": MEDIA_QVA / "THUMB_16x9_5_ARCTIC.png",
    },
    {
        "id": "noir",
        "phenomenon": "Driven Quantum Dipole Vortex",
        "sentence": "A central phase-space peak encircled by a circulation moat captures quantized angular momentum in a non-equilibrium electronic fluid.",
        "accent": (220, 225, 235),
        "card_bg": (10, 11, 14),
        "card_border": (140, 145, 158),
        "video_demo": MEDIA_QVA / "demo_6_noir.mp4",
        "audio_wav": SHORTS_DIR / "SHORT_10S_5_VORTEX_SILVER_NOIR.wav",
        "thumb_16x9": MEDIA_QVA / "THUMB_16x9_6_NOIR.png",
    },
    {
        "id": "sovereign",
        "phenomenon": "Collective Multi-Center Lattice Relaxation",
        "sentence": "Parallel phase-space ridges rising from a thermal sea depict correlated electrons relaxing toward a trace-preserving Fermi-Dirac equilibrium.",
        "accent": (218, 182, 85),
        "card_bg": (14, 11, 9),
        "card_border": (165, 135, 62),
        "video_demo": MEDIA_QVA / "demo_1_sovereign.mp4",
        "audio_wav": SHORTS_DIR / "SHORT_10S_1_BENZENE_SOVEREIGN_GOLD.wav",
        "thumb_16x9": MEDIA_QVA / "THUMB_16x9_1_SOVEREIGN.png",
    },
    {
        "id": "kyoto",
        "phenomenon": "Covalent Bond Resonance",
        "sentence": "Two atomic density peaks bridged by a phase-space interference moat visualize an entangled electron pair shared across a chemical bond.",
        "accent": (125, 182, 165),
        "card_bg": (9, 15, 14),
        "card_border": (82, 132, 118),
        "video_demo": MEDIA_QVA / "demo_3_kyoto.mp4",
        "audio_wav": SHORTS_DIR / "SHORT_10S_2_GRAPHENE_KYOTO_EMERALD.wav",
        "thumb_16x9": MEDIA_QVA / "THUMB_16x9_3_KYOTO.png",
    },
    {
        "id": "corona",
        "phenomenon": "Quantum Tunneling in a Hydrogen Bond",
        "sentence": "Twin wavepacket ridges divided by a Wigner-negativity channel trace a proton tunneling through a classical energy barrier.",
        "accent": (240, 155, 75),
        "card_bg": (15, 10, 13),
        "card_border": (185, 105, 45),
        "video_demo": MEDIA_QVA / "demo_4_corona.mp4",
        "audio_wav": SHORTS_DIR / "SHORT_10S_3_TUNNELING_SOLAR_CORONA.wav",
        "thumb_16x9": MEDIA_QVA / "THUMB_16x9_4_CORONA.png",
    },
]


def load_font(size: int, kind: str = "eb_garamond_semibold") -> ImageFont.FreeTypeFont:
    eb_dir = ROOT / "quantum-video-archive" / "assets" / "fonts"
    user_eb_dir = Path("/Users/romitchakraborty/Library/Fonts/static")
    candidates = {
        "eb_garamond_semibold": [
            str(eb_dir / "EBGaramond-SemiBold.ttf"),
            str(user_eb_dir / "EBGaramond-SemiBold.ttf"),
            str(eb_dir / "EBGaramond-Bold.ttf"),
        ],
        "eb_garamond_bold": [
            str(eb_dir / "EBGaramond-Bold.ttf"),
            str(user_eb_dir / "EBGaramond-Bold.ttf"),
        ],
        "eb_garamond_regular": [
            str(eb_dir / "EBGaramond-Regular.ttf"),
            str(user_eb_dir / "EBGaramond-Regular.ttf"),
        ],
        "sans": [
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        ],
    }
    for path in candidates.get(kind, candidates["eb_garamond_semibold"]):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


FONTS = {
    "brand_top": load_font(32, "eb_garamond_semibold"),
    "phenomenon": load_font(38, "eb_garamond_semibold"),
    "sentence": load_font(23, "sans"),
}


def ease_in_out_sine(t: float) -> float:
    return 0.5 * (1.0 - np.cos(np.pi * t))


def draw_top_brand_lockup(canvas: Image.Image):
    """Draw the crimson Phi logo and 'Point Reyes Sound' in EB Garamond centrally aligned at the top of the frame."""
    draw = ImageDraw.Draw(canvas)
    text = "Point Reyes Sound"
    tb = draw.textbbox((0, 0), text, font=FONTS["brand_top"])
    tw = tb[2] - tb[0]
    logo_w, _ = LOGO_BADGE.size
    gap = 14
    total_w = logo_w + gap + tw
    start_x = (W - total_w) // 2
    canvas.paste(LOGO_BADGE, (start_x, 64), LOGO_BADGE)
    draw.text((start_x + logo_w + gap, 63), text, font=FONTS["brand_top"], fill=(242, 246, 252, 255))


def wrap_text_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines = []
    curr = ""
    for w in words:
        test = f"{curr} {w}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_w:
            curr = test
        else:
            if curr:
                lines.append(curr)
            curr = w
    if curr:
        lines.append(curr)
    return lines


def crop_clean_manifold(img: Image.Image) -> Image.Image:
    """Crop out the miniature internal title bar at top of 1280x720 frame so only pure 3D manifold remains."""
    w, h = img.size
    return img.crop((0, int(h * 0.13), w, int(h * 0.98)))


def extract_video_frames(video_path: Path, max_frames: int = 360) -> list[Image.Image]:
    """
    Read frames from a 1280x720 demo video, crop clean 3D stage, and build a slow-motion (0.5x speed)
    interpolated ping-pong loop so the 3D phase-space visualizations breathe slowly and meditatively.
    """
    cap = cv2.VideoCapture(str(video_path))
    raw_frames = []
    while True:
        ok, frame_bgr = cap.read()
        if not ok:
            break
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        pil_img = crop_clean_manifold(Image.fromarray(frame_rgb))
        raw_frames.append(pil_img)
    cap.release()
    if not raw_frames:
        raise RuntimeError(f"No frames in {video_path}")
    ping_pong = raw_frames + raw_frames[-2:0:-1]
    n_pp = len(ping_pong)

    # Interpolate at 0.5x speed (2 output frames per 1 source frame via optical alpha blend)
    slow_frames = []
    for i in range(max_frames):
        pos = (i * 0.5) % n_pp
        idx0 = int(np.floor(pos)) % n_pp
        idx1 = (idx0 + 1) % n_pp
        frac = pos - np.floor(pos)
        if frac < 0.01:
            slow_frames.append(ping_pong[idx0])
        else:
            slow_frames.append(Image.blend(ping_pong[idx0], ping_pong[idx1], frac))
    return slow_frames


def get_logo_badge(size: int = 40) -> Image.Image:
    if LOGO_PATH.exists():
        img = Image.open(LOGO_PATH).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=8, fill=255)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    return Image.new("RGBA", (size, size), (180, 30, 50, 255))


LOGO_BADGE = get_logo_badge(40)


def fit_preserve_aspect(img: Image.Image, target_w: int, target_h: int, bg_rgb=(0, 0, 0)) -> Image.Image:
    """Fit img into (target_w, target_h) without geometric distortion, filling background with pure black."""
    src_w, src_h = img.size
    scale = min(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS).convert("RGBA")
    out = Image.new("RGBA", (target_w, target_h), (*bg_rgb, 255))
    out.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    return out


def render_science_card(
    card: dict,
    fluid_frame: Image.Image,
    card_w: int = 920,
    card_h: int = 860,
    text_opacity: float = 1.0,
    text_shift_x: int = 0,
    bg_override: tuple[int, int, int] | None = None,
    border_override: tuple[int, int, int] | None = None,
) -> Image.Image:
    """Render an ultra-clean card containing ONLY the true-aspect 3D manifold, Phenomenon heading, and 1 sentence."""
    surf = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(surf)

    bg_rgb = bg_override if bg_override is not None else card["card_bg"]
    border_rgb = border_override if border_override is not None else card["card_border"]

    draw.rounded_rectangle(
        (2, 2, card_w - 3, card_h - 3),
        radius=28,
        fill=(*bg_rgb, 248),
        outline=(*border_rgb, 195),
        width=2,
    )

    # Unobstructed true-aspect 3D quantum fluid stage
    vw = card_w - 48
    vh = card_h - 240
    vx, vy = 24, 24
    fitted_fluid = fit_preserve_aspect(fluid_frame, vw, vh, bg_rgb=(2, 3, 5))

    vmask = Image.new("L", (vw, vh), 0)
    ImageDraw.Draw(vmask).rounded_rectangle((0, 0, vw - 1, vh - 1), radius=20, fill=255)
    surf.paste(fitted_fluid, (vx, vy), vmask)

    if text_opacity > 0.01:
        t_alpha_title = int(round(255 * min(1.0, text_opacity)))
        t_alpha_sub = int(round(245 * min(1.0, text_opacity)))
        phenom = card["phenomenon"]
        pb = draw.textbbox((0, 0), phenom, font=FONTS["phenomenon"])
        pw = pb[2] - pb[0]
        py = vy + vh + 28
        draw.text(
            ((card_w - pw) // 2 + text_shift_x, py),
            phenom,
            font=FONTS["phenomenon"],
            fill=(255, 255, 255, t_alpha_title),
        )

        lines = wrap_text_lines(draw, card["sentence"], FONTS["sentence"], vw - 36)
        ty = py + 54
        for line in lines:
            lb = draw.textbbox((0, 0), line, font=FONTS["sentence"])
            lw = lb[2] - lb[0]
            draw.text(
                ((card_w - lw) // 2 + text_shift_x, ty),
                line,
                font=FONTS["sentence"],
                fill=(195, 210, 230, t_alpha_sub),
            )
            ty += 34

    return surf


def compose_carousel_frame(
    all_cards: list[dict],
    card_frames: list[list[Image.Image]],
    float_idx: float,
    global_frame_idx: int,
) -> np.ndarray:
    """
    Compose a single 1080x1350 frame.
    During transitions (frac > 0), smoothly cross-dissolve the 3D phase-space manifolds,
    card border/background hues, and sequentially cross-fade the typography so there is
    zero jarring motion or overlapping text.
    """
    n = len(all_cards)
    idx_a = int(np.floor(float_idx)) % n
    idx_b = (idx_a + 1) % n
    frac = float(float_idx - np.floor(float_idx))

    card_a = all_cards[idx_a]
    card_b = all_cards[idx_b]

    def lerp_rgb(c1, c2, t_val):
        return tuple(int(round((1.0 - t_val) * a + t_val * b)) for a, b in zip(c1, c2))

    acc = lerp_rgb(card_a["accent"], card_b["accent"], frac)
    bg_interp = lerp_rgb(card_a["card_bg"], card_b["card_bg"], frac)
    border_interp = lerp_rgb(card_a["card_border"], card_b["card_border"], frac)

    canvas = Image.new("RGBA", (W, H), (4, 6, 10, 255))

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((140, 160, 940, 1060), fill=(*acc, 22))
    canvas = Image.alpha_composite(canvas, glow.filter(ImageFilter.GaussianBlur(radius=95)))

    # Top brand lockup: Phi logo + "Point Reyes Sound" in EB Garamond right next to it
    draw_top_brand_lockup(canvas)

    frames_a = card_frames[idx_a]
    frames_b = card_frames[idx_b]
    f_img_a = frames_a[global_frame_idx % len(frames_a)]
    f_img_b = frames_b[global_frame_idx % len(frames_b)]

    if frac < 0.001:
        blended_fluid = f_img_a
        active_card = card_a
        text_op = 1.0
        text_shift = 0
    else:
        # Smooth optical cross-dissolve between outgoing and incoming 3D quantum fluid manifolds
        blended_fluid = Image.blend(f_img_a.convert("RGB"), f_img_b.convert("RGB"), frac)
        if frac < 0.50:
            active_card = card_a
            u_out = frac / 0.50
            text_op = float(np.cos(u_out * np.pi / 2.0))
            text_shift = int(round(-18 * u_out))
        else:
            active_card = card_b
            u_in = (frac - 0.50) / 0.50
            text_op = float(np.sin(u_in * np.pi / 2.0))
            text_shift = int(round(18 * (1.0 - u_in)))

    card_surface = render_science_card(
        active_card,
        blended_fluid,
        card_w=920,
        card_h=860,
        text_opacity=text_op,
        text_shift_x=text_shift,
        bg_override=bg_interp,
        border_override=border_interp,
    )
    canvas.alpha_composite(card_surface, dest=(80, 160))

    # Minimal pagination dots at bottom with smooth width interpolation
    draw = ImageDraw.Draw(canvas)
    dot_y = 1130
    weights = []
    for i in range(n):
        dist = abs(i - float_idx)
        dist = min(dist, n - dist)
        w_val = max(0.0, 1.0 - dist)
        weights.append(w_val)

    dot_widths = [int(round(10 + 24 * w)) for w in weights]
    gap = 14
    total_dots_w = sum(dot_widths) + gap * (n - 1)
    dx = (W - total_dots_w) // 2
    for i, dw in enumerate(dot_widths):
        w_val = weights[i]
        c_dot = lerp_rgb((80, 95, 120), acc, w_val)
        alpha_dot = int(round(175 + 80 * w_val))
        draw.rounded_rectangle((dx, dot_y, dx + dw, dot_y + 10), radius=5, fill=(*c_dot, alpha_dot))
        dx += dw + gap

    rgb_out = canvas.convert("RGB")
    return cv2.cvtColor(np.array(rgb_out), cv2.COLOR_RGB2BGR)


def build_swipeable_pdf_carousel():
    """Build the 6-slide 1080x1350 swipeable PDF carousel: strictly ONE thumbnail and ONE scientific sentence per slide."""
    print("[1/3] Generating 6-slide 1080x1350 Swipeable PDF Carousel (1 thumbnail + 1 sentence per slide)...")
    PDF_SLIDES_DIR.mkdir(parents=True, exist_ok=True)
    for old_png in PDF_SLIDES_DIR.glob("SLIDE_*.png"):
        old_png.unlink(missing_ok=True)

    slides_pil: list[Image.Image] = []

    for card in CARDS:
        sc = Image.new("RGBA", (W, H), (4, 6, 10, 255))
        acc = card["accent"]
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((140, 160, 940, 1060), fill=(*acc, 22))
        sc = Image.alpha_composite(sc, glow.filter(ImageFilter.GaussianBlur(radius=95)))
        draw_top_brand_lockup(sc)

        thumb_clean = crop_clean_manifold(Image.open(card["thumb_16x9"]).convert("RGB"))
        card_surface = render_science_card(card, thumb_clean, card_w=920, card_h=860, text_opacity=1.0)
        sc.alpha_composite(card_surface, dest=(80, 160))

        slides_pil.append(sc.convert("RGB"))

    for idx, img in enumerate(slides_pil, start=1):
        img.save(PDF_SLIDES_DIR / f"SLIDE_{idx:02d}_1080x1350.png", format="PNG", optimize=True)

    pdf_path = OUT_DIR / "LINKEDIN_SWIPEABLE_CAROUSEL_1080x1350.pdf"
    slides_pil[0].save(
        pdf_path,
        format="PDF",
        resolution=144.0,
        save_all=True,
        append_images=slides_pil[1:],
    )
    print(f"    ✓ Saved {pdf_path} ({len(slides_pil)} slides)")


def build_animated_carousel_reel(card_frames: list[list[Image.Image]]):
    """Render the 24-second 1080x1350 Animated Carousel Reel MP4 with slow, elegant blends and Chill EDM soundtrack."""
    from generate_chill_edm_24s import generate_chill_edm_24s

    out_mp4 = OUT_DIR / "LINKEDIN_CAROUSEL_REEL_1080x1350.mp4"
    temp_silent = OUT_DIR / "_temp_carousel_silent.mp4"
    chill_wav = generate_chill_edm_24s()

    n = len(CARDS)
    sec_per_card = 6.0  # 6.0s per card x 6 cards = 36.0s total
    slide_sec = 2.40    # Slow, luxurious 2.40s optical cross-dissolve blend between features
    hold_sec = sec_per_card - slide_sec
    total_sec = n * sec_per_card
    total_frames = int(total_sec * FPS)

    print(f"[2/3] Rendering {total_frames} frames ({total_sec:.1f}s @ {FPS}fps) for {out_mp4.name}...")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(temp_silent), fourcc, FPS, (W, H))

    for f_idx in range(total_frames):
        t = f_idx / FPS
        card_slot = int(t // sec_per_card)
        t_in_slot = t - card_slot * sec_per_card

        # Do not transition after the final card (Card 6 holds cleanly during the audio fade-out)
        if t_in_slot < hold_sec or card_slot == n - 1:
            float_idx = float(card_slot)
        else:
            u = (t_in_slot - hold_sec) / slide_sec
            float_idx = card_slot + ease_in_out_sine(min(max(u, 0.0), 1.0))

        bgr = compose_carousel_frame(
            CARDS,
            card_frames,
            float_idx=float_idx,
            global_frame_idx=f_idx,
        )
        writer.write(bgr)

    writer.release()

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(temp_silent),
            "-i",
            str(chill_wav),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "18",
            "-preset",
            "fast",
            "-c:a",
            "aac",
            "-b:a",
            "256k",
            "-movflags",
            "+faststart",
            "-shortest",
            str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    temp_silent.unlink(missing_ok=True)
    print(f"    ✓ Saved {out_mp4} (with 24.0s Chill EDM soundtrack)")


def build_standalone_native_videos(card_frames: list[list[Image.Image]]):
    """Build 6 standalone 10-second 1080x1350 native LinkedIn video posts."""
    print("[3/3] Rendering 6 standalone 10-second 1080x1350 native LinkedIn videos...")
    STANDALONE_DIR.mkdir(parents=True, exist_ok=True)

    for idx, card in enumerate(CARDS):
        out_mp4 = STANDALONE_DIR / f"LINKEDIN_NATIVE_1080x1350_{idx + 1}_{card['id'].upper()}.mp4"
        temp_silent = STANDALONE_DIR / f"_temp_{card['id']}.mp4"
        frames_list = card_frames[idx]
        num_frames = len(frames_list)

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(temp_silent), fourcc, FPS, (W, H))

        for f_idx in range(num_frames):
            bgr = compose_carousel_frame(
                CARDS,
                card_frames,
                float_idx=float(idx),
                global_frame_idx=f_idx,
            )
            writer.write(bgr)
        writer.release()

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(temp_silent),
                "-i",
                str(card["audio_wav"]),
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-crf",
                "18",
                "-preset",
                "fast",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-movflags",
                "+faststart",
                "-shortest",
                str(out_mp4),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        temp_silent.unlink(missing_ok=True)
        print(f"    ✓ Saved {out_mp4.name}")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_swipeable_pdf_carousel()
    print("Pre-loading slow-motion 30fps fluid frames for all 6 signature palettes...")
    card_frames = [extract_video_frames(c["video_demo"], max_frames=360) for c in CARDS]
    build_animated_carousel_reel(card_frames)
    build_standalone_native_videos(card_frames)
    print("All LinkedIn campaign assets generated successfully!")


if __name__ == "__main__":
    main()
