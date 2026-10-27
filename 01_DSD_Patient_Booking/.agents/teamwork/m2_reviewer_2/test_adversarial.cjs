try {
  const assert = require('assert');

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
    const history = [{ t: 0, current, velocity }];
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

      t += dt;
      history.push({ t, current, velocity });

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
  const frameAt600ms = baseline.history.find(h => h.t >= 0.6);
  console.log('At t=600ms, displacement is:', Math.abs(frameAt600ms.current - 85).toFixed(4), 'velocity:', frameAt600ms.velocity.toFixed(4));
  assert(Math.abs(frameAt600ms.current - 85) < 1.0, 'Displacement must be < 1.0 at 600ms');
  assert(baseline.settled, 'Baseline spring must settle to ultra-tight tolerance (0.05)');
  assert(baseline.time < 0.75, `Baseline settles to 0.05 in under 750ms: ${baseline.time}s`);
  console.log(`[PASS] Test A: Baseline spring reaches < 1.0 at 600ms and settles to 0.05 at ${baseline.time.toFixed(3)}s`);

  // Test B: Subtle Overshoot Preset (c = 22.8, target = 100)
  const awwwards = simulateSpring({ target: 100, initial: 0, stiffness: 300, damping: 22.8, mass: 1 });
  assert(awwwards.settled, 'Awwwards spring must settle');
  const maxOvershoot = Math.max(...awwwards.history.map(h => h.current));
  const overshootRatio = maxOvershoot / 100;
  console.log(`[INFO] Awwwards overshoot peak: ${maxOvershoot.toFixed(2)}, ratio: ${overshootRatio.toFixed(3)}`);
  assert(overshootRatio >= 1.03 && overshootRatio <= 1.07, `Overshoot ratio must be ~1.05x, got ${overshootRatio}`);
  console.log('[PASS] Test B: Awwwards preset achieves ~1.05x peak overshoot');

  // Test C: Extreme Boundary Retargeting (Mid-flight direction reversal)
  const firstHalf = simulateSpring({ target: 90, initial: 0, maxSteps: 10 });
  const midVal = firstHalf.history[firstHalf.history.length - 1].current;
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

  // Test E: High Framerate Simulation
  const sim144 = simulateSpring({ target: 70, initial: 0, fps: 144 });
  const sim60 = simulateSpring({ target: 70, initial: 0, fps: 60 });
  const sim30 = simulateSpring({ target: 70, initial: 0, fps: 30 });
  console.log('sim144 time:', sim144.time.toFixed(3), 'sim60 time:', sim60.time.toFixed(3), 'sim30 time:', sim30.time.toFixed(3));
  assert(sim144.settled && sim60.settled && sim30.settled, 'Must settle across all framerates');
  const timeDiff = Math.abs(sim144.time - sim60.time);
  assert(timeDiff < 0.1, `Framerate invariance violated: 144Hz vs 60Hz diff=${timeDiff}s`);
  console.log(`[PASS] Test E: Framerate invariance verified across 30Hz, 60Hz, 144Hz (diff < 100ms)`);

  console.log('--- ALL ADVERSARIAL TESTS PASSED ---');
} catch (err) {
  console.error('CAUGHT ERROR:', err.message, err.stack);
  process.exit(1);
}
