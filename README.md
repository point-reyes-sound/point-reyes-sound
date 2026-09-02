# Point Reyes Sound

Web application for quantum kinetic simulation, molecular bond dynamics, and phase-space sonification.

## Overview

The platform couples quantum kinetic transport calculations with audio synthesis to model diatomic systems ($\text{H}_2, \text{He}_2, \text{Li}_2, \text{C}_2, \text{N}_2, \text{O}_2$):

- **Quantum Boltzmann Solver**: Computes Morse potential curves, BGK relaxation, 2D Wigner distributions $W(z, p_z; R)$, non-adiabatic coherence, and von Neumann entropy $S_{\text{vN}}$.
- **Acoustic Engine**: Synthesizes polyphonic compositions mapped to electronic state transitions ($s \to p \to d$), driving spectral analyzers for ground and excited states.
- **Molecular Visualization**: Renders electron density $\rho(\mathbf{r})$, orbital geometry, and internuclear distance $R$ in 3D.

## Stack

- **Frontend**: React, Vite, Three.js, React Three Fiber
- **Audio**: Web Audio API
- **Simulation**: Quantum Boltzmann kinetic engine with PySCF integration

## Development

```bash
# Install dependencies
npm install

# Start local server
npm run dev

# Build production bundle
npm run build
```
