#!/usr/bin/env python3
"""
Generate Slide 1 (2160x2700 Retina 4:5, 1080x1350 viewBox) of Point Reyes Sound's
two-slide LinkedIn carousel:
  Slide 1: QBE-SCF (BeH2 Wigner distribution from p1_qbescf/data/fig7bcd_beh2_data.npz)
  Slide 2: Q-BECK

Outputs:
  - marketing/linkedin_campaign/QBESCF-slide1.svg  (editable vector source)
  - marketing/linkedin_campaign/QBESCF-slide1.png  (ultra-crisp 2160x2700 Retina PNG)
"""

import base64
import io
import os
import subprocess
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from PIL import Image

REPO_ROOT = "/Users/romitchakraborty/QAI/point-reyes-sound"
NPZ_PATH = "/Users/romitchakraborty/QAI/p1_qbescf/data/fig7bcd_beh2_data.npz"
OUT_DIR = os.path.join(REPO_ROOT, "marketing", "linkedin_campaign")
OUT_SVG = os.path.join(OUT_DIR, "QBESCF-slide1.svg")
OUT_PNG = os.path.join(OUT_DIR, "QBESCF-slide1.png")
FONT_PATH = os.path.join(REPO_ROOT, "scratch", "qbeck_campaign_ref", "EBGaramond.ttf")
LOGO_PATH = "/Users/romitchakraborty/.gemini/antigravity/brain/6082563a-6450-4d5f-bb26-93c94b8c6ed2/.user_uploaded/media_1794542481006_bf60aa4c.jpg"

os.makedirs(OUT_DIR, exist_ok=True)


def make_prs_diverging_cmap():
    """
    Unified PRS colour story with neutral midnight-sapphire zero (#09194A)
    matching the slide ground so the Wigner field meshes seamlessly:
      -W (quantum interference negativity): Midnight Sapphire -> Deep Crimson -> Luminous Rose
       0 (nodal zero): Midnight Sapphire (#09194A)
      +W (coherent positive density): Midnight Sapphire -> Burnished Gold -> Luminous Champagne
    """
    stops = [
        (0.00, "#FFB0C0"),
        (0.16, "#E11D48"),
        (0.33, "#9E1138"),
        (0.44, "#3B1542"),
        (0.50, "#09194A"),
        (0.56, "#4D453B"),
        (0.66, "#BA933E"),
        (0.82, "#F0CB69"),
        (1.00, "#FFF5CC"),
    ]
    return mcolors.LinearSegmentedColormap.from_list("PRSSapphireGoldCrimson", stops, N=512)


def render_wigner_png_b64(width_px=3000, height_px=2800):
    d = np.load(NPZ_PATH)
    q = d["q"]
    k = d["k"]
    W_lb = d["W_lb"]

    cmap = make_prs_diverging_cmap()
    vlim = 6.8
    norm = mcolors.TwoSlopeNorm(vmin=-vlim, vcenter=0.0, vmax=vlim)

    dpi = 400
    fig = plt.figure(figsize=(width_px / dpi, height_px / dpi), dpi=dpi)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0])
    ax.set_axis_off()

    extent = [float(q.min()), float(q.max()), float(k.min()), float(k.max())]
    ax.imshow(
        W_lb.T,
        origin="lower",
        aspect="auto",
        extent=extent,
        cmap=cmap,
        norm=norm,
        interpolation="bicubic",
    )
    ax.set_xlim(-3.0, 3.0)
    ax.set_ylim(-5.0, 5.0)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("ascii"), vlim


def load_logo_b64():
    with open(LOGO_PATH, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def build_svg(wigner_b64, logo_b64, vlim):
    # Logical viewBox: 1080 x 1350 (exported at 2160 x 2700 2x Retina)
    plot_x = 114
    plot_y = 424
    plot_w = 754
    plot_h = 724

    cb_x = plot_x + plot_w + 30
    cb_y = plot_y
    cb_w = 18
    cb_h = plot_h

    def map_x(val):
        return plot_x + ((val - (-3.0)) / 6.0) * plot_w

    def map_y(val):
        return plot_y + plot_h - ((val - (-5.0)) / 10.0) * plot_h

    def map_cb_y(val):
        return cb_y + cb_h - ((val - (-vlim)) / (2.0 * vlim)) * cb_h

    x_ticks = [-2, 0, 2]
    y_ticks = [-4, -2, 0, 2, 4]
    cb_ticks = [-6, 0, 6]

    x_ticks_svg = "\n".join(
        f'''    <line x1="{map_x(t):.1f}" y1="{plot_y + plot_h}" x2="{map_x(t):.1f}" y2="{plot_y + plot_h + 7}" stroke="#9BB4F0" stroke-width="1.2" opacity="0.65"/>
    <text x="{map_x(t):.1f}" y="{plot_y + plot_h + 29}" text-anchor="middle" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="18" font-weight="500" fill="#DCE6FF">{t if t >= 0 else f"&#8722;{abs(t)}"}</text>'''
        for t in x_ticks
    )

    y_ticks_svg = "\n".join(
        f'''    <line x1="{plot_x - 7}" y1="{map_y(t):.1f}" x2="{plot_x}" y2="{map_y(t):.1f}" stroke="#9BB4F0" stroke-width="1.2" opacity="0.65"/>
    <text x="{plot_x - 15}" y="{map_y(t) + 6:.1f}" text-anchor="end" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="18" font-weight="500" fill="#DCE6FF">{t if t >= 0 else f"&#8722;{abs(t)}"}</text>'''
        for t in y_ticks
    )

    cb_ticks_svg = "\n".join(
        f'''    <line x1="{cb_x + cb_w}" y1="{map_cb_y(t):.1f}" x2="{cb_x + cb_w + 6}" y2="{map_cb_y(t):.1f}" stroke="#9BB4F0" stroke-width="1.2" opacity="0.7"/>
    <text x="{cb_x + cb_w + 13}" y="{map_cb_y(t) + 6:.1f}" text-anchor="start" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="18" font-weight="500" fill="#DCE6FF">{f"+{t}" if t > 0 else ("0" if t == 0 else f"&#8722;{abs(t)}")}</text>'''
        for t in cb_ticks
    )

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <style type="text/css">
      @font-face {{
        font-family: 'EB Garamond';
        src: url('file://{FONT_PATH}') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }}
    </style>
    <linearGradient id="prs-bg" x1="0" y1="0" x2="0.1" y2="1">
      <stop offset="0%" stop-color="#0D2264"/>
      <stop offset="36%" stop-color="#09194A"/>
      <stop offset="100%" stop-color="#09194A"/>
    </linearGradient>
    <radialGradient id="hero-glow" cx="0.22" cy="0.14" r="0.48">
      <stop offset="0%" stop-color="#1E46B8" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#09194A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="prs-cb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF5CC"/>
      <stop offset="18%" stop-color="#F0CB69"/>
      <stop offset="34%" stop-color="#BA933E"/>
      <stop offset="44%" stop-color="#4D453B"/>
      <stop offset="50%" stop-color="#09194A"/>
      <stop offset="56%" stop-color="#3B1542"/>
      <stop offset="67%" stop-color="#9E1138"/>
      <stop offset="84%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#FFB0C0"/>
    </linearGradient>
    <clipPath id="wigner-clip">
      <rect x="{plot_x}" y="{plot_y}" width="{plot_w}" height="{plot_h}" rx="3" ry="3"/>
    </clipPath>
    <clipPath id="logo-clip">
      <rect x="78" y="45" width="52" height="52" rx="4" ry="4"/>
    </clipPath>
  </defs>

  <!-- Brand Canvas -->
  <rect width="1080" height="1350" fill="url(#prs-bg)"/>
  <rect width="1080" height="1350" fill="url(#hero-glow)"/>

  <!-- Signature PRS Crimson Edge Wedge -->
  <path d="M1006 0 H1080 V1350 H1054 Z" fill="#A81038" opacity="0.96"/>

  <!-- Top Brand Header -->
  <g id="brand-header">
    <image x="78" y="45" width="52" height="52" preserveAspectRatio="xMidYMid slice" clip-path="url(#logo-clip)" xlink:href="data:image/jpeg;base64,{logo_b64}"/>
    <rect x="78" y="45" width="52" height="52" rx="4" ry="4" fill="none" stroke="#9BB4F0" stroke-opacity="0.25" stroke-width="1"/>
    <text x="148" y="77" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="600" letter-spacing="4.6" fill="#C7D8FF">POINT REYES SOUND</text>
    <text x="968" y="77" text-anchor="end" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="500" letter-spacing="1.8" fill="#E9C7D1">01 / 02</text>
  </g>

  <!-- Editorial Hero Typography -->
  <g id="hero-copy">
    <text x="76" y="230" font-family="'EB Garamond', Georgia, serif" font-size="158" font-weight="600" letter-spacing="-2.6" fill="#FFFFFF">QBE-SCF</text>
    <text x="78" y="314" font-family="'EB Garamond', Georgia, serif" font-size="50" font-weight="400" letter-spacing="-0.4" fill="#F0CB69">Free Electrons for the AI economy</text>
    <text x="78" y="358" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="21" font-weight="400" letter-spacing="0.5" fill="#A7BDF2">Quantum Boltzmann Equation Self-Consistent Field</text>
    <text x="78" y="394" font-family="'EB Garamond', Georgia, serif" font-style="italic" font-size="24" font-weight="400" letter-spacing="0.2" fill="#DCE6FF">Accepted for publication, The Journal of Chemical Physics (2026).</text>
  </g>

  <!-- Hero Wigner Distribution (~2/3 of composition) -->
  <g id="wigner-hero">
    <image x="{plot_x}" y="{plot_y}" width="{plot_w}" height="{plot_h}" preserveAspectRatio="none" clip-path="url(#wigner-clip)" xlink:href="data:image/png;base64,{wigner_b64}"/>

    <!-- Minimal L-axes -->
    <line x1="{plot_x}" y1="{plot_y}" x2="{plot_x}" y2="{plot_y + plot_h}" stroke="#9BB4F0" stroke-opacity="0.34" stroke-width="1.2"/>
    <line x1="{plot_x}" y1="{plot_y + plot_h}" x2="{plot_x + plot_w}" y2="{plot_y + plot_h}" stroke="#9BB4F0" stroke-opacity="0.34" stroke-width="1.2"/>

{x_ticks_svg}
{y_ticks_svg}

    <!-- Axis Titles -->
    <text x="{plot_x + plot_w / 2:.1f}" y="{plot_y + plot_h + 64}" text-anchor="middle" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="19" font-weight="500" letter-spacing="0.4" fill="#DCE6FF">Transverse position y (a<tspan dy="4" font-size="14">0</tspan><tspan dy="-4">)</tspan></text>
    <text x="44" y="{plot_y + plot_h / 2:.1f}" text-anchor="middle" transform="rotate(-90 44 {plot_y + plot_h / 2:.1f})" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="19" font-weight="500" letter-spacing="0.4" fill="#DCE6FF">Momentum k<tspan dy="4" font-size="14">y</tspan><tspan dy="-4"> (a.u.)</tspan></text>

    <!-- Sleek Diverging Colorbar -->
    <rect x="{cb_x}" y="{cb_y}" width="{cb_w}" height="{cb_h}" rx="3" ry="3" fill="url(#prs-cb)" stroke="#9BB4F0" stroke-opacity="0.28" stroke-width="1"/>
{cb_ticks_svg}
    <text x="{cb_x + cb_w / 2:.1f}" y="{cb_y - 16}" text-anchor="middle" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="18" font-weight="500" fill="#DCE6FF">W(y, k<tspan dy="4" font-size="13">y</tspan><tspan dy="-4">)</tspan></text>
  </g>

  <!-- Image Caption & Quiet Footer -->
  <g id="footer">
    <text x="78" y="1256" font-family="'EB Garamond', Georgia, serif" font-size="26" fill="#E3ECFF">Electronic structure in phase space.</text>
    <line x1="78" y1="1282" x2="968" y2="1282" stroke="#9BB4F0" stroke-opacity="0.26" stroke-width="1"/>
    <text x="78" y="1314" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="500" letter-spacing="0.6" fill="#9BB2EA">pointreyessound.com</text>
    <text x="968" y="1314" text-anchor="end" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="500" letter-spacing="0.4" fill="#9BB2EA">BeH<tspan dy="4" font-size="12">2</tspan><tspan dy="-4">&#8201;&#183;&#8201;T = 0.06 Ha&#8201;&#183;&#8201;arXiv:2608.14979</tspan></text>
  </g>
</svg>
'''
    with open(OUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg)


def export_png():
    # Export crisp 2x Retina (2160 x 2700)
    subprocess.run(
        ["rsvg-convert", "-w", "2160", "-h", "2700", OUT_SVG, "-o", OUT_PNG],
        check=True,
    )
    phone_preview = os.path.join(REPO_ROOT, "scratch", "qbescf_slide1_phone_preview.png")
    img = Image.open(OUT_PNG)
    img_phone = img.resize((390, 488), Image.Resampling.LANCZOS)
    img_phone.save(phone_preview)
    print(f"Saved SVG: {OUT_SVG}")
    print(f"Saved PNG: {OUT_PNG} ({img.size})")
    print(f"Saved phone preview: {phone_preview} ({img_phone.size})")


if __name__ == "__main__":
    b64, vlim = render_wigner_png_b64()
    logo_b64 = load_logo_b64()
    build_svg(b64, logo_b64, vlim)
    export_png()
