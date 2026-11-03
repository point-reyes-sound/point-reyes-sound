# Papers With Code & Hugging Face Submission Dossier

**Target Platform**: [Papers With Code](https://paperswithcode.com) / Hugging Face Datasets & Papers
**Paper Title**: *Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities*
**arXiv Identifier**: [`arXiv:2608.14979`](https://arxiv.org/abs/2608.14979)
**Zenodo DOI**: [`10.5281/zenodo.21940451`](https://doi.org/10.5281/zenodo.21940451)
**Code Repository**: [`point-reyes-sound/p1_qbescf`](https://github.com/point-reyes-sound/p1_qbescf)

---

## 1. Paper Details to Submit
- **URL**: `https://arxiv.org/abs/2608.14979`
- **Title**: Quantum Boltzmann Equation Self-Consistent-Field for the Entropic Regularization of Mean-Field Singularities
- **Authors**: Romit Chakraborty
- **Abstract**:
  Traditional mean-field electronic structure methods suffer from catastrophic unphysical symmetry breaking, derivative discontinuities, and SCF convergence divergence at Coulson-Fischer points and conical intersections. Multi-reference active space configurations (CASSCF) scale factorially ($O(e^N)$), precluding larger multimetallic and strongly correlated molecular complexes. We present the Quantum Boltzmann Equation Self-Consistent Field (QBE-SCF) framework, which replaces static diagonalization with continuous Bhatnagar-Gross-Krook (BGK) kinetic relaxation of the one-electron reduced density matrix (1-RDM). Modulated by the Fiedler algebraic connectivity of the orbital interaction graph, QBE-SCF achieves deterministic polynomial $O(N^3)$ computational scaling, strictly preserving $[\mathbf{F}, \mathbf{P}] = 0$ while smoothly traversing singular cusps with positive semi-definite orbital Hessians.

---

## 2. Tasks & Categories
Assign the paper to the following Papers With Code tasks:
1. **Quantum Chemistry** (`/task/quantum-chemistry`)
2. **Electronic Structure Simulation** (`/task/electronic-structure`)
3. **Molecular Dynamics & Bond Dissociation** (`/task/molecular-dynamics`)
4. **Strongly Correlated Electron Systems** (`/task/strongly-correlated-systems`)

---

## 3. Benchmarks & Evaluation Datasets
Register the following benchmark results from Zenodo dataset `10.5281/zenodo.21940451`:

### Benchmark: Symmetric H3 Dissociation (Coulson-Fischer Singularity)
| Method | Scaling | C^1 Continuity Across Cusp | Commutator Residual Norm |
| :--- | :--- | :--- | :--- |
| RHF / UHF | $O(N^3) / O(N^4)$ | Discontinuous cusp / Symmetry broken | Divergent / Non-zero |
| CASSCF(3e, 3o) | $O(\binom{M}{N})$ | Continuous (Active-space dependent) | Machine precision |
| **QBE-SCF (p1_qbescf)** | **$O(N^3)$** | **Continuous ($C^1$ smooth, GVB limit)** | **$< 10^{-10}$** |

### Benchmark: BeH2 Insertion Path (Avoided Crossing / Conical Intersection)
| Method | Avoided Crossing Traversal | Orbital Hessian Stability |
| :--- | :--- | :--- |
| RHF | Oscillates / Diverges | Negative eigenvalue (saddle point) |
| CASSCF | Requires manual state averaging | Semi-definite (conditioned on CAS) |
| **QBE-SCF (p1_qbescf)** | **Autonomous smooth traversal** | **Strictly positive semi-definite** |

---

## 4. How to Submit
1. Navigate to https://paperswithcode.com/paper/new
2. Enter arXiv ID: `2608.14979`
3. Link GitHub repository: `https://github.com/point-reyes-sound/p1_qbescf`
4. Tag tasks: `Quantum Chemistry`, `Electronic Structure Simulation`.
