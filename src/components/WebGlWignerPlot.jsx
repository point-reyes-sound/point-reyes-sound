import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// High-Resolution WebGL Wigner Phase-Space + 3D Real-Space Density Shader
// Royal Blue Panel (d) Wigner juxtaposed with Molecule-Specific Real-Space
// Electron Density (H2/H3 Beacon Crimson, H4 Champagne Gold, BeH2 Jade-Emerald)
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
  uniform float u_molType;      // 0 = H2, 1 = H3, 2 = H4, 3 = BeH2
  uniform float u_showDensity;  // 0.0 = pure Wigner, 1.0 = Wigner + Real-Space Density Overlay
  uniform float u_yawOffset;
  uniform float u_pitchOffset;

  // Exact JCP Cover Graphic Art Palette (SubtleCoolDelicate from p1_qbescf/jcp_production/render_data_cover.py)
  vec3 jcpCoverWignerPalette(float t) {
    float x = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.004, 0.012, 0.043); // 0.00 #01030b (deep W < 0 pocket)
    vec3 c1 = vec3(0.008, 0.047, 0.169); // 0.14 #020c2b
    vec3 c2 = vec3(0.020, 0.118, 0.329); // 0.28 #051e54
    vec3 c3 = vec3(0.031, 0.235, 0.490); // 0.42 #083c7d (oceanic midnight sapphire sea)
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

  float evalWigner(float z, float p, float R_eff, float nBond, float nAnti, float timeVal) {
    float zA = -R_eff * 0.5;
    float zB = +R_eff * 0.5;
    float sigZ = 0.92;
    float sigP = 1.65;

    float wA = exp(-((z - zA) * (z - zA)) / (sigZ * sigZ) - (p * p) / (sigP * sigP));
    float wB = exp(-((z - zB) * (z - zB)) / (sigZ * sigZ) - (p * p) / (sigP * sigP));

    float S = exp(-(R_eff * R_eff) / (4.0 * sigZ * sigZ));
    float envMid = exp(-(z * z) / (1.35 * sigZ * sigZ) - (p * p) / (2.35 * sigP * sigP));
    float envAtomic = exp(-((z - zA) * (z - zA)) / (1.15 * sigZ * sigZ) - (p * p) / (2.60 * sigP * sigP))
                    + exp(-((z - zB) * (z - zB)) / (1.15 * sigZ * sigZ) - (p * p) / (2.60 * sigP * sigP));

    float kFreq = max(1.15, R_eff * 1.48);
    float osc = cos(2.0 * p * kFreq + sin(timeVal * 0.42) * 0.12);
    float subOsc = cos(1.0 * p * kFreq * 1.35);
    float crossTerm = 1.65 * envMid * osc + 0.52 * envAtomic * subOsc;

    float w_g = (wA + wB + crossTerm) / (2.0 + 1.4 * S);
    float w_u = (wA + wB - crossTerm) / (2.0 - 1.4 * S + 0.14);

    float W = (nBond * w_g - nAnti * w_u) * 0.56;
    float crest = 0.55 * (wA + wB) * exp(-(p * p) / 0.28);
    float negPockets = -0.62 * (0.5 * (wA + wB) + 0.55 * envMid) * exp(-((abs(p) - 0.95) * (abs(p) - 0.95)) / 0.24);
    return W + crest + negPockets * (0.55 + 0.45 * clamp(nAnti + R_eff * 0.15, 0.0, 1.0));
  }

  // Perspective 3D Euler projection returning (projX, projY, depthZ, perspScale)
  vec4 project3D(vec3 p0, float cy, float sy, float cp, float sp) {
    float x1 = p0.x * cy + p0.z * sy;
    float y1 = p0.y;
    float z1 = -p0.x * sy + p0.z * cy;
    float x2 = x1;
    float y2 = y1 * cp - z1 * sp;
    float z2 = y1 * sp + z1 * cp;
    float focal = 5.8;
    float sc = focal / max(2.2, focal - z2);
    return vec4(x2 * sc, y2 * sc, z2, sc);
  }

  // Atomic Slater 1s contribution with perspective radius scaling & near/far depth luminance
  float atomOrb(vec2 xy, vec4 proj, float zeta) {
    vec2 d = (xy - proj.xy) / proj.w;
    float dist = sqrt(dot(d, d) + 0.08);
    float wDepth = clamp(1.0 + 0.23 * (proj.z / 1.8), 0.70, 1.30);
    return exp(-zeta * dist) * wDepth;
  }

  // Whisper-thin 72-point 3D equatorial perspective ring so 3D rotation is razor-sharp & intuitive
  float eval3DRing(vec2 xy, float ringR, float cy, float sy, float cp, float sp) {
    float best = 0.0;
    const int N = 72;
    for (int i = 0; i < N; i++) {
      float ang = float(i) * (6.2831853 / float(N));
      vec3 p0 = vec3(ringR * cos(ang), 0.0, ringR * sin(ang));
      vec4 pr = project3D(p0, cy, sy, cp, sp);
      vec2 d = xy - pr.xy;
      float dw = clamp(0.55 + 0.45 * (pr.z / max(ringR, 0.5)), 0.16, 1.0);
      float g = exp(-dot(d, d) / (2.0 * 0.013 * 0.013)) * dw;
      best = max(best, g);
    }
    return best;
  }

  // Screen-space derivative anti-aliased hairline contour (vector-crisp at any resolution!)
  float crispContour(float fieldVal, float freq, float lineWidthPx) {
    float v = fieldVal * freq;
    float fw = max(fwidth(v), 0.0005);
    float distToLine = abs(fract(v + 0.5) - 0.5) / fw;
    return 1.0 - smoothstep(lineWidthPx * 0.45, lineWidthPx * 1.15, distToLine);
  }

  void main() {
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    bool isWide = aspect > 1.05;

    float zSpan = isWide ? 4.6 : 3.2;
    float pSpan = isWide ? 3.8 : 5.4;
    float z = (vUv.x - 0.5) * 2.0 * zSpan;
    float p = (vUv.y - 0.5) * 2.0 * pSpan;

    // Aspect-true real-space plane coordinates (x_rs, y_rs) so circles stay perfectly circular!
    vec2 xy;
    if (isWide) {
      float ySpan = 2.85;
      xy = vec2((vUv.x - 0.5) * 2.0 * ySpan * aspect, (vUv.y - 0.5) * 2.0 * ySpan);
    } else {
      float xSpan = 3.2;
      xy = vec2((vUv.x - 0.5) * 2.0 * xSpan, (vUv.y - 0.5) * 2.0 * xSpan / max(aspect, 0.25));
    }

    float R = max(0.5, u_R);
    float R_eff = R;
    if (u_molType > 1.5 && u_molType < 2.5) {
      R_eff = R * 1.35; // H4
    } else if (u_molType > 2.5) {
      R_eff = max(0.8, (R / 3.6) * 3.1); // BeH2 (Bohr)
    }

    // 1. Background: Exact JCP Cover Graphic Art (SubtleCoolDelicate) Wigner Field W(z, p_z)
    float W = evalWigner(z, p, R_eff, u_nBond, u_nAntibond, u_time);
    float normW = clamp((W + 1.15) / 2.50, 0.0, 1.0);
    vec3 col = jcpCoverWignerPalette(normW);

    // Subtle physically-derived hillshading from Wigner gradient
    float eps = 0.035;
    float dWz = (evalWigner(z + eps, p, R_eff, u_nBond, u_nAntibond, u_time) - evalWigner(z - eps, p, R_eff, u_nBond, u_nAntibond, u_time)) / (2.0 * eps);
    float dWp = (evalWigner(z, p + eps, R_eff, u_nBond, u_nAntibond, u_time) - evalWigner(z, p - eps, R_eff, u_nBond, u_nAntibond, u_time)) / (2.0 * eps);
    vec3 normal = normalize(vec3(-dWz * 0.34, -dWp * 0.34, 1.0));
    vec3 lightDir = normalize(vec3(-0.44, 0.44, 0.78));
    float shade = clamp(dot(normal, lightDir), 0.72, 1.18);
    col *= mix(1.0, shade, 0.38);

    // Vector-crisp fwidth anti-aliased iso-Wigner contours (#dcfaf4 positive, #7eb2ff dashed negative)
    float support = smoothstep(0.06, 0.22, abs(W));
    if (W > 0.12) {
      float linePos = crispContour(W, 3.6, 1.25) * support;
      col = mix(col, vec3(0.863, 0.980, 0.957), linePos * 0.30);
    }
    if (W < -0.12) {
      float dash = smoothstep(0.12, 0.34, sin(z * 16.0) * 0.5 + 0.5);
      float lineNeg = crispContour(abs(W), 3.2, 1.15) * support * dash;
      col = mix(col, vec3(0.494, 0.698, 1.000), lineNeg * 0.26);
    }

    // Symmetric vertical fade & deep oceanic vignette matching JCP Cover
    float vertFade = pow(clamp((abs(p) - 3.35) / 2.25, 0.0, 1.0), 1.55);
    float edgeR = length(vec2(z / 3.9, p / 6.2));
    float vignette = pow(clamp((edgeR - 0.72) / 0.55, 0.0, 1.0), 2.0);
    vec3 bgDeep = vec3(0.004, 0.014, 0.052);
    col = mix(col, bgDeep, 0.54 * vertFade);
    col = mix(col, bgDeep, 0.24 * vignette);

    // 2. Juxtaposed Continuous 3D-Rotated Real-Space Electron Density Overlay (toggled by Φ!)
    if (u_showDensity > 0.01) {
      float yaw = u_time * 0.44 + u_yawOffset;
      float pitch = 0.52 + 0.26 * sin(u_time * 0.36) + u_pitchOffset;
      float cy = cos(yaw), sy = sin(yaw);
      float cp = cos(pitch), sp = sin(pitch);

      float rho = 0.0;
      float ringR = 1.55;

      if (u_molType < 0.5) {
        // H2 (D_inf_h)
        float hr = R * 0.5;
        vec4 pr1 = project3D(vec3(-hr, 0.0, 0.0), cy, sy, cp, sp);
        vec4 pr2 = project3D(vec3(+hr, 0.0, 0.0), cy, sy, cp, sp);
        float p1 = atomOrb(xy, pr1, 1.24);
        float p2 = atomOrb(xy, pr2, 1.24);
        float S = exp(-0.55 * R * R);
        float psi_g = (p1 + p2) / sqrt(2.0 * (1.0 + S));
        float psi_u = (p1 - p2) / sqrt(2.0 * max(0.08, 1.0 - S));
        float raw = (u_nBond * 0.5) * (psi_g * psi_g) + (u_nAntibond * 0.5) * (psi_u * psi_u);
        float peakEst = mix(1.05, 0.55, smoothstep(0.7, 2.4, R));
        rho = clamp(raw / peakEst, 0.0, 1.0);
        ringR = max(1.05, hr + 0.62);
      } else if (u_molType < 1.5) {
        // H3 (D3h equilateral triangle)
        float rad = R / 1.73205;
        vec4 pr1 = project3D(vec3(rad, 0.0, 0.0), cy, sy, cp, sp);
        vec4 pr2 = project3D(vec3(-0.5 * rad, 0.0, 0.866025 * rad), cy, sy, cp, sp);
        vec4 pr3 = project3D(vec3(-0.5 * rad, 0.0, -0.866025 * rad), cy, sy, cp, sp);
        float p1 = atomOrb(xy, pr1, 1.18);
        float p2 = atomOrb(xy, pr2, 1.18);
        float p3 = atomOrb(xy, pr3, 1.18);
        float psi_a1 = (p1 + p2 + p3) / 1.73205;
        float psi_ex = (2.0 * p1 - p2 - p3) / 2.44949;
        float psi_ey = (p2 - p3) / 1.41421;
        float raw = (max(0.3, u_nBond) * 0.5) * (psi_a1 * psi_a1)
                  + (max(0.05, u_nAntibond) * 0.25) * (psi_ex * psi_ex + psi_ey * psi_ey);
        float peakEst = mix(1.35, 0.42, smoothstep(0.7, 2.5, R));
        rho = clamp(raw / peakEst, 0.0, 1.0);
        ringR = max(1.15, rad + 0.55);
      } else if (u_molType < 2.5) {
        // H4 (D2h rectangle <-> D4h square)
        float hx = 1.00;
        float hz = R * 0.5;
        vec4 pr1 = project3D(vec3(-hx, 0.0, -hz), cy, sy, cp, sp);
        vec4 pr2 = project3D(vec3(+hx, 0.0, -hz), cy, sy, cp, sp);
        vec4 pr3 = project3D(vec3(+hx, 0.0, +hz), cy, sy, cp, sp);
        vec4 pr4 = project3D(vec3(-hx, 0.0, +hz), cy, sy, cp, sp);
        float p1 = atomOrb(xy, pr1, 1.26);
        float p2 = atomOrb(xy, pr2, 1.26);
        float p3 = atomOrb(xy, pr3, 1.26);
        float p4 = atomOrb(xy, pr4, 1.26);
        float psi_ag = 0.5 * (p1 + p2 + p3 + p4);
        float psi_b2u = 0.5 * (p1 - p2 - p3 + p4);
        float psi_b3u = 0.5 * (p1 + p2 - p3 - p4);
        float raw = (max(0.3, u_nBond) * 0.5) * (psi_ag * psi_ag + 0.5 * psi_b2u * psi_b2u)
                  + (max(0.1, u_nAntibond) * 0.5) * (psi_b3u * psi_b3u);
        float peakEst = mix(0.88, 0.48, smoothstep(0.8, 2.0, R));
        rho = clamp(raw / peakEst, 0.0, 1.0);
        ringR = length(vec2(hx, hz)) + 0.52;
      } else {
        // BeH2 (C2v insertion reaction)
        float yBohr = max(0.72, 2.54 - 0.46 * R);
        float sB = 0.56;
        float bx = -0.30 * R * sB;
        float hx = +0.58 * R * sB;
        float hz = yBohr * sB;
        vec4 prBe = project3D(vec3(bx, 0.0, 0.0), cy, sy, cp, sp);
        vec4 prH1 = project3D(vec3(hx, 0.0, +hz), cy, sy, cp, sp);
        vec4 prH2 = project3D(vec3(hx, 0.0, -hz), cy, sy, cp, sp);
        float pBe = 1.22 * atomOrb(xy, prBe, 1.05);
        float pH1 = atomOrb(xy, prH1, 1.28);
        float pH2 = atomOrb(xy, prH2, 1.28);
        float psi_a1 = (pBe + 0.85 * (pH1 + pH2)) / 1.55;
        float psi_b2 = (pH1 - pH2) / 1.41421;
        float raw = (max(0.4, u_nBond) * 0.5) * (psi_a1 * psi_a1)
                  + (max(0.15, u_nAntibond) * 0.5) * (psi_b2 * psi_b2)
                  + 0.32 * (pBe * pBe);
        float peakEst = mix(1.65, 1.15, smoothstep(0.8, 3.4, R));
        rho = clamp(raw / peakEst, 0.0, 1.0);
        ringR = max(1.35, length(vec2(hx, hz)) + 0.52);
      }

      // Whisper-thin 3D equatorial perspective ring
      float ringGlow = eval3DRing(xy, ringR, cy, sy, cp, sp) * 0.22 * u_showDensity;
      col = clamp(col + vec3(0.78, 0.88, 1.00) * ringGlow, 0.0, 1.0);

      // Molecule-specific signature color story:
      //   H2 & H3 -> Beacon Crimson (#e11d48 / #ff5478)
      //   H4      -> Champagne Gold (#f5c352 / #ffe89e)
      //   BeH2    -> Bioluminescent Jade-Emerald (#26d6a2 / #8cf5d4)
      float rhoSoft = pow(rho, 1.18) * 0.78;
      float rhoCore = pow(clamp((rho - 0.36) / 0.64, 0.0, 1.0), 1.65);
      float rhoSupp = smoothstep(0.10, 0.24, rho);
      float isoRho = crispContour(rho, 4.0, 1.45) * rhoSupp * 0.54;

      vec3 densRgb;
      if (u_molType < 1.5) {
        // Beacon Crimson
        densRgb = vec3(
          1.00 * rhoSoft + 0.48 * rhoCore + 1.00 * isoRho,
          0.11 * rhoSoft + 0.54 * rhoCore + 0.56 * isoRho,
          0.24 * rhoSoft + 0.58 * rhoCore + 0.66 * isoRho
        );
      } else if (u_molType < 2.5) {
        // Champagne Gold
        densRgb = vec3(
          1.00 * rhoSoft + 0.52 * rhoCore + 1.00 * isoRho,
          0.70 * rhoSoft + 0.52 * rhoCore + 0.88 * isoRho,
          0.18 * rhoSoft + 0.44 * rhoCore + 0.52 * isoRho
        );
      } else {
        // Bioluminescent Jade-Emerald
        densRgb = vec3(
          0.12 * rhoSoft + 0.54 * rhoCore + 0.56 * isoRho,
          0.94 * rhoSoft + 0.52 * rhoCore + 0.98 * isoRho,
          0.68 * rhoSoft + 0.54 * rhoCore + 0.84 * isoRho
        );
      }

      densRgb = clamp(densRgb, 0.0, 1.0) * (0.88 * u_showDensity);
      // Soft Screen-Blend composite (zero clashing!)
      col = 1.0 - (1.0 - clamp(col, 0.0, 1.0)) * (1.0 - densRgb);
    }

    // Subtle cinematic S-curve finish
    col = clamp(col, 0.0, 1.0);
    col = mix(col, col * col * (3.0 - 2.0 * col), 0.16);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function molIdToType(moleculeId) {
  const id = String(moleculeId || "h2").toLowerCase();
  if (id.includes("beh2")) return 3.0;
  if (id.includes("h4")) return 2.0;
  if (id.includes("h3")) return 1.0;
  return 0.0;
}

export default function WebGlWignerPlot({
  r = 1.6,
  nBond = 1.918,
  nAntibond = 0.082,
  coordUnit = "Å",
  moleculeId = "h2",
  showDensityOverlay = false,
  hideInternalChrome = false
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const materialRef = useRef(null);
  const animFrameRef = useRef(null);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0 });
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
    const superDpr = Math.max(2.5, Math.min((window.devicePixelRatio || 1) * 1.5, 3.0));
    renderer.setPixelRatio(superDpr);
    renderer.setSize(width, height, true);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width * superDpr, height * superDpr) },
      u_R: { value: Number(r || 1.6) },
      u_nBond: { value: Number(nBond || 1.918) },
      u_nAntibond: { value: Number(nAntibond || 0.082) },
      u_molType: { value: molIdToType(moleculeId) },
      u_showDensity: { value: showDensityOverlay ? 1.0 : 0.0 },
      u_yawOffset: { value: 0.0 },
      u_pitchOffset: { value: 0.0 }
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
      material.uniforms.u_yawOffset.value = dragRef.current.yaw;
      material.uniforms.u_pitchOffset.value = dragRef.current.pitch;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount || !renderer) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = renderer.getPixelRatio();
      renderer.setSize(w, h, true);
      material.uniforms.u_resolution.value.set(w * dpr, h * dpr);
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
    materialRef.current.uniforms.u_molType.value = molIdToType(moleculeId);
    materialRef.current.uniforms.u_showDensity.value = showDensityOverlay ? 1.0 : 0.0;
  }, [r, nBond, nAntibond, moleculeId, showDensityOverlay]);

  // Interactive 3D spatial-frame pointer/touch drag rotation
  const handlePointerDown = useCallback((e) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    if (e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore synthetic events
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        dragRef.current.yaw += dx * 0.008;
        dragRef.current.pitch = Math.max(-1.2, Math.min(1.2, dragRef.current.pitch + dy * 0.006));
      }

      if (hideInternalChrome) return;
      const mount = mountRef.current;
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const u = x / rect.width;
      const v = 1.0 - y / rect.height;

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
    [r, nBond, nAntibond, hideInternalChrome]
  );

  const handleMouseLeave = () => {
    dragRef.current.active = false;
    setHoverData(null);
  };

  return (
    <div className="wigner-workstation-panel">
      {!hideInternalChrome && (
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
      )}

      <div
        ref={mountRef}
        className="wigner-canvas-container"
        style={{ cursor: showDensityOverlay ? "grab" : "default", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={handleMouseLeave}
      >
        {!hideInternalChrome && (
          <>
            <div className="wigner-axis-label axis-z-center">z ({coordUnit})</div>
            <div className="wigner-axis-label axis-p-center">p<sub>z</sub> (ℏ/a<sub>0</sub>)</div>
          </>
        )}

        {!hideInternalChrome && hoverData && (
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
