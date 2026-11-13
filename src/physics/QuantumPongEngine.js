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
  gateCaptureRadius: 1.06,
  maxSpeed: 0.088,
  minSpeed: 0.036,
};

export function createInitialPongState(seed = 0.35) {
  return {
    time: 0,
    puck: { x: -2.6, z: seed, vx: 0.052, vz: 0.022 },
    gate: { side: 1, z: 0.0, cooldown: 0 },
    score: 0,
    won: false,
  };
}

export function applyPerturbation(state, clickX, clickZ) {
  if (state.won) return { deflected: false, dist: 99 };

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

  const stretchNorm = (bondStretch - 0.8) / (3.2 - 0.8);
  const levelScale = 1 + Math.min(4, level - 1) * 0.12;

  if (state.won) {
    return { event: null };
  }

  // Gentle viscous damping so clicks feel deliberate & controllable
  state.puck.vx *= 0.996;
  state.puck.vz *= 0.996;

  // Subtle quantum dispersion jitter (scales gently with level)
  const dispAmp = 0.00042 * (0.4 + stretchNorm) * levelScale;
  state.puck.vx += Math.sin(state.time * 2.1 + state.puck.z) * dispAmp;
  state.puck.vz += Math.cos(state.time * 1.9 + state.puck.x) * dispAmp;

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

  // Left / Right side-wall reflection
  if (state.puck.z > PONG_BOUNDS.zMax) {
    state.puck.z = PONG_BOUNDS.zMax;
    state.puck.vz = -Math.abs(state.puck.vz);
  } else if (state.puck.z < PONG_BOUNDS.zMin) {
    state.puck.z = PONG_BOUNDS.zMin;
    state.puck.vz = Math.abs(state.puck.vz);
  }

  // Check Target Resonance Gate capture on the far wall (+X)
  const gateX = state.gate.side * PONG_BOUNDS.gateX;
  if (
    state.gate.cooldown === 0 &&
    Math.hypot(state.puck.x - gateX, state.puck.z - state.gate.z) < PONG_BOUNDS.gateCaptureRadius
  ) {
    state.score += 1;
    const scoredX = gateX;
    const scoredZ = state.gate.z;
    // Keep the hoop on the far wall the user is facing, shifting along Z
    state.gate.side = 1;
    state.gate.z = (Math.random() - 0.5) * 3.4;
    state.gate.cooldown = 36;
    state.puck.vx = -Math.abs(state.puck.vx) * 1.04;

    if (state.score >= targetResonances) {
      state.won = true;
      return { event: "win", x: scoredX, z: scoredZ };
    }
    return { event: "score", x: scoredX, z: scoredZ };
  }

  // Far / Near wall reflection
  if (state.puck.x > PONG_BOUNDS.xMax) {
    state.puck.x = PONG_BOUNDS.xMax;
    state.puck.vx = -Math.abs(state.puck.vx);
  } else if (state.puck.x < PONG_BOUNDS.xMin) {
    state.puck.x = PONG_BOUNDS.xMin;
    state.puck.vx = Math.abs(state.puck.vx);
  }

  return { event: null };
}

/**
 * Steering agent policy: computes an optimal perturbation click (x, z) to guide the puck
 * toward the crimson hoop on the far wall.
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

  // Click behind the puck opposite the desired velocity vector
  const clickDist = 0.85;
  const cx = state.puck.x - tx * clickDist + (Math.random() - 0.5) * jitter;
  const cz = state.puck.z - tz * clickDist + (Math.random() - 0.5) * jitter;
  return { x: cx, z: cz };
}
