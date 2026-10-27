// Inspect frames around 300ms to 700ms
const dtFrame = 1 / 60;
const MAX_SUBSTEP_DT = 0.008;
let current = 0;
let velocity = 0;
let t = 0;

for (let frame = 0; frame <= 45; frame++) {
  const tMs = t * 1000;
  if (tMs >= 300 && tMs <= 700) {
    const disp = Math.abs(current - 100);
    const absV = Math.abs(velocity);
    console.log(`t=${tMs.toFixed(1)}ms: pos=${current.toFixed(4)}, disp=${disp.toFixed(4)}, vel=${velocity.toFixed(4)}, disp<=0.05:${disp<=0.05}, disp<=0.5:${disp<=0.5}, vel<=0.05:${absV<=0.05}, vel<=0.5:${absV<=0.5}`);
  }

  let remaining = dtFrame;
  while (remaining > 0) {
    const dtStep = Math.min(remaining, MAX_SUBSTEP_DT);
    const displacement = current - 100;
    const fSpring = -300 * displacement;
    const fDamp = -30 * velocity;
    const acc = (fSpring + fDamp) / 1;
    velocity += acc * dtStep;
    current += velocity * dtStep;
    remaining -= dtStep;
  }
  t += dtFrame;
}
