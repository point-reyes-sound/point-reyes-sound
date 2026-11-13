import {
  createInitialPongState,
  applyPerturbation,
  stepQuantumPong,
  computeAgentClick,
} from "../src/physics/QuantumPongEngine.js";

function runCohort(name, { episodes = 150, clickEveryFrames = 14, jitter = 0.25, level = 1, idle = false }) {
  let wins = 0;
  let collapses = 0;
  let timeouts = 0;
  let totalWinFrames = 0;
  let totalClicksOnWin = 0;

  for (let ep = 0; ep < episodes; ep++) {
    const state = createInitialPongState((Math.random() - 0.5) * 1.4);
    let clicks = 0;
    const maxFrames = 60 * 60; // 60 seconds at 60 FPS

    for (let f = 0; f < maxFrames; f++) {
      if (!idle && f % clickEveryFrames === 0) {
        // Only click if puck isn't already headed cleanly into the gate
        const gateX = state.gate.side * 4.25;
        const toGateX = gateX - state.puck.x;
        const toGateZ = state.gate.z - state.puck.z;
        const dot = state.puck.vx * toGateX + state.puck.vz * toGateZ;
        if (dot <= 0 || f % (clickEveryFrames * 2) === 0) {
          const { x, z } = computeAgentClick(state, jitter);
          applyPerturbation(state, x, z);
          clicks += 1;
        }
      }

      const { event } = stepQuantumPong(state, { bondStretch: 1.85, targetResonances: 5, level });
      if (event === "win") {
        wins += 1;
        totalWinFrames += f;
        totalClicksOnWin += clicks;
        break;
      }
      if (f === maxFrames - 1) {
        timeouts += 1;
      }
    }
  }

  const avgWinSec = wins > 0 ? (totalWinFrames / wins / 60).toFixed(1) : "N/A";
  const avgClicks = wins > 0 ? (totalClicksOnWin / wins).toFixed(1) : "N/A";
  console.log(
    `[${name}] Win: ${((wins / episodes) * 100).toFixed(1)}% | Collapse: ${((collapses / episodes) * 100).toFixed(1)}% | Timeout: ${((timeouts / episodes) * 100).toFixed(1)}% | Avg Win Time: ${avgWinSec}s | Avg Clicks: ${avgClicks}`
  );
}

runCohort("Skilled Human L1 (220ms, low jitter)", { clickEveryFrames: 13, jitter: 0.18, level: 1 });
runCohort("Casual Human L1 (330ms, med jitter)", { clickEveryFrames: 20, jitter: 0.45, level: 1 });
runCohort("Casual Human L3 (330ms, med jitter)", { clickEveryFrames: 20, jitter: 0.45, level: 3 });
runCohort("Idle Baseline (no clicks)", { idle: true, level: 1 });

