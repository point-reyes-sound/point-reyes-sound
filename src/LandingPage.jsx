import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { QuantumBoltzmannSimulator } from "./physics/QuantumBoltzmannSimulator";
import { QuantumSonificationEngine } from "./physics/QuantumSonificationEngine";
import "./LandingPage.css";

const ELEMENTS = [
  { num: 1, symbol: "H", name: "Hydrogen", color: "#35ff82", row: 1, radius: 0.53, desc: "H₂ Singlet Covalent Bond (Req = 0.74 Å)" },
  { num: 2, symbol: "He", name: "Helium", color: "#64c8ff", row: 1, radius: 0.31, desc: "He₂ Van der Waals Dimer" },
  { num: 3, symbol: "Li", name: "Lithium", color: "#ff6464", row: 2, radius: 1.67, desc: "Li₂ Metallic Singlet Dimer" },
  { num: 6, symbol: "C", name: "Carbon", color: "#c8c8c8", row: 2, radius: 0.67, desc: "C₂ Multireference Quadruple Character" },
  { num: 7, symbol: "N", name: "Nitrogen", color: "#9696ff", row: 2, radius: 0.56, desc: "N₂ Strong Correlation Triple Bond" },
  { num: 8, symbol: "O", name: "Oxygen", color: "#ff6496", row: 2, radius: 0.48, desc: "O₂ Diradical Triplet Ground State" }
];

// Animated 3D Moving P-Wave Logo Slider Seeker Component
function PWaveSlider({ min, max, step, value, onChange, className = "" }) {
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`pwave-slider-wrap ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="pwave-native-range"
      />
      <div 
        className="pwave-seeker-node"
        style={{ left: `calc(${percent}% - 11px)` }}
      >
        <svg className="pwave-seeker-svg" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" fill="#020904" stroke="rgba(53, 255, 130, 0.45)" strokeWidth="1.2"/>
          {/* Blue positive p-wave lobe */}
          <ellipse className="pwave-lobe-blue" cx="16" cy="9.5" rx="4.8" ry="6.2" fill="#2563eb"/>
          {/* Red negative p-wave lobe */}
          <ellipse className="pwave-lobe-red" cx="16" cy="22.5" rx="4.8" ry="6.2" fill="#dc2626"/>
          {/* Gold Nodal Ring */}
          <ellipse className="pwave-nodal-ring" cx="16" cy="16" rx="7.8" ry="2.0" stroke="#f59e0b" strokeWidth="1.8" fill="none"/>
          {/* Helical phase-space transport strands */}
          <path className="pwave-helix-1" d="M10 8 Q16 16 22 24" stroke="#35ff82" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" fill="none"/>
          <path className="pwave-helix-2" d="M22 8 Q16 16 10 24" stroke="#64c8ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" fill="none"/>
        </svg>
      </div>
    </div>
  );
}

// Single element spinning orbital for palette
function ElementPreviewCloud({ color, radius }) {
  const meshRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.8;
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius * 1.05, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.65}
        roughness={0.2}
        metalness={0.8}
        transparent={true}
        opacity={0.85}
      />
    </mesh>
  );
}

// 3D Diatomic Molecule with Shared Orbital Cloud & Vibrating Nuclei
function DiatomicMolecularSystem({ simulator, activeElement }) {
  const groupRef = useRef();
  const atom1Ref = useRef();
  const atom2Ref = useRef();
  const bondCloudRef = useRef();
  const atomCloud1Ref = useRef();
  const atomCloud2Ref = useRef();
  const antibondRef = useRef();
  const dWaveRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!simulator) return;

    const currentR = simulator.getCurrentBondLength();
    const halfR = currentR * 1.35; // Visual coordinate scaling

    if (atom1Ref.current) atom1Ref.current.position.x = -halfR;
    if (atom2Ref.current) atom2Ref.current.position.x = halfR;
    if (atomCloud1Ref.current) atomCloud1Ref.current.position.x = -halfR;
    if (atomCloud2Ref.current) atomCloud2Ref.current.position.x = halfR;

    if (groupRef.current) {
      // Gentle orbital spin modulated by music dance
      groupRef.current.rotation.y = t * 0.3 + simulator.dancePhase * 0.15;
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.12;
    }

    // Shared Covalent Bonding Cloud (Concentrates at center when R is small)
    if (bondCloudRef.current) {
      const isBonded = Math.max(0, 1.0 - (currentR - 0.74) / 1.5);
      const scaleX = currentR * 1.1 + 0.4;
      const scaleY = (0.9 + 0.25 * Math.sin(simulator.dancePhase)) * (0.5 + 0.5 * isBonded);
      bondCloudRef.current.scale.set(scaleX, scaleY, scaleY);
      bondCloudRef.current.material.opacity = 0.75 * isBonded;
    }

    // Atomic Localized Clouds (Dominant when dissociated at large R)
    const isDissociated = Math.min(1.0, Math.max(0, (currentR - 1.1) / 1.2));
    if (atomCloud1Ref.current) {
      atomCloud1Ref.current.material.opacity = 0.15 + 0.65 * isDissociated;
    }
    if (atomCloud2Ref.current) {
      atomCloud2Ref.current.material.opacity = 0.15 + 0.65 * isDissociated;
    }

    // Antibonding Nodal Torus (Grows when p-excited)
    if (antibondRef.current) {
      const p1 = simulator.P_occ[1] / 2.0;
      const pExc = simulator.pExcitationLevel || 0.0;
      antibondRef.current.material.opacity = 0.05 + 0.6 * p1 + 0.4 * pExc;
      antibondRef.current.scale.set(1 + p1 * 0.4 + pExc * 0.3, 1 + p1 * 0.4 + pExc * 0.3, 1 + p1 * 0.4 + pExc * 0.3);
    }

    // d-Wave Polarization Quadrupole Structure (Illuminates in Tier 3 d-excitation)
    if (dWaveRef.current) {
      const dExc = simulator.dExcitationLevel || 0.0;
      dWaveRef.current.material.opacity = Math.max(0.0, dExc * 0.85);
      dWaveRef.current.rotation.z += 0.035;
      dWaveRef.current.rotation.x += 0.025;
      dWaveRef.current.scale.set(1 + dExc * 0.5, 1 + dExc * 0.5, 1 + dExc * 0.5);
    }
  });

  const elColor = activeElement?.color || "#35ff82";

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.65} />
      <pointLight position={[5, 5, 5]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={0.9} color={elColor} />

      {/* Nucleus 1 (Proton) */}
      <mesh ref={atom1Ref} position={[-1, 0, 0]}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={elColor}
          emissiveIntensity={0.85}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Nucleus 2 (Proton) */}
      <mesh ref={atom2Ref} position={[1, 0, 0]}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={elColor}
          emissiveIntensity={0.85}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Localized 1s Atomic Clouds (Visible at larger R) */}
      <mesh ref={atomCloud1Ref} position={[-1, 0, 0]}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color={elColor}
          emissive={elColor}
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={atomCloud2Ref} position={[1, 0, 0]}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color={elColor}
          emissive={elColor}
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Bonding Sigma_g Orbital Probability Cloud (Emerald Delocalized Lobe) */}
      <mesh ref={bondCloudRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.05, 48, 48]} />
        <meshStandardMaterial
          color={elColor}
          emissive={elColor}
          emissiveIntensity={0.75}
          transparent={true}
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          roughness={0.25}
        />
      </mesh>

      {/* Antibonding Sigma_u* / p-Wave Nodal Structure */}
      <mesh ref={antibondRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.45, 0.22, 16, 64]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.8}
          transparent={true}
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* d-Wave Polarization Quadrupole Torus (Tier 3 Excitation) */}
      <mesh ref={dWaveRef} position={[0, 0, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <torusGeometry args={[1.85, 0.16, 16, 64]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={1.2}
          transparent={true}
          opacity={0.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function LandingPage() {
  const [activeElement, setActiveElement] = useState(ELEMENTS[0]);
  const [moleculeName, setMoleculeName] = useState("H₂");
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [bondDistance, setBondDistance] = useState(0.74);
  const [temperature, setTemperature] = useState(0.05);
  const [relaxationRate, setRelaxationRate] = useState(0.20);
  const [basisSet, setBasisSet] = useState("aug-cc-pvdz");
  const [bondStateStatus, setBondStateStatus] = useState("COVALENT BOND (Equilibrium)");

  const [telemetry, setTelemetry] = useState({
    E: -30.388,
    R: 0.74,
    P0: 1.96,
    P1: 0.04,
    SvN: 0.0002,
    coherence: 0.85,
    virial: 0.965,
    pExcitation: 0.0,
    dExcitation: 0.0
  });

  const simRef = useRef(null);
  const audioRef = useRef(null);
  const wignerCanvasRef = useRef(null);
  const scopeCanvasRef = useRef(null);
  const excitedScopeCanvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    simRef.current = new QuantumBoltzmannSimulator("H", 0.74);
    audioRef.current = new QuantumSonificationEngine();

    // Auto-activate audio on mount (with browser interaction unlock)
    const startLiveAudio = () => {
      if (audioRef.current && !audioRef.current.isPlaying) {
        audioRef.current.start();
        setIsAudioActive(true);
      }
    };

    // Attempt direct start
    startLiveAudio();

    // Browser autoplay unlock listeners
    const unlockAudio = () => {
      startLiveAudio();
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (audioRef.current) audioRef.current.stop();
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const handleSelectElement = (el) => {
    setActiveElement(el);
    const molName = `${el.symbol}₂`;
    setMoleculeName(molName);
    const req = el.symbol === "H" ? 0.74 : el.symbol === "N" ? 1.09 : el.symbol === "O" ? 1.21 : 1.5;
    setBondDistance(req);
    
    if (simRef.current) {
      simRef.current.element = el.symbol;
      simRef.current.R_eq = req;
      simRef.current.setBondDistance(req);
      simRef.current.perturbState(0.4);
    }
  };

  const handleDragStart = (e, element) => {
    e.dataTransfer.setData("element", JSON.stringify(element));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("element");
    if (data) {
      const el = JSON.parse(data);
      handleSelectElement(el);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    const active = audioRef.current.toggle();
    setIsAudioActive(active);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.setVolume(val);
  };

  const handleBondChange = (e) => {
    const rVal = parseFloat(e.target.value);
    setBondDistance(rVal);
    if (simRef.current) simRef.current.setBondDistance(rVal);
  };

  const handleTempChange = (e) => {
    const tVal = parseFloat(e.target.value);
    setTemperature(tVal);
    if (simRef.current) simRef.current.setElectronicTemp(tVal);
  };

  const handleRelaxChange = (e) => {
    const rate = parseFloat(e.target.value);
    setRelaxationRate(rate);
    if (simRef.current) simRef.current.setRelaxationRate(rate);
  };

  const handleBasisChange = (e) => {
    const b = e.target.value;
    setBasisSet(b);
    if (simRef.current) {
      simRef.current.setBasis(b);
    }
  };

  const handlePerturb = () => {
    if (simRef.current) {
      simRef.current.perturbState(0.75);
    }
  };

  const handleExciteWavefunction = () => {
    if (simRef.current) {
      simRef.current.exciteWavefunction(1.0);
    }
  };

  const handleAnimateBondFormation = () => {
    if (simRef.current) {
      simRef.current.startBondFormationSweep();
      if (!isAudioActive && audioRef.current) {
        audioRef.current.start();
        setIsAudioActive(true);
      }
    }
  };

  // Main real-time simulation loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000.0);
      lastTime = currentTime;

      if (simRef.current && audioRef.current) {
        const acousticParams = simRef.current.getAcousticParams();
        audioRef.current.update(dt, acousticParams);
        
        // Pass audio beat pulse to simulator to drive synchronized dance
        const beatPulse = audioRef.current.quantumBeatPulse;
        simRef.current.step(dt, beatPulse);

        const currentR = simRef.current.getCurrentBondLength();

        // Update bond formation state description
        if (currentR > 1.9) {
          setBondStateStatus("DISSOCIATED ATOMS (Two Separate Localized Orbitals)");
        } else if (currentR > 1.1) {
          setBondStateStatus("TRANSITION REGIME (Overlapping 1s Wavefunctions)");
        } else {
          setBondStateStatus("COVALENT BOND FORMED (Constructive Shared Density Peak)");
        }

        setTelemetry({
          E: simRef.current.energy,
          R: currentR,
          P0: simRef.current.P_occ[0],
          P1: simRef.current.P_occ[1],
          SvN: simRef.current.entropy_vN,
          coherence: simRef.current.coherence,
          virial: simRef.current.virial,
          pExcitation: simRef.current.pExcitationLevel || 0.0,
          dExcitation: simRef.current.dExcitationLevel || 0.0
        });

        // Render 2D Wigner Canvas
        renderWignerPlot(simRef.current);

        // Render Audio Oscilloscope / Spectrum
        renderAudioVisualizer();
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Ocean Blue Color Lookup Helper with smooth transitions
  const getOceanBlueColor = (val) => {
    if (val >= 0) {
      // Ocean Blue Constructive Scale: Deep Navy -> Sapphire -> Cyan -> Glacial White
      const t = Math.min(1.0, val * 1.25);
      if (t < 0.3) {
        const u = t / 0.3;
        return [
          Math.floor(3 + 12 * u),
          Math.floor(14 + 40 * u),
          Math.floor(30 + 80 * u)
        ]; // #030e1e -> #0f366e
      } else if (t < 0.7) {
        const u = (t - 0.3) / 0.4;
        return [
          Math.floor(15 + 40 * u),
          Math.floor(54 + 135 * u),
          Math.floor(110 + 138 * u)
        ]; // #0f366e -> #37bdf8 (Electric Cyan)
      } else {
        const u = (t - 0.7) / 0.3;
        return [
          Math.floor(55 + 180 * u),
          Math.floor(189 + 60 * u),
          Math.floor(248 + 7 * u)
        ]; // #37bdf8 -> #eaf9ff (Glacial Ice)
      }
    } else {
      // Quantum Interference Negative Scale: Deep Violet -> Royal Magenta -> Coral
      const t = Math.min(1.0, -val * 1.6);
      return [
        Math.floor(30 + 190 * t),
        Math.floor(8 + 35 * t),
        Math.floor(45 + 50 * t)
      ];
    }
  };

  // 2D Wigner Function Renderer with Bilinear Interpolation & Ocean Blue Heatmap
  const renderWignerPlot = (sim) => {
    const canvas = wignerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const N = sim.wignerGridSize;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    const grid = sim.wignerData;
    const scaleX = (N - 1) / w;
    const scaleY = (N - 1) / h;

    // Bilinear Interpolation across pixels
    for (let py = 0; py < h; py++) {
      const gy = py * scaleY;
      const y0 = Math.floor(gy);
      const y1 = Math.min(N - 1, y0 + 1);
      const fy = gy - y0;

      for (let px = 0; px < w; px++) {
        const gx = px * scaleX;
        const x0 = Math.floor(gx);
        const x1 = Math.min(N - 1, x0 + 1);
        const fx = gx - x0;

        // Bilinear sample
        const v00 = grid[x0 * N + y0];
        const v10 = grid[x1 * N + y0];
        const v01 = grid[x0 * N + y1];
        const v11 = grid[x1 * N + y1];

        const val = (1 - fx) * (1 - fy) * v00 +
                    fx * (1 - fy) * v10 +
                    (1 - fx) * fy * v01 +
                    fx * fy * v11;

        const [r, g, b] = getOceanBlueColor(val);
        const idx = (py * w + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw Subtle Coordinate Crosshairs (z=0, p_z=0)
    ctx.strokeStyle = "rgba(100, 200, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    // Vertical z=0 axis
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    // Horizontal p_z=0 axis
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Audio Oscilloscope & Frequency Spectrum Visualizer (Ground in Green, Excited in Magenta/Violet)
  const renderAudioVisualizer = () => {
    if (!audioRef.current) return;
    const { freq, wave, excitedFreq, excitedWave } = audioRef.current.getVisualizerData();

    // 1. Ground Field Spectrum (Emerald Green)
    const groundCanvas = scopeCanvasRef.current;
    if (groundCanvas) {
      const ctx = groundCanvas.getContext("2d");
      ctx.fillStyle = "rgba(4, 11, 7, 0.4)";
      ctx.fillRect(0, 0, groundCanvas.width, groundCanvas.height);

      // Green ground frequency bars
      const barWidth = groundCanvas.width / freq.length;
      for (let i = 0; i < freq.length; i++) {
        const barHeight = (freq[i] / 255.0) * (groundCanvas.height * 0.72);
        ctx.fillStyle = `rgba(53, 255, 130, ${0.3 + (freq[i] / 255.0) * 0.7})`;
        ctx.fillRect(i * barWidth, groundCanvas.height - barHeight, barWidth - 1, barHeight);
      }

      // Green ground waveform
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "#35ff82";
      ctx.beginPath();
      const sliceWidth = groundCanvas.width / wave.length;
      let x = 0;
      for (let i = 0; i < wave.length; i++) {
        const v = wave[i] / 128.0;
        const y = (v * groundCanvas.height) / 2.0;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    }

    // 2. Excited Field Spectrum (Magenta/Violet s -> p transition plot)
    const excCanvas = excitedScopeCanvasRef.current;
    if (excCanvas && excitedFreq) {
      const ctx = excCanvas.getContext("2d");
      ctx.fillStyle = "rgba(10, 4, 15, 0.45)";
      ctx.fillRect(0, 0, excCanvas.width, excCanvas.height);

      // Magenta/Violet frequency bars
      const barWidth = excCanvas.width / excitedFreq.length;
      for (let i = 0; i < excitedFreq.length; i++) {
        const barHeight = (excitedFreq[i] / 255.0) * (excCanvas.height * 0.75);
        ctx.fillStyle = `rgba(192, 132, 252, ${0.35 + (excitedFreq[i] / 255.0) * 0.65})`;
        ctx.fillRect(i * barWidth, excCanvas.height - barHeight, barWidth - 1, barHeight);
      }

      // Electric Cyan solo waveform
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      const sliceWidth = excCanvas.width / (excitedWave ? excitedWave.length : 128);
      let x = 0;
      if (excitedWave) {
        for (let i = 0; i < excitedWave.length; i++) {
          const v = excitedWave[i] / 128.0;
          const y = (v * excCanvas.height) / 2.0;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      }
      ctx.stroke();
    }
  };

  return (
    <div className="phi-quest-container">
      {/* Top Header */}
      <header className="phi-header">
        <div className="phi-title-group">
          <div className="phi-badge">MULTIMODAL CHEMICAL WORLD</div>
          <p className="phi-subtitle">
            Quantum kinetic transport, molecular bond dynamics, and phase-locked harmonic sonification.
          </p>
        </div>
      </header>

      {/* Interactive Element Palette Row */}
      <div className="element-strip-container">
        <div className="strip-title">SELECT OR DRAG ATOM INTO REACTION CHAMBER:</div>

        <div className="element-strip-wrapper">
          {/* Strictly Centered Element Tiles */}
          <div className="element-strip">
            {ELEMENTS.map((el) => (
              <div
                key={el.num}
                className={`element-tile ${activeElement.symbol === el.symbol ? 'active' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, el)}
                onClick={() => handleSelectElement(el)}
                style={{ '--tile-color': el.color }}
              >
                <div className="tile-3d-preview">
                  <Canvas camera={{ position: [0, 0, 3] }}>
                    <ElementPreviewCloud color={el.color} radius={el.radius * 0.9} />
                  </Canvas>
                </div>
                <div className="tile-symbol" style={{ color: el.color }}>{el.symbol}</div>
                <div className="tile-name">{el.name}</div>
              </div>
            ))}
          </div>

          {/* Master Audio Control Hub (Rendered next to centered elements, larger play button) */}
          <div className="audio-control-hub inline-hub">
            <button 
              className={`audio-toggle-btn icon-only-btn ${isAudioActive ? 'active' : ''}`}
              onClick={toggleAudio}
              title={isAudioActive ? "Pause Music" : "Play Music"}
            >
              {isAudioActive ? "⏸" : "▶"}
            </button>
            
            <div className="volume-slider-group">
              <span className="vol-label">VOL</span>
              <PWaveSlider 
                min={0} 
                max={1} 
                step={0.01} 
                value={volume} 
                onChange={handleVolumeChange} 
                className="vol-pwave-slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Symmetrical Simulation Visualizers (3D Real-Space & 2D Phase-Space) */}
      <div className="main-chamber-grid">
        {/* Left: Real-Space Molecular System */}
        <div className="chamber-card viewport-card">
          <div className="card-top-bar">
            <div className="card-tag">REAL-SPACE DENSITY ρ(r) [R = {telemetry.R.toFixed(2)} Å]</div>
            <span className="status-tag status-regime-tag">{bondStateStatus}</span>
          </div>

          <div className="spatial-canvas-container">
            <Canvas camera={{ position: [0, 0, 4.6], fov: 45 }}>
              <DiatomicMolecularSystem 
                simulator={simRef.current} 
                activeElement={activeElement} 
              />
            </Canvas>
          </div>
          <div className="wigner-caption">
            Real-space electronic probability density and dynamic orbital polarization.
          </div>
        </div>

        {/* Right: Phase-Space Wigner Function W(z, p_z; R) */}
        <div className="chamber-card wigner-card">
          <div className="card-top-bar">
            <div className="card-tag">WIGNER FUNCTION W(z, p_z) [R = {telemetry.R.toFixed(2)} Å]</div>
            <span className="wigner-legend">
              <span className="legend-ocean">■ Constructive</span>
              <span className="legend-magenta">■ Destructive</span>
            </span>
          </div>
          <div className="wigner-canvas-wrapper">
            <canvas ref={wignerCanvasRef} width={520} height={200} className="wigner-canvas" />
          </div>
          <div className="wigner-caption">
            {telemetry.R > 1.6 
              ? "Bimodal localized Gaussians: Unbonded atomic limit at ±R/2." 
              : "Merged central Wigner peak: Quantum coherence across the covalent bond."}
          </div>
        </div>
      </div>

      {/* Row 2: Symmetrical Controls & Observables */}
      <div className="main-chamber-grid controls-observables-grid">
        {/* Left: Interactive Perturbation & Slider Controls */}
        <div className="chamber-card controls-card">
          <div className="card-top-bar">
            <div className="card-tag">QUANTUM CHAMBER CONTROLS & BASIS</div>
            <span className="mol-badge" style={{ color: activeElement.color }}>
              {moleculeName} ({activeElement.desc})
            </span>
          </div>

          <div className="chamber-controls-bar">
            {/* Top Row: Centered Excite Button */}
            <div className="controls-action-top">
              <button 
                className={`excite-btn ${telemetry.dExcitation > 0.05 ? 'd-active' : telemetry.pExcitation > 0.05 ? 'p-active' : ''}`} 
                onClick={handleExciteWavefunction} 
                title="Excite s -> p -> d multi-tier quantum transitions and play phase-locked virtuoso Canon in D solo lines"
              >
                <span className="btn-icon">◈</span> {telemetry.dExcitation > 0.05 ? "Excite (d-Wave Solo 2)" : telemetry.pExcitation > 0.05 ? "Excite (p-Wave Solo 1)" : "Excite"}
              </button>
            </div>

            {/* Middle Row: Sliders & Basis Selector */}
            <div className="controls-row-top">
              <div className="control-slider-group">
                <label>R: <strong>{telemetry.R.toFixed(2)} Å</strong></label>
                <PWaveSlider 
                  min={0.4} 
                  max={3.0} 
                  step={0.02} 
                  value={bondDistance} 
                  onChange={handleBondChange} 
                />
              </div>

              <div className="control-slider-group">
                <label>T: <strong>{(temperature * 11604).toFixed(0)} K</strong></label>
                <PWaveSlider 
                  min={0.01} 
                  max={1.5} 
                  step={0.02} 
                  value={temperature} 
                  onChange={handleTempChange} 
                />
              </div>

              <div className="control-slider-group">
                <label>1/τ: <strong>{relaxationRate.toFixed(2)}</strong></label>
                <PWaveSlider 
                  min={0.02} 
                  max={0.80} 
                  step={0.02} 
                  value={relaxationRate} 
                  onChange={handleRelaxChange} 
                />
              </div>

              <div className="basis-select-wrapper">
                <select 
                  className="basis-select" 
                  value={basisSet} 
                  onChange={handleBasisChange}
                >
                  <option value="aug-cc-pvdz">aug-cc-pVDZ</option>
                  <option value="cc-pvdz">cc-pVDZ</option>
                  <option value="cc-pvtz">cc-pVTZ</option>
                  <option value="def2-svp">def2-SVP</option>
                  <option value="6-31g">6-31G</option>
                  <option value="6-31g*">6-31G(d,p)</option>
                  <option value="sto-3g">STO-3G</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Centered Perturb Button */}
            <div className="controls-action-bottom">
              <button className="perturb-btn" onClick={handlePerturb} title="Perturb 1-RDM non-equilibrium occupation">
                <span className="btn-icon">☍</span> Perturb
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quantum Boltzmann Observables */}
        <div className="chamber-card telemetry-card">
          <div className="card-top-bar">
            <div className="card-tag">QUANTUM BOLTZMANN OBSERVABLES</div>
            <span className="live-dot">LIVE SOLVER</span>
          </div>

          <div className="metrics-grid">
            <div className="metric-box">
              <span className="m-label">TOTAL ENERGY (E)</span>
              <span className="m-val highlight-emerald">{telemetry.E.toFixed(3)} eV</span>
            </div>
            <div className="metric-box">
              <span className="m-label">VON NEUMANN (S_vN)</span>
              <span className="m-val">{telemetry.SvN.toFixed(4)} bits</span>
            </div>
            <div className="metric-box">
              <span className="m-label">1-RDM P(σ_g) / P(σ_u*)</span>
              <span className="m-val">{telemetry.P0.toFixed(2)} / {telemetry.P1.toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">COHERENCE (ρ_12)</span>
              <span className="m-val highlight-blue">{telemetry.coherence.toFixed(3)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">VIRIAL RATIO (-V/2T)</span>
              <span className="m-val">{telemetry.virial.toFixed(3)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">EQUILIBRIUM (R_eq)</span>
              <span className="m-val highlight-gold">{simRef.current?.R_eq || 0.74} Å</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontally Aligned Dual Acoustic Spectra Deck (Ground & Excited Side-by-Side) */}
      <div className="dual-spectrum-deck">
        {/* Left: Excited Field Spectrum */}
        <div className={`chamber-card acoustic-card excited-deck-card ${telemetry.dExcitation > 0.05 ? 'd-mode' : telemetry.pExcitation > 0.05 ? 'p-mode' : 'idle-mode'}`}>
          <div className="card-top-bar">
            <div className="card-tag">EXCITED FIELD SPECTRUM S_exc[f(t)]</div>
            <span className={`status-tag ${telemetry.dExcitation > 0.05 ? 'highlight-gold' : telemetry.pExcitation > 0.05 ? 'highlight-violet' : 'status-muted'}`}>
              {telemetry.dExcitation > 0.05 
                ? "d-WAVE SOLO 2 ACTIVE" 
                : telemetry.pExcitation > 0.05 
                  ? "p-WAVE SOLO 1 ACTIVE" 
                  : "STANDBY"}
            </span>
          </div>
          <div className="scope-canvas-wrapper">
            <canvas ref={excitedScopeCanvasRef} width={520} height={80} className="scope-canvas" />
          </div>
          <div className="acoustic-footer-note">
            {telemetry.dExcitation > 0.05 
              ? "Tier 3 d-wave quadrupole resonance & double-speed 32nd/16th virtuoso arpeggiated string-crossing flourish." 
              : telemetry.pExcitation > 0.05 
                ? "Tier 2 p-wave dipole excitation & 16th-note lyrical descending scalar runs."
                : "Standby: Click ◈ Excite to sonify phase-locked virtuoso Canon in D solo lines."}
          </div>
        </div>

        {/* Right: Ground Field Spectrum */}
        <div className="chamber-card acoustic-card ground-deck-card">
          <div className="card-top-bar">
            <div className="card-tag">GROUND ACOUSTIC FIELD SPECTRUM S_ground[f(t)]</div>
            <span className="status-tag">{isAudioActive ? "PACHELBEL'S CANON IN D ACTIVE" : "MUTED"}</span>
          </div>
          <div className="scope-canvas-wrapper">
            <canvas ref={scopeCanvasRef} width={520} height={80} className="scope-canvas" />
          </div>
          <div className="acoustic-footer-note">
            Canon in D ground bass & classical melody dynamically coupled to orbital populations, bond stretching, and electronic entropy.
          </div>
        </div>
      </div>
    </div>
  );
}