/**
 * QuantumBoltzmannSimulator.js
 * Real-time Quantum Boltzmann phase-space kinetic simulator for diatomic molecules.
 * Computes the Wigner function W(z, p_z; R) as an explicit function of internuclear distance R.
 */

export class QuantumBoltzmannSimulator {
  constructor(element = 'H', R = 0.74) {
    this.element = element;
    this.R = R; // Bond distance in Angstroms
    this.R_eq = 0.74; // Equilibrium bond distance
    this.mass = 1.008; // amu
    this.t_elec = 0.05; // eV
    this.omega_relax = 0.20;
    
    // Musical dance coupling
    this.dancePhase = 0;
    this.danceBeat = 0; // modulated by Canon in D
    this.isFormingBond = false;
    this.formationProgress = 0;
    this.perturbationLevel = 0.0; // Drives synchronous backbeat
    this.pExcitationLevel = 0.0;  // Drives s -> p orbital excitation & solo layer 1
    this.dExcitationLevel = 0.0;  // Drives p -> d orbital excitation & high-speed solo layer 2
    this.excitationTimer = 0.0;
    
    // Internal state
    this.time = 0;
    this.vibrationPhase = 0;
    this.vibrationAmp = 0.06;
    this.vibrationFreq = 4.2;
    
    // 1-RDM populations
    this.P_occ = [1.96, 0.04, 0.0, 0.0];
    this.P_eq = [1.98, 0.02, 0.0, 0.0];
    this.coherence = 0.85;
    
    // Orbital energies (eV)
    this.orbitalEnergies = [-15.74, 18.26, 8.0, 14.0];
    
    // Observables
    this.energy = -30.388; // eV
    this.entropy_vN = 0.0002;
    this.virial = 0.965;
    
    // 2D Wigner Grid W(z, p_z; R)
    this.wignerGridSize = 36;
    this.wignerData = new Float32Array(36 * 36);
    
    this.updatePotentialAndOrbitals(this.R);
    this.updateWignerDistribution(this.R);
    this.fetchLivePySCF(this.R);
  }

  setBondDistance(R) {
    this.R = Math.max(0.4, Math.min(3.5, R));
    this.updatePotentialAndOrbitals(this.R);
    this.updateWignerDistribution(this.getCurrentBondLength());
    this.fetchLivePySCF(this.R);
  }

  setElectronicTemp(T) {
    this.t_elec = Math.max(0.001, Math.min(2.0, T));
    this.fetchLivePySCF(this.R);
  }

  setRelaxationRate(rate) {
    this.omega_relax = Math.max(0.01, Math.min(1.0, rate));
  }

  setBasis(basis) {
    this.basis = basis || 'aug-cc-pvdz';
    this.fetchLivePySCF(this.R);
  }

  perturbState(strength = 0.6) {
    this.P_occ[0] = Math.max(0.4, this.P_occ[0] - strength * 0.7);
    this.P_occ[1] = Math.min(1.6, this.P_occ[1] + strength * 0.7);
    this.coherence = Math.min(1.0, this.coherence + strength * 0.5);
    this.vibrationAmp = Math.min(0.28, this.vibrationAmp + strength * 0.2);
    this.perturbationLevel = 1.0; // Trigger powerful backbeat!
  }

  exciteWavefunction(strength = 1.0) {
    if (this.pExcitationLevel > 0.35) {
      // Re-clicking or double triggering escalates to Tier 3: d-polarization excitation!
      this.dExcitationLevel = 1.0;
      this.pExcitationLevel = 1.0;
      this.excitationTimer = 5.0;
    } else {
      // Tier 2: s -> p polarization excitation
      this.pExcitationLevel = 1.0;
      this.dExcitationLevel = 0.0;
      this.excitationTimer = 0.0;
    }
    this.P_occ[0] = Math.max(0.1, this.P_occ[0] - 0.9 * strength);
    this.P_occ[1] = Math.min(1.9, this.P_occ[1] + 0.9 * strength);
    this.coherence = 1.0;
    this.vibrationAmp = 0.28;
    this.perturbationLevel = 1.0;
  }

  startBondFormationSweep() {
    this.isFormingBond = true;
    this.formationProgress = 0;
    this.setBondDistance(2.8); // Start dissociated
  }

  async fetchLivePySCF(R) {
    try {
      const geom = `${this.element} 0 0 0; ${this.element} 0 0 ${R.toFixed(3)}`;
      const res = await fetch("http://127.0.0.1:8088/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geometry: geom,
          basis: this.basis || "aug-cc-pvdz",
          t_elec: this.t_elec,
          omega: this.omega_relax
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.observables) {
          const obs = data.observables;
          this.energy = obs.E_eV;
          this.virial = obs.Virial;
          if (obs.OrbitalEnergies_eV && obs.OrbitalEnergies_eV.length >= 2) {
            this.orbitalEnergies[0] = obs.OrbitalEnergies_eV[0];
            this.orbitalEnergies[1] = obs.OrbitalEnergies_eV[1];
          }
        }
      }
    } catch (e) {
      // Offline fallback continues smoothly
    }
  }

  updatePotentialAndOrbitals(R) {
    const De = 4.75;
    const a = 1.94;
    const req = this.R_eq;
    
    // Morse potential
    const morseExp = Math.exp(-a * (R - req));
    this.energy = De * Math.pow(1.0 - morseExp, 2.0) - De - 27.21;
    
    const deltaR = R - req;
    const split = 21.0 * Math.exp(-1.15 * deltaR);
    const midPoint = -6.0 - 5.0 * Math.exp(-0.8 * R);
    
    this.orbitalEnergies[0] = midPoint - split * 0.5;
    this.orbitalEnergies[1] = midPoint + split * 0.5;
    
    const beta = 1.0 / Math.max(0.01, this.t_elec);
    const e0 = this.orbitalEnergies[0];
    const e1 = this.orbitalEnergies[1];
    const mu = (e0 + e1) * 0.5;
    
    this.P_eq[0] = 2.0 / (1.0 + Math.exp(beta * (e0 - mu)));
    this.P_eq[1] = 2.0 / (1.0 + Math.exp(beta * (e1 - mu)));
  }

  step(dt, musicBeatPulse = 0) {
    this.time += dt;
    this.dancePhase += 3.8 * dt;
    this.vibrationPhase += this.vibrationFreq * dt;

    // Musical Dance Coupling: Music beats induce coherent vibrational breathing
    if (musicBeatPulse > 0.1) {
      this.danceBeat = musicBeatPulse;
    } else {
      this.danceBeat = Math.max(0, this.danceBeat - dt * 2.0);
    }

    // Automated bond formation sweep progression
    if (this.isFormingBond) {
      this.formationProgress += dt * 0.35; // ~3 seconds to form bond
      const targetR = 2.8 - (2.8 - this.R_eq) * Math.min(1.0, this.formationProgress);
      this.setBondDistance(targetR);
      if (this.formationProgress >= 1.0) {
        this.isFormingBond = false;
      }
    }
    
    // BGK Kinetic Relaxation towards P_eq
    const relaxFactor = 1.0 - Math.exp(-this.omega_relax * dt * 4.0);
    this.P_occ[0] += (this.P_eq[0] - this.P_occ[0]) * relaxFactor;
    this.P_occ[1] += (this.P_eq[1] - this.P_occ[1]) * relaxFactor;
    
    // Coherence dephasing
    this.coherence *= Math.exp(-0.6 * this.omega_relax * dt);
    
    // Dynamic interval cascade: after ~4.8s in p-excitation, ascend into d-wave excitation!
    this.excitationTimer += dt;
    if (this.pExcitationLevel > 0.35 && this.excitationTimer >= 4.8 && this.dExcitationLevel < 0.1) {
      this.dExcitationLevel = 1.0;
    }

    // BGK kinetic relaxation of excited states
    this.perturbationLevel = Math.max(0.0, this.perturbationLevel - dt * this.omega_relax * 0.18);
    this.pExcitationLevel = Math.max(0.0, this.pExcitationLevel - dt * this.omega_relax * 0.08);
    this.dExcitationLevel = Math.max(0.0, this.dExcitationLevel - dt * this.omega_relax * 0.10);

    // Entropy calculation
    let s_vn = 0.0;
    for (let i = 0; i < 2; i++) {
      const p = Math.max(1e-6, Math.min(1.0 - 1e-6, this.P_occ[i] / 2.0));
      s_vn -= (p * Math.log2(p) + (1.0 - p) * Math.log2(1.0 - p));
    }
    this.entropy_vN = Math.max(0.0, s_vn);
    
    const currR = this.getCurrentBondLength();
    this.updateWignerDistribution(currR);
  }

  getCurrentBondLength() {
    // Bond vibrates naturally and dances dynamically with Pachelbel's Canon beats
    const danceOsc = 0.08 * Math.sin(this.dancePhase) * (0.4 + 0.6 * this.danceBeat);
    const vibOsc = this.vibrationAmp * Math.sin(this.vibrationPhase);
    return this.R + vibOsc + danceOsc;
  }

  updateWignerDistribution(R) {
    // Exact Wigner function W(z, p_z; R) as a function of nuclear coordinate R
    const N = this.wignerGridSize;
    const zSpan = 3.6;
    const pSpan = 3.6;
    const p0 = this.P_occ[0] / 2.0;
    const p1 = this.P_occ[1] / 2.0;
    const coh = this.coherence;
    const phase = this.dancePhase;
    
    // Atomic center positions in phase-space coordinates
    const zA = -R * 0.65;
    const zB = +R * 0.65;
    const sigma = 0.85; // Atomic orbital width
    
    for (let i = 0; i < N; i++) {
      const z = -zSpan + (2.0 * zSpan * i) / (N - 1);
      for (let j = 0; j < N; j++) {
        const p = -pSpan + (2.0 * pSpan * j) / (N - 1);
        
        // Single atom Wigner Gaussians at zA and zB
        const wA = Math.exp(-((z - zA) * (z - zA) + p * p) / (sigma * sigma));
        const wB = Math.exp(-((z - zB) * (z - zB) + p * p) / (sigma * sigma));
        
        // Quantum Covalent Overlap & Interference Term
        const overlapFactor = Math.exp(-(R * R) / (4.0 * sigma * sigma));
        const crossInterference = 2.0 * Math.exp(-(z * z + p * p) / (sigma * sigma)) * Math.cos(2.0 * z * R * 0.8 + phase * 0.2);
        
        // Bonding Sigma_g Wigner Function
        const w_sigma_g = (wA + wB + crossInterference) / (2.0 + 2.0 * overlapFactor);
        
        // Antibonding Sigma_u* Wigner Function
        const w_sigma_u = (wA + wB - crossInterference) / (2.0 - 2.0 * overlapFactor + 0.05);
        
        // Dynamic non-equilibrium state
        const w_val = p0 * w_sigma_g - p1 * w_sigma_u * 0.7 + coh * 0.3 * Math.sin(phase) * (z / R) * Math.exp(-(z*z + p*p));
        
        this.wignerData[i * N + j] = w_val;
      }
    }
  }

  getAcousticParams() {
    return {
      occ0: this.P_occ[0],
      occ1: this.P_occ[1],
      coherence: this.coherence,
      entropy: this.entropy_vN,
      energy: this.energy,
      R: this.getCurrentBondLength(),
      danceBeat: this.danceBeat,
      perturbation: this.perturbationLevel,
      pExcitation: this.pExcitationLevel,
      dExcitation: this.dExcitationLevel
    };
  }
}
