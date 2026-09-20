import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * PointReyesSound3DBackground
 * Implicit 3D rendering layer bringing the Point Reyes seascape and ocean floor to life:
 * 1. Submerged 3D ocean floor / continental shelf seabed with caustic light patterns.
 * 2. Undulating 3D kinetic ocean wave surface simulating crashing Pacific surf.
 * 3. 3D drifting sea-spray mist particles rising from breaker zones.
 * 4. Drifting benthic marine particles near the seabed shelf.
 * 5. Atmospheric rotating volumetric light sweep from the red watchtower beacon.
 * 6. Buttery-smooth mouse & scroll parallax for authentic physical depth.
 * 7. Lighter marine bathymetry with zero eye fatigue.
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

    // =========================================================================
    // 3. SUBMERGED 3D OCEAN FLOOR / CONTINENTAL SHELF SEABED
    // =========================================================================
    const floorWidth = 52;
    const floorDepth = 36;
    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorDepth, 48, 36);
    floorGeo.rotateX(-Math.PI / 2.2);
    floorGeo.translate(0, -6.8, -4);

    const floorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorBedDeep: { value: new THREE.Color("#062432") },
        uColorBedShelf: { value: new THREE.Color("#0e4d5d") },
        uColorCaustic: { value: new THREE.Color("#2dd4bf") }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying float vDepth;

        void main() {
          vPosition = position;
          
          // Sand ripple topography & continental shelf incline
          float sandRipple = sin(position.x * 0.75 + position.y * 0.45) * 0.28
                           + cos(position.x * 0.35 - position.y * 0.6) * 0.22;
          float shelfIncline = position.y * 0.12;
          
          vec3 transformed = position;
          transformed.z += sandRipple + shelfIncline;
          vDepth = transformed.z;

          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorBedDeep;
        uniform vec3 uColorBedShelf;
        uniform vec3 uColorCaustic;
        varying vec3 vPosition;
        varying float vDepth;

        void main() {
          // Underwater caustic light web moving across the ocean bed
          float caustic1 = sin(vPosition.x * 0.55 + uTime * 0.9 + cos(vPosition.y * 0.45 + uTime * 0.7));
          float caustic2 = cos(vPosition.y * 0.65 - uTime * 0.8 + sin(vPosition.x * 0.40 + uTime * 0.6));
          float causticWeb = pow(clamp(caustic1 * caustic2 * 0.5 + 0.5, 0.0, 1.0), 3.2) * 0.55;

          // Blend from deep benthic trench to lighter continental shelf sand
          float shelfFactor = smoothstep(-2.5, 3.5, vDepth);
          vec3 bedColor = mix(uColorBedDeep, uColorBedShelf, shelfFactor);
          bedColor += uColorCaustic * causticWeb;

          // Translucency so it glows subtly beneath the surface
          float alpha = 0.40 + shelfFactor * 0.25;
          gl_FragColor = vec4(bedColor, alpha);
        }
      `,
      wireframe: false,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    scene.add(floorMesh);

    // Wireframe contours on the ocean floor to highlight bathymetric depth
    const floorWireMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const floorWireMesh = new THREE.Mesh(floorGeo, floorWireMat);
    scene.add(floorWireMesh);

    // =========================================================================
    // 4. 3D KINETIC OCEAN WAVE SURFACE (Crashing Pacific Surf)
    // =========================================================================
    const waveWidth = 46;
    const waveDepth = 32;
    const segW = 64;
    const segD = 48;
    const waveGeometry = new THREE.PlaneGeometry(waveWidth, waveDepth, segW, segD);
    waveGeometry.rotateX(-Math.PI / 2.3);
    waveGeometry.translate(0, -3.6, -2);

    // Custom shader material with lighter, crystalline ocean surf gradient
    const waveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color("#0c3e50") },   // Lighter Pacific marine teal
        uColorCrest: { value: new THREE.Color("#38bdf8") },  // Vibrant wave crest cyan
        uColorSpray: { value: new THREE.Color("#e0f2fe") }   // Luminous foaming surf
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying float vElevation;

        void main() {
          vPosition = position;
          
          // Multi-harmonic kinetic waves
          float wave1 = sin(position.x * 0.28 + uTime * 1.4) * 0.45;
          float wave2 = cos(position.y * 0.35 + uTime * 1.8) * 0.35;
          float wave3 = sin((position.x + position.y) * 0.18 + uTime * 2.2) * 0.22;
          
          // Crashing surf surge factor near the coastal shore
          float shoreSurge = smoothstep(-15.0, 10.0, position.y) * 0.52;
          float totalElevation = (wave1 + wave2 + wave3) * (0.85 + shoreSurge);
          
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
          float crestFactor = smoothstep(-0.35, 0.65, vElevation);
          vec3 color = mix(uColorDeep, uColorCrest, crestFactor);
          
          // Foaming spray highlights on breaking crests
          if (vElevation > 0.42) {
            float sprayMix = smoothstep(0.42, 0.85, vElevation);
            color = mix(color, uColorSpray, sprayMix * 0.75);
          }
          
          // Lighter, more crystalline water column transparency
          float alpha = smoothstep(-0.8, 0.6, vElevation) * 0.38 + 0.12;
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

    // =========================================================================
    // 5. 3D DRIFTING SEA-SPRAY & BENTHIC SEABED PARTICLES
    // =========================================================================
    // A. Coastal Sea-Spray Mist (Upper atmosphere)
    const sprayCount = 240;
    const sprayGeo = new THREE.BufferGeometry();
    const sprayPositions = new Float32Array(sprayCount * 3);
    const sprayVelocities = [];

    for (let i = 0; i < sprayCount; i++) {
      sprayPositions[i * 3 + 0] = (Math.random() - 0.5) * 36;
      sprayPositions[i * 3 + 1] = Math.random() * 10 - 2;
      sprayPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      sprayVelocities.push({
        x: (Math.random() - 0.5) * 0.012 + 0.005,
        y: Math.random() * 0.008 + 0.003,
        z: (Math.random() - 0.5) * 0.008
      });
    }

    sprayGeo.setAttribute("position", new THREE.BufferAttribute(sprayPositions, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.18,
      transparent: true,
      opacity: 0.50,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const spraySystem = new THREE.Points(sprayGeo, sprayMat);
    scene.add(spraySystem);

    // B. Submerged Ocean Floor Marine Particles (Drifting along seabed)
    const benthicCount = 140;
    const benthicGeo = new THREE.BufferGeometry();
    const benthicPositions = new Float32Array(benthicCount * 3);
    const benthicVelocities = [];

    for (let i = 0; i < benthicCount; i++) {
      benthicPositions[i * 3 + 0] = (Math.random() - 0.5) * 44;
      benthicPositions[i * 3 + 1] = Math.random() * 4 - 7.5; // Near seabed shelf
      benthicPositions[i * 3 + 2] = (Math.random() - 0.5) * 26;

      benthicVelocities.push({
        x: (Math.random() - 0.5) * 0.008 - 0.003, // Slow ocean undercurrent
        y: (Math.random() - 0.5) * 0.004,
        z: (Math.random() - 0.5) * 0.006
      });
    }

    benthicGeo.setAttribute("position", new THREE.BufferAttribute(benthicPositions, 3));
    const benthicMat = new THREE.PointsMaterial({
      color: 0x2dd4bf, // Bioluminescent marine teal
      size: 0.15,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const benthicSystem = new THREE.Points(benthicGeo, benthicMat);
    scene.add(benthicSystem);

    // =========================================================================
    // 6. POINT REYES RED WATCHTOWER BEACON (Volumetric Ray Sweep)
    // =========================================================================
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(7.5, 4.2, -6);

    const beaconLightGeo = new THREE.SphereGeometry(0.20, 16, 16);
    const beaconLightMat = new THREE.MeshBasicMaterial({
      color: 0xff4d4d,
      transparent: true,
      opacity: 0.90
    });
    const beaconLightMesh = new THREE.Mesh(beaconLightGeo, beaconLightMat);
    beaconGroup.add(beaconLightMesh);

    const beamGeo = new THREE.ConeGeometry(3.6, 15, 24, 1, true);
    beamGeo.rotateZ(Math.PI / 2);
    beamGeo.translate(7.5, 0, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff6b4a,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beaconGroup.add(beamMesh);

    const beaconPointLight = new THREE.PointLight(0xff4433, 1.4, 20);
    beaconGroup.add(beaconPointLight);

    scene.add(beaconGroup);

    // 7. Responsive Window Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // 8. Animation & Physics Render Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      const scrollOffset = scrollY * 0.0014;

      camera.position.x = mouse.x * 0.70;
      camera.position.y = 1.8 + mouse.y * 0.45 - scrollOffset * 0.75;
      camera.lookAt(0, -1.2 - scrollOffset * 0.45, 0);

      // Update surface wave and seabed caustics time uniforms
      waveMaterial.uniforms.uTime.value = elapsedTime;
      floorMaterial.uniforms.uTime.value = elapsedTime;

      // Rotate beacon light sweep across the marine fog
      beaconGroup.rotation.y = elapsedTime * 0.42;
      const pulse = 0.75 + 0.25 * Math.sin(elapsedTime * 3.2);
      beaconLightMat.opacity = 0.75 * pulse;
      beaconPointLight.intensity = 1.2 * pulse;

      // Animate drifting sea-spray mist
      const sArr = sprayGeo.attributes.position.array;
      for (let i = 0; i < sprayCount; i++) {
        sArr[i * 3 + 0] += sprayVelocities[i].x;
        sArr[i * 3 + 1] += sprayVelocities[i].y;
        sArr[i * 3 + 2] += sprayVelocities[i].z;

        if (sArr[i * 3 + 0] > 18) sArr[i * 3 + 0] = -18;
        if (sArr[i * 3 + 1] > 8) sArr[i * 3 + 1] = -2;
        if (sArr[i * 3 + 2] > 10) sArr[i * 3 + 2] = -10;
      }
      sprayGeo.attributes.position.needsUpdate = true;

      // Animate benthic seabed particles
      const bArr = benthicGeo.attributes.position.array;
      for (let i = 0; i < benthicCount; i++) {
        bArr[i * 3 + 0] += benthicVelocities[i].x;
        bArr[i * 3 + 1] += benthicVelocities[i].y;
        bArr[i * 3 + 2] += benthicVelocities[i].z;

        if (bArr[i * 3 + 0] < -22) bArr[i * 3 + 0] = 22;
        if (bArr[i * 3 + 1] > -3.5) bArr[i * 3 + 1] = -7.5;
        if (bArr[i * 3 + 1] < -8.0) bArr[i * 3 + 1] = -4.0;
        if (bArr[i * 3 + 2] > 13) bArr[i * 3 + 2] = -13;
      }
      benthicGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);

      floorGeo.dispose();
      floorMaterial.dispose();
      floorWireMat.dispose();
      waveGeometry.dispose();
      waveMaterial.dispose();
      sprayGeo.dispose();
      sprayMat.dispose();
      benthicGeo.dispose();
      benthicMat.dispose();
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
