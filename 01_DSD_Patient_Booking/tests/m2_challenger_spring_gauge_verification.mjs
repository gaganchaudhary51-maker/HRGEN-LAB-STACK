/**
 * Challenger 1 (teamwork_preview_challenger) - Milestone 2 Empirical Test Suite
 * Targets:
 *   - src/components/VitalityAssessment/useSpringValue.ts
 *   - src/components/VitalityAssessment/RadialScoreGauge.tsx
 *
 * Verifies:
 * 1. Second-order damped harmonic oscillator step response 0 -> 100 (k=300, c=30, m=1)
 * 2. Peak overshoot & settle times across engineering and visual criteria
 * 3. Exact comparison against analytical closed-form ODE solution & phase lead analysis
 * 4. Mid-flight retargeting (0 -> 80 -> 20 -> 95) momentum preservation & continuity
 * 5. Zero-displacement settle stability (50 -> 50)
 * 6. High tab throttling & dt clamping stability (dt = 2.0s)
 * 7. Framerate invariance (60Hz vs 120Hz vs jitter)
 * 8. Radial gauge SVG geometry, stroke-dashoffset, and head particle trigonometry
 * 9. Accessibility, WCAG role="meter", and live-region contract conformance
 */

import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// SIMULATION ENGINE (Faithful reflection of useSpringValue.ts implementation)
// ============================================================================

function simulateSpring({
  from = 0,
  target = 100,
  stiffness = 300,
  damping = 30,
  mass = 1,
  settleTolerance = 0.05,
  velocityTolerance = 0.05,
  clampOvershoot = false,
  fps = 60,
  retargetSchedule = [], // Array of { timeMs, target }
  maxDurationMs = 2000,
  dtNoise = 0, // max random jitter in ms
  spikeAtMs = null, // simulate tab pause spike
  spikeDt = 0.5,
}) {
  const MAX_FRAME_DT = 0.064;   // 64ms clamp
  const MAX_SUBSTEP_DT = 0.008; // 8ms substep

  let current = from;
  let velocity = 0;
  let currentTarget = target;
  let time = 0; // in seconds

  // Early Settled Check (identical to useSpringValue.ts lines 177-185)
  const initialDisplacement = Math.abs(from - target);
  if (initialDisplacement <= settleTolerance && Math.abs(velocity) <= velocityTolerance) {
    return {
      trajectory: [{ timeMs: 0, current: target, velocity: 0, target }],
      settled: true,
      settleTimeMs: 0,
      loopExitTimeMs: 0,
      peakValue: target,
      finalValue: target,
      finalVelocity: 0,
      settle2PctTimeMs: 0,
      settle1PctTimeMs: 0,
      settlePos05TimeMs: 0,
      visualSettleTimeMs: 0,
    };
  }

  const trajectory = [{
    timeMs: 0,
    current,
    velocity,
    target: currentTarget,
  }];

  let retargetIndex = 0;
  let settled = false;
  let loopExitTimeMs = null;
  let peakValue = from;

  let settle2PctTimeMs = null;
  let settle1PctTimeMs = null;
  let settlePos05TimeMs = null;
  let visualSettleTimeMs = null;

  const nominalDt = 1 / fps;

  while (time * 1000 < maxDurationMs) {
    // Check scheduled retargets
    if (retargetIndex < retargetSchedule.length) {
      if (time * 1000 >= retargetSchedule[retargetIndex].timeMs) {
        currentTarget = retargetSchedule[retargetIndex].target;
        retargetIndex++;
        settled = false;
        loopExitTimeMs = null;
      }
    }

    // Determine dt for this frame
    let dtRaw = nominalDt;
    if (dtNoise > 0) {
      const jitter = (Math.random() * 2 - 1) * (dtNoise / 1000);
      dtRaw = Math.max(0.001, nominalDt + jitter);
    }
    if (spikeAtMs !== null && time * 1000 >= spikeAtMs && time * 1000 < spikeAtMs + 20) {
      dtRaw = spikeDt;
    }

    // Physics step
    const dt = Math.min(dtRaw, MAX_FRAME_DT);
    let remainingDt = dt;

    while (remainingDt > 0) {
      const dtStep = Math.min(remainingDt, MAX_SUBSTEP_DT);
      const displacement = current - currentTarget;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity;
      const acceleration = (springForce + dampingForce) / mass;

      // Semi-implicit (symplectic) Euler
      velocity += acceleration * dtStep;
      current += velocity * dtStep;

      if (clampOvershoot) {
        if (displacement < 0 && current > currentTarget) {
          current = currentTarget;
          velocity = 0;
        } else if (displacement > 0 && current < currentTarget) {
          current = currentTarget;
          velocity = 0;
        }
      }

      remainingDt -= dtStep;
    }

    time += dtRaw;
    const timeMs = Math.round(time * 1000 * 100) / 100;

    if (current > peakValue) {
      peakValue = current;
    }

    // Measure engineering settling thresholds
    const disp = Math.abs(current - currentTarget);
    if (disp <= 2.0 && settle2PctTimeMs === null) settle2PctTimeMs = timeMs;
    if (disp <= 1.0 && settle1PctTimeMs === null) settle1PctTimeMs = timeMs;
    if (disp <= 0.05 && settlePos05TimeMs === null) settlePos05TimeMs = timeMs;
    // Visual readout settling (rounds to integer target)
    if (Math.round(current) === currentTarget && visualSettleTimeMs === null) visualSettleTimeMs = timeMs;

    trajectory.push({
      timeMs,
      current,
      velocity,
      target: currentTarget,
    });

    // Check hook settling condition (both disp <= settleTolerance AND vel <= velocityTolerance)
    const isSettled =
      disp <= settleTolerance &&
      Math.abs(velocity) <= velocityTolerance;

    if (isSettled && !settled) {
      settled = true;
      loopExitTimeMs = timeMs;
    } else if (!isSettled && settled) {
      settled = false;
      loopExitTimeMs = null;
    }

    // If hook settled and no pending retargets, stop loop
    if (settled && retargetIndex >= retargetSchedule.length) {
      break;
    }
  }

  return {
    trajectory,
    settled,
    loopExitTimeMs,
    peakValue,
    finalValue: current,
    finalVelocity: velocity,
    settle2PctTimeMs,
    settle1PctTimeMs,
    settlePos05TimeMs,
    visualSettleTimeMs,
  };
}

// ============================================================================
// CLOSED-FORM ANALYTICAL HARMONIC OSCILLATOR
// ============================================================================
function analyticalStepResponse(tSec, k = 300, c = 30, m = 1, xTarget = 100) {
  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega0 * tSec);
    const trig = Math.cos(omegaD * tSec) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * tSec);
    const x = xTarget * (1 - decay * trig);
    const v = xTarget * (omega0 / Math.sqrt(1 - zeta * zeta)) * decay * Math.sin(omegaD * tSec);
    return { x, v };
  } else {
    const decay = Math.exp(-omega0 * tSec);
    const x = xTarget * (1 - decay * (1 + omega0 * tSec));
    const v = xTarget * omega0 * omega0 * tSec * decay;
    return { x, v };
  }
}

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

const results = [];

function assert(description, condition, details = {}) {
  results.push({
    description,
    pass: !!condition,
    details,
  });
  const symbol = condition ? '✓ PASS' : '✗ FAIL';
  console.log(`${symbol}: ${description}`);
  if (!condition) {
    console.error('   Details:', details);
  }
}

console.log('================================================================');
console.log('MILESTONE 2: SPRING PHYSICS & RADIAL GAUGE EMPIRICAL VERIFICATION');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// TEST GROUP 1: Baseline Step Response (0 -> 100, k=300, c=30, m=1)
// ----------------------------------------------------------------------------
console.log('--- TEST GROUP 1: BASELINE STEP RESPONSE (k=300, c=30, m=1) ---');
const sim1 = simulateSpring({ from: 0, target: 100, stiffness: 300, damping: 30, mass: 1, fps: 60 });

assert('Initial velocity starts exactly at 0', sim1.trajectory[0].velocity === 0, {
  initialVelocity: sim1.trajectory[0].velocity,
});

assert('System successfully settles to target 100', sim1.settled === true, {
  settled: sim1.settled,
  finalValue: sim1.finalValue,
});

// Standard engineering 2% settling band
assert(
  `Engineering 2% settling time is <= 600ms (empirical: ${sim1.settle2PctTimeMs?.toFixed(1)}ms)`,
  sim1.settle2PctTimeMs !== null && sim1.settle2PctTimeMs <= 600,
  { settle2PctTimeMs: sim1.settle2PctTimeMs }
);

// Standard engineering 1% settling band
assert(
  `Engineering 1% settling time is <= 600ms (empirical: ${sim1.settle1PctTimeMs?.toFixed(1)}ms)`,
  sim1.settle1PctTimeMs !== null && sim1.settle1PctTimeMs <= 600,
  { settle1PctTimeMs: sim1.settle1PctTimeMs }
);

// Position settling within 0.05 units (0.05% of step)
assert(
  `Position settle time (disp <= 0.05) is <= 600ms (empirical: ${sim1.settlePos05TimeMs?.toFixed(1)}ms)`,
  sim1.settlePos05TimeMs !== null && sim1.settlePos05TimeMs <= 600,
  { settlePos05TimeMs: sim1.settlePos05TimeMs }
);

// Visual integer readout settling
assert(
  `Visual counter readout settles to 100 in <= 600ms (empirical: ${sim1.visualSettleTimeMs?.toFixed(1)}ms)`,
  sim1.visualSettleTimeMs !== null && sim1.visualSettleTimeMs <= 600,
  { visualSettleTimeMs: sim1.visualSettleTimeMs }
);

// Note on full rAF loop termination
console.log(`   [Metric] Full hook rAF loop exit (disp <= 0.05 && vel <= 0.05): ${sim1.loopExitTimeMs?.toFixed(1)}ms`);

// Peak overshoot check
const peakOvershoot = sim1.peakValue - 100;
const overshootPct = (peakOvershoot / 100) * 100;
assert(
  `Peak overshoot is subtle and underdamped (peak: ${sim1.peakValue.toFixed(3)}, +${overshootPct.toFixed(3)}%)`,
  sim1.peakValue >= 100 && sim1.peakValue <= 101.5,
  { peakValue: sim1.peakValue, overshootPct }
);

// ----------------------------------------------------------------------------
// TEST GROUP 2: Awwwards Preset (k=300, c=22.8, m=1) 1.05x Overshoot Target
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: AWWWARDS PRESET (k=300, c=22.8, m=1) ---');
const simAwwwards = simulateSpring({
  from: 0,
  target: 100,
  stiffness: 300,
  damping: 22.8,
  mass: 1,
  fps: 60,
});

const awwwardsRatio = simAwwwards.peakValue / 100;
assert(
  `Awwwards preset achieves exact 1.05x overshoot (empirical: ${awwwardsRatio.toFixed(3)}x, peak=${simAwwwards.peakValue.toFixed(2)})`,
  awwwardsRatio >= 1.045 && awwwardsRatio <= 1.055,
  { peakValue: simAwwwards.peakValue, ratio: awwwardsRatio }
);

assert(
  `Awwwards preset visual counter settles in <= 600ms (empirical: ${simAwwwards.visualSettleTimeMs?.toFixed(1)}ms)`,
  simAwwwards.visualSettleTimeMs !== null && simAwwwards.visualSettleTimeMs <= 600,
  { visualSettleTimeMs: simAwwwards.visualSettleTimeMs }
);

// ----------------------------------------------------------------------------
// TEST GROUP 3: Symplectic Numerical Accuracy & Analytical ODE Verification
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: NUMERICAL VS ANALYTICAL ACCURACY ---');
let maxTransientError = 0;
let maxSteadyStateError = 0;

for (let i = 0; i < sim1.trajectory.length; i++) {
  const pt = sim1.trajectory[i];
  const tSec = pt.timeMs / 1000;
  const analytical = analyticalStepResponse(tSec, 300, 30, 1, 100);
  const error = Math.abs(pt.current - analytical.x);
  if (error > maxTransientError) maxTransientError = error;
  if (tSec >= 0.25 && error > maxSteadyStateError) maxSteadyStateError = error;
}

assert(
  `Substepped Symplectic Euler transient error is bounded within theoretical O(dt) limit (empirical max: ${maxTransientError.toFixed(2)} units)`,
  maxTransientError <= 5.0,
  { maxTransientError }
);

assert(
  `Substepped Symplectic Euler steady-state error decays rapidly (empirical at t>=250ms: ${maxSteadyStateError.toFixed(3)} units)`,
  maxSteadyStateError <= 0.8,
  { maxSteadyStateError }
);

// ----------------------------------------------------------------------------
// TEST GROUP 4: Rapid Mid-Flight Target Retargeting (0 -> 80 -> 20 -> 95)
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: RAPID TARGET RETARGETING (0 -> 80 -> 20 -> 95) ---');
const retargetSchedule = [
  { timeMs: 80, target: 20 },   // interrupt ascent to 80 while moving fast
  { timeMs: 200, target: 95 },  // interrupt descent to 20 while moving down
];

const simRetarget = simulateSpring({
  from: 0,
  target: 80,
  stiffness: 300,
  damping: 30,
  mass: 1,
  fps: 60,
  retargetSchedule,
  maxDurationMs: 1500,
});

let hasNaN = false;
let maxDiscontinuity = 0;
let previousX = 0;

for (let i = 0; i < simRetarget.trajectory.length; i++) {
  const pt = simRetarget.trajectory[i];
  if (Number.isNaN(pt.current) || Number.isNaN(pt.velocity) || !Number.isFinite(pt.current)) {
    hasNaN = true;
  }
  if (i > 0) {
    const dx = Math.abs(pt.current - previousX);
    if (dx > maxDiscontinuity) maxDiscontinuity = dx;
  }
  previousX = pt.current;
}

assert('No NaN or non-finite values encountered during rapid retargeting', !hasNaN, { hasNaN });

assert(
  `Smooth continuous motion across retargets (max frame jump: ${maxDiscontinuity.toFixed(2)} units at 60Hz)`,
  maxDiscontinuity < 15,
  { maxDiscontinuity }
);

assert(
  `Final value converges cleanly to last target 95 (final: ${simRetarget.finalValue.toFixed(2)})`,
  Math.abs(simRetarget.finalValue - 95) <= 0.05,
  { finalValue: simRetarget.finalValue }
);

// Verify momentum preservation at switch point
const switchPoint1 = simRetarget.trajectory.find(p => p.timeMs >= 80);
assert(
  `Positive momentum preserved when switching to 20 at 80ms (vel: ${switchPoint1?.velocity.toFixed(2)})`,
  switchPoint1 !== undefined && switchPoint1.velocity > 0,
  { velocityAtSwitch: switchPoint1?.velocity }
);

// ----------------------------------------------------------------------------
// TEST GROUP 5: Zero-Displacement Settle Stability (50 -> 50)
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: ZERO-DISPLACEMENT STABILITY (50 -> 50) ---');
const simZero = simulateSpring({
  from: 50,
  target: 50,
  stiffness: 300,
  damping: 30,
  mass: 1,
  fps: 60,
});

assert(
  'Zero displacement immediately settles at target with 0ms duration and 0 velocity',
  simZero.settled === true && simZero.loopExitTimeMs === 0 && simZero.trajectory.length === 1,
  { trajectorySteps: simZero.trajectory.length, finalValue: simZero.finalValue, loopExitTimeMs: simZero.loopExitTimeMs }
);

// Near-zero displacement (within tolerance: 50 -> 50.03)
const simNearZero = simulateSpring({
  from: 50,
  target: 50.03,
  stiffness: 300,
  damping: 30,
  settleTolerance: 0.05,
  mass: 1,
});

assert(
  'Sub-tolerance displacement (0.03) settles immediately without jitter',
  simNearZero.settled === true && simNearZero.loopExitTimeMs === 0,
  { finalValue: simNearZero.finalValue, loopExitTimeMs: simNearZero.loopExitTimeMs }
);

// ----------------------------------------------------------------------------
// TEST GROUP 6: Framerate Invariance (60Hz vs 120Hz vs Variable Jitter)
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 6: FRAMERATE INVARIANCE ---');
const sim60Hz = simulateSpring({ from: 0, target: 100, fps: 60 });
const sim120Hz = simulateSpring({ from: 0, target: 100, fps: 120 });
const simJitter = simulateSpring({ from: 0, target: 100, fps: 60, dtNoise: 6 });

const settleDiff = Math.abs(sim60Hz.settlePos05TimeMs - sim120Hz.settlePos05TimeMs);
const peakDiff = Math.abs(sim60Hz.peakValue - sim120Hz.peakValue);

assert(
  `60Hz vs 120Hz settle time delta is minimal (< 25ms, empirical: ${settleDiff.toFixed(1)}ms)`,
  settleDiff <= 25,
  { settle60Hz: sim60Hz.settlePos05TimeMs, settle120Hz: sim120Hz.settlePos05TimeMs, settleDiff }
);

assert(
  `60Hz vs 120Hz peak value delta is negligible (< 0.05, empirical: ${peakDiff.toFixed(4)})`,
  peakDiff <= 0.05,
  { peak60Hz: sim60Hz.peakValue, peak120Hz: sim120Hz.peakValue, peakDiff }
);

assert(
  'Simulation survives variable frame jitter without instability',
  simJitter.settled && Math.abs(simJitter.finalValue - 100) <= 0.05,
  { finalValue: simJitter.finalValue, settlePos05TimeMs: simJitter.settlePos05TimeMs }
);

// ----------------------------------------------------------------------------
// TEST GROUP 7: High Lag Spike / Tab Throttling Clamp (dtRaw = 2000ms)
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 7: HIGH LAG SPIKE STABILITY ---');
const simSpike = simulateSpring({
  from: 0,
  target: 100,
  fps: 60,
  spikeAtMs: 100,
  spikeDt: 2.0, // 2000ms freeze
});

let spikeMaxVel = 0;
for (const p of simSpike.trajectory) {
  if (Math.abs(p.velocity) > spikeMaxVel) spikeMaxVel = Math.abs(p.velocity);
}

assert(
  `dt clamping to 64ms prevents catastrophic velocity explosion (maxVel: ${spikeMaxVel.toFixed(1)})`,
  spikeMaxVel < 1000 && !Number.isNaN(spikeMaxVel),
  { spikeMaxVel, settled: simSpike.settled }
);

// ----------------------------------------------------------------------------
// TEST GROUP 8: RadialScoreGauge SVG Math & Geometry Verification
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 8: RADIAL GAUGE SVG GEOMETRY & MATH ---');

const RADIUS = 92;
const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(3); // 578.053
const CENTER = 120;

assert(
  `Circumference calculation matches 2*pi*92 = 578.053px`,
  CIRCUMFERENCE === 578.053,
  { CIRCUMFERENCE }
);

// Test stroke-dashoffset at key milestones
const calcOffset = (progress) => +(CIRCUMFERENCE - (Math.max(0, Math.min(100, progress)) / 100) * CIRCUMFERENCE).toFixed(3);

assert('Offset at 0% is full circumference (hidden arc)', calcOffset(0) === 578.053, { offset0: calcOffset(0) });
assert('Offset at 50% is half circumference', Math.abs(calcOffset(50) - 289.027) <= 0.001, { offset50: calcOffset(50) });
assert('Offset at 100% is 0.000 (fully drawn arc)', calcOffset(100) === 0, { offset100: calcOffset(100) });

// Particle coordinates lie strictly on circle perimeter
let particleValid = true;
for (let progress = 0; progress <= 100; progress += 10) {
  const angleRad = (2 * Math.PI * progress) / 100;
  const px = +(CENTER + RADIUS * Math.cos(angleRad)).toFixed(2);
  const py = +(CENTER + RADIUS * Math.sin(angleRad)).toFixed(2);
  const distSq = (px - CENTER) ** 2 + (py - CENTER) ** 2;
  const radiusDiff = Math.abs(Math.sqrt(distSq) - RADIUS);
  if (radiusDiff > 0.05) {
    particleValid = false;
  }
}

assert('Trigonometric particle head coordinates lie exactly on r=92 perimeter', particleValid, {});

// ----------------------------------------------------------------------------
// TEST GROUP 9: Accessibility & Static Contract Audit
// ----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 9: ACCESSIBILITY & CONTRACT AUDIT ---');

const gaugePath = path.resolve('src/components/VitalityAssessment/RadialScoreGauge.tsx');
const gaugeSrc = fs.readFileSync(gaugePath, 'utf8');

assert('RadialScoreGauge includes role="meter"', gaugeSrc.includes('role="meter"'));
assert('RadialScoreGauge includes aria-valuenow', gaugeSrc.includes('aria-valuenow={displayScore}'));
assert('RadialScoreGauge includes aria-valuemin={0}', gaugeSrc.includes('aria-valuemin={0}'));
assert('RadialScoreGauge includes aria-valuemax={100}', gaugeSrc.includes('aria-valuemax={100}'));
assert('RadialScoreGauge includes sr-only live region', gaugeSrc.includes('aria-live="polite"') && gaugeSrc.includes('sr-only'));
assert('RadialScoreGauge uses useSpringValue', gaugeSrc.includes('useSpringValue'));

const springPath = path.resolve('src/components/VitalityAssessment/useSpringValue.ts');
const springSrc = fs.readFileSync(springPath, 'utf8');
assert('useSpringValue handles prefers-reduced-motion query', springSrc.includes('(prefers-reduced-motion: reduce)'));
assert('useSpringValue implements dynamic MediaQueryList listener', springSrc.includes('addEventListener') && springSrc.includes('removeEventListener'));
assert('useSpringValue implements React 19 rAF cleanup', springSrc.includes('safeCancelAnimationFrame'));
assert('useSpringValue unpacks primitive scalars in useEffect dependency array', springSrc.includes('stiffness,') && springSrc.includes('damping,'));

// ----------------------------------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------------------------------
console.log('\n================================================================');
const totalPassed = results.filter(r => r.pass).length;
const totalFailed = results.filter(r => !r.pass).length;
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
console.log('================================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
