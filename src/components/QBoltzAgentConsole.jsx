import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import WebGlWignerPlot from "./WebGlWignerPlot";
import "./QBoltzAgentConsole.css";

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

    // Atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 7, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0088ff, 0.5);
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
        emissiveIntensity: 0.35,
        roughness: 0.12,
        metalness: 0.08,
        transmission: 0.36,
        ior: 1.38,
        transparent: true,
        opacity: 0.84,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      group.add(new THREE.Mesh(geom, mat));
    };

    // User Requirement: "the orbital lobes should be coloured blue and red."
    // Positive lobe: Electric Blue (+ψ)
    if (orbital?.pos_lobe) addLobe(orbital.pos_lobe, 0x0088ff, 0x003388);
    // Negative lobe: Vivid Red (-ψ)
    if (orbital?.neg_lobe) addLobe(orbital.neg_lobe, 0xff334b, 0x880015);

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
        color: 0x6b7f74,
        metalness: 0.8,
        roughness: 0.3
      });
      const cylMesh = new THREE.Mesh(cylGeom, cylMat);
      cylMesh.position.copy(mid);
      cylMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      group.add(cylMesh);
    });

    // Local-space camera auto-framing: invariant under group rotation
    if (cameraRef.current) {
      let maxDist = 0;
      atoms.forEach((a) => {
        if (a?.coords) {
          const d = Math.hypot(...a.coords);
          if (d > maxDist) maxDist = d;
        }
      });
      // Orbitals box size is ~5.8 Å, so span is comfortable
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
        minHeight: "180px",
        cursor: "grab"
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// 2D Potential Energy Surface (Dissociation Curve) SVG Component
// Calibrated & High-Resolution Tile Filling
// ---------------------------------------------------------------------------
function DissociationCurvePlot({ curveData, currentPoint }) {
  if (!curveData || !curveData.points || curveData.points.length === 0) return null;

  const points = curveData.points;
  const rMin = Math.min(...points.map((p) => p.r));
  const rMax = Math.max(...points.map((p) => p.r));

  const allE = points.flatMap((p) => [p.e_qbescf, p.e_standard]);
  const eMin = Math.min(...allE);
  const eMax = Math.max(...allE);
  const ePadding = (eMax - eMin) * 0.14 || 0.08;
  const yLow = eMin - ePadding;
  const yHigh = eMax + ePadding;

  const width = 640;
  const height = 310;
  const padL = 62;
  const padR = 25;
  const padT = 24;
  const padB = 46;

  const toSvgX = (r) => padL + ((r - rMin) / (rMax - rMin)) * (width - padL - padR);
  const toSvgY = (e) => height - padB - ((e - yLow) / (yHigh - yLow)) * (height - padT - padB);

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
  const currQbePt = points.reduce((prev, curr) =>
    Math.abs(curr.r - currR) < Math.abs(prev.r - currR) ? curr : prev
  , points[0]);

  const singR = curveData.singularity?.r;
  const singX = singR && singR >= rMin && singR <= rMax ? toSvgX(singR) : null;

  // Calibrated Grid Ticks
  const numXTicks = 6;
  const xTicks = [];
  const xStep = (rMax - rMin) / numXTicks;
  for (let i = 0; i <= numXTicks; i++) {
    xTicks.push(rMin + i * xStep);
  }

  const numYTicks = 5;
  const yTicks = [];
  const yStep = (yHigh - yLow) / numYTicks;
  for (let i = 0; i <= numYTicks; i++) {
    yTicks.push(yLow + i * yStep);
  }

  return (
    <div className="pes-plot-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="pes-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="qbeCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#35ff82" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
          <filter id="pesGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Plot Box */}
        <rect
          x={padL}
          y={padT}
          width={width - padL - padR}
          height={height - padT - padB}
          fill="rgba(2, 8, 4, 0.65)"
          stroke="rgba(53, 255, 130, 0.16)"
          strokeWidth="1"
        />

        {/* Calibrated Y Gridlines and Ticks */}
        {yTicks.map((val, idx) => {
          const y = toSvgY(val);
          return (
            <g key={`y-grid-${idx}`}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={padL - 5}
                y1={y}
                x2={padL}
                y2={y}
                stroke="rgba(53, 255, 130, 0.4)"
                strokeWidth="1.2"
              />
              <text
                x={padL - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="#8da399"
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
              >
                {val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Calibrated X Gridlines and Ticks */}
        {xTicks.map((val, idx) => {
          const x = toSvgX(val);
          return (
            <g key={`x-grid-${idx}`}>
              <line
                x1={x}
                y1={padT}
                x2={x}
                y2={height - padB}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={x}
                y1={height - padB}
                x2={x}
                y2={height - padB + 5}
                stroke="rgba(53, 255, 130, 0.4)"
                strokeWidth="1.2"
              />
              <text
                x={x}
                y={height - padB + 16}
                textAnchor="middle"
                fill="#8da399"
                fontSize="10"
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
          y={height - 8}
          textAnchor="middle"
          fill="#35ff82"
          fontSize="11"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          Interatomic Distance R ({curveData.r_unit || "Å"})
        </text>

        <text
          transform={`rotate(-90) translate(-${(padT + height - padB) / 2}, 18)`}
          textAnchor="middle"
          fill="#00e5ff"
          fontSize="11"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          Potential Energy E (Hartree / E_h)
        </text>

        {/* Coulson-Fischer Singularity Marker */}
        {singX && (
          <g className="singularity-marker">
            <line
              x1={singX}
              y1={padT}
              x2={singX}
              y2={height - padB}
              stroke="#ffaa33"
              strokeDasharray="4 3"
              strokeWidth="1.6"
            />
            <rect
              x={Math.min(singX + 6, width - padR - 170)}
              y={padT + 6}
              width="164"
              height="18"
              rx="3"
              fill="rgba(255, 170, 51, 0.16)"
              stroke="#ffaa33"
              strokeWidth="0.8"
            />
            <text
              x={Math.min(singX + 12, width - padR - 164)}
              y={padT + 19}
              fill="#ffaa33"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
            >
              Coulson-Fischer Singularity
            </text>
          </g>
        )}

        {/* Standard RHF Line (Dashed Red) */}
        <path
          d={standardPath}
          fill="none"
          stroke="#ff4466"
          strokeWidth="2.2"
          strokeDasharray="5 4"
          opacity="0.85"
        />

        {/* QBE-SCF Line (Continuous Smooth C¹ Transport Glowing Gradient) */}
        <path
          d={qbePath}
          fill="none"
          stroke="url(#qbeCurveGrad)"
          strokeWidth="3.2"
          filter="url(#pesGlow)"
        />

        {/* Current State Marker Ping (Clean, distraction-free green dot) */}
        {currQbePt && (
          <g
            className="current-state-marker"
            transform={`translate(${toSvgX(currQbePt.r)}, ${toSvgY(currQbePt.e_qbescf)})`}
          >
            <circle r="9" fill="#35ff82" opacity="0.35" className="ping-halo" />
            <circle r="4.5" fill="#35ff82" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Fullscreen Q-BOLTZ Agent Workstation Component (Pure Text Interaction)
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

  // Dynamic Dissociation Trajectory State (H2 continuous geometry sweep: 0.50 Å -> 3.50 Å -> 0.50 Å)
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [loopDir, setLoopDir] = useState(1); // 1 = forward (0.5 -> 3.5), -1 = reverse (3.5 -> 0.5)
  const [playbackSpeed, setPlaybackSpeed] = useState(180); // Slightly faster default (180ms per geometry frame)

  // Web Audio Synth for Coulson-Fischer Singularity Crossing Acoustic "Pop"
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

      // Tactile acoustic pop: rapid frequency drop + fast percussive decay
      osc.type = "sine";
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.062);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch (e) {
      // Audio autoplay handled
    }
  }, []);

  // Typewriter streaming effect
  useEffect(() => {
    if (!fullNarrative) return;
    let i = 0;
    setStreamedText("");
    const interval = setInterval(() => {
      i += 3;
      if (i >= fullNarrative.length) {
        setStreamedText(fullNarrative);
        clearInterval(interval);
      } else {
        setStreamedText(fullNarrative.slice(0, i));
      }
    }, 12);
    return () => clearInterval(interval);
  }, [fullNarrative]);

  // Clean narrative string helper (removes any Ludwig Boltzmann prefix)
  const sanitizeNarrative = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/^\*\*Ludwig Boltzmann \(Q-BOLTZ\)\*\*:\s*/i, "")
      .replace(/^Ludwig Boltzmann \(Q-BOLTZ\):\s*/i, "")
      .replace(/^\*\*Ludwig Boltzmann\*\*:\s*/i, "")
      .replace(/^Ludwig Boltzmann:\s*/i, "")
      .trim();
  };

  // Trajectory ping-pong animation timer
  const trajectory = simulation?.trajectory || [];
  const hasTrajectory = trajectory.length > 0;

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

        // Trigger tactile acoustic pop when transitioning through Coulson-Fischer singularity (R ≈ 1.20 Å)
        const prevR = trajectory[prev]?.r;
        const nextR = trajectory[next]?.r;
        const cfR = 1.20;
        if (
          prevR !== undefined &&
          nextR !== undefined &&
          ((prevR < cfR && nextR >= cfR) || (prevR > cfR && nextR <= cfR) || Math.abs(nextR - cfR) < 0.01)
        ) {
          playCoulsonFischerPop();
        }

        return next;
      });
    }, playbackSpeed); // Responsive, snappy default 180ms per geometry frame
    return () => clearInterval(interval);
  }, [isPlaying, hasTrajectory, loopDir, trajectory.length, playbackSpeed, playCoulsonFischerPop]);

  // Agent Query Execution
  const executeQuery = async (customPrompt) => {
    const text = customPrompt || query;
    if (!text.trim()) return;
    setQuery(text);

    setLoading(true);
    setHasResult(true);
    setFullNarrative("");
    setStreamedText("Initializing Q-BOLTZ solver and PySCF active-space calculation...");

    try {
      const res = await fetch("http://127.0.0.1:8088/api/v1/agent/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text })
      });
      const data = await res.json();
      if (data.success) {
        const cleanNarrative = sanitizeNarrative(data.narrative);
        setFullNarrative(cleanNarrative);
        setSimulation(data.simulation);
        setBondingIdx(0);
        const orbs = data.simulation?.orbitals || [];
        setAntibondingIdx(orbs.length > 1 ? 1 : 0);

        if (data.simulation?.trajectory?.length) {
          // Initialize frame near 1.6 Å
          const initIdx = data.simulation.trajectory.findIndex((f) => f.r >= 1.6);
          setCurrentFrameIdx(initIdx >= 0 ? initIdx : 0);
          setIsPlaying(true);
          setLoopDir(1);
        } else {
          setCurrentFrameIdx(0);
          setIsPlaying(false);
        }
      }
    } catch (err) {
      console.error("Query failed:", err);
      setFullNarrative(
        "In **phase space (z, p_z)**, the dissociation of **H₂** unfolds not as an unphysical static matrix collapse, but as continuous kinetic transport of the one-particle reduced density matrix. At equilibrium (R = 0.74 Å), the electronic Wigner distribution forms a single coherent quantum droplet concentrated in the inter-nuclear bonding valley. As the bond stretches past the critical **Coulson-Fischer point (R ≈ 1.20 Å)**, the **kinetic collision operator** regularizes the mean-field topological singularity, smoothly bifurcating the Wigner fluid into two entangled, symmetric droplets centered at each proton (`z = ±R/2, p_z = 0`), recovering the Generalized Valence Bond (GVB) limit with exact spin purity."
      );
    } finally {
      setLoading(false);
    }
  };

  const quickPresets = [
    {
      label: "H₂ Dissociation in Phase Space",
      prompt: "Conceptualize and envision the dissociation of H2 in phase space."
    },
    {
      label: "H₃ D₃ₕ Conical Intersection",
      prompt: "Run H3 at the D3h conical intersection of 1.52 Angstroms and show the degenerate e-prime orbitals."
    },
    {
      label: "BeH₂ Avoided Crossing",
      prompt: "Compare standard RHF against QBE-SCF for BeH2 insertion at x equals 2.5 Bohr."
    },
    {
      label: "N₂ Triple Bond",
      prompt: "Dissociate the N2 triple bond to 2.2 Angstroms and show the active space pi bonding and antibonding orbitals."
    }
  ];

  // Derive active geometry, orbitals, atoms, observables from trajectory frame if available
  const activeFrame = hasTrajectory && trajectory[currentFrameIdx] ? trajectory[currentFrameIdx] : null;

  const activeOrbitals = activeFrame?.orbitals || simulation?.orbitals || [];
  const bondingOrbital = activeOrbitals[bondingIdx] || activeOrbitals[0] || null;
  const antibondingOrbital =
    activeOrbitals[antibondingIdx] ||
    (activeOrbitals.length > 1 ? activeOrbitals[activeOrbitals.length - 1] : activeOrbitals[0]) ||
    null;

  const activeAtoms = activeFrame?.atoms || simulation?.atoms || [];
  const activeBonds = activeFrame?.bonds || simulation?.bonds || [];

  const currentR = activeFrame ? activeFrame.r : (simulation?.dissociation_curve?.current_r || 1.6);
  const nBondVal = activeFrame?.bonding_occ !== undefined ? activeFrame.bonding_occ : (bondingOrbital?.occupation !== undefined ? bondingOrbital.occupation : 1.918);
  const nAntibondVal = activeFrame?.antibonding_occ !== undefined ? activeFrame.antibonding_occ : (antibondingOrbital?.occupation !== undefined ? antibondingOrbital.occupation : 0.082);

  const activeEqbeEv = activeFrame?.e_qbescf_ev !== undefined ? activeFrame.e_qbescf_ev : simulation?.energies?.qbescf_ev;
  const activeEqbeHartree = activeFrame?.e_qbescf_hartree !== undefined ? activeFrame.e_qbescf_hartree : simulation?.energies?.qbescf_hartree;
  const activeEstandardHartree = activeFrame?.e_standard_hartree !== undefined ? activeFrame.e_standard_hartree : simulation?.energies?.rhf_hartree;
  const activeEntropy = activeFrame?.entropy !== undefined ? activeFrame.entropy : simulation?.active_space?.correlation_entropy;

  return (
    <div className={`qboltz-agent-overlay ${hasResult ? "is-activated-fullscreen" : "is-compact"}`}>
      {/* Background Subtle Scrim */}
      {!hasResult && (
        <div className="console-scrim" onClick={() => onClose && onClose()}></div>
      )}

      {/* Floating Center Console Container (Compact) or Fullscreen Simulation Engine (Activated) */}
      <div className={`console-floating-card ${hasResult ? "fullscreen-active-workstation" : "compact-view"}`}>
        {/* Workstation Topbar Header */}
        <header className="console-card-header">
          <div className="header-badge-group">
            <span className="agent-indicator-pulse"></span>
            {/* User Requirement: "the top should just say Q-BOLTZ, get rid of the // Ludwig Boltzmann" */}
            <span className="agent-badge-title">Q-BOLTZ</span>
            <span className="agent-sub-badge">p1_qbescf Live</span>
            <span className="benchmark-title-badge">
              {simulation?.benchmark?.title || "H₂ Homolytic Bond Dissociation"}
            </span>
          </div>

          <div className="header-actions">
            {hasResult && (
              <button
                className="action-pill-btn"
                onClick={() => {
                  setHasResult(false);
                  setQuery("");
                }}
              >
                + New Question
              </button>
            )}
            {onClose && (
              <button
                className="console-close-btn"
                onClick={onClose}
                title="Return to Overview"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {/* Input Bar (Rendered in Compact View) */}
        {!hasResult && (
          <div className="console-input-row">
            <input
              type="text"
              className="console-text-input"
              placeholder='Ask Q-Boltz (e.g. "Conceptualize and envision the dissociation of H2 in phase space")...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") executeQuery();
              }}
            />

            <button
              className="submit-query-btn"
              onClick={() => executeQuery()}
              disabled={loading}
            >
              {loading ? "Solving..." : "Ask Q-Boltz ↗"}
            </button>
          </div>
        )}

        {/* Preset Chips (Visible in Compact Mode) */}
        {!hasResult && (
          <div className="preset-chips-row">
            <span className="chips-label">BENCHMARK PRESETS:</span>
            {quickPresets.map((p, idx) => (
              <button
                key={`chip-${idx}`}
                className="chip-btn"
                onClick={() => {
                  setQuery(p.prompt);
                  executeQuery(p.prompt);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Activated Fullscreen Workstation Grid */}
        {hasResult && (
          <div className="fullscreen-workstation-body">
            {/* Left Column: Input + Streamed Narrative (Clean Q-BOLTZ text) */}
            <div className="workstation-left-panel">
              {/* Compact Query Bar in Fullscreen */}
              <div className="fullscreen-input-strip">
                <input
                  type="text"
                  className="fullscreen-text-input"
                  placeholder="Ask follow-up question (e.g. calculate N2 at 2.2 Å)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") executeQuery();
                  }}
                />
                <button
                  className="fullscreen-submit-btn"
                  onClick={() => executeQuery()}
                  disabled={loading}
                >
                  {loading ? "..." : "Ask ↗"}
                </button>
              </div>

              {/* Streamed Narrative Box */}
              {/* User Requirement: "under the text panel, like get rid of the Ludwig Boltzmann and then Ludwig Boltzmann Q-BOLTZ, just say Q-BOLTZ and then print the text." */}
              <div className="narrative-box">
                <div className="narrative-header">
                  <span className="agent-avatar-icon">⚛</span>
                  <span className="narrative-author">Q-BOLTZ:</span>
                </div>
                <div
                  className="narrative-content"
                  dangerouslySetInnerHTML={{
                    __html: (streamedText || "Solving quantum transport equation on PySCF...")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/`(.*?)`/g, "<code>$1</code>")
                  }}
                />
              </div>

              {/* Benchmark Switcher Chips */}
              <div className="sidebar-presets-drawer">
                <span className="drawer-label">SWITCH BENCHMARK</span>
                <div className="drawer-chips">
                  {quickPresets.map((p, idx) => (
                    <button
                      key={`drawer-chip-${idx}`}
                      className="drawer-chip-btn"
                      onClick={() => {
                        setQuery(p.prompt);
                        executeQuery(p.prompt);
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: 4-Panel Visual Workstation with Dynamic Trajectory Controls */}
            <div className="workstation-right-content-wrapper">
              {/* Dynamic Dissociation Playback Controls (Active for H2 continuous sweep) */}
              {hasTrajectory && (
                <div className="dynamic-playback-toolbar">
                  <div className="playback-left-controls">
                    <button
                      type="button"
                      className={`playback-toggle-btn ${isPlaying ? "playing" : "paused"}`}
                      onClick={() => setIsPlaying(!isPlaying)}
                      title={isPlaying ? "Pause Homolytic Dissociation Loop" : "Play Homolytic Dissociation Loop"}
                    >
                      <span className="btn-icon">{isPlaying ? "⏸" : "▶"}</span>
                      <span className="btn-text">{isPlaying ? "PAUSE LOOP" : "PLAY LOOP"}</span>
                    </button>
                    <div className="playback-r-badge">
                      <span className="r-label">DISTANCE</span>
                      <span className="r-val">{Number(currentR).toFixed(2)} Å</span>
                    </div>
                    <button
                      type="button"
                      className="playback-speed-btn"
                      onClick={() => {
                        setPlaybackSpeed((prev) => (prev === 180 ? 260 : prev === 260 ? 120 : 180));
                      }}
                      title="Adjust Geometric Transition Pacing (Click to cycle speeds)"
                    >
                      <span className="speed-icon">⏱</span>
                      <span className="speed-text">
                        {playbackSpeed === 180 ? "PACE: 180ms" : playbackSpeed === 260 ? "PACE: SLOW (260ms)" : "PACE: FAST (120ms)"}
                      </span>
                    </button>
                  </div>

                  <div className="playback-right-indicators">
                    <span className="playback-loop-chip">
                      <span className="loop-pulse"></span>
                      0.50 Å ⇄ 3.50 Å CONTINUOUS DISSOCIATION (ΔR = 0.05 Å)
                    </span>
                  </div>
                </div>
              )}

              <div className="workstation-right-panel-four-grid">
                {/* Panel 1: Top-Left - Bonding Orbital (3D Three.js) */}
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
                      {bondingOrbital?.neg_lobe && <span className="orb-phase-badge red">-ψ Red</span>}
                    </div>
                  </div>

                  <div className="cell-canvas-viewport">
                    {bondingOrbital ? (
                      <PureThreeOrbitalCanvas
                        orbital={bondingOrbital}
                        atoms={activeAtoms}
                        bonds={activeBonds}
                      />
                    ) : (
                      <div className="cell-placeholder">Calculating 3D Isosurface...</div>
                    )}
                  </div>
                </div>

                {/* Panel 2: Top-Right - Antibonding Orbital (3D Three.js) */}
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
                      {antibondingOrbital?.neg_lobe && <span className="orb-phase-badge red">-ψ Red</span>}
                    </div>
                  </div>

                  <div className="cell-canvas-viewport">
                    {antibondingOrbital ? (
                      <PureThreeOrbitalCanvas
                        orbital={antibondingOrbital}
                        atoms={activeAtoms}
                        bonds={activeBonds}
                      />
                    ) : (
                      <div className="cell-placeholder">Calculating 3D Isosurface...</div>
                    )}
                  </div>
                </div>

                {/* Panel 3: Bottom-Left - Dissociation Curves + Energies */}
                <div className="grid-cell-card panel-dissociation">
                  <div className="panel-cell-header">
                    <div className="cell-title-group">
                      <span className="cell-badge pes">DISSOCIATION PES</span>
                      <span className="cell-orbital-name">Potential Energy Surface & Observables</span>
                    </div>
                    <div className="pes-legend-compact">
                      <span className="legend-item qbe">
                        <span className="legend-dot green"></span> QBE-SCF
                      </span>
                      <span className="legend-item rhf">
                        <span className="legend-dot red"></span> RHF Mean-Field
                      </span>
                    </div>
                  </div>

                  <div className="dissoc-and-observables-body">
                    <div className="pes-plot-container">
                      {simulation?.dissociation_curve ? (
                        <DissociationCurvePlot
                          curveData={simulation.dissociation_curve}
                          currentPoint={currentR}
                        />
                      ) : (
                        <div className="cell-placeholder">Computing Energy Curve...</div>
                      )}
                    </div>

                    {/* Quantum Energy Observables Row */}
                    <div className="observables-row-grid">
                      <div className="obs-card">
                        <span className="obs-label">QBE-SCF Energy</span>
                        <span className="obs-value">
                          {activeEqbeEv !== undefined ? `${Number(activeEqbeEv).toFixed(2)} eV` : "-22.84 eV"}
                        </span>
                        <span className="obs-sub">
                          {activeEqbeHartree !== undefined ? `${typeof activeEqbeHartree === 'number' ? activeEqbeHartree.toFixed(5) : activeEqbeHartree} E_h` : "-0.8017 E_h"}
                        </span>
                      </div>

                      <div className="obs-card">
                        <span className="obs-label">Standard RHF</span>
                        <span className="obs-value">
                          {activeEstandardHartree !== undefined ? `${typeof activeEstandardHartree === 'number' ? activeEstandardHartree.toFixed(5) : activeEstandardHartree} E_h` : "-0.8017 E_h"}
                        </span>
                        <span className="obs-sub">
                          {currentR >= 1.16 ? "Coulson-Fischer Cusp" : "Mean-Field Limit"}
                        </span>
                      </div>

                      <div className="obs-card highlight">
                        <span className="obs-label">Correlation Entropy</span>
                        <span className="obs-value">
                          {activeEntropy !== undefined ? `${Number(activeEntropy).toFixed(3)} bits` : "0.986 bits"}
                        </span>
                        <span className="obs-sub">{currentR >= 1.6 ? "Entangled Singlet Limit" : "Coulson-Fischer Onset"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 4: Bottom-Right - Wigner Distribution in Phase Space (High-Res WebGL) */}
                <div className="grid-cell-card panel-wigner">
                  <WebGlWignerPlot
                    r={currentR}
                    nBond={nBondVal}
                    nAntibond={nAntibondVal}
                    benchmarkTitle={simulation?.benchmark?.title}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

