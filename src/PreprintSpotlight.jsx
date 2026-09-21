import React, { useState } from "react";
import "./PreprintSpotlight.css";

const topologicalFeatures = [
  {
    id: "coulson-fischer-h2",
    badge: "TOPOLOGICAL CUSP",
    system: "H₂ / STO-3G",
    featureName: "Coulson-Fischer Crossing",
    sublabel: "Homolytic Bond Cleavage & Cusp Smoothing",
    imageDarkSrc: "/assets/preprint/Fig2_H2_Dissociation_dark.png",
    imageWhiteSrc: "/assets/preprint/Fig2_H2_Dissociation.png",
    figureTag: "FIGURE 2: POTENTIAL ENERGY SURFACE",
    caption: "H₂ dissociation showing RHF energy cusp and unphysical spin-symmetry breaking vs smooth QBE-SCF (T = 0.06 Ha) Helmholtz free energy path.",
    scientificTakeaway:
      "At the Coulson-Fischer bifurcation point (R ≈ 2.3 Bohr), single-determinant RHF develops an unphysical derivative cusp before branching into spin-contaminated UHF. QBE-SCF introduces finite-temperature configurational entropy (S_conf) and von Neumann entropy (S_vN), yielding a strictly smooth C¹ free energy path F = E - TS that matches Full-CI dissociation without symmetry breaking.",
    telemetry: [
      { label: "Singularity Type", value: "Derivative Cusp / Bifurcation" },
      { label: "Relaxation Mode", value: "BGK Collision Operator" },
      { label: "Entropic Parameter", value: "T = 0.06 Ha" },
      { label: "Asymptotic Bound", value: "Neutral Biradical (2 H•)" }
    ]
  },
  {
    id: "static-correlation-h3",
    badge: "STATIC CORRELATION",
    system: "H₃ / D₃ₕ Trimer",
    featureName: "Static Correlation & GVB Limit",
    sublabel: "Symmetric D₃ₕ Stretch & Orbital Near-Degeneracy",
    imageDarkSrc: "/assets/preprint/Fig3_H3_Dissociation_dark.png",
    imageWhiteSrc: "/assets/preprint/Fig3_H3_Dissociation.png",
    figureTag: "FIGURE 3: MULTIREFERENCE DECOUPLING",
    caption: "H₃ symmetric equilateral stretch at D₃ₕ geometry: Single-reference failure vs exact QBE-SCF GVB asymptotic plateau.",
    scientificTakeaway:
      "Simultaneous equilateral elongation of H₃ generates an E' ⊗ e' Jahn-Teller orbital near-degeneracy with intense static multireference correlation. Standard mean-field solvers either fail to converge or collapse into unphysical symmetry-broken states. QBE-SCF continuously depopulates and repopulates natural orbitals, rigorously reproducing the Generalized Valence Bond (GVB) limit with O(N³) computational complexity.",
    telemetry: [
      { label: "Singularity Type", value: "E' ⊗ e' Orbital Near-Degeneracy" },
      { label: "Entropy Metric", value: "Decoupled S_conf vs S_vN" },
      { label: "Complexity", value: "O(N³) Polynomial" },
      { label: "Asymptotic Bound", value: "Exact GVB 3-Atom Limit" }
    ]
  },
  {
    id: "berry-phase-h4",
    badge: "BERRY PHASE HOLONOMY",
    system: "H₄ / Rectangular Loop",
    featureName: "H₄ Berry Phase Loop",
    sublabel: "Geometric Phase Loop & Dual Entropy Signature",
    imageDarkSrc: "/assets/preprint/Fig6_H4_Berry_dark.png",
    imageWhiteSrc: "/assets/preprint/Fig6_H4_Berry.png",
    figureTag: "FIGURE 6: TOPOLOGICAL GEOMETRIC PHASE",
    caption: "H₄ pseudorotation trajectory encircling the D₄ₕ conical seam: Electronic wavefunction sign inversion and continuous operator transport.",
    scientificTakeaway:
      "Parametric pseudorotation around the square D₄ₕ geometry traverses a conical intersection, inducing a topological Berry phase of π (electronic wavefunction sign inversion). While traditional SCF exhibits violent cyclic discontinuity and hysteresis, QBE-SCF guarantees smooth, single-valued transport of the density matrix spectrum around the complete loop θ ∈ [0, 2π) with a characteristic dual-entropy peak at the degenerate crossing.",
    telemetry: [
      { label: "Singularity Type", value: "Conical Seam / π Berry Phase" },
      { label: "Trajectory", value: "θ ∈ [0, 2π) Pseudorotation" },
      { label: "Geometric Holonomy", value: "Gauge-Invariant Sign Flip" },
      { label: "Cyclic Stability", value: "Zero Hysteresis" }
    ]
  },
  {
    id: "conical-intersection-beh2",
    badge: "CONICAL INTERSECTION",
    system: "BeH₂ / C₂ᵥ Pathway",
    featureName: "BeH₂ Conical Intersection",
    sublabel: "1¹A₁ ↔ 2¹A₁ Non-Adiabatic Seam Regularization",
    imageDarkSrc: "/assets/preprint/Fig7_Composite_BeH2_dark.png",
    imageWhiteSrc: "/assets/preprint/Fig7_Composite_BeH2.png",
    figureTag: "FIGURE 7: COMPOSITE SEAM & HESSIAN MODES",
    caption: "Be insertion into H₂ along C₂ᵥ coordinates: Entropic smoothing of the 1¹A₁/2¹A₁ avoided crossing with positive semi-definite Hessians.",
    scientificTakeaway:
      "The perpendicular insertion of Be into H₂ features an avoided crossing and conical intersection between 1¹A₁ and 2¹A₁ electronic states. Conventional DIIS and Newton-Raphson solvers suffer catastrophic charge sloshing and negative Hessian instabilities. QBE-SCF utilizes algebraic connectivity (Fiedler friction) to stabilize kinetic transport across the gap minimum, generating smooth, differentiable free energy surfaces suitable for non-adiabatic molecular dynamics.",
    telemetry: [
      { label: "Singularity Type", value: "1¹A₁ / 2¹A₁ State Crossing" },
      { label: "Kinetic Damping", value: "Fiedler Algebraic Friction" },
      { label: "Hessian Stability", value: "Positive Semi-Definite" },
      { label: "Force Evaluation", value: "Continuous C¹ Gradient" }
    ]
  }
];

const PREPRINT_BIBTEX = `@article{chakraborty2026qbescf,
  title={Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities},
  author={Chakraborty, Romit},
  journal={arXiv preprint arXiv:2608.14979},
  year={2026},
  doi={10.48550/arXiv.2608.14979},
  url={https://arxiv.org/abs/2608.14979}
}`;

export default function PreprintSpotlight({ onCopyBibtex, copiedBibtexId }) {
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
  const [plotTheme, setPlotTheme] = useState("dark"); // Default to Dark for marketing promo
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [localCopied, setLocalCopied] = useState(false);

  const currentFeature = topologicalFeatures[activeFeatureIdx];
  const activeImageSrc =
    plotTheme === "dark" ? currentFeature.imageDarkSrc : currentFeature.imageWhiteSrc;

  const handleCopyCitation = () => {
    if (onCopyBibtex) {
      onCopyBibtex();
    } else {
      navigator.clipboard.writeText(PREPRINT_BIBTEX);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2400);
    }
  };

  const isCopied = copiedBibtexId === "arxiv-2608-14979" || localCopied;

  return (
    <div className="preprint-spotlight-wrapper" id="preprint">
      <div className="preprint-spotlight-card">
        {/* Spotlight Header Bar */}
        <div className="spotlight-top-bar">
          <div className="spotlight-tag-group">
            <span className="spotlight-badge">FOUNDATIONAL PREPRINT</span>
            <span className="spotlight-meta">
              arXiv:2608.14979 [physics.chem-ph, quant-ph] &bull; August 2026
            </span>
          </div>

          <div className="spotlight-status-row">
            <span className="spotlight-status">Open Access</span>
            <a
              href="https://doi.org/10.48550/arXiv.2608.14979"
              target="_blank"
              rel="noopener noreferrer"
              className="spotlight-doi-pill"
              title="Digital Object Identifier"
            >
              DOI: 10.48550/arXiv.2608.14979
            </a>
          </div>
        </div>

        {/* Paper Title & Author Details */}
        <h2 className="spotlight-title">
          Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities
        </h2>
        <p className="spotlight-author">
          <strong>Dr. Romit Chakraborty</strong> &bull; Founder &amp; Chief Scientific Officer, Point Reyes Sound, Inc.
        </p>

        {/* Interactive Topological Stage */}
        <div className="spotlight-stage">
          {/* Active Belt (Vertical Selector Column) */}
          <div className="active-belt" role="tablist" aria-label="Topological Features">
            <div className="belt-header">
              <span className="belt-kicker">ACTIVE BELT &bull; 4 TOPOLOGICAL PHENOMENA</span>
            </div>

            {topologicalFeatures.map((feat, idx) => {
              const isActive = idx === activeFeatureIdx;
              return (
                <button
                  key={feat.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`belt-button ${isActive ? "active" : ""}`}
                  onClick={() => setActiveFeatureIdx(idx)}
                >
                  <div className="belt-btn-top">
                    <span className="belt-badge">{feat.badge}</span>
                    <span className="belt-system">{feat.system}</span>
                  </div>
                  <h4 className="belt-btn-title">{feat.featureName}</h4>
                  <p className="belt-btn-desc">{feat.sublabel}</p>
                </button>
              );
            })}
          </div>

          {/* Plot Showcase Panel */}
          <div className="plot-showcase-panel">
            <div className="plot-viewer-header">
              <div className="plot-title-group">
                <span className="plot-kicker">{currentFeature.figureTag}</span>
                <h3 className="plot-title">{currentFeature.featureName}</h3>
              </div>

              {/* Theme Toggle (Dark Promo vs Paper White) & Zoom Controls */}
              <div className="plot-controls-group">
                <div className="plot-theme-toggle" role="group" aria-label="Plot Theme Palette">
                  <button
                    type="button"
                    className={`theme-toggle-btn ${plotTheme === "dark" ? "active" : ""}`}
                    onClick={() => setPlotTheme("dark")}
                    title="Dark Promo Theme (aligned with site UI)"
                  >
                    <span className="theme-dot dark-dot"></span>
                    Dark (Promo)
                  </button>
                  <button
                    type="button"
                    className={`theme-toggle-btn ${plotTheme === "white" ? "active" : ""}`}
                    onClick={() => setPlotTheme("white")}
                    title="Preprint & Paper White Theme"
                  >
                    <span className="theme-dot white-dot"></span>
                    Paper (White)
                  </button>
                </div>

                <button
                  type="button"
                  className="plot-inspect-badge"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Expand and zoom figure"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  Zoom Plot
                </button>
              </div>
            </div>

            {/* Central Plot Image Frame */}
            <div
              className={`plot-image-container ${plotTheme === "dark" ? "dark-mode" : "white-mode"}`}
              onClick={() => setIsLightboxOpen(true)}
              title="Click to view full-resolution figure"
            >
              <img
                src={activeImageSrc}
                alt={currentFeature.featureName}
                className="plot-figure-img"
                loading="eager"
              />
              <span className="plot-figure-overlay-hint">🔍 Click to expand</span>
            </div>

            {/* Scientific Insight / Takeaway */}
            <div className="plot-insight-box">
              <p className="plot-insight-text">
                {currentFeature.scientificTakeaway}
              </p>
            </div>

            {/* Telemetry Metric Grid */}
            <div className="plot-telemetry-grid">
              {currentFeature.telemetry.map((t, i) => (
                <div key={i} className="plot-telemetry-cell">
                  <div className="plot-telemetry-label">{t.label}</div>
                  <div className="plot-telemetry-value">{t.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button Row & Scite Badge */}
        <div className="spotlight-actions-bar">
          <div className="spotlight-btn-group">
            <a
              href="https://arxiv.org/abs/2608.14979"
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn-styled primary"
            >
              <span>View on arXiv (2608.14979)</span>
              <span>&rarr;</span>
            </a>

            <a
              href="https://arxiv.org/pdf/2608.14979.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn-styled secondary"
            >
              <span>Download Manuscript PDF</span>
              <span>&darr;</span>
            </a>

            <button
              type="button"
              onClick={handleCopyCitation}
              className={`action-btn-styled outline ${isCopied ? "copied" : ""}`}
            >
              <span>{isCopied ? "✓ Citation Copied" : "Copy BibTeX"}</span>
            </button>

            <a
              href="https://github.com/point-reyes-sound"
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn-styled outline"
              title="Raw Datasets and Reproduction Scripts"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Reproduce Data &amp; Plots</span>
            </a>
          </div>

          <div
            className="scite-badge"
            data-doi="10.48550/arXiv.2608.14979"
            data-layout="horizontal"
            data-show-zero="false"
            data-small="true"
          />
        </div>
      </div>

      {/* High-Resolution Zoom Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="plot-lightbox-modal"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`lightbox-content ${plotTheme === "dark" ? "dark-mode" : "white-mode"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setIsLightboxOpen(false)}
            >
              ✕ Close
            </button>
            <img src={activeImageSrc} alt={currentFeature.featureName} />
            <p className="lightbox-caption">
              <strong>{currentFeature.featureName}:</strong> {currentFeature.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
