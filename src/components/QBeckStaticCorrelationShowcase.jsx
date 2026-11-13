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

const TARGET_RESONANCES = 5;

function FullscreenQuantumPong({
  bondStretch,
  couplingScale,
  rewardUnlocked,
  onPluck,
  onDeflect,
  onScore,
}) {
  const mountRef = useRef(null);
  const paramsRef = useRef({ bondStretch, couplingScale, rewardUnlocked });
  const rippleRef = useRef({ x: 0, z: 0, amp: 0, age: 10 });
  const callbacksRef = useRef({ onPluck, onDeflect, onScore });

  useEffect(() => {
    paramsRef.current = { bondStretch, couplingScale, rewardUnlocked };
  }, [bondStretch, couplingScale, rewardUnlocked]);

  useEffect(() => {
    callbacksRef.current = { onPluck, onDeflect, onScore };
  }, [onPluck, onDeflect, onScore]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 4.1, 7.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 1. Wigner Phase-Space Manifold
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

    // 2. Quantum Wavepacket Puck (the Pong ball steered by Wigner fluctuations)
    const puckGroup = new THREE.Group();
    const puckCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    const puckHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.035, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 })
    );
    puckHalo.rotation.x = Math.PI / 2;
    puckGroup.add(puckCore);
    puckGroup.add(puckHalo);
    scene.add(puckGroup);

    // 3. Target Resonance Gate (shifts left <-> right on each score)
    const gateGeo = new THREE.TorusGeometry(0.68, 0.06, 16, 48);
    const gateMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.rotation.y = Math.PI / 2;
    scene.add(gateMesh);

    // 4. Quantum Flux Particles
    const particleCount = 460;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSeeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 9.5;
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

    // Pong physics state in phase space (x in [-4.6, 4.6], z in [-2.6, 2.6])
    const puck = { x: -1.8, z: 0.2, vx: 0.048, vz: 0.024 };
    const gate = { side: 1, z: 0.0, cooldown: 0 };

    const handleGlobalPointerDown = (ev) => {
      if (
        ev.target &&
        ev.target.closest &&
        ev.target.closest(".qbeck-dials-dock, .qbeck-top-bar, .qbeck-reward-banner")
      ) {
        return;
      }
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 800;
      const nx = (ev.clientX / w) * 2 - 1;
      const ny = -(ev.clientY / h) * 2 + 1;

      const clickX = nx * 4.8;
      const clickZ = -ny * 2.8;

      rippleRef.current = {
        x: clickX,
        z: clickZ,
        amp: 1.2,
        age: 0,
      };

      // Perturb the Quantum Pong puck via local Wigner gradient force
      const dx = puck.x - clickX;
      const dz = puck.z - clickZ;
      const dist = Math.hypot(dx, dz) + 0.35;
      const force = Math.min(0.085, 0.14 / (dist * dist + 0.4));
      puck.vx += (dx / dist) * force;
      puck.vz += (dz / dist) * force;

      // Clamp puck speed so it stays playful and controllable
      const speed = Math.hypot(puck.vx, puck.vz);
      const maxSpeed = 0.095;
      if (speed > maxSpeed) {
        puck.vx = (puck.vx / speed) * maxSpeed;
        puck.vz = (puck.vz / speed) * maxSpeed;
      }

      if (dist < 2.2 && callbacksRef.current.onDeflect) {
        callbacksRef.current.onDeflect((nx + 1) * 0.5);
      } else if (callbacksRef.current.onPluck) {
        callbacksRef.current.onPluck((nx + 1) * 0.5);
      }
    };
    window.addEventListener("pointerdown", handleGlobalPointerDown);

    let frameId = 0;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.018;
      rippleRef.current.age += 0.045;
      if (gate.cooldown > 0) gate.cooldown -= 1;

      const { bondStretch: R, couplingScale: cScale, rewardUnlocked: isReward } = paramsRef.current;
      const stretchNorm = (R - 0.8) / (3.2 - 0.8);
      const coupling = Math.max(0.15, cScale);
      const rip = rippleRef.current;
      const ripEnv = Math.exp(-rip.age * 1.3) * rip.amp;

      // Quantum dispersion jitter increases with bond stretch R
      puck.vx += Math.sin(time * 2.1 + puck.z) * 0.0005 * (0.4 + stretchNorm);
      puck.vz += Math.cos(time * 1.9 + puck.x) * 0.0005 * (0.4 + stretchNorm);
      puck.x += puck.vx;
      puck.z += puck.vz;

      // Momentum boundaries (top/bottom reflection)
      if (puck.z > 2.55) {
        puck.z = 2.55;
        puck.vz = -Math.abs(puck.vz);
      } else if (puck.z < -2.55) {
        puck.z = -2.55;
        puck.vz = Math.abs(puck.vz);
      }

      // Check Resonance Gate capture on target side
      const gateX = gate.side * 4.25;
      if (gate.cooldown === 0 && Math.hypot(puck.x - gateX, puck.z - gate.z) < 0.88) {
        gate.side *= -1;
        gate.z = (Math.random() - 0.5) * 3.2;
        gate.cooldown = 36;
        puck.vx = -puck.vx * 1.04;
        rippleRef.current = { x: gateX, z: gate.z, amp: 1.4, age: 0 };
        if (callbacksRef.current.onScore) {
          callbacksRef.current.onScore();
        }
      }

      // Left / Right phase-space wall reflection
      if (puck.x > 4.65) {
        puck.x = 4.65;
        puck.vx = -Math.abs(puck.vx);
      } else if (puck.x < -4.65) {
        puck.x = -4.65;
        puck.vx = Math.abs(puck.vx);
      }

      puckGroup.position.set(puck.x, 0.72 + Math.sin(time * 3.0) * 0.08, puck.z);
      puckHalo.rotation.z = time * 1.8;
      puckCore.material.color.setHex(isReward ? 0xfbbf24 : 0x34d399);

      gateMesh.position.set(gate.side * 4.25, 0.72, gate.z);
      gateMesh.rotation.x = time * 1.1;
      gateMesh.scale.setScalar(1 + Math.sin(time * 3.2) * 0.08);

      // Update Wigner surface vertices
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

        const puckDip = Math.exp(-((x - puck.x) ** 2 + (z - puck.z) ** 2) * 1.2) * 0.45;
        const y = (g1 + g2) * 0.85 + interference * 0.72 + rippleWave + puckDip;
        positions.setY(i, y - 0.35);

        const t = THREE.MathUtils.clamp((y + 0.4) / 1.7, 0, 1);
        const neg = interference < 0 ? Math.min(1, -interference * 1.4) : 0;
        const goldBoost = isReward ? 0.35 : 0;
        colorAttr.setXYZ(
          i,
          0.12 + 0.82 * neg + 0.15 * t + Math.abs(rippleWave) * 0.45 + goldBoost,
          0.42 + 0.48 * t - 0.22 * neg + Math.abs(rippleWave) * 0.3 + goldBoost * 0.65,
          0.75 + 0.25 * (1 - neg) - goldBoost * 0.3
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
      gateGeo.dispose();
      gateMat.dispose();
      puckCore.geometry.dispose();
      puckCore.material.dispose();
      puckHalo.geometry.dispose();
      puckHalo.material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
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
      aria-label="Q-BECK Quantum Pong Phase-Space Figure"
    />
  );
}

function CircularDial({ label, valueText, subText, norm, accent, children }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const totalArc = circumference * 0.75;
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
  const [systemIdx, setSystemIdx] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [rewardUnlocked, setRewardUnlocked] = useState(false);
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

  const handleDeflect = (pitchNorm) => {
    setStreak((s) => s + 1);
    if (sonifierRef.current) {
      sonifierRef.current.triggerPongDeflectSfx(pitchNorm, streak + 1);
    }
  };

  const handleScore = () => {
    setScore((prev) => {
      const next = prev + 1;
      if (next >= TARGET_RESONANCES && !rewardUnlocked) {
        setRewardUnlocked(true);
        if (sonifierRef.current) {
          sonifierRef.current.triggerRewardFanfare();
        }
      } else if (sonifierRef.current) {
        sonifierRef.current.triggerPongDeflectSfx(0.85, next);
      }
      return next;
    });
  };

  const handleNextLevel = () => {
    setScore(0);
    setStreak(0);
    setRewardUnlocked(false);
    setLevel((l) => l + 1);
    const nextIdx = (systemIdx + 1) % SYSTEMS.length;
    setSystemIdx(nextIdx);
    triggerReflectiveSfx(0.75, SYSTEMS[nextIdx].id);
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

  return (
    <div className="qbeck-page">
      <FullscreenQuantumPong
        bondStretch={bondStretch}
        couplingScale={couplingScale}
        rewardUnlocked={rewardUnlocked}
        onPluck={(pitchNorm) => triggerReflectiveSfx(pitchNorm)}
        onDeflect={handleDeflect}
        onScore={handleScore}
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

      {rewardUnlocked && (
        <div className="qbeck-reward-banner" role="status">
          <span className="qbeck-reward-badge">LEVEL {level} · SUPERFLUID COHERENCE UNLOCKED</span>
          <strong className="qbeck-reward-title">
            {activeSystem.label} Resonance Mastered ({activeSystem.sub})
          </strong>
          <button type="button" className="qbeck-reward-btn" onClick={handleNextLevel}>
            Next Quantum Level &rarr;
          </button>
        </div>
      )}

      <section className="qbeck-dials-dock" aria-label="Quantum Pong Data Dials">
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

        {/* DIAL 2: Resonance Score / Concrete Reward Progress */}
        <CircularDial
          label="RESONANCE"
          valueText={`${Math.min(score, TARGET_RESONANCES)}/${TARGET_RESONANCES}`}
          subText={rewardUnlocked ? "Reward Unlocked" : `Streak ${streak}`}
          norm={Math.min(1, score / TARGET_RESONANCES)}
          accent="#fbbf24"
        >
          <span className="qbeck-dial-hint">Steer puck to gold ring</span>
        </CircularDial>

        {/* DIAL 3: Fluctuation Entropy */}
        <CircularDial
          label="FLUCTUATION"
          valueText={entropyBits.toFixed(2)}
          subText="bits / 4.00"
          norm={entropyBits / 4}
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
            aria-label="Quantum Fluctuation Coupling"
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
