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

// Substepped Euler simulation
const dtFrame = 1 / 60;
const MAX_SUBSTEP_DT = 0.008;
let current = 0;
let velocity = 0;
let t = 0;

for (let frame = 0; frame <= 20; frame++) {
  const ana = analyticalStepResponse(t);
  const diff = Math.abs(current - ana.x);
  console.log(`t=${(t*1000).toFixed(1)}ms: Num=${current.toFixed(2)}, Ana=${ana.x.toFixed(2)}, Diff=${diff.toFixed(2)}`);

  let remaining = dtFrame;
  while (remaining > 0) {
    const dtStep = Math.min(remaining, MAX_SUBSTEP_DT);
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
