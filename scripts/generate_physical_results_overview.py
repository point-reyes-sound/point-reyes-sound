import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import matplotlib.patches as patches
from PIL import Image

# -------------------------------------------------------------------------
# Paths
# -------------------------------------------------------------------------
P1_DATA = "/Users/romitchakraborty/QAI/p1_qbescf/data"

OUT_LINKEDIN_CARD = "/Users/romitchakraborty/QAI/point-reyes-sound/public/assets/preprint/qbescf_linkedin_card.png"
OUT_HERO_HOOK = "/Users/romitchakraborty/QAI/point-reyes-sound/public/assets/preprint/qbescf_hero_click_hook.png"
OUT_MARKETING = "/Users/romitchakraborty/QAI/point-reyes-sound/marketing/linkedin_figure.png"

# -------------------------------------------------------------------------
# 1. Load Physics Datasets
# -------------------------------------------------------------------------
# H2 Dissociation
d2 = np.load(os.path.join(P1_DATA, 'raw', 'fig2_h2_dissociation.npz'))
R_h2 = d2['R']
e_rhf = d2['E_RHF']
e_uhf = d2['E_UHF_Perturbed']
e_fci = d2['E_FCI']
f_qbe = d2['F_QBE_T06']
s_conf_t0 = d2['S_Conf_T0']
s_conf_t06 = d2['S_Conf_T06']
s_vn_t06 = d2['S_vN_T06']
min_E_h2 = np.min(e_fci)

# BeH2 Wigner Phase Space
d7 = np.load(os.path.join(P1_DATA, 'fig7bcd_beh2_data.npz'))
W_lb = d7['W_lb']
q_bohr = d7['q']
k_y = d7['k']
captured_T = float(d7['captured_T'])

# -------------------------------------------------------------------------
# 2. Authentic Paper Orbital Renders (VMD Tachyon Isosurfaces)
# -------------------------------------------------------------------------
# User: "use the images in the paper. just pick the right ones and render them professionally!"
# "it should say 'Covalent', 'Open Shell', 'Multireference' and the figures should speak
# of the physical reality posited in the paper."
ASSETS_DIR = "/Users/romitchakraborty/QAI/point-reyes-sound/public/assets/preprint"
orb_covalent = Image.open(os.path.join(ASSETS_DIR, "h3_covalent.png"))
orb_openshell = Image.open(os.path.join(ASSETS_DIR, "h3_openshell.png"))
orb_multiref = Image.open(os.path.join(ASSETS_DIR, "h3_multireference.png"))

# -------------------------------------------------------------------------
# 3. Styling & Color Palettes
# -------------------------------------------------------------------------
BG_COLOR = "#020611"        # Deep cosmic obsidian
CARD_BG = "#061324"         # Deep translucent navy
CARD_INNER_BG = "#030a16"   # Sub-card inner obsidian
CARD_BORDER = "#1b3452"     # Crisp subtle border
CYAN_ACCENT = "#38bdf8"     # Electric cyan (+)
ROSE_ACCENT = "#f43f5e"     # Warm rose (-)
EMERALD_ACCENT = "#34d399"  # Luminous emerald
AMBER_ACCENT = "#fbbf24"    # Luminous amber
TEXT_PRIMARY = "#f8fafc"    # Pure crisp white
TEXT_SECONDARY = "#94a3b8"  # Slate secondary
TEXT_MUTED = "#64748b"      # Muted slate

# Exact fluid colormap from preprint
cool_colors = [
    (0.0,  "#000000"),
    (0.2,  "#001144"),
    (0.4,  "#003388"),
    (0.6,  "#0099CC"),
    (0.8,  "#00DD99"),
    (1.0,  "#CCFF00"),
]
fluid_wigner_cmap = mcolors.LinearSegmentedColormap.from_list("FluidWigner", cool_colors)

# Setup figure canvas (16:9 ratio, 2400 x 1350 @ 160 dpi)
fig = plt.figure(figsize=(15.0, 8.4375), dpi=160)
fig.patch.set_facecolor(BG_COLOR)

plt.rcParams.update({
    'font.family': 'serif',
    'font.serif': ['EB Garamond', 'DejaVu Serif', 'Times New Roman', 'serif'],
    'text.color': TEXT_PRIMARY,
    'axes.labelcolor': TEXT_SECONDARY,
    'xtick.color': TEXT_MUTED,
    'ytick.color': TEXT_MUTED,
    'axes.edgecolor': CARD_BORDER,
    'axes.linewidth': 1.1,
    'xtick.direction': 'in',
    'ytick.direction': 'in',
})

# =========================================================================
# HEADER BAR: Clean Paper Title & arXiv Preprint Number
# User: "I don't think we need point reyes sound at the top nor the 'physical results overview'
#        we just need the arxiv preprint number. and neither do we need (QBE-SCF)
#        nor 'Entropic Regularisation of mean field singularities'"
# =========================================================================
ax_hdr = fig.add_axes([0.035, 0.905, 0.93, 0.065])
ax_hdr.set_facecolor(BG_COLOR)
ax_hdr.axis('off')

ax_hdr.text(0.0, 0.50, "Quantum Boltzmann Equation Self-Consistent-Field",
            color=TEXT_PRIMARY, fontsize=21.5, fontfamily='serif', fontweight='bold', va='center')
ax_hdr.text(1.0, 0.50, "arXiv:2608.14979",
            color=CYAN_ACCENT, fontsize=14.5, fontfamily='monospace', fontweight='bold', ha='right', va='center')

# Helper to create a styled card container axis
def create_card_container(x, y, w, h, title, subtitle):
    ax_card = fig.add_axes([x, y, w, h])
    ax_card.set_facecolor(CARD_BG)
    for spine in ax_card.spines.values():
        spine.set_color(CARD_BORDER)
        spine.set_linewidth(1.2)
    ax_card.set_xticks([])
    ax_card.set_yticks([])
    ax_card.text(0.04, 0.96, title, transform=ax_card.transAxes,
                 color=TEXT_PRIMARY, fontsize=11.5, fontweight='bold', fontfamily='serif', va='top')
    ax_card.text(0.04, 0.905, subtitle, transform=ax_card.transAxes,
                 color=CYAN_ACCENT, fontsize=8.8, fontfamily='sans-serif', va='top')
    return ax_card

# =========================================================================
# COLUMN 1: Potential Energy & Entropy Resolution (Left)
# Container: x=0.035, w=0.305 (Left border at 0.035, Right border at 0.340)
# =========================================================================
create_card_container(0.035, 0.09, 0.305, 0.79,
                      title=r"1. Potential Energy Surface & Entropy",
                      subtitle=r"H₂ Dissociation (cc-pVTZ) • Cusp Regularization (C¹ Free Energy)")

# Internal PES Subplot: x=0.096, w=0.228 -> Labels at x ~ 0.055, fully inside 0.035!
ax_pes = fig.add_axes([0.096, 0.465, 0.228, 0.30])
ax_pes.set_facecolor(CARD_INNER_BG)
ax_pes.grid(True, linestyle=':', color=CYAN_ACCENT, alpha=0.15)

rel_fci = e_fci - min_E_h2
rel_rhf = e_rhf - min_E_h2
rel_uhf = e_uhf - min_E_h2
rel_qbe = f_qbe - min_E_h2

# Benchmark Full-CI line with subtle halo
ax_pes.plot(R_h2, rel_fci, color='#38bdf8', lw=5.0, alpha=0.25, zorder=1)
ax_pes.plot(R_h2, rel_fci, color='#ffffff', lw=3.2, alpha=0.95, label='Exact Full-CI', zorder=2)
ax_pes.plot(R_h2, rel_rhf, color='#60a5fa', ls='--', lw=1.8, label='RHF (Singular Cusp)', zorder=3)
ax_pes.plot(R_h2, rel_uhf, color=AMBER_ACCENT, ls=':', lw=2.0, label='UHF (Spin-Broken)', zorder=3)
ax_pes.plot(R_h2, rel_qbe, color=ROSE_ACCENT, ls='-', lw=2.0, marker='s', mfc='none', mec=ROSE_ACCENT, mew=1.5,
            markersize=4.0, markevery=(3, 7), label=r'QBE-SCF $F = E - TS$', zorder=4)

ax_pes.axvline(1.21, color='#64748b', linestyle=':', alpha=0.5, zorder=0)
ax_pes.text(1.25, 0.36, "Coulson-Fischer\nBifurcation", color='#94a3b8', fontsize=7.6, fontfamily='sans-serif')

ax_pes.set_xlim(0.5, 3.8)
ax_pes.set_ylim(-0.02, 0.44)
ax_pes.set_ylabel(r'Relative Energy ($E_h$)', fontsize=9.5, labelpad=8)
ax_pes.set_xticklabels([])
ax_pes.tick_params(labelsize=8.5)
leg_pes = ax_pes.legend(loc='upper right', fontsize=8.0, frameon=True, facecolor=CARD_BG, edgecolor=CARD_BORDER)
for t in leg_pes.get_texts(): t.set_color(TEXT_SECONDARY)

# Internal Entropy Subplot: x=0.096, w=0.228
ax_ent = fig.add_axes([0.096, 0.135, 0.228, 0.265])
ax_ent.set_facecolor(CARD_INNER_BG)
ax_ent.grid(True, linestyle=':', color=CYAN_ACCENT, alpha=0.15)

ax_ent.plot(R_h2, s_conf_t0, color='#ffffff', ls='--', lw=1.5, label=r'$S_{\mathrm{conf}}(T=0)$', zorder=2)
ax_ent.plot(R_h2, s_conf_t06, color=ROSE_ACCENT, ls='-', lw=2.0, label=r'$S_{\mathrm{conf}}(T=0.06)$', zorder=3)
ax_ent.plot(R_h2, s_vn_t06, color='#94a3b8', ls='-.', lw=1.6, label=r'$S_{\mathrm{vN}}(T=0.06)$', zorder=2)
ax_ent.axvline(1.21, color='#64748b', linestyle=':', alpha=0.5)

ax_ent.axhline(2.0, color=EMERALD_ACCENT, linestyle=':', alpha=0.4)
ax_ent.text(2.45, 2.08, "Mott Limit (2.0 Bits)", color=EMERALD_ACCENT, fontsize=7.5, fontfamily='monospace')

ax_ent.set_xlim(0.5, 3.8)
ax_ent.set_ylim(-0.1, 2.3)
ax_ent.set_xlabel(r'Bond Length $R$ ($\mathrm{\AA}$)', fontsize=9.5)
ax_ent.set_ylabel(r'Entropy $S$ (Bits)', fontsize=9.5, labelpad=8)
ax_ent.tick_params(labelsize=8.5)
leg_ent = ax_ent.legend(loc='center right', fontsize=7.8, frameon=True, facecolor=CARD_BG, edgecolor=CARD_BORDER)
for t in leg_ent.get_texts(): t.set_color(TEXT_SECONDARY)

# =========================================================================
# COLUMN 2: Phase Space Fluid (Center) - User exact title: "Phase Space Fluid"
# Container: x=0.360, w=0.345 (Left border at 0.360, Right border at 0.705)
# =========================================================================
create_card_container(0.360, 0.09, 0.345, 0.79,
                      title=r"2. Phase Space Fluid",
                      subtitle=r"BeH₂ Conical Seam (6-31G) • Quantum Interference & Wigner Quasiprobability")

# Internal Wigner Plot: x=0.418, w=0.235 -> Labels at x ~ 0.375, fully inside 0.360!
ax_wig = fig.add_axes([0.418, 0.135, 0.235, 0.63])
ax_wig.set_facecolor(CARD_INNER_BG)

extent_w = [q_bohr.min(), q_bohr.max(), k_y.min(), k_y.max()]
im = ax_wig.imshow(W_lb.T, origin='lower', aspect='auto', extent=extent_w, cmap=fluid_wigner_cmap,
                   vmin=-6.0, vmax=7.0, interpolation='bicubic')

ax_wig.set_xlim(-2.8, 2.8)
ax_wig.set_ylim(-4.8, 4.8)
ax_wig.set_xlabel(r'Transverse Position $y$ ($a_0$)', fontsize=9.8)
ax_wig.set_ylabel(r'Momentum $k_y$ (a.u.)', fontsize=9.8, labelpad=8)
ax_wig.tick_params(labelsize=8.5)

# Annotation for physical mechanism of Wigner distribution
ax_wig.text(0.04, 0.06, r"Quantum Interference ($W < 0$)", transform=ax_wig.transAxes,
            color=CYAN_ACCENT, fontsize=8.2, fontfamily='sans-serif',
            bbox=dict(boxstyle='round,pad=0.25', facecolor=CARD_BG, edgecolor=CARD_BORDER, alpha=0.85))

# Badge for T
ax_wig.text(0.94, 0.94, r'$T = 0.06\ \mathrm{Ha}$', color='#ffffff',
            fontsize=8.5, fontweight='bold', ha='right', va='top', transform=ax_wig.transAxes,
            bbox=dict(boxstyle='round,pad=0.3', facecolor=CARD_BG, edgecolor=CARD_BORDER, alpha=0.90))

# Colorbar for Wigner: x=0.660, w=0.011, h=0.63 -> Ends at 0.671, well inside 0.705!
cb_ax = fig.add_axes([0.660, 0.135, 0.011, 0.63])
cb = fig.colorbar(im, cax=cb_ax)
cb.set_label(r'Wigner Quasiprobability $W(y, k_y)$', fontsize=8.8, color=TEXT_SECONDARY, rotation=270, labelpad=14)
cb.ax.tick_params(labelsize=8, colors=TEXT_MUTED)
cb.outline.set_edgecolor(CARD_BORDER)

# =========================================================================
# COLUMN 3: 3D Natural Orbitals with Physical Reality Posited in Paper
# User: "it should say 'Covalent', 'Open Shell', 'Multireference' and the
#        figures should speak of the physical reality posited in the paper."
# User: "use the images in the paper. just pick the right ones and render them professionally!"
# Container: x=0.725, w=0.240 (Left border at 0.725, Right border at 0.965)
# =========================================================================
create_card_container(0.725, 0.09, 0.240, 0.79,
                      title=r"3. Natural Orbital Fractionalization",
                      subtitle=r"H₃ Active Space (R = 1.52 Å) • Covalent / Open Shell / Multireference")

# 3 Orbital Sub-cards showing 'Covalent', 'Open Shell', and 'Multireference'
orb_configs = [
    (orb_covalent, 0.575, "Covalent", r"p₁ (a₁')  •  1.71 e⁻", "Bonding core pair delocalized across all 3 centers", 1.7089, CYAN_ACCENT),
    (orb_openshell, 0.345, "Open Shell", r"p₂ (e')  •  1.00 e⁻", "Unentangled spectator radical (exact 1.00 e⁻)", 1.0000, AMBER_ACCENT),
    (orb_multiref, 0.115, "Multireference", r"p₃ (e')  •  0.29 e⁻", "GVB multireference pair across Coulson-Fischer seam", 0.2911, ROSE_ACCENT)
]

for orb_img, y_pos, role_badge, orb_label, physical_desc, occ_val, accent_color in orb_configs:
    ax_subcard = fig.add_axes([0.737, y_pos, 0.216, 0.210])
    ax_subcard.set_facecolor(CARD_INNER_BG)
    for spine in ax_subcard.spines.values():
        spine.set_color(CARD_BORDER)
        spine.set_linewidth(1.0)
    ax_subcard.set_xticks([])
    ax_subcard.set_yticks([])

    # Display authentic paper Tachyon rendered orbital image (Centered vertically and horizontally)
    ax_orb = fig.add_axes([0.762, y_pos + 0.038, 0.166, 0.124])
    ax_orb.imshow(orb_img)
    ax_orb.axis('off')

    # Top Header inside subcard: Bold Role ('Covalent', 'Open Shell', 'Multireference') + Telemetry
    ax_subcard.text(0.06, 0.90, role_badge.upper(), transform=ax_subcard.transAxes,
                    color=accent_color, fontsize=8.6, fontweight='bold', fontfamily='monospace', va='top')
    ax_subcard.text(0.94, 0.90, orb_label, transform=ax_subcard.transAxes,
                    color=TEXT_PRIMARY, fontsize=7.8, fontfamily='monospace', ha='right', va='top')
                    
    # High-tech Occupancy Progress Bar (scale 0.0 to 2.0)
    bar_x = 0.06
    bar_y = 0.138
    bar_w = 0.88
    bar_h = 0.024
    rect_bg = patches.Rectangle((bar_x, bar_y), bar_w, bar_h, transform=ax_subcard.transAxes,
                                facecolor="#0e1e33", edgecolor=CARD_BORDER, linewidth=0.5)
    ax_subcard.add_patch(rect_bg)
    
    fill_frac = np.clip(occ_val / 2.0, 0.04, 1.0)
    rect_fill = patches.Rectangle((bar_x, bar_y), bar_w * fill_frac, bar_h, transform=ax_subcard.transAxes,
                                  facecolor=accent_color, edgecolor='none')
    ax_subcard.add_patch(rect_fill)

    # Physical Reality as posited in preprint text:
    ax_subcard.text(0.06, 0.045, physical_desc, transform=ax_subcard.transAxes,
                    color=TEXT_SECONDARY, fontsize=7.1, fontfamily='sans-serif', va='bottom')

# =========================================================================
# FOOTER: Clean Technical Invariants
# =========================================================================
ax_ftr = fig.add_axes([0.035, 0.02, 0.93, 0.05])
ax_ftr.set_facecolor(BG_COLOR)
ax_ftr.axis('off')

footer_line = (
    r"Exact Trace $\mathrm{Tr}[\mathbf{P}] = N$   •   Polynomial $\mathcal{O}(N^3)$ Complexity   •   "
    r"Continuous Analytic Forces $\nabla_{\mathbf{R}} F$   •   Zero Active Space Truncation   •   Point Reyes Sound"
)
ax_ftr.text(0.5, 0.45, footer_line, color=TEXT_MUTED, fontsize=9.0, fontfamily='monospace', ha='center', va='center')

# -------------------------------------------------------------------------
# Save All Target Images
# -------------------------------------------------------------------------
plt.savefig(OUT_LINKEDIN_CARD, dpi=160, facecolor=BG_COLOR)
plt.savefig(OUT_HERO_HOOK, dpi=160, facecolor=BG_COLOR)
plt.savefig(OUT_MARKETING, dpi=160, facecolor=BG_COLOR)
plt.close()

print("✓ Successfully generated SOTA Physical Results Overview image with paper orbital renders:")
print("  -", OUT_LINKEDIN_CARD)
print("  -", OUT_HERO_HOOK)
print("  -", OUT_MARKETING)
