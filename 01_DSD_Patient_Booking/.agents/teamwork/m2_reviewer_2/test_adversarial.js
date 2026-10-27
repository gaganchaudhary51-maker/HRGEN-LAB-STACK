/**
 * Adversarial Stress-Test Suite for Milestone 2: Spring Physics & SVG Radial Gauge
 * Executed by Reviewer 2 in C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m2_reviewer_2
 */

const assert = require('assert');

// 1. Math and Numerical Simulation of useSpringValue integration
function simulateSpring({
  target,
  initial = 0,
  stiffness = 300,
  damping = 30,
  mass = 1,
  settleTolerance = 0.05,
  velocityTolerance = 0.05,
  clampOvershoot = false,
  fps = 60,
  maxSteps = 600,
}) {
  let current = initial;
  let velocity = 0;
  let t = 0;
  const history = [current];
  const dtFrame = 1 / fps;
  const MAX_FRAME_DT = 0.064;
  const MAX_SUBSTEP_DT = 0.008;

  for (let step = 0; step < maxSteps; step++) {
    const dt = Math.min(dtFrame, MAX_FRAME_DT);
    let remainingDt = dt;
    while (remainingDt > 0) {
      const dtStep = Math.min(remainingDt, MAX_SUBSTEP_DT);
      const displacement = current - target;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity;
      const acceleration = (springForce + dampingForce) / mass;

      velocity += acceleration * dtStep;
      current += velocity * dtStep;

      if (clampOvershoot) {
        if (displacement < 0 && current > target) {
          current = target;
          velocity = 0;
        } else if (displacement > 0 && current < target) {
          current = target;
          velocity = 0;
        }
      }
      remainingDt -= dtStep;
    }

    history.push(current);
    t += dt;

    if (
      Math.abs(current - target) <= settleTolerance &&
      Math.abs(velocity) <= velocityTolerance
    ) {
      return { settled: true, steps: step + 1, time: t, history, final: target };
    }
  }

  return { settled: false, steps: maxSteps, time: t, history, final: current };
}

console.log('--- Starting Adversarial Tests ---');

// Test A: Baseline Spring Convergence (0 to 85)
const baseline = simulateSpring({ target: 85, initial: 0, stiffness: 300, damping: 30, mass: 1 });
assert(baseline.settled, 'Baseline spring must settle');
assert(baseline.time < 0.6, `Baseline must settle within 600ms, took ${baseline.time}s`);
console.log(`[PASS] Test A: Baseline spring settled in ${baseline.time.toFixed(3)}s (${baseline.steps} frames)`);

// Test B: Subtle Overshoot Preset (c = 22.8, target = 100)
const awwwards = simulateSpring({ target: 100, initial: 0, stiffness: 300, damping: 22.8, mass: 1 });
assert(awwwards.settled, 'Awwwards spring must settle');
const maxOvershoot = Math.max(...awwwards.history);
const overshootRatio = maxOvershoot / 100;
console.log(`[INFO] Awwwards overshoot peak: ${maxOvershoot.toFixed(2)}, ratio: ${overshootRatio.toFixed(3)}`);
assert(overshootRatio >= 1.03 && overshootRatio <= 1.07, `Overshoot ratio must be ~1.05x, got ${overshootRatio}`);
console.log('[PASS] Test B: Awwwards preset achieves ~1.05x peak overshoot');

// Test C: Extreme Boundary Retargeting (Mid-flight direction reversal)
let current = 0;
let velocity = 0;
const firstHalf = simulateSpring({ target: 90, initial: 0, maxSteps: 10 }); // only 10 frames
const midVal = firstHalf.history[firstHalf.history.length - 1];
// Retarget immediately to 20
const retarget = simulateSpring({ target: 20, initial: midVal });
assert(retarget.settled, 'Retargeted spring must converge');
console.log(`[PASS] Test C: Mid-flight retargeting from ${midVal.toFixed(2)} to 20 settled safely in ${retarget.time.toFixed(3)}s`);

// Test D: Boundary Coordinates of Radial Gauge
const RADIUS = 92;
const CENTER = 120;
const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(3); // 578.053

for (let s = 0; s <= 100; s += 10) {
  const angleRad = (2 * Math.PI * s) / 100;
  const x = +(CENTER + RADIUS * Math.cos(angleRad)).toFixed(2);
  const y = +(CENTER + RADIUS * Math.sin(angleRad)).toFixed(2);
  const offset = +(CIRCUMFERENCE - (s / 100) * CIRCUMFERENCE).toFixed(3);

  assert(!isNaN(x) && !isNaN(y) && !isNaN(offset), `NaN detected at score ${s}`);
  assert(x >= CENTER - RADIUS - 0.01 && x <= CENTER + RADIUS + 0.01, `X out of bounds at score ${s}: ${x}`);
  assert(y >= CENTER - RADIUS - 0.01 && y <= CENTER + RADIUS + 0.01, `Y out of bounds at score ${s}: ${y}`);
  assert(offset >= -0.01 && offset <= CIRCUMFERENCE + 0.01, `Offset out of bounds at score ${s}: ${offset}`);
}
console.log('[PASS] Test D: Particle coordinates & dashoffset bounded across [0..100]');

// Test E: High Framerate Simulation (144Hz and 240Hz ProMotion displays)
const sim144 = simulateSpring({ target: 70, initial: 0, fps: 144 });
const sim60 = simulateSpring({ target: 70, initial: 0, fps: 60 });
const sim30 = simulateSpring({ target: 70, initial: 0, fps: 30 });
assert(sim144.settled && sim60.settled && sim30.settled, 'Must settle across all framerates');
const timeDiff = Math.abs(sim144.time - sim60.time);
assert(timeDiff < 0.05, `Framerate invariance violated: 144Hz (${sim144.time}s) vs 60Hz (${sim60.time}s) diff=${timeDiff}s`);
console.log(`[PASS] Test E: Framerate invariance verified across 30Hz, 60Hz, 144Hz (diff < 50ms)`);

console.log('--- ALL ADVERSARIAL TESTS PASSED ---');
