<div align="center">

<img src="https://raw.githubusercontent.com/point-reyes-sound/.github/main/profile/assets/prs_org_banner.svg" alt="Point Reyes Sound, Inc." width="100%" />

<br />

# POINT REYES SOUND

### Continuous Phase-Space Kinetics for Strongly Correlated Electrons

[![Preprint: arXiv:2608.14979](https://img.shields.io/badge/Preprint-arXiv%3A2608.14979-B31B1B.svg?style=flat-square)](https://arxiv.org/abs/2608.14979)
[![Platform: pointreyessound.com](https://img.shields.io/badge/Platform-pointreyessound.com-0284c7.svg?style=flat-square)](https://pointreyessound.com)
[![Interactive Engine: 3D Simulator](https://img.shields.io/badge/Interactive-Quantum%20Gas%203D-0d9488.svg?style=flat-square)](https://pointreyessound.com/interactive)
[![Open Data: p1_qbescf](https://img.shields.io/badge/Data%20Suite-CC%20BY%204.0-334155.svg?style=flat-square)](https://github.com/point-reyes-sound/p1_qbescf)

---

### [📄 Research Preprint](https://arxiv.org/abs/2608.14979) • [🔬 3D Quantum Gas Simulator](https://pointreyessound.com/interactive) • [📊 Open Numerical Benchmarks](https://github.com/point-reyes-sound/p1_qbescf) • [🌐 Company Platform](https://pointreyessound.com)

---

</div>

## Overview

**Point Reyes Sound, Inc.** is a theoretical research pod and deep-tech software laboratory developing non-equilibrium phase-space kinetic transport methods for quantum chemistry, materials discovery, and electronic structure.

In strongly correlated systems—such as transition metal catalytic complexes, singlet fission materials, and battery electrode interfaces—conventional electronic structure methods stall:
1. **Mean-Field Solvers (HF, standard DFT)** suffer catastrophic variational collapse, unphysical Coulson-Fischer symmetry breaking, and divergence at conical intersections.
2. **Multireference Methods (CASSCF, CASPT2, FCI, DMRG)** require active-space selection that scales factorially $\mathcal{O}(N!)$ or exponentially $\mathcal{O}(e^N)$, restricting rigorous quantum simulations to small molecular fragments.

Point Reyes Sound solves this bottleneck through **Quantum Boltzmann Equation Self-Consistent Field (QBE-SCF)** theory: propagating the one-electron reduced density matrix ($\gamma$) in continuous phase space via non-equilibrium Bhatnagar-Gross-Krook (BGK) collision relaxation, achieving **deterministic $\mathcal{O}(N^3)$ polynomial scaling** while rigorously preserving state symmetry and regularizing topological singularities.

---

## Method & System Profile

| Specification | Conventional Electronic Structure (HF / CASSCF / DMRG) | Point Reyes Sound (QBE-SCF / Q-BOLTZ) |
| :--- | :--- | :--- |
| **Mathematical Formulation** | Static iterative diagonalization of non-linear Fock operator ($F C = S C \epsilon$). | Time-dependent propagation of the 1-RDM via the Quantum Boltzmann Equation with BGK collision relaxation. |
| **Computational Complexity** | Polynomial $\mathcal{O}(N^3)$ for single-reference (broken symmetry); Factorial $\mathcal{O}(N!)$ for multireference active spaces. | **Rigorous polynomial $\mathcal{O}(N^3)$** throughout bond breaking, conical intersections, and transition states. |
| **Symmetry Preservation** | Forces artificial symmetry breaking (spin contamination) to reach correct dissociation energies. | **Preserves total spin and spatial symmetry**; maintains pure quantum states throughout reaction coordinates. |
| **Singularity Handling** | Fock operator diverges or becomes ill-conditioned near non-adiabatic seams and degeneracies. | **Entropic regularization** via Von Neumann entropy maximization smoothly bridges topological singularities. |
| **Phase-Space Diagnostic** | Pure coordinate-space orbitals $\psi_i(\mathbf{r})$ with obscure momentum correlation. | **Direct continuous Wigner tomography** $W(z, p_z; R)$, visualizing delocalization and non-equilibrium electron transport. |

---

## The QBE-SCF Governing Equation

The core continuous phase-space transport engine evolves the one-electron reduced density matrix $\gamma(t)$ according to:

$$\frac{\partial \gamma}{\partial t} + \frac{i}{\hbar}[F(\gamma), \gamma] = -\frac{1}{\tau}\left(\gamma - \gamma^{(0)}[S_{\text{vN}}]\right)$$

* Where $F(\gamma)$ is the self-consistent Fockian constructed from the instantaneous one-particle density matrix.
* $\gamma^{(0)}[S_{\text{vN}}]$ is the target reference state obtained by maximizing the Von Neumann configuration entropy $S_{\text{vN}} = -\text{Tr}(\gamma \ln \gamma)$ subject to particle-number and trace constraints.
* $\tau$ is the characteristic kinetic relaxation time governing the non-equilibrium dissipative flow toward physical equilibrium.

---

## Core Repositories & Data Suites

> [!IMPORTANT]
> **Proprietary Technology & IP Notice**: Point Reyes Sound's core Q-BOLTZ™ and QBE-SCF continuous phase-space kinetic transport solver engine, high-performance backends, and proprietary algorithms are closed-source commercial IP. Public repositories host open-access reproduction datasets, potential energy surfaces, and demonstration interfaces to support scientific transparency without exposing solver internals.


* ### [`point-reyes-sound/point-reyes-sound`](https://github.com/point-reyes-sound/point-reyes-sound)
  *The Core Research Platform & 3D Interactive Reaction Chamber*
  * High-performance React + Three.js + WebGL interactive 3D simulation of molecular dissociation and non-equilibrium transport.
  * Real-time phase-locked acoustic sonification engine mapping molecular vibrational-kinetic states to harmonic audio.
  * Deployed live at [pointreyessound.com](https://pointreyessound.com).

* ### [`point-reyes-sound/p1_qbescf`](https://github.com/point-reyes-sound/p1_qbescf)
  *Open Numerical Data Suite & Validation Benchmarks for arXiv:2608.14979*
  * Raw potential energy curves, dissociation trajectories, and natural orbital occupancy data:
    * $\text{H}_2$ Coulson-Fischer dissociation curve without unphysical spin symmetry breaking.
    * $\text{H}_3$ $D_{3h}$ symmetric stretch and natural orbital configuration entropy.
    * $\text{H}_4$ rectangular scan and non-adiabatic Berry phase loops.
    * $\text{BeH}_2$ conical intersection entropic regularization profiles.
  * Released under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

---

## Scientific Publications & Preprints

If you utilize Point Reyes Sound kinetic solvers, Wigner distributions, or benchmark datasets in academic or industrial research, please cite:

```bibtex
@article{chakraborty2026qbescf,
  title={Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities},
  author={Chakraborty, Romit},
  journal={arXiv preprint arXiv:2608.14979},
  year={2026},
  eprint={2608.14979},
  archivePrefix={arXiv},
  primaryClass={physics.chem-ph},
  doi={10.48550/arXiv.2608.14979},
  url={https://arxiv.org/abs/2608.14979}
}
```

---

<div align="center">

**Point Reyes Sound, Inc.**  
Point Reyes Station, CA &amp; Berkeley, CA  
Inquiries, Enterprise Pilots &amp; Research Partnerships: [directors@pointreyessound.com](mailto:directors@pointreyessound.com) • [pointreyessound.com](https://pointreyessound.com)

</div>
