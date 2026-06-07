import { useState } from "react";
import "./App.css";

const phiQuestTabs = [
  {
    id: "abstract",
    label: "I. Fluid Ontology",
    eyebrow: "FOUNDATIONAL MANUSCRIPT // REGISTRATION NO. 64/033,274",
    title: "Fluid Phase Space Optimization",
    subtitle: "Treating electron correlation as an informational fluid to bypass combinatorial walls.",
    isHeroLayout: true,
    heroAsset: "/o2_wigner_dual_slice.png",
    heroText: "The core solver reformulates electronic self-consistency as a kinetic transport process. By propagating the density matrix as a phase-space distribution and relaxing it via a Bhatnagar-Gross-Krook (BGK) collision operator, we replace static eigenvalue diagonalization with the entropic equilibration of an informational fluid. This naturally resolves topological singularities without relying on exponential O(N!) combinatorial scaling."
  },
  {
    id: "fiedler_markov",
    label: "II. Fiedler-Markov QBE",
    eyebrow: "MATHEMATICAL ENGINE // COLLISION OPERATOR",
    title: "Quantum Boltzmann Kinetic Engine",
    subtitle: "Bridging kinetic theory and matrix mechanics via trace-preserving matrix propagation.",
    hasPlotAsset: true,
    plotAsset: "/c2h4_wigner_phase_space.png",
    cards: [
      ["Autonomous BGK Relaxation", "Density matrices rotate toward a Fermi-Dirac equilibrium via a discrete Bhatnagar-Gross-Krook loop."],
      ["Fiedler Friction", "Collision frequency is dynamically derived from the algebraic connectivity of the HOMO-LUMO graph."],
      ["Thermodynamic Valve", "Fractional mixing channels open strictly at topological singularities."]
    ],
    talking: "Moat: Recovering exact Hartree-Fock stationarity at the zero-temperature limit."
  },
  {
    id: "conical_intersections",
    label: "III. Conical Intersections",
    eyebrow: "TOPOLOGICAL REGULARISATION // FIGURE 7",
    title: "Entropic Regularisation of Singularities",
    subtitle: "Smoothing derivative discontinuities at symmetry-breaking transitions via Helmholtz free energy minimization.",
    hasPlotAsset: true,
    plotAsset: "/figure7.png",
    stats: [
      ["T = 0", "RHF Limit", "Catastrophic Coulson-Fischer energy cusps."],
      ["T > 0", "QBE Regime", "Smooth thermodynamic continuation."],
      ["A = E - TS", "Free Energy", "Fractional occupations emerge as entropy-bearing fixed points."]
    ]
  },
  {
    id: "active_space",
    label: "IV. Active Space Replacement",
    eyebrow: "COMPLEXITY BARRIER BYPASS // N2 DISSOCIATION",
    title: "Extensive Thermodynamic Equilibration",
    subtitle: "Combinatorial scaling replaced by kinetic transport.",
    hasPlotAsset: true,
    plotAsset: "/n2_final_publication_plot.png",
    cards: [
      ["Target", "N2 Dissociation & O2 Singlet-Triplet Gap."],
      ["Method", "Relaxation of the Wigner distribution."],
      ["Result", "Exact 12.0-bit maximum entropy plateau."]
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const currentData = phiQuestTabs[activeTab];

  return (
    <main className="app binder terminal-mode">
      <aside className="binder-spine">
        <div className="binder-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="brand-block">
          <div className="kicker">POINT REYES SOUND, Inc.</div>
          <h1>Φ-QUEST</h1>
          <p>Autonomous Quantum Fluid Dynamics.</p>
        </div>
        <nav>
          {phiQuestTabs.map((tab, idx) => (
            <button
              key={tab.id}
              className={`nav-item ${idx === activeTab ? "active" : ""}`}
              onClick={() => setActiveTab(idx)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="offline">
          <strong>SECURE VAULT ACTIVE</strong>
          <span>Proprietary Architectures Restricted.</span>
        </div>
      </aside>

      <section className="page">
        <div className="page-holes" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>

        <div className="eyebrow">{currentData.eyebrow}</div>
        <h2>{currentData.title}</h2>
        <p className="subtitle">{currentData.subtitle}</p>

        {/* HERO TAB 1: Half-Cropped O2 Plot + Text Block */}
        {currentData.isHeroLayout && (
          <>
            <div className="hero-cockpit">
              <img 
                src={currentData.heroAsset} 
                alt="Wigner Phase-Space Tomography" 
                className="hero-image-crop"
              />
            </div>
            <div className="hero-text">
              {currentData.heroText}
            </div>
          </>
        )}

        {/* SHARED PLOT RENDERING (Tabs 2, 3, 4) */}
        {currentData.hasPlotAsset && (
          <div className="plot-cockpit">
            <img 
              src={currentData.plotAsset} 
              alt="Scientific Plot Data" 
              className="scientific-plot inverted-blend"
            />
          </div>
        )}

        {/* QUANTIFIED STATS GRID */}
        {currentData.stats && (
          <div className="stats">
            {currentData.stats.map(([val, lbl, dtl]) => (
              <div className="stat" key={lbl}>
                <strong>{val}</strong>
                <span>{lbl}</span>
                <small>{dtl}</small>
              </div>
            ))}
          </div>
        )}

        {/* CARDS ARCHITECTURE */}
        {currentData.cards && (
          <div className="cards">
            {currentData.cards.map(([title, text]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        )}

        {/* MOAT BLOCK */}
        {currentData.talking && (
          <div className="talking-point">
            <strong>CORE PARADIGM SHIFT</strong>
            <span>{currentData.talking}</span>
          </div>
        )}
      </section>
    </main>
  );
}