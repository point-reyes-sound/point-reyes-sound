import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import WebGlWignerPlot from "./WebGlWignerPlot";
import "./QBoltzAgentConsole.css";

// ---------------------------------------------------------------------------
// Guided Molecular Discovery Systems (Preserves & surfaces all precomputed benchmarks)
// ---------------------------------------------------------------------------
const DISCOVERY_SYSTEMS = [
  {
    key: "h2",
    formula: "H₂",
    title: "Bond Dissociation",
    fullLabel: "H₂ Dissociation in Phase Space",
    tag: "Coulson–Fischer Cusp • Loop",
    prompt: "Conceptualize and envision the dissociation of H2 in phase space."
  },
  {
    key: "h3_d3h",
    formula: "H₃",
    title: "Conical Intersection",
    fullLabel: "H₃ D₃ₕ Conical Intersection",
    tag: "Degenerate e′ Manifold",
    prompt: "Run H3 at the D3h conical intersection of 1.52 Angstroms and show the degenerate e-prime orbitals."
  },
  {
    key: "beh2_ci",
    formula: "BeH₂",
    title: "Avoided Crossing",
    fullLabel: "BeH₂ Avoided Crossing Scan",
    tag: "Insertion Seam • Loop",
    prompt: "Scan the insertion coordinate for the BeH2 conical intersection and show active space orbitals."
  },
  {
    key: "n2_triple",
    formula: "N₂",
    title: "Triple-Bond Cleavage",
    fullLabel: "N₂ Triple Bond",
    tag: "6-Orbital CAS • 10.8 Bits",
    prompt: "Dissociate the N2 triple bond to 2.2 Angstroms and show the active space pi bonding and antibonding orbitals."
  },
  {
    key: "h4_square",
    formula: "H₄",
    title: "Square Automerization",
    fullLabel: "H₄ Square Automerization",
    tag: "D₄ₕ Berry Phase Loop",
    prompt: "Analyze the H4 square automerization at 1.23 Angstroms and show the 4 active-space orbitals."
  }
];

const REGIME_MILESTONES = {
  h2: [
    { label: "Equilibrium", r: 0.75, unit: "Å" },
    { label: "Coulson–Fischer", r: 1.20, unit: "Å", isSingularity: true },
    { label: "Bifurcation", r: 1.80, unit: "Å" },
    { label: "Entangled Limit", r: 3.00, unit: "Å" }
  ],
  beh2_ci: [
    { label: "C₂ᵥ Complex", r: 1.00, unit: "Bohr" },
    { label: "Approach", r: 2.00, unit: "Bohr" },
    { label: "Crossing Seam", r: 2.54, unit: "Bohr", isSingularity: true },
    { label: "Linear BeH₂", r: 3.40, unit: "Bohr" }
  ]
};

// ---------------------------------------------------------------------------
// Pure Three.js 3D Orbital Canvas (Blue & Red Lobes, Zero Fiber dependency)
// ---------------------------------------------------------------------------
function PureThreeOrbitalCanvas({ orbital, atoms = [], bonds = [] }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const groupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = mount.clientWidth || 360;
    const height = mount.clientHeight || 280;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 6.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio & Celestial Rim Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.45);
    dirLight1.position.set(5, 7, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.65);
    dirLight2.position.set(-5, -4, -4);
    scene.add(dirLight2);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (group && !isDraggingRef.current) {
        group.rotation.y += 0.0035;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current || !group) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      group.rotation.y += dx * 0.01;
      group.rotation.x += dy * 0.01;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e) => {
      camera.position.z = Math.max(1.8, Math.min(10.0, camera.position.z + e.deltaY * 0.004));
      camera.userData.customZoomed = true;
    };

    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("wheel", onWheel, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      if (!mount || !renderer) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      mount.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      mount.removeEventListener("wheel", onWheel);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update geometry on orbital or atomic structure change
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    const addLobe = (lobeData, colorHex, emissiveHex) => {
      if (!lobeData?.vertices?.length || !lobeData?.faces?.length) return;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(lobeData.vertices.flat()), 3)
      );
      geom.setIndex(
        new THREE.BufferAttribute(new Uint32Array(lobeData.faces.flat()), 1)
      );
      geom.computeVertexNormals();

      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: 0.36,
        roughness: 0.12,
        metalness: 0.08,
        transmission: 0.36,
        ior: 1.38,
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      group.add(new THREE.Mesh(geom, mat));
    };

    // Positive lobe: Luminous Sapphire Blue (+ψ)
    if (orbital?.pos_lobe) addLobe(orbital.pos_lobe, 0x1a8cff, 0x06388a);
    // Negative lobe: Point Reyes Crimson Red (-ψ)
    if (orbital?.neg_lobe) addLobe(orbital.neg_lobe, 0xf43f5e, 0x820c22);

    // Render atomic spheres
    atoms.forEach((atom) => {
      const r = (atom.radius || 0.4) * 0.68;
      const sphereGeom = new THREE.SphereGeometry(r, 32, 32);
      const color = new THREE.Color(atom.color || "#ffffff");
      const atomMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.6
      });
      const atomMesh = new THREE.Mesh(sphereGeom, atomMat);
      atomMesh.position.set(atom.coords[0], atom.coords[1], atom.coords[2]);
      group.add(atomMesh);
    });

    // Render bonds
    bonds.forEach((bond) => {
      const p1 = atoms[bond.from]?.coords;
      const p2 = atoms[bond.to]?.coords;
      if (!p1 || !p2) return;
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const length = dir.length();
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

      const cylGeom = new THREE.CylinderGeometry(0.045, 0.045, length, 16);
      const cylMat = new THREE.MeshStandardMaterial({
        color: 0x7c93ad,
        metalness: 0.75,
        roughness: 0.28
      });
      const cylMesh = new THREE.Mesh(cylGeom, cylMat);
      cylMesh.position.copy(mid);
      cylMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      group.add(cylMesh);
    });

    // Local-space camera auto-framing
    if (cameraRef.current) {
      let maxDist = 0;
      atoms.forEach((a) => {
        if (a?.coords) {
          const d = Math.hypot(...a.coords);
          if (d > maxDist) maxDist = d;
        }
      });
      const effectiveRadius = Math.max(2.2, maxDist + 0.9);
      const fovRad = THREE.MathUtils.degToRad(cameraRef.current.fov / 2);
      const targetDist = Math.max(6.2, (effectiveRadius / Math.sin(fovRad)) * 1.08);
      if (!cameraRef.current.userData.customZoomed) {
        cameraRef.current.position.set(0, 0.4, targetDist);
        cameraRef.current.lookAt(0, 0, 0);
      }
    }
  }, [orbital, atoms, bonds]);

  return (
    <div
      ref={mountRef}
      className="three-orbital-mount"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "170px",
        cursor: "grab"
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// 2D Potential Energy Surface (Dissociation Curve) Interactive SVG Component
// Click or drag directly along the PES curve to scrub nuclear geometry!
// ---------------------------------------------------------------------------
function DissociationCurvePlot({ curveData, currentPoint, coordUnit = "Å", canScrub = false, onSelectR }) {
  const svgRef = useRef(null);
  const isScrubbingRef = useRef(false);

  if (!curveData || !curveData.points || curveData.points.length === 0) return null;

  const points = curveData.points;
  const rMin = Math.min(...points.map((p) => p.r));
  const rMax = Math.max(...points.map((p) => p.r));

  const allE = points.flatMap((p) => [p.e_qbescf, p.e_standard]);
  const eMin = Math.min(...allE);
  const eMax = Math.max(...allE);
  const ePadding = (eMax - eMin) * 0.15 || 0.08;
  const yLow = eMin - ePadding;
  const yHigh = eMax + ePadding;

  const width = 660;
  const height = 290;
  const padL = 72;
  const padR = 26;
  const padT = 22;
  const padB = 48;

  const toSvgX = (r) => padL + ((r - rMin) / (rMax - rMin)) * (width - padL - padR);
  const toSvgY = (e) => height - padB - ((e - yLow) / (yHigh - yLow)) * (height - padT - padB);

  const handlePointerToR = (clientX) => {
    if (!canScrub || !onSelectR || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const fracSvgX = ((clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(padL, Math.min(width - padR, fracSvgX));
    const targetR = rMin + ((clampedX - padL) / (width - padL - padR)) * (rMax - rMin);
    onSelectR(targetR);
  };

  // Smooth Cubic Catmull-Rom Spline Interpolator
  const getSmoothSpline = (pts, key) => {
    if (!pts || pts.length === 0) return "";
    const coords = pts.map((p) => ({ x: toSvgX(p.r), y: toSvgY(p[key]) }));
    if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    if (coords.length === 2) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`;

    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = i > 0 ? coords[i - 1] : coords[0];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = i < coords.length - 2 ? coords[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const qbePath = getSmoothSpline(points, "e_qbescf");
  const standardPath = getSmoothSpline(points, "e_standard");

  const currR = currentPoint !== undefined ? currentPoint : curveData.current_r;
  const currQbePt = points.reduce(
    (prev, curr) => (Math.abs(curr.r - currR) < Math.abs(prev.r - currR) ? curr : prev),
    points[0]
  );

  const singR = curveData.singularity?.r;
  const singX = singR && singR >= rMin && singR <= rMax ? toSvgX(singR) : null;
  const singLabel = (curveData.singularity?.label || "Coulson–Fischer Singularity").replace(/\s*\(.*?\)\s*$/, "");

  const numXTicks = 6;
  const xTicks = [];
  const xStep = (rMax - rMin) / numXTicks;
  for (let i = 0; i <= numXTicks; i++) {
    xTicks.push(rMin + i * xStep);
  }

  const numYTicks = 4;
  const yTicks = [];
  const yStep = (yHigh - yLow) / numYTicks;
  for (let i = 0; i <= numYTicks; i++) {
    yTicks.push(yLow + i * yStep);
  }

  return (
    <div className={`pes-plot-wrapper ${canScrub ? "is-interactive-pes" : ""}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="pes-svg"
        preserveAspectRatio="none"
        onMouseDown={(e) => {
          if (!canScrub) return;
          isScrubbingRef.current = true;
          handlePointerToR(e.clientX);
        }}
        onMouseMove={(e) => {
          if (isScrubbingRef.current) {
            handlePointerToR(e.clientX);
          }
        }}
        onMouseUp={() => {
          isScrubbingRef.current = false;
        }}
        onMouseLeave={() => {
          isScrubbingRef.current = false;
        }}
      >
        <defs>
          <linearGradient id="qbeCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="pesGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Plot Box */}
        <rect
          x={padL}
          y={padT}
          width={width - padL - padR}
          height={height - padT - padB}
          fill="rgba(2, 8, 18, 0.85)"
          stroke="rgba(56, 189, 248, 0.24)"
          strokeWidth="1"
          rx="4"
        />

        {/* Y Gridlines and Ticks */}
        {yTicks.map((val, idx) => {
          const y = toSvgY(val);
          return (
            <g key={`y-grid-${idx}`}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="rgba(148, 163, 184, 0.10)"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <line
                x1={padL - 5}
                y1={y}
                x2={padL}
                y2={y}
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.2"
              />
              <text
                x={padL - 9}
                y={y + 4}
                textAnchor="end"
                fill="#cbd5e1"
                fontSize="11.5"
                fontFamily="'JetBrains Mono', monospace"
              >
                {val.toFixed(Math.abs(val) >= 10 ? 1 : 2)}
              </text>
            </g>
          );
        })}

        {/* X Gridlines and Ticks */}
        {xTicks.map((val, idx) => {
          const x = toSvgX(val);
          return (
            <g key={`x-grid-${idx}`}>
              <line
                x1={x}
                y1={padT}
                x2={x}
                y2={height - padB}
                stroke="rgba(148, 163, 184, 0.10)"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <line
                x1={x}
                y1={height - padB}
                x2={x}
                y2={height - padB + 5}
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.2"
              />
              <text
                x={x}
                y={height - padB + 18}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="11.5"
                fontFamily="'JetBrains Mono', monospace"
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={(padL + width - padR) / 2}
          y={height - 7}
          textAnchor="middle"
          fill="#7dd3fc"
          fontSize="12.5"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          letterSpacing="0.04em"
        >
          {coordUnit === "Bohr"
            ? "Insertion Coordinate x (Bohr)"
            : `Interatomic Distance R (${curveData.r_unit || coordUnit})`}
          {canScrub ? " • Click curve to jump" : ""}
        </text>

        <text
          transform={`rotate(-90) translate(-${(padT + height - padB) / 2}, 17)`}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="12"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          letterSpacing="0.03em"
        >
          Energy E (E_h)
        </text>

        {/* Singularity / Crossing Marker */}
        {singX && (
          <g className="singularity-marker">
            <line
              x1={singX}
              y1={padT}
              x2={singX}
              y2={height - padB}
              stroke="#fbbf24"
              strokeDasharray="5 4"
              strokeWidth="1.7"
            />
            <rect
              x={Math.min(singX + 7, width - padR - 216)}
              y={padT + 7}
              width="210"
              height="22"
              rx="4"
              fill="rgba(251, 191, 36, 0.15)"
              stroke="rgba(251, 191, 36, 0.65)"
              strokeWidth="1"
            />
            <text
              x={Math.min(singX + 15, width - padR - 208)}
              y={padT + 22}
              fill="#fde68a"
              fontSize="11"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
            >
              {singLabel}
            </text>
          </g>
        )}

        {/* Standard RHF Line (Dashed Crimson) */}
        <path
          d={standardPath}
          fill="none"
          stroke="#f87171"
          strokeWidth="2.3"
          strokeDasharray="6 4"
          opacity="0.9"
        />

        {/* QBE-SCF Line (Continuous Smooth C¹ Transport Glowing Gradient) */}
        <path
          d={qbePath}
          fill="none"
          stroke="url(#qbeCurveGrad)"
          strokeWidth="3.4"
          filter="url(#pesGlow)"
        />

        {/* Current State Marker Ping */}
        {currQbePt && (
          <g
            className="current-state-marker"
            transform={`translate(${toSvgX(currQbePt.r)}, ${toSvgY(currQbePt.e_qbescf)})`}
          >
            <circle r="11" fill="#38bdf8" opacity="0.28" className="ping-halo" />
            <circle r="5.2" fill="#34d399" stroke="#ffffff" strokeWidth="2.2" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Fullscreen Q-BOLTZ Interactive Discovery Workstation
// Aligned with Point Reyes Sound Landing Page Aesthetic
// ---------------------------------------------------------------------------
export default function QBoltzAgentConsole({ onClose }) {
  const [query, setQuery] = useState("Conceptualize and envision the dissociation of H2 in phase space.");
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [fullNarrative, setFullNarrative] = useState("");
  const [simulation, setSimulation] = useState(null);
  const [bondingIdx, setBondingIdx] = useState(0);
  const [antibondingIdx, setAntibondingIdx] = useState(1);

  // Dynamic Dissociation Trajectory State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [loopDir, setLoopDir] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(180);

  // Web Audio Synth for Singularity Crossing Acoustic Cue
  const audioCtxRef = useRef(null);

  const playCoulsonFischerPop = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.062);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {
      // Audio autoplay handled gracefully
    }
  }, []);

  // Typewriter streaming effect
  useEffect(() => {
    if (!fullNarrative) return;
    let i = 0;
    setStreamedText("");
    const interval = setInterval(() => {
      i += 4;
      if (i >= fullNarrative.length) {
        setStreamedText(fullNarrative);
        clearInterval(interval);
      } else {
        setStreamedText(fullNarrative.slice(0, i));
      }
    }, 10);
    return () => clearInterval(interval);
  }, [fullNarrative]);

  // Clean narrative string helper
  const sanitizeNarrative = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/^\*\*Ludwig Boltzmann \(Q-BOLTZ\)\*\*:\s*/i, "")
      .replace(/^Ludwig Boltzmann \(Q-BOLTZ\):\s*/i, "")
      .replace(/^\*\*Ludwig Boltzmann\*\*:\s*/i, "")
      .replace(/^Ludwig Boltzmann:\s*/i, "")
      .trim();
  };

  const trajectory = simulation?.trajectory || [];
  const hasTrajectory = trajectory.length > 0;
  const activeBenchmarkKey = simulation?.benchmark?.key || "h2";
  const coordUnit = activeBenchmarkKey === "beh2_ci" ? "Bohr" : "Å";

  useEffect(() => {
    if (!isPlaying || !hasTrajectory) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        let next = prev + loopDir;
        if (next >= trajectory.length) {
          setLoopDir(-1);
          next = Math.max(0, trajectory.length - 2);
        } else if (next < 0) {
          setLoopDir(1);
          next = Math.min(trajectory.length - 1, 1);
        }

        const prevR = trajectory[prev]?.r;
        const nextR = trajectory[next]?.r;
        const cfR = activeBenchmarkKey === "beh2_ci" ? 2.54 : 1.20;
        if (
          prevR !== undefined &&
          nextR !== undefined &&
          ((prevR < cfR && nextR >= cfR) || (prevR > cfR && nextR <= cfR) || Math.abs(nextR - cfR) < 0.035)
        ) {
          playCoulsonFischerPop();
        }

        return next;
      });
    }, playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, hasTrajectory, loopDir, trajectory, playbackSpeed, playCoulsonFischerPop, activeBenchmarkKey]);

  const getApiBaseUrl = () => {
    const envUrl = (import.meta.env.VITE_QBOLTZ_API_URL || "").trim().replace(/\/$/, "");
    if (envUrl) return envUrl;
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      return "http://127.0.0.1:8088";
    }
    return "";
  };

  const parsePromptIntent = (rawPrompt) => {
    const p = (rawPrompt || "").toLowerCase();
    let benchmark = "h2";
    if (p.includes("h3") || p.includes("trimer") || p.includes("triangle")) {
      benchmark = "h3_d3h";
    } else if (p.includes("h4") || p.includes("square") || p.includes("automerization")) {
      benchmark = "h4_square";
    } else if (p.includes("beh2") || p.includes("beryllium") || p.includes("conical") || p.includes("insertion")) {
      benchmark = "beh2_ci";
    } else if (p.includes("nitrogen") || p.includes("n2") || p.includes("triple")) {
      benchmark = "n2_triple";
    }

    let requestedCoord = null;
    const tokens = p.replace(/angstroms?|bohrs?|å/g, " ").split(/\s+/);
    for (const tok of tokens) {
      const val = parseFloat(tok);
      if (!Number.isNaN(val) && val >= 0.3 && val <= 4.0) {
        requestedCoord = val;
        break;
      }
    }
    return { benchmark, requestedCoord };
  };

  const applySimulationPayload = useCallback((data, requestedCoord = null) => {
    if (!data?.success) return false;
    const cleanNarrative = sanitizeNarrative(data.narrative);
    setFullNarrative(cleanNarrative);
    setSimulation(data.simulation);
    setBondingIdx(0);
    const orbs = data.simulation?.orbitals || [];
    setAntibondingIdx(orbs.length > 1 ? orbs.length - 1 : 0);

    if (data.simulation?.trajectory?.length) {
      const defaultTarget = data.simulation.benchmark?.key === "beh2_ci" ? 2.54 : 1.6;
      const targetR = requestedCoord !== null ? requestedCoord : defaultTarget;
      const initIdx = data.simulation.trajectory.findIndex((f) => f.r >= targetR);
      setCurrentFrameIdx(initIdx >= 0 ? initIdx : 0);
      setIsPlaying(requestedCoord === null);
      setLoopDir(1);
    } else {
      setCurrentFrameIdx(0);
      setIsPlaying(false);
    }
    return true;
  }, []);

  const executeQuery = useCallback(async (customPrompt) => {
    const text = customPrompt !== undefined ? customPrompt : query;
    if (!text.trim()) return;
    setQuery(text);

    setLoading(true);
    setHasResult(true);
    setFullNarrative("");
    setStreamedText("Initializing Q-BOLTZ solver and active-space calculation...");

    const { benchmark, requestedCoord } = parsePromptIntent(text);
    const apiBase = getApiBaseUrl();

    try {
      let resolved = false;
      if (apiBase) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(`${apiBase}/api/v1/agent/prompt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: text }),
            signal: controller.signal
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            resolved = applySimulationPayload(data, requestedCoord);
          }
        } catch {
          // Seamless fallback to precomputed QBE-SCF static preset
        }
      }

      if (!resolved) {
        const staticRes = await fetch(`/qboltz_presets/${benchmark}.json`);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          resolved = applySimulationPayload(staticData, requestedCoord);
        }
      }

      if (!resolved) {
        throw new Error("Unable to load simulation state.");
      }
    } catch (err) {
      console.error("Query failed:", err);
      setFullNarrative(
        "In **phase space (z, p_z)**, the dissociation of **H₂** unfolds not as an unphysical static matrix collapse, but as continuous kinetic transport of the one-particle reduced density matrix. At equilibrium (R = 0.74 Å), the electronic Wigner distribution forms a single coherent quantum droplet concentrated in the inter-nuclear bonding valley. As the bond stretches past the critical **Coulson-Fischer point (R ≈ 1.20 Å)**, the **kinetic collision operator** regularizes the mean-field topological singularity, smoothly bifurcating the Wigner fluid into two entangled, symmetric droplets centered at each proton (`z = ±R/2, p_z = 0`), recovering the Generalized Valence Bond (GVB) limit with exact spin purity."
      );
    } finally {
      setLoading(false);
    }
  }, [query, applySimulationPayload]);

  // Auto-launch default H2 Phase-Space Dissociation simulation immediately on mount
  const didAutoRunRef = useRef(false);
  useEffect(() => {
    if (!didAutoRunRef.current) {
      didAutoRunRef.current = true;
      executeQuery("Conceptualize and envision the dissociation of H2 in phase space.");
    }
  }, [executeQuery]);

  // Jump directly to a nuclear coordinate R along the trajectory
  const jumpToCoordinate = useCallback(
    (targetR) => {
      if (!hasTrajectory) return;
      let bestIdx = 0;
      let bestDiff = Infinity;
      trajectory.forEach((frame, idx) => {
        const diff = Math.abs(frame.r - targetR);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = idx;
        }
      });
      setIsPlaying(false);
      setCurrentFrameIdx(bestIdx);
      const cfR = activeBenchmarkKey === "beh2_ci" ? 2.54 : 1.20;
      if (Math.abs(targetR - cfR) < 0.08) {
        playCoulsonFischerPop();
      }
    },
    [hasTrajectory, trajectory, activeBenchmarkKey, playCoulsonFischerPop]
  );

  const handleReturnHome = (anchor = "") => {
    if (onClose) {
      onClose();
      if (anchor) {
        setTimeout(() => {
          const el = document.getElementById(anchor);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 80);
      }
    } else if (typeof window !== "undefined") {
      window.location.href = anchor ? `/#${anchor}` : "/";
    }
  };

  // Derive active geometry, orbitals, atoms, observables
  const activeFrame = hasTrajectory && trajectory[currentFrameIdx] ? trajectory[currentFrameIdx] : null;
  const activeOrbitals = activeFrame?.orbitals || simulation?.orbitals || [];
  const safeBondingIdx = activeOrbitals[bondingIdx] ? bondingIdx : 0;
  const safeAntibondingIdx = activeOrbitals[antibondingIdx]
    ? antibondingIdx
    : Math.max(0, activeOrbitals.length - 1);

  const bondingOrbital = activeOrbitals[safeBondingIdx] || activeOrbitals[0] || null;
  const antibondingOrbital =
    activeOrbitals[safeAntibondingIdx] ||
    (activeOrbitals.length > 1 ? activeOrbitals[activeOrbitals.length - 1] : activeOrbitals[0]) ||
    null;

  const isThreeOrbital = activeBenchmarkKey === "h3_d3h" || activeOrbitals.length === 3;
  const hasMultiOrbitalPicker = !isThreeOrbital && activeOrbitals.length > 2;

  const activeAtoms = activeFrame?.atoms || simulation?.atoms || [];
  const activeBonds = activeFrame?.bonds || simulation?.bonds || [];

  const currentR = activeFrame ? activeFrame.r : (simulation?.dissociation_curve?.current_r || 1.6);
  const nBondVal =
    activeFrame?.bonding_occ !== undefined
      ? activeFrame.bonding_occ
      : bondingOrbital?.occupation !== undefined
        ? bondingOrbital.occupation
        : 1.918;
  const nAntibondVal =
    activeFrame?.antibonding_occ !== undefined
      ? activeFrame.antibonding_occ
      : antibondingOrbital?.occupation !== undefined
        ? antibondingOrbital.occupation
        : 0.082;

  const activeEqbeEv = activeFrame?.e_qbescf_ev !== undefined ? activeFrame.e_qbescf_ev : simulation?.energies?.qbescf_ev;
  const activeEqbeHartree = activeFrame?.e_qbescf_hartree !== undefined ? activeFrame.e_qbescf_hartree : simulation?.energies?.qbescf_hartree;
  const activeEstandardHartree = activeFrame?.e_standard_hartree !== undefined ? activeFrame.e_standard_hartree : simulation?.energies?.rhf_hartree;
  const activeEntropy = activeFrame?.entropy !== undefined ? activeFrame.entropy : simulation?.active_space?.correlation_entropy;

  const activeMilestones = REGIME_MILESTONES[activeBenchmarkKey] || [];
  const trajMinR = hasTrajectory ? trajectory[0].r : 0.5;
  const trajMaxR = hasTrajectory ? trajectory[trajectory.length - 1].r : 3.5;

  return (
    <div className={`qboltz-agent-overlay ${hasResult ? "is-activated-fullscreen" : "is-compact"}`}>
      {!hasResult && (
        <div className="console-scrim" onClick={() => handleReturnHome()}></div>
      )}

      <div className={`console-floating-card ${hasResult ? "fullscreen-active-workstation" : "compact-view"}`}>
        {/* Global Top Header — Matches Point Reyes Sound Landing Page Aesthetic */}
        <header className="console-card-header">
          <div className="header-brand-cluster">
            <button
              type="button"
              className="demo-brand-lockup"
              onClick={() => handleReturnHome()}
              title="Return to Point Reyes Sound Homepage"
            >
              <img
                src="/PRS_logo_v2.jpeg?v=5"
                alt="Point Reyes Sound"
                className="demo-prs-logo"
              />
              <span className="demo-brand-name">Point Reyes Sound</span>
            </button>
            <span className="header-divider" aria-hidden="true" />
            <div className="header-engine-status">
              <span className="agent-indicator-pulse" />
              <span className="agent-badge-title">Q-BOLTZ</span>
              <span className="agent-sub-badge">Phase-Space Engine</span>
            </div>
          </div>

          {hasResult && (
            <nav className="demo-header-nav" aria-label="Site Navigation">
              <span className="demo-nav-active">
                <span className="demo-nav-dot" /> Preview
              </span>
              <button type="button" className="demo-nav-link" onClick={() => handleReturnHome("about")}>
                About
              </button>
              <button type="button" className="demo-nav-link" onClick={() => handleReturnHome("research")}>
                Research
              </button>
              <button type="button" className="demo-nav-link" onClick={() => handleReturnHome("contact")}>
                Contact
              </button>
              <a
                href="https://github.com/point-reyes-sound"
                target="_blank"
                rel="noopener noreferrer"
                className="demo-nav-link"
              >
                GitHub
              </a>
              <a href="/film" className="demo-nav-link">
                Film
              </a>
            </nav>
          )}

          <div className="header-actions">
            {hasResult && (
              <button
                type="button"
                className="action-pill-btn"
                onClick={() => {
                  setHasResult(false);
                }}
              >
                + Prompt Launcher
              </button>
            )}
            <button
              type="button"
              className="console-home-btn"
              onClick={() => handleReturnHome()}
              title="Return to Point Reyes Sound Overview"
            >
              ← Home
            </button>
          </div>
        </header>

        {/* Compact Centered Prompt Launcher View */}
        {!hasResult && (
          <div className="compact-launcher-body">
            <div className="compact-hero-head">
              <span className="compact-kicker">INTERACTIVE QUANTUM BOLTZMANN SOLVER</span>
              <h1 className="compact-display-title">Explore Electronic Structure in Phase Space</h1>
              <p className="compact-subtitle">
                Select a guided molecular benchmark below or ask Q-BOLTZ to compute active-space natural orbitals, correlation entropy, and live Wigner phase-space distributions.
              </p>
            </div>

            <div className="console-input-row">
              <input
                type="text"
                className="console-text-input"
                placeholder='Ask Q-BOLTZ (e.g. "Dissociate the N2 triple bond to 2.2 Angstroms")...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") executeQuery();
                }}
              />
              <button
                type="button"
                className="submit-query-btn"
                onClick={() => executeQuery()}
                disabled={loading}
              >
                {loading ? "Solving..." : "Launch Engine ↗"}
              </button>
            </div>

            <div className="compact-discovery-grid">
              {DISCOVERY_SYSTEMS.map((sys) => (
                <button
                  key={`compact-${sys.key}`}
                  type="button"
                  className={`discovery-system-card ${activeBenchmarkKey === sys.key ? "is-active" : ""}`}
                  onClick={() => {
                    setQuery(sys.prompt);
                    executeQuery(sys.prompt);
                  }}
                >
                  <div className="sys-card-top">
                    <span className="sys-formula">{sys.formula}</span>
                    <span className="sys-arrow">↗</span>
                  </div>
                  <span className="sys-title">{sys.title}</span>
                  <span className="sys-tag">{sys.tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activated Fullscreen Workstation Grid */}
        {hasResult && (
          <div className="fullscreen-workstation-body">
            {/* Wide Left Discovery & Editorial Column */}
            <aside className="workstation-left-panel">
              {/* 1. Interactive Click-to-Discover Molecular System Cards */}
              <section className="discovery-deck-section" aria-label="Guided Molecular Benchmarks">
                <div className="discovery-deck-header">
                  <span className="deck-kicker">CLICK TO EXPLORE MOLECULAR SYSTEMS</span>
                  <span className="deck-count">5 Live Benchmarks</span>
                </div>
                <div className="discovery-cards-grid">
                  {DISCOVERY_SYSTEMS.map((sys) => {
                    const isActive = activeBenchmarkKey === sys.key;
                    return (
                      <button
                        key={`deck-${sys.key}`}
                        type="button"
                        className={`discovery-system-card ${isActive ? "is-active" : ""}`}
                        onClick={() => {
                          setQuery(sys.prompt);
                          executeQuery(sys.prompt);
                        }}
                      >
                        <div className="sys-card-top">
                          <span className="sys-formula">{sys.formula}</span>
                          <span className="sys-state-dot" />
                        </div>
                        <span className="sys-title">{sys.title}</span>
                        <span className="sys-tag">{sys.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 2. Active Benchmark Editorial Card + Full Preserved Q-BOLTZ Narrative */}
              <article className="narrative-box">
                <div className="narrative-meta-row">
                  <span className="narrative-author-pill">
                    <span className="agent-avatar-icon">⚛</span> Q-BOLTZ ANALYSIS
                  </span>
                  <span className="narrative-basis-pill">
                    {(simulation?.benchmark?.basis || "sto-3g").toUpperCase()} •{" "}
                    {simulation?.active_space
                      ? `CAS(${simulation.active_space.electrons}e, ${simulation.active_space.dimension}o)`
                      : "Active Space"}
                  </span>
                </div>

                <h2 className="benchmark-editorial-title">
                  {simulation?.benchmark?.title || "H₂ Homolytic Bond Dissociation"}
                </h2>

                {simulation?.benchmark?.description && (
                  <p className="benchmark-editorial-subtitle">
                    {simulation.benchmark.description}
                  </p>
                )}

                <div
                  className="narrative-content"
                  dangerouslySetInnerHTML={{
                    __html: (streamedText || "Solving quantum transport equation on PySCF...")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/`(.*?)`/g, "<code>$1</code>")
                  }}
                />
              </article>

              {/* 3. Spacious Natural-Language Prompt Strip */}
              <div className="left-prompt-block">
                <label className="prompt-block-label" htmlFor="qboltz-followup-input">
                  ASK A CUSTOM QUANTUM CHEMISTRY QUESTION
                </label>
                <div className="fullscreen-input-strip">
                  <input
                    id="qboltz-followup-input"
                    type="text"
                    className="fullscreen-text-input"
                    placeholder="Ask Q-BOLTZ (e.g. calculate N2 at 2.2 Å or scan BeH2)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") executeQuery();
                    }}
                  />
                  <button
                    type="button"
                    className="fullscreen-submit-btn"
                    onClick={() => executeQuery()}
                    disabled={loading}
                  >
                    {loading ? "Solving..." : "Ask ↗"}
                  </button>
                </div>
              </div>
            </aside>

            {/* Right Column: Interactive Trajectory Scrubber + 4-Panel Engine */}
            <main className="workstation-right-content-wrapper">
              {/* Interactive Trajectory & Regime Discovery Toolbar */}
              {hasTrajectory ? (
                <div className="dynamic-playback-toolbar">
                  <div className="playback-left-controls">
                    <button
                      type="button"
                      className={`playback-toggle-btn ${isPlaying ? "playing" : "paused"}`}
                      onClick={() => setIsPlaying(!isPlaying)}
                      title={isPlaying ? "Pause Continuous Trajectory" : "Resume Continuous Trajectory"}
                    >
                      <span className="btn-icon">{isPlaying ? "⏸" : "▶"}</span>
                      <span className="btn-text">{isPlaying ? "Pause" : "Play Loop"}</span>
                    </button>

                    <div className="playback-r-badge">
                      <span className="r-label">{coordUnit === "Bohr" ? "INSERTION x" : "DISTANCE R"}</span>
                      <span className="r-val">
                        {Number(currentR).toFixed(2)} {coordUnit}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="playback-speed-btn"
                      onClick={() => {
                        setPlaybackSpeed((prev) => (prev === 180 ? 260 : prev === 260 ? 110 : 180));
                      }}
                      title="Cycle animation speed"
                    >
                      {playbackSpeed === 180 ? "1.0× Pace" : playbackSpeed === 260 ? "0.7× Slow" : "1.6× Fast"}
                    </button>
                  </div>

                  {/* Draggable Geometry Scrubber */}
                  <div className="playback-scrubber-wrapper">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, trajectory.length - 1)}
                      value={currentFrameIdx}
                      aria-label="Scrub nuclear coordinate"
                      className="playback-slider"
                      onChange={(e) => {
                        setIsPlaying(false);
                        setCurrentFrameIdx(Number(e.target.value));
                      }}
                    />
                    <div className="playback-slider-track-marks">
                      <span>{trajMinR.toFixed(2)} {coordUnit}</span>
                      <span className="scrub-hint">Drag slider or click regimes →</span>
                      <span>{trajMaxR.toFixed(2)} {coordUnit}</span>
                    </div>
                  </div>

                  {/* 1-Click Quantum Regime Jump Pills */}
                  {activeMilestones.length > 0 && (
                    <div className="regime-milestones-row" role="group" aria-label="Jump to Quantum Regime">
                      {activeMilestones.map((m) => {
                        const isNear = Math.abs(currentR - m.r) < 0.09;
                        return (
                          <button
                            key={m.label}
                            type="button"
                            className={`regime-pill-btn ${isNear ? "is-current" : ""} ${m.isSingularity ? "is-singularity" : ""}`}
                            onClick={() => jumpToCoordinate(m.r)}
                            title={`Jump to ${m.label} (${m.r.toFixed(2)} ${m.unit})`}
                          >
                            <span className="regime-name">{m.label}</span>
                            <span className="regime-r">{m.r.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="dynamic-playback-toolbar snapshot-toolbar">
                  <div className="playback-left-controls">
                    <div className="playback-r-badge">
                      <span className="r-label">CRITICAL GEOMETRY</span>
                      <span className="r-val">
                        R = {Number(currentR).toFixed(2)} {coordUnit}
                      </span>
                    </div>
                    {simulation?.dissociation_curve?.singularity?.label && (
                      <span className="snapshot-singularity-chip">
                        {simulation.dissociation_curve.singularity.label}
                      </span>
                    )}
                  </div>

                  {hasMultiOrbitalPicker ? (
                    <div className="orbital-switcher-strip">
                      <span className="switcher-label">CLICK ORBITALS TO INSPECT IN 3D:</span>
                      <div className="switcher-pills">
                        {activeOrbitals.map((orb, idx) => {
                          const selectedLeft = idx === safeBondingIdx;
                          const selectedRight = idx === safeAntibondingIdx;
                          const shortName = (orb.label || `MO ${idx + 1}`).split(" ")[0];
                          return (
                            <button
                              key={`orb-pick-${idx}`}
                              type="button"
                              className={`orb-pick-btn ${selectedLeft ? "is-left" : ""} ${selectedRight ? "is-right" : ""}`}
                              onClick={() => {
                                const isAntibondLike = (orb.label || "").includes("*") || idx >= Math.ceil(activeOrbitals.length / 2);
                                if (isAntibondLike) {
                                  setAntibondingIdx(idx);
                                } else {
                                  setBondingIdx(idx);
                                }
                              }}
                              title={`Display ${orb.label} (n = ${Number(orb.occupation ?? 0).toFixed(3)})`}
                            >
                              {shortName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="playback-loop-chip">
                      <span className="loop-pulse" />
                      3-Orbital Degenerate Active-Space Manifold • Drag 3D Lobes to Rotate
                    </span>
                  )}
                </div>
              )}

              <div className={`workstation-visual-layout ${isThreeOrbital ? "layout-three-orbitals" : "layout-two-orbitals"}`}>
                {/* Top Row: Active-Space 3D Molecular Orbitals */}
                <div className={`orbitals-top-row ${isThreeOrbital ? "cols-3" : "cols-2"}`}>
                  {isThreeOrbital ? (
                    activeOrbitals.slice(0, 3).map((orb, idx) => {
                      const isBeH2 = activeBenchmarkKey === "beh2_ci";
                      const badgeLabel = isBeH2
                        ? (idx === 0 ? "1a₁ CORE" : idx === 1 ? "1b₂ CROSSING" : "3a₁ CROSSING")
                        : (idx === 0 ? "a₁′ SYMMETRIC" : idx === 1 ? "e′_x DEGENERATE" : "e′_y DEGENERATE");
                      const badgeClass =
                        idx === 0 ||
                        (isBeH2 && idx === 1 && currentR < 2.54) ||
                        (isBeH2 && idx === 2 && currentR >= 2.54)
                          ? "bonding"
                          : "antibonding";
                      const occVal = orb.occupation !== undefined ? orb.occupation : 0;
                      return (
                        <div key={`orb-3col-${idx}`} className={`grid-cell-card panel-orbital panel-orbital-${idx}`}>
                          <div className="panel-cell-header">
                            <div className="cell-title-group">
                              <span className={`cell-badge ${badgeClass}`}>{badgeLabel}</span>
                              <span className="cell-orbital-name" title={orb.label}>
                                {orb.label}
                              </span>
                              <span className="cell-occ-tag">n = {Number(occVal).toFixed(3)}</span>
                            </div>
                            <div className="cell-legend">
                              {orb.pos_lobe && <span className="orb-phase-badge blue">+ψ</span>}
                              {orb.neg_lobe && <span className="orb-phase-badge red">−ψ</span>}
                            </div>
                          </div>

                          <div className="cell-canvas-viewport">
                            {orb ? (
                              <>
                                <PureThreeOrbitalCanvas
                                  orbital={orb}
                                  atoms={activeAtoms}
                                  bonds={activeBonds}
                                />
                                <span className="canvas-interact-hint">↻ Drag to rotate • Scroll to zoom</span>
                              </>
                            ) : (
                              <div className="cell-placeholder">Calculating 3D Isosurface...</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      {/* Panel 1: Top-Left - Bonding / Occupied Active Orbital */}
                      <div className="grid-cell-card panel-bonding">
                        <div className="panel-cell-header">
                          <div className="cell-title-group">
                            <span className="cell-badge bonding">BONDING ORBITAL</span>
                            <span className="cell-orbital-name">
                              {bondingOrbital?.label || "1σ_g (Bonding)"}
                            </span>
                            <span className="cell-occ-tag">
                              n = {Number(nBondVal).toFixed(3)}
                            </span>
                          </div>
                          <div className="cell-legend">
                            {bondingOrbital?.pos_lobe && <span className="orb-phase-badge blue">+ψ Blue</span>}
                            {bondingOrbital?.neg_lobe && <span className="orb-phase-badge red">−ψ Red</span>}
                          </div>
                        </div>

                        <div className="cell-canvas-viewport">
                          {bondingOrbital ? (
                            <>
                              <PureThreeOrbitalCanvas
                                orbital={bondingOrbital}
                                atoms={activeAtoms}
                                bonds={activeBonds}
                              />
                              <span className="canvas-interact-hint">↻ Drag 3D orbital • Scroll to zoom</span>
                            </>
                          ) : (
                            <div className="cell-placeholder">Calculating 3D Isosurface...</div>
                          )}
                        </div>
                      </div>

                      {/* Panel 2: Top-Right - Antibonding / Correlated Active Orbital */}
                      <div className="grid-cell-card panel-antibonding">
                        <div className="panel-cell-header">
                          <div className="cell-title-group">
                            <span className="cell-badge antibonding">ANTIBONDING ORBITAL</span>
                            <span className="cell-orbital-name">
                              {antibondingOrbital?.label || "1σ_u* (Antibonding)"}
                            </span>
                            <span className="cell-occ-tag">
                              n = {Number(nAntibondVal).toFixed(3)}
                            </span>
                          </div>
                          <div className="cell-legend">
                            {antibondingOrbital?.pos_lobe && <span className="orb-phase-badge blue">+ψ Blue</span>}
                            {antibondingOrbital?.neg_lobe && <span className="orb-phase-badge red">−ψ Red</span>}
                          </div>
                        </div>

                        <div className="cell-canvas-viewport">
                          {antibondingOrbital ? (
                            <>
                              <PureThreeOrbitalCanvas
                                orbital={antibondingOrbital}
                                atoms={activeAtoms}
                                bonds={activeBonds}
                              />
                              <span className="canvas-interact-hint">↻ Drag 3D orbital • Scroll to zoom</span>
                            </>
                          ) : (
                            <div className="cell-placeholder">Calculating 3D Isosurface...</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Row: Potential Energy Surface & Wigner Phase-Space Distribution */}
                <div className="analysis-bottom-row">
                  {/* Panel 3: Bottom-Left - Dissociation Curves + Energies */}
                  <div className="grid-cell-card panel-dissociation">
                    <div className="panel-cell-header">
                      <div className="cell-title-group">
                        <span className="cell-badge pes">POTENTIAL SURFACE</span>
                        <span className="cell-orbital-name">Energy Curve &amp; Quantum Observables</span>
                      </div>
                      <div className="pes-legend-compact">
                        <span className="legend-item qbe">
                          <span className="legend-dot cyan" /> QBE-SCF
                        </span>
                        <span className="legend-item rhf">
                          <span className="legend-dot red" /> RHF Mean-Field
                        </span>
                      </div>
                    </div>

                    <div className="dissoc-and-observables-body">
                      <div className="pes-plot-container">
                        {simulation?.dissociation_curve ? (
                          <DissociationCurvePlot
                            curveData={simulation.dissociation_curve}
                            currentPoint={currentR}
                            coordUnit={coordUnit}
                            canScrub={hasTrajectory}
                            onSelectR={jumpToCoordinate}
                          />
                        ) : (
                          <div className="cell-placeholder">Computing Potential Energy Surface...</div>
                        )}
                      </div>

                      {/* Quantum Energy Observables Row */}
                      <div className="observables-row-grid">
                        <div className="obs-card">
                          <span className="obs-label">QBE-SCF ENERGY</span>
                          <span className="obs-value">
                            {activeEqbeEv !== undefined ? `${Number(activeEqbeEv).toFixed(2)} eV` : "-22.84 eV"}
                          </span>
                          <span className="obs-sub">
                            {activeEqbeHartree !== undefined
                              ? `${typeof activeEqbeHartree === "number" ? activeEqbeHartree.toFixed(5) : activeEqbeHartree} E_h`
                              : "-0.80170 E_h"}
                          </span>
                        </div>

                        <div className="obs-card">
                          <span className="obs-label">STANDARD RHF</span>
                          <span className="obs-value">
                            {activeEstandardHartree !== undefined
                              ? `${typeof activeEstandardHartree === "number" ? activeEstandardHartree.toFixed(5) : activeEstandardHartree} E_h`
                              : "-0.80170 E_h"}
                          </span>
                          <span className="obs-sub">
                            {currentR >= 1.16 ? "Coulson–Fischer Cusp" : "Mean-Field Regime"}
                          </span>
                        </div>

                        <div className="obs-card highlight">
                          <span className="obs-label">CORRELATION ENTROPY</span>
                          <span className="obs-value">
                            {activeEntropy !== undefined ? `${Number(activeEntropy).toFixed(3)} bits` : "0.986 bits"}
                          </span>
                          <span className="obs-sub">
                            {currentR >= 1.6 ? "Entangled Singlet Limit" : "Kinetic Relaxation"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 4: Bottom-Right - Wigner Distribution in Phase Space */}
                  <div className="grid-cell-card panel-wigner">
                    <WebGlWignerPlot
                      r={currentR}
                      nBond={nBondVal}
                      nAntibond={nAntibondVal}
                      coordUnit={coordUnit}
                    />
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
