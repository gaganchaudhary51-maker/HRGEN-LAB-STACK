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

console.log('Analytical values for k=300, c=30, m=1:');
for (let t = 0; t <= 0.7; t += 0.05) {
  const { x, v } = analyticalStepResponse(t);
  console.log(`t = ${t.toFixed(3)}s (${(t*1000).toFixed(0)}ms): x = ${x.toFixed(4)}, v = ${v.toFixed(4)}, dist_to_100 = ${Math.abs(x - 100).toFixed(4)}`);
}

// Find analytical settle time for different tolerances:
console.log('\nAnalytical settle times:');
for (const tol of [2.0, 1.0, 0.5, 0.1, 0.05, 0.01]) {
  for (let t = 0; t <= 2.0; t += 0.001) {
    const { x, v } = analyticalStepResponse(t);
    if (Math.abs(x - 100) <= tol && Math.abs(v) <= tol) {
      console.log(`Tolerance ${tol} (error ${tol}%): settles at ${(t*1000).toFixed(1)}ms (x=${x.toFixed(4)})`);
      break;
    }
  }
}
