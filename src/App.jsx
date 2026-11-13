import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import LandingPage from "./LandingPage";
import MolecularOrbitalWorkstation from "./components/MolecularOrbitalWorkstation";
import QBoltzAgentConsole from "./components/QBoltzAgentConsole";
import QBeckStaticCorrelationShowcase from "./components/QBeckStaticCorrelationShowcase";
import PreprintSpotlight from "./PreprintSpotlight";
import { QuantumSonificationEngine } from "./physics/QuantumSonificationEngine";
import PointReyesSound3DBackground from "./PointReyesSound3DBackground";

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
    id: "arxiv-2611-17245",
    type: "Lead Preprint",
    title: "Quantum Boltzmann Equation for Static Correlation with Cumulant Kernel Closure",
    authors: "Romit Chakraborty",
    affil: "Point Reyes Sound, Inc.",
    journal: "arXiv:2611.17245 [physics.chem-ph, quant-ph]",
    date: "November 2026",
    doi: "10.48550/arXiv.2611.17245",
    doiUrl: "https://doi.org/10.48550/arXiv.2611.17245",
    zenodoDoi: "10.5281/zenodo.24149207",
    zenodoUrl: "https://doi.org/10.5281/zenodo.24149207",
    datasetUrl: "https://github.com/point-reyes-sound/qbeck-static-correlation-data",
    arxivUrl: "https://arxiv.org/abs/2611.17245",
    pdf: "https://arxiv.org/pdf/2611.17245",
    featured: true,
    abstract: "We introduce the Quantum Boltzmann Equation with Cumulant Kernel Closure (Q-BECK), closing the two-particle cumulant directly inside the collision kernel to capture strong static correlation without explicit O(N⁴) two-particle reduced density matrix storage or manual active-space selection. Across 36 benchmark systems up to N_AO = 300 on a single Apple M2 CPU, Q-BECK exhibits empirical O(N^2.981) runtime scaling and bounded O(N²) working memory (12.44–28.88 MB), while resolving benzyne diradical isomer splittings, H₃ Generalized Pauli Constraint polytope trajectories, and N₂ triple-bond dissociation.",
    bibtex: `@article{chakraborty2026qbeck,
  title={Quantum Boltzmann Equation for Static Correlation with Cumulant Kernel Closure},
  author={Chakraborty, Romit},
  journal={arXiv preprint arXiv:2611.17245},
  year={2026},
  doi={10.48550/arXiv.2611.17245},
  url={https://arxiv.org/abs/2611.17245},
  note={Benchmark suite & dataset: Zenodo DOI 10.5281/zenodo.24149207}
}`
  },
  {
    id: "arxiv-2608-14979",
    type: "Preprint",
    title: "Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities",
    authors: "Romit Chakraborty",
    affil: "Point Reyes Sound, Inc.",
    journal: "arXiv:2608.14979 [quant-ph, physics.chem-ph]",
    date: "August 2026",
    doi: "10.48550/arXiv.2608.14979",
    doiUrl: "https://doi.org/10.48550/arXiv.2608.14979",
    zenodoDoi: "10.5281/zenodo.21940451",
    zenodoUrl: "https://doi.org/10.5281/zenodo.21940451",
    datasetUrl: "https://github.com/point-reyes-sound/p1_qbescf",
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
  url={https://arxiv.org/abs/2608.14979},
  note={Benchmark suite & dataset: Zenodo DOI 10.5281/zenodo.21940451}
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

class ConsoleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Q-BOLTZ Console error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "3rem", color: "#f87171", fontFamily: "'JetBrains Mono', monospace", textAlign: "center", background: "#020904", position: "relative", zIndex: 100 }}>
          <h2 style={{ color: "#35ff82" }}>Q-BOLTZ Console Restoring Session...</h2>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#10b981", color: "#000", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            Reload Workstation
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTheme, setActiveTheme] = useState(0);
  const [copiedBibtexId, setCopiedBibtexId] = useState(null);

  // Deep link helper to detect if URL points to Interactive (Q-BOLTZ)
  const getInitialActiveView = () => {
    if (typeof window === "undefined") return "home";
    const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "");
    if (
      path === "/qbeck" ||
      path === "/static-correlation" ||
      hash === "qbeck" ||
      hash === "static-correlation"
    ) {
      return "qbeck";
    }
    if (
      path === "/interactive" ||
      path === "/interactive.html" ||
      path === "/lab" ||
      path === "/lab.html" ||
      path === "/simulator" ||
      path === "/simulator.html" ||
      path === "/qboltz" ||
      path === "/q-boltz" ||
      path === "/demo" ||
      path === "/orbitals" ||
      hash === "interactive" ||
      hash === "lab" ||
      hash === "simulator" ||
      hash === "qboltz" ||
      hash === "q-boltz" ||
      hash === "demo" ||
      hash === "orbitals"
    ) {
      return "interactive";
    }
    return "home";
  };

  const getInitialLabTab = () => {
    if (typeof window === "undefined") return "orbitals";
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes("gas") || hash.includes("gas") || path.includes("simulator")) {
      return "gas";
    }
    return "orbitals";
  };

  const [currentView, setCurrentView] = useState(getInitialActiveView);
  const [labTab, setLabTab] = useState(getInitialLabTab);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [activeCarouselVideo, setActiveCarouselVideo] = useState(null);
  const videoRef = useRef(null);

  const quantumVideoSlides = [
    {
      id: "azure-lattice",
      title: "Quantum Fluctuations in a Lattice",
      subtitle: "5×5 Coherent H₂ Phase-Space Crystal",
      styleFlag: "--azure",
      paletteLabel: "Azure & Crimson",
      thumb16x9: "/media/qva/youtube_thumbnail_lattice_reveal_1080p.png",
      thumb9x16: "/media/qva/THUMB_9x16_6_AZURE_LATTICE.png",
      videoMp4: "/media/qva/SHORT_10S_6_LATTICE_CHERENKOV_CYAN.mp4",
      swatches: ["#2868FF", "#22ECFF", "#FF1458"],
    },
    {
      id: "sovereign-benzene",
      title: "Delocalized Ring Current in Benzene",
      subtitle: "Hexagonal π-Electron Aromatic Vortex",
      styleFlag: "--sovereign",
      paletteLabel: "Sovereign Gold & Ruby",
      thumb16x9: "/media/qva/THUMB_16x9_1_SOVEREIGN.png",
      thumb9x16: "/media/qva/THUMB_9x16_1_SOVEREIGN_BENZENE.png",
      videoMp4: "/media/qva/SHORT_10S_1_BENZENE_SOVEREIGN_GOLD.mp4",
      swatches: ["#E5C158", "#8A6D3B", "#7A1C24"],
    },
    {
      id: "kyoto-graphene",
      title: "Dirac Electrons in a Graphene Lattice",
      subtitle: "Honeycomb Sublattice Phase Resonance",
      styleFlag: "--kyoto",
      paletteLabel: "Kyoto Emerald & Vermilion",
      thumb16x9: "/media/qva/THUMB_16x9_3_KYOTO.png",
      thumb9x16: "/media/qva/THUMB_9x16_2_KYOTO_GRAPHENE.png",
      videoMp4: "/media/qva/SHORT_10S_2_GRAPHENE_KYOTO_EMERALD.mp4",
      swatches: ["#D8E2DC", "#52796F", "#C83E2B"],
    },
    {
      id: "corona-tunneling",
      title: "Quantum Tunneling in a Hydrogen Bond",
      subtitle: "Sub-Barrier Double-Well Wavepacket",
      styleFlag: "--corona",
      paletteLabel: "Solar Corona & Violet",
      thumb16x9: "/media/qva/THUMB_16x9_4_CORONA.png",
      thumb9x16: "/media/qva/THUMB_9x16_3_CORONA_TUNNELING.png",
      videoMp4: "/media/qva/SHORT_10S_3_TUNNELING_SOLAR_CORONA.mp4",
      swatches: ["#FFF3B0", "#E07A2E", "#541675"],
    },
    {
      id: "arctic-covalent",
      title: "Covalent Bond Resonance",
      subtitle: "Zero-Point Bipartite Interference Bridge",
      styleFlag: "--arctic",
      paletteLabel: "Arctic Platinum & Cobalt",
      thumb16x9: "/media/qva/THUMB_16x9_5_ARCTIC.png",
      thumb9x16: "/media/qva/THUMB_9x16_4_ARCTIC_COVALENT.png",
      videoMp4: "/media/qva/SHORT_10S_4_COVALENT_ARCTIC_PLATINUM.mp4",
      swatches: ["#F8FAFC", "#94A3B8", "#1D4ED8"],
    },
    {
      id: "noir-vortex",
      title: "Driven Quantum Dipole Vortex",
      subtitle: "Nonlinear Phase-Space Angular Momentum",
      styleFlag: "--noir",
      paletteLabel: "Monochrome Silver Noir",
      thumb16x9: "/media/qva/THUMB_16x9_6_NOIR.png",
      thumb9x16: "/media/qva/THUMB_9x16_5_NOIR_VORTEX.png",
      videoMp4: "/media/qva/SHORT_10S_5_VORTEX_SILVER_NOIR.mp4",
      swatches: ["#FFFFFF", "#737373", "#1F1F1F"],
    },
  ];

  useEffect(() => {
    if (isCarouselPaused || activeCarouselVideo) return;
    const timer = setInterval(() => {
      setActiveCarouselIdx((prev) => (prev + 1) % quantumVideoSlides.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isCarouselPaused, activeCarouselVideo, quantumVideoSlides.length]);

  const stopAudioIfPlaying = () => {
    try {
      if (typeof window !== "undefined") {
        if (window.__prsAudioEngine) {
          window.__prsAudioEngine.stop();
        }
        window.dispatchEvent(new CustomEvent("prs:stop-audio"));
      }
    } catch {
      // Audio stop fallback
    }
  };

  const openAppView = (tab = "orbitals") => {
    if (tab === "gas") {
      stopAudioIfPlaying();
      if (typeof window !== "undefined") {
        window.location.href = "/film";
      }
      return;
    }

    stopAudioIfPlaying();
    setLabTab("orbitals");
    setCurrentView("interactive");
    const targetPath = "/q-boltz";
    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      window.history.pushState({ page: "interactive", tab: "orbitals" }, "", targetPath);
    }
    if (typeof document !== "undefined") {
      document.title = "Q-BOLTZ // Molecular Orbital Active-Space Workstation | Point Reyes Sound";
    }
  };

  const switchAppTab = (tab) => {
    openAppView(tab);
  };

  const openQBeckView = () => {
    stopAudioIfPlaying();
    setCurrentView("qbeck");
    if (typeof window !== "undefined") {
      window.history.pushState({ page: "qbeck" }, "", "/qbeck");
    }
    if (typeof document !== "undefined") {
      document.title = "Q-BECK // Static Correlation & Cumulant Kernel Closure | Point Reyes Sound";
    }
  };

  const closeAppView = () => {
    stopAudioIfPlaying();
    setCurrentView("home");
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState({ page: "home" }, "", "/");
    }
    if (typeof document !== "undefined") {
      document.title = "Point Reyes Sound | Continuous Phase-Space Kinetics for Strongly Correlated Electrons";
    }
  };

  // Sync state with browser navigation (back/forward buttons and direct URLs)
  React.useEffect(() => {
    const handlePopState = () => {
      const view = getInitialActiveView();
      if (view !== "interactive") {
        stopAudioIfPlaying();
      }
      setCurrentView(view);
      setLabTab(getInitialLabTab());
      if (view === "interactive") {
        document.title = "Quantum Gas // Continuous Phase-Space Kinetics | Point Reyes Sound";
      } else {
        document.title = "Point Reyes Sound | Continuous Phase-Space Kinetics for Strongly Correlated Electrons";
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);

    const initView = getInitialActiveView();
    if (initView === "interactive") {
      document.title = "Quantum Gas // Continuous Phase-Space Kinetics | Point Reyes Sound";
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

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
    inquiryType: "diligence"
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
    const subject = contactForm.subject || (contactForm.inquiryType === "diligence" ? "Technical Dossier & Institutional Inquiry" : "Point Reyes Sound Research Inquiry");
    const body = `Inquiry Type: ${contactForm.inquiryType || "General"}\nFrom: ${contactForm.name} (${contactForm.affiliation || "N/A"})\nEmail: ${contactForm.email}\n\n${contactForm.message}`;
    const mailTo = contactForm.inquiryType === "diligence" ? "directors@pointreyessound.com,romit@pointreyessound.com" : "romit@pointreyessound.com";
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

  // If user opens the Q-BECK Static Correlation Preprint Observatory
  if (currentView === "qbeck") {
    return (
      <QBeckStaticCorrelationShowcase
        onBackHome={closeAppView}
        onOpenConsole={() => openAppView("orbitals")}
      />
    );
  }

  // If user opens the application view (Interactive Q-BOLTZ Agent Console)
  if (currentView === "interactive") {
    if (labTab === "orbitals") {
      return (
        <div className="interactive-wrapper console-view">
          <PointReyesSound3DBackground />
          <ConsoleErrorBoundary>
            <QBoltzAgentConsole onClose={closeAppView} />
          </ConsoleErrorBoundary>
        </div>
      );
    }

    return (
      <div className="interactive-wrapper">
        <div className="lab-topbar">
          <div 
            className="lab-brand" 
            onClick={closeAppView}
            style={{ cursor: "pointer" }}
            title="Return to Point Reyes Sound Homepage"
          >
            <img src="/PRS_logo_v2.jpeg?v=5" alt="Point Reyes Sound" className="lab-logo" />
            <span className="lab-brand-title">POINT REYES SOUND</span>
          </div>

          <div className="lab-center-tabs" role="tablist" aria-label="Application View">
            <span 
              className={`lab-tab-pill ${labTab === "orbitals" ? "active" : ""}`}
              onClick={() => openAppView("orbitals")}
              style={{ cursor: "pointer" }}
              title="Active Space Molecular Orbitals (p1_qbescf Live)"
            >
              <span className="tab-pill-dot dot-interactive"></span>
              Molecular Orbitals
            </span>
            <a 
              href="/film"
              className="lab-tab-pill"
              style={{ cursor: "pointer", textDecoration: "none" }}
              title="Watch Executive Film (pointreyessound.com/film)"
            >
              <span className="tab-pill-dot dot-interactive"></span>
              Film ↗
            </a>
          </div>

          <div className="lab-nav-actions" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button 
              className="lab-nav-btn research-nav-btn"
              onClick={closeAppView}
              title="Return to Research Overview"
            >
              Research
            </button>
          </div>
        </div>

        {/* INTERACTIVE (Q-BOLTZ) */}
        <div className="app-view-container">
          <LandingPage isActive={currentView === "interactive"} />
        </div>

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
                    <span className="sales-guarantee-note">Direct technical response within 1 business hour</span>
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
      {/* IMPLICIT 3D POINT REYES SOUND BACKGROUND: CRASHING PACIFIC WAVES, SEA SPRAY & RED WATCHTOWER BEACON */}
      <PointReyesSound3DBackground />

      {/* 1. TOP GLOBAL NAVIGATION */}
      <header className="pod-header">
        <div className="header-inner">
          <a href="#about" className="brand-lockup" aria-label="Point Reyes Sound Home" title="Point Reyes Sound">
            <img 
              src="/PRS_logo_v2.jpeg?v=5" 
              alt="Point Reyes Sound" 
              className="prs-header-logo" 
            />
          </a>

          <nav className="header-nav">
            <button 
              className="nav-header-tab"
              onClick={() => openAppView("orbitals")}
              title="Launch Interactive Molecular Orbital Workstation"
            >
              Preview
            </button>
            <button
              className="nav-header-tab"
              onClick={openQBeckView}
              title="Explore Q-BECK Static Correlation Preprint Observatory (/qbeck)"
            >
              Q-BECK
            </button>
            <a href="#about">About</a>
            <a href="#research" className="nav-research-link">
              <span className="pulse-dot"></span> Research
            </a>
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
            <a 
              href="/film"
              className="nav-header-tab nav-tab-film"
              title="Watch Executive Film: Continuous Phase-Space Kinetics (pointreyessound.com/film)"
            >
              Film
            </a>
          </nav>
        </div>
      </header>

      {/* 2. ABOUT LANDING SECTION: ANIMATED QUANTUM CAROUSEL VIDEO & MISSION STATEMENT */}
      <section id="about" className="hero-section">
        <span id="overview" style={{ position: "relative", top: "-80px", display: "block" }}></span>
        <div className="hero-cinematic-banner">
          <div className="hero-video-frame">
            <video 
              ref={videoRef}
              src="/prs_carousel_reel_36s.mp4" 
              poster="/prs_carousel_reel_poster.png"
              autoPlay 
              muted={isVideoMuted}
              playsInline 
              controls
              className="hero-video-element"
              onVolumeChange={(e) => setIsVideoMuted(e.target.muted)}
              onEnded={() => setIsVideoEnded(true)}
              onPlay={() => setIsVideoEnded(false)}
            />
            {isVideoEnded && (
              <button 
                onClick={handleReplay} 
                className="video-replay-overlay-btn"
                title="Replay Video"
              >
                <span className="replay-icon">↺</span> Replay Video
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. RESEARCH SECTION: LINKEDIN CAROUSEL PANELS ON BLACK WIDESCREEN STAGE */}
      <section id="research" className="section-block" style={{ maxWidth: "none", padding: 0, margin: 0 }}>
        <PreprintSpotlight />
      </section>

      {/* 4. FOOTER: SPREAD ACROSS 4 BALANCED COLUMNS */}
      <footer id="contact" className="pod-footer">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <div className="brand-lockup">
              <img src="/PRS_logo_v2.jpeg?v=5" alt="Point Reyes Sound" className="prs-footer-logo" />
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
            <div className="footer-contact-emails">
              <a href="mailto:romit@pointreyessound.com">romit@pointreyessound.com</a>
              <a href="mailto:directors@pointreyessound.com">directors@pointreyessound.com</a>
            </div>
          </div>

          <div className="footer-col-nav">
            <h4>Platform</h4>
            <a href="#about">About</a>
            <a href="#research">Research</a>
            <a href="#contact">Contact</a>
            <a href="/film">Cinematic Overview (Film) &rarr;</a>
            <button className="footer-link-btn" onClick={() => openAppView("orbitals")}>
              Q-BOLTZ Interactive Demo &rarr;
            </button>
          </div>

          <div className="footer-col-resources">
            <h4>Resources</h4>
            <a href="https://arxiv.org/abs/2608.14979" target="_blank" rel="noopener noreferrer">
              Preprint (arXiv:2608.14979) &rarr;
            </a>
            <a href="/public-deck" target="_blank" rel="noopener noreferrer">
              Technical Prospectus &rarr;
            </a>
            <a href="/news/alchemist-chicago-2026">
              Alchemist Chicago Milestone &rarr;
            </a>
            <a href="https://polsky.uchicago.edu/2026/10/19/meet-the-30-semifinalists-in-alchemist-chicagos-second-cohort/" target="_blank" rel="noopener noreferrer">
              Polsky Center (Cohort 2) ↗
            </a>
            <a href="https://rchakraborty.dev" target="_blank" rel="noopener noreferrer">
              Romit Chakraborty (Founder Dossier) &rarr;
            </a>
            <a href="https://github.com/RomitChakraborty" target="_blank" rel="noopener noreferrer">
              Romit Chakraborty (GitHub Profile) &rarr;
            </a>
            <a href="https://github.com/point-reyes-sound" target="_blank" rel="noopener noreferrer">
              GitHub (point-reyes-sound) &rarr;
            </a>
          </div>

          <div className="footer-col-legal">
            <h4>Connect & Legal</h4>
            <div className="footer-connect-links">
              <a href="https://www.linkedin.com/company/point-reyes-sound/" target="_blank" rel="noopener noreferrer">
                LinkedIn &rarr;
              </a>
              <a href="https://www.crunchbase.com/organization/point-reyes-sound-inc-4399" target="_blank" rel="noopener noreferrer">
                Crunchbase &rarr;
              </a>
            </div>
            <p className="footer-notice-text">
              U.S. Provisional Patent Application No. 64/033,274. &copy; 2026 Point Reyes Sound, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}