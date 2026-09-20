import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * PointReyesSound3DBackground
 * Implicit 3D rendering layer that brings the Point Reyes seascape to life:
 * 1. Undulating 3D kinetic ocean wave mesh simulating crashing Pacific surf.
 * 2. 3D drifting sea-spray mist particles rising from breaker zones.
 * 3. Atmospheric rotating volumetric light sweep from the red watchtower beacon.
 * 4. Subtle, buttery-smooth mouse & scroll parallax for palpable depth.
 * 5. Engineered for high performance (60fps, low GPU overhead) and zero eye fatigue.
 */
export default function PointReyesSound3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.8, 12);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Interactive Mouse Parallax Coordinates
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollY = window.scrollY;

    const onMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // 3. 3D Kinetic Ocean Wave Mesh (Continuous phase-space kinetics)
    const waveWidth = 46;
    const waveDepth = 34;
    const segW = 64;
    const segD = 48;
    const waveGeometry = new THREE.PlaneGeometry(waveWidth, waveDepth, segW, segD);
    waveGeometry.rotateX(-Math.PI / 2.3);
    waveGeometry.translate(0, -6.8, -4);

    const posAttr = waveGeometry.attributes.position;
    const originalPositions = new Float32Array(posAttr.array);

    // Custom shader material with soft bioluminescent dawn ocean gradient
    const waveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color("#082132") },
        uColorCrest: { value: new THREE.Color("#38bdf8") },
        uColorSpray: { value: new THREE.Color("#fef08a") }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying float vElevation;

        void main() {
          vPosition = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          
          // Multi-harmonic kinetic waves
          float wave1 = sin(position.x * 0.28 + uTime * 1.4) * 0.45;
          float wave2 = cos(position.y * 0.35 + uTime * 1.8) * 0.35;
          float wave3 = sin((position.x + position.y) * 0.18 + uTime * 2.2) * 0.22;
          
          // Crashing surf surge factor near the coastal shore
          float shoreSurge = smoothstep(-15.0, 10.0, position.y) * 0.5;
          float totalElevation = (wave1 + wave2 + wave3) * (0.8 + shoreSurge);
          
          vec3 transformed = position;
          transformed.z += totalElevation;
          vElevation = totalElevation;

          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorDeep;
        uniform vec3 uColorCrest;
        uniform vec3 uColorSpray;
        varying float vElevation;

        void main() {
          float crestFactor = smoothstep(-0.4, 0.7, vElevation);
          vec3 color = mix(uColorDeep, uColorCrest, crestFactor);
          
          // Foaming golden spray highlights on breaking crests in dawn sunlight
          if (vElevation > 0.45) {
            float sprayMix = smoothstep(0.45, 0.85, vElevation);
            color = mix(color, uColorSpray, sprayMix * 0.65);
          }
          
          // Soft ethereal transparency for zero eye fatigue & clean text contrast
          float alpha = smoothstep(-0.8, 0.6, vElevation) * 0.18 + 0.05;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      wireframe: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial);
    scene.add(waveMesh);

    // 4. 3D Drifting Sea-Spray Mist Particles
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 36;
      particlePositions[i * 3 + 1] = Math.random() * 12 - 4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.012 + 0.005, // Gentle eastward Pacific breeze
        y: Math.random() * 0.008 + 0.002,         // Rising sea mist thermal
        z: (Math.random() - 0.5) * 0.008
      });
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0xfde68a,
      size: 0.16,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 5. Point Reyes Red Watchtower Beacon Beam (Dawn Sunrise Warmth)
    // Positioned in 3D camera space at top-right headlands (matching watchtower)
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(7.5, 4.2, -6);

    // Red watchtower lantern housing anchor
    const beaconLightGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const beaconLightMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85
    });
    const beaconLightMesh = new THREE.Mesh(beaconLightGeo, beaconLightMat);
    beaconGroup.add(beaconLightMesh);

    // Sweeping volumetric beacon cone in morning dawn light
    const beamGeo = new THREE.ConeGeometry(3.5, 14, 24, 1, true);
    beamGeo.rotateZ(Math.PI / 2);
    beamGeo.translate(7, 0, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beaconGroup.add(beamMesh);

    // Subtle point light for morning ambient warmth
    const beaconPointLight = new THREE.PointLight(0xfbbf24, 1.0, 18);
    beaconGroup.add(beaconPointLight);

    scene.add(beaconGroup);

    // 6. Responsive Window Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // 7. Animation & Physics Render Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // Subtle scroll parallax offset
      const scrollOffset = (scrollY * 0.0015);

      camera.position.x = mouse.x * 0.65;
      camera.position.y = 1.8 + mouse.y * 0.45 - scrollOffset * 0.8;
      camera.lookAt(0, -2.4 - scrollOffset * 0.5, 0);

      // Update wave mesh uniform time
      waveMaterial.uniforms.uTime.value = elapsedTime;

      // Rotate beacon light sweep across the marine fog
      beaconGroup.rotation.y = elapsedTime * 0.42;
      // Gentle pulsing beacon intensity
      const pulse = 0.75 + 0.25 * Math.sin(elapsedTime * 3.2);
      beaconLightMat.opacity = 0.7 * pulse;
      beaconPointLight.intensity = 1.0 * pulse;

      // Animate drifting sea mist particles
      const pArr = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pArr[i * 3 + 0] += particleVelocities[i].x;
        pArr[i * 3 + 1] += particleVelocities[i].y;
        pArr[i * 3 + 2] += particleVelocities[i].z;

        // Wrap around boundaries
        if (pArr[i * 3 + 0] > 18) pArr[i * 3 + 0] = -18;
        if (pArr[i * 3 + 1] > 8) pArr[i * 3 + 1] = -4;
        if (pArr[i * 3 + 2] > 10) pArr[i * 3 + 2] = -10;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);

      waveGeometry.dispose();
      waveMaterial.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      beaconLightGeo.dispose();
      beaconLightMat.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="point-reyes-3d-canvas-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} className="point-reyes-3d-canvas" />
      <div className="point-reyes-atmospheric-vignette" />
    </div>
  );
}
