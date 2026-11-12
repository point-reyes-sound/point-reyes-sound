import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./QBeckStaticCorrelationShowcase.css";

const CLOSURE_STAGES = [
  {
    id: "bbgky",
    step: "01",
    label: "BBGKY Kinetic Hierarchy",
    scaling: "𝒪(N⁶) / 𝒪(N⁴) bottleneck",
    equation: "iℏ ∂ₜ ¹P = [h, ¹P] + Tr₂[V, ²D]",
    summary:
      "The exact one-body reduced density matrix equation of motion couples to the two-body density matrix ²D. In strongly correlated regimes (bond breaking, diradicals, Mott transitions), neglecting ²D fluctuations forces broken-symmetry cusps and catastrophic dissociation errors.",
    insight:
      "Storing or contracting the full 4-index ²D tensor hits a 60.4 GiB memory wall by N_AO = 300.",
  },
  {
    id: "wigner",
    step: "02",
    label: "Wigner–Weyl Phase Space",
    scaling: "Separable Quadrature",
    equation: "𝒲⁽²⁾_μνλσ(r, p) = 𝒲_μν(r, p) 𝒲_λσ(r, p)",
    summary:
      "Mapping the kinetic collision operator into Wigner–Weyl phase space reveals that the two-particle phase-space kernel factorizes cleanly across orbital pairs, turning the non-local collision integral into a structured local-density scattering flow.",
    insight:
      "Phase-space separability preserves spin-symmetry while regularizing Coulson–Fischer singularities.",
  },
  {
    id: "qbesc",
    step: "03",
    label: "Cumulant Decomposition · Q-BESC",
    scaling: "10⁻¹⁰ – 10⁻¹⁴ Eₕ exactness",
    equation: "²D = ¹P ∧ ¹P + ²Δ₀ + ²Δ₁ + ²Δ₂",
    summary:
      "Decomposing ²D into its antisymmetrized product ¹P ∧ ¹P plus irreducible cumulants isolates static correlation inside the active cumulant kernel ²Δ. Q-BESC evaluates the exact active-space cumulant, matching FCI, CASCI, CASSCF, and DMRG to machine precision.",
    insight:
      "Verified to 4.04×10⁻¹⁰ Eₕ on square H₄, 7.11×10⁻¹⁴ Eₕ on BeH₂, and 5.57×10⁻¹⁰ Eₕ on H₂O.",
  },
  {
    id: "qbeck",
    step: "04",
    label: "Susceptibility Closure · Q-BECK",
    scaling: "𝒪(N³) time · 𝒪(N²) memory",
    equation: "nᵢᵉᑫ = ½ [1 − tanh((εᵢ − μ) / 2ωᵢ)],  wⱼ = sech²((εⱼ − μ₀) / Δ₀)",
    summary:
      "Q-BECK closes the collision kernel at O(N³) cost without storing ²D. A susceptibility window (Δ₀ = 0.45 Eₕ) weights orbital-resolved scattering scales ωᵢ = wᵢ(cᵢᵀG[P_w]cᵢ − wᵢgᵢᵢ) / Σ_{j≠i} wⱼ, driving occupations to a C^∞ hyperbolic-tangent attractor at T_elec = 0.",
    insight:
      "Heals 85.7% ± 1.7% of MR-MGN-BE17 static correlation error with zero double-counting (ΔE > 0 for all 11 molecules).",
  },
];

const BENCHMARKS = [
  {
    id: "h3",
    tag: "FIG. 1 · cc-pVDZ",
    title: "Collinear H₃ Exchange & Generalized Pauli Polytope",
    subtitle: "Minimum-energy path (s) & Borland–Dennis pure N-representability facet pinning",
    headlineMetric: "10.22 kcal/mol",
    headlineLabel: "FCI / Q-BESC barrier (Q-BECK 12.76 vs ROHF 23.46)",
    chartTitle: "Barrier Height & Polytope Distance Along Reaction Coordinate s",
    xLabel: "Reaction Coordinate s (a.u.)",
    yLabel: "Relative Energy (kcal/mol)",
    series: [
      {
        name: "FCI / Q-BESC",
        color: "#34d399",
        points: [
          [-2.0, 0.0],
          [-1.2, 1.8],
          [-0.6, 6.1],
          [0.0, 10.22],
          [0.6, 6.1],
          [1.2, 1.8],
          [2.0, 0.0],
        ],
      },
      {
        name: "Q-BECK",
        color: "#38bdf8",
        points: [
          [-2.0, 0.0],
          [-1.2, 2.3],
          [-0.6, 7.6],
          [0.0, 12.76],
          [0.6, 7.6],
          [1.2, 2.3],
          [2.0, 0.0],
        ],
      },
      {
        name: "UHF / QBE-SCF",
        color: "#fbbf24",
        points: [
          [-2.0, 0.0],
          [-1.2, 3.1],
          [-0.6, 10.2],
          [0.0, 16.74],
          [0.6, 10.2],
          [1.2, 3.1],
          [2.0, 0.0],
        ],
      },
      {
        name: "ROHF",
        color: "#f87171",
        dashed: true,
        points: [
          [-2.0, 0.0],
          [-1.2, 4.4],
          [-0.6, 14.3],
          [0.0, 23.46],
          [0.6, 14.3],
          [1.2, 4.4],
          [2.0, 0.0],
        ],
      },
    ],
    stats: [
      { label: "FCI / Q-BESC Barrier", value: "10.22 kcal/mol" },
      { label: "Q-BECK Barrier", value: "12.76 kcal/mol" },
      { label: "Borland–Dennis Facet", value: "‖n − p‖₂ = 0 (D_BD ≥ 0)" },
      { label: "Ensemble Distance Peak (s=0)", value: "6.57×10⁻³ Q-BESC · 5.84×10⁻³ Q-BECK" },
    ],
    takeaway:
      "Both Q-BESC and Q-BECK remain strictly pinned to the Borland–Dennis pure-state N-representability boundary (‖n − p‖₂ = 0) while smoothly tracking the ensemble-distance bell curve across the collinear H₃ transition state.",
  },
  {
    id: "h4",
    tag: "FIG. 2 · cc-pVDZ",
    title: "Square H₄ (D₄h) Dissociation & Mott Insulator Transition",
    subtitle: "Four-electron multi-reference degeneracy & 4.000-bit configurational entropy limit",
    headlineMetric: "4.04×10⁻¹⁰ Eₕ",
    headlineLabel: "Max |E_Q-BESC − E_FCI| across R ∈ [0.80, 3.20] Å",
    chartTitle: "Dissociation Curve & Configurational Entropy S_config(R)",
    xLabel: "Square Side Length R (Å)",
    yLabel: "Energy Relative to Dissociation (kcal/mol)",
    series: [
      {
        name: "FCI / Q-BESC",
        color: "#34d399",
        points: [
          [0.8, -18.0],
          [1.0, -56.0],
          [1.2, -64.95],
          [1.5, -48.5],
          [2.0, -19.2],
          [2.6, -4.1],
          [3.2, 0.0],
        ],
      },
      {
        name: "Q-BECK",
        color: "#38bdf8",
        points: [
          [0.8, -17.5],
          [1.0, -55.2],
          [1.2, -64.46],
          [1.5, -47.9],
          [2.0, -18.4],
          [2.6, -3.7],
          [3.2, 0.0],
        ],
      },
      {
        name: "QBE-SCF / RHF",
        color: "#f87171",
        dashed: true,
        points: [
          [0.8, -12.0],
          [1.0, -47.0],
          [1.2, -52.0],
          [1.5, -24.0],
          [2.0, 26.0],
          [2.6, 68.0],
          [3.2, 92.0],
        ],
      },
    ],
    stats: [
      { label: "Q-BESC vs FCI Max Error", value: "4.04×10⁻¹⁰ Eₕ" },
      { label: "Equilibrium D_e (FCI / Q-BECK)", value: "64.95 / 64.46 kcal/mol" },
      { label: "S_config at R = 1.20 Å", value: "2.396 bits" },
      { label: "Mott Limit (R → 3.20 Å)", value: "4.000 bits (n_i → 1.000)" },
    ],
    takeaway:
      "As square H₄ stretches toward the Mott insulator limit, Q-BECK drives 1a₁g, 1e_u, and 1b₁g smoothly to exact half-filling (1.000) and S_config = 4.000 bits, whereas QBE-SCF stays trapped at 0 bits.",
  },
  {
    id: "beh2",
    tag: "FIG. 3 · 6-31G",
    title: "BeH₂ (C₂v) Non-Adiabatic Avoided Crossing",
    subtitle: "Spin-restricted S₀ insertion pathway & C^∞ gradient regularization",
    headlineMetric: "7.11×10⁻¹⁴ Eₕ",
    headlineLabel: "Q-BESC match to CASCI(12,4) · Q-BECK heals 74.4% of cusp",
    chartTitle: "C₂v Insertion Barrier E(x) Across x ∈ [0.40, 2.00] Å",
    xLabel: "Be–H₂ Insertion Coordinate x (Å)",
    yLabel: "Barrier Energy ΔE (Eₕ)",
    series: [
      {
        name: "CASCI(12,4) / Q-BESC",
        color: "#34d399",
        points: [
          [0.4, 0.0],
          [0.8, 0.042],
          [1.2, 0.118],
          [1.54, 0.1712],
          [1.7, 0.145],
          [2.0, 0.068],
        ],
      },
      {
        name: "Q-BECK (C^∞ Smooth)",
        color: "#38bdf8",
        points: [
          [0.4, 0.0],
          [0.8, 0.046],
          [1.2, 0.132],
          [1.54, 0.1973],
          [1.7, 0.161],
          [2.0, 0.072],
        ],
      },
      {
        name: "QBE-SCF (Cusp)",
        color: "#f87171",
        dashed: true,
        points: [
          [0.4, 0.0],
          [0.8, 0.055],
          [1.2, 0.169],
          [1.54, 0.2733],
          [1.7, 0.205],
          [2.0, 0.088],
        ],
      },
    ],
    stats: [
      { label: "Q-BESC vs CASCI(12,4)", value: "7.11×10⁻¹⁴ Eₕ" },
      { label: "CASCI / Q-BESC Barrier", value: "0.1712 Eₕ (x ≈ 1.54 Å)" },
      { label: "Q-BECK Smooth Barrier", value: "0.1973 Eₕ (74.4% cusp healed)" },
      { label: "QBE-SCF Cusp Peak", value: "0.2733 Eₕ (discontinuous dE/dx)" },
    ],
    takeaway:
      "At the C₂v avoided crossing (x ≈ 1.54 Å), restricted mean-field theory exhibits a sharp derivative cusp. Q-BECK's tanh fixed point yields a C^∞ potential surface with continuous gradient dE/dx passing smoothly through zero.",
  },
  {
    id: "h2o",
    tag: "FIG. 4 · cc-pVDZ",
    title: "Symmetric Double Dissociation of H₂O",
    subtitle: "Simultaneous cleavage of two O–H bonds & Coulson–Fischer kink removal",
    headlineMetric: "5.57×10⁻¹⁰ Eₕ",
    headlineLabel: "Q-BESC(8,6) vs CASSCF(8,6)/DMRG(8,6) · RHF +229.6 kcal/mol error",
    chartTitle: "Symmetric O–H Stretch R_OH ∈ [0.80, 3.20] Å",
    xLabel: "Symmetric O–H Distance R_OH (Å)",
    yLabel: "Relative Energy (kcal/mol)",
    series: [
      {
        name: "CASSCF(8,6) / Q-BESC",
        color: "#34d399",
        points: [
          [0.8, 22.0],
          [0.96, 0.0],
          [1.4, 71.0],
          [1.8, 148.0],
          [2.4, 206.0],
          [3.2, 218.0],
        ],
      },
      {
        name: "Q-BECK",
        color: "#38bdf8",
        points: [
          [0.8, 23.0],
          [0.96, 0.0],
          [1.4, 76.0],
          [1.8, 162.0],
          [2.4, 226.0],
          [3.2, 241.0],
        ],
      },
      {
        name: "RHF",
        color: "#f87171",
        dashed: true,
        points: [
          [0.8, 25.0],
          [0.96, 0.0],
          [1.4, 98.0],
          [1.8, 228.0],
          [2.4, 368.0],
          [3.2, 447.6],
        ],
      },
    ],
    stats: [
      { label: "Q-BESC(8,6) vs DMRG/CASSCF", value: "5.57×10⁻¹⁰ Eₕ" },
      { label: "RHF Dissociation Overshoot", value: "+229.6 kcal/mol" },
      { label: "Coulson–Fischer Kink", value: "Eliminated at R_OH ≈ 1.40 Å" },
      { label: "Equilibrium Static Gap vs UHF", value: "67.9% recovered by Q-BECK" },
    ],
    takeaway:
      "Breaking both O–H bonds simultaneously stresses four correlated electrons. Q-BESC(8,6) tracks DMRG(8,6) to 5.57×10⁻¹⁰ Eₕ, while O(N³) Q-BECK eliminates the R_OH ≈ 1.40 Å Coulson–Fischer kink cleanly.",
  },
  {
    id: "n2",
    tag: "FIG. 5 & TABLE 1 · cc-pVTZ / DZ–a5Z",
    title: "N₂ Triple-Bond Cleavage & Basis-Set Virial Convergence",
    subtitle: "Six-electron π/σ bond breaking & bounded SCF convergence up to N_AO = 254",
    headlineMetric: "9.55 eV",
    headlineLabel: "Q-BESC(6,6)/NEVPT2 in aTZ (Expt 9.91 eV) · Virial 1.10×10⁻⁵ in aQZ",
    chartTitle: "N₂ Potential Curve R ∈ [0.80, 3.00] Å (cc-pVTZ)",
    xLabel: "N–N Bond Length R (Å)",
    yLabel: "Binding Curve Relative to Minimum (eV)",
    series: [
      {
        name: "CASSCF(6,6) / Q-BESC(6,6)",
        color: "#34d399",
        points: [
          [0.85, 3.8],
          [1.1, 0.0],
          [1.19, 0.55],
          [1.5, 4.1],
          [2.0, 7.6],
          [2.5, 8.65],
          [3.0, 8.82],
        ],
      },
      {
        name: "Q-BESC(6,6)/NEVPT2 (aTZ)",
        color: "#38bdf8",
        points: [
          [0.85, 4.0],
          [1.1, 0.0],
          [1.19, 0.6],
          [1.5, 4.45],
          [2.0, 8.2],
          [2.5, 9.35],
          [3.0, 9.55],
        ],
      },
      {
        name: "RHF",
        color: "#f87171",
        dashed: true,
        points: [
          [0.85, 4.2],
          [1.1, 0.0],
          [1.19, 0.7],
          [1.5, 6.2],
          [2.0, 12.9],
          [2.5, 17.5],
          [3.0, 20.1],
        ],
      },
    ],
    stats: [
      { label: "Q-BESC(6,6) / CASSCF(6,6) D_e", value: "8.82 eV" },
      { label: "Q-BESC(6,6)/NEVPT2 (aTZ)", value: "9.55 eV (Expt 9.91 eV)" },
      { label: "Table 1 Basis Range (DZ → a5Z)", value: "N_AO = 28 → 254 (45–53 cycles)" },
      { label: "Virial Defect 1 + ⟨V⟩/2⟨T⟩", value: "+7.35×10⁻⁴ (DZ) → +1.10×10⁻⁵ (aQZ)" },
    ],
    takeaway:
      "Even across a triple bond, Q-BECK converges in a bounded 45–53 SCF iterations from cc-pVDZ (28 AOs) through aug-cc-pV5Z (254 AOs), while the virial defect tightens monotonically by nearly two orders of magnitude.",
  },
  {
    id: "benzyne",
    tag: "FIG. 6 & TABLE 2 · cc-pVDZ",
    title: "Benzyne Diradicals & MR-MGN-BE17 (11-Molecule Suite)",
    subtitle: "Singlet–triplet isomer gaps & multi-reference bond energies at R = 5.0 Å",
    headlineMetric: "85.7% ± 1.7%",
    headlineLabel: "MR-MGN-BE17 error healed by Q-BECK (MUE 24.78 vs QBE-SCF 170.16 kcal/mol)",
    chartTitle: "Benzyne Isomer Gaps (meta–ortho & para–ortho, kcal/mol)",
    xLabel: "Method Index (1: Expt, 2: Q-BECK, 3: Q-BESC, 4: CCSD(T), 5: SCAN-RDMFT, 6: PBE-RDMFT)",
    yLabel: "Isomer Gap Relative to ortho-Benzyne (kcal/mol)",
    series: [
      {
        name: "para − ortho Gap",
        color: "#38bdf8",
        points: [
          [1, 31.2],
          [2, 29.18],
          [3, 29.5],
          [4, 27.42],
          [5, 30.62],
          [6, 27.4],
        ],
      },
      {
        name: "meta − ortho Gap",
        color: "#34d399",
        points: [
          [1, 15.6],
          [2, 14.84],
          [3, 16.5],
          [4, 14.03],
          [5, 9.34],
          [6, 8.4],
        ],
      },
    ],
    stats: [
      { label: "Benzyne Q-BECK (m−o / p−o)", value: "14.84 / 29.18 kcal/mol" },
      { label: "Benzyne Expt (m−o / p−o)", value: "15.60±6.10 / 31.20±4.20" },
      { label: "MR-MGN-BE17 MUE (Q-BECK)", value: "24.78 kcal/mol (19.89 /bond)" },
      { label: "Zero Double-Counting", value: "ΔE > 0 for all 11 molecules" },
    ],
    takeaway:
      "Q-BECK captures benzyne diradical isomer gaps (14.84 / 29.18 kcal/mol) closer to experiment than PBE-RDMFT (8.40 / 27.40) and SCAN-RDMFT (9.34 / 30.62), while healing 82.1%–88.3% of MR-MGN-BE17 static correlation error.",
  },
];

const SCALING_POINTS = [
  { nao: 15, hChain: 0.08, alkane: 0.09, n2: 0.11, twoRdmMemMb: 0.38, qbeckMemMb: 0.25 },
  { nao: 50, hChain: 0.85, alkane: 1.9, n2: 2.8, twoRdmMemMb: 47.7, qbeckMemMb: 1.4 },
  { nao: 100, hChain: 3.4, alkane: 16.5, n2: 27.2, twoRdmMemMb: 763.0, qbeckMemMb: 4.3 },
  { nao: 180, hChain: 11.2, alkane: 112.0, n2: 215.0, twoRdmMemMb: 8010.0, qbeckMemMb: 11.8 },
  { nao: 254, hChain: 22.8, alkane: 342.0, n2: 710.0, twoRdmMemMb: 31800.0, qbeckMemMb: 21.4 },
  { nao: 300, hChain: 32.1, alkane: 584.0, n2: 1240.0, twoRdmMemMb: 61849.6, qbeckMemMb: 28.9 },
];

function formatChartPath(points, xMin, xMax, yMin, yMax, width, height, pad) {
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  return points
    .map(([x, y], idx) => {
      const px = pad.left + ((x - xMin) / (xMax - xMin || 1)) * innerW;
      const py = pad.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH;
      return `${idx === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}

function PhaseSpaceAttractorCanvas({ bondStretch, deltaZero }) {
  const mountRef = useRef(null);
  const paramsRef = useRef({ bondStretch, deltaZero });

  useEffect(() => {
    paramsRef.current = { bondStretch, deltaZero };
  }, [bondStretch, deltaZero]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.3, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Phase-space Wigner-cumulant wavefield grid
    const segX = 56;
    const segZ = 56;
    const planeGeo = new THREE.PlaneGeometry(7.2, 5.2, segX, segZ);
    planeGeo.rotateX(-Math.PI / 2);

    const posAttr = planeGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    planeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const planeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.72,
    });
    const waveMesh = new THREE.Mesh(planeGeo, planeMat);
    scene.add(waveMesh);

    // Floating orbital attractor nodes (4 Mott orbitals)
    const nodeGroup = new THREE.Group();
    const nodeColors = [0x38bdf8, 0x34d399, 0x34d399, 0xfbbf24];
    const nodes = nodeColors.map((hex, i) => {
      const geo = new THREE.SphereGeometry(0.14, 24, 24);
      const mat = new THREE.MeshBasicMaterial({ color: hex });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-1.65 + i * 1.1, 0.9, 0);
      nodeGroup.add(mesh);
      return mesh;
    });
    scene.add(nodeGroup);

    let frameId = 0;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.018;

      const { bondStretch: R, deltaZero: d0 } = paramsRef.current;
      const stretchNorm = (R - 0.8) / (3.2 - 0.8); // 0 -> 1
      const coupling = Math.max(0.15, d0 / 0.45);

      const positions = planeGeo.attributes.position;
      const colorAttr = planeGeo.attributes.color;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const sep = 0.6 + stretchNorm * 1.75;

        const r1 = Math.hypot(x + sep, z);
        const r2 = Math.hypot(x - sep, z);
        const g1 = Math.exp(-r1 * r1 * 0.9);
        const g2 = Math.exp(-r2 * r2 * 0.9);
        const interference =
          Math.cos(x * (2.2 + stretchNorm * 3.1) - time * 1.4) *
          Math.exp(-0.35 * (x * x * 0.35 + z * z)) *
          (0.35 + 0.65 * stretchNorm) *
          coupling;

        const y = (g1 + g2) * 0.85 + interference * 0.72;
        positions.setY(i, y - 0.35);

        // Luminous cerulean -> emerald -> gold phase-space interference palette
        const t = THREE.MathUtils.clamp((y + 0.4) / 1.6, 0, 1);
        const neg = interference < 0 ? Math.min(1, -interference * 1.4) : 0;
        colorAttr.setXYZ(
          i,
          0.12 + 0.82 * neg + 0.15 * t,
          0.42 + 0.48 * t - 0.22 * neg,
          0.75 + 0.25 * (1 - neg)
        );
      }
      positions.needsUpdate = true;
      colorAttr.needsUpdate = true;

      nodes.forEach((node, idx) => {
        const phase = time * 1.3 + idx * 1.25;
        node.position.y = 0.85 + Math.sin(phase) * (0.15 + 0.18 * stretchNorm);
        const scale = 0.8 + 0.45 * (1 - Math.abs(stretchNorm - 0.5));
        node.scale.setScalar(scale);
      });

      waveMesh.rotation.y = Math.sin(time * 0.25) * 0.16;
      nodeGroup.rotation.y = waveMesh.rotation.y;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 560;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      planeGeo.dispose();
      planeMat.dispose();
      nodes.forEach((n) => {
        n.geometry.dispose();
        n.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="qbeck-webgl-canvas" aria-label="Interactive Wigner-Cumulant Phase-Space Manifold" />;
}

export default function QBeckStaticCorrelationShowcase({ onBackHome, onOpenConsole }) {
  const [bondStretch, setBondStretch] = useState(1.85);
  const [deltaZero, setDeltaZero] = useState(0.45);
  const [activeStageId, setActiveStageId] = useState("qbeck");
  const [activeBenchId, setActiveBenchId] = useState("h4");
  const [hiddenSeries, setHiddenSeries] = useState({});

  const activeStage = useMemo(
    () => CLOSURE_STAGES.find((s) => s.id === activeStageId) || CLOSURE_STAGES[3],
    [activeStageId]
  );

  const activeBench = useMemo(
    () => BENCHMARKS.find((b) => b.id === activeBenchId) || BENCHMARKS[1],
    [activeBenchId]
  );

  // Live Mott H4 occupation spectrum and Shannon configurational entropy
  const mottTelemetry = useMemo(() => {
    const stretchNorm = (bondStretch - 0.8) / (3.2 - 0.8); // 0 -> 1
    // Effective gap narrows exponentially as R -> 3.20 A, while deltaZero scales susceptibility width
    const gap = Math.max(0.015, 0.92 * Math.exp(-2.35 * stretchNorm));
    const omega = 0.08 + 0.55 * stretchNorm * (deltaZero / 0.45);
    const eps = [-gap * 1.15, -gap * 0.12, gap * 0.12, gap * 1.15];
    const labels = ["1a₁g", "1e_u(x)", "1e_u(y)", "1b₁g"];

    const occs = eps.map((e, i) => {
      const n = 0.5 * (1 - Math.tanh(e / (2 * omega)));
      // Keep 2 * sum(n) = 4 electrons (spin-summed occupations in [0, 2])
      return {
        label: labels[i],
        occ: n * 2,
      };
    });

    // Configurational entropy S_config = -sum_i [p_i log2 p_i + (1-p_i) log2(1-p_i)], spin-orbital sum up to 4.000 bits
    const entropy = occs.reduce((acc, item) => {
      const p = Math.min(0.999999, Math.max(0.000001, item.occ / 2));
      return acc - (p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
    }, 0);

    const cumulantTrace = occs.reduce((acc, item) => {
      const p = item.occ / 2;
      return acc - (p - p * p);
    }, 0);

    return {
      occs,
      entropy: Math.min(4, entropy).toFixed(3),
      cumulantTrace: cumulantTrace.toFixed(3),
      omega: omega.toFixed(3),
    };
  }, [bondStretch, deltaZero]);

  const chartBounds = useMemo(() => {
    const allPts = activeBench.series.flatMap((s) => s.points);
    const xs = allPts.map((p) => p[0]);
    const ys = allPts.map((p) => p[1]);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMinRaw = Math.min(...ys);
    const yMaxRaw = Math.max(...ys);
    const yPad = (yMaxRaw - yMinRaw || 1) * 0.1;
    return {
      xMin,
      xMax,
      yMin: yMinRaw - yPad,
      yMax: yMaxRaw + yPad,
    };
  }, [activeBench]);

  const toggleSeries = (name) => {
    setHiddenSeries((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const chartW = 720;
  const chartH = 310;
  const chartPad = { top: 24, right: 24, bottom: 42, left: 58 };

  return (
    <div className="qbeck-page">
      <header className="qbeck-topbar">
        <div className="qbeck-topbar-left">
          <button className="qbeck-brand-btn" onClick={onBackHome} title="Return to Point Reyes Sound">
            <img src="/PRS_logo_v2.jpeg?v=5" alt="Point Reyes Sound" className="qbeck-logo" />
            <span className="qbeck-brand-name">Point Reyes Sound</span>
          </button>
          <span className="qbeck-pill">
            <span className="qbeck-pill-dot" />
            Q-BECK · STATIC CORRELATION
          </span>
        </div>

        <nav className="qbeck-nav-links" aria-label="Preprint sections">
          <a href="#attractor">Attractor</a>
          <a href="#closure">Closure</a>
          <a href="#benchmarks">Benchmarks</a>
          <a href="#scaling">Scaling</a>
        </nav>

        <div className="qbeck-topbar-actions">
          <button className="qbeck-btn-ghost" onClick={onBackHome}>
            &larr; Home
          </button>
          <button className="qbeck-btn-primary" onClick={onOpenConsole}>
            Open Q-BOLTZ Console
          </button>
        </div>
      </header>

      <main className="qbeck-main">
        {/* 1. HERO + LIVE PHASE-SPACE CUMULANT ATTRACTOR */}
        <section id="attractor" className="qbeck-hero">
          <div className="qbeck-hero-copy">
            <p className="qbeck-eyebrow">PREPRINT OBSERVATORY · POINT REYES SOUND, INC.</p>
            <h1 className="qbeck-title">
              Quantum Boltzmann Equation for Static Correlation with Cumulant Kernel Closure
            </h1>
            <p className="qbeck-subtitle">
              By <strong>Romit Chakraborty</strong> — Resolving multi-reference bond dissociation,
              avoided crossings, and Mott transitions on a <em>C</em><sup>&infin;</sup> hyperbolic-tangent
              fixed point at <code>&#x1D4AA;(N&sup3;)</code> cost without storing the two-body density matrix.
            </p>

            <div className="qbeck-kpi-grid">
              <div className="qbeck-kpi-card">
                <span className="qbeck-kpi-val">10⁻¹⁰ – 10⁻¹⁴ Eₕ</span>
                <span className="qbeck-kpi-label">Q-BESC vs FCI / CASCI / DMRG</span>
              </div>
              <div className="qbeck-kpi-card">
                <span className="qbeck-kpi-val">85.7% ± 1.7%</span>
                <span className="qbeck-kpi-label">MR-MGN-BE17 Error Healed</span>
              </div>
              <div className="qbeck-kpi-card">
                <span className="qbeck-kpi-val">2,140×</span>
                <span className="qbeck-kpi-label">Memory Reduction at N_AO = 300</span>
              </div>
              <div className="qbeck-kpi-card">
                <span className="qbeck-kpi-val">0 Double-Count</span>
                <span className="qbeck-kpi-label">&Delta;E &gt; 0 on All 11 Molecules</span>
              </div>
            </div>

            <div className="qbeck-artifact-links">
              <a
                href="https://doi.org/10.5281/zenodo.24149207"
                target="_blank"
                rel="noopener noreferrer"
                className="qbeck-link-chip"
              >
                Zenodo Archive · 10.5281/zenodo.24149207
              </a>
              <a
                href="https://github.com/point-reyes-sound/qbeck-static-correlation-data"
                target="_blank"
                rel="noopener noreferrer"
                className="qbeck-link-chip"
              >
                GitHub · qbeck-static-correlation-data
              </a>
              <span className="qbeck-link-chip qbeck-chip-muted">
                API · POST /v1/q-beck &amp; /v1/q-besc
              </span>
            </div>
          </div>

          <div className="qbeck-observatory-panel">
            <div className="qbeck-panel-header">
              <span>LIVE WIGNER–CUMULANT ATTRACTOR · D₄h H₄ MANIFOLD</span>
              <span className="qbeck-mono-badge">T_elec = 0 K</span>
            </div>

            <PhaseSpaceAttractorCanvas bondStretch={bondStretch} deltaZero={deltaZero} />

            <div className="qbeck-controls-row">
              <label className="qbeck-slider-control">
                <div className="qbeck-slider-head">
                  <span>Bond Stretch R</span>
                  <code>{bondStretch.toFixed(2)} Å</code>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="3.20"
                  step="0.02"
                  value={bondStretch}
                  onChange={(e) => setBondStretch(parseFloat(e.target.value))}
                />
              </label>

              <label className="qbeck-slider-control">
                <div className="qbeck-slider-head">
                  <span>Susceptibility Window Δ₀</span>
                  <code>{deltaZero.toFixed(2)} Eₕ</code>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.90"
                  step="0.01"
                  value={deltaZero}
                  onChange={(e) => setDeltaZero(parseFloat(e.target.value))}
                />
              </label>
            </div>

            <div className="qbeck-telemetry-strip">
              <div className="qbeck-occ-bars">
                {mottTelemetry.occs.map((item) => (
                  <div key={item.label} className="qbeck-occ-item">
                    <div className="qbeck-occ-meta">
                      <span>{item.label}</span>
                      <code>{item.occ.toFixed(3)}</code>
                    </div>
                    <div className="qbeck-occ-track">
                      <div
                        className="qbeck-occ-fill"
                        style={{ width: `${(item.occ / 2) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="qbeck-entropy-readout">
                <div>
                  <span className="qbeck-telemetry-label">S_config</span>
                  <strong className="qbeck-telemetry-value">{mottTelemetry.entropy} bits</strong>
                </div>
                <div>
                  <span className="qbeck-telemetry-label">Tr(²Δ)</span>
                  <strong className="qbeck-telemetry-value">{mottTelemetry.cumulantTrace}</strong>
                </div>
                <div>
                  <span className="qbeck-telemetry-label">Scattering ω</span>
                  <strong className="qbeck-telemetry-value">{mottTelemetry.omega} Eₕ</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. KINETIC CLOSURE PIPELINE */}
        <section id="closure" className="qbeck-section">
          <div className="qbeck-section-head">
            <p className="qbeck-eyebrow">KINETIC THEORY ARCHITECTURE</p>
            <h2>From the BBGKY Hierarchy to the C^&infin; Cumulant Fixed Point</h2>
          </div>

          <div className="qbeck-stage-tabs">
            {CLOSURE_STAGES.map((stage) => (
              <button
                key={stage.id}
                className={`qbeck-stage-tab ${stage.id === activeStageId ? "is-active" : ""}`}
                onClick={() => setActiveStageId(stage.id)}
              >
                <span className="qbeck-stage-num">{stage.step}</span>
                <span className="qbeck-stage-title">{stage.label}</span>
                <span className="qbeck-stage-scale">{stage.scaling}</span>
              </button>
            ))}
          </div>

          <div className="qbeck-stage-detail">
            <div className="qbeck-equation-box">
              <code>{activeStage.equation}</code>
            </div>
            <p className="qbeck-stage-summary">{activeStage.summary}</p>
            <div className="qbeck-stage-insight">
              <span className="qbeck-insight-tag">KEY FINDING</span>
              <span>{activeStage.insight}</span>
            </div>
          </div>
        </section>

        {/* 3. INTERACTIVE 6-SYSTEM BENCHMARK OBSERVATORY */}
        <section id="benchmarks" className="qbeck-section">
          <div className="qbeck-section-head">
            <p className="qbeck-eyebrow">VERIFIED QUANTUM CHEMISTRY BENCHMARKS</p>
            <h2>Six Multi-Reference Regimes &amp; MR-MGN-BE17</h2>
          </div>

          <div className="qbeck-bench-selector">
            {BENCHMARKS.map((bench) => (
              <button
                key={bench.id}
                className={`qbeck-bench-btn ${bench.id === activeBenchId ? "is-active" : ""}`}
                onClick={() => setActiveBenchId(bench.id)}
              >
                <span className="qbeck-bench-tag">{bench.tag}</span>
                <span className="qbeck-bench-name">{bench.title}</span>
              </button>
            ))}
          </div>

          <div className="qbeck-bench-panel">
            <div className="qbeck-bench-header">
              <div>
                <h3>{activeBench.title}</h3>
                <p>{activeBench.subtitle}</p>
              </div>
              <div className="qbeck-bench-hero-metric">
                <strong>{activeBench.headlineMetric}</strong>
                <span>{activeBench.headlineLabel}</span>
              </div>
            </div>

            <div className="qbeck-chart-wrap">
              <div className="qbeck-chart-toolbar">
                <span className="qbeck-chart-title">{activeBench.chartTitle}</span>
                <div className="qbeck-legend">
                  {activeBench.series.map((s) => (
                    <button
                      key={s.name}
                      className={`qbeck-legend-item ${hiddenSeries[s.name] ? "is-muted" : ""}`}
                      onClick={() => toggleSeries(s.name)}
                    >
                      <span className="qbeck-legend-swatch" style={{ background: s.color }} />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="qbeck-svg-chart"
                role="img"
                aria-label={activeBench.chartTitle}
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const y = chartPad.top + t * (chartH - chartPad.top - chartPad.bottom);
                  const val = chartBounds.yMax - t * (chartBounds.yMax - chartBounds.yMin);
                  return (
                    <g key={t}>
                      <line
                        x1={chartPad.left}
                        y1={y}
                        x2={chartW - chartPad.right}
                        y2={y}
                        stroke="rgba(148, 163, 184, 0.14)"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={chartPad.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {val.toFixed(val > 10 || val < -10 ? 0 : 2)}
                      </text>
                    </g>
                  );
                })}

                {/* Axis labels */}
                <text
                  x={chartW / 2}
                  y={chartH - 8}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {activeBench.xLabel}
                </text>

                {/* Curves */}
                {activeBench.series.map((s) => {
                  if (hiddenSeries[s.name]) return null;
                  const d = formatChartPath(
                    s.points,
                    chartBounds.xMin,
                    chartBounds.xMax,
                    chartBounds.yMin,
                    chartBounds.yMax,
                    chartW,
                    chartH,
                    chartPad
                  );
                  return (
                    <g key={s.name}>
                      <path
                        d={d}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={s.dashed ? "2" : "2.8"}
                        strokeDasharray={s.dashed ? "6 5" : undefined}
                      />
                      {s.points.map(([x, y], idx) => {
                        const cx =
                          chartPad.left +
                          ((x - chartBounds.xMin) / (chartBounds.xMax - chartBounds.xMin || 1)) *
                            (chartW - chartPad.left - chartPad.right);
                        const cy =
                          chartPad.top +
                          (chartH - chartPad.top - chartPad.bottom) -
                          ((y - chartBounds.yMin) / (chartBounds.yMax - chartBounds.yMin || 1)) *
                            (chartH - chartPad.top - chartPad.bottom);
                        return <circle key={idx} cx={cx} cy={cy} r="3.5" fill={s.color} />;
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="qbeck-bench-stats">
              {activeBench.stats.map((st) => (
                <div key={st.label} className="qbeck-stat-card">
                  <span>{st.label}</span>
                  <strong>{st.value}</strong>
                </div>
              ))}
            </div>

            <p className="qbeck-bench-takeaway">{activeBench.takeaway}</p>
          </div>
        </section>

        {/* 4. SCALING PROOF & MEMORY WALL */}
        <section id="scaling" className="qbeck-section">
          <div className="qbeck-section-head">
            <p className="qbeck-eyebrow">FIG. 7 · 8-CORE APPLE M2</p>
            <h2>Breaking the &#x1D4AA;(N⁴) 2-RDM Memory Wall</h2>
          </div>

          <div className="qbeck-scaling-grid">
            <div className="qbeck-scaling-card">
              <h3>Empirical Time-Complexity Exponents</h3>
              <p className="qbeck-scaling-desc">
                Measured wall-clock scaling across N_AO &isin; [15, 300] confirms &#x1D4AA;(N&sup3;)
                for dense molecules and near-quadratic scaling under Schwarz integral screening.
              </p>
              <div className="qbeck-exponent-list">
                <div className="qbeck-exp-row">
                  <span>1D Hydrogen Chains (H₁₀–H₆₀, Schwarz-screened)</span>
                  <code>slope 2.05</code>
                </div>
                <div className="qbeck-exp-row">
                  <span>3D Linear Alkanes</span>
                  <code>slope 3.28</code>
                </div>
                <div className="qbeck-exp-row">
                  <span>N₂ Basis-Set Hierarchy (DZ → a5Z)</span>
                  <code>slope 3.56</code>
                </div>
              </div>
            </div>

            <div className="qbeck-scaling-card">
              <h3>Memory Footprint at N_AO = 300</h3>
              <p className="qbeck-scaling-desc">
                Q-BECK requires only &#x1D4AA;(N&sup2;) orbital matrices, staying in 12.4–28.9 MB
                while explicit &#x1D4AA;(N⁴) 2-RDM storage explodes to 60.4 GiB.
              </p>
              <div className="qbeck-mem-table">
                {SCALING_POINTS.map((row) => (
                  <div key={row.nao} className="qbeck-mem-row">
                    <code>N_AO = {row.nao}</code>
                    <span>Q-BECK: {row.qbeckMemMb.toFixed(1)} MB</span>
                    <span className="qbeck-mem-wall">
                      2-RDM: {row.twoRdmMemMb >= 1024 ? `${(row.twoRdmMemMb / 1024).toFixed(1)} GiB` : `${row.twoRdmMemMb.toFixed(1)} MB`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

