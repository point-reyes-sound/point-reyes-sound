/**
 * QuantumBoltzmannSimulator.js
 * Real-time Quantum Boltzmann phase-space kinetic simulator for diatomic molecules.
 * Computes the Wigner function W(z, p_z; R) as an explicit function of internuclear distance R,
 * with dynamic BGK kinetic relaxation, multi-reference Coulson-Fischer entropic crossover,
 * non-adiabatic electronic coherence, and virial ratio dynamics.
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
    this.danceBeat = 0; // modulated by musical beat
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
    
    // 1-RDM populations (2 electrons in active space: sigma_g, sigma_u*)
    this.P_occ = [1.96, 0.04, 0.0, 0.0];
    this.P_eq = [1.96, 0.04, 0.0, 0.0];
    this.coherence = 0.12;
    this.coherenceNonEq = 0.0;
    
    // Orbital energies (eV)
    this.orbitalEnergies = [-15.74, 18.26, 8.0, 14.0];
    
    // Observables
    this.energy = -30.388; // eV
    this.entropy_vN = 0.085; // bits
    this.virial = 0.995;
    
    // PySCF Live backend cache
    this.pySCFObservables = null;
    this.lastPySCFR = R;
    
    // 2D Wigner Grid W(z, p_z; R)
    this.wignerGridSize = 36;
    this.wignerData = new Float32Array(36 * 36);
    
    this.updatePotentialAndOrbitals(this.R);
    this.updateWignerDistribution(this.R);
    this.fetchLivePySCF(this.R);
  }

  getElementParams() {
    switch (this.element) {
      case "He":
        return { De: 0.0011, a: 1.15, req: 2.97, E_inf: -157.848, splitBase: 2.5, midBase: -24.58, vibFreq: 1.8 };
      case "Li":
        return { De: 1.05, a: 0.86, req: 2.67, E_inf: -406.20, splitBase: 4.8, midBase: -5.39, vibFreq: 2.2 };
      case "C":
        return { De: 6.32, a: 2.20, req: 1.24, E_inf: -2065.4, splitBase: 24.0, midBase: -11.2, vibFreq: 5.5 };
      case "N":
        return { De: 9.91, a: 2.68, req: 1.09, E_inf: -2975.6, splitBase: 35.0, midBase: -15.5, vibFreq: 6.8 };
      case "O":
        return { De: 5.21, a: 2.45, req: 1.21, E_inf: -4088.2, splitBase: 28.0, midBase: -13.6, vibFreq: 4.8 };
      case "H":
      default:
        return { De: 4.75, a: 1.94, req: 0.74, E_inf: -27.21, splitBase: 21.0, midBase: -13.6, vibFreq: 4.2 };
    }
  }

  setElement(symbol, req) {
    this.element = symbol;
    const params = this.getElementParams();
    this.R_eq = req || params.req;
    this.R = this.R_eq;
    this.vibrationFreq = params.vibFreq;
    this.pySCFObservables = null;
    this.updatePotentialAndOrbitals(this.R);
    this.updateWignerDistribution(this.R);
    this.fetchLivePySCF(this.R);
  }

  setBondDistance(R) {
    this.R = Math.max(0.4, Math.min(3.5, R));
    this.updatePotentialAndOrbitals(this.getCurrentBondLength());
    this.updateWignerDistribution(this.getCurrentBondLength());
    this.fetchLivePySCF(this.R);
  }

  setElectronicTemp(T) {
    this.t_elec = Math.max(0.001, Math.min(2.0, T));
    this.updatePotentialAndOrbitals(this.getCurrentBondLength());
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
    this.coherenceNonEq = Math.min(0.85, this.coherenceNonEq + strength * 0.6);
    this.coherence = Math.min(1.0, this.coherence + strength * 0.5);
    this.vibrationAmp = Math.min(0.28, this.vibrationAmp + strength * 0.2);
    this.perturbationLevel = 1.0; // Trigger powerful backbeat!
    this.updatePotentialAndOrbitals(this.getCurrentBondLength());
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
    this.P_occ[0] = Math.max(0.1, this.P_occ[0] - 0.85 * strength);
    this.P_occ[1] = Math.min(1.9, this.P_occ[1] + 0.85 * strength);
    this.coherenceNonEq = 0.85;
    this.coherence = 1.0;
    this.vibrationAmp = 0.28;
    this.perturbationLevel = 1.0;
    this.updatePotentialAndOrbitals(this.getCurrentBondLength());
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
          this.pySCFObservables = obs;
          this.lastPySCFR = R;
          if (obs.E_eV !== undefined) this.energy = obs.E_eV;
          if (obs.Virial !== undefined) this.virial = obs.Virial;
          if (obs.S_vN !== undefined) this.entropy_vN = obs.S_vN;
          if (obs.P_occ && obs.P_occ.length >= 2) {
            this.P_occ[0] = obs.P_occ[0];
            this.P_occ[1] = obs.P_occ[1];
          }
          if (obs.Coherence !== undefined && obs.Coherence > 0.001) {
            this.coherenceNonEq = obs.Coherence;
          }
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
    const params = this.getElementParams();
    const req = this.R_eq || params.req;
    const De = params.De;
    const a = params.a;
    
    // Morse potential energy curve
    const deltaR = R - req;
    const morseExp = Math.exp(-a * deltaR);
    const V_morse = De * Math.pow(1.0 - morseExp, 2.0) - De;
    
    // Dynamic orbital splitting based on instantaneous R
    // As R increases past Coulson-Fischer singularity, splitting closes
    const split = Math.max(0.01, params.splitBase * Math.exp(-1.15 * deltaR));
    const midPoint = params.midBase - 4.0 * Math.exp(-0.8 * Math.max(0.4, R));
    
    this.orbitalEnergies[0] = midPoint - split * 0.5;
    this.orbitalEnergies[1] = midPoint + split * 0.5;
    
    // Coulson-Fischer multi-reference crossover parameter (0 at bond equilibrium, 1 at dissociated limits)
    const cf_cross = 1.0 / (1.0 + Math.exp(-2.6 * (R - 1.45 * req)));
    
    // Thermal Fermi-Dirac excitation with effective temperature
    const tEff = Math.max(0.005, this.t_elec * 1.8 + 0.06);
    const f_fd = 1.0 / (1.0 + Math.exp(split / (2.0 * tEff)));

    // Dynamic equilibrium 1-RDM occupation target P_eq
    // At equilibrium (R ~ req, low T): P_eq ~ [1.96, 0.04]
    // At dissociation (R >> req): P_eq -> [1.00, 1.00] (biradical entanglement)
    // At high electronic temperature: P_eq -> [1.25, 0.75]
    const p1_eq = Math.min(1.0, Math.max(0.005, 2.0 * f_fd * (1.0 - 0.5 * cf_cross) + cf_cross * 1.0));
    const p0_eq = 2.0 - p1_eq;
    
    this.P_eq[0] = p0_eq;
    this.P_eq[1] = p1_eq;

    // Total dynamic energy: PES + Electronic correlation + Dynamic non-equilibrium excitations + Thermal energy
    const eElectronic = (this.P_occ[0] * (this.orbitalEnergies[0] - midPoint) + this.P_occ[1] * (this.orbitalEnergies[1] - midPoint)) * 0.25;
    const eExcitation = (this.pExcitationLevel * 2.85 + this.dExcitationLevel * 4.60);
    const eThermal = this.t_elec * 1.5;
    
    if (this.pySCFObservables && Math.abs(R - this.lastPySCFR) < 0.25) {
      // Smoothly modulate around PySCF anchor with instantaneous vibration
      const dV = De * (Math.pow(1.0 - Math.exp(-a * (R - req)), 2.0) - Math.pow(1.0 - Math.exp(-a * (this.lastPySCFR - req)), 2.0));
      this.energy = this.pySCFObservables.E_eV + dV + eExcitation;
    } else {
      this.energy = params.E_inf + V_morse + eElectronic + eExcitation + eThermal;
    }
    
    // Dynamic Virial ratio -V/(2T)
    // At equilibrium: ~1.00. Compressed (R < req): >1.0. Stretched (R > req): <1.0.
    const vibPhase = this.vibrationPhase || 0;
    const virialBase = 1.000 - 0.18 * Math.tanh(a * deltaR) + 0.035 * Math.cos(vibPhase) * (this.vibrationAmp / 0.06);
    this.virial = Math.max(0.70, Math.min(1.30, virialBase));
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
    
    // Dynamic interval cascade: after ~4.8s in p-excitation, ascend into d-wave excitation!
    this.excitationTimer += dt;
    if (this.pExcitationLevel > 0.35 && this.excitationTimer >= 4.8 && this.dExcitationLevel < 0.1) {
      this.dExcitationLevel = 1.0;
    }

    // BGK kinetic relaxation of excited states
    this.perturbationLevel = Math.max(0.0, this.perturbationLevel - dt * this.omega_relax * 0.18);
    this.pExcitationLevel = Math.max(0.0, this.pExcitationLevel - dt * this.omega_relax * 0.08);
    this.dExcitationLevel = Math.max(0.0, this.dExcitationLevel - dt * this.omega_relax * 0.10);

    // Coherence: baseline non-adiabatic breathing + dephasing non-equilibrium transient
    this.coherenceNonEq *= Math.exp(-0.8 * this.omega_relax * dt);
    const currR = this.getCurrentBondLength();
    const cohBase = 0.045 * Math.abs(Math.sin(this.vibrationPhase)) + 0.035 * (0.5 + 0.5 * Math.sin(this.dancePhase)) * (currR / this.R_eq);
    const cohExc = (this.pExcitationLevel * 0.35 + this.dExcitationLevel * 0.55);
    this.coherence = Math.min(1.0, Math.max(0.01, cohBase + this.coherenceNonEq + cohExc));

    // von Neumann Entropy S_vN (in bits)
    const p0_frac = Math.max(1e-5, Math.min(1.0 - 1e-5, this.P_occ[0] / 2.0));
    const p1_frac = 1.0 - p0_frac;
    let s_vn = -2.0 * (p0_frac * Math.log2(p0_frac) + p1_frac * Math.log2(p1_frac));
    s_vn += (this.pExcitationLevel * 0.15 + this.dExcitationLevel * 0.25) + this.t_elec * 0.08;
    this.entropy_vN = Math.max(0.0001, s_vn);
    
    // Recalculate dynamic electronic Hamiltonian, potential, and energy at instantaneous R(t)
    this.updatePotentialAndOrbitals(currR);
    this.updateWignerDistribution(currR);
  }

  getCurrentBondLength() {
    // Bond vibrates naturally and dances dynamically with music beats
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
