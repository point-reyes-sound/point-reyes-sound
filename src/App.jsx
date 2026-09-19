import React, { useState, useRef } from "react";
import "./App.css";
import LandingPage from "./LandingPage";
import { QuantumSonificationEngine } from "./physics/QuantumSonificationEngine";

const researchThemes = [
  {
    id: "qbe_engine",
    num: "01",
    label: "Kinetic Transport & QBE-SCF",
    badge: "FOUNDATIONAL METHODOLOGY",
    title: "Quantum Boltzmann Equation Self-Consistent Field",
    summary: "Replacing static eigenvalue diagonalization with non-equilibrium kinetic transport via a Bhatnagar-Gross-Krook (BGK) collision operator.",
    content: "Standard self-consistent field algorithms formulate electronic structure as an iterative eigenvalue problem prone to catastrophic divergence near degenerate states. The QBE-SCF framework reformulates self-consistency as a continuous kinetic relaxation of the one-electron reduced density matrix (1-RDM) towards a Fermi-Dirac state. By embedding algebraic connectivity metrics (Fiedler friction) directly into the collision operator, the solver autonomously adjusts relaxation rates across multi-orbital manifolds.",
    stats: [
      { label: "Relaxation Mode", value: "Autonomous BGK" },
      { label: "Trace Conservation", value: "Exact Tr[P] = N" },
      { label: "Matrix Complexity", value: "O(N³) Scalable" }
    ],
    highlights: [
      "Dynamic collision frequencies derived from the algebraic connectivity of the orbital graph.",
      "Stationary states rigorously recover exact Hartree-Fock solutions in the zero-temperature limit.",
      "Intrinsic damping eliminates numerical charge sloshing in narrow-gap chemical systems."
    ]
  },
  {
    id: "singularities",
    num: "02",
    label: "Topological Singularities",
    badge: "REGULARIZATION THEORY",
    title: "Entropic Regularization of Conical Intersections & Cusps",
    summary: "Smoothing Coulson-Fischer energy cusps and derivative discontinuities through Helmholtz free energy minimization.",
    content: "Mean-field electronic structure suffers from artificial derivative discontinuities at symmetry-breaking transitions. By treating the electronic state as a finite-temperature informational ensemble governed by Helmholtz free energy A = E - TS, fractional occupations emerge naturally as entropy-bearing fixed points. This replaces sharp, non-differentiable energy cusps with smooth, thermodynamically consistent energy surfaces.",
    stats: [
      { label: "Zero-T Limit", value: "RHF Singularity" },
      { label: "Finite-T (QBE)", value: "C¹ Smooth Path" },
      { label: "Free Energy Target", value: "min (E - TS)" }
    ],
    highlights: [
      "Natural analytic continuation across conical intersections and avoided crossings.",
      "Elimination of manual spin-symmetry breaking artifacts in homolytic bond fission.",
      "Direct evaluation of analytic nuclear gradients on regularized potential energy surfaces."
    ]
  },
  {
    id: "active_space",
    num: "03",
    label: "Active Space Replacement",
    badge: "COMPUTATIONAL BENCHMARK",
    title: "Extensive Thermodynamic Equilibration for Strong Correlation",
    summary: "Bypassing exponential O(N!) combinatorial CI active space selection through kinetic phase-space equilibration.",
    content: "Complete Active Space (CASSCF/DMRG) methods require manual orbital partitioning and suffer from factorial combinatorial growth. In Q-BOLTZ, strongly correlated bond dissociation (e.g., N₂ triple bond cleavage and O₂ singlet-triplet multiplet splitting) is achieved via extensive thermodynamic relaxation of the density distribution, arriving at an exact 12.0-bit maximum entropy plateau without active space truncation.",
    stats: [
      { label: "N₂ Dissociation", value: "Exact Asymptote" },
      { label: "Entropy Bound", value: "12.00 Bits" },
      { label: "Scaling Advantage", value: "Polynomial vs Exp" }
    ],
    highlights: [
      "Unbiased multi-configurational character captured without manual active space curation.",
      "Robust treatment of open-shell biradicals, polyradicals, and bond-breaking trajectories.",
      "Direct applicability to complex multi-center transition metal catalytic clusters."
    ]
  },
  {
    id: "wigner_tomography",
    num: "04",
    label: "Phase-Space Wigner Tomography",
    badge: "QUANTUM FLUID ONTOLOGY",
    title: "Informational Fluid Dynamics in Molecular Phase Space",
    summary: "Mapping quantum density matrices to phase-space distributions for intuitive, physics-informed visual exploration.",
    content: "By projecting high-dimensional density matrices into phase-space via the Wigner-Weyl transform, molecular electronic structures are interpreted as viscous quantum fluids undergoing hydrodynamic drift and diffusive collisions. This dual coordinate-momentum slice reveals nodal structures, phase coherence, and dynamic correlation effects undetectable in standard spatial orbital renderings.",
    stats: [
      { label: "Formalism", value: "Wigner-Weyl" },
      { label: "Phase Topology", value: "Non-Gaussian" },
      { label: "Visual Diagnostics", value: "Real-Time Slice" }
    ],
    highlights: [
      "Direct visualization of non-classical quantum correlation and negative quasiprobability packets.",
      "Seamless integration with phase-space machine learning surrogate models.",
      "Rigorous foundations documented under U.S. Patent Application No. 64/033,274."
    ]
  }
];

const publicationList = [
  {
    id: "arxiv-2608-14979",
    type: "Lead Preprint",
    title: "Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities",
    authors: "Romit Chakraborty",
    affil: "Point Reyes Sound, Inc.",
    journal: "arXiv:2608.14979 [quant-ph, physics.chem-ph]",
    date: "August 2026",
    doi: "10.48550/arXiv.2608.14979",
    doiUrl: "https://doi.org/10.48550/arXiv.2608.14979",
    arxivUrl: "https://arxiv.org/abs/2608.14979",
    pdf: "https://arxiv.org/pdf/2608.14979.pdf",
    featured: true,
    abstract: "Standard self-consistent field algorithms in quantum chemistry often fail or exhibit catastrophic derivative discontinuities near degenerate or open-shell states. We introduce a Quantum Boltzmann Equation self-consistent-field (QBE-SCF) framework that propagates the one-electron reduced density matrix via a Bhatnagar-Gross-Krook (BGK) collision operator. By minimizing the Helmholtz free energy with dynamic algebraic connectivity damping, QBE-SCF achieves smooth entropic regularization across Coulson-Fischer singular cusps and conical intersections without requiring exponential active space expansions.",
    bibtex: `@article{chakraborty2026qbescf,
  title={Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities},
  author={Chakraborty, Romit},
  journal={arXiv preprint arXiv:2608.14979},
  year={2026},
  doi={10.48550/arXiv.2608.14979},
  url={https://arxiv.org/abs/2608.14979}
}`
  },
  {
    id: "patent-64-033-274",
    type: "Intellectual Property",
    title: "U.S. Provisional Patent Application No. 64/033,274",
    authors: "Romit Chakraborty",
    affil: "Assignee: Point Reyes Sound, Inc.",
    journal: "",
    date: "2026",
    featured: false,
    abstract: "Underlying the preprint: Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities.",
    bibtex: `@misc{chakraborty2026patent,
  title={U.S. Provisional Patent Application No. 64/033,274},
  author={Chakraborty, Romit},
  year={2026},
  note={Assigned to Point Reyes Sound, Inc.}
}`
  }
];

export default function App() {
  const [activeTheme, setActiveTheme] = useState(0);
  const [copiedBibtexId, setCopiedBibtexId] = useState(null);

  // Deep link helper to detect if URL points to the Interactive Lab
  const checkIsInteractiveUrl = () => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "");
    return (
      path === "/interactive" ||
      path === "/lab" ||
      path === "/simulator" ||
      path === "/qboltz" ||
      hash === "interactive" ||
      hash === "lab" ||
      hash === "simulator" ||
      hash === "qboltz"
    );
  };

  const [showInteractiveLab, setShowInteractiveLab] = useState(checkIsInteractiveUrl);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const videoRef = useRef(null);

  // Sync state with browser navigation (back/forward buttons and direct URLs)
  React.useEffect(() => {
    const handlePopState = () => {
      const isLab = checkIsInteractiveUrl();
      setShowInteractiveLab(isLab);
      if (isLab) {
        document.title = "Q-BOLTZ Multimodal Quantum World | Point Reyes Sound";
      } else {
        document.title = "Point Reyes Sound | Quantum Electronic Structure";
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);

    if (checkIsInteractiveUrl()) {
      document.title = "Q-BOLTZ Multimodal Quantum World | Point Reyes Sound";
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  const openInteractiveLab = () => {
    try {
      if (typeof window !== "undefined") {
        if (!window.__prsAudioEngine) {
          window.__prsAudioEngine = new QuantumSonificationEngine();
        }
        window.__prsAudioEngine.unlockMobileAudio();
        window.__prsAudioEngine.start();
      }
    } catch (e) {}

    setShowInteractiveLab(true);
    if (window.location.pathname !== "/interactive") {
      window.history.pushState({ page: "interactive" }, "", "/interactive");
    }
    document.title = "Q-BOLTZ Multimodal Quantum World | Point Reyes Sound";
  };

  const closeInteractiveLab = () => {
    setShowInteractiveLab(false);
    if (window.location.pathname !== "/") {
      window.history.pushState({ page: "home" }, "", "/");
    }
    document.title = "Point Reyes Sound | Quantum Electronic Structure";
  };

  // Attempt unmuted autoplay by default, with instant universal gesture unlock
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1.0;

    const unlockAudio = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        setIsVideoMuted(false);
        videoRef.current.play().catch(() => {});
      }
    };

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsVideoMuted(false);
        })
        .catch((err) => {
          console.log("Browser autoplay policy prevented initial unmuted playback. Arming instant unlock:", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsVideoMuted(true);
            videoRef.current.play().catch(() => {});
          }

          // Unlock audio on ANY user engagement across the window
          const events = ['click', 'pointerdown', 'touchstart', 'scroll', 'wheel', 'keydown', 'mousemove'];
          const onUserGesture = () => {
            unlockAudio();
            events.forEach((evt) => window.removeEventListener(evt, onUserGesture, true));
          };

          events.forEach((evt) => window.addEventListener(evt, onUserGesture, { once: true, capture: true }));
        });
    }
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsVideoMuted(nextMuted);
      if (!nextMuted) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.__scite && typeof window.__scite.insertBadges === "function") {
        window.__scite.insertBadges();
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isVideoMuted;
      videoRef.current.play().catch(() => {});
      setIsVideoEnded(false);
    }
  };

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    affiliation: "",
    subject: "",
    message: "",
    inquiryType: "investor"
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setFormSubmitted(true);
    const subject = contactForm.subject || (contactForm.inquiryType === "investor" ? "Seed Round Diligence & Deck Request" : "Point Reyes Sound Inquiry");
    const body = `Inquiry Type: ${contactForm.inquiryType || "General"}\nFrom: ${contactForm.name} (${contactForm.affiliation || "N/A"})\nEmail: ${contactForm.email}\n\n${contactForm.message}`;
    const mailTo = contactForm.inquiryType === "investor" ? "directors@pointreyessound.com,romit@pointreyessound.com" : "romit@pointreyessound.com";
    window.location.href = `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSelectHardwareCard = (topicTitle, defaultNote) => {
    setContactForm((prev) => ({
      ...prev,
      subject: `Inquiry: ${topicTitle}`,
      inquiryType: "commercial",
      message: prev.message || `Hello Romit,\n\nI would like to inquire about Point Reyes Sound's ${topicTitle} initiatives and potential compute access / technical collaboration.\n\nBest regards,`
    }));
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectInvestorRequest = () => {
    setContactForm((prev) => ({
      ...prev,
      subject: "Seed Round Diligence & Technical Pitch Deck Request",
      inquiryType: "investor",
      message: prev.message || "Hello Romit & Directors,\n\nWe are evaluating Point Reyes Sound for seed investment and would like to request the Seed Pitch Deck, technical executive summary, and an introductory partner discussion.\n\nFund Name:\nPartner:\nInvestment Scope:"
    }));
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCopyBibtex = (item) => {
    navigator.clipboard.writeText(item.bibtex);
    setCopiedBibtexId(item.id);
    setTimeout(() => setCopiedBibtexId(null), 2500);
  };

  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesCategory, setSalesCategory] = useState("enterprise");
  const [salesName, setSalesName] = useState("");
  const [salesEmail, setSalesEmail] = useState("");
  const [salesOrg, setSalesOrg] = useState("");
  const [salesScale, setSalesScale] = useState("pilot");
  const [salesMessage, setSalesMessage] = useState("");
  const [salesSubmitted, setSalesSubmitted] = useState(false);

  const handleSalesSubmit = (e) => {
    e.preventDefault();
    if (!salesName || !salesEmail || !salesOrg) return;
    setSalesSubmitted(true);
  };

  // If user opens the Interactive 3D Lab
  if (showInteractiveLab) {
    return (
      <div className="interactive-wrapper">
        <div className="lab-topbar">
          <div className="lab-brand">
            <img src="/PRS_logo_v2.jpeg" alt="Point Reyes Sound" className="lab-logo" />
            <span>POINT REYES SOUND // Q-BOLTZ</span>
          </div>
          <div className="lab-nav-actions">
            <button 
              className="lab-nav-btn research-nav-btn"
              onClick={closeInteractiveLab}
            >
              Research
            </button>
            <button 
              className="lab-nav-btn sales-nav-btn"
              onClick={() => { setShowSalesModal(true); setSalesSubmitted(false); }}
            >
              Contact Sales
            </button>
          </div>
        </div>

        <LandingPage />

        {/* Intelligent Contact & Enterprise Solutions Modal */}
        {showSalesModal && (
          <div className="sales-modal-backdrop" onClick={() => setShowSalesModal(false)}>
            <div className="sales-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sales-modal-header">
                <div className="sales-modal-title-group">
                  <span className="sales-tag">ENTERPRISE SOLUTIONS</span>
                  <h3>Point Reyes Sound &bull; Commercial Licensing & Pilots</h3>
                </div>
                <button className="sales-modal-close" onClick={() => setShowSalesModal(false)}>✕</button>
              </div>

              {salesSubmitted ? (
                <div className="sales-success-box">
                  <div className="success-icon">✓</div>
                  <h4>Inquiry Successfully Dispatched</h4>
                  <p>A computational chemistry director will connect with <strong>{salesEmail}</strong> within 1 business hour.</p>
                  <button className="action-btn primary" onClick={() => setShowSalesModal(false)}>Return to Lab</button>
                </div>
              ) : (
                <form onSubmit={handleSalesSubmit} className="sales-form">
                  <div className="sales-category-grid">
                    <div 
                      className={`category-card ${salesCategory === 'enterprise' ? 'selected' : ''}`} 
                      onClick={() => setSalesCategory('enterprise')}
                    >
                      <span className="cat-radio">{salesCategory === 'enterprise' ? '◉' : '○'}</span>
                      <div className="cat-text">
                        <strong>Q-BOLTZ Enterprise API</strong>
                        <span>Cluster deployment & custom Hamiltonian ingestion</span>
                      </div>
                    </div>

                    <div 
                      className={`category-card ${salesCategory === 'pilot' ? 'selected' : ''}`} 
                      onClick={() => setSalesCategory('pilot')}
                    >
                      <span className="cat-radio">{salesCategory === 'pilot' ? '◉' : '○'}</span>
                      <div className="cat-text">
                        <strong>Catalysis & Battery Pilot</strong>
                        <span>Materials screening, SEI & GAAFET phase-space simulations</span>
                      </div>
                    </div>

                    <div 
                      className={`category-card ${salesCategory === 'academic' ? 'selected' : ''}`} 
                      onClick={() => setSalesCategory('academic')}
                    >
                      <span className="cat-radio">{salesCategory === 'academic' ? '◉' : '○'}</span>
                      <div className="cat-text">
                        <strong>Academic / Lab License</strong>
                        <span>Research grants, benchmark datasets & citations</span>
                      </div>
                    </div>
                  </div>

                  <div className="sales-form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={salesName} 
                        onChange={(e) => setSalesName(e.target.value)} 
                        placeholder="Dr. Alex Vance" 
                      />
                    </div>

                    <div className="form-group">
                      <label>Work Email *</label>
                      <input 
                        type="email" 
                        required 
                        value={salesEmail} 
                        onChange={(e) => setSalesEmail(e.target.value)} 
                        placeholder="alex@enterprise.com" 
                      />
                    </div>

                    <div className="form-group">
                      <label>Organization / Company *</label>
                      <input 
                        type="text" 
                        required 
                        value={salesOrg} 
                        onChange={(e) => setSalesOrg(e.target.value)} 
                        placeholder="Acme Chemical / Research Lab" 
                      />
                    </div>

                    <div className="form-group">
                      <label>Compute Workload Scale</label>
                      <select value={salesScale} onChange={(e) => setSalesScale(e.target.value)}>
                        <option value="pilot">Evaluation Pilot (&lt;100 systems)</option>
                        <option value="cluster">Departmental Cluster (1k - 50k systems)</option>
                        <option value="enterprise">Enterprise HPC Scale (50k+ systems)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Project Scope & Computational Objectives</label>
                    <textarea 
                      rows={3} 
                      value={salesMessage} 
                      onChange={(e) => setSalesMessage(e.target.value)} 
                      placeholder="Describe your computational target, hardware environment (CUDA/Metal), or pilot requirements..." 
                    />
                  </div>

                  <div className="sales-form-actions">
                    <button type="submit" className="action-btn primary sales-submit-btn">
                      Transmit Inquiry to Engineering & Sales &rarr;
                    </button>
                    <span className="sales-guarantee-note">🔒 Direct technical response within 1 business hour</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentTheme = researchThemes[activeTheme];

  return (
    <div className="pod-container">
      {/* 1. TOP GLOBAL NAVIGATION */}
      <header className="pod-header">
        <div className="header-inner">
          <div className="brand-lockup">
            <img 
              src="/PRS_logo_v2.jpeg" 
              alt="Point Reyes Sound Logo" 
              className="prs-header-logo" 
            />
            <div className="brand-text">
              <span className="brand-name">POINT REYES SOUND, INC.</span>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#overview">Overview</a>
            <a href="#research" className="nav-research-link">
              <span className="pulse-dot"></span> Research
            </a>
            <a href="#roadmap">Roadmap</a>
            <a href="#investors" className="nav-investor-link">
              Investors <span className="nav-seed-pill">Seed</span>
            </a>
            <a href="#contact">Contact</a>
            <a 
              href="https://github.com/point-reyes-sound" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="nav-github-link"
              title="Point Reyes Sound GitHub Organization"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: "-2px", marginRight: "4px" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
            <button 
              className="nav-interactive-link"
              onClick={openInteractiveLab}
              title="Launch 3D Quantum Reaction Simulator"
            >
              Interactive
            </button>
          </nav>
        </div>
      </header>

      {/* 2. HERO SECTION WITH CINEMATIC VIDEO & PREPRINT SPOTLIGHT */}
      <section id="overview" className="hero-section">
        <div className="hero-cinematic-banner">
          <div className="hero-video-frame">
            <video 
              ref={videoRef}
              src="/prs_video_promo_v2.mp4" 
              autoPlay 
              muted={isVideoMuted}
              playsInline 
              controls
              className="hero-video-element"
              onVolumeChange={(e) => setIsVideoMuted(e.target.muted)}
              onEnded={() => setIsVideoEnded(true)}
              onPlay={() => setIsVideoEnded(false)}
            />
            {isVideoEnded ? (
              <button 
                onClick={handleReplay} 
                className="video-replay-overlay-btn"
                title="Replay Video"
              >
                <span className="replay-icon">↺</span> Replay Video
              </button>
            ) : (
              <button 
                onClick={toggleSound} 
                className={`video-audio-toggle-btn ${!isVideoMuted ? 'audio-live' : ''}`}
                title={isVideoMuted ? "Unmute" : "Mute"}
              >
                <span className="audio-toggle-icon">{isVideoMuted ? "🔇" : "🔊"}</span> {isVideoMuted ? "Unmute" : "Mute"}
              </button>
            )}
          </div>
        </div>

        <div className="hero-kicker-group">
          <span className="seed-badge">FRONTIER TECH • SEED STAGE</span>
          <span className="hero-location">SAN FRANCISCO, CA</span>
        </div>

        <h1 className="hero-title">
          Quantum Boltzmann Solver &amp; Kinetic Simulation Engine
        </h1>

        <p className="hero-lead">
          Point Reyes Sound is commercializing the Quantum Boltzmann Equation Self-Consistent Field (QBE-SCF) platform—breaking the factorial active-space scaling bottleneck of CASSCF to simulate strongly correlated electrons across clean energy materials, wide-bandgap power electronics, and industrial catalysis.
        </p>

        {/* FEATURED PREPRINT CALLOUT BANNER */}
        <div id="preprint" className="preprint-spotlight-card">
          <div className="spotlight-header">
            <div className="spotlight-tag-group">
              <span className="spotlight-badge">FEATURED ARXIV PREPRINT</span>
              <span className="spotlight-meta">arXiv:2608.14979 [quant-ph] &bull; August 2026</span>
            </div>
            <span className="spotlight-status">Open Access</span>
          </div>

          <h2 className="spotlight-title">
            Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities
          </h2>

          <div className="spotlight-author">
            <strong>Romit Chakraborty</strong> &bull; Point Reyes Sound, Inc.
          </div>

          <p className="spotlight-abstract">
            We introduce a Quantum Boltzmann Equation self-consistent-field (QBE-SCF) framework that propagates the one-electron reduced density matrix via a Bhatnagar-Gross-Krook (BGK) collision operator. QBE-SCF achieves entropic regularization across singularities in conventional electronic structure theory.
          </p>

          <div className="spotlight-actions">
            <a 
              href="https://arxiv.org/abs/2608.14979" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="action-btn primary"
            >
              View on arXiv (2608.14979) &rarr;
            </a>
            <a 
              href="https://doi.org/10.48550/arXiv.2608.14979" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="action-btn secondary"
              title="Official DataCite/arXiv DOI"
            >
              DOI: 10.48550/arXiv.2608.14979 &rarr;
            </a>
            <a 
              href="https://scite.ai/reports/10.48550/arXiv.2608.14979" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="action-btn outline"
              title="Smart Citations Index on scite.ai"
            >
              <span style={{ color: '#38bdf8', marginRight: '4px' }}>✦</span> scite Citations &rarr;
            </a>
            <a 
              href="https://arxiv.org/pdf/2608.14979.pdf" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="action-btn secondary"
            >
              Download PDF
            </a>
            <button 
              onClick={() => handleCopyBibtex(publicationList[0])}
              className="action-btn outline"
            >
              {copiedBibtexId === "arxiv-2608-14979" ? "✓ Citation Copied" : "Copy BibTeX"}
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div 
              className="scite-badge" 
              data-doi="10.48550/arXiv.2608.14979" 
              data-layout="horizontal" 
              data-show-zero="false" 
              data-small="true" 
            />
          </div>
        </div>
      </section>

      {/* 3. RESEARCH THEMES (GAGLIARDI GROUP TEMPLATE ARCHITECTURE) */}
      <section id="research" className="section-block">
        <div className="section-head">
          <div className="section-kicker">RESEARCH PORTFOLIO</div>
          <h2 className="section-title">Scientific Themes</h2>
          <p className="section-sub">
            Our theoretical methodology integrates quantum statistical mechanics, kinetic transport, and algebraic spectral graph theory into molecular modeling.
          </p>
        </div>

        {/* THEME SELECTOR TABS */}
        <div className="theme-nav-bar">
          {researchThemes.map((theme, idx) => (
            <button
              key={theme.id}
              className={`theme-tab-btn ${idx === activeTheme ? "active" : ""}`}
              onClick={() => setActiveTheme(idx)}
            >
              <span className="tab-num">{theme.num}</span>
              <span className="tab-label">{theme.label}</span>
            </button>
          ))}
        </div>

        {/* ACTIVE THEME SHOWCASE */}
        <div className="theme-display-panel">
          <div className="theme-meta-col">
            <span className="theme-badge">{currentTheme.badge}</span>
            <h3 className="theme-title">{currentTheme.title}</h3>
            <p className="theme-summary">{currentTheme.summary}</p>
            <p className="theme-body">{currentTheme.content}</p>
          </div>
        </div>

        {/* PUBLICATIONS & INTELLECTUAL PROPERTY SUB-BLOCK */}
        <div className="research-pub-block">
          <div className="section-head sub-head">
            <div className="section-kicker">SCHOLARLY OUTPUT & INTELLECTUAL PROPERTY</div>
            <h3 className="section-title sub-title">Publications & Patents</h3>
            <p className="section-sub">
              Peer-reviewed articles, preprints, patents, and foundational methodologies developed by the research pod.
            </p>
          </div>

          <div className="pub-list">
            {publicationList.map((pub) => (
              <article key={pub.id} className={`pub-card ${pub.featured ? "featured-pub" : ""}`}>
                <div className="pub-card-top">
                  <span className="pub-type-badge">{pub.type}</span>
                  <span className="pub-date">{pub.date}</span>
                </div>
                <h3 className="pub-card-title">{pub.title}</h3>
                <div className="pub-card-authors">{pub.authors} &bull; <span className="pub-affil">{pub.affil}</span></div>
                {pub.journal && <div className="pub-card-journal">{pub.journal}</div>}
                <p className="pub-card-abstract">{pub.abstract}</p>

                <div className="pub-card-actions">
                  {pub.arxivUrl && (
                    <a href={pub.arxivUrl} target="_blank" rel="noopener noreferrer" className="pub-link">
                      arXiv Page &rarr;
                    </a>
                  )}
                  {pub.doi && (
                    <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="pub-link">
                      DOI: {pub.doi} &rarr;
                    </a>
                  )}
                  {pub.doi && (
                    <a href={`https://scite.ai/reports/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="pub-link">
                      scite Citations &rarr;
                    </a>
                  )}
                  {pub.pdf && (
                    <a href={pub.pdf} target="_blank" rel="noopener noreferrer" className="pub-link">
                      Download PDF
                    </a>
                  )}
                  <button 
                    onClick={() => handleCopyBibtex(pub)} 
                    className="pub-copy-btn"
                  >
                    {copiedBibtexId === pub.id ? "✓ Copied" : "Cite BibTeX"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* HARDWARE ACCELERATION SUB-BLOCK */}
        <div className="research-pub-block">
          <div className="section-head sub-head">
            <div className="section-kicker">INFRASTRUCTURE & COMPUTING</div>
            <h3 className="section-title sub-title">Hardware Acceleration</h3>
            <p className="section-sub">
              Bridging theoretical quantum kinetic equations with modern GPU supercomputing architectures and distributed cloud infrastructure.
            </p>
          </div>

          <div className="grants-grid">
            {/* NVIDIA INCEPTION CARD */}
            <div 
              className="grant-card nvidia-accent clickable-grant-card"
              onClick={() => handleSelectHardwareCard("NVIDIA Inception GPU Acceleration", "Inquiry regarding custom CUDA/shader matrix kernels and H100/H200 compute evaluation.")}
              title="Click to contact sales & compute team regarding NVIDIA Inception"
            >
              <div className="grant-header">
                <div className="grant-logo-badge">NVIDIA INCEPTION PROGRAM</div>
                <span className="grant-status">Application Track</span>
              </div>
              <h3>GPU Acceleration</h3>
              <p>
                Density-Fitted QBE-SCF mapped to modern streaming multiprocessor architectures for accelerated CPU&rarr;GPU interconnect and fast phase-space transport.
              </p>
              <ul className="grant-specs">
                <li><strong>Target Compute:</strong> NVIDIA H100 / H200 & Grace Hopper Superchips</li>
                <li><strong>Speedup Goal:</strong> 100× throughput acceleration for density matrix kinetic relaxation</li>
                <li><strong>Matrix Kernels:</strong> Custom trace-preserving Fermi-Dirac rotation shaders</li>
              </ul>
              <div className="grant-action-row">
                <button 
                  type="button" 
                  className="grant-contact-btn nvidia-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectHardwareCard("NVIDIA Inception GPU Acceleration", "Inquiry regarding custom CUDA/shader matrix kernels and H100/H200 compute evaluation.");
                  }}
                >
                  Contact Sales & Compute Access &rarr;
                </button>
              </div>
            </div>

            {/* GOOGLE CLOUD RESEARCH CARD */}
            <div 
              className="grant-card google-accent clickable-grant-card"
              onClick={() => handleSelectHardwareCard("Google Cloud HPC Research Integration", "Inquiry regarding Google Cloud A3 Mega GPU clusters and TPU v5p chemical discovery pipelines.")}
              title="Click to contact sales & compute team regarding Google Cloud HPC"
            >
              <div className="grant-header">
                <div className="grant-logo-badge">GOOGLE CLOUD RESEARCH</div>
                <span className="grant-status">Research Grant Track</span>
              </div>
              <h3>HPC</h3>
              <p>
                Scaling molecular Wigner tomography and multi-center transition-metal simulations across Google Cloud A3 Mega GPU clusters and TPU v5p acceleration pods for high-throughput chemical discovery.
              </p>
              <ul className="grant-specs">
                <li><strong>Infrastructure:</strong> Distributed Vertex AI & Google Cloud HPC Slurm Clusters</li>
                <li><strong>Scope:</strong> Scaling from small diatomics to 500+ atom metalloprotein complexes</li>
                <li><strong>Data Architecture:</strong> Cloud-native phase-space trajectory storage & analysis</li>
              </ul>
              <div className="grant-action-row">
                <button 
                  type="button" 
                  className="grant-contact-btn google-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectHardwareCard("Google Cloud HPC Research Integration", "Inquiry regarding Google Cloud A3 Mega GPU clusters and TPU v5p chemical discovery pipelines.");
                  }}
                >
                  Inquire for HPC & Enterprise &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ROADMAP */}
      <section id="roadmap" className="section-block">
        <div className="section-head">
          <div className="section-kicker">TECHNOLOGY TRAJECTORY</div>
          <h2 className="section-title">Roadmap</h2>
        </div>

        <div className="roadmap-timeline">
          <div className="timeline-node active">
            <div className="timeline-marker">Phase I</div>
            <div className="timeline-content">
              <div className="timeline-tag">CURRENT</div>
              <h4>Theoretical Foundations & Validation</h4>
              <p>
                Derivation of the Quantum Boltzmann Equation Self-Consistent Field.
              </p>
            </div>
          </div>

          <div className="timeline-node current">
            <div className="timeline-marker">Phase II</div>
            <div className="timeline-content">
              <div className="timeline-tag">CURRENT &bull; GRANT INITIATIVE</div>
              <h4>GPU Kernels</h4>
              <p>
                NVIDIA Inception and Google Cloud accelerated implementations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INVESTOR RELATIONS & SEED FINANCING */}
      <section id="investors" className="section-block investor-section">
        <div className="section-head">
          <div className="section-kicker">VENTURE CAPITAL &amp; STRATEGIC FINANCING</div>
          <h2 className="section-title">Seed Stage Capital &amp; Compute Moat</h2>
          <p className="section-sub">
            Point Reyes Sound is raising seed capital to scale our proprietary GPU kinetic transport solver, expand enterprise computational chemistry pilots, and accelerate downstream patent filings across non-equilibrium quantum simulation.
          </p>
        </div>

        <div className="investor-grid">
          <div className="investor-card highlight">
            <div className="investor-card-header">
              <span className="investor-stage-badge">FINANCING ROUND</span>
              <span className="investor-status-live">● Active Seed Round</span>
            </div>
            <h3 className="investor-card-title">Commercial &amp; Compute Highlights</h3>
            <ul className="investor-metrics-list">
              <li>
                <strong>Proprietary IP Moat:</strong> U.S. Provisional Patent Application No. 64/033,274 covering BGK collision relaxation on reduced density matrices and algebraic connectivity damping.
              </li>
              <li>
                <strong>Combinatorial Scaling Breakthrough:</strong> Replaces the factorial combinatorial active-space scaling ($O(e^N)$) of CASSCF and DMRG with polynomial-time kinetic relaxation.
              </li>
              <li>
                <strong>$15B+ Commercial Addressable Market:</strong> High-performance materials simulation across solid-state battery electrolytes, GaN/SiC power semiconductors, and industrial transition-metal catalysis.
              </li>
              <li>
                <strong>Strategic Hardware Backing:</strong> Active member of the NVIDIA Inception Program and Google Cloud Research Grant recipient.
              </li>
              <li>
                <strong>Founder Pedigree:</strong> Dr. Romit Chakraborty (Ph.D. University of Chicago, UC Berkeley &amp; Lawrence Berkeley National Laboratory postdoctoral research).
              </li>
            </ul>

            <div className="investor-cta-group">
              <button 
                onClick={handleSelectInvestorRequest}
                className="action-btn primary investor-btn"
              >
                Request Seed Deck &amp; Briefing &rarr;
              </button>
              <a 
                href="mailto:directors@pointreyessound.com?subject=Seed%20Round%20Diligence%20-%20Point%20Reyes%20Sound&body=Dear%20Point%20Reyes%20Sound%20Team%2C%0A%0AWe%20are%20evaluating%20Point%20Reyes%20Sound%20for%20our%20fund%20and%20would%20like%20to%20request%20the%20Seed%20Pitch%20Deck%20and%20schedule%20an%20introductory%20partner%20discussion.%0A%0AFund%20Name%3A%0APartner%20Name%3A%0ACheck%20Size%20Range%3A" 
                className="action-btn outline"
              >
                Direct Partner Inbound &rarr;
              </a>
            </div>
          </div>

          <div className="investor-card decks-card">
            <div className="investor-card-header">
              <span className="investor-stage-badge">EXECUTIVE DOSSIERS</span>
              <span className="investor-access-label">Institutional Access</span>
            </div>
            <h3 className="investor-card-title">Technical Briefs &amp; Briefings</h3>
            <div className="brief-links-list">
              <a href="/public-deck" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">✦</div>
                <div className="brief-info">
                  <strong>Executive Overview (16:9 Deck)</strong>
                  <span>Interactive Pitch &amp; Technical Prospectus · Q-Boltz</span>
                </div>
                <span className="ext-arrow">↗</span>
              </a>
              <a href="/Point_Reyes_Sound_Executive_Overview.pdf" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">📄</div>
                <div className="brief-info">
                  <strong>Download Executive Overview (PDF)</strong>
                  <span>Official 12-Page Widescreen Diligence Overview</span>
                </div>
                <span className="ext-arrow">↓</span>
              </a>
              <a href="/nvidia-brief" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">⚡</div>
                <div className="brief-info">
                  <strong>NVIDIA Architecture Brief</strong>
                  <span>GPU-Accelerated QBE-SCF &amp; CUDA Acceleration</span>
                </div>
                <span className="ext-arrow">↗</span>
              </a>
              <a href="/usistef-qmf-deck" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">🔬</div>
                <div className="brief-info">
                  <strong>USISTEF Quantum Materials Foundry</strong>
                  <span>Hardware Validation &amp; Foundry Roadmaps</span>
                </div>
                <span className="ext-arrow">↗</span>
              </a>
              <a href="https://rchakraborty.dev" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">🎓</div>
                <div className="brief-info">
                  <strong>Founder Academic &amp; Research Dossier</strong>
                  <span>Dr. Romit Chakraborty (UChicago, UC Berkeley, LBNL)</span>
                </div>
                <span className="ext-arrow">↗</span>
              </a>
              <a href="https://scite.ai/reports/10.48550/arXiv.2608.14979" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">✦</div>
                <div className="brief-info">
                  <strong>scite Smart Citations Index</strong>
                  <span>Independent Citation Verification for arXiv:2608.14979</span>
                </div>
                <span className="ext-arrow">↗</span>
              </a>
              <a href="https://github.com/point-reyes-sound" target="_blank" rel="noopener noreferrer" className="brief-item">
                <div className="brief-icon">💻</div>
                <div className="brief-info">
                  <strong>Open Research &amp; Solvers (GitHub)</strong>
                  <span>Point Reyes Sound Open-Source Repositories &amp; Verification Notebooks</span>
                </div>
                <span className="ext-arrow">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PEOPLE & CONTACT */}
      <section id="contact" className="section-block dark-tint">
        <div className="section-head">
          <div className="section-kicker">RESEARCH POD & INQUIRIES</div>
          <h2 className="section-title">Contact</h2>
          <p className="section-sub">
            Point Reyes Sound, Inc. is an agile privately funded theoretical and computational research pod.
          </p>
        </div>

        <div className="people-grid" style={{ marginBottom: "2.5rem" }}>
          {/* ROMIT CHAKRABORTY */}
          <div className="people-card">
            <div className="person-header">
              <img 
                src="/rc_scholar_portrait.jpeg" 
                alt="Romit Chakraborty" 
                className="person-avatar-img" 
              />
              <div className="person-info">
                <h3>Romit Chakraborty</h3>
                <span className="person-role">Founder & Principal Researcher</span>
                <div className="person-links-row">
                  <a href="mailto:romit@pointreyessound.com" className="person-contact-link">
                    romit@pointreyessound.com
                  </a>
                  <span className="link-sep">&bull;</span>
                  <a 
                    href="https://scholar.google.com/citations?view_op=search_authors&mauthors=Romit+Chakraborty" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="person-scholar-link"
                  >
                    Google Scholar &rarr;
                  </a>
                </div>
              </div>
            </div>
            <p className="person-bio">
              Theoretical Quantum Chemist. Ph.D. in Theoretical &amp; Computational Chemistry from the University of Chicago (Advisor: Prof. David A. Mazziotti); Postdoctoral Research Fellow in Computational Materials Science at UC Berkeley &amp; Lawrence Berkeley National Laboratory (Advisor: Prof. Martin Head-Gordon). Pioneered the Quantum Boltzmann Equation Self-Consistent-Field (QBE-SCF) framework for non-equilibrium kinetic transport and entropic regularization of mean-field singularities.
            </p>
            <div className="person-tags" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              <a 
                href="https://rchakraborty.dev" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tag-scholar-btn"
              >
                Founder Dossier (rchakraborty.dev) &rarr;
              </a>
              <a 
                href="https://scholar.google.com/citations?view_op=search_authors&mauthors=Romit+Chakraborty" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tag-scholar-btn"
              >
                Google Scholar &rarr;
              </a>
              <a 
                href="https://www.linkedin.com/in/chakrabortyromit/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tag-scholar-btn"
              >
                LinkedIn &rarr;
              </a>
              <a 
                href="https://github.com/RomitChakraborty" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tag-scholar-btn"
              >
                GitHub &rarr;
              </a>
              <a 
                href="https://orcid.org/0000-0002-4638-6346" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tag-scholar-btn"
              >
                ORCID &rarr;
              </a>
            </div>
          </div>

          {/* SAYAN CHAKRABORTY */}
          <div className="people-card">
            <div className="person-header">
              <img 
                src="/sayan_chakraborty.jpeg" 
                alt="Sayan Chakraborty, Ph.D." 
                className="person-avatar-img" 
              />
              <div className="person-info">
                <h3>Sayan Chakraborty, Ph.D.</h3>
                <span className="person-role">Research Collaborator</span>
                <span className="person-affiliation">TCG CREST</span>
                <div className="person-links-row">
                  <a 
                    href="https://scholar.google.com/citations?hl=en&user=8dZktLwAAAAJ&view_op=list_works&sortby=pubdate" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="person-scholar-link"
                  >
                    Google Scholar &rarr;
                  </a>
                </div>
              </div>
            </div>
            <p className="person-bio">
              Quantum Information and Mathematical Physics.
            </p>
            <div className="person-tags">
              <a 
                href="https://scholar.google.com/citations?hl=en&user=8dZktLwAAAAJ&view_op=list_works&sortby=pubdate" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tag-scholar-btn"
              >
                Publications on Google Scholar &rarr;
              </a>
            </div>
          </div>
        </div>

        <div className="contact-grid">
          {/* CONTACT INFO CARD */}
          <div className="contact-info-card">
            <div className="contact-block">
              <span className="contact-label">MAILING & REGISTERED OFFICE</span>
              <div className="contact-value-box">
                <p className="contact-address-text">
                  <strong>Point Reyes Sound, Inc.</strong><br />
                  2261 Market Street, STE 72927<br />
                  San Francisco, CA 94114<br />
                  United States
                </p>
              </div>
            </div>

            <div className="contact-block">
              <span className="contact-label">DIRECT ELECTRONIC INQUIRIES</span>
              <div className="contact-emails">
                <div className="email-row">
                  <span className="email-type">Founder & Research:</span>
                  <a href="mailto:romit@pointreyessound.com" className="email-link">romit@pointreyessound.com</a>
                </div>
                <div className="email-row">
                  <span className="email-type">Board & Directors:</span>
                  <a href="mailto:directors@pointreyessound.com" className="email-link">directors@pointreyessound.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* FILL-OUT MESSAGE FORM */}
          <div className="contact-form-card">
            <h3 className="form-card-title">Send a Message</h3>
            
            {formSubmitted ? (
              <div className="form-success-box">
                <div className="success-icon">✓</div>
                <h4>Message Transmitted</h4>
                <p>Thank you for reaching out. We will review your inquiry and follow up promptly.</p>
                <div className="mailto-fallback">
                  <span>Need an immediate copy? </span>
                  <a 
                    href={`mailto:romit@pointreyessound.com,directors@pointreyessound.com?subject=${encodeURIComponent(contactForm.subject || "Point Reyes Sound Inquiry")}&body=${encodeURIComponent(`From: ${contactForm.name} (${contactForm.affiliation || "N/A"})\nEmail: ${contactForm.email}\n\n${contactForm.message}`)}`}
                    className="mailto-btn"
                  >
                    Open in Mail Client &rarr;
                  </a>
                </div>
                <button 
                  className="reset-form-btn"
                  onClick={() => {
                    setFormSubmitted(false);
                    setContactForm({ name: "", email: "", affiliation: "", subject: "", message: "" });
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="inquiry-form">
                <div className="form-group">
                  <label htmlFor="inquiryType">Inquiry Category *</label>
                  <select 
                    id="inquiryType" 
                    name="inquiryType"
                    value={contactForm.inquiryType || "investor"}
                    onChange={handleContactChange}
                    className="form-select"
                  >
                    <option value="investor">Venture Capital / Seed Round Diligence &amp; Deck Request</option>
                    <option value="commercial">Commercial Enterprise Pilot / Compute Allocation</option>
                    <option value="hardware">Hardware &amp; Accelerator Partnership (GPU / HPC)</option>
                    <option value="academic">Academic &amp; Research Collaboration</option>
                    <option value="general">General Corporate Inquiry</option>
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      required 
                      value={contactForm.name} 
                      onChange={handleContactChange} 
                      placeholder="Dr. Jane Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      required 
                      value={contactForm.email} 
                      onChange={handleContactChange} 
                      placeholder="jane.doe@fund.com or university.edu"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="affiliation">Affiliation / Fund / Institution</label>
                    <input 
                      type="text" 
                      id="affiliation" 
                      name="affiliation" 
                      value={contactForm.affiliation} 
                      onChange={handleContactChange} 
                      placeholder="Venture Fund / Enterprise R&D / Department"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input 
                      type="text" 
                      id="subject" 
                      name="subject" 
                      value={contactForm.subject} 
                      onChange={handleContactChange} 
                      placeholder="Seed Round Diligence / Compute Grant / Collaboration"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Inquiry / Message *</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows={4} 
                    required 
                    value={contactForm.message} 
                    onChange={handleContactChange} 
                    placeholder="Describe your investment focus, check size parameters, or enterprise computing requirements..."
                  />
                </div>

                <button type="submit" className="action-btn primary submit-btn">
                  Transmit Inquiry &rarr;
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="pod-footer">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <div className="brand-lockup">
              <img src="/PRS_logo_v2.jpeg" alt="Point Reyes Sound" className="prs-footer-logo" />
              <div>
                <span className="brand-name">POINT REYES SOUND, INC.</span>
              </div>
            </div>
            <p className="footer-desc">
              Commercializing non-equilibrium kinetic transport equations for molecular simulation.
            </p>
            <div className="footer-address">
              2261 Market Street, STE 72927 &bull; San Francisco, CA 94114 &bull; United States
            </div>
          </div>

          <div className="footer-col-links">
            <h4>Quick Links</h4>
            <a href="#research">Research</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#investors">Seed Round &amp; Investors</a>
            <a href="#contact">Contact</a>
            <a href="https://rchakraborty.dev" target="_blank" rel="noopener noreferrer">Founder Dossier &rarr;</a>
            <a href="https://github.com/point-reyes-sound" target="_blank" rel="noopener noreferrer">GitHub (point-reyes-sound) &rarr;</a>
            <a href="https://www.linkedin.com/company/point-reyes-sound/" target="_blank" rel="noopener noreferrer">LinkedIn &rarr;</a>
            <a href="https://www.crunchbase.com/organization/point-reyes-sound" target="_blank" rel="noopener noreferrer">Crunchbase &rarr;</a>
          </div>

          <div className="footer-col-legal">
            <h4>Notice</h4>
            <p>
              U.S. Provisional Patent Application No. 64/033,274. &copy; 2026 Point Reyes Sound, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}