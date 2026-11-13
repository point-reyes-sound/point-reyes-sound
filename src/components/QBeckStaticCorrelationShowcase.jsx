import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EdmQuantumFluxSonifier } from "../physics/EdmQuantumFluxSonifier";
import "./QBeckStaticCorrelationShowcase.css";

const SYSTEMS = [
  { id: "h3", label: "H₃", sub: "10.22 kcal/mol" },
  { id: "h4", label: "H₄", sub: "4.04e-10 Eₕ" },
  { id: "beh2", label: "BeH₂", sub: "7.11e-14 Eₕ" },
  { id: "h2o", label: "H₂O", sub: "5.57e-10 Eₕ" },
  { id: "n2", label: "N₂", sub: "9.55 eV" },
  { id: "benzyne", label: "C₆H₄", sub: "85.7% healed" },
];

function FullscreenQuantumFigure({ bondStretch, couplingScale, onPluck }) {
  const mountRef = useRef(null);
  const paramsRef = useRef({ bondStretch, couplingScale });
  const rippleRef = useRef({ x: 0, z: 0, amp: 0, age: 10 });
  const onPluckRef = useRef(onPluck);

  useEffect(() => {
    paramsRef.current = { bondStretch, couplingScale };
  }, [bondStretch, couplingScale]);

  useEffect(() => {
    onPluckRef.current = onPluck;
  }, [onPluck]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 3.6, 7.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const segX = 76;
    const segZ = 76;
    const planeGeo = new THREE.PlaneGeometry(13.0, 8.6, segX, segZ);
    planeGeo.rotateX(-Math.PI / 2);

    const posAttr = planeGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    planeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const surfaceMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    });
    const surfaceMesh = new THREE.Mesh(planeGeo, surfaceMat);
    scene.add(surfaceMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.82,
    });
    const waveMesh = new THREE.Mesh(planeGeo, wireMat);
    scene.add(waveMesh);

    const particleCount = 480;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSeeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 9.0;
      pPositions[i * 3 + 1] = Math.random() * 1.8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
      pSeeds[i] = Math.random() * Math.PI * 2;
      pColors[i * 3] = 0.22;
      pColors[i * 3 + 1] = 0.78;
      pColors[i * 3 + 2] = 0.98;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    const nodeGroup = new THREE.Group();
    const nodeColors = [0x38bdf8, 0x34d399, 0x34d399, 0xfbbf24];
    const nodes = nodeColors.map((hex, i) => {
      const geo = new THREE.SphereGeometry(0.15, 24, 24);
      const mat = new THREE.MeshBasicMaterial({ color: hex });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-1.95 + i * 1.3, 0.9, 0);
      nodeGroup.add(mesh);
      return mesh;
    });
    scene.add(nodeGroup);

    const handleGlobalPointerDown = (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest(".qbeck-dials-dock, .qbeck-top-bar")) {
        return;
      }
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 800;
      const nx = (ev.clientX / w) * 2 - 1;
      const ny = -(ev.clientY / h) * 2 + 1;
      rippleRef.current = {
        x: nx * 4.6,
        z: -ny * 3.0,
        amp: 1.15,
        age: 0,
      };
      if (onPluckRef.current) {
        onPluckRef.current((nx + 1) * 0.5);
      }
    };
    window.addEventListener("pointerdown", handleGlobalPointerDown);

    let frameId = 0;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.018;
      rippleRef.current.age += 0.045;

      const { bondStretch: R, couplingScale: cScale } = paramsRef.current;
      const stretchNorm = (R - 0.8) / (3.2 - 0.8);
      const coupling = Math.max(0.15, cScale);
      const rip = rippleRef.current;
      const ripEnv = Math.exp(-rip.age * 1.3) * rip.amp;

      const positions = planeGeo.attributes.position;
      const colorAttr = planeGeo.attributes.color;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const sep = 0.7 + stretchNorm * 2.1;

        const r1 = Math.hypot(x + sep, z);
        const r2 = Math.hypot(x - sep, z);
        const g1 = Math.exp(-r1 * r1 * 0.65);
        const g2 = Math.exp(-r2 * r2 * 0.65);
        const interference =
          Math.cos(x * (2.1 + stretchNorm * 3.1) - time * 1.4) *
          Math.exp(-0.22 * (x * x * 0.35 + z * z)) *
          (0.38 + 0.68 * stretchNorm) *
          coupling;

        const dRip = Math.hypot(x - rip.x, z - rip.z);
        const rippleWave =
          ripEnv > 0.01
            ? Math.sin(dRip * 4.2 - rip.age * 7.8) * Math.exp(-dRip * 0.55) * ripEnv
            : 0;

        const y = (g1 + g2) * 0.92 + interference * 0.78 + rippleWave;
        positions.setY(i, y - 0.35);

        const t = THREE.MathUtils.clamp((y + 0.4) / 1.7, 0, 1);
        const neg = interference < 0 ? Math.min(1, -interference * 1.4) : 0;
        colorAttr.setXYZ(
          i,
          0.12 + 0.82 * neg + 0.15 * t + Math.abs(rippleWave) * 0.45,
          0.42 + 0.48 * t - 0.22 * neg + Math.abs(rippleWave) * 0.3,
          0.75 + 0.25 * (1 - neg)
        );
      }
      positions.needsUpdate = true;
      colorAttr.needsUpdate = true;

      const pPos = particleGeo.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const seed = pSeeds[i];
        const px = pPos.getX(i);
        const py = 0.45 + Math.sin(time * 1.7 + seed + px * 0.5) * (0.38 + 0.42 * stretchNorm);
        pPos.setY(i, py);
      }
      pPos.needsUpdate = true;

      nodes.forEach((node, idx) => {
        const phase = time * 1.3 + idx * 1.25;
        node.position.y = 0.88 + Math.sin(phase) * (0.16 + 0.2 * stretchNorm);
        const scale = 0.85 + 0.45 * (1 - Math.abs(stretchNorm - 0.5));
        node.scale.setScalar(scale);
      });

      const rotY = Math.sin(time * 0.22) * 0.14;
      surfaceMesh.rotation.y = rotY;
      waveMesh.rotation.y = rotY;
      particlePoints.rotation.y = rotY;
      nodeGroup.rotation.y = rotY;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      cancelAnimationFrame(frameId);
      planeGeo.dispose();
      surfaceMat.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
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

  return (
    <div
      ref={mountRef}
      className="qbeck-fullscreen-figure"
      aria-label="Interactive Wigner-Cumulant Phase-Space Figure"
    />
  );
}

function CircularDial({ label, valueText, subText, norm, accent, children }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270-degree dial sweep
  const totalArc = circumference * arcFraction;
  const filledArc = Math.max(0, Math.min(1, norm)) * totalArc;

  return (
    <div className="qbeck-dial-card">
      <div className="qbeck-dial-ring-wrap">
        <svg className="qbeck-dial-svg" viewBox="0 0 68 68" aria-hidden="true">
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.18)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={`${totalArc} ${circumference}`}
            transform="rotate(135 34 34)"
          />
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={`${filledArc} ${circumference}`}
            transform="rotate(135 34 34)"
          />
        </svg>
        <div className="qbeck-dial-center">
          <strong className="qbeck-dial-val">{valueText}</strong>
        </div>
      </div>
      <div className="qbeck-dial-meta">
        <span className="qbeck-dial-label">{label}</span>
        <span className="qbeck-dial-sub">{subText}</span>
        {children}
      </div>
    </div>
  );
}

export default function QBeckStaticCorrelationShowcase({ onBackHome, onOpenConsole }) {
  const [bondStretch, setBondStretch] = useState(1.85);
  const [couplingScale, setCouplingScale] = useState(1.0);
  const [systemIdx, setSystemIdx] = useState(1); // H4 default
  const [isEdmPlaying, setIsEdmPlaying] = useState(false);
  const sonifierRef = useRef(null);

  const activeSystem = SYSTEMS[systemIdx] || SYSTEMS[1];

  useEffect(() => {
    sonifierRef.current = new EdmQuantumFluxSonifier();
    return () => {
      if (sonifierRef.current) {
        sonifierRef.current.stop();
      }
    };
  }, []);

  const entropyBits = useMemo(() => {
    const stretchNorm = (bondStretch - 0.8) / (3.2 - 0.8);
    const gap = Math.max(0.015, 0.92 * Math.exp(-2.35 * stretchNorm));
    const omega = 0.08 + 0.55 * stretchNorm * couplingScale;
    const eps = [-gap * 1.15, -gap * 0.12, gap * 0.12, gap * 1.15];
    const sum = eps.reduce((acc, e) => {
      const p = Math.min(0.999999, Math.max(0.000001, 0.5 * (1 - Math.tanh(e / (2 * omega)))));
      return acc - (p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
    }, 0);
    return Math.min(4, sum);
  }, [bondStretch, couplingScale]);

  useEffect(() => {
    if (!sonifierRef.current) return;
    sonifierRef.current.updateTelemetry({
      stretchNorm: (bondStretch - 0.8) / (3.2 - 0.8),
      entropyNorm: entropyBits / 4,
      couplingNorm: (couplingScale - 0.3) / (2.0 - 0.3),
    });
  }, [bondStretch, couplingScale, entropyBits]);

  const triggerReflectiveSfx = (pitchNorm = 0.5, sysId = activeSystem.id) => {
    if (!sonifierRef.current) return;
    const stretchNorm = (bondStretch - 0.8) / (3.2 - 0.8);
    const regime = bondStretch < 1.15 ? "eq" : bondStretch < 2.15 ? "liquid" : "mott";
    sonifierRef.current.triggerSimulationClickSfx({
      regime,
      systemId: sysId,
      pitchNorm,
      stretchNorm,
      entropyNorm: entropyBits / 4,
    });
  };

  const toggleEdmSound = () => {
    const s = sonifierRef.current;
    if (!s) return;
    if (isEdmPlaying) {
      s.stop();
      setIsEdmPlaying(false);
    } else {
      s.start();
      setIsEdmPlaying(true);
    }
  };

  const cycleSystem = () => {
    const nextIdx = (systemIdx + 1) % SYSTEMS.length;
    setSystemIdx(nextIdx);
    triggerReflectiveSfx(0.35 + nextIdx * 0.1, SYSTEMS[nextIdx].id);
  };

  const cycleRegimePreset = () => {
    const nextR = bondStretch < 1.15 ? 1.85 : bondStretch < 2.15 ? 2.95 : 0.92;
    setBondStretch(nextR);
    triggerReflectiveSfx(0.6);
  };

  return (
    <div className="qbeck-page">
      <FullscreenQuantumFigure
        bondStretch={bondStretch}
        couplingScale={couplingScale}
        onPluck={(pitchNorm) => triggerReflectiveSfx(pitchNorm)}
      />

      <header className="qbeck-top-bar">
        <button className="qbeck-icon-btn" onClick={onBackHome} title="Back to Point Reyes Sound">
          &larr;
        </button>

        <h1 className="qbeck-caps-title">Q-BECK</h1>

        <div className="qbeck-top-actions">
          <button
            className={`qbeck-edm-btn ${isEdmPlaying ? "is-playing" : ""}`}
            onClick={toggleEdmSound}
            title="Toggle 126 BPM EDM Quantum Flux"
          >
            <span className="qbeck-edm-dot" />
            {isEdmPlaying ? "EDM LIVE" : "EDM"}
          </button>
          <button className="qbeck-icon-btn" onClick={onOpenConsole} title="Open Q-BOLTZ Console">
            Q-BOLTZ
          </button>
        </div>
      </header>

      <section className="qbeck-dials-dock" aria-label="Simulation Data Dials">
        {/* DIAL 1: Bond Stretch R */}
        <CircularDial
          label="STRETCH R"
          valueText={`${bondStretch.toFixed(2)} Å`}
          subText={bondStretch < 1.15 ? "Equilibrium" : bondStretch < 2.15 ? "Liquid" : "Mott"}
          norm={(bondStretch - 0.8) / (3.2 - 0.8)}
          accent="#38bdf8"
        >
          <input
            type="range"
            className="qbeck-dial-slider"
            min="0.80"
            max="3.20"
            step="0.02"
            value={bondStretch}
            onChange={(e) => setBondStretch(parseFloat(e.target.value))}
            aria-label="Bond Stretch R"
          />
        </CircularDial>

        {/* DIAL 2: Configurational Entropy */}
        <CircularDial
          label="ENTROPY"
          valueText={entropyBits.toFixed(2)}
          subText="bits / 4.00"
          norm={entropyBits / 4}
          accent="#fbbf24"
        >
          <button type="button" className="qbeck-dial-tap" onClick={cycleRegimePreset}>
            Step Regime
          </button>
        </CircularDial>

        {/* DIAL 3: Correlation Coupling */}
        <CircularDial
          label="COUPLING"
          valueText={`${couplingScale.toFixed(2)}×`}
          subText="Flux Width"
          norm={(couplingScale - 0.3) / (2.0 - 0.3)}
          accent="#34d399"
        >
          <input
            type="range"
            className="qbeck-dial-slider"
            min="0.30"
            max="2.00"
            step="0.02"
            value={couplingScale}
            onChange={(e) => setCouplingScale(parseFloat(e.target.value))}
            aria-label="Correlation Coupling"
          />
        </CircularDial>

        {/* DIAL 4: Active Benchmark System */}
        <CircularDial
          label="SYSTEM"
          valueText={activeSystem.label}
          subText={activeSystem.sub}
          norm={(systemIdx + 1) / SYSTEMS.length}
          accent="#a78bfa"
        >
          <button type="button" className="qbeck-dial-tap" onClick={cycleSystem}>
            Next Molecule
          </button>
        </CircularDial>
      </section>
    </div>
  );
}
