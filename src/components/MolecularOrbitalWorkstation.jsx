import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "./MolecularOrbitalWorkstation.css";

// ---------------------------------------------------------------------------
// Three.js 3D Viewport Components
// ---------------------------------------------------------------------------

function CameraController({ bounds = 4.0 }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.2, bounds * 1.55);
    camera.lookAt(0, 0, 0);
  }, [camera, bounds]);
  return null;
}

function OrbitalMesh({ geometryData, color, opacity = 0.78, wireframe = false }) {
  const geom = useMemo(() => {
    if (!geometryData || !geometryData.vertices || !geometryData.faces || geometryData.vertices.length === 0) {
      return null;
    }
    const g = new THREE.BufferGeometry();
    const verts = new Float32Array(geometryData.vertices.flat());
    const indices = new Uint32Array(geometryData.faces.flat());
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex(new THREE.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    return g;
  }, [geometryData]);

  if (!geom) return null;

  return (
    <mesh geometry={geom}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.15}
        metalness={0.1}
        transmission={0.45}
        ior={1.35}
        transparent={true}
        opacity={opacity}
        wireframe={wireframe}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function BondCylinder({ p1, p2, radius = 0.05 }) {
  const { position, quaternion, length } = useMemo(() => {
    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(v2, v1);
    const len = dir.length();
    
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());

    return { position: mid, quaternion: quat, length: len };
  }, [p1, p2]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial
        color="#70857a"
        metalness={0.8}
        roughness={0.25}
      />
    </mesh>
  );
}

function MoleculeScene({ orbital, atoms = [], bonds = [], wireframe = false, opacity = 0.78 }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Positive Lobe (+ISO) -> Electric Cyan / Emerald */}
      {orbital?.pos_lobe && (
        <OrbitalMesh
          geometryData={orbital.pos_lobe}
          color="#35ff82"
          opacity={opacity}
          wireframe={wireframe}
        />
      )}

      {/* Negative Lobe (-ISO) -> Radiant Coral / Ruby */}
      {orbital?.neg_lobe && (
        <OrbitalMesh
          geometryData={orbital.neg_lobe}
          color="#ff4466"
          opacity={opacity}
          wireframe={wireframe}
        />
      )}

      {/* Atoms */}
      {atoms.map((atom, idx) => (
        <mesh key={`atom-${idx}`} position={atom.coords}>
          <sphereGeometry args={[atom.radius * 0.75, 32, 32]} />
          <meshStandardMaterial
            color={atom.color || "#ffffff"}
            emissive={atom.color || "#ffffff"}
            emissiveIntensity={0.35}
            roughness={0.2}
            metalness={0.65}
          />
        </mesh>
      ))}

      {/* Covalent Bonds */}
      {bonds.map((b, idx) => {
        const p1 = atoms[b.from]?.coords;
        const p2 = atoms[b.to]?.coords;
        if (!p1 || !p2) return null;
        return <BondCylinder key={`bond-${idx}`} p1={p1} p2={p2} radius={0.06} />;
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main Workstation Component
// ---------------------------------------------------------------------------

export default function MolecularOrbitalWorkstation({ onClose, activeTab = "orbitals", onSwitchTab }) {
  const [activeBenchmark, setActiveBenchmark] = useState("h2");
  const [benchmarksData, setBenchmarksData] = useState({});
  const [paramValue, setParamValue] = useState(1.6);
  const [activeOrbitalIdx, setActiveOrbitalIdx] = useState(0);
  const [method, setMethod] = useState("compare"); // "qbe-scf", "standard", "compare"
  const [isoValue, setIsoValue] = useState(0.10);
  const [wireframe, setWireframe] = useState(false);
  const [opacity, setOpacity] = useState(0.82);

  // Simulation output state
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Voice & Agent state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [agentNarrative, setAgentNarrative] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch benchmark metadata from FastAPI
  useEffect(() => {
    fetch("http://127.0.0.1:8088/api/v1/benchmarks")
      .then((res) => res.json())
      .then((data) => setBenchmarksData(data))
      .catch((err) => console.log("Backend offline or unreachable:", err));
  }, []);

  // Run solver whenever benchmark or param changes
  const runCalculation = async (bKey, paramVal, currentMethod = method) => {
    setLoading(true);
    setError(null);
    try {
      const pKey = bKey === "beh2_ci" ? "x_bohr" : (bKey === "h4_square" ? "rx" : "r");
      const params = { [pKey]: paramVal };
      if (bKey === "h4_square") params["ry"] = paramVal;

      const res = await fetch("http://127.0.0.1:8088/api/v1/qboltz/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benchmark: bKey,
          params: params,
          method: currentMethod,
          iso_value: isoValue,
          grid_points: 32
        })
      });

      if (!res.ok) throw new Error(`Solver error: ${res.statusText}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Simulation failed");

      setSimulation(data);
      if (activeOrbitalIdx >= data.orbitals.length) {
        setActiveOrbitalIdx(0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation
  useEffect(() => {
    runCalculation(activeBenchmark, paramValue);
  }, [activeBenchmark, paramValue, method, isoValue]);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await sendVoiceToBackend(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied or error:", err);
      alert("Microphone permission required for live voice dogfooding.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceToBackend = async (blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "voice_prompt.wav");

      const transRes = await fetch("http://127.0.0.1:8088/api/v1/voice/transcribe", {
        method: "POST",
        body: formData
      });
      const transData = await transRes.json();
      if (transData.success && transData.transcript) {
        handlePromptExecution(transData.transcript);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePromptExecution = async (textPrompt) => {
    setTranscript(textPrompt);
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8088/api/v1/agent/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textPrompt, benchmark: activeBenchmark })
      });
      const data = await res.json();
      if (data.success) {
        setAgentNarrative(data.narrative);
        if (data.simulation) {
          setSimulation(data.simulation);
          setActiveBenchmark(data.simulation.benchmark.key);
        }
        // Speak response via Web Speech API
        if ("speechSynthesis" in window) {
          const cleanText = data.narrative.replace(/\*\*/g, "").replace(/`/g, "");
          const utter = new SpeechSynthesisUtterance(cleanText);
          utter.rate = 1.05;
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (err) {
      console.error("Agent query error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Dogfooding preset prompts
  const samplePrompts = [
    { label: "H₂ Stretched Active Space", prompt: "Show the active space natural orbitals for H2 at bond length 1.6 Angstroms." },
    { label: "H₃ Conical Intersection", prompt: "Run H3 at the D3h conical intersection of 1.52 Angstroms and show the degenerate e-prime orbitals." },
    { label: "BeH₂ Avoided Crossing", prompt: "Compare standard RHF against QBE-SCF for BeH2 insertion at x equals 2.5 Bohr." },
    { label: "N₂ Triple Bond Cleavage", prompt: "Dissociate the N2 triple bond to 2.2 Angstroms and show the active space pi bonding and antibonding orbitals." }
  ];

  const currentOrbital = simulation?.orbitals?.[activeOrbitalIdx] || null;

  return (
    <div className="qboltz-workstation-root">
      {/* Top Bar */}
      <header className="workstation-topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <span className="brand-dot"></span>
            <span className="brand-title">Q-BOLTZ // MOLECULAR ORBITAL WORKSTATION</span>
          </div>
          <div className="topbar-badge">p1_qbescf Benchmark Suite</div>
        </div>

        {onSwitchTab && (
          <div className="topbar-center-tabs">
            <button
              className={`topbar-tab-btn ${activeTab === "orbitals" ? "active" : ""}`}
              onClick={() => onSwitchTab("orbitals")}
            >
              <span className="tab-dot dot-orbitals"></span>
              Molecular Orbitals (Active Space)
            </button>
            <a
              href="/film"
              className="topbar-tab-btn"
              style={{ textDecoration: "none" }}
              title="Watch Executive Film (pointreyessound.com/film)"
            >
              <span className="tab-dot dot-gas"></span>
              Executive Film ↗
            </a>
          </div>
        )}

        <div className="topbar-right">
          <div className="topbar-status">
            <span className="status-indicator online"></span>
            <span className="status-label">PySCF 2.11.0 Engine Connected</span>
          </div>
          {onClose && (
            <button className="topbar-close-btn" onClick={onClose} title="Return to Overview">
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="workstation-body">
        {/* Left Control Column: Benchmark & Voice Prompts */}
        <aside className="workstation-sidebar">
          {/* Benchmark Selection Tabs */}
          <div className="control-card">
            <div className="card-label">BENCHMARK SYSTEM</div>
            <div className="benchmark-tabs">
              {[
                { id: "h2", name: "H₂ Singlet Dissociation" },
                { id: "h3_d3h", name: "H₃ D₃ₕ Trimer" },
                { id: "h4_square", name: "H₄ Rectangular" },
                { id: "beh2_ci", name: "BeH₂ Avoided Crossing" },
                { id: "n2_triple", name: "N₂ Triple Bond" }
              ].map((b) => (
                <button
                  key={b.id}
                  className={`benchmark-btn ${activeBenchmark === b.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveBenchmark(b.id);
                    const defVal = b.id === "beh2_ci" ? 2.5 : (b.id === "h4_square" ? 1.23 : (b.id === "h3_d3h" ? 1.52 : (b.id === "n2_triple" ? 2.0 : 1.6)));
                    setParamValue(defVal);
                  }}
                >
                  <span className="bench-bullet"></span>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Slider */}
          <div className="control-card">
            <div className="card-header-flex">
              <span className="card-label">
                {activeBenchmark === "beh2_ci" ? "PURVIS-BARTLETT x (Bohr)" : "INTERNUCLEAR DISTANCE R (Å)"}
              </span>
              <span className="param-value-tag">{paramValue.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="prs-slider"
              min={activeBenchmark === "beh2_ci" ? 0.0 : (activeBenchmark === "h3_d3h" ? 0.6 : (activeBenchmark === "n2_triple" ? 0.9 : 0.4))}
              max={activeBenchmark === "beh2_ci" ? 4.0 : (activeBenchmark === "n2_triple" ? 2.8 : 3.5)}
              step={0.05}
              value={paramValue}
              onChange={(e) => setParamValue(parseFloat(e.target.value))}
            />
          </div>

          {/* Method Comparison Toggle */}
          <div className="control-card">
            <div className="card-label">SOLVER METHOD</div>
            <div className="method-pill-group">
              {[
                { id: "compare", label: "Compare Both" },
                { id: "qbe-scf", label: "QBE-SCF Transport" },
                { id: "standard", label: "Standard RHF/UHF" }
              ].map((m) => (
                <button
                  key={m.id}
                  className={`method-pill ${method === m.id ? "active" : ""}`}
                  onClick={() => setMethod(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Prompt & Dogfooding Module */}
          <div className="control-card voice-card">
            <div className="card-header-flex">
              <span className="card-label">VOICE STREAMING CONTROLLER</span>
              <span className={`rec-tag ${isRecording ? "recording" : ""}`}>
                {isRecording ? "● RECORDING" : "WHISPER READY"}
              </span>
            </div>

            <button
              className={`mic-trigger-btn ${isRecording ? "active-rec" : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <span className="mic-icon">{isRecording ? "⏹" : "🎙"}</span>
              {isRecording ? "Stop & Query Q-Boltz" : "Speak Voice Prompt"}
            </button>

            <div className="dogfood-presets">
              <div className="preset-label">Test Prompts (Click to Dogfood):</div>
              {samplePrompts.map((p, idx) => (
                <button
                  key={`preset-${idx}`}
                  className="preset-pill"
                  onClick={() => handlePromptExecution(p.prompt)}
                >
                  "{p.label}"
                </button>
              ))}
            </div>

            {transcript && (
              <div className="transcript-box">
                <span className="box-tag">USER QUERY:</span>
                <p>"{transcript}"</p>
              </div>
            )}
          </div>
        </aside>

        {/* Center: Rich 3D Molecular Orbital Canvas */}
        <main className="workstation-viewport-container">
          <div className="canvas-wrapper">
            <Canvas
              gl={{ antialias: true, alpha: true }}
              camera={{ position: [0, 1.2, 5.5], fov: 45 }}
            >
              <ambientLight intensity={0.65} />
              <directionalLight position={[6, 8, 7]} intensity={1.2} />
              <directionalLight position={[-6, -4, -5]} intensity={0.4} color="#64c8ff" />
              <CameraController />
              <MoleculeScene
                orbital={currentOrbital}
                atoms={simulation?.atoms || []}
                bonds={simulation?.bonds || []}
                wireframe={wireframe}
                opacity={opacity}
              />
            </Canvas>

            {/* Viewport Floating HUD Overlays */}
            <div className="viewport-overlay-top">
              <div className="active-space-pill">
                <span className="pill-dot"></span>
                ACTIVE SPACE: {simulation?.active_space?.dimension || 0} ORBITALS / {simulation?.active_space?.electrons || 0} e⁻
              </div>
              <div className="bench-timing">
                {simulation?.benchmark?.calc_time_ms ? `PySCF Latency: ${simulation.benchmark.calc_time_ms} ms` : "Computing..."}
              </div>
            </div>

            <div className="viewport-overlay-bottom">
              <div className="legend-chip cyan">
                <span className="chip-box cyan"></span> +ψ Lobe (Cyan)
              </div>
              <div className="legend-chip ruby">
                <span className="chip-box ruby"></span> -ψ Lobe (Ruby)
              </div>
              <div className="render-controls-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={wireframe}
                    onChange={(e) => setWireframe(e.target.checked)}
                  />
                  Wireframe
                </label>
                <div className="slider-inline">
                  <span>ISO</span>
                  <input
                    type="range"
                    min="0.04"
                    max="0.22"
                    step="0.01"
                    value={isoValue}
                    onChange={(e) => setIsoValue(parseFloat(e.target.value))}
                  />
                  <span>{isoValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Space Orbital Selector Deck */}
          <div className="orbital-selector-deck">
            <div className="deck-title">ACTIVE SPACE NATURAL ORBITALS:</div>
            <div className="orbital-cards-row">
              {simulation?.orbitals?.map((orb, idx) => (
                <div
                  key={`orb-card-${idx}`}
                  className={`orbital-card ${activeOrbitalIdx === idx ? "active" : ""}`}
                  onClick={() => setActiveOrbitalIdx(idx)}
                >
                  <div className="orb-card-header">
                    <span className="orb-idx">NO {idx + 1}</span>
                    <span className="orb-occ-badge">n = {orb.occupation.toFixed(3)}</span>
                  </div>
                  <div className="orb-card-label">{orb.label}</div>
                  <div className="orb-card-energy">
                    {orb.energy_ev ? `${orb.energy_ev.toFixed(2)} eV` : "Active"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Metric & Narrative Column */}
        <aside className="workstation-details">
          {/* Agent Narrative Box */}
          <div className="control-card agent-narrative-card">
            <div className="agent-header">
              <span className="agent-avatar">⚛</span>
              <div>
                <div className="agent-name">LUDWIG BOLTZMANN</div>
                <div className="agent-role">Q-BOLTZ Principal Theory Agent</div>
              </div>
            </div>
            <div className="agent-text">
              {agentNarrative ? (
                <div dangerouslySetInnerHTML={{ __html: agentNarrative.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              ) : (
                <p>
                  "Select a benchmark molecule or speak a voice prompt. I will resolve the continuous phase-space kinetic relaxation and render the active-space natural orbitals in real-time."
                </p>
              )}
            </div>
          </div>

          {/* Physical Observables & Singularities */}
          <div className="control-card">
            <div className="card-label">QUANTUM OBSERVABLES</div>
            <div className="metric-grid">
              <div className="metric-box">
                <span className="metric-name">QBE-SCF Energy</span>
                <span className="metric-val">{simulation?.energies?.qbescf_ev ? `${simulation.energies.qbescf_ev.toFixed(2)} eV` : "--"}</span>
                <span className="metric-sub">{simulation?.energies?.qbescf_hartree ? `${simulation.energies.qbescf_hartree} E_h` : ""}</span>
              </div>
              <div className="metric-box">
                <span className="metric-name">Standard RHF Energy</span>
                <span className="metric-val">{simulation?.energies?.rhf_hartree ? `${simulation.energies.rhf_hartree} E_h` : "--"}</span>
                <span className="metric-sub">{simulation?.energies?.rhf_converged ? "Converged" : "Singularity/Diverged"}</span>
              </div>
              <div className="metric-box">
                <span className="metric-name">Correlation Entropy</span>
                <span className="metric-val highlight">{simulation?.active_space?.correlation_entropy?.toFixed(3) || "0.000"} bits</span>
                <span className="metric-sub">Max Bound: 12.00 Bits</span>
              </div>
              <div className="metric-box">
                <span className="metric-name">Löwdin Coherence</span>
                <span className="metric-val">{simulation?.active_space?.coherence?.toFixed(4) || "0.0000"}</span>
                <span className="metric-sub">Off-diagonal density</span>
              </div>
            </div>
          </div>

          {/* Theoretical Regularization Mechanism */}
          <div className="control-card">
            <div className="card-label">ENTROPIC REGULARIZATION DELTA</div>
            <ul className="regularization-list">
              <li>
                <strong>Coulson-Fischer Crossover:</strong> Kinetic transport bypasses the artificial mean-field energy cusp via continuous entropy minimization.
              </li>
              <li>
                <strong>Active Space Replacement:</strong> Natural orbital fractional occupations emerge naturally from the BGK collision operator without combinatorial active space explosions.
              </li>
              <li>
                <strong>Polynomial O(N³) Scaling:</strong> Replaces combinatorial exponential active-space CI with polynomial matrix operations.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
