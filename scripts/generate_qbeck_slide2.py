#!/usr/bin/env python3
"""
Generate Slide 2 (2160x2700 Retina 4:5, 1080x1350 viewBox) of Point Reyes Sound's
two-slide LinkedIn carousel:
  Slide 1: QBE-SCF (BeH2 Wigner distribution)
  Slide 2: Q-BECK (Measured scaling across 36 systems, <=300 AOs)

Data source:
  ~/QAI/qbeck-static-correlation-data/data/benzyne_and_scaling_data.json

Outputs:
  - marketing/linkedin_campaign/QBECK-slide2.svg  (editable vector source)
  - marketing/linkedin_campaign/QBECK-slide2.png  (ultra-crisp 2160x2700 Retina PNG)
"""

import base64
import io
import json
import os
import subprocess
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from PIL import Image

REPO_ROOT = "/Users/romitchakraborty/QAI/point-reyes-sound"
DATA_PATH = "/Users/romitchakraborty/QAI/qbeck-static-correlation-data/data/benzyne_and_scaling_data.json"
OUT_DIR = os.path.join(REPO_ROOT, "marketing", "linkedin_campaign")
OUT_SVG = os.path.join(OUT_DIR, "QBECK-slide2.svg")
OUT_PNG = os.path.join(OUT_DIR, "QBECK-slide2.png")
FONT_PATH = os.path.join(REPO_ROOT, "scratch", "qbeck_campaign_ref", "EBGaramond.ttf")
LOGO_PATH = "/Users/romitchakraborty/.gemini/antigravity/brain/6082563a-6450-4d5f-bb26-93c94b8c6ed2/.user_uploaded/media_1794542481006_bf60aa4c.jpg"

os.makedirs(OUT_DIR, exist_ok=True)


def render_scaling_png_b64(width_px=3400, height_px=2600):
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    recs = data["scaling_records"]
    exp_overall = float(data["empirical_time_exponent"])

    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["Avenir Next", "Helvetica Neue", "Arial", "sans-serif"],
        "text.color": "#DCE6FF",
        "axes.labelcolor": "#DCE6FF",
        "xtick.color": "#C7D8FF",
        "ytick.color": "#C7D8FF",
        "axes.edgecolor": "#4F6DB8",
        "axes.linewidth": 1.1,
    })

    dpi = 400
    fig = plt.figure(figsize=(width_px / dpi, height_px / dpi), dpi=dpi)
    fig.patch.set_alpha(0.0)

    # Two stacked panels with shared log-X axis (N_AO from 13 to 330)
    gs = fig.add_gridspec(2, 1, height_ratios=[1.55, 1.0], hspace=0.10, left=0.125, right=0.975, top=0.97, bottom=0.13)
    ax1 = fig.add_subplot(gs[0])
    ax2 = fig.add_subplot(gs[1], sharex=ax1)

    for ax in (ax1, ax2):
        ax.set_facecolor("none")
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.xaxis.set_minor_locator(ticker.NullLocator())
        ax.xaxis.set_minor_formatter(ticker.NullFormatter())
        ax.yaxis.set_minor_locator(ticker.NullLocator())
        ax.yaxis.set_minor_formatter(ticker.NullFormatter())
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_color("#5E7CC4")
        ax.spines["bottom"].set_color("#5E7CC4")
        ax.grid(True, which="major", linestyle=":", linewidth=0.7, color="#3A569E", alpha=0.45)
        ax.tick_params(axis="both", which="major", labelsize=11.5, length=4.5, width=1.0, pad=5)
        ax.tick_params(axis="both", which="minor", length=0)

    # Split series
    hn = sorted([r for r in recs if r["category"] == "H_n Chain"], key=lambda x: x["nao"])
    alk = sorted([r for r in recs if r["category"] == "Alkane Chain"], key=lambda x: x["nao"])
    n2b = sorted([r for r in recs if r["category"] == "N2 Basis Series"], key=lambda x: x["nao"])
    mrm = [r for r in recs if r["category"] == "MR-MGN-BE17"]
    bmk = [r for r in recs if r["category"] == "Benchmark"]

    # Helper to plot power-law fit
    def plot_fit(ax, pts, color, ls, lw=1.8, alpha=0.9):
        xs = np.array([p["nao"] for p in pts], dtype=float)
        ys = np.array([p["t_step_ms"] for p in pts], dtype=float)
        slope, intercept = np.polyfit(np.log(xs), np.log(ys), 1)
        xgrid = np.geomspace(xs.min() * 0.92, xs.max() * 1.05, 80)
        yfit = np.exp(intercept) * (xgrid ** slope)
        ax.plot(xgrid, yfit, color=color, linestyle=ls, linewidth=lw, alpha=alpha, zorder=2)
        return slope

    s_hn = plot_fit(ax1, hn, "#F0CB69", "-", lw=2.3)
    s_alk = plot_fit(ax1, alk, "#60B5FF", "--", lw=1.9)
    s_n2 = plot_fit(ax1, n2b, "#C7D8FF", "-.", lw=1.7)

    # Scatter points on top panel
    ax1.scatter([p["nao"] for p in hn], [p["t_step_ms"] for p in hn],
                marker="D", s=48, color="#F0CB69", edgecolor="#09194A", linewidth=0.7,
                label=rf"$\mathrm{{H}}_n$ chain (slope {s_hn:.2f})", zorder=4)
    ax1.scatter([p["nao"] for p in alk], [p["t_step_ms"] for p in alk],
                marker="p", s=54, color="#60B5FF", edgecolor="#09194A", linewidth=0.7,
                label=rf"Alkane $\mathrm{{C}}_n\mathrm{{H}}_{{2n+2}}$ (slope {s_alk:.2f})", zorder=4)
    ax1.scatter([p["nao"] for p in n2b], [p["t_step_ms"] for p in n2b],
                marker="s", s=40, color="#C7D8FF", edgecolor="#09194A", linewidth=0.7,
                label=rf"$\mathrm{{N}}_2$ basis series (slope {s_n2:.2f})", zorder=4)
    ax1.scatter([p["nao"] for p in mrm], [p["t_step_ms"] for p in mrm],
                marker="^", s=44, color="#F43F5E", edgecolor="#09194A", linewidth=0.6,
                label="MR-MGN-BE17 (cc-pVDZ)", zorder=3)
    ax1.scatter([p["nao"] for p in bmk], [p["t_step_ms"] for p in bmk],
                marker="o", s=44, color="#FFF5CC", edgecolor="#09194A", linewidth=0.7,
                label="Benchmarks (cc-pVDZ)", zorder=5)

    # Selective, high-legibility system callouts using mathtext subscripts (no missing glyphs)
    callouts = {
        "H3 (cc-pVDZ)": (r"$\mathrm{H}_3$", (-4, 8), "#FFF5CC"),
        "BeH2 (cc-pVDZ)": (r"$\mathrm{BeH}_2$", (-18, 9), "#FFF5CC"),
        "o-C6H4 (cc-pVDZ)": (r"$o\text{-}\mathrm{C}_6\mathrm{H}_4$", (-32, 9), "#FFF5CC"),
        "H_10 (cc-pVDZ)": (r"$\mathrm{H}_{10}$", (4, -14), "#F0CB69"),
        "H_60 (cc-pVDZ)": (r"$\mathrm{H}_{60}$", (-6, -16), "#F0CB69"),
        "C12H26 (cc-pVDZ)": (r"$\mathrm{C}_{12}\mathrm{H}_{26}$", (-18, -19), "#60B5FF"),
        "N2 (aug-cc-pV5Z)": (r"$\mathrm{N}_2\ \mathrm{(a5Z)}$", (-52, 8), "#C7D8FF"),
    }
    for r in recs:
        if r["system"] in callouts:
            lbl, (dx, dy), col = callouts[r["system"]]
            ax1.annotate(lbl, (r["nao"], r["t_step_ms"]),
                         xytext=(dx, dy), textcoords="offset points",
                         fontsize=9.5, fontweight="semibold", color=col)

    ax1.set_ylim(0.8, 42000)
    ax1.set_yticks([1, 10, 100, 1000, 10000])
    ax1.set_ylabel("Wall-Clock Time / Step (ms)", fontsize=12.5, fontweight="medium", labelpad=10)
    plt.setp(ax1.get_xticklabels(), visible=False)

    leg1 = ax1.legend(loc="lower right", frameon=True, facecolor="#0B1F5C", edgecolor="#3A569E",
                      framealpha=0.88, fontsize=9.5, handlelength=2.2, borderpad=0.6, labelspacing=0.35)
    for txt in leg1.get_texts():
        txt.set_color("#E6EEFF")

    # Bottom panel: Memory Footprint (MB)
    recs_sorted = sorted(recs, key=lambda x: x["nao"])
    naos_all = np.array([r["nao"] for r in recs_sorted], dtype=float)
    mem_qbeck = np.array([r["mem_qbeck_mb"] for r in recs_sorted], dtype=float)
    mem_2rdm = np.array([r["mem_2rdm_mb"] for r in recs_sorted], dtype=float)

    ax2.plot(naos_all, mem_2rdm, color="#F43F5E", linestyle=":", linewidth=2.4,
             label=r"Explicit 2-RDM Memory $O(N^4)$", zorder=3)
    ax2.plot(naos_all, mem_qbeck, color="#F0CB69", linestyle="-", linewidth=2.4,
             label=r"Q-BECK 1-RDM Working Memory $O(N^2)$", zorder=4)
    ax2.scatter(naos_all[::2], mem_qbeck[::2], s=26, color="#FFF5CC", edgecolor="#09194A", linewidth=0.5, zorder=5)

    ax2.set_ylim(0.3, 180000)
    ax2.set_yticks([1, 100, 10000])
    ax2.set_ylabel("Memory (MB)", fontsize=12.5, fontweight="medium", labelpad=10)

    ax2.set_xlim(13, 340)
    xticks = [15, 30, 60, 120, 240, 300]
    ax2.set_xticks(xticks)
    ax2.get_xaxis().set_major_formatter(ticker.ScalarFormatter())
    ax2.set_xticklabels([str(x) for x in xticks])
    ax2.set_xlabel(r"Atomic Orbital Basis Size ($N_{\mathrm{AO}}$)", fontsize=12.5, fontweight="medium", labelpad=8)

    leg2 = ax2.legend(loc="upper left", frameon=True, facecolor="#0B1F5C", edgecolor="#3A569E",
                      framealpha=0.88, fontsize=9.8, handlelength=2.2, borderpad=0.6, labelspacing=0.35)
    for txt in leg2.get_texts():
        txt.set_color("#E6EEFF")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, transparent=True)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("ascii"), exp_overall


def load_logo_b64():
    with open(LOGO_PATH, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def build_svg(plot_b64, logo_b64, exp_overall):
    plot_x = 58
    plot_y = 486
    plot_w = 922
    plot_h = 720

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
    <text x="968" y="77" text-anchor="end" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="500" letter-spacing="1.8" fill="#E9C7D1">02 / 02</text>
  </g>

  <!-- Editorial Hero Typography -->
  <g id="hero-copy">
    <text x="76" y="218" font-family="'EB Garamond', Georgia, serif" font-size="152" font-weight="600" letter-spacing="-2.4" fill="#FFFFFF">Q-BECK</text>
    <text x="78" y="284" font-family="'EB Garamond', Georgia, serif" font-size="50" font-weight="400" letter-spacing="-0.4" fill="#F8FAFF">Static correlation at scale.</text>
    <text x="78" y="330" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="21" font-weight="400" letter-spacing="0.5" fill="#A7BDF2">Quantum Boltzmann Equation &#183; Cumulant-Kernel</text>
  </g>

  <!-- Key Scaling Metrics Strip -->
  <g id="metrics-strip">
    <text x="78" y="418" font-family="'EB Garamond', Georgia, serif" font-size="56" font-weight="600" fill="#F0CB69">O(N<tspan dy="-20" font-size="32">3</tspan><tspan dy="20">)</tspan></text>
    <text x="78" y="450" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="17" font-weight="500" letter-spacing="0.4" fill="#C7D8FF">Near-cubic time per step*</text>

    <text x="520" y="418" font-family="'EB Garamond', Georgia, serif" font-size="56" font-weight="600" fill="#FFF5CC">O(N<tspan dy="-20" font-size="32">2</tspan><tspan dy="20">)</tspan></text>
    <text x="520" y="450" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="17" font-weight="500" letter-spacing="0.4" fill="#C7D8FF">Working memory &#183; &lt;29 MB at 300 AOs</text>
  </g>

  <!-- Hero Scaling Plot -->
  <g id="scaling-hero">
    <image x="{plot_x}" y="{plot_y}" width="{plot_w}" height="{plot_h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{plot_b64}"/>
  </g>

  <!-- Image Caption & Quiet Footer -->
  <g id="footer">
    <text x="78" y="1256" font-family="'EB Garamond', Georgia, serif" font-size="25" fill="#E3ECFF">Measured across 36 molecular systems up to 300 atomic orbitals.</text>
    <line x1="78" y1="1282" x2="968" y2="1282" stroke="#9BB4F0" stroke-opacity="0.26" stroke-width="1"/>
    <text x="78" y="1314" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="500" letter-spacing="0.6" fill="#9BB2EA">pointreyessound.com</text>
    <text x="968" y="1314" text-anchor="end" font-family="'Avenir Next', 'Helvetica Neue', sans-serif" font-size="16" font-weight="500" letter-spacing="0.4" fill="#9BB2EA">*Overall fit N<tspan dy="-5" font-size="11">{exp_overall:.2f}</tspan><tspan dy="5">&#8201;&#183;&#8201;Apple M2 CPU&#8201;&#183;&#8201;arXiv:2611.17245</tspan></text>
  </g>
</svg>
'''
    with open(OUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg)


def export_png():
    subprocess.run(
        ["rsvg-convert", "-w", "2160", "-h", "2700", OUT_SVG, "-o", OUT_PNG],
        check=True,
    )
    phone_preview = os.path.join(REPO_ROOT, "scratch", "qbeck_slide2_phone_preview.png")
    img = Image.open(OUT_PNG)
    img_phone = img.resize((390, 488), Image.Resampling.LANCZOS)
    img_phone.save(phone_preview)
    print(f"Saved SVG: {OUT_SVG}")
    print(f"Saved PNG: {OUT_PNG} ({img.size})")
    print(f"Saved phone preview: {phone_preview} ({img_phone.size})")


if __name__ == "__main__":
    plot_b64, exp_overall = render_scaling_png_b64()
    logo_b64 = load_logo_b64()
    build_svg(plot_b64, logo_b64, exp_overall)
    export_png()
