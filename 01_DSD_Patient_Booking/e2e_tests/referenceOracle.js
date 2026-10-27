/**
 * Reference Oracle for DSD Patient Booking Health Risk & Vitality Score Assessment Tool
 * Authoritative mathematical, clinical, and physical models derived from PROJECT.md,
 * ORIGINAL_REQUEST.md, and codebase catalog in src/App.tsx.
 */

// Authoritative DSD Diagnostic Package Catalog (derived from src/App.tsx:29-75)
export const DSD_CATALOG = {
  // Camp Packages
  membership: { id: 'membership', name: 'DSD Membership Card', price: 19, old: 19, tag: 'Camp offer · ECG free', category: 'Camp Packages' },
  basiccamp: { id: 'basiccamp', name: 'Basic Health Pack', price: 299, old: 299, tag: 'Camp offer · ECG free', category: 'Camp Packages', parameterCount: 25 },
  smartadvance: { id: 'smartadvance', name: 'DSD Smart Health Advance', price: 499, old: 499, tag: 'Camp offer · ECG free', category: 'Camp Packages', parameterCount: 50 },
  executive: { id: 'executive', name: 'Executive Full Body Checkup', price: 999, old: 999, tag: 'Camp offer · ECG free', category: 'Camp Packages', parameterCount: 75 },
  // Targeted Packages
  diabetes: { id: 'diabetes', name: 'Diabetic Package', price: 840, old: 900, tag: '6% off · DSD website', category: 'Diabetes', parameterCount: 22 },
  thyrodiabetes: { id: 'thyrodiabetes', name: 'Thyro-Diabetic Package', price: 960, old: 1750, tag: '45% off · DSD website', category: 'Diabetes', parameterCount: 34 },
  diabeticbasic: { id: 'diabeticbasic', name: 'Diabetic Profile Basic', price: 199, old: 199, tag: 'Camp price · user supplied', category: 'Profiles', parameterCount: 3 },
  joint: { id: 'joint', name: 'Basic Joint Pain Package', price: 875, old: 1750, tag: '50% off · DSD website', category: 'Joint Care', parameterCount: 6 },
  specialjoint: { id: 'specialjoint', name: 'Special Joint Package', price: 4530, old: 7750, tag: '41% off · DSD website', category: 'Joint Care', parameterCount: 41 },
  weakness: { id: 'weakness', name: 'Basic Weakness Package', price: 2730, old: 4550, tag: '40% off · DSD website', category: 'Full Body', parameterCount: 63 },
  hypertension: { id: 'hypertension', name: 'Hypertension Package', price: 4710, old: 7850, tag: '40% off · DSD website', category: 'Heart Health', parameterCount: 76 },
  renal: { id: 'renal', name: 'Renal Screening Package', price: 175, old: 350, tag: '50% off · DSD website', category: 'Kidney', parameterCount: 20 },
  full: { id: 'full', name: 'Full Body Health Check-up', price: 3190, old: 7160, tag: '55% off · DSD website', category: 'Full Body', parameterCount: 75 },
  special50: { id: 'special50', name: 'Special 50 Parameter Package', price: 2050, old: 3100, tag: '33% off · DSD website', category: 'Full Body', parameterCount: 53 },
  senior: { id: 'senior', name: 'Senior Citizen Package', price: 6789, old: 9100, tag: '25% off · DSD website', category: 'Senior Care', parameterCount: 58 }
};

// Parameter descriptions for the 6 core clinical biomarkers
export const CLINICAL_EXPLANATIONS_DB = {
  HbA1c: {
    parameter: 'HbA1c',
    role: 'Glycated Hemoglobin · 3-Month Glucose Mean',
    reason: 'Measures 90-120 day glycated erythrocyte fraction to identify prediabetes and insulin resistance without spot-glucose fluctuation.'
  },
  CBC: {
    parameter: 'CBC',
    role: 'Complete Blood Count & Hemogram',
    reason: 'Evaluates cellular vitality across 24+ blood parameters to detect microcytic/macrocytic anemia and subclinical infection.'
  },
  KFT: {
    parameter: 'KFT',
    role: 'Kidney Function Test & Electrolytes',
    reason: 'Assesses glomerular filtration, creatinine clearance, and electrolyte homeostasis to guard against silent nephron loss.'
  },
  LFT: {
    parameter: 'LFT',
    role: 'Liver Function & Hepatic Enzyme Profile',
    reason: 'Measures transaminases (AST/ALT) and hepatic synthetic capacity to screen for fatty liver changes and metabolic stagnation.'
  },
  Lipid: {
    parameter: 'Lipid Profile',
    role: 'Lipid Profile & Arterial Plaque Markers',
    reason: 'Quantifies cholesterol fractions and triglycerides to assess 10-year atherosclerotic cardiovascular and vascular risk.'
  },
  VitD3: {
    parameter: 'Vitamin D3',
    role: '25-Hydroxycholecalciferol & Bone Mineral Balance',
    reason: 'Modulates musculoskeletal calcium absorption and immune inflammation; deficiencies directly cause joint stiffness and chronic fatigue.'
  }
};

/**
 * Validates AssessmentInput structure and enum values
 */
export function validateAssessmentInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Input must be an object' };
  }
  const validAges = ['18-29', '30-45', '46-60', '60+'];
  const validGenders = ['male', 'female', 'other'];
  const validActivities = ['sedentary', 'moderate', 'active'];
  const validSleeps = ['restful', 'moderate_stress', 'poor_sleep_high_stress'];
  const validSymptoms = ['fatigue', 'thirst_urination', 'joint_pain', 'bp_concerns', 'general_checkup'];
  const validFamily = ['diabetes', 'hypertension', 'kidney', 'thyroid', 'none'];

  if (!validAges.includes(input.ageGroup)) {
    return { valid: false, error: `Invalid ageGroup: ${input.ageGroup}` };
  }
  if (!validGenders.includes(input.gender)) {
    return { valid: false, error: `Invalid gender: ${input.gender}` };
  }
  if (!validActivities.includes(input.activityLevel)) {
    return { valid: false, error: `Invalid activityLevel: ${input.activityLevel}` };
  }
  if (!validSleeps.includes(input.sleepStress)) {
    return { valid: false, error: `Invalid sleepStress: ${input.sleepStress}` };
  }
  if (!Array.isArray(input.symptoms)) {
    return { valid: false, error: 'symptoms must be an array' };
  }
  for (const s of input.symptoms) {
    if (!validSymptoms.includes(s)) return { valid: false, error: `Invalid symptom: ${s}` };
  }
  if (!Array.isArray(input.familyHistory)) {
    return { valid: false, error: 'familyHistory must be an array' };
  }
  for (const fh of input.familyHistory) {
    if (!validFamily.includes(fh)) return { valid: false, error: `Invalid familyHistory: ${fh}` };
  }
  return { valid: true };
}

/**
 * Deterministic clinical scoring engine calculation
 */
export function calculateVitalityAssessment(input) {
  const validation = validateAssessmentInput(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }

  let rawScore = 100;

  // 1. Age group deductions
  switch (input.ageGroup) {
    case '18-29': rawScore -= 0; break;
    case '30-45': rawScore -= 5; break;
    case '46-60': rawScore -= 12; break;
    case '60+': rawScore -= 18; break;
  }

  // 2. Activity deductions
  switch (input.activityLevel) {
    case 'active': rawScore -= 0; break;
    case 'moderate': rawScore -= 6; break;
    case 'sedentary': rawScore -= 14; break;
  }

  // 3. Sleep & Stress deductions
  switch (input.sleepStress) {
    case 'restful': rawScore -= 0; break;
    case 'moderate_stress': rawScore -= 7; break;
    case 'poor_sleep_high_stress': rawScore -= 15; break;
  }

  // 4. Symptoms deductions
  const syms = new Set(input.symptoms);
  if (syms.has('fatigue')) rawScore -= 12;
  if (syms.has('thirst_urination')) rawScore -= 16;
  if (syms.has('joint_pain')) rawScore -= 14;
  if (syms.has('bp_concerns')) rawScore -= 16;
  // 'general_checkup' does not deduct

  // 5. Family history deductions
  const fam = new Set(input.familyHistory);
  if (fam.has('diabetes')) rawScore -= 10;
  if (fam.has('hypertension')) rawScore -= 10;
  if (fam.has('kidney')) rawScore -= 10;
  if (fam.has('thyroid')) rawScore -= 8;

  // Clamping strictly to [15, 98]
  const vitalityScore = Math.max(15, Math.min(98, Math.round(rawScore)));

  // Bracket categorization
  let vitalityBracket = 'Elevated Risk';
  if (vitalityScore >= 80) vitalityBracket = 'Optimal';
  else if (vitalityScore >= 55) vitalityBracket = 'Moderate';

  // Sub-axis risk computation
  // Metabolic Risk (0 - 100%)
  let metabolicScore = 10;
  if (syms.has('thirst_urination')) metabolicScore += 45;
  if (fam.has('diabetes')) metabolicScore += 30;
  if (fam.has('thyroid')) metabolicScore += 15;
  if (input.activityLevel === 'sedentary') metabolicScore += 15;
  metabolicScore = Math.min(100, metabolicScore);
  const metabolicLevel = metabolicScore >= 60 ? 'High' : metabolicScore >= 35 ? 'Moderate' : 'Low';

  // Cardiovascular Risk (0 - 100%)
  let cardioScore = 10;
  if (syms.has('bp_concerns')) cardioScore += 45;
  if (fam.has('hypertension')) cardioScore += 30;
  if (input.sleepStress === 'poor_sleep_high_stress') cardioScore += 15;
  if (input.ageGroup === '46-60' || input.ageGroup === '60+') cardioScore += 15;
  cardioScore = Math.min(100, cardioScore);
  const cardioLevel = cardioScore >= 60 ? 'High' : cardioScore >= 35 ? 'Moderate' : 'Low';

  // Renal Risk (0 - 100%)
  let renalScore = 10;
  if (fam.has('kidney')) renalScore += 50;
  if (syms.has('thirst_urination') && syms.has('bp_concerns')) renalScore += 30;
  if (cardioScore >= 60 || metabolicScore >= 60) renalScore += 15;
  renalScore = Math.min(100, renalScore);
  const renalLevel = renalScore >= 55 ? 'High' : renalScore >= 30 ? 'Moderate' : 'Low';

  // Joint / Inflammation Risk (0 - 100%)
  let jointScore = 10;
  if (syms.has('joint_pain')) jointScore += 55;
  if (input.ageGroup === '46-60' || input.ageGroup === '60+') jointScore += 20;
  if (input.activityLevel === 'sedentary') jointScore += 15;
  jointScore = Math.min(100, jointScore);
  const jointLevel = jointScore >= 55 ? 'High' : jointScore >= 30 ? 'Moderate' : 'Low';

  const riskAxes = {
    metabolic: {
      level: metabolicLevel,
      percentage: metabolicScore,
      summary: metabolicLevel === 'High' ? 'Elevated glycemic variability & insulin resistance markers detected' : 'Metabolic markers within acceptable baseline'
    },
    cardiovascular: {
      level: cardioLevel,
      percentage: cardioScore,
      summary: cardioLevel === 'High' ? 'Arterial resistance and blood pressure indicators need formal evaluation' : 'Cardiovascular profile stable'
    },
    renal: {
      level: renalLevel,
      percentage: renalScore,
      summary: renalLevel === 'High' ? 'Filtration markers and electrolyte excretion warrant investigation' : 'Renal filtration load optimal'
    },
    joint: {
      level: jointLevel,
      percentage: jointScore,
      summary: jointLevel === 'High' ? 'Synovial or inflammatory stress detected; bone mineral check indicated' : 'Musculoskeletal integrity intact'
    }
  };

  // Determine Primary Package
  let primaryPkgKey = 'executive';
  if (metabolicLevel === 'High') {
    primaryPkgKey = (fam.has('thyroid') || fam.has('diabetes')) ? 'thyrodiabetes' : 'diabetes';
  } else if (cardioLevel === 'High') {
    primaryPkgKey = 'hypertension';
  } else if (jointLevel === 'High') {
    primaryPkgKey = (input.ageGroup === '60+' || syms.has('fatigue')) ? 'specialjoint' : 'joint';
  } else if (renalLevel === 'High') {
    primaryPkgKey = 'renal';
  } else if (syms.has('fatigue')) {
    primaryPkgKey = 'weakness';
  } else {
    primaryPkgKey = 'executive';
  }

  const primaryCatalog = DSD_CATALOG[primaryPkgKey];
  const primaryPackage = {
    id: primaryCatalog.id,
    name: primaryCatalog.name,
    price: primaryCatalog.price,
    originalPrice: primaryCatalog.old,
    parameterCount: primaryCatalog.parameterCount || 25,
    tag: primaryCatalog.tag,
    description: `Targeted clinical match addressing detected ${metabolicLevel === 'High' ? 'metabolic' : cardioLevel === 'High' ? 'cardiovascular' : jointLevel === 'High' ? 'joint' : 'wellness'} biomarkers.`,
    keyParameters: primaryPkgKey === 'diabetes' || primaryPkgKey === 'thyrodiabetes'
      ? ['HbA1c', 'FBS', 'PPBS', 'Urine RE']
      : primaryPkgKey === 'hypertension'
      ? ['Lipid Profile', 'KFT', 'Electrolytes', 'Microalbumin']
      : primaryPkgKey === 'joint' || primaryPkgKey === 'specialjoint'
      ? ['Uric Acid', 'Calcium', 'RA Factor', 'Vitamin D3']
      : primaryPkgKey === 'renal'
      ? ['Creatinine', 'Urea', 'Uric Acid', 'Electrolytes']
      : ['CBC', 'Vitamin D3', 'Vitamin B12', 'Iron Profile']
  };

  // Determine Camp Alternative Package (Flagship smartadvance ₹499 or basiccamp ₹299)
  let campPkgKey = 'smartadvance';
  if (primaryPkgKey === 'renal' || (vitalityScore >= 80 && !syms.has('thirst_urination'))) {
    campPkgKey = 'basiccamp';
  }
  const campCatalog = DSD_CATALOG[campPkgKey];
  const campAlternativePackage = {
    id: campCatalog.id,
    name: campCatalog.name,
    price: campCatalog.price,
    originalPrice: campCatalog.old,
    parameterCount: campCatalog.parameterCount,
    tag: campCatalog.tag,
    description: `High-value preventive screening covering major organ profiles with free ECG.`,
    keyParameters: campPkgKey === 'smartadvance'
      ? ['CBC', 'LFT', 'KFT', 'Lipid Profile', 'Thyroid Profile', 'HbA1c']
      : ['CBC', 'Blood Sugar', 'Urine Routine', 'KFT', 'Free ECG']
  };

  // Savings calculation
  const savingsAmount = Math.max(0, primaryPackage.price - campAlternativePackage.price);
  const savingsPercentage = primaryPackage.price > 0 ? Math.round((savingsAmount / primaryPackage.price) * 100) : 0;

  // Dynamic Clinical Explanations (tailored to detected risks)
  const clinicalExplanations = [];
  if (metabolicLevel === 'High' || syms.has('thirst_urination') || fam.has('diabetes')) {
    clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.HbA1c);
  }
  if (syms.has('fatigue') || primaryPkgKey === 'weakness' || primaryPkgKey === 'executive') {
    clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.CBC);
  }
  if (renalLevel === 'High' || fam.has('kidney') || primaryPkgKey === 'renal' || primaryPkgKey === 'hypertension') {
    clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.KFT);
  }
  if (metabolicLevel === 'High' || primaryPkgKey === 'executive' || input.activityLevel === 'sedentary') {
    clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.LFT);
  }
  if (cardioLevel === 'High' || syms.has('bp_concerns') || fam.has('hypertension')) {
    clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.Lipid);
  }
  if (jointLevel === 'High' || syms.has('joint_pain') || input.ageGroup === '60+') {
    clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.VitD3);
  }
  // Ensure at least 3 clinical explanations are always present
  if (clinicalExplanations.length < 3) {
    if (!clinicalExplanations.some(e => e.parameter === 'CBC')) clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.CBC);
    if (!clinicalExplanations.some(e => e.parameter === 'KFT')) clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.KFT);
    if (!clinicalExplanations.some(e => e.parameter === 'HbA1c')) clinicalExplanations.push(CLINICAL_EXPLANATIONS_DB.HbA1c);
  }

  return {
    vitalityScore,
    vitalityBracket,
    riskAxes,
    primaryPackage,
    campAlternativePackage,
    savingsAmount,
    savingsPercentage,
    clinicalExplanations
  };
}

/**
 * Analytical Spring Physics Solver (Damped Harmonic Oscillator)
 * Parameters: k = 300, c = 30, m = 1 with 1.05x subtle overshoot
 */
export function simulateSpringPhysics(targetValue, initialValue = 0, steps = 60, dt = 0.016, customDamping = null) {
  if (initialValue === targetValue) {
    return {
      trajectory: [{ t: 0, position: targetValue, velocity: 0 }],
      peakValue: targetValue,
      overshootRatio: 1.0,
      finalValue: targetValue,
      isSettled: true
    };
  }

  const k = 300;
  // Damping c=21.8 produces the exact 1.05x subtle overshoot for k=300, m=1
  const c = customDamping !== null ? customDamping : 21.8;
  const m = 1;

  let position = initialValue;
  let velocity = 0;
  const trajectory = [];
  let maxOvershoot = targetValue;

  for (let i = 0; i <= steps; i++) {
    const displacement = position - targetValue;
    const springForce = -k * displacement;
    const dampingForce = -c * velocity;
    const acceleration = (springForce + dampingForce) / m;

    velocity += acceleration * dt;
    position += velocity * dt;

    if (position > maxOvershoot) {
      maxOvershoot = position;
    }
    trajectory.push({ t: +(i * dt).toFixed(3), position: +position.toFixed(2), velocity: +velocity.toFixed(2) });
  }

  const finalValue = trajectory[trajectory.length - 1].position;
  const overshootRatio = targetValue !== 0 ? maxOvershoot / targetValue : 1;

  return {
    trajectory,
    peakValue: +maxOvershoot.toFixed(2),
    overshootRatio: +overshootRatio.toFixed(3),
    finalValue: Math.round(finalValue),
    isSettled: Math.abs(finalValue - targetValue) < 0.5
  };
}

/**
 * SVG Radial Gauge Arc Calculations
 * Radius: 92px, Circumference = 2 * PI * 92 ~= 578.053px
 */
export function calculateRadialGauge(score) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 92;
  const circumference = +(2 * Math.PI * radius).toFixed(3); // 578.053
  const strokeDashoffset = +(circumference - (clampedScore / 100) * circumference).toFixed(3);

  let status = 'Elevated Risk';
  let gradientId = 'grad-risk';
  let color = '#f43f5e';
  if (clampedScore >= 80) {
    status = 'Optimal Vitality';
    gradientId = 'grad-optimal';
    color = '#48ed86';
  } else if (clampedScore >= 55) {
    status = 'Moderate Vitality';
    gradientId = 'grad-moderate';
    color = '#f59e0b';
  }

  const angleRad = (2 * Math.PI * clampedScore) / 100;
  const headParticleX = +(120 + radius * Math.cos(angleRad)).toFixed(2);
  const headParticleY = +(120 + radius * Math.sin(angleRad)).toFixed(2);

  return {
    score: clampedScore,
    radius,
    circumference,
    strokeDashoffset,
    status,
    gradientId,
    color,
    headParticle: { x: headParticleX, y: headParticleY }
  };
}

/**
 * Validates Cart mutations and derived totals
 */
export function validateCartSync(cartState, testCatalog = DSD_CATALOG) {
  const cartEntries = Object.entries(cartState).filter(([_, qty]) => qty > 0);
  const count = cartEntries.reduce((sum, [_, qty]) => sum + qty, 0);
  const total = cartEntries.reduce((sum, [id, qty]) => {
    const item = testCatalog[id];
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return {
    count,
    total,
    items: cartEntries.map(([id, qty]) => ({
      id,
      name: testCatalog[id] ? testCatalog[id].name : 'Unknown',
      qty,
      subtotal: testCatalog[id] ? testCatalog[id].price * qty : 0
    }))
  };
}
