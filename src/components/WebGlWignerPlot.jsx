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

  void main() {
    // Coordinate mapping: z in [-3.6, 3.6] Å, p_z in [-3.6, 3.6] ℏ/a₀
    float zSpan = 3.6;
    float pSpan = 3.6;
    float z = (vUv.x - 0.5) * 2.0 * zSpan;
    float p = (vUv.y - 0.5) * 2.0 * pSpan;

    float R = max(0.4, u_R);
    float zA = -R * 0.5;
    float zB = +R * 0.5;
    float sigma = 0.85;

    // Single-atom Wigner Gaussians
    float distA2 = (z - zA) * (z - zA) + p * p;
    float distB2 = (z - zB) * (z - zB) + p * p;
    float wA = exp(-distA2 / (sigma * sigma));
    float wB = exp(-distB2 / (sigma * sigma));

    // Quantum Covalent Overlap & Non-Classical Cross Interference Term
    float S = exp(-(R * R) / (4.0 * sigma * sigma));
    float envCenter = exp(-(z * z + p * p) / (sigma * sigma));
    float crossInterference = 2.0 * envCenter * cos(2.0 * z * R * 0.85 + u_time * 0.35);

    // Bonding and Antibonding Wigner functions
    float w_sigma_g = (wA + wB + crossInterference) / (2.0 + 2.0 * S);
    float w_sigma_u = (wA + wB - crossInterference) / (2.0 - 2.0 * S + 0.06);

    // Correlated Wigner distribution W(z, p_z)
    float W = (u_nBond * w_sigma_g - u_nAntibond * w_sigma_u) / 2.0;

    // Active quantum support envelope (prevents zero-contour tinting in vacuum)
    float supportEnv = smoothstep(0.015, 0.09, max(max(wA, wB), envCenter));

    // Deep Celestial Obsidian Void (matches Landing Page quantum canvas)
    vec3 voidBase = vec3(0.008, 0.018, 0.036);
    vec3 col = voidBase;

    // Colormap Interpolation:
    // Positive quasi-probability (+W): Deep Cobalt -> Luminous Sky Cyan -> Ice-White Core
    if (W > 0.0) {
      float t = clamp(W / 0.82, 0.0, 1.0);
      vec3 c1 = vec3(0.05, 0.38, 0.86); // Royal Sapphire
      vec3 c2 = vec3(0.14, 0.82, 0.98); // Luminous Oceanic Cyan
      vec3 c3 = vec3(0.88, 0.98, 1.00); // Coherent Crest White

      if (t < 0.38) {
        col = mix(voidBase, c1, t / 0.38);
      } else if (t < 0.76) {
        col = mix(c1, c2, (t - 0.38) / 0.38);
      } else {
        col = mix(c2, c3, (t - 0.76) / 0.24);
      }
    } else {
      // Quantum Negativity (-W): Point Reyes Beacon Crimson -> Coral Rose -> Soft Ivory Peak
      float t = clamp(-W / 0.42, 0.0, 1.0);
      vec3 r1 = vec3(0.76, 0.10, 0.24); // Deep Beacon Crimson
      vec3 r2 = vec3(0.98, 0.30, 0.42); // Luminous Scarlet-Rose
      vec3 r3 = vec3(1.00, 0.78, 0.86); // High-Contrast Interference Crest

      if (t < 0.38) {
        col = mix(voidBase, r1, t / 0.38);
      } else if (t < 0.76) {
        col = mix(r1, r2, (t - 0.38) / 0.38);
      } else {
        col = mix(r2, r3, (t - 0.76) / 0.24);
      }
    }

    // Smooth Anti-Aliased Periodic Isocontour Rings strictly within wavepacket support
    float contour = sin(abs(W) * 44.0);
    float contourLine = smoothstep(0.84, 0.98, contour) * supportEnv;
    col += vec3(0.32, 0.86, 1.0) * contourLine * 0.20;

    // Nodal Separation Line (W = 0 Boundary ONLY inside active interference region)
    float zeroBoundary = (1.0 - smoothstep(0.0, 0.014, abs(W))) * supportEnv;
    col = mix(col, vec3(0.45, 0.88, 0.98), zeroBoundary * 0.32);

    // Subtle phase-space coordinate grid lines
    float gridX = smoothstep(0.975, 0.996, sin(vUv.x * 6.28318 * 6.0));
    float gridY = smoothstep(0.975, 0.996, sin(vUv.y * 6.28318 * 6.0));
    col += vec3(0.14, 0.32, 0.52) * (gridX + gridY) * 0.16;

    // Origin crosshairs (z = 0 and p_z = 0)
    float axisX = 1.0 - smoothstep(0.0, 0.0035, abs(vUv.y - 0.5));
    float axisY = 1.0 - smoothstep(0.0, 0.0035, abs(vUv.x - 0.5));
    col += vec3(0.22, 0.74, 0.97) * (axisX + axisY) * 0.26;

    // Nuclear Coordinate Indicators in Phase Space (zA, 0) and (zB, 0)
    vec2 uvA = vec2(0.5 + (zA / (2.0 * zSpan)), 0.5);
    vec2 uvB = vec2(0.5 + (zB / (2.0 * zSpan)), 0.5);
    vec2 dUV_A = (vUv - uvA) * u_resolution / min(u_resolution.x, u_resolution.y);
    vec2 dUV_B = (vUv - uvB) * u_resolution / min(u_resolution.x, u_resolution.y);
    float distA = length(dUV_A);
    float distB = length(dUV_B);

    float coreA = 1.0 - smoothstep(0.0, 0.017, distA);
    float haloA = 1.0 - smoothstep(0.0, 0.042, distA);
    float coreB = 1.0 - smoothstep(0.0, 0.017, distB);
    float haloB = 1.0 - smoothstep(0.0, 0.042, distB);

    col += vec3(1.0, 1.0, 1.0) * (coreA + coreB) * 0.95;
    col += vec3(0.22, 0.78, 0.98) * (haloA + haloB) * 0.45;

    // Subtle Vignette
    float vig = 1.0 - length(vUv - 0.5) * 0.36;
    col *= clamp(vig, 0.45, 1.0);

    gl_FragColor = vec4(col, 1.0);
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

      const zSpan = 3.6;
      const pSpan = 3.6;
      const z = (u - 0.5) * 2.0 * zSpan;
      const p = (v - 0.5) * 2.0 * pSpan;

      const bondR = Number(r || 1.6);
      const zA = -bondR * 0.5;
      const zB = +bondR * 0.5;
      const sigma = 0.85;

      const distA2 = (z - zA) * (z - zA) + p * p;
      const distB2 = (z - zB) * (z - zB) + p * p;
      const wA = Math.exp(-distA2 / (sigma * sigma));
      const wB = Math.exp(-distB2 / (sigma * sigma));

      const S = Math.exp(-(bondR * bondR) / (4.0 * sigma * sigma));
      const cross = 2.0 * Math.exp(-(z * z + p * p) / (sigma * sigma)) * Math.cos(2.0 * z * bondR * 0.85);

      const w_sigma_g = (wA + wB + cross) / (2.0 + 2.0 * S);
      const w_sigma_u = (wA + wB - cross) / (2.0 - 2.0 * S + 0.06);

      const nb = Number(nBond || 1.918);
      const na = Number(nAntibond || 0.082);
      const W = (nb * w_sigma_g - na * w_sigma_u) / 2.0;

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
          <span className="wigner-badge">PHASE SPACE</span>
          <span className="wigner-panel-title">Wigner Distribution W(z, p_z)</span>
          <span className="wigner-param-pill">
            {coordUnit === "Bohr" ? "x" : "R"} = {Number(r || 1.6).toFixed(2)} {coordUnit}
          </span>
        </div>
        <div className="wigner-legend-chips">
          <span className="wigner-chip blue">
            <span className="chip-dot blue"></span> +W Density
          </span>
          <span className="wigner-chip red">
            <span className="chip-dot red"></span> −W Negativity
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
        {/* Phase Space Axis Labels */}
        <div className="wigner-axis-label axis-z-left">−3.6 Å</div>
        <div className="wigner-axis-label axis-z-center">Position z (Å) • Hover to inspect W(z, p_z)</div>
        <div className="wigner-axis-label axis-z-right">+3.6 Å</div>
        <div className="wigner-axis-label axis-p-top">+3.6 ℏ/a₀</div>
        <div className="wigner-axis-label axis-p-center">Momentum p_z (ℏ/a₀)</div>
        <div className="wigner-axis-label axis-p-bottom">−3.6 ℏ/a₀</div>

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
              <span className="coord-tag">z:</span> <strong>{hoverData.z} Å</strong>
              <span className="coord-tag" style={{ marginLeft: "0.55rem" }}>p_z:</span> <strong>{hoverData.p} ℏ/a₀</strong>
            </div>
            <div className="tooltip-line">
              <span className="coord-tag">W(z, p_z):</span>{" "}
              <strong className={hoverData.isNegative ? "val-neg" : "val-pos"}>
                {hoverData.W}
              </strong>{" "}
              <span className="status-sub">
                {hoverData.isNegative ? "Quantum Interference" : "Coherent Density"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="wigner-footer-strip">
        <span className="wigner-footer-meta">
          Real-Time WebGL Weyl Transform
        </span>
        <span className="wigner-coherence-tag">
          Interference Fringe: 2·cos(2zR/ℏ)
        </span>
      </div>
    </div>
  );
}
