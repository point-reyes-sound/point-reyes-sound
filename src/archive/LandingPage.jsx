// ARCHIVED VERSION: Point Reyes Sound - Original 3D Interactive Landing Page
// Preserved for version history and retrieval.
import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./LandingPage.css";

const row1And2 = [
  { num: 1, symbol: "H", name: "Hydrogen", color: "#35ff82", row: 1, radius: 0.53 },
  { num: 2, symbol: "He", name: "Helium", color: "#64c8ff", row: 1, radius: 0.31 },
  { num: 3, symbol: "Li", name: "Lithium", color: "#ff6464", row: 2, radius: 1.67 },
  { num: 4, symbol: "Be", name: "Beryllium", color: "#ff9632", row: 2, radius: 1.12 },
  { num: 5, symbol: "B", name: "Boron", color: "#ffc864", row: 2, radius: 0.87 },
  { num: 6, symbol: "C", name: "Carbon", color: "#c8c8c8", row: 2, radius: 0.67 },
  { num: 7, symbol: "N", name: "Nitrogen", color: "#9696ff", row: 2, radius: 0.56 },
  { num: 8, symbol: "O", name: "Oxygen", color: "#ff6496", row: 2, radius: 0.48 },
  { num: 9, symbol: "F", name: "Fluorine", color: "#c8ff64", row: 2, radius: 0.42 },
  { num: 10, symbol: "Ne", name: "Neon", color: "#64ffc8", row: 2, radius: 0.38 },
];

function NebulousCloud({ color, radius }) {
  const meshRef = useRef();
  
  const [offsets] = useState(() => ({
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: Math.random() * 10
  }));

  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(color) }
  }), [color]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(t * 0.4 + offsets.x) * 0.6;
      meshRef.current.position.y = Math.cos(t * 0.3 + offsets.y) * 0.6;
      meshRef.current.position.z = Math.sin(t * 0.5 + offsets.z) * 0.6;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius * 1.1, 48, 48]} />
      <shaderMaterial
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          varying vec3 vNormal;
          void main() {
            float intensity = dot(vNormal, vec3(0.0, 0.0, 1.0));
            float alpha = pow(max(0.0, intensity), 1.5);
            gl_FragColor = vec4(color, alpha * 0.85);
          }
        `}
      />
    </mesh>
  );
}

export default function LandingPage() {
  const [reactionZone, setReactionZone] = useState([]);

  const handleDragStart = (e, element) => {
    e.dataTransfer.setData("element", JSON.stringify(element));

    const ghostRadius = Math.max(element.radius * 60, 40);
    const ghostDiv = document.createElement("div");
    ghostDiv.style.width = `${ghostRadius}px`;
    ghostDiv.style.height = `${ghostRadius}px`;
    ghostDiv.style.background = `radial-gradient(circle at center, ${element.color} 0%, transparent 70%)`;
    ghostDiv.style.borderRadius = "50%";
    ghostDiv.style.position = "absolute";
    ghostDiv.style.top = "-1000px";
    document.body.appendChild(ghostDiv);

    e.dataTransfer.setDragImage(ghostDiv, ghostRadius / 2, ghostRadius / 2);
    setTimeout(() => document.body.removeChild(ghostDiv), 0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (reactionZone.length >= 2) return; 
    
    const elementData = e.dataTransfer.getData("element");
    if (elementData) {
      const element = JSON.parse(elementData);
      setReactionZone((prev) => [...prev, element]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getPromptMessage = () => {
    if (reactionZone.length === 0) return "Enter an element into the reaction area.";
    if (reactionZone.length === 1) return "Enter another element to create your reaction.";
    return "Simulating QBE Phase-Space Reaction...";
  };

  return (
    <div className="landing-environment terminal-mode">
      <header className="landing-header">
        <div className="kicker">POINT REYES SOUND, Inc.</div>
        <h1>Φ-QUEST INTERACTIVE</h1>
      </header>

      <div className="element-grid">
        {row1And2.map((el) => (
          <div
            key={el.num}
            className={`element-cell row-${el.row}`}
            draggable
            onDragStart={(e) => handleDragStart(e, el)}
            style={{ borderColor: el.color }}
          >
            <div className="phase-space-canvas">
              <Canvas camera={{ position: [0, 0, 4.5] }}>
                <NebulousCloud color={el.color} radius={el.radius} />
              </Canvas>
            </div>
            <div className="element-symbol" style={{ color: el.color, textShadow: `0 0 10px ${el.color}` }}>
              {el.symbol}
            </div>
            <div className="element-name">{el.name}</div>
          </div>
        ))}
      </div>

      <div className="reaction-container">
        <h3 className="prompt-text">{getPromptMessage()}</h3>
        
        <div 
          className={`reaction-zone ${reactionZone.length === 2 ? 'simulating' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {reactionZone.length < 2 ? (
             reactionZone.map((el, idx) => (
              <div key={idx} className="chamber-element">
                <div className="phase-space-canvas">
                  <Canvas camera={{ position: [0, 0, 4.5] }}>
                    <NebulousCloud color={el.color} radius={el.radius * 1.5} />
                  </Canvas>
                </div>
              </div>
            ))
          ) : (
            <div className="simulation-viewport">
              <div className="mock-simulation">
                <span className="sim-text">
                  [ Phase-Space Transport Active: {reactionZone[0].symbol} + {reactionZone[1].symbol} ]
                </span>
              </div>
            </div>
          )}
        </div>
        
        {reactionZone.length > 0 && (
          <button className="reset-btn" onClick={() => setReactionZone([])}>
            Clear Chamber
          </button>
        )}
      </div>
    </div>
  );
}
