'use strict';

const MAX_POINTS = 1000;
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

/**
 * Evaluate the configured six-rule Westgard set over a chronological control series.
 * This deterministic helper does not replace laboratory validation of the selected rules.
 * Thresholds use strict exceedance: a result exactly on a limit does not trigger that rule.
 */
function westgardEvaluate(points, target, sd, withinRunZScores = null) {
  if (!Array.isArray(points) || points.length < 1 || points.length > MAX_POINTS ||
      !points.every(finite) || !finite(target) || !finite(sd) || Number(sd) <= 0 ||
      (withinRunZScores !== null && (!Array.isArray(withinRunZScores) || withinRunZScores.length !== 2 || !withinRunZScores.every(finite)))) {
    return { status: 'INVALID', rules: ['INPUT'], points: Array.isArray(points) ? points.length : 0 };
  }

  const xs = points.map(Number);
  const mean = Number(target);
  const sigma = Number(sd);
  const z = xs.map(x => (x - mean) / sigma);
  const last = z.length - 1;
  const warnings = [];
  const rejects = [];
  const absLast = Math.abs(z[last]);

  // 1_2s: one result exceeds +/-2 SD; warning rule only.
  if (absLast > 2) warnings.push('1_2s');
  // 1_3s: one result exceeds +/-3 SD.
  if (absLast > 3) rejects.push('1_3s');
  // 2_2s: the last two consecutive results exceed 2 SD on the same side.
  if (z.length >= 2) {
    const pair = z.slice(-2);
    if (pair.every(v => Math.abs(v) > 2) && Math.sign(pair[0]) === Math.sign(pair[1])) rejects.push('2_2s');
  }
  // R_4s is a within-run rule: only evaluate an explicit same-run pair of standardized z-scores.
  // Never infer it from consecutive days/runs in the historical points series.
  if (withinRunZScores !== null) {
    const pair = withinRunZScores.map(Number);
    // R_4s requires one same-run control result beyond +2 SD and the other beyond -2 SD.
    // A zero score is not an opposite-side violation, even if the pair's distance exceeds 4.
    const oppositeBeyondTwo = (pair[0] > 2 && pair[1] < -2) || (pair[1] > 2 && pair[0] < -2);
    if (oppositeBeyondTwo) rejects.push('R_4s');
  }
  // 4_1s: the last four consecutive results exceed 1 SD on the same side.
  if (z.length >= 4) {
    const tail = z.slice(-4);
    if (tail.every(v => Math.abs(v) > 1) && tail.every(v => Math.sign(v) === Math.sign(tail[0]))) rejects.push('4_1s');
  }
  // 10x: ten consecutive results lie strictly on one side of the target mean.
  if (z.length >= 10) {
    const tail = z.slice(-10);
    if (tail.every(v => v > 0) || tail.every(v => v < 0)) rejects.push('10x');
  }

  const rules = [...new Set([...rejects, ...warnings])];
  return {
    status: rejects.length ? 'FAIL' : warnings.length ? 'WARNING' : 'PASS',
    rules,
    rejectedBy: rejects,
    warnings,
    points: xs.length,
    target: mean,
    sd: sigma,
    zScores: z,
    zLast: z[last],
    withinRunZScores: withinRunZScores === null ? null : withinRunZScores.map(Number),
    policy: 'WESTGARD-6-v1',
    thresholdPolicy: 'strict-exceedance'
  };
}

module.exports = { westgardEvaluate, MAX_POINTS };
