<div align="center">

# Point Reyes Sound

### Continuous phase-space kinetics for strongly correlated electrons.

[![Preprint](https://img.shields.io/badge/arXiv-2608.14979-B31B1B.svg?style=flat-square)](https://arxiv.org/abs/2608.14979)
[![Website](https://img.shields.io/badge/Platform-pointreyessound.com-0284c7.svg?style=flat-square)](https://pointreyessound.com)
[![Interactive 3D](https://img.shields.io/badge/Interactive-3D_Phase--Space-0d9488.svg?style=flat-square)](https://pointreyessound.com/interactive)
[![GitHub Org](https://img.shields.io/badge/GitHub-point--reyes--sound-181717.svg?style=flat-square&logo=github)](https://github.com/point-reyes-sound)

---

### [📄 Read Preprint](https://arxiv.org/abs/2608.14979) • [🔬 Interactive 3D Simulation](https://pointreyessound.com/interactive) • [📊 Open Datasets (p1_qbescf)](https://github.com/point-reyes-sound/p1_qbescf) • [🌐 Website](https://pointreyessound.com)

---

</div>

## Overview

**Point Reyes Sound** is a theoretical and computational research pod advancing non-equilibrium kinetic transport methods for quantum chemistry and electronic structure.

Where static electronic structure encounters factorial active-space bottlenecks in multireference systems, we propagate the one-electron reduced density matrix ($\gamma$) through the **Quantum Boltzmann Equation** with a Bhatnagar-Gross-Krook (BGK) collision operator:

$$\frac{\partial \gamma}{\partial t} + \frac{i}{\hbar}[F(\gamma), \gamma] = -\frac{1}{\tau}\left(\gamma - \gamma^{(0)}[S_{\text{vN}}]\right)$$

This repository houses the production web application, the interactive WebGL/Three.js phase-space reaction engine, and the research pod portal deployed at [pointreyessound.com](https://pointreyessound.com).

## Core Architecture

- **Interactive Phase-Space Engine (`src/LandingPage.jsx`)**:
  - Diatomic potential energy curves ($\text{H}_2, \text{He}_2, \text{Li}_2, \text{C}_2, \text{N}_2, \text{O}_2$) computed via Morse potentials and BGK relaxation.
  - Joint position-momentum Wigner phase-space distributions $W(z, p_z; R)$.
  - Classical harmonic sonification mapping electronic state transitions ($s \to p \to d$) into polyphonic audio synthesis.
  - Real-space 3D electron cloud density $\rho(\mathbf{r})$ rendering.
- **Pacific Dawn Seascape (`src/PointReyesSound3DBackground.jsx`)**:
  - Procedural 3D kinetic ocean wave mesh simulating crashing Pacific surf at Point Reyes Sound.
  - Golden dawn sunrise atmospheric lighting and drifting sea-spray mist particles.
  - Sweeping beacon light from the red watchtower promontory.
- **Research Pod Portal (`src/App.jsx`)**:
  - Foundational theory overview and technical preprint spotlights (arXiv:2608.14979).
  - Research methodology pillars: Kinetic Transport & QBE-SCF ($O(N^3)$), Topological Regularization, and Phase-Space Wigner Tomography.
  - Institutional academic credentials, DOI links, and GitHub organization integration.

## Technology Stack

- **Framework**: React 19, Vite
- **3D Graphics & Shaders**: Three.js, React Three Fiber, GLSL
- **Typography & Styling**: Vanilla CSS with zero-fatigue frosted glassmorphism, EB Garamond (prose), JetBrains Mono (metrics/code), Space Grotesk (UI)
- **Acoustics**: Web Audio API synthesized harmonic oscillators

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

## Citation

```bibtex
@article{chakraborty2026qbescf,
  title={Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities},
  author={Chakraborty, Romit},
  journal={arXiv preprint arXiv:2608.14979},
  year={2026},
  doi={10.48550/arXiv.2608.14979},
  url={https://arxiv.org/abs/2608.14979}
}
```

---

<div align="center">

**Point Reyes Sound, Inc.** • Point Reyes Station, CA & Berkeley, CA  
Inquiries: [contact@pointreyessound.com](mailto:contact@pointreyessound.com)

</div>
