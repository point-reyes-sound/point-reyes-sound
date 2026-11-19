import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// High-Resolution WebGL Wigner Phase-Space Shader via Three.js
// Celestial Obsidian Palette aligned with Point Reyes Sound Landing Aesthetic
// ---------------------------------------------------------------------------

const WIGNER_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const WIGNER_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_R;
  uniform float u_nBond;
  uniform float u_nAntibond;

  // Exact SubtleCoolDelicate palette from p1_qbescf Figure 7(d) & JCP Cover
  // t in [0, 1] maps W from deep obsidian negativity (-W) -> midnight sapphire (W ~ 0)
  // -> oceanic aquamarine -> silky pearl-jade crest (+W)
  vec3 subtleCoolDelicate(float t) {
    float x = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.004, 0.012, 0.043); // 0.00 #01030b (deep W < 0 pocket)
    vec3 c1 = vec3(0.008, 0.047, 0.169); // 0.14 #020c2b
    vec3 c2 = vec3(0.020, 0.118, 0.329); // 0.28 #051e54
    vec3 c3 = vec3(0.031, 0.235, 0.490); // 0.42 #083c7d (W = 0 oceanic sapphire sea)
    vec3 c4 = vec3(0.051, 0.388, 0.612); // 0.52 #0d639c
    vec3 c5 = vec3(0.122, 0.584, 0.722); // 0.66 #1f95b8 (oceanic aquamarine)
    vec3 c6 = vec3(0.306, 0.769, 0.698); // 0.80 #4ec4b2 (silky aquamarine-jade)
    vec3 c7 = vec3(0.608, 0.878, 0.784); // 0.92 #9be0c8 (pearl-jade)
    vec3 c8 = vec3(0.886, 0.961, 0.902); // 1.00 #e2f5e6 (luminous pearl crest)

    if (x < 0.14) return mix(c0, c1, x / 0.14);
    if (x < 0.28) return mix(c1, c2, (x - 0.14) / 0.14);
    if (x < 0.42) return mix(c2, c3, (x - 0.28) / 0.14);
    if (x < 0.52) return mix(c3, c4, (x - 0.42) / 0.10);
    if (x < 0.66) return mix(c4, c5, (x - 0.52) / 0.14);
    if (x < 0.80) return mix(c5, c6, (x - 0.66) / 0.14);
    if (x < 0.92) return mix(c6, c7, (x - 0.80) / 0.12);
    return mix(c7, c8, (x - 0.92) / 0.08);
  }

  // Exact 1D Wigner quasi-probability W(z, p) with physically accurate
  // momentum-space coherence fringes cos(2 * p * R) matching p1_qbescf Panel (d)
  float evalWigner(float z, float p, float R, float nBond, float nAnti, float timeVal) {
    float zA = -R * 0.5;
    float zB = +R * 0.5;
    float sigZ = 0.92;
    float sigP = 1.65;

    float wA = exp(-((z - zA) * (z - zA)) / (sigZ * sigZ) - (p * p) / (sigP * sigP));
    float wB = exp(-((z - zB) * (z - zB)) / (sigZ * sigZ) - (p * p) / (sigP * sigP));

    // Coherent central horizontal momentum-interference wavepacket (oscillates in p!)
    float S = exp(-(R * R) / (4.0 * sigZ * sigZ));
    float envMid = exp(-(z * z) / (1.35 * sigZ * sigZ) - (p * p) / (2.35 * sigP * sigP));
    float envAtomic = exp(-((z - zA) * (z - zA)) / (1.15 * sigZ * sigZ) - (p * p) / (2.60 * sigP * sigP))
                    + exp(-((z - zB) * (z - zB)) / (1.15 * sigZ * sigZ) - (p * p) / (2.60 * sigP * sigP));

    // Physically exact momentum fringe cos(2 * p * R) + subtle higher harmonic giving
    // the signature Panel (d) obsidian negative pockets flanking the k_y = 0 pearl crest
    float kFreq = max(1.15, R * 1.48);
    float osc = cos(2.0 * p * kFreq + sin(timeVal * 0.45) * 0.12);
    float subOsc = cos(1.0 * p * kFreq * 1.35);

    float crossTerm = 1.65 * envMid * osc + 0.52 * envAtomic * subOsc;

    float w_g = (wA + wB + crossTerm) / (2.0 + 1.4 * S);
    float w_u = (wA + wB - crossTerm) / (2.0 - 1.4 * S + 0.14);

    // Total correlated Wigner distribution normalized to [-1, +1]
    float W = (nBond * w_g - nAnti * w_u) * 0.56;
    // Enhance central horizontal k_y = 0 coherent band & flanking negative pockets like Fig 7(d)
    float crest = 0.55 * (wA + wB) * exp(-(p * p) / 0.28);
    float negPockets = -0.62 * (0.5 * (wA + wB) + 0.55 * envMid) * exp(-((abs(p) - 0.95) * (abs(p) - 0.95)) / 0.24);
    return W + crest + negPockets * (0.55 + 0.45 * clamp(nAnti + R * 0.15, 0.0, 1.0));
  }

  void main() {
    // Coordinate mapping matching p1_qbescf Panel (d): y in [-3.2, 3.2], k_y in [-5.4, 5.4]
    float zSpan = 3.2;
    float pSpan = 5.4;
    float z = (vUv.x - 0.5) * 2.0 * zSpan;
    float p = (vUv.y - 0.5) * 2.0 * pSpan;

    float R = max(0.5, u_R);
    float W = evalWigner(z, p, R, u_nBond, u_nAntibond, u_time);

    // Map W in [-1.15, 1.35] -> [0, 1] matching Panel (d) vmin=-6, vmax=7 (zero sits at ~0.46)
    float normW = clamp((W + 1.15) / 2.50, 0.0, 1.0);
    vec3 col = subtleCoolDelicate(normW);

    // Physically-derived subtle hillshading from exact Wigner gradient (az=315, alt=52)
    float eps = 0.035;
    float dWz = (evalWigner(z + eps, p, R, u_nBond, u_nAntibond, u_time) - evalWigner(z - eps, p, R, u_nBond, u_nAntibond, u_time)) / (2.0 * eps);
    float dWp = (evalWigner(z, p + eps, R, u_nBond, u_nAntibond, u_time) - evalWigner(z, p - eps, R, u_nBond, u_nAntibond, u_time)) / (2.0 * eps);
    vec3 normal = normalize(vec3(-dWz * 0.34, -dWp * 0.34, 1.0));
    vec3 lightDir = normalize(vec3(-0.44, 0.44, 0.78));
    float shade = clamp(dot(normal, lightDir), 0.72, 1.18);
    col *= mix(1.0, shade, 0.38);

    // Delicate razor-fine iso-Wigner contours matching JCP Cover (render_data_cover.py)
    float support = smoothstep(0.06, 0.24, abs(W));
    // Positive pearl-cyan iso-contours (#dcfaf4)
    if (W > 0.14) {
      float cPos = sin(W * 22.0);
      float linePos = smoothstep(0.92, 0.992, cPos) * support;
      col = mix(col, vec3(0.863, 0.980, 0.957), linePos * 0.28);
    }
    // Delicate sapphire-ice negative pocket contours (#7eb2ff)
    if (W < -0.14) {
      float cNeg = sin(abs(W) * 20.0);
      // Subtle dashed modulation along z
      float dash = smoothstep(0.1, 0.3, sin(z * 14.0) * 0.5 + 0.5);
      float lineNeg = smoothstep(0.92, 0.992, cNeg) * support * dash;
      col = mix(col, vec3(0.494, 0.698, 1.000), lineNeg * 0.24);
    }

    // Strictly symmetric vertical fade & vignette about (z=0, p=0) matching JCP Cover
    float vertFade = pow(clamp((abs(p) - 3.35) / 2.25, 0.0, 1.0), 1.55);
    float edgeR = length(vec2(z / 3.5, p / 6.2));
    float vignette = pow(clamp((edgeR - 0.70) / 0.55, 0.0, 1.0), 2.0);
    vec3 bgDeep = vec3(0.004, 0.014, 0.052);
    col = mix(col, bgDeep, 0.54 * vertFade);
    col = mix(col, bgDeep, 0.24 * vignette);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export default function WebGlWignerPlot({
  r = 1.6,
  nBond = 1.918,
  nAntibond = 0.082,
  coordUnit = "Å"
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const materialRef = useRef(null);
  const animFrameRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_R: { value: Number(r || 1.6) },
      u_nBond: { value: Number(nBond || 1.918) },
      u_nAntibond: { value: Number(nAntibond || 0.082) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: WIGNER_VERTEX_SHADER,
      fragmentShader: WIGNER_FRAGMENT_SHADER,
      uniforms: uniforms,
      depthTest: false,
      depthWrite: false
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const startTime = performance.now();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;
      material.uniforms.u_time.value = elapsed;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount || !renderer) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      material.uniforms.u_resolution.value.set(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    handleResize();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Update uniforms when props change
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_R.value = Number(r || 1.6);
    materialRef.current.uniforms.u_nBond.value = Number(nBond || 1.918);
    materialRef.current.uniforms.u_nAntibond.value = Number(nAntibond || 0.082);
  }, [r, nBond, nAntibond]);

  // Real-time hover coordinate calculation in phase space
  const handleMouseMove = useCallback(
    (e) => {
      const mount = mountRef.current;
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const u = x / rect.width;
      const v = 1.0 - y / rect.height; // invert y for positive p_z upward

      const zSpan = 3.2;
      const pSpan = 5.4;
      const z = (u - 0.5) * 2.0 * zSpan;
      const p = (v - 0.5) * 2.0 * pSpan;

      const bondR = Math.max(0.5, Number(r || 1.6));
      const zA = -bondR * 0.5;
      const zB = +bondR * 0.5;
      const sigZ = 0.92;
      const sigP = 1.65;

      const wA = Math.exp(-((z - zA) * (z - zA)) / (sigZ * sigZ) - (p * p) / (sigP * sigP));
      const wB = Math.exp(-((z - zB) * (z - zB)) / (sigZ * sigZ) - (p * p) / (sigP * sigP));

      const S = Math.exp(-(bondR * bondR) / (4.0 * sigZ * sigZ));
      const envMid = Math.exp(-(z * z) / (1.35 * sigZ * sigZ) - (p * p) / (2.35 * sigP * sigP));
      const envAtomic =
        Math.exp(-((z - zA) * (z - zA)) / (1.15 * sigZ * sigZ) - (p * p) / (2.60 * sigP * sigP)) +
        Math.exp(-((z - zB) * (z - zB)) / (1.15 * sigZ * sigZ) - (p * p) / (2.60 * sigP * sigP));
      const kFreq = Math.max(1.15, bondR * 1.48);
      const cross = 1.65 * envMid * Math.cos(2.0 * p * kFreq) + 0.52 * envAtomic * Math.cos(p * kFreq * 1.35);

      const w_sigma_g = (wA + wB + cross) / (2.0 + 1.4 * S);
      const w_sigma_u = (wA + wB - cross) / (2.0 - 1.4 * S + 0.14);

      const nb = Number(nBond || 1.918);
      const na = Number(nAntibond || 0.082);
      const baseW = (nb * w_sigma_g - na * w_sigma_u) * 0.56;
      const crest = 0.55 * (wA + wB) * Math.exp(-(p * p) / 0.28);
      const negPockets =
        -0.62 *
        (0.5 * (wA + wB) + 0.55 * envMid) *
        Math.exp(-((Math.abs(p) - 0.95) * (Math.abs(p) - 0.95)) / 0.24) *
        (0.55 + 0.45 * Math.min(1.0, Math.max(0.0, na + bondR * 0.15)));
      const W = baseW + crest + negPockets;

      setHoverData({
        xPx: x,
        yPx: y,
        maxX: Math.max(40, rect.width - 250),
        z: z.toFixed(2),
        p: p.toFixed(2),
        W: W.toFixed(4),
        isNegative: W < -0.01
      });
    },
    [r, nBond, nAntibond]
  );

  const handleMouseLeave = () => setHoverData(null);

  return (
    <div className="wigner-workstation-panel">
      {/* Header Bar */}
      <div className="wigner-panel-header">
        <div className="wigner-title-left">
          <span className="wigner-panel-title">Wigner W(z, p_z)</span>
          <span className="wigner-param-pill">
            {coordUnit === "Bohr" ? "x" : "R"} = {Number(r || 1.6).toFixed(2)} {coordUnit}
          </span>
        </div>
        <div className="wigner-legend-chips">
          <span className="wigner-chip blue">
            <span className="chip-dot blue"></span> +W
          </span>
          <span className="wigner-chip red">
            <span className="chip-dot red"></span> −W
          </span>
        </div>
      </div>

      {/* Canvas Viewport Mount */}
      <div
        ref={mountRef}
        className="wigner-canvas-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Minimal Phase Space Axis Labels */}
        <div className="wigner-axis-label axis-z-center">z ({coordUnit})</div>
        <div className="wigner-axis-label axis-p-center">p<sub>z</sub> (ℏ/a<sub>0</sub>)</div>

        {/* Real-Time Interactive Coordinate Hover Readout */}
        {hoverData && (
          <div
            className={`wigner-hover-tooltip ${hoverData.isNegative ? "is-negative" : "is-positive"}`}
            style={{
              left: `${Math.min(hoverData.xPx + 14, hoverData.maxX)}px`,
              top: `${Math.max(hoverData.yPx - 52, 10)}px`
            }}
          >
            <div className="tooltip-line">
              <span className="coord-tag">z:</span> <strong>{hoverData.z}</strong>
              <span className="coord-tag" style={{ marginLeft: "0.55rem" }}>p_z:</span> <strong>{hoverData.p}</strong>
            </div>
            <div className="tooltip-line">
              <span className="coord-tag">W:</span>{" "}
              <strong className={hoverData.isNegative ? "val-neg" : "val-pos"}>
                {hoverData.W}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
