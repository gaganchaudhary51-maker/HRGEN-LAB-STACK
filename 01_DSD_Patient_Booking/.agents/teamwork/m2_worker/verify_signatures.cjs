const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../../..');
const springSrc = fs.readFileSync(path.join(baseDir, 'src/components/VitalityAssessment/useSpringValue.ts'), 'utf8');
const gaugeSrc = fs.readFileSync(path.join(baseDir, 'src/components/VitalityAssessment/RadialScoreGauge.tsx'), 'utf8');

const checks = [
  ['useSpringValue exports SpringConfig', springSrc.includes('export interface SpringConfig')],
  ['useSpringValue exports SPRING_PRESETS', springSrc.includes('export const SPRING_PRESETS')],
  ['useSpringValue exports useSpringValue', springSrc.includes('export function useSpringValue')],
  ['useSpringValue substepping logic present', springSrc.includes('MAX_SUBSTEP_DT = 0.008')],
  ['useSpringValue initialValue present', springSrc.includes('initialValue?: number')],
  ['useSpringValue prefers-reduced-motion present', springSrc.includes('prefers-reduced-motion: reduce')],

  ['RadialScoreGauge exports RadialScoreGauge', gaugeSrc.includes('export const RadialScoreGauge')],
  ['RadialScoreGauge exports RadialScoreGaugeProps', gaugeSrc.includes('export interface RadialScoreGaugeProps')],
  ['RadialScoreGauge r=92 geometry', gaugeSrc.includes('RADIUS = 92')],
  ['RadialScoreGauge C=578.053', gaugeSrc.includes('578.053')],
  ['RadialScoreGauge strokeWidth=12', gaugeSrc.includes('STROKE_WIDTH = 12')],
  ['RadialScoreGauge gradients defined', gaugeSrc.includes('grad-optimal') && gaugeSrc.includes('grad-moderate') && gaugeSrc.includes('grad-risk')],
  ['RadialScoreGauge head particle cx/cy projection', gaugeSrc.includes('Math.cos(angleRad)') && gaugeSrc.includes('Math.sin(angleRad)')],
  ['RadialScoreGauge role="meter"', gaugeSrc.includes('role="meter"')],
  ['RadialScoreGauge aria-valuenow', gaugeSrc.includes('aria-valuenow=')],
  ['RadialScoreGauge aria-valuemin="0"', gaugeSrc.includes('aria-valuemin={0}')],
  ['RadialScoreGauge aria-valuemax="100"', gaugeSrc.includes('aria-valuemax={100}')],
  ['RadialScoreGauge aria-live="polite"', gaugeSrc.includes('aria-live="polite"')],
];

let allPassed = true;
for (const [desc, result] of checks) {
  console.log(`[${result ? 'PASS' : 'FAIL'}] ${desc}`);
  if (!result) allPassed = false;
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll component signatures and contracts verified successfully!');
  process.exit(0);
}
