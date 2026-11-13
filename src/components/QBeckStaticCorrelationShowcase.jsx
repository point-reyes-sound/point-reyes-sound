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

    // Studio lighting for high-res specular puck & gyroscopic rings
    const ambientLight = new THREE.AmbientLight(0x93c5fd, 0.65);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xef4444, 3.2, 16);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);
    const blueLight = new THREE.PointLight(0x2563eb, 3.5, 16);
    blueLight.position.set(4, 3, 3);
    scene.add(blueLight);

    // 1. Royal Blue & Crimson Wigner Phase-Space Manifold
    const segX = 88;
    const segZ = 88;
    const planeGeo = new THREE.PlaneGeometry(13.4, 8.8, segX, segZ);
    planeGeo.rotateX(-Math.PI / 2);

    const posAttr = planeGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    planeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const surfaceMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
    });
    const surfaceMesh = new THREE.Mesh(planeGeo, surfaceMat);
    scene.add(surfaceMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.84,
    });
    const waveMesh = new THREE.Mesh(planeGeo, wireMat);
    scene.add(waveMesh);

    // 2. High-Resolution Jewel Puck + Dual Gyroscopic Rings + Comet Wake
    const puckGroup = new THREE.Group();
    const puckCoreGeo = new THREE.SphereGeometry(0.25, 64, 64);
    const puckCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.75,
      metalness: 0.25,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });
    const puckCore = new THREE.Mesh(puckCoreGeo, puckCoreMat);

    const innerGlowGeo = new THREE.SphereGeometry(0.14, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    puckCore.add(innerGlow);

    const ring1Geo = new THREE.TorusGeometry(0.39, 0.022, 32, 96);
    const ring1Mat = new THREE.MeshPhysicalMaterial({
      color: 0x60a5fa,
      emissive: 0x2563eb,
      emissiveIntensity: 0.9,
      metalness: 0.6,
      roughness: 0.15,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);

    const ring2Geo = new THREE.TorusGeometry(0.49, 0.014, 24, 96);
    const ring2Mat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0xdc2626,
      emissiveIntensity: 0.95,
      metalness: 0.6,
      roughness: 0.15,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);

    puckGroup.add(puckCore);
    puckGroup.add(ring1);
    puckGroup.add(ring2);
    scene.add(puckGroup);

    // 18-node luminous comet wake behind the puck
    const trailLength = 18;
    const trailMeshes = Array.from({ length: trailLength }, (_, idx) => {
      const t = 1 - idx / trailLength;
      const geo = new THREE.SphereGeometry(0.15 * t + 0.02, 20, 20);
      const mat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x3b82f6 : 0xe11d48,
        transparent: true,
        opacity: 0.55 * t,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      scene.add(m);
      return m;
    });
    const trailHistory = [];

    // 3. Target Resonance Gate (high-res crimson/royal ring)
    const gateGeo = new THREE.TorusGeometry(0.68, 0.055, 32, 96);
    const gateMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0xdc2626,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.15,
    });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.rotation.y = Math.PI / 2;
    scene.add(gateMesh);

    // 4. Royal Blue & Crimson Quantum Flux Particles
    const particleCount = 480;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSeeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 9.8;
      pPositions[i * 3 + 1] = Math.random() * 1.8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 6.2;
      pSeeds[i] = Math.random() * Math.PI * 2;
      const isCrimson = i % 3 === 0;
      pColors[i * 3] = isCrimson ? 0.92 : 0.18;
      pColors[i * 3 + 1] = isCrimson ? 0.14 : 0.42;
      pColors[i * 3 + 2] = isCrimson ? 0.28 : 0.98;
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

    // Pong physics state
    const puck = { x: -1.8, z: 0.2, vx: 0.048, vz: 0.024 };
    const gate = { side: 1, z: 0.0, cooldown: 0 };

    const handleGlobalPointerDown = (ev) => {
      if (
        ev.target &&
        ev.target.closest &&
        ev.target.closest(".qbeck-top-bar, .qbeck-reward-banner")
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
        amp: 1.25,
        age: 0,
      };

      const dx = puck.x - clickX;
      const dz = puck.z - clickZ;
      const dist = Math.hypot(dx, dz) + 0.35;
      const force = Math.min(0.088, 0.145 / (dist * dist + 0.4));
      puck.vx += (dx / dist) * force;
      puck.vz += (dz / dist) * force;

      const speed = Math.hypot(puck.vx, puck.vz);
      const maxSpeed = 0.098;
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

      puck.vx += Math.sin(time * 2.1 + puck.z) * 0.0005 * (0.4 + stretchNorm);
      puck.vz += Math.cos(time * 1.9 + puck.x) * 0.0005 * (0.4 + stretchNorm);
      puck.x += puck.vx;
      puck.z += puck.vz;

      if (puck.z > 2.55) {
        puck.z = 2.55;
        puck.vz = -Math.abs(puck.vz);
      } else if (puck.z < -2.55) {
        puck.z = -2.55;
        puck.vz = Math.abs(puck.vz);
      }

      const gateX = gate.side * 4.25;
      if (gate.cooldown === 0 && Math.hypot(puck.x - gateX, puck.z - gate.z) < 0.9) {
        gate.side *= -1;
        gate.z = (Math.random() - 0.5) * 3.2;
        gate.cooldown = 36;
        puck.vx = -puck.vx * 1.04;
        rippleRef.current = { x: gateX, z: gate.z, amp: 1.45, age: 0 };
        if (callbacksRef.current.onScore) {
          callbacksRef.current.onScore();
        }
      }

      if (puck.x > 4.65) {
        puck.x = 4.65;
        puck.vx = -Math.abs(puck.vx);
      } else if (puck.x < -4.65) {
        puck.x = -4.65;
        puck.vx = Math.abs(puck.vx);
      }

      const puckY = 0.78 + Math.sin(time * 3.2) * 0.09;
      puckGroup.position.set(puck.x, puckY, puck.z);
      ring1.rotation.set(time * 1.8, time * 1.2, 0);
      ring2.rotation.set(-time * 1.4, time * 2.1, Math.PI / 3);
      puckCoreMat.emissive.setHex(isReward ? 0xf43f5e : 0x1d4ed8);

      // Update comet wake
      trailHistory.unshift({ x: puck.x, y: puckY, z: puck.z });
      if (trailHistory.length > trailLength) trailHistory.pop();
      trailMeshes.forEach((m, idx) => {
        const pt = trailHistory[idx] || trailHistory[trailHistory.length - 1];
        if (pt) {
          m.position.set(pt.x, pt.y, pt.z);
        }
      });

      gateMesh.position.set(gate.side * 4.25, 0.76, gate.z);
      gateMesh.rotation.x = time * 1.1;
      gateMesh.scale.setScalar(1 + Math.sin(time * 3.2) * 0.08);

      // Royal Blue & Crimson phase-space surface coloring
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

        // Positive lobes = deep Royal Blue (#1d4ed8 -> #60a5fa), Negative/ripples = Crimson (#be123c -> #fb7185)
        const crest = THREE.MathUtils.clamp((y + 0.2) / 1.5, 0, 1);
        const crim = THREE.MathUtils.clamp(
          (interference < 0 ? -interference * 1.35 : 0) + Math.abs(rippleWave) * 0.85,
          0,
          1
        );
        const rCol = 0.08 + 0.82 * crim + (isReward ? 0.18 : 0);
        const gCol = 0.16 + 0.28 * crest * (1 - crim * 0.7) + 0.08 * crim;
        const bCol = 0.62 + 0.38 * crest - 0.42 * crim;
        colorAttr.setXYZ(i, rCol, gCol, bCol);
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
      puckCoreGeo.dispose();
      puckCoreMat.dispose();
      innerGlowGeo.dispose();
      innerGlowMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      trailMeshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
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

export default function QBeckStaticCorrelationShowcase({ onBackHome, onOpenConsole }) {
  const [bondStretch] = useState(1.85);
  const [couplingScale] = useState(1.0);
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

  const handleQuantumShift = () => {
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
          <span className="qbeck-score-pill" title="Quantum Resonances">
            {Math.min(score, TARGET_RESONANCES)}/{TARGET_RESONANCES}
          </span>
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

      {score === 0 && !rewardUnlocked && (
        <p className="qbeck-objective-line">
          Click anywhere on the Wigner surface to steer the wavepacket puck through the crimson ring five times.
        </p>
      )}

      {rewardUnlocked && (
        <div className="qbeck-reward-banner" role="status">
          <span className="qbeck-reward-badge">LEVEL {level} · SUPERFLUID COHERENCE UNLOCKED</span>
          <strong className="qbeck-reward-title">
            {activeSystem.label} Mastered
          </strong>
          <button type="button" className="qbeck-reward-btn" onClick={handleQuantumShift}>
            Quantum Shift
          </button>
        </div>
      )}
    </div>
  );
}
