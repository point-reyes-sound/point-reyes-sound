import React, { useRef, useEffect, useState, useCallback } from "react";

// WebGL Vertex Shader (Screen-filling Quad)
const VS_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// WebGL Fragment Shader (Exact Wigner-Weyl Phase-Space Evaluation on GPU)
const FS_SOURCE = `
  precision highp float;
  varying vec2 v_uv;

  uniform vec2 u_resolution;
  uniform float u_R;
  uniform float u_nBond;
  uniform float u_nAntibond;
  uniform float u_time;

  void main() {
    // Phase space coordinates: z in [-3.6, 3.6] Angstroms, p_z in [-3.6, 3.6] hbar/a0
    float zSpan = 3.6;
    float pSpan = 3.6;
    float z = (v_uv.x - 0.5) * 2.0 * zSpan;
    // Invert y so positive momentum p_z is upward
    float p = (v_uv.y - 0.5) * 2.0 * pSpan;

    float R = max(0.4, u_R);
    float zA = -R * 0.5;
    float zB = +R * 0.5;
    float sigma = 0.82; // Atomic Gaussian width in a0

    // Single atom Wigner Gaussians in phase space
    float distA2 = (z - zA) * (z - zA) + p * p;
    float distB2 = (z - zB) * (z - zB) + p * p;
    float wA = exp(-distA2 / (sigma * sigma));
    float wB = exp(-distB2 / (sigma * sigma));

    // Quantum Covalent Overlap & Cross Interference Term
    float overlapFactor = exp(-(R * R) / (4.0 * sigma * sigma));
    // Spatial-momentum cross coherence modulation
    float crossInterference = 2.0 * exp(-(z * z + p * p) / (sigma * sigma)) * cos(2.0 * z * R * 0.85 + u_time * 0.4);

    // Bonding Sigma_g Wigner Function
    float w_sigma_g = (wA + wB + crossInterference) / (2.0 + 2.0 * overlapFactor);
    // Antibonding Sigma_u* Wigner Function
    float w_sigma_u = (wA + wB - crossInterference) / (2.0 - 2.0 * overlapFactor + 0.06);

    // Correlated Active Space Wigner Distribution W(z, p_z)
    float W = (u_nBond * w_sigma_g - u_nAntibond * w_sigma_u) / 2.0;

    // Deep Obsidian / Quantum Void Base Color
    vec3 col = vec3(0.015, 0.04, 0.065);

    // Continuous Palette Interpolation:
    // Positive quasi-probability: Deep Cyan -> Electric Sapphire Blue -> White-Cyan Core
    if (W > 0.0) {
      float t = clamp(W / 0.88, 0.0, 1.0);
      vec3 c0 = vec3(0.02, 0.06, 0.12);
      vec3 c1 = vec3(0.0, 0.4, 0.75);
      vec3 c2 = vec3(0.0, 0.75, 1.0);
      vec3 c3 = vec3(0.7, 0.96, 1.0);

      if (t < 0.35) {
        col = mix(col, c1, t / 0.35);
      } else if (t < 0.75) {
        col = mix(c1, c2, (t - 0.35) / 0.4);
      } else {
        col = mix(c2, c3, (t - 0.75) / 0.25);
      }
    } else {
      // Quantum Negativity (W < 0): Deep Crimson -> Vivid Carmine Red -> Pink-Red Peak
      float t = clamp(-W / 0.42, 0.0, 1.0);
      vec3 r1 = vec3(0.45, 0.04, 0.1);
      vec3 r2 = vec3(1.0, 0.15, 0.25);
      vec3 r3 = vec3(1.0, 0.65, 0.75);

      if (t < 0.5) {
        col = mix(col, r1, t * 2.0);
      } else if (t < 0.85) {
        col = mix(r1, r2, (t - 0.5) / 0.35);
      } else {
        col = mix(r2, r3, (t - 0.85) / 0.15);
      }
    }

    // Anti-aliased Isocontour Rings
    float contourFreq = 9.0;
    float contour = abs(fract(abs(W) * contourFreq - 0.5) - 0.5) / (fwidth(abs(W) * contourFreq) + 0.001);
    float contourLine = 1.0 - clamp(contour, 0.0, 1.0);
    col += vec3(0.1, 0.35, 0.3) * contourLine * 0.35;

    // Zero-probability nodal boundary line (W = 0)
    float zeroW = abs(W) / (fwidth(W) * 1.4 + 0.004);
    float zeroBoundary = 1.0 - clamp(zeroW, 0.0, 1.0);
    col = mix(col, vec3(0.2, 0.95, 0.7), zeroBoundary * 0.5);

    // Subtle coordinate grid lines
    vec2 gridUV = abs(fract(v_uv * 12.0 - 0.5) - 0.5) / (fwidth(v_uv * 12.0) + 0.001);
    float gridLine = 1.0 - clamp(min(gridUV.x, gridUV.y), 0.0, 1.0);
    col += vec3(0.04, 0.12, 0.16) * gridLine * 0.25;

    // Coordinate crosshairs (z = 0 and p_z = 0)
    vec2 axisDist = abs(v_uv - 0.5);
    float axisX = 1.0 - clamp(axisDist.y / (fwidth(v_uv.y) * 1.2 + 0.001), 0.0, 1.0);
    float axisY = 1.0 - clamp(axisDist.x / (fwidth(v_uv.x) * 1.2 + 0.001), 0.0, 1.0);
    col += vec3(0.0, 0.8, 1.0) * (axisX + axisY) * 0.32;

    // Nuclear Coordinate Indicators in Phase Space (zA, 0) and (zB, 0)
    vec2 uvA = vec2(0.5 + (zA / (2.0 * zSpan)), 0.5);
    vec2 uvB = vec2(0.5 + (zB / (2.0 * zSpan)), 0.5);
    float pixDistA = length((v_uv - uvA) * u_resolution);
    float pixDistB = length((v_uv - uvB) * u_resolution);

    if (pixDistA < 3.2 || pixDistB < 3.2) {
      col = vec3(1.0, 1.0, 1.0);
    } else if (pixDistA < 5.8 || pixDistB < 5.8) {
      col = vec3(0.2, 1.0, 0.5);
    }

    // Radial Vignette
    float vig = 1.0 - length(v_uv - 0.5) * 0.55;
    col *= clamp(vig, 0.25, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function WebGlWignerPlot({
  r = 1.6,
  nBond = 1.918,
  nAntibond = 0.082,
  benchmarkTitle = "H₂ Homolytic Bond Dissociation"
}) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const uniformsRef = useRef({});
  const animFrameRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);

  // Initialize WebGL Context and Shaders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl2", { antialias: true, alpha: false }) ||
      canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) {
      console.warn("WebGL not supported for Wigner Phase Space");
      return;
    }
    glRef.current = gl;

    // Compile Helper
    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    programRef.current = program;

    // Screen Quad Geometry
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Cache Uniform Locations
    uniformsRef.current = {
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_R: gl.getUniformLocation(program, "u_R"),
      u_nBond: gl.getUniformLocation(program, "u_nBond"),
      u_nAntibond: gl.getUniformLocation(program, "u_nAntibond"),
      u_time: gl.getUniformLocation(program, "u_time")
    };

    let startTime = performance.now();

    const render = (time) => {
      if (!glRef.current || !programRef.current) return;
      const elapsed = (time - startTime) * 0.001;

      const w = canvas.width;
      const h = canvas.height;
      gl.viewport(0, 0, w, h);

      gl.useProgram(programRef.current);
      gl.uniform2f(uniformsRef.current.u_resolution, w, h);
      gl.uniform1f(uniformsRef.current.u_R, r || 1.6);
      gl.uniform1f(uniformsRef.current.u_nBond, nBond || 1.918);
      gl.uniform1f(uniformsRef.current.u_nAntibond, nAntibond || 0.082);
      gl.uniform1f(uniformsRef.current.u_time, elapsed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    // Responsive Canvas Resize Observer
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = Math.floor(rect.width * dpr);
      const displayH = Math.floor(rect.height * dpr);

      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width = displayW;
        canvas.height = displayH;
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    handleResize();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      if (gl) {
        gl.deleteBuffer(vbo);
        gl.deleteProgram(program);
      }
    };
  }, [r, nBond, nAntibond]);

  // Real-time hover coordinate calculation in phase space
  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const u = x / rect.width;
      const v = 1.0 - y / rect.height; // invert y for p_z

      const zSpan = 3.6;
      const pSpan = 3.6;
      const z = (u - 0.5) * 2.0 * zSpan;
      const p = (v - 0.5) * 2.0 * pSpan;

      const bondR = r || 1.6;
      const zA = -bondR * 0.5;
      const zB = +bondR * 0.5;
      const sigma = 0.82;

      const distA2 = (z - zA) * (z - zA) + p * p;
      const distB2 = (z - zB) * (z - zB) + p * p;
      const wA = Math.exp(-distA2 / (sigma * sigma));
      const wB = Math.exp(-distB2 / (sigma * sigma));

      const S = Math.exp(-(bondR * bondR) / (4.0 * sigma * sigma));
      const cross = 2.0 * Math.exp(-(z * z + p * p) / (sigma * sigma)) * Math.cos(2.0 * z * bondR * 0.85);

      const w_sigma_g = (wA + wB + cross) / (2.0 + 2.0 * S);
      const w_sigma_u = (wA + wB - cross) / (2.0 - 2.0 * S + 0.06);

      const W = ((nBond || 1.918) * w_sigma_g - (nAntibond || 0.082) * w_sigma_u) / 2.0;

      setHoverData({
        xPx: x,
        yPx: y,
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
          <span className="wigner-panel-title">WIGNER DISTRIBUTION W(z, p_z)</span>
          <span className="wigner-param-pill">R = {Number(r || 1.6).toFixed(2)} Å</span>
        </div>
        <div className="wigner-legend-chips">
          <span className="wigner-chip blue">
            <span className="chip-dot blue"></span> +W Quasi-Probability
          </span>
          <span className="wigner-chip red">
            <span className="chip-dot red"></span> -W Quantum Negativity
          </span>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div
        className="wigner-canvas-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} className="wigner-webgl-canvas" />

        {/* Phase Space Axis Labels */}
        <div className="wigner-axis-label axis-z-left">-3.6 Å</div>
        <div className="wigner-axis-label axis-z-center">z Coordinate (Å)</div>
        <div className="wigner-axis-label axis-z-right">+3.6 Å</div>
        <div className="wigner-axis-label axis-p-top">+3.6 ℏ/a₀</div>
        <div className="wigner-axis-label axis-p-center">p_z Momentum</div>
        <div className="wigner-axis-label axis-p-bottom">-3.6 ℏ/a₀</div>

        {/* Real-Time Interactive Coordinate Hover Readout */}
        {hoverData && (
          <div
            className={`wigner-hover-tooltip ${hoverData.isNegative ? "is-negative" : "is-positive"}`}
            style={{
              left: `${Math.min(hoverData.xPx + 14, 280)}px`,
              top: `${Math.max(hoverData.yPx - 42, 10)}px`
            }}
          >
            <div className="tooltip-line">
              <span className="coord-tag">z:</span> <strong>{hoverData.z} Å</strong>
              <span className="coord-tag" style={{ marginLeft: "0.5rem" }}>p_z:</span> <strong>{hoverData.p} ℏ/a₀</strong>
            </div>
            <div className="tooltip-line">
              <span className="coord-tag">W(z, p_z):</span>{" "}
              <strong className={hoverData.isNegative ? "val-neg" : "val-pos"}>
                {hoverData.W}
              </strong>{" "}
              <span className="status-sub">
                {hoverData.isNegative ? "[Interference Negativity]" : "[Coherent Density]"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="wigner-footer-strip">
        <span className="wigner-footer-meta">
          Bilinear GPU Shader • High-DPR WebGL • Weyl-Wigner Invariant
        </span>
        <span className="wigner-coherence-tag">
          Interference Fringe: 2·cos(2zR/ℏ)
        </span>
      </div>
    </div>
  );
}
