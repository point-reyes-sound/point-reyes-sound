import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import "./QBoltzAgentConsole.css";

// ---------------------------------------------------------------------------
// Pure Three.js 3D Orbital Canvas (Blue & Red Lobes, Zero Fiber dependency)
// ---------------------------------------------------------------------------
function PureThreeOrbitalCanvas({ orbital, atoms = [], bonds = [] }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 4.4);
    camera.lookAt(0, 0, 0);

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
        group.rotation.y += 0.005;
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
// ---------------------------------------------------------------------------
function DissociationCurvePlot({ curveData, currentPoint }) {
  if (!curveData || !curveData.points || curveData.points.length === 0) return null;

  const points = curveData.points;
  const rMin = Math.min(...points.map((p) => p.r));
  const rMax = Math.max(...points.map((p) => p.r));

  const allE = points.flatMap((p) => [p.e_qbescf, p.e_standard]);
  const eMin = Math.min(...allE);
  const eMax = Math.max(...allE);
  const ePadding = (eMax - eMin) * 0.15 || 0.1;
  const yLow = eMin - ePadding;
  const yHigh = eMax + ePadding;

  const width = 380;
  const height = 180;
  const padL = 52;
  const padR = 20;
  const padT = 20;
  const padB = 32;

  const toSvgX = (r) => padL + ((r - rMin) / (rMax - rMin)) * (width - padL - padR);
  const toSvgY = (e) => height - padB - ((e - yLow) / (yHigh - yLow)) * (height - padT - padB);

  const qbePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toSvgX(p.r).toFixed(1)} ${toSvgY(p.e_qbescf).toFixed(1)}`)
    .join(" ");

  const standardPath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toSvgX(p.r).toFixed(1)} ${toSvgY(p.e_standard).toFixed(1)}`)
    .join(" ");

  const currR = currentPoint !== undefined ? currentPoint : curveData.current_r;
  const currQbePt = points.reduce((prev, curr) =>
    Math.abs(curr.r - currR) < Math.abs(prev.r - currR) ? curr : prev
  , points[0]);

  const singR = curveData.singularity?.r;
  const singX = singR && singR >= rMin && singR <= rMax ? toSvgX(singR) : null;

  return (
    <div className="pes-plot-wrapper">
      <div className="pes-header">
        <span className="pes-title">POTENTIAL ENERGY SURFACE // {curveData.r_label || "R (Å)"}</span>
        <div className="pes-legend">
          <span className="legend-item qbe">
            <span className="legend-dot green"></span> QBE-SCF (Smooth)
          </span>
          <span className="legend-item rhf">
            <span className="legend-dot red"></span> Mean-Field (RHF)
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="pes-svg">
        <defs>
          <linearGradient id="qbeCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#35ff82" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Singularity vertical marker */}
        {singX && (
          <g className="singularity-marker">
            <line
              x1={singX}
              y1={padT}
              x2={singX}
              y2={height - padB}
              stroke="#ffaa33"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
            <text x={singX + 4} y={padT + 12} fill="#ffaa33" fontSize="9" fontFamily="monospace">
              Coulson-Fischer Cusp
            </text>
          </g>
        )}

        {/* Standard RHF Line (Dashed) */}
        <path
          d={standardPath}
          fill="none"
          stroke="#ff4466"
          strokeWidth="1.8"
          strokeDasharray="4 3"
          opacity="0.8"
        />

        {/* QBE-SCF Line (Continuous Smooth C¹) */}
        <path
          d={qbePath}
          fill="none"
          stroke="url(#qbeCurveGrad)"
          strokeWidth="2.4"
        />

        {/* Current State Marker Ping */}
        {currQbePt && (
          <g transform={`translate(${toSvgX(currQbePt.r)}, ${toSvgY(currQbePt.e_qbescf)})`}>
            <circle r="6" fill="#35ff82" opacity="0.3" className="ping-halo" />
            <circle r="3.5" fill="#35ff82" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        )}

        {/* Axis Labels */}
        <text x={padL} y={height - padB + 16} fill="#8da399" fontSize="10" fontFamily="monospace">
          {rMin.toFixed(2)}
        </text>
        <text x={width - padR} y={height - padB + 16} textAnchor="end" fill="#8da399" fontSize="10" fontFamily="monospace">
          {rMax.toFixed(2)} {curveData.r_unit || "Å"}
        </text>
        <text x={padL - 6} y={padT + 8} textAnchor="end" fill="#8da399" fontSize="9" fontFamily="monospace">
          {eMax.toFixed(1)} E_h
        </text>
        <text x={padL - 6} y={height - padB} textAnchor="end" fill="#8da399" fontSize="9" fontFamily="monospace">
          {eMin.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Fullscreen Q-BOLTZ Agent Workstation Component (Pure Text Interaction)
// ---------------------------------------------------------------------------
export default function QBoltzAgentConsole({ onClose }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [fullNarrative, setFullNarrative] = useState("");
  const [simulation, setSimulation] = useState(null);

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

  // Agent Query Execution
  const executeQuery = async (customPrompt) => {
    const text = customPrompt || query;
    if (!text.trim()) return;

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
        setFullNarrative(data.narrative);
        setSimulation(data.simulation);
      }
    } catch (err) {
      console.error("Query failed:", err);
      setFullNarrative(
        `**Error**: Could not connect to Q-BOLTZ backend at http://127.0.0.1:8088. Please verify the FastAPI service is running.`
      );
    } finally {
      setLoading(false);
    }
  };

  const quickPresets = [
    {
      label: "H₂ Dissociation (R = 1.6 Å)",
      prompt: "Calculate the dissociation of H2 at 1.6 Angstroms and show the active space natural orbitals."
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

  const activeOrbitals = simulation?.orbitals || [];

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
            <span className="agent-badge-title">Q-BOLTZ // LUDWIG BOLTZMANN</span>
            <span className="agent-sub-badge">p1_qbescf Live</span>
            {simulation?.benchmark?.title && (
              <span className="benchmark-title-badge">
                {simulation.benchmark.title}
              </span>
            )}
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
              placeholder='Ask Q-Boltz (e.g. "Calculate dissociation of H2 at 1.6 Å and show active space orbitals")...'
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
            {/* Left Column: Input + Streamed Narrative + Dissociation Curve + Observables */}
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
              <div className="narrative-box">
                <div className="narrative-header">
                  <span className="agent-avatar-icon">⚛</span>
                  <span className="narrative-author">Ludwig Boltzmann:</span>
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

              {/* 2D Potential Energy Surface / Dissociation Curve */}
              {simulation?.dissociation_curve && (
                <DissociationCurvePlot
                  curveData={simulation.dissociation_curve}
                  currentPoint={simulation.dissociation_curve.current_r}
                />
              )}

              {/* Observable Metrics Row */}
              <div className="observables-row">
                <div className="obs-card">
                  <span className="obs-label">QBE-SCF Energy</span>
                  <span className="obs-value">
                    {simulation?.energies?.qbescf_ev ? `${simulation.energies.qbescf_ev.toFixed(2)} eV` : "--"}
                  </span>
                  <span className="obs-sub">{simulation?.energies?.qbescf_hartree} E_h</span>
                </div>
                <div className="obs-card">
                  <span className="obs-label">Standard RHF</span>
                  <span className="obs-value">
                    {simulation?.energies?.rhf_hartree ? `${simulation.energies.rhf_hartree} E_h` : "--"}
                  </span>
                  <span className="obs-sub">
                    {simulation?.energies?.rhf_converged ? "Converged" : "Diverged"}
                  </span>
                </div>
                <div className="obs-card highlight">
                  <span className="obs-label">Correlation Entropy</span>
                  <span className="obs-value">
                    {simulation?.active_space?.correlation_entropy?.toFixed(3) || "0.000"} bits
                  </span>
                  <span className="obs-sub">Information Plateau</span>
                </div>
              </div>
            </div>

            {/* Right Column: ALL Active Space Molecular Orbitals (Simultaneous View) */}
            <div className="workstation-right-panel">
              <div className="gallery-header-bar">
                <div className="gallery-title-group">
                  <span className="gallery-title">ACTIVE SPACE ORBITALS GALLERY [CAS]</span>
                  <span className="gallery-count-badge">
                    {activeOrbitals.length} Active Natural Orbitals
                  </span>
                </div>
                <div className="gallery-legend">
                  <span className="orb-legend-chip blue">
                    <span className="dot blue"></span> +ψ Lobe (Blue)
                  </span>
                  <span className="orb-legend-chip red">
                    <span className="dot red"></span> -ψ Lobe (Red)
                  </span>
                </div>
              </div>

              {/* Multi-Orbital Gallery Grid */}
              <div className={`orbitals-multi-grid count-${activeOrbitals.length}`}>
                {activeOrbitals.map((orb, idx) => (
                  <div key={`orbital-card-${idx}`} className="orbital-gallery-card">
                    <div className="orbital-card-meta">
                      <span className="orbital-sym-name">{orb.label}</span>
                      <span className="orbital-occ-tag">
                        n = {orb.occupation !== undefined ? orb.occupation.toFixed(3) : "--"}
                      </span>
                    </div>

                    <div className="orbital-canvas-frame">
                      <PureThreeOrbitalCanvas
                        orbital={orb}
                        atoms={simulation?.atoms || []}
                        bonds={simulation?.bonds || []}
                      />
                    </div>

                    <div className="orbital-card-footer">
                      {orb.pos_lobe && <span className="orb-phase-badge blue">+ψ Blue</span>}
                      {orb.neg_lobe && <span className="orb-phase-badge red">-ψ Red</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
