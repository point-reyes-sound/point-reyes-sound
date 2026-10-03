# Caro's Institutional Deep-Tech Audit & GitHub Presentation Scorecard

**Target Profiles:**
1. **Point Reyes Sound, Inc.** (`https://github.com/point-reyes-sound`)
2. **Dr. Romit Chakraborty** (`https://github.com/RomitChakraborty`)

**Reviewing Partner:** Caro (Adversarial UX & Tier-1 Deep-Tech VC Partner Critic)  
**Date:** October 3, 2026  
**Benchmark Reference:** Lux Capital / DCVC deep-tech research spinouts (robust scientific authority, mathematical clarity, clear commercial problem space, zero generic developer tropes).

---

## 1. Executive Summary & Comparative Scorecard

| Dimension | Current PRS Org | Current Founder Profile | Target Institutional State |
| :--- | :---: | :---: | :---: |
| **First-Screen Authority & Hook** | `3.5 / 10` | `4.0 / 10` | **`9.5 / 10`** |
| **Problem Space & Commercial Clarity** | `3.0 / 10` | `4.5 / 10` | **`9.0 / 10`** |
| **Visual Architecture & Brand Cohesion** | `2.5 / 10` | `2.0 / 10` | **`9.5 / 10`** |
| **Curated Pinned Repositories** | `1.0 / 10` *(0 pinned)* | `3.0 / 10` *(stale uncurated)* | **`9.5 / 10`** |
| **Scientific Rigor & Claim Accuracy** | `8.5 / 10` | `8.5 / 10` | **`9.8 / 10`** |
| **Actionable Navigation & Pathways** | `4.0 / 10` | `4.5 / 10` | **`9.5 / 10`** |
| **OVERALL INSTITUTIONAL GRADE** | **`3.6 / 10 (Fail)`** | **`4.4 / 10 (Below Standard)`** | **`9.5 / 10 (Top Tier)`** |

---

## 2. Adversarial Breakdown by Urgency Tier

### Tier 1: Fatal Institutional Flaws (Immediate Correction Required)

1. **The "Empty Pinning" Void on PRS Org**:
   - *Current State*: The Point Reyes Sound GitHub organization has **0 pinned repositories**.
   - *Impact*: GitHub defaults to showing recently pushed repositories in chronological order. A partner visiting the page sees `papermache` (an unrelated prototype that was explicitly decoupled), `.github` (a configuration repo), and misses the flagship `p1_qbescf` benchmark suite.
   - *Remedy*: Pin exactly 2 public, verified, high-impact repositories:
     - **`point-reyes-sound/point-reyes-sound`** (The Core Platform, 3D WebGL Reaction Engine, and Research Portal)
     - **`point-reyes-sound/p1_qbescf`** (The Open Numerical Data Suite & Benchmark Curves for arXiv:2608.14979)

2. **Founder Pinned Repos Distract from Core Company IP**:
   - *Current State*: Romit’s personal GitHub profile currently pins `restoration` (an Apple Silicon Real-ESRGAN video restoration tool from a year ago) and `cp_kinetics_monocular_video` (which has an empty description).
   - *Impact*: A Tier-1 VC doing diligence on a quantum chemistry founder will wonder why video upscaling scripts are taking priority over his core research in non-equilibrium density matrix kinetics.
   - *Remedy*: Pin:
     - `point-reyes-sound/point-reyes-sound`
     - `point-reyes-sound/p1_qbescf`
     - `RomitChakraborty/cas-orbital-opt-gd`
     - `RomitChakraborty/phase-space-quantum-chemistry`

3. **Missing First-Screen Value Proposition ("Long Electrons" is not a hook)**:
   - *Current State*: The GitHub organization description is literally `"Long Electrons "`.
   - *Impact*: Outside of physical chemistry specialists, nobody understands what "Long Electrons" means without context. Investors and corporate R&D leads need to immediately understand: *What do you compute? What bottleneck do you break? Who needs this?*
   - *Remedy*: Update organization description to:
     `Continuous phase-space kinetics for strongly correlated electrons. Resolving mean-field bottlenecks in catalysis, battery interfaces, and quantum materials.`

---

### Tier 2: High-Impact Narrative & Visual Enhancements

1. **Lack of Visual Gravitas (The "Shields.io Badge Trap")**:
   - *Current State*: Both profiles rely on standard text blocks and default centered shields.io badges (`arXiv:2608.14979`, `Platform`, `License`). This looks like an undergraduate student repo.
   - *Remedy*: Introduce the custom SVG/PNG banners created by Bonnie. They feature the official Point Reyes Sound crimson monogram ($\Phi$), restrained coordinate grids, and authentic $W(z, p_z)$ phase-space Wigner tomography contours.

2. **Lack of a "System / Method Profile" Matrix**:
   - *Current State*: The current org README dumps a naked differential equation without contextualizing how QBE-SCF contrasts with conventional CASSCF/DMRG workflows.
   - *Remedy*: Add an editorial, high-contrast System Architecture Table comparing:
     - **Mathematical Framework**: Non-equilibrium Quantum Boltzmann Equation vs Static Diagonalization
     - **Complexity Scaling**: Deterministic $\mathcal{O}(N^3)$ vs Factorial $\mathcal{O}(N!)$ / Exponential Active Spaces
     - **Physical Fidelity**: Preserves total spatial symmetry and spin pure states; naturally regularizes conical intersections without artificial Coulson-Fischer symmetry breaking.
     - **Industrial Application**: Strongly correlated transition states, singlet fission diradicals, wide-bandgap power electronics, battery cathode interfaces.

---

### Tier 3: Scientific Precision & Credibility Guardrails

1. **Zero Hype / Zero Fabricated Traction**:
   - The profile must NOT make unverified claims about commercial contracts, stealth hardware deployments, or unreleased benchmarks.
   - Every claim must anchor directly to:
     - **Preprint**: arXiv:2608.14979 (`physics.chem-ph`, `quant-ph`).
     - **Open Code / Reproduction Data**: [`p1_qbescf`](https://github.com/point-reyes-sound/p1_qbescf) containing $H_2$, $H_3$, $H_4$, and $BeH_2$ potential energy curves.
     - **Interactive Simulation**: `https://pointreyessound.com/interactive`.
     - **Founder Academic Track Record**: Published papers in *Phys. Chem. Chem. Phys.*, *J. Chem. Phys.* (Q-Chem 5), and *Phys. Rev. A* (Mazziotti group).

---

## 3. Structural Blueprint for Implementation

### For Point Reyes Sound (`point-reyes-sound/.github/profile/README.md`)
1. **Hero Visual**: Wide custom editorial banner with phase-space tomography coordinates.
2. **Mission Anchor**: 2-sentence executive summary of PRS solver technology and industry application.
3. **System Architecture Profile**: Structured matrix comparing QBE-SCF with classical mean-field and multireference methods.
4. **Flagship Research & Open Benchmark Suites**: Deep links to arXiv:2608.14979 and reproduction data in `p1_qbescf`.
5. **Interactive Experience**: Direct callout to the 3D phase-space engine at `pointreyessound.com/interactive`.
6. **BibTeX Citation & Institutional Contact**.

### For Founder Profile (`RomitChakraborty/README.md`)
1. **Hero Visual**: Restrained scientist-founder banner detailing Ph.D. lineage and research focus.
2. **Identity & Affiliation**: Founder & CEO @ Point Reyes Sound; Ph.D. University of Chicago ('17), Postdoctoral / Fellow UC Berkeley & LBNL ('23), PsiQuantum ('25).
3. **Core Research Programs**:
   - Continuous-Variable Quantum Boltzmann Solvers (QBE-SCF)
   - Open Quantum Systems & Generalized Pauli Constraints (1-RDM Polytope Pinning)
   - Quantum Chemistry of Energy Materials (MOF $H_2$ Storage, Q-Chem 5)
4. **Selected Peer-Reviewed Works & Preprints** (Cleanly formatted with DOI and journal impact).
5. **Direct Channels**: PRS Pod, Personal Research Portal, Google Scholar, ORCID, LinkedIn.
