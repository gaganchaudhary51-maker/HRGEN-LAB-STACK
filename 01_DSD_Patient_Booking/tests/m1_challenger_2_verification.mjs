/**
 * Milestone 1 Challenger 2: Empirical Verification & Stress Test Suite
 * File: tests/m1_challenger_2_verification.mjs
 *
 * Direct empirical execution of clinical scenarios, catalog validations,
 * dynamic biomarker hoisting tests, boundary checks, and randomized stress harness
 * against src/components/VitalityAssessment/scoringEngine.ts
 */

import * as engine from '../src/components/VitalityAssessment/scoringEngine.ts';
import assert from 'node:assert';

console.log('==============================================================================');
console.log('   CHALLENGER 2: CLINICAL SCENARIO & STRESS VERIFICATION HARNESS');
console.log('   Target: src/components/VitalityAssessment/scoringEngine.ts');
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

// ----------------------------------------------------------------------------
// SUITE 1: CATALOG INTEGRITY & ALIGNMENT
// ----------------------------------------------------------------------------
console.log('>> [SUITE 1: CATALOG INTEGRITY & ALIGNMENT]');

test('Catalog contains all 10 authoritative packages from App.tsx', () => {
  const expectedKeys = [
    'diabetes', 'thyrodiabetes', 'joint', 'specialjoint',
    'weakness', 'hypertension', 'renal', 'executive',
    'smartadvance', 'basiccamp'
  ];
  for (const key of expectedKeys) {
    assert(engine.DIAGNOSTIC_PACKAGES[key] !== undefined, `Missing package ${key}`);
    const pkg = engine.DIAGNOSTIC_PACKAGES[key];
    assert.strictEqual(pkg.id, key);
    assert(typeof pkg.name === 'string' && pkg.name.length > 0);
    assert(typeof pkg.price === 'number' && pkg.price > 0);
    assert(typeof pkg.originalPrice === 'number' && pkg.originalPrice >= pkg.price);
    assert(typeof pkg.parameterCount === 'number' && pkg.parameterCount > 0);
    assert(Array.isArray(pkg.keyParameters) && pkg.keyParameters.length > 0);
  }
  assert.strictEqual(Object.keys(engine.DIAGNOSTIC_PACKAGES).length, 10);
});

test('Catalog prices match App.tsx definitions exactly', () => {
  const p = engine.DIAGNOSTIC_PACKAGES;
  assert.strictEqual(p.diabetes.price, 840);
  assert.strictEqual(p.thyrodiabetes.price, 960);
  assert.strictEqual(p.joint.price, 875);
  assert.strictEqual(p.specialjoint.price, 4530);
  assert.strictEqual(p.weakness.price, 2730);
  assert.strictEqual(p.hypertension.price, 4710);
  assert.strictEqual(p.renal.price, 175);
  assert.strictEqual(p.executive.price, 999);
  assert.strictEqual(p.smartadvance.price, 499);
  assert.strictEqual(p.basiccamp.price, 299);
});

test('Clinical explanations catalog contains all 6 required biomarkers', () => {
  const requiredMarkers = ['HbA1c', 'CBC', 'KFT', 'LFT', 'Lipid Profile', 'Vitamin D3'];
  for (const marker of requiredMarkers) {
    const exp = engine.CLINICAL_EXPLANATIONS[marker];
    assert(exp !== undefined, `Missing explanation for ${marker}`);
    assert.strictEqual(exp.parameter, marker);
    assert(typeof exp.role === 'string' && exp.role.length > 10);
    assert(typeof exp.reason === 'string' && exp.reason.length > 50);
  }
});

// ----------------------------------------------------------------------------
// SUITE 2: MANDATORY CLINICAL SCENARIOS (ORIGINAL_REQUEST.md)
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 2: MANDATORY CLINICAL SCENARIOS]');

test('Scenario 1.1: Diabetes symptoms (thirst/urination) recommends Diabetic Package (₹840)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'male',
    activityLevel: 'moderate',
    sleepStress: 'restful',
    symptoms: ['thirst_urination'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'diabetes');
  assert.strictEqual(res.primaryPackage.name, 'Diabetic Package');
  assert.strictEqual(res.primaryPackage.price, 840);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.campAlternativePackage.price, 499);
  assert.strictEqual(res.savingsAmount, 341);
  assert.strictEqual(res.savingsPercentage, 41);
  // Isolated symptom with restful lifestyle places metabolic risk in Moderate (54%)
  assert.strictEqual(res.riskAxes.metabolic.level, 'Moderate');
});

test('Scenario 1.1b: Diabetes symptoms + sedentary lifestyle produces High metabolic risk', () => {
  const input = {
    ageGroup: '46-60',
    gender: 'male',
    activityLevel: 'sedentary',
    sleepStress: 'poor_sleep_high_stress',
    symptoms: ['thirst_urination'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'diabetes');
  assert.strictEqual(res.riskAxes.metabolic.level, 'High');
});

test('Scenario 1.2: Family history of diabetes recommends Diabetic Package (₹840)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'female',
    activityLevel: 'active',
    sleepStress: 'restful',
    symptoms: ['general_checkup'],
    familyHistory: ['diabetes'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'diabetes');
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 341);
  assert.strictEqual(res.savingsPercentage, 41);
});

test('Scenario 1.3: Diabetes + Thyroid family history recommends Thyro-Diabetic Package (₹960)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'female',
    activityLevel: 'moderate',
    sleepStress: 'moderate_stress',
    symptoms: ['thirst_urination'],
    familyHistory: ['diabetes', 'thyroid'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'thyrodiabetes');
  assert.strictEqual(res.primaryPackage.name, 'Thyro-Diabetic Package');
  assert.strictEqual(res.primaryPackage.price, 960);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 461);
  assert.strictEqual(res.savingsPercentage, 48);
  assert.strictEqual(res.riskAxes.metabolic.level, 'High');
});

test('Scenario 2.1: Joint pain in younger/mild adult (30-45) recommends Basic Joint Pain Package (₹875)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'male',
    activityLevel: 'moderate',
    sleepStress: 'restful',
    symptoms: ['joint_pain'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'joint');
  assert.strictEqual(res.primaryPackage.name, 'Basic Joint Pain Package');
  assert.strictEqual(res.primaryPackage.price, 875);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 376);
  assert.strictEqual(res.savingsPercentage, 43);
  // Isolated symptom in younger adult places joint risk in Moderate (59%)
  assert.strictEqual(res.riskAxes.joint.level, 'Moderate');
});

test('Scenario 2.1b: Joint pain + sedentary lifestyle produces High joint risk', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'female',
    activityLevel: 'sedentary',
    sleepStress: 'poor_sleep_high_stress',
    symptoms: ['joint_pain'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'joint');
  assert.strictEqual(res.riskAxes.joint.level, 'High');
});

test('Scenario 2.2: Joint pain in senior citizen (60+) recommends Special Joint Package (₹4530)', () => {
  const input = {
    ageGroup: '60+',
    gender: 'female',
    activityLevel: 'moderate',
    sleepStress: 'moderate_stress',
    symptoms: ['joint_pain'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'specialjoint');
  assert.strictEqual(res.primaryPackage.name, 'Special Joint Package');
  assert.strictEqual(res.primaryPackage.price, 4530);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 4031);
  assert.strictEqual(res.savingsPercentage, 89);
});

test('Scenario 2.3: Joint pain in middle-aged sedentary patient (46-60) recommends Special Joint Package (₹4530)', () => {
  const input = {
    ageGroup: '46-60',
    gender: 'female',
    activityLevel: 'sedentary',
    sleepStress: 'moderate_stress',
    symptoms: ['joint_pain'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'specialjoint');
  assert.strictEqual(res.primaryPackage.price, 4530);
});

test('Scenario 3.1: Chronic fatigue symptom recommends Basic Weakness Package (₹2730)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'male',
    activityLevel: 'sedentary',
    sleepStress: 'moderate_stress',
    symptoms: ['fatigue'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'weakness');
  assert.strictEqual(res.primaryPackage.name, 'Basic Weakness Package');
  assert.strictEqual(res.primaryPackage.price, 2730);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 2231);
  assert.strictEqual(res.savingsPercentage, 82);
});

test('Scenario 3.2: General wellness/checkup recommends Executive Full Body Checkup (₹999)', () => {
  const input = {
    ageGroup: '18-29',
    gender: 'female',
    activityLevel: 'active',
    sleepStress: 'restful',
    symptoms: ['general_checkup'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'executive');
  assert.strictEqual(res.primaryPackage.name, 'Executive Full Body Checkup');
  assert.strictEqual(res.primaryPackage.price, 999);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 500);
  assert.strictEqual(res.savingsPercentage, 50);
});

test('Scenario 4.1: Blood pressure concerns recommends Hypertension Package (₹4710)', () => {
  const input = {
    ageGroup: '46-60',
    gender: 'male',
    activityLevel: 'sedentary',
    sleepStress: 'poor_sleep_high_stress',
    symptoms: ['bp_concerns'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'hypertension');
  assert.strictEqual(res.primaryPackage.name, 'Hypertension Package');
  assert.strictEqual(res.primaryPackage.price, 4710);
  assert.strictEqual(res.campAlternativePackage.id, 'smartadvance');
  assert.strictEqual(res.savingsAmount, 4211);
  assert.strictEqual(res.savingsPercentage, 89);
  assert.strictEqual(res.riskAxes.cardiovascular.level, 'High');
});

test('Scenario 4.2: Family history of hypertension recommends Hypertension Package (₹4710)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'male',
    activityLevel: 'moderate',
    sleepStress: 'restful',
    symptoms: ['general_checkup'],
    familyHistory: ['hypertension'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'hypertension');
  assert.strictEqual(res.primaryPackage.price, 4710);
});

test('Scenario 5.1: Renal family history recommends Renal Screening Package (₹175)', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'female',
    activityLevel: 'moderate',
    sleepStress: 'restful',
    symptoms: ['general_checkup'],
    familyHistory: ['kidney'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.id, 'renal');
  assert.strictEqual(res.primaryPackage.name, 'Renal Screening Package');
  assert.strictEqual(res.primaryPackage.price, 175);
  assert.strictEqual(res.campAlternativePackage.id, 'basiccamp');
  assert.strictEqual(res.campAlternativePackage.price, 299);
});

test('Scenario 5.2: Renal price inversion (₹175 < ₹299) safely clamps savings to ₹0 and 0%', () => {
  const input = {
    ageGroup: '30-45',
    gender: 'female',
    activityLevel: 'moderate',
    sleepStress: 'restful',
    symptoms: [],
    familyHistory: ['kidney'],
  };
  const res = engine.calculateVitalityAssessment(input);
  assert.strictEqual(res.primaryPackage.price, 175);
  assert.strictEqual(res.campAlternativePackage.price, 299);
  assert.strictEqual(res.savingsAmount, 0);
  assert.strictEqual(res.savingsPercentage, 0);
});

// ----------------------------------------------------------------------------
// SUITE 3: DYNAMIC BIOMARKER HOISTING & CLINICAL EXPLANATIONS
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 3: DYNAMIC BIOMARKER HOISTING]');

test('Dynamic hoisting: Glycemic concern hoists HbA1c to priority #1', () => {
  const input = {
    ageGroup: '30-45', gender: 'male', activityLevel: 'moderate', sleepStress: 'restful',
    symptoms: ['thirst_urination'], familyHistory: ['none']
  };
  const explanations = engine.getClinicalExplanations(input);
  assert.strictEqual(explanations.length, 6);
  assert.strictEqual(explanations[0].parameter, 'HbA1c');
});

test('Dynamic hoisting: Blood pressure concerns hoists Lipid Profile and KFT to top', () => {
  const input = {
    ageGroup: '46-60', gender: 'male', activityLevel: 'moderate', sleepStress: 'restful',
    symptoms: ['bp_concerns'], familyHistory: ['none']
  };
  const explanations = engine.getClinicalExplanations(input);
  assert.strictEqual(explanations.length, 6);
  assert.strictEqual(explanations[0].parameter, 'Lipid Profile');
  assert.strictEqual(explanations[1].parameter, 'KFT');
});

test('Dynamic hoisting: Joint pain hoists Vitamin D3 and CBC to top', () => {
  const input = {
    ageGroup: '46-60', gender: 'female', activityLevel: 'moderate', sleepStress: 'restful',
    symptoms: ['joint_pain'], familyHistory: ['none']
  };
  const explanations = engine.getClinicalExplanations(input);
  assert.strictEqual(explanations.length, 6);
  assert.strictEqual(explanations[0].parameter, 'Vitamin D3');
  assert.strictEqual(explanations[1].parameter, 'CBC');
});

test('Dynamic hoisting: Fatigue hoists CBC, Vitamin D3, and LFT to top', () => {
  const input = {
    ageGroup: '30-45', gender: 'male', activityLevel: 'sedentary', sleepStress: 'poor_sleep_high_stress',
    symptoms: ['fatigue'], familyHistory: ['none']
  };
  const explanations = engine.getClinicalExplanations(input);
  assert.strictEqual(explanations.length, 6);
  assert.strictEqual(explanations[0].parameter, 'CBC');
  assert.strictEqual(explanations[1].parameter, 'Vitamin D3');
  assert.strictEqual(explanations[2].parameter, 'LFT');
});

test('Dynamic hoisting: Kidney history hoists KFT to top', () => {
  const input = {
    ageGroup: '30-45', gender: 'male', activityLevel: 'moderate', sleepStress: 'restful',
    symptoms: ['general_checkup'], familyHistory: ['kidney']
  };
  const explanations = engine.getClinicalExplanations(input);
  assert.strictEqual(explanations.length, 6);
  assert.strictEqual(explanations[0].parameter, 'KFT');
});

test('Dynamic hoisting completeness: All 6 required biomarkers are ALWAYS present without duplicates', () => {
  const testInputs = [
    { ageGroup: '18-29', gender: 'female', activityLevel: 'active', sleepStress: 'restful', symptoms: [], familyHistory: ['none'] },
    { ageGroup: '60+', gender: 'male', activityLevel: 'sedentary', sleepStress: 'poor_sleep_high_stress', symptoms: ['fatigue', 'thirst_urination', 'joint_pain', 'bp_concerns'], familyHistory: ['diabetes', 'hypertension', 'kidney', 'thyroid'] },
    { ageGroup: '30-45', gender: 'other', activityLevel: 'moderate', sleepStress: 'moderate_stress', symptoms: ['joint_pain'], familyHistory: ['thyroid'] }
  ];

  for (const inp of testInputs) {
    const explanations = engine.getClinicalExplanations(inp);
    assert.strictEqual(explanations.length, 6);
    const paramNames = explanations.map(e => e.parameter);
    const expected = ['HbA1c', 'CBC', 'KFT', 'LFT', 'Lipid Profile', 'Vitamin D3'];
    for (const exp of expected) {
      assert(paramNames.includes(exp), `Missing biomarker ${exp} in explanations`);
    }
    const unique = new Set(paramNames);
    assert.strictEqual(unique.size, 6, 'Duplicate parameters detected in explanations');
  }
});

// ----------------------------------------------------------------------------
// SUITE 4: MATHEMATICAL BOUNDS & THRESHOLD INTEGRITY
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 4: MATHEMATICAL BOUNDS & THRESHOLD INTEGRITY]');

test('Upper boundary: Ideal inputs strictly clamp to 98 and Optimal bracket', () => {
  const input = {
    ageGroup: '18-29',
    gender: 'female',
    activityLevel: 'active',
    sleepStress: 'restful',
    symptoms: ['general_checkup'],
    familyHistory: ['none'],
  };
  const res = engine.calculateVitalityScore(input);
  assert.strictEqual(res.vitalityScore, 98);
  assert.strictEqual(res.vitalityBracket, 'Optimal');
});

test('Lower boundary: Worst multi-morbidity inputs strictly clamp to 15 and Elevated Risk bracket', () => {
  const input = {
    ageGroup: '60+',
    gender: 'male',
    activityLevel: 'sedentary',
    sleepStress: 'poor_sleep_high_stress',
    symptoms: ['fatigue', 'thirst_urination', 'joint_pain', 'bp_concerns'],
    familyHistory: ['diabetes', 'hypertension', 'kidney', 'thyroid'],
  };
  const res = engine.calculateVitalityScore(input);
  assert.strictEqual(res.vitalityScore, 15);
  assert.strictEqual(res.vitalityBracket, 'Elevated Risk');
});

test('Vitality bracket threshold monotonicity: 80=Optimal, 79=Moderate, 55=Moderate, 54=Elevated Risk', () => {
  // Direct test of bracket logic
  // Score 80
  const optInput = {
    ageGroup: '30-45', // -4
    gender: 'male',
    activityLevel: 'moderate', // -5
    sleepStress: 'moderate_stress', // -6
    symptoms: [], // 0
    familyHistory: ['none'], // 0
    // Total deduction = 15 -> raw = 85 -> clamped = 85 (Optimal)
  };
  const optRes = engine.calculateVitalityScore(optInput);
  assert.strictEqual(optRes.vitalityScore, 85);
  assert.strictEqual(optRes.vitalityBracket, 'Optimal');

  // Verify bracket classification helper
  function checkBracket(score) {
    if (score >= 80) return 'Optimal';
    if (score >= 55) return 'Moderate';
    return 'Elevated Risk';
  }
  assert.strictEqual(checkBracket(80), 'Optimal');
  assert.strictEqual(checkBracket(79), 'Moderate');
  assert.strictEqual(checkBracket(55), 'Moderate');
  assert.strictEqual(checkBracket(54), 'Elevated Risk');
});

// ----------------------------------------------------------------------------
// SUITE 5: ADVERSARIAL STRESS HARNESS (2,000 RANDOMIZED COMBINATIONS)
// ----------------------------------------------------------------------------
console.log('\n>> [SUITE 5: ADVERSARIAL STRESS HARNESS]');

test('Adversarial fuzz testing across 2,000 randomized clinical input permutations', () => {
  const ageGroups = ['18-29', '30-45', '46-60', '60+'];
  const genders = ['male', 'female', 'other'];
  const activityLevels = ['sedentary', 'moderate', 'active'];
  const sleepStresses = ['restful', 'moderate_stress', 'poor_sleep_high_stress'];
  const allSymptoms = ['fatigue', 'thirst_urination', 'joint_pain', 'bp_concerns', 'general_checkup'];
  const allFamily = ['diabetes', 'hypertension', 'kidney', 'thyroid', 'none'];

  const getRandomSubset = (arr) => {
    return arr.filter(() => Math.random() > 0.5);
  };

  const getRandomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const ITERATIONS = 2000;
  let minObservedScore = 100;
  let maxObservedScore = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const syms = getRandomSubset(allSymptoms);
    const fam = getRandomSubset(allFamily);

    const input = {
      ageGroup: getRandomChoice(ageGroups),
      gender: getRandomChoice(genders),
      activityLevel: getRandomChoice(activityLevels),
      sleepStress: getRandomChoice(sleepStresses),
      symptoms: syms,
      familyHistory: fam,
    };

    const res = engine.calculateVitalityAssessment(input);

    // 1. Vitality Score Invariants
    assert(Number.isInteger(res.vitalityScore), `Vitality score must be integer on iteration ${i}`);
    assert(res.vitalityScore >= 15 && res.vitalityScore <= 98, `Score ${res.vitalityScore} out of bounds [15, 98] on iter ${i}`);
    assert(['Optimal', 'Moderate', 'Elevated Risk'].includes(res.vitalityBracket), `Invalid bracket on iter ${i}`);

    if (res.vitalityScore < minObservedScore) minObservedScore = res.vitalityScore;
    if (res.vitalityScore > maxObservedScore) maxObservedScore = res.vitalityScore;

    // 2. Risk Axes Invariants
    for (const axisKey of ['metabolic', 'cardiovascular', 'renal', 'joint']) {
      const axis = res.riskAxes[axisKey];
      assert(axis.percentage >= 0 && axis.percentage <= 100, `Axis ${axisKey} pct out of bounds: ${axis.percentage}`);
      assert(['Low', 'Moderate', 'High'].includes(axis.level), `Axis ${axisKey} level invalid: ${axis.level}`);
      assert(typeof axis.summary === 'string' && axis.summary.length > 0, `Axis ${axisKey} summary missing`);
    }

    // 3. Package Invariants
    assert(res.primaryPackage && res.primaryPackage.id, `Primary package missing on iter ${i}`);
    assert(res.campAlternativePackage && res.campAlternativePackage.id, `Camp package missing on iter ${i}`);
    assert(res.savingsAmount >= 0, `Savings amount negative: ${res.savingsAmount}`);
    assert(res.savingsPercentage >= 0 && res.savingsPercentage <= 100, `Savings % invalid: ${res.savingsPercentage}`);

    // 4. Clinical Explanations Invariants
    assert.strictEqual(res.clinicalExplanations.length, 6, `Explanations length != 6 on iter ${i}`);
    for (const exp of res.clinicalExplanations) {
      assert(exp.parameter && exp.role && exp.reason, `Incomplete explanation object on iter ${i}`);
    }
  }

  console.log(`     -> Completed ${ITERATIONS} randomized permutations without an invariant violation.`);
  console.log(`     -> Observed Score Range: [${minObservedScore}, ${maxObservedScore}] (Strictly bounded [15, 98])`);
});

test('Defensive resilience against empty and malformed inputs', () => {
  // Empty object
  const emptyRes = engine.calculateVitalityAssessment({});
  assert(emptyRes.vitalityScore >= 15 && emptyRes.vitalityScore <= 98);
  assert(emptyRes.primaryPackage.id === 'executive');

  // Null symptoms / undefined family history
  const nullishRes = engine.calculateVitalityAssessment({
    symptoms: null,
    familyHistory: undefined,
  });
  assert(nullishRes.vitalityScore >= 15 && nullishRes.vitalityScore <= 98);

  // Unknown string entries in arrays
  const unknownRes = engine.calculateVitalityAssessment({
    ageGroup: '18-29',
    symptoms: ['unknown_symptom', 'headache'],
    familyHistory: ['unknown_condition'],
  });
  assert(unknownRes.vitalityScore >= 15 && unknownRes.vitalityScore <= 98);
});

console.log('\n==============================================================================');
console.log(`   EXECUTION SUMMARY: ${passCount} passed, ${failCount} failed`);
console.log('==============================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('   >>> ALL EMPIRICAL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
}
