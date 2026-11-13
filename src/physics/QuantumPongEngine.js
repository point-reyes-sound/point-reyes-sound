/**
 * QuantumPongEngine.js
 * Shared phase-space physics engine for Q-BECK Quantum Pong
 * Used by both the Three.js renderer and the automated playtester agent.
 */

export const PONG_BOUNDS = {
  xMin: -4.65,
  xMax: 4.65,
  zMin: -2.55,
  zMax: 2.55,
  gateX: 4.25,
  gateCaptureRadius: 1.04,
  holeDeathRadius: 0.52,
  holePullRadius: 1.65,
  maxSpeed: 0.088,
  minSpeed: 0.034,
};

export function createInitialPongState(seed = 0.35) {
  return {
    time: 0,
    puck: { x: -2.6, z: seed, vx: 0.052, vz: 0.022 },
    gate: { side: 1, z: 0.0, cooldown: 0 },
    hole: { x: 0.0, z: 0.0 },
    score: 0,
    graceFrames: 75,
    collapsed: false,
    won: false,
  };
}

export function applyPerturbation(state, clickX, clickZ) {
  if (state.collapsed || state.won) return { deflected: false, dist: 99 };

  const dx = state.puck.x - clickX;
  const dz = state.puck.z - clickZ;
  const dist = Math.hypot(dx, dz) + 0.3;

  // Smooth inverse-square phase-space gradient impulse with generous human-friendly falloff
  const force = Math.min(0.085, 0.19 / (dist * dist + 0.45));
  state.puck.vx += (dx / dist) * force;
  state.puck.vz += (dz / dist) * force;

  const speed = Math.hypot(state.puck.vx, state.puck.vz);
  if (speed > PONG_BOUNDS.maxSpeed) {
    state.puck.vx = (state.puck.vx / speed) * PONG_BOUNDS.maxSpeed;
    state.puck.vz = (state.puck.vz / speed) * PONG_BOUNDS.maxSpeed;
  }

  return { deflected: dist < 2.4, dist };
}

export function stepQuantumPong(
  state,
  { bondStretch = 1.85, targetResonances = 5, level = 1, dt = 0.018 } = {}
) {
  state.time += dt;
  if (state.gate.cooldown > 0) state.gate.cooldown -= 1;
  if (state.graceFrames > 0) state.graceFrames -= 1;

  const stretchNorm = (bondStretch - 0.8) / (3.2 - 0.8);
  const levelScale = 1 + Math.min(4, level - 1) * 0.12;

  // Orbiting Decoherence Hole
  state.hole.x = Math.sin(state.time * 0.36 * levelScale) * 1.35;
  state.hole.z = Math.cos(state.time * 0.48 * levelScale) * 0.92;

  if (state.collapsed || state.won) {
    return { event: null, holeDanger: 0 };
  }

  // Gravitational pull near the decoherence hole
  const hdx = state.hole.x - state.puck.x;
  const hdz = state.hole.z - state.puck.z;
  const hDist = Math.hypot(hdx, hdz);
  const holeDanger = Math.max(0, Math.min(1, (1.8 - hDist) / 1.25));

  if (state.graceFrames === 0 && hDist < PONG_BOUNDS.holePullRadius && hDist > 0.05) {
    const pull = (0.00075 * levelScale) / (hDist * hDist + 0.45);
    state.puck.vx += (hdx / hDist) * pull;
    state.puck.vz += (hdz / hDist) * pull;
  }

  // Death check: puck falls into the decoherence hole (after grace period)
  if (state.graceFrames === 0 && hDist < PONG_BOUNDS.holeDeathRadius) {
    state.collapsed = true;
    return { event: "collapse", x: state.hole.x, z: state.hole.z, holeDanger: 1 };
  }

  // Gentle viscous damping so clicks feel deliberate & controllable
  state.puck.vx *= 0.996;
  state.puck.vz *= 0.996;

  // Subtle quantum dispersion jitter
  state.puck.vx += Math.sin(state.time * 2.1 + state.puck.z) * 0.00042 * (0.4 + stretchNorm);
  state.puck.vz += Math.cos(state.time * 1.9 + state.puck.x) * 0.00042 * (0.4 + stretchNorm);

  // Maintain minimum lively momentum so puck never stalls
  const spd = Math.hypot(state.puck.vx, state.puck.vz);
  if (spd > 0.0001 && spd < PONG_BOUNDS.minSpeed) {
    state.puck.vx = (state.puck.vx / spd) * PONG_BOUNDS.minSpeed;
    state.puck.vz = (state.puck.vz / spd) * PONG_BOUNDS.minSpeed;
  } else if (spd > PONG_BOUNDS.maxSpeed) {
    state.puck.vx = (state.puck.vx / spd) * PONG_BOUNDS.maxSpeed;
    state.puck.vz = (state.puck.vz / spd) * PONG_BOUNDS.maxSpeed;
  }

  state.puck.x += state.puck.vx;
  state.puck.z += state.puck.vz;

  // Top / Bottom momentum reflection
  if (state.puck.z > PONG_BOUNDS.zMax) {
    state.puck.z = PONG_BOUNDS.zMax;
    state.puck.vz = -Math.abs(state.puck.vz);
  } else if (state.puck.z < PONG_BOUNDS.zMin) {
    state.puck.z = PONG_BOUNDS.zMin;
    state.puck.vz = Math.abs(state.puck.vz);
  }

  // Check Target Resonance Gate capture
  const gateX = state.gate.side * PONG_BOUNDS.gateX;
  if (
    state.gate.cooldown === 0 &&
    Math.hypot(state.puck.x - gateX, state.puck.z - state.gate.z) < PONG_BOUNDS.gateCaptureRadius
  ) {
    state.score += 1;
    const scoredX = gateX;
    const scoredZ = state.gate.z;
    state.gate.side *= -1;
    // Keep next gate comfortably away from corners
    state.gate.z = (Math.random() - 0.5) * 3.0;
    state.gate.cooldown = 32;
    state.puck.vx = -state.puck.vx * 1.03;

    if (state.score >= targetResonances) {
      state.won = true;
      return { event: "win", x: scoredX, z: scoredZ, holeDanger };
    }
    return { event: "score", x: scoredX, z: scoredZ, holeDanger };
  }

  // Left / Right wall reflection
  if (state.puck.x > PONG_BOUNDS.xMax) {
    state.puck.x = PONG_BOUNDS.xMax;
    state.puck.vx = -Math.abs(state.puck.vx);
  } else if (state.puck.x < PONG_BOUNDS.xMin) {
    state.puck.x = PONG_BOUNDS.xMin;
    state.puck.vx = Math.abs(state.puck.vx);
  }

  return { event: null, holeDanger };
}

/**
 * Steering agent policy: computes an optimal perturbation click (x, z) to guide the puck
 * toward the active crimson gate while curving around the black decoherence hole.
 */
export function computeAgentClick(state, jitter = 0) {
  const gateX = state.gate.side * PONG_BOUNDS.gateX;
  const gateZ = state.gate.z;

  // Desired direction from puck to gate
  let tx = gateX - state.puck.x;
  let tz = gateZ - state.puck.z;
  const tLen = Math.hypot(tx, tz) || 1;
  tx /= tLen;
  tz /= tLen;

  // Repulsion from the decoherence hole if puck is anywhere near it
  const hdx = state.puck.x - state.hole.x;
  const hdz = state.puck.z - state.hole.z;
  const hDist = Math.hypot(hdx, hdz) || 0.1;
  if (hDist < 2.6) {
    const avoidWeight = (2.6 - hDist) * 1.4;
    tx += (hdx / hDist) * avoidWeight;
    tz += (hdz / hDist) * avoidWeight;
    const nLen = Math.hypot(tx, tz) || 1;
    tx /= nLen;
    tz /= nLen;
  }

  // Click behind the puck opposite the desired velocity vector
  const clickDist = 0.85;
  const cx = state.puck.x - tx * clickDist + (Math.random() - 0.5) * jitter;
  const cz = state.puck.z - tz * clickDist + (Math.random() - 0.5) * jitter;
  return { x: cx, z: cz };
}
