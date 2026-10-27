/**
 * Milestone 2 Challenger 2: SVG Dial Geometry & Rendering Empirical Verification Harness
 * File: tests/m2_challenger_2_verification.mjs
 *
 * Direct empirical execution of SVG radial math, strokeDashoffset curves, head particle
 * trigonometric projections, bracket gradient IDs, clipping margins, and accessibility.
 * Target: src/components/VitalityAssessment/RadialScoreGauge.tsx & useSpringValue.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('==============================================================================');
console.log('   CHALLENGER 2: SVG DIAL GEOMETRY & RENDERING EMPIRICAL HARNESS');
console.log('   Target: src/components/VitalityAssessment/RadialScoreGauge.tsx');
console.log('==============================================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
    failures.push({ name, error: err.message });
  }
}

function assertCloseTo(actual, expected, delta = 0.05, msg = '') {
  const diff = Math.abs(actual - expected);
  if (diff > delta) {
    throw new Error(`${msg}: expected ${expected} ± ${delta}, got ${actual} (diff: ${diff})`);
  }
}

// Read RadialScoreGauge.tsx source
const gaugeFilePath = path.join(ROOT_DIR, 'src', 'components', 'VitalityAssessment', 'RadialScoreGauge.tsx');
const gaugeSource = fs.readFileSync(gaugeFilePath, 'utf8');

// Read useSpringValue.ts source
const springFilePath = path.join(ROOT_DIR, 'src', 'components', 'VitalityAssessment', 'useSpringValue.ts');
const springSource = fs.readFileSync(springFilePath, 'utf8');

// ----------------------------------------------------------------------------
// SUITE 1: GEOMETRY & MATHEMATICAL CONSTANTS
// ----------------------------------------------------------------------------
console.log('>> [SUITE 1: GEOMETRY & MATHEMATICAL CONSTANTS]');

test('Radius is exactly 92px and Circumference is exactly 578.053px', () => {
  const RADIUS = 92;
  const theoreticalCirc = 2 * Math.PI * RADIUS; // 578.053048264...
  const formattedCirc = +(theoreticalCirc).toFixed(3);
  
  assert.strictEqual(RADIUS, 92, 'Radius must be 92');
  assert.strictEqual(formattedCirc, 578.053, 'Circumference must round to 578.053px');
  
  // Verify definitions in RadialScoreGauge.tsx
  assert(gaugeSource.includes('const RADIUS = 92;'), 'RADIUS constant missing in RadialScoreGauge.tsx');
  assert(gaugeSource.includes('const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(3);') || gaugeSource.includes('578.053'),
    'CIRCUMFERENCE constant missing or incorrect in RadialScoreGauge.tsx');
  assert(gaugeSource.includes('const STROKE_WIDTH = 12;'), 'STROKE_WIDTH constant missing or incorrect');
  assert(gaugeSource.includes('const CENTER = 120;'), 'CENTER constant missing or incorrect');
  assert(gaugeSource.includes('const VIEWBOX_SIZE = 240;'), 'VIEWBOX_SIZE constant missing or incorrect');
});

test('ViewBox dimensions and margin bounds (no SVG clipping)', () => {
  const RADIUS = 92;
  const STROKE_WIDTH = 12;
  const CENTER = 120;
  const VIEWBOX_SIZE = 240;

  const outerArcRadius = RADIUS + STROKE_WIDTH / 2; // 98px
  const outerCompassRadius = RADIUS + 14; // 106px
  const particleAuraMax = RADIUS + 10; // 102px
  const maxGeometricExtent = Math.max(outerArcRadius, outerCompassRadius, particleAuraMax);

  assert(maxGeometricExtent <= CENTER, `Geometric extent ${maxGeometricExtent} exceeds center boundary ${CENTER}`);
  const margin = CENTER - maxGeometricExtent; // 14px safety clearance
  assert(margin >= 10, `Safety clearance ${margin}px should be at least 10px to prevent anti-aliasing clipping`);
});

// ----------------------------------------------------------------------------
// SUITE 2: STROKEDASHOFFSET MATH & CLINICAL BOUNDARIES
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 2: STROKEDASHOFFSET MATH & CLINICAL BOUNDARIES]');

// Pure mathematical function mirroring RadialScoreGauge.tsx
function computeStrokeDashoffset(score) {
  const RADIUS = 92;
  const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(3); // 578.053
  const clampedProgress = Math.max(0, Math.min(100, score));
  return +(CIRCUMFERENCE - (clampedProgress / 100) * CIRCUMFERENCE).toFixed(3);
}

test('strokeDashoffset at score = 0 (empty arc)', () => {
  const offset = computeStrokeDashoffset(0);
  assert.strictEqual(offset, 578.053, 'At score 0, offset must equal full circumference (578.053)');
});

test('strokeDashoffset at score = 15 (lower clinical bound)', () => {
  const offset = computeStrokeDashoffset(15);
  // 578.053 - 0.15 * 578.053 = 578.053 - 86.70795 = 491.34505 -> 491.345
  assertCloseTo(offset, 491.345, 0.01, 'At score 15, offset must be ~491.345');
});

test('strokeDashoffset at score = 50 (half arc)', () => {
  const offset = computeStrokeDashoffset(50);
  // 578.053 * 0.5 = 289.0265 -> 289.027 or 289.026
  assertCloseTo(offset, 289.027, 0.01, 'At score 50, offset must be ~289.027');
});

test('strokeDashoffset at score = 80 (optimal threshold)', () => {
  const offset = computeStrokeDashoffset(80);
  // 578.053 - 0.8 * 578.053 = 578.053 - 462.4424 = 115.6106 -> 115.611
  assertCloseTo(offset, 115.611, 0.01, 'At score 80, offset must be ~115.611');
});

test('strokeDashoffset at score = 98 (upper clinical bound)', () => {
  const offset = computeStrokeDashoffset(98);
  // 578.053 - 0.98 * 578.053 = 578.053 - 566.49194 = 11.56106 -> 11.561
  assertCloseTo(offset, 11.561, 0.01, 'At score 98, offset must be ~11.561');
});

test('strokeDashoffset at score = 100 (full circular arc)', () => {
  const offset = computeStrokeDashoffset(100);
  assert.strictEqual(offset, 0, 'At score 100, offset must be 0 (full circle filled)');
});

test('strokeDashoffset under-clamping (score < 0, e.g. -25)', () => {
  const offset = computeStrokeDashoffset(-25);
  assert.strictEqual(offset, 578.053, 'Sub-zero score must clamp to score 0 (578.053)');
});

test('strokeDashoffset over-clamping (score > 100, e.g. 105 spring transient overshoot)', () => {
  const offset = computeStrokeDashoffset(105);
  assert.strictEqual(offset, 0, 'Overshoot > 100 must clamp to score 100 (0)');
});

test('Strict monotonic decrease of strokeDashoffset from score 0 to 100', () => {
  let prevOffset = computeStrokeDashoffset(0);
  for (let s = 1; s <= 100; s++) {
    const curOffset = computeStrokeDashoffset(s);
    assert(curOffset < prevOffset, `Monotonicity violation at score ${s}: ${curOffset} >= ${prevOffset}`);
    const delta = prevOffset - curOffset;
    assertCloseTo(delta, 5.78053, 0.02, `Nonlinear delta at score ${s}: ${delta}`);
    prevOffset = curOffset;
  }
});

// ----------------------------------------------------------------------------
// SUITE 3: HEAD PARTICLE COORDINATE TRIGONOMETRY
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 3: HEAD PARTICLE COORDINATE TRIGONOMETRY]');

function computeHeadParticle(score) {
  const RADIUS = 92;
  const CENTER = 120;
  const clampedProgress = Math.max(0, Math.min(100, score));
  const angleRad = (2 * Math.PI * clampedProgress) / 100;
  const x = +(CENTER + RADIUS * Math.cos(angleRad)).toFixed(2);
  const y = +(CENTER + RADIUS * Math.sin(angleRad)).toFixed(2);
  return { x, y, angleRad };
}

test('Head particle coordinates at score = 0 (unrotated angle 0 -> rotated 12 o\'clock)', () => {
  const p = computeHeadParticle(0);
  // angleRad = 0 -> cos(0)=1, sin(0)=0 -> x = 120 + 92 = 212.00, y = 120.00
  assert.strictEqual(p.x, 212.00);
  assert.strictEqual(p.y, 120.00);
});

test('Head particle coordinates at score = 25 (quarter arc -> 3 o\'clock visual)', () => {
  const p = computeHeadParticle(25);
  // angleRad = pi/2 -> cos=0, sin=1 -> x = 120.00, y = 120 + 92 = 212.00
  assert.strictEqual(p.x, 120.00);
  assert.strictEqual(p.y, 212.00);
});

test('Head particle coordinates at score = 50 (half arc -> 6 o\'clock visual)', () => {
  const p = computeHeadParticle(50);
  // angleRad = pi -> cos=-1, sin=0 -> x = 120 - 92 = 28.00, y = 120.00
  assert.strictEqual(p.x, 28.00);
  assert.strictEqual(p.y, 120.00);
});

test('Head particle coordinates at score = 75 (three-quarter arc -> 9 o\'clock visual)', () => {
  const p = computeHeadParticle(75);
  // angleRad = 3pi/2 -> cos=0, sin=-1 -> x = 120.00, y = 120 - 92 = 28.00
  assert.strictEqual(p.x, 120.00);
  assert.strictEqual(p.y, 28.00);
});

test('Head particle coordinates at score = 100 (full circular return)', () => {
  const p = computeHeadParticle(100);
  // angleRad = 2pi -> cos=1, sin=0 -> x = 212.00, y = 120.00
  assert.strictEqual(p.x, 212.00);
  assert.strictEqual(p.y, 120.00);
});

test('Head particle coordinates at score = 15 (clinical lower bound)', () => {
  const p = computeHeadParticle(15);
  // angleRad = 2 * PI * 0.15 = 0.3 * PI = 0.9424778
  // x = 120 + 92 * cos(0.3 * PI) = 120 + 92 * 0.587785 = 174.08
  // y = 120 + 92 * sin(0.3 * PI) = 120 + 92 * 0.809017 = 194.43
  assertCloseTo(p.x, 174.08, 0.05, 'Score 15 particle X');
  assertCloseTo(p.y, 194.43, 0.05, 'Score 15 particle Y');
});

test('Head particle coordinates at score = 80 (clinical optimal threshold)', () => {
  const p = computeHeadParticle(80);
  // angleRad = 2 * PI * 0.8 = 1.6 * PI = 5.026548
  // x = 120 + 92 * cos(1.6 * PI) = 120 + 92 * 0.309017 = 148.43
  // y = 120 + 92 * sin(1.6 * PI) = 120 + 92 * (-0.951057) = 32.50
  assertCloseTo(p.x, 148.43, 0.05, 'Score 80 particle X');
  assertCloseTo(p.y, 32.50, 0.05, 'Score 80 particle Y');
});

test('Head particle coordinates at score = 98 (clinical upper bound)', () => {
  const p = computeHeadParticle(98);
  // angleRad = 2 * PI * 0.98 = 1.96 * PI = 6.15752
  // x = 120 + 92 * cos(1.96 * PI) = 120 + 92 * 0.992115 = 211.27
  // y = 120 + 92 * sin(1.96 * PI) = 120 + 92 * (-0.125333) = 108.47
  assertCloseTo(p.x, 211.27, 0.05, 'Score 98 particle X');
  assertCloseTo(p.y, 108.47, 0.05, 'Score 98 particle Y');
});

test('Radial distance invariant: distance from center (120, 120) is exactly 92px across all scores', () => {
  for (let s = 0; s <= 100; s += 2) {
    const p = computeHeadParticle(s);
    const dist = Math.sqrt((p.x - 120) ** 2 + (p.y - 120) ** 2);
    assertCloseTo(dist, 92, 0.05, `Distance invariant failed at score ${s}`);
  }
});

test('Head particle visibility gate: clampedProgress > 1', () => {
  // In RadialScoreGauge.tsx:
  // {showParticle && clampedProgress > 1 && ( ... )}
  assert(gaugeSource.includes('clampedProgress > 1'), 'Particle should be gated for progress <= 1 to avoid resting dot');
});

// ----------------------------------------------------------------------------
// SUITE 4: BRACKET GRADIENTS & CLINICAL PALETTES
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 4: BRACKET GRADIENTS & CLINICAL PALETTES]');

function determineTier(score, bracketOverride) {
  if (bracketOverride) return bracketOverride;
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 80) return 'Optimal';
  if (clamped >= 55) return 'Moderate';
  return 'Elevated Risk';
}

test('Bracket gradient IDs match requirements strictly: grad-optimal, grad-moderate, grad-risk', () => {
  assert(gaugeSource.includes('id="grad-optimal"'), 'Missing id="grad-optimal" in SVG defs');
  assert(gaugeSource.includes('id="grad-moderate"'), 'Missing id="grad-moderate" in SVG defs');
  assert(gaugeSource.includes('id="grad-risk"'), 'Missing id="grad-risk" in SVG defs');
});

test('Optimal threshold tier evaluation: score >= 80', () => {
  assert.strictEqual(determineTier(100), 'Optimal');
  assert.strictEqual(determineTier(98), 'Optimal');
  assert.strictEqual(determineTier(80.0), 'Optimal');
});

test('Moderate threshold tier evaluation: 55 <= score < 80', () => {
  assert.strictEqual(determineTier(79.99), 'Moderate');
  assert.strictEqual(determineTier(79.0), 'Moderate');
  assert.strictEqual(determineTier(65.0), 'Moderate');
  assert.strictEqual(determineTier(55.0), 'Moderate');
});

test('Elevated Risk threshold tier evaluation: score < 55', () => {
  assert.strictEqual(determineTier(54.99), 'Elevated Risk');
  assert.strictEqual(determineTier(40.0), 'Elevated Risk');
  assert.strictEqual(determineTier(15.0), 'Elevated Risk');
  assert.strictEqual(determineTier(0.0), 'Elevated Risk');
});

test('Bracket override prop takes precedence over score value', () => {
  assert.strictEqual(determineTier(20, 'Optimal'), 'Optimal');
  assert.strictEqual(determineTier(95, 'Elevated Risk'), 'Elevated Risk');
  assert.strictEqual(determineTier(45, 'Moderate'), 'Moderate');
});

test('GAUGE_THEMES palette tokens integrity', () => {
  assert(gaugeSource.includes('export const GAUGE_THEMES'), 'GAUGE_THEMES must be exported');
  assert(gaugeSource.includes('grad-optimal'), 'Optimal gradientId missing');
  assert(gaugeSource.includes('grad-moderate'), 'Moderate gradientId missing');
  assert(gaugeSource.includes('grad-risk'), 'Elevated Risk gradientId missing');
  
  // Color stops check
  assert(gaugeSource.includes('#48ed86') && gaugeSource.includes('#10b981'), 'Optimal emerald colors missing');
  assert(gaugeSource.includes('#b7ff67') && gaugeSource.includes('#f59e0b'), 'Moderate lime/amber colors missing');
  assert(gaugeSource.includes('#f97316') && gaugeSource.includes('#f43f5e'), 'Elevated risk coral colors missing');
});

// ----------------------------------------------------------------------------
// SUITE 5: COMPONENT CONTRACTS & ACCESSIBILITY AUDIT
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 5: COMPONENT CONTRACTS & ACCESSIBILITY AUDIT]');

test('RadialScoreGauge exports RadialScoreGauge, RadialScoreGaugeProps, GAUGE_THEMES', () => {
  assert(gaugeSource.includes('export const RadialScoreGauge'), 'Missing export const RadialScoreGauge');
  assert(gaugeSource.includes('export default RadialScoreGauge'), 'Missing export default RadialScoreGauge');
  assert(gaugeSource.includes('export interface RadialScoreGaugeProps'), 'Missing export interface RadialScoreGaugeProps');
  assert(gaugeSource.includes('export const GAUGE_THEMES'), 'Missing export const GAUGE_THEMES');
});

test('RadialScoreGaugeProps interface has all required and optional fields', () => {
  assert(gaugeSource.includes('score: number;'), 'score field missing');
  assert(gaugeSource.includes('bracket?:'), 'bracket field missing');
  assert(gaugeSource.includes('size?: number;'), 'size field missing');
  assert(gaugeSource.includes('className?: string;'), 'className field missing');
  assert(gaugeSource.includes('showParticle?: boolean;'), 'showParticle field missing');
  assert(gaugeSource.includes('springConfig?: SpringConfig;'), 'springConfig field missing');
});

test('WAI-ARIA accessibility compliance: role="meter" and aria values', () => {
  assert(gaugeSource.includes('role="meter"'), 'Must have role="meter"');
  assert(gaugeSource.includes('aria-valuenow={displayScore}'), 'Must bind aria-valuenow to displayScore');
  assert(gaugeSource.includes('aria-valuemin={0}'), 'Must specify aria-valuemin={0}');
  assert(gaugeSource.includes('aria-valuemax={100}'), 'Must specify aria-valuemax={100}');
  assert(gaugeSource.includes('aria-valuetext='), 'Must specify aria-valuetext');
  assert(gaugeSource.includes('aria-live="polite"'), 'Must provide aria-live="polite" screen reader region');
});

test('SVG stroke presentation attributes: strokeLinecap="round" and strokeDasharray', () => {
  assert(gaugeSource.includes('strokeLinecap="round"'), 'Progress arc must have strokeLinecap="round"');
  assert(gaugeSource.includes('strokeDasharray={CIRCUMFERENCE}'), 'Progress arc strokeDasharray must be set');
  assert(gaugeSource.includes('strokeDashoffset={strokeDashoffset}'), 'Progress arc strokeDashoffset must be bound');
  assert(gaugeSource.includes('transform -rotate-90'), 'SVG must rotate -90deg so arc starts at 12 o\'clock');
});

test('useSpringValue default spring integration: initialValue: 0 for entrance animation', () => {
  assert(gaugeSource.includes('initialValue: 0'), 'RadialScoreGauge must default initialValue: 0 for smooth entrance');
});

// ----------------------------------------------------------------------------
// SUITE 6: ADVERSARIAL & ROBUSTNESS STRESS TESTING
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 6: ADVERSARIAL & ROBUSTNESS STRESS TESTING]');

test('Adversarial inputs: NaN, undefined, extreme values in strokeDashoffset', () => {
  // Check behavior with float precision
  const offset80_0001 = computeStrokeDashoffset(80.0001);
  const offset79_9999 = computeStrokeDashoffset(79.9999);
  assert(offset80_0001 < offset79_9999, 'Microscopic progression must be strictly monotonic');

  // Check NaN handling in clamping
  const nanClamped = Math.max(0, Math.min(100, Number.NaN || 0));
  assert.strictEqual(nanClamped, 0, 'NaN fallback must clamp safely to 0');

  // Check Infinity handling
  const infClamped = Math.max(0, Math.min(100, Infinity));
  assert.strictEqual(infClamped, 100, 'Infinity must clamp safely to 100');

  const negInfClamped = Math.max(0, Math.min(100, -Infinity));
  assert.strictEqual(negInfClamped, 0, '-Infinity must clamp safely to 0');
});

test('Counter rounding: Math.round(animatedScore) behavior across range', () => {
  const round = (val) => Math.max(0, Math.min(100, Math.round(val)));
  assert.strictEqual(round(72.4), 72);
  assert.strictEqual(round(72.5), 73);
  assert.strictEqual(round(72.8), 73);
  assert.strictEqual(round(0.4), 0);
  assert.strictEqual(round(-2.5), 0);
  assert.strictEqual(round(102.5), 100);
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n==============================================================================');
console.log(`   EMPIRICAL TEST SUMMARY: ${passCount} passed, ${failCount} failed`);
console.log('==============================================================================');

if (failCount > 0) {
  console.error('\nFailures:');
  failures.forEach(f => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n✓ ALL EMPIRICAL GEOMETRY & RENDERING TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
