import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EdmQuantumFluxSonifier } from "../physics/EdmQuantumFluxSonifier";
import {
  PONG_BOUNDS,
  createInitialPongState,
  applyPerturbation,
  stepQuantumPong,
  computeAgentClick,
} from "../physics/QuantumPongEngine";
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
  collapsed,
  resetToken,
  level,
  agentEnabled,
  onPluck,
  onDeflect,
  onScore,
  onCollapse,
}) {
  const mountRef = useRef(null);
  const paramsRef = useRef({
    bondStretch,
    couplingScale,
    rewardUnlocked,
    collapsed,
    level,
    agentEnabled,
  });
  const rippleRef = useRef({ x: 0, z: 0, amp: 0, age: 10 });
  const callbacksRef = useRef({ onPluck, onDeflect, onScore, onCollapse });
  const resetFlagRef = useRef(resetToken);

  useEffect(() => {
    paramsRef.current = {
      bondStretch,
      couplingScale,
      rewardUnlocked,
      collapsed,
      level,
      agentEnabled,
    };
  }, [bondStretch, couplingScale, rewardUnlocked, collapsed, level, agentEnabled]);

  useEffect(() => {
    callbacksRef.current = { onPluck, onDeflect, onScore, onCollapse };
  }, [onPluck, onDeflect, onScore, onCollapse]);

  useEffect(() => {
    resetFlagRef.current = resetToken;
  }, [resetToken]);

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

    // 2. Quantum Siren-Fish (Sculpted hourglass koi-siren silhouette swimming in the quantum sea)
    const puckGroup = new THREE.Group();
    const fishDisposables = [];
    const trackDisp = (item) => {
      fishDisposables.push(item);
      return item;
    };

    // Sculpted hourglass torso profile along Y, then rotated so +X is forward
    const bodyProfile = [
      new THREE.Vector2(0.001, 0.44),
      new THREE.Vector2(0.085, 0.38),
      new THREE.Vector2(0.115, 0.30), // slender neck/collar
      new THREE.Vector2(0.168, 0.18), // upper torso / bust curve
      new THREE.Vector2(0.112, 0.03), // tapered waist
      new THREE.Vector2(0.158, -0.14), // hip / lower curve
      new THREE.Vector2(0.115, -0.30),
      new THREE.Vector2(0.058, -0.44), // tail peduncle
      new THREE.Vector2(0.001, -0.50),
    ];
    const bodyCurve = new THREE.SplineCurve(bodyProfile);
    const bodyPoints = bodyCurve.getPoints(40);
    const puckCoreGeo = trackDisp(new THREE.LatheGeometry(bodyPoints, 48));
    puckCoreGeo.rotateZ(-Math.PI / 2); // +X is head, -X is tail

    const puckCoreMat = trackDisp(
      new THREE.MeshPhysicalMaterial({
        color: 0x3b82f6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.68,
        metalness: 0.18,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        iridescence: 1.0,
        iridescenceIOR: 1.38,
        sheen: 0.85,
        sheenColor: new THREE.Color(0xfb7185),
      }),
    );
    const puckCore = new THREE.Mesh(puckCoreGeo, puckCoreMat);
    puckGroup.add(puckCore);

    // Subtle pearl-opalescent head & feminine visage
    const headGeo = trackDisp(new THREE.SphereGeometry(0.125, 32, 32));
    headGeo.scale(1.18, 0.94, 0.88);
    const headMat = trackDisp(
      new THREE.MeshPhysicalMaterial({
        color: 0xe0e7ff,
        emissive: 0x60a5fa,
        emissiveIntensity: 0.32,
        metalness: 0.1,
        roughness: 0.14,
        clearcoat: 1.0,
        iridescence: 0.8,
      }),
    );
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0.42, 0.03, 0);
    puckGroup.add(headMesh);

    // Luminous eyes & subtle crimson lip accent
    const eyeGeo = trackDisp(new THREE.SphereGeometry(0.022, 16, 16));
    const eyeMat = trackDisp(new THREE.MeshBasicMaterial({ color: 0x93c5fd }));
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.50, 0.055, 0.072);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.50, 0.055, -0.072);
    puckGroup.add(leftEye, rightEye);

    const lipGeo = trackDisp(new THREE.TorusGeometry(0.022, 0.007, 12, 24, Math.PI));
    lipGeo.rotateY(Math.PI / 2);
    lipGeo.rotateX(Math.PI);
    const lipMat = trackDisp(new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    const lipMesh = new THREE.Mesh(lipGeo, lipMat);
    lipMesh.position.set(0.555, 0.0, 0);
    puckGroup.add(lipMesh);

    // Luminous heart-core inside chest
    const innerGlowGeo = trackDisp(new THREE.SphereGeometry(0.085, 24, 24));
    const innerGlowMat = trackDisp(new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    innerGlow.position.set(0.18, 0.02, 0);
    puckGroup.add(innerGlow);

    // Flowing bioluminescent hair-tendrils sweeping back from the crown & temples
    const tendrilConfigs = [
      { pts: [[0.44, 0.11, 0.03], [0.22, 0.19, 0.11], [-0.05, 0.15, 0.16], [-0.32, 0.09, 0.11]], color: 0xfb7185, r: 0.015 },
      { pts: [[0.44, 0.11, -0.03], [0.22, 0.19, -0.11], [-0.05, 0.15, -0.16], [-0.32, 0.09, -0.11]], color: 0xfb7185, r: 0.015 },
      { pts: [[0.46, 0.13, 0.0], [0.20, 0.24, 0.0], [-0.10, 0.21, 0.02], [-0.38, 0.12, 0.0]], color: 0x60a5fa, r: 0.018 },
    ];
    tendrilConfigs.forEach((cfg) => {
      const curve = new THREE.CatmullRomCurve3(cfg.pts.map((p) => new THREE.Vector3(...p)));
      const tGeo = trackDisp(new THREE.TubeGeometry(curve, 28, cfg.r, 10, false));
      const tMat = trackDisp(
        new THREE.MeshBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      puckGroup.add(new THREE.Mesh(tGeo, tMat));
    });

    // Translucent silk-veil fin material
    const finMat = trackDisp(
      new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.72,
        transparent: true,
        opacity: 0.72,
        roughness: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const blueFinMat = trackDisp(
      new THREE.MeshPhysicalMaterial({
        color: 0x60a5fa,
        emissive: 0x2563eb,
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0.68,
        roughness: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );

    // Sweeping pectoral fins (graceful arm-like veil fins)
    const pecShape = new THREE.Shape();
    pecShape.moveTo(0, 0);
    pecShape.quadraticCurveTo(-0.18, 0.08, -0.44, 0.24);
    pecShape.quadraticCurveTo(-0.34, 0.04, -0.22, -0.06);
    pecShape.quadraticCurveTo(-0.08, -0.05, 0, 0);
    const pecGeo = trackDisp(new THREE.ShapeGeometry(pecShape, 24));
    pecGeo.rotateX(Math.PI / 2);

    const leftPec = new THREE.Mesh(pecGeo, blueFinMat);
    leftPec.position.set(0.22, -0.02, 0.13);
    leftPec.rotation.y = 0.22;
    const rightPec = new THREE.Mesh(pecGeo, blueFinMat);
    rightPec.position.set(0.22, -0.02, -0.13);
    rightPec.scale.z = -1;
    rightPec.rotation.y = -0.22;
    puckGroup.add(leftPec, rightPec);

    // Flowing dorsal crest fin
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0.22, 0.13);
    dorsalShape.quadraticCurveTo(0.02, 0.34, -0.26, 0.22);
    dorsalShape.quadraticCurveTo(-0.34, 0.12, -0.42, 0.05);
    dorsalShape.lineTo(0.22, 0.13);
    const dorsalGeo = trackDisp(new THREE.ShapeGeometry(dorsalShape, 24));
    const dorsalMesh = new THREE.Mesh(dorsalGeo, finMat);
    puckGroup.add(dorsalMesh);

    // Articulated forked koi-mermaid caudal tail fin
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-0.46, 0, 0);
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0.03);
    tailShape.quadraticCurveTo(-0.22, 0.26, -0.52, 0.36);
    tailShape.quadraticCurveTo(-0.36, 0.12, -0.24, 0.0);
    tailShape.quadraticCurveTo(-0.36, -0.12, -0.52, -0.36);
    tailShape.quadraticCurveTo(-0.22, -0.26, 0, -0.03);
    tailShape.closePath();
    const tailGeo = trackDisp(new THREE.ShapeGeometry(tailShape, 32));
    tailGeo.rotateX(Math.PI / 2);
    const tailMesh = new THREE.Mesh(tailGeo, finMat);
    tailPivot.add(tailMesh);
    puckGroup.add(tailPivot);

    // Subtle outer quantum aura ring orbiting her waist
    const ring1Geo = trackDisp(new THREE.TorusGeometry(0.32, 0.012, 16, 64));
    const ring1Mat = trackDisp(
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.y = Math.PI / 2;
    puckGroup.add(ring1);

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

    // 3b. Decoherence Singularity (3D Event Horizon + Gravitational Lensing + Swirling Accretion Disk)
    const holeGroup = new THREE.Group();
    const holeCoreGeo = new THREE.SphereGeometry(0.44, 64, 64);
    const holeCoreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const holeCore = new THREE.Mesh(holeCoreGeo, holeCoreMat);
    holeCore.position.y = 0.22;

    const holeRimGeo = new THREE.TorusGeometry(0.46, 0.018, 24, 96);
    holeRimGeo.rotateX(Math.PI / 2);
    const holeRimMat = new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const holeRim = new THREE.Mesh(holeRimGeo, holeRimMat);
    holeRim.position.y = 0.22;

    const lensArcGeo = new THREE.TorusGeometry(0.51, 0.024, 24, 96);
    const lensArcMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lensArc = new THREE.Mesh(lensArcGeo, lensArcMat);
    lensArc.position.y = 0.22;
    lensArc.rotation.x = 0.38;
    lensArc.rotation.z = -0.22;

    const accretionGeo = new THREE.RingGeometry(0.47, 1.38, 96, 8);
    accretionGeo.rotateX(-Math.PI / 2);
    const accretionMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uDanger: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uDanger;
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          float r = length(vPos.xz);
          float normR = clamp((r - 0.47) / (1.38 - 0.47), 0.0, 1.0);
          float angle = atan(vPos.z, vPos.x);
          float kepler = angle - uTime * (2.6 + (1.0 - normR) * 3.8) + 7.5 / (r + 0.12);
          float spiral1 = 0.5 + 0.5 * sin(kepler * 3.0);
          float spiral2 = 0.5 + 0.5 * sin(kepler * 5.0 - uTime * 2.2);
          float streaks = mix(spiral1, spiral2, 0.45);
          float innerGlow = exp(-normR * 3.6);
          float outerFade = smoothstep(1.0, 0.58, normR) * smoothstep(0.0, 0.08, normR);

          vec3 hotCore = vec3(1.0, 0.84, 0.88);
          vec3 crimson = vec3(0.88, 0.11, 0.28);
          vec3 royalBlue = vec3(0.23, 0.51, 0.96);

          vec3 col = mix(crimson, royalBlue, smoothstep(0.32, 0.92, normR));
          col = mix(col, hotCore, innerGlow * (0.65 + uDanger * 0.35));
          float alpha = outerFade * (0.28 + 0.52 * streaks + 0.45 * innerGlow) * (0.78 + uDanger * 0.35);
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
        }
      `,
    });
    const accretionDisk = new THREE.Mesh(accretionGeo, accretionMat);
    accretionDisk.position.y = 0.22;
    accretionDisk.rotation.x = 0.18;
    accretionDisk.rotation.z = -0.08;

    const VORTEX_COUNT = 100;
    const vortexPos = new Float32Array(VORTEX_COUNT * 3);
    const vortexMeta = Array.from({ length: VORTEX_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.48 + Math.random() * 0.92,
      speed: 1.6 + Math.random() * 2.4,
      yOffset: (Math.random() - 0.5) * 0.14,
    }));
    const vortexGeo = new THREE.BufferGeometry();
    vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));
    const vortexMat = new THREE.PointsMaterial({
      color: 0xfb7185,
      size: 0.048,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const vortexPoints = new THREE.Points(vortexGeo, vortexMat);
    vortexPoints.position.y = 0.22;

    holeGroup.add(holeCore);
    holeGroup.add(holeRim);
    holeGroup.add(lensArc);
    holeGroup.add(accretionDisk);
    holeGroup.add(vortexPoints);
    scene.add(holeGroup);

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

    // Shared QuantumPongEngine physics state + exact 3D Raycaster
    const gameState = createInitialPongState(0.35);
    const { puck, gate, hole } = gameState;
    let lastResetSeen = resetFlagRef.current;
    let agentTick = 0;

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const phasePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();

    // Expanding 3D click shockwave ring
    const clickRingGeo = new THREE.RingGeometry(0.16, 0.24, 48);
    clickRingGeo.rotateX(-Math.PI / 2);
    const clickRingMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const clickRingMesh = new THREE.Mesh(clickRingGeo, clickRingMat);
    scene.add(clickRingMesh);

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

      pointerNdc.set(nx, ny);
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.ray.intersectPlane(phasePlane, hitPoint);
      const clickX = hit ? THREE.MathUtils.clamp(hitPoint.x, -5.2, 5.2) : nx * 4.8;
      const clickZ = hit ? THREE.MathUtils.clamp(hitPoint.z, -3.2, 3.2) : -ny * 2.8;

      rippleRef.current = {
        x: clickX,
        z: clickZ,
        amp: 1.25,
        age: 0,
      };

      const { deflected } = applyPerturbation(gameState, clickX, clickZ);

      if (deflected && callbacksRef.current.onDeflect) {
        callbacksRef.current.onDeflect((nx + 1) * 0.5);
      } else if (callbacksRef.current.onPluck) {
        callbacksRef.current.onPluck((nx + 1) * 0.5);
      }
    };
    window.addEventListener("pointerdown", handleGlobalPointerDown);

    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = 0.018;
      rippleRef.current.age += 0.045;

      const {
        bondStretch: R,
        couplingScale: cScale,
        rewardUnlocked: isReward,
        collapsed: isCollapsed,
        level: curLevel,
        agentEnabled: isAgent,
      } = paramsRef.current;

      if (resetFlagRef.current !== lastResetSeen) {
        lastResetSeen = resetFlagRef.current;
        const fresh = createInitialPongState((Math.random() - 0.5) * 1.4);
        gameState.time = fresh.time;
        gameState.puck.x = fresh.puck.x;
        gameState.puck.z = fresh.puck.z;
        gameState.puck.vx = fresh.puck.vx;
        gameState.puck.vz = fresh.puck.vz;
        gameState.gate.side = fresh.gate.side;
        gameState.gate.z = fresh.gate.z;
        gameState.gate.cooldown = 0;
        gameState.graceFrames = fresh.graceFrames;
        gameState.score = 0;
        gameState.collapsed = false;
        gameState.won = false;
      }

      gameState.collapsed = isCollapsed;
      gameState.won = isReward;

      // Live AI Agent steering when AGENT mode is active
      agentTick += 1;
      if (isAgent && !isCollapsed && !isReward && agentTick % 16 === 0) {
        const gateX = gate.side * PONG_BOUNDS.gateX;
        const dot = puck.vx * (gateX - puck.x) + puck.vz * (gate.z - puck.z);
        const hDist = Math.hypot(puck.x - hole.x, puck.z - hole.z);
        if (dot <= 0 || hDist < 2.0 || agentTick % 32 === 0) {
          const { x: ax, z: az } = computeAgentClick(gameState, 0.16);
          rippleRef.current = { x: ax, z: az, amp: 1.1, age: 0 };
          applyPerturbation(gameState, ax, az);
          if (callbacksRef.current.onDeflect) {
            callbacksRef.current.onDeflect(THREE.MathUtils.clamp((ax / 4.8 + 1) * 0.5, 0, 1));
          }
        }
      }

      const { event, x: evX, z: evZ, holeDanger = 0 } = stepQuantumPong(gameState, {
        bondStretch: R,
        targetResonances: TARGET_RESONANCES,
        level: curLevel,
        dt: 0.018,
      });

      if (event === "collapse") {
        rippleRef.current = { x: evX, z: evZ, amp: 1.65, age: 0 };
        if (callbacksRef.current.onCollapse) callbacksRef.current.onCollapse();
      } else if (event === "score" || event === "win") {
        rippleRef.current = { x: evX, z: evZ, amp: 1.45, age: 0 };
        if (callbacksRef.current.onScore) callbacksRef.current.onScore();
      }

      const time = gameState.time;
      const stretchNorm = (R - 0.8) / (3.2 - 0.8);
      const coupling = Math.max(0.15, cScale);
      const rip = rippleRef.current;
      const ripEnv = Math.exp(-rip.age * 1.3) * rip.amp;

      // Update expanding 3D click shockwave ring
      if (rip.age < 1.8) {
        clickRingMesh.position.set(rip.x, 0.25, rip.z);
        clickRingMesh.scale.setScalar(1 + rip.age * 4.5);
        clickRingMat.opacity = Math.max(0, 0.85 * (1 - rip.age / 1.8));
      } else {
        clickRingMat.opacity = 0;
      }

      holeGroup.position.set(hole.x, 0.05, hole.z);
      const pulse = 1 + Math.sin(time * (4.5 + holeDanger * 9.0)) * (0.04 + holeDanger * 0.07);
      holeRim.scale.setScalar(pulse);
      holeRimMat.opacity = 0.85 + holeDanger * 0.15;
      lensArc.scale.setScalar(1 + Math.cos(time * 3.2) * 0.03 + holeDanger * 0.06);
      lensArc.rotation.y = time * 0.45;
      lensArcMat.opacity = 0.45 + holeDanger * 0.42;
      accretionMat.uniforms.uTime.value = time;
      accretionMat.uniforms.uDanger.value = holeDanger;

      const vAttr = vortexGeo.attributes.position;
      for (let i = 0; i < VORTEX_COUNT; i++) {
        const vm = vortexMeta[i];
        vm.angle += dt * (vm.speed + (1.4 - vm.radius) * 2.2) * (1 + holeDanger * 0.75);
        vm.radius -= dt * (0.28 + holeDanger * 0.32);
        if (vm.radius < 0.45) {
          vm.radius = 1.28 + Math.random() * 0.16;
          vm.angle = Math.random() * Math.PI * 2;
        }
        vAttr.setXYZ(
          i,
          Math.cos(vm.angle) * vm.radius,
          vm.yOffset * ((vm.radius - 0.44) / 0.95),
          Math.sin(vm.angle) * vm.radius,
        );
      }
      vAttr.needsUpdate = true;
      vortexMat.opacity = 0.58 + holeDanger * 0.35;

      const puckY = 0.78 + Math.sin(time * 3.4) * 0.09;
      puckGroup.position.set(puck.x, puckY, puck.z);

      // Swim headfirst along velocity vector with graceful banking & tail undulation
      const speed = Math.hypot(puck.vx, puck.vz);
      const targetYaw = speed > 0.05 ? Math.atan2(-puck.vz, puck.vx) : puckGroup.rotation.y;
      let yawDiff = targetYaw - puckGroup.rotation.y;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      puckGroup.rotation.y += yawDiff * Math.min(1, dt * 10);
      puckGroup.rotation.x = THREE.MathUtils.clamp(-yawDiff * 0.35, -0.35, 0.35);
      puckGroup.rotation.z = Math.sin(time * 3.4) * 0.06;

      const swimPhase = time * (6.5 + speed * 1.9);
      tailPivot.rotation.y = Math.sin(swimPhase) * (0.28 + Math.min(0.24, speed * 0.05));
      leftPec.rotation.z = Math.sin(swimPhase * 0.7) * 0.22;
      rightPec.rotation.z = -Math.sin(swimPhase * 0.7) * 0.22;
      ring1.rotation.z = time * 1.4;
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
        const holeFunnel = -1.95 * Math.exp(-((x - hole.x) ** 2 + (z - hole.z) ** 2) / 0.55);
        const y = (g1 + g2) * 0.85 + interference * 0.72 + rippleWave + puckDip + holeFunnel;
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
      holeCoreGeo.dispose();
      holeCoreMat.dispose();
      holeRimGeo.dispose();
      holeRimMat.dispose();
      lensArcGeo.dispose();
      lensArcMat.dispose();
      accretionGeo.dispose();
      accretionMat.dispose();
      vortexGeo.dispose();
      vortexMat.dispose();
      clickRingGeo.dispose();
      clickRingMat.dispose();
      fishDisposables.forEach((d) => d.dispose());
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
  const [collapsed, setCollapsed] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [agentEnabled, setAgentEnabled] = useState(false);
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
    setCollapsed(false);
    setResetToken((t) => t + 1);
    setLevel((l) => l + 1);
    const nextIdx = (systemIdx + 1) % SYSTEMS.length;
    setSystemIdx(nextIdx);
    triggerReflectiveSfx(0.75, SYSTEMS[nextIdx].id);
  };

  const handleCollapse = () => {
    setCollapsed(true);
    setScore(0);
    setStreak(0);
    if (sonifierRef.current) {
      sonifierRef.current.triggerCollapseSfx();
    }
  };

  const handleReinitialize = () => {
    setCollapsed(false);
    setScore(0);
    setStreak(0);
    setResetToken((t) => t + 1);
    triggerReflectiveSfx(0.5);
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
        collapsed={collapsed}
        resetToken={resetToken}
        level={level}
        agentEnabled={agentEnabled}
        onPluck={(pitchNorm) => triggerReflectiveSfx(pitchNorm)}
        onDeflect={handleDeflect}
        onScore={handleScore}
        onCollapse={handleCollapse}
      />

      <header className="qbeck-top-bar">
        <button className="qbeck-icon-btn" onClick={onBackHome} title="Back to Point Reyes Sound">
          &larr;
        </button>

        <h1 className="qbeck-caps-title">Q-BECK</h1>

        <div className="qbeck-top-actions">
          <div className="qbeck-pip-meter" title={`Level ${level} · ${score}/${TARGET_RESONANCES} Resonances`}>
            <span className="qbeck-lvl-tag">L{level}</span>
            {Array.from({ length: TARGET_RESONANCES }, (_, idx) => (
              <span
                key={idx}
                className={`qbeck-pip ${idx < score ? "is-filled" : ""}`}
              />
            ))}
          </div>
          <button
            className={`qbeck-edm-btn ${agentEnabled ? "is-playing" : ""}`}
            onClick={() => setAgentEnabled((a) => !a)}
            title="Toggle Automated Quantum Pong Agent"
          >
            {agentEnabled ? "AGENT: ON" : "AGENT"}
          </button>
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

      {score === 0 && !rewardUnlocked && !collapsed && (
        <p className="qbeck-objective-line">
          Steer the puck through the crimson ring five times—avoid the black decoherence hole.
        </p>
      )}

      {collapsed && (
        <div className="qbeck-reward-banner" role="alert">
          <span className="qbeck-reward-badge">DECOHERENCE SINGULARITY</span>
          <strong className="qbeck-reward-title">Wavefunction Collapsed</strong>
          <button type="button" className="qbeck-reward-btn" onClick={handleReinitialize}>
            Re-Initialize
          </button>
        </div>
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
