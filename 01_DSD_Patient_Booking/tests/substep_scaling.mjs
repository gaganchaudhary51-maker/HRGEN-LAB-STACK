import fs from 'node:fs';

function analyticalStepResponse(tSec, k = 300, c = 30, m = 1, xTarget = 100) {
  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
  const decay = Math.exp(-zeta * omega0 * tSec);
  const trig = Math.cos(omegaD * tSec) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * tSec);
  const x = xTarget * (1 - decay * trig);
  const v = xTarget * (omega0 / Math.sqrt(1 - zeta * zeta)) * decay * Math.sin(omegaD * tSec);
  return { x, v };
}

for (const substep of [0.008, 0.002, 0.0005]) {
  let current = 0;
  let velocity = 0;
  let t = 0;
  let maxDiff = 0;
  const dtFrame = 1 / 60;

  for (let frame = 0; frame <= 20; frame++) {
    const ana = analyticalStepResponse(t);
    const diff = Math.abs(current - ana.x);
    if (diff > maxDiff) maxDiff = diff;

    let remaining = dtFrame;
    while (remaining > 0) {
      const dtStep = Math.min(remaining, substep);
      const disp = current - 100;
      const fSpring = -300 * disp;
      const fDamp = -30 * velocity;
      const acc = (fSpring + fDamp) / 1;
      velocity += acc * dtStep;
      current += velocity * dtStep;
      remaining -= dtStep;
    }
    t += dtFrame;
  }
  console.log(`Substep ${substep}s: Max Diff vs Analytical = ${maxDiff.toFixed(3)}`);
}
