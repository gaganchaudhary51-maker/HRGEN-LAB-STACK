/**
 * Dr. Shastri Diagnostics (DSD Care) — Clinical Scoring & Hybrid Recommendation Engine
 * Module: src/components/VitalityAssessment/scoringEngine.ts
 *
 * Fully deterministic, strictly typed clinical calculation engine implementing:
 * 1. Vitality Score calculation strictly bounded to integer [15, 98]
 * 2. 4 Sub-Axis Risk Indicators (Metabolic, Cardiovascular, Renal, Joint/Inflammation)
 * 3. Targeted Primary Match & Preventive Camp Alternative recommendation
 * 4. Exact savings amount & percentage computation
 * 5. Dynamic Dr. Shastri Clinical Explanations with priority hoisting
 */

// ============================================================================
// TYPE INTERFACES & CONTRACTS
// ============================================================================

export interface AssessmentInput {
  ageGroup: '18-29' | '30-45' | '46-60' | '60+';
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'moderate' | 'active';
  sleepStress: 'restful' | 'moderate_stress' | 'poor_sleep_high_stress';
  symptoms: Array<'fatigue' | 'thirst_urination' | 'joint_pain' | 'bp_concerns' | 'general_checkup'>;
  familyHistory: Array<'diabetes' | 'hypertension' | 'kidney' | 'thyroid' | 'none'>;
}

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface RiskAxis {
  level: RiskLevel;
  percentage: number; // 0 to 100%
  summary: string;
}

export interface RecommendedPackage {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  parameterCount: number;
  tag: string;
  description: string;
  keyParameters: string[];
}

export interface ClinicalExplanation {
  parameter: string; // e.g. 'HbA1c', 'CBC', 'KFT', 'LFT', 'Lipid Profile', 'Vitamin D3'
  role: string;
  reason: string;
}

export interface AssessmentResult {
  vitalityScore: number; // strictly integer bounded [15, 98]
  vitalityBracket: 'Optimal' | 'Moderate' | 'Elevated Risk';
  riskAxes: {
    metabolic: RiskAxis;
    cardiovascular: RiskAxis;
    renal: RiskAxis;
    joint: RiskAxis;
  };
  primaryPackage: RecommendedPackage;
  campAlternativePackage: RecommendedPackage;
  savingsAmount: number;
  savingsPercentage: number;
  clinicalExplanations: ClinicalExplanation[];
}

// ============================================================================
// AUTHORITATIVE CATALOG CONSTANTS (App.tsx:29-75)
// ============================================================================

export const DIAGNOSTIC_PACKAGES: Record<string, RecommendedPackage> = {
  diabetes: {
    id: 'diabetes',
    name: 'Diabetic Package',
    price: 840,
    originalPrice: 900,
    parameterCount: 22,
    tag: '6% off · DSD website',
    description: '22 parameters · FBS, PPBS, HbA1c and urine RE',
    keyParameters: [
      'HbA1c (Glycated Hemoglobin)',
      'Fasting Blood Sugar (FBS)',
      'Post Prandial Blood Sugar (PPBS)',
      'Urine Routine & Microscopic (RE)',
    ],
  },
  thyrodiabetes: {
    id: 'thyrodiabetes',
    name: 'Thyro-Diabetic Package',
    price: 960,
    originalPrice: 1750,
    parameterCount: 34,
    tag: '45% off · DSD website',
    description: '34 parameters · combined thyroid and diabetes screening',
    keyParameters: [
      'HbA1c (Glycated Hemoglobin)',
      'Total T3, Total T4, TSH (Thyroid Profile)',
      'Fasting Blood Sugar (FBS)',
      'Post Prandial Blood Sugar (PPBS)',
      'Urine Routine & Microscopic',
    ],
  },
  joint: {
    id: 'joint',
    name: 'Basic Joint Pain Package',
    price: 875,
    originalPrice: 1750,
    parameterCount: 6,
    tag: '50% off · DSD website',
    description: '6 parameters · basic joint pain work-up',
    keyParameters: [
      'Serum Uric Acid',
      'Serum Calcium',
      'Serum Phosphorus',
      'RA Factor (Rheumatoid Factor)',
      'ESR / CRP (Inflammatory Markers)',
      'Alkaline Phosphatase (ALP)',
    ],
  },
  specialjoint: {
    id: 'specialjoint',
    name: 'Special Joint Package',
    price: 4530,
    originalPrice: 7750,
    parameterCount: 41,
    tag: '41% off · DSD website',
    description: '41 parameters · advanced joint & autoimmune arthritis profile',
    keyParameters: [
      'RA Factor Quantitative',
      'Anti-CCP (Cyclic Citrullinated Peptide)',
      'ANA (Antinuclear Antibodies)',
      'Serum Uric Acid',
      'Vitamin D3 (25-OH)',
      'Serum Calcium',
      'Complete Blood Count (CBC)',
      'Erythrocyte Sedimentation Rate (ESR)',
    ],
  },
  weakness: {
    id: 'weakness',
    name: 'Basic Weakness Package',
    price: 2730,
    originalPrice: 4550,
    parameterCount: 63,
    tag: '40% off · DSD website',
    description: '63 parameters · investigate common weakness concerns',
    keyParameters: [
      'Complete Blood Count (CBC - 24 params)',
      'Vitamin D3 (25-OH)',
      'Vitamin B12 (Cyanocobalamin)',
      'Serum Iron & Total Iron Binding Capacity',
      'Serum Ferritin',
      'Thyroid Stimulating Hormone (TSH)',
      'Kidney Function Test (KFT)',
    ],
  },
  hypertension: {
    id: 'hypertension',
    name: 'Hypertension Package',
    price: 4710,
    originalPrice: 7850,
    parameterCount: 76,
    tag: '40% off · DSD website',
    description: '76 parameters · blood pressure-related screening',
    keyParameters: [
      'Lipid Profile Complete (Chol, TG, HDL, LDL, VLDL)',
      'Kidney Function Test (KFT - Creatinine, Urea, Uric Acid)',
      'Serum Electrolytes (Sodium, Potassium, Chloride)',
      'Complete Blood Count (CBC)',
      'Urine Microalbumin / Creatinine Ratio',
      'Fasting Blood Glucose',
    ],
  },
  renal: {
    id: 'renal',
    name: 'Renal Screening Package',
    price: 175,
    originalPrice: 350,
    parameterCount: 20,
    tag: '50% off · DSD website',
    description: '20 parameters · kidney health screening',
    keyParameters: [
      'Serum Creatinine',
      'Blood Urea & BUN',
      'Serum Uric Acid',
      'Serum Electrolytes (Na, K, Cl)',
      'Urine Routine & Microscopic Examination',
    ],
  },
  executive: {
    id: 'executive',
    name: 'Executive Full Body Checkup',
    price: 999,
    originalPrice: 999,
    parameterCount: 60,
    tag: 'Camp offer · ECG free',
    description: 'Full blood and urine panels + Vitamin D3 and Vitamin B12',
    keyParameters: [
      'Vitamin D3 (25-OH)',
      'Vitamin B12 (Cyanocobalamin)',
      'Complete Blood Count (CBC)',
      'Liver Function Test (LFT)',
      'Kidney Function Test (KFT)',
      'Lipid Profile',
      'Urine Routine Examination',
      'Complimentary Clinic ECG',
    ],
  },
  smartadvance: {
    id: 'smartadvance',
    name: 'DSD Smart Health Advance',
    price: 499,
    originalPrice: 499,
    parameterCount: 50,
    tag: 'Camp offer · ECG free',
    description: 'CBC, LFT, KFT, lipid profile, thyroid profile and HbA1c',
    keyParameters: [
      'HbA1c (Glycated Hemoglobin)',
      'Complete Blood Count (CBC - 24 params)',
      'Liver Function Test (LFT - 12 params)',
      'Kidney Function Test (KFT - 10 params)',
      'Lipid Profile Complete (5 params)',
      'Thyroid Profile (Total T3, Total T4, TSH)',
      'Complimentary Clinic ECG',
    ],
  },
  basiccamp: {
    id: 'basiccamp',
    name: 'Basic Health Pack',
    price: 299,
    originalPrice: 299,
    parameterCount: 25,
    tag: 'Camp offer · ECG free',
    description: 'CBC, blood sugar, urine routine and kidney function (KFT)',
    keyParameters: [
      'Complete Blood Count (CBC - 24 params)',
      'Blood Sugar (Fasting Glucose)',
      'Urine Routine & Microscopic',
      'Kidney Function Test (Creatinine & Urea)',
      'Complimentary Clinic ECG',
    ],
  },
};

// ============================================================================
// CLINICAL SUMMARIES TEXT REGISTRY
// ============================================================================

export const CLINICAL_SUMMARIES: Record<'metabolic' | 'cardiovascular' | 'renal' | 'joint', Record<RiskLevel, string>> = {
  metabolic: {
    Low: 'Optimal glycemic balance and steady lipid metabolism. Fasting blood sugar and HbA1c remain in low-risk preventive ranges; routine annual monitoring advised.',
    Moderate: 'Moderate glycemic and metabolic strain detected. Fasting blood sugar, HbA1c, and lipid profiling recommended to rule out prediabetes or early dyslipidemia.',
    High: 'Elevated metabolic risk with pronounced glycemic vulnerability. Comprehensive Diabetic Package (HbA1c, FBS, PPBS) and Lipid Profile urgently recommended.',
  },
  cardiovascular: {
    Low: 'Healthy vascular elasticity and optimal hemodynamic parameters. Blood pressure and lipid indices reflect favorable cardiovascular resilience.',
    Moderate: 'Mild to moderate cardiovascular strain identified. Screening with complete Lipid Profile, ECG, and blood pressure tracking advised to protect arterial lining.',
    High: 'Significant cardiovascular and hemodynamic risk indicators present. Full Lipid Profile, blood pressure monitoring, and Hypertension / Smart Advance screening strongly recommended.',
  },
  renal: {
    Low: 'Uncompromised renal filtration reserve and normal uric acid clearance. Serum creatinine, urea, and electrolyte excretion within healthy baseline limits.',
    Moderate: 'Borderline renal workload or uric acid clearance concern. Kidney Function Test (KFT: Creatinine, Urea, Uric Acid, BUN) advised to evaluate glomerular filtration.',
    High: 'Elevated renal filtration stress and possible nitrogenous/uric acid retention. Dedicated Renal Screening Package or KFT profile with urine routine analysis strongly indicated.',
  },
  joint: {
    Low: 'Healthy joint mobility and low systemic inflammation markers. Cartilage resilience and musculoskeletal bone density remain well-supported.',
    Moderate: 'Mild musculoskeletal stiffness or systemic inflammatory marker elevation. Vitamin D3, Serum Calcium, and Uric Acid testing advised to prevent joint wear.',
    High: 'High inflammatory and joint wear vulnerability detected. Basic Joint Pain Package (RA factor, Uric Acid, Calcium) or Special Joint Package with Vitamin D3 strongly recommended.',
  },
};

// ============================================================================
// CLINICAL EXPLANATIONS REGISTRY
// ============================================================================

export const CLINICAL_EXPLANATIONS: Record<string, ClinicalExplanation> = {
  HbA1c: {
    parameter: 'HbA1c',
    role: '90-day mean glycemic index and chronic glycemic variability marker',
    reason:
      'Dr. Shastri Diagnostics utilizes high-performance liquid chromatography (HPLC) to quantify glycated hemoglobin in erythrocytes. Because red blood cells circulate for 90 to 120 days, HbA1c reflects average blood glucose levels unaffected by recent diet, fasting state, or acute stress. This allows early detection of prediabetes (5.7%–6.4%) and occult insulin resistance before fasting glucose alone crosses diabetic thresholds.',
  },
  CBC: {
    parameter: 'CBC',
    role: 'Hematopoietic vitality, cellular oxygenation, immune defense, and platelet count',
    reason:
      'Our automated 6-part hematology analysis evaluates 24 cellular parameters including Hemoglobin, Hematocrit (PCV), Red Cell Indices (MCV, MCH, MCHC, RDW), Total Leucocyte Count (TLC), differential counts, and Platelets. For patients experiencing fatigue, weakness, or reduced stamina, CBC immediately differentiates between iron-deficiency microcytic anemia, megaloblastic B12-deficiency anemia, and subclinical viral or bacterial infections.',
  },
  KFT: {
    parameter: 'KFT',
    role: 'Glomerular filtration integrity (eGFR), nitrogenous clearance, and electrolyte balance',
    reason:
      'Kidneys can silently lose up to 50% of nephron filtration capacity before clinical symptoms like edema or urinary changes develop. Dr. Shastri Diagnostics evaluates Serum Creatinine, Blood Urea, BUN, Serum Uric Acid, and critical electrolytes (Sodium, Potassium, Chloride). This panel detects early hypertensive vascular damage, diabetic nephropathy, hyperuricemic gout risk, and drug-induced metabolic strain.',
  },
  LFT: {
    parameter: 'LFT',
    role: 'Hepatocyte integrity, biliary clearance, and hepatic protein synthetic reserve',
    reason:
      'This panel measures transaminases (SGOT/AST and SGPT/ALT) for liver cell injury, Alkaline Phosphatase (ALP) and Bilirubin fractions for biliary excretion, alongside Total Protein, Albumin, and Globulin (with A:G ratio). In metabolic syndrome, sedentary lifestyles, and persistent fatigue, LFT detects early Non-Alcoholic Fatty Liver Disease (NAFLD/MASLD), sluggish hepatic clearance, and chronic metabolic inflammation.',
  },
  'Lipid Profile': {
    parameter: 'Lipid Profile',
    role: 'Atherogenic lipoprotein burden and 10-year cardiovascular risk index',
    reason:
      'Atherosclerotic cardiovascular disease develops silently over decades through sub-endothelial retention of apolipoprotein-B-containing particles. Dr. Shastri Diagnostics analyzes Total Cholesterol, Triglycerides (TG), cardioprotective HDL, and atherogenic LDL and VLDL particles. Evaluating lipid ratios is crucial for patients with blood pressure concerns, arterial stiffness, or family cardiac history to guide preventive vascular care.',
  },
  'Vitamin D3': {
    parameter: 'Vitamin D3',
    role: 'Intestinal calcium absorption, musculoskeletal mineralization, and immune modulation',
    reason:
      'More than 70% of urban adults suffer from Vitamin D deficiency (<20 ng/mL). Active 25-OH Vitamin D3 is essential for bone mineral density, osteoclast regulation, neuromuscular transmission, and innate immune defense. Dr. Shastri Diagnostics flags Vitamin D3 testing for individuals with joint stiffness, deep bone ache, or chronic fatigue to halt progressive bone demineralization and chronic pain syndromes.',
  },
};

// Aliases for convenient indexing
CLINICAL_EXPLANATIONS['Lipid'] = CLINICAL_EXPLANATIONS['Lipid Profile'];
CLINICAL_EXPLANATIONS['VitaminD3'] = CLINICAL_EXPLANATIONS['Vitamin D3'];

// ============================================================================
// DEDUCTION MATRICES & COEFFICIENTS
// ============================================================================

const AGE_DEDUCTIONS: Record<AssessmentInput['ageGroup'], number> = {
  '18-29': 0,
  '30-45': 4,
  '46-60': 9,
  '60+': 15,
};

const ACTIVITY_DEDUCTIONS: Record<AssessmentInput['activityLevel'], number> = {
  active: 0,
  moderate: 5,
  sedentary: 12,
};

const SLEEP_STRESS_DEDUCTIONS: Record<AssessmentInput['sleepStress'], number> = {
  restful: 0,
  moderate_stress: 6,
  poor_sleep_high_stress: 14,
};

const SYMPTOM_DEDUCTIONS: Record<string, number> = {
  fatigue: 10,
  thirst_urination: 14,
  joint_pain: 11,
  bp_concerns: 13,
  general_checkup: 0,
};

const FAMILY_DEDUCTIONS: Record<string, number> = {
  diabetes: 7,
  hypertension: 7,
  kidney: 8,
  thyroid: 6,
  none: 0,
};

// ============================================================================
// CLASSIFICATION & HELPER FUNCTIONS
// ============================================================================

export function classifyRiskLevel(percentage: number): RiskLevel {
  if (percentage < 35) return 'Low';
  if (percentage <= 65) return 'Moderate';
  return 'High';
}

function clampPercentage(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ============================================================================
// VITALITY SCORE CALCULATION
// ============================================================================

export function calculateVitalityScore(input: AssessmentInput): {
  vitalityScore: number;
  vitalityBracket: 'Optimal' | 'Moderate' | 'Elevated Risk';
} {
  const age = input?.ageGroup || '30-45';
  const activity = input?.activityLevel || 'moderate';
  const sleep = input?.sleepStress || 'moderate_stress';
  const symptoms = Array.isArray(input?.symptoms) ? input.symptoms : [];
  const familyHistory = Array.isArray(input?.familyHistory) ? input.familyHistory : [];

  const ageDeduction = AGE_DEDUCTIONS[age] ?? 4;
  const activityDeduction = ACTIVITY_DEDUCTIONS[activity] ?? 5;
  const sleepStressDeduction = SLEEP_STRESS_DEDUCTIONS[sleep] ?? 6;

  let symptomDeduction = 0;
  for (const symptom of symptoms) {
    symptomDeduction += SYMPTOM_DEDUCTIONS[symptom] ?? 0;
  }

  let familyDeduction = 0;
  const hasNoFamilyHistory = familyHistory.includes('none');
  if (!hasNoFamilyHistory) {
    for (const condition of familyHistory) {
      familyDeduction += FAMILY_DEDUCTIONS[condition] ?? 0;
    }
  }

  const totalDeductions =
    ageDeduction + activityDeduction + sleepStressDeduction + symptomDeduction + familyDeduction;

  const rawScore = 100 - totalDeductions;
  const vitalityScore = Math.max(15, Math.min(98, Math.round(rawScore)));

  let vitalityBracket: 'Optimal' | 'Moderate' | 'Elevated Risk';
  if (vitalityScore >= 80) {
    vitalityBracket = 'Optimal';
  } else if (vitalityScore >= 55) {
    vitalityBracket = 'Moderate';
  } else {
    vitalityBracket = 'Elevated Risk';
  }

  return { vitalityScore, vitalityBracket };
}

// ============================================================================
// SUB-AXIS RISK FUNCTIONS
// ============================================================================

export function calculateMetabolicRisk(input: AssessmentInput): RiskAxis {
  let score = 8; // Baseline population risk

  // Age gradient
  if (input?.ageGroup === '30-45') score += 6;
  else if (input?.ageGroup === '46-60') score += 12;
  else if (input?.ageGroup === '60+') score += 18;

  // Gender
  if (input?.gender === 'male') score += 2;

  // Lifestyle
  if (input?.activityLevel === 'active') score -= 6;
  else if (input?.activityLevel === 'moderate') score += 3;
  else if (input?.activityLevel === 'sedentary') score += 14;

  if (input?.sleepStress === 'moderate_stress') score += 4;
  else if (input?.sleepStress === 'poor_sleep_high_stress') score += 10;

  // Symptoms
  const s = Array.isArray(input?.symptoms) ? input.symptoms : [];
  if (s.includes('thirst_urination')) score += 40;
  if (s.includes('fatigue')) score += 14;
  if (s.includes('bp_concerns')) score += 6;
  if (s.includes('joint_pain')) score += 4;

  // Family History
  const f = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  if (f.includes('none')) {
    score -= 5;
  } else {
    if (f.includes('diabetes')) score += 25;
    if (f.includes('thyroid')) score += 12;
    if (f.includes('hypertension')) score += 6;
    if (f.includes('kidney')) score += 6;
  }

  const percentage = clampPercentage(score);
  const level = classifyRiskLevel(percentage);
  return {
    percentage,
    level,
    summary: CLINICAL_SUMMARIES.metabolic[level],
  };
}

export function calculateCardiovascularRisk(input: AssessmentInput): RiskAxis {
  let score = 6; // Baseline population risk

  // Age gradient
  if (input?.ageGroup === '30-45') score += 6;
  else if (input?.ageGroup === '46-60') score += 14;
  else if (input?.ageGroup === '60+') score += 20;

  // Gender
  if (input?.gender === 'male') score += 4;
  else if (input?.gender === 'other') score += 2;

  // Lifestyle
  if (input?.activityLevel === 'active') score -= 6;
  else if (input?.activityLevel === 'moderate') score += 3;
  else if (input?.activityLevel === 'sedentary') score += 14;

  if (input?.sleepStress === 'moderate_stress') score += 5;
  else if (input?.sleepStress === 'poor_sleep_high_stress') score += 14;

  // Symptoms
  const s = Array.isArray(input?.symptoms) ? input.symptoms : [];
  if (s.includes('bp_concerns')) score += 45;
  if (s.includes('fatigue')) score += 12;
  if (s.includes('thirst_urination')) score += 6;
  if (s.includes('joint_pain')) score += 4;

  // Family History
  const f = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  if (f.includes('none')) {
    score -= 5;
  } else {
    if (f.includes('hypertension')) score += 26;
    if (f.includes('diabetes')) score += 14;
    if (f.includes('kidney')) score += 8;
    if (f.includes('thyroid')) score += 6;
  }

  const percentage = clampPercentage(score);
  const level = classifyRiskLevel(percentage);
  return {
    percentage,
    level,
    summary: CLINICAL_SUMMARIES.cardiovascular[level],
  };
}

export function calculateRenalRisk(input: AssessmentInput): RiskAxis {
  let score = 6; // Baseline population risk

  // Age gradient
  if (input?.ageGroup === '30-45') score += 5;
  else if (input?.ageGroup === '46-60') score += 12;
  else if (input?.ageGroup === '60+') score += 18;

  // Gender
  if (input?.gender === 'male') score += 2;

  // Lifestyle
  if (input?.activityLevel === 'active') score -= 4;
  else if (input?.activityLevel === 'moderate') score += 2;
  else if (input?.activityLevel === 'sedentary') score += 10;

  if (input?.sleepStress === 'moderate_stress') score += 3;
  else if (input?.sleepStress === 'poor_sleep_high_stress') score += 8;

  // Symptoms
  const s = Array.isArray(input?.symptoms) ? input.symptoms : [];
  if (s.includes('thirst_urination')) score += 36;
  if (s.includes('bp_concerns')) score += 20;
  if (s.includes('joint_pain')) score += 14;
  if (s.includes('fatigue')) score += 10;

  // Family History
  const f = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  if (f.includes('none')) {
    score -= 5;
  } else {
    if (f.includes('kidney')) score += 32;
    if (f.includes('diabetes')) score += 15;
    if (f.includes('hypertension')) score += 14;
    if (f.includes('thyroid')) score += 4;
  }

  const percentage = clampPercentage(score);
  const level = classifyRiskLevel(percentage);
  return {
    percentage,
    level,
    summary: CLINICAL_SUMMARIES.renal[level],
  };
}

export function calculateJointRisk(input: AssessmentInput): RiskAxis {
  let score = 6; // Baseline population risk

  // Age gradient
  if (input?.ageGroup === '30-45') score += 7;
  else if (input?.ageGroup === '46-60') score += 16;
  else if (input?.ageGroup === '60+') score += 24;

  // Gender
  if (input?.gender === 'female') score += 5;
  else if (input?.gender === 'other') score += 2;

  // Lifestyle
  if (input?.activityLevel === 'active') score -= 6;
  else if (input?.activityLevel === 'moderate') score += 3;
  else if (input?.activityLevel === 'sedentary') score += 14;

  if (input?.sleepStress === 'moderate_stress') score += 4;
  else if (input?.sleepStress === 'poor_sleep_high_stress') score += 10;

  // Symptoms
  const s = Array.isArray(input?.symptoms) ? input.symptoms : [];
  if (s.includes('joint_pain')) score += 48;
  if (s.includes('fatigue')) score += 18;
  if (s.includes('thirst_urination')) score += 4;
  if (s.includes('bp_concerns')) score += 4;

  // Family History
  const f = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  if (f.includes('none')) {
    score -= 5;
  } else {
    if (f.includes('thyroid')) score += 14;
    if (f.includes('kidney')) score += 12;
    if (f.includes('diabetes')) score += 8;
    if (f.includes('hypertension')) score += 4;
  }

  const percentage = clampPercentage(score);
  const level = classifyRiskLevel(percentage);
  return {
    percentage,
    level,
    summary: CLINICAL_SUMMARIES.joint[level],
  };
}

export function calculateRiskAxes(input: AssessmentInput): {
  metabolic: RiskAxis;
  cardiovascular: RiskAxis;
  renal: RiskAxis;
  joint: RiskAxis;
} {
  return {
    metabolic: calculateMetabolicRisk(input),
    cardiovascular: calculateCardiovascularRisk(input),
    renal: calculateRenalRisk(input),
    joint: calculateJointRisk(input),
  };
}

// ============================================================================
// SAVINGS CALCULATION
// ============================================================================

export function calculateSavings(
  primary: RecommendedPackage,
  alternative: RecommendedPackage
): { savingsAmount: number; savingsPercentage: number } {
  const savingsAmount = Math.max(0, primary.price - alternative.price);
  const savingsPercentage =
    primary.price > 0 && savingsAmount > 0
      ? Math.round((savingsAmount / primary.price) * 100)
      : 0;
  return { savingsAmount, savingsPercentage };
}

// ============================================================================
// PACKAGE RECOMMENDATION DETERMINATION
// ============================================================================

export function determinePackageRecommendation(input: AssessmentInput): {
  primaryPackage: RecommendedPackage;
  campAlternativePackage: RecommendedPackage;
  savingsAmount: number;
  savingsPercentage: number;
} {
  const symptoms = Array.isArray(input?.symptoms) ? input.symptoms : [];
  const familyHistory = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  const hasNoFamilyHistory = familyHistory.includes('none');

  let primaryId = 'executive';

  const hasGlycemicConcern =
    symptoms.includes('thirst_urination') || (!hasNoFamilyHistory && familyHistory.includes('diabetes'));
  const hasThyroidConcern = !hasNoFamilyHistory && familyHistory.includes('thyroid');
  const hasFatigue = symptoms.includes('fatigue');

  if (hasGlycemicConcern && (hasThyroidConcern || (hasFatigue && hasThyroidConcern))) {
    primaryId = 'thyrodiabetes';
  } else if (hasGlycemicConcern) {
    primaryId = 'diabetes';
  } else if (symptoms.includes('bp_concerns') || (!hasNoFamilyHistory && familyHistory.includes('hypertension'))) {
    primaryId = 'hypertension';
  } else if (symptoms.includes('joint_pain')) {
    if (
      input?.ageGroup === '60+' ||
      (input?.ageGroup === '46-60' && (input?.activityLevel === 'sedentary' || input?.sleepStress === 'poor_sleep_high_stress'))
    ) {
      primaryId = 'specialjoint';
    } else {
      primaryId = 'joint';
    }
  } else if (!hasNoFamilyHistory && familyHistory.includes('kidney')) {
    primaryId = 'renal';
  } else if (hasFatigue) {
    primaryId = 'weakness';
  } else {
    primaryId = 'executive';
  }

  // Determine Camp Alternative
  let campAlternativeId = 'smartadvance';
  if (primaryId === 'renal') {
    campAlternativeId = 'basiccamp';
  }

  const primaryPackage = DIAGNOSTIC_PACKAGES[primaryId] || DIAGNOSTIC_PACKAGES.executive;
  const campAlternativePackage = DIAGNOSTIC_PACKAGES[campAlternativeId] || DIAGNOSTIC_PACKAGES.smartadvance;
  const { savingsAmount, savingsPercentage } = calculateSavings(primaryPackage, campAlternativePackage);

  return { primaryPackage, campAlternativePackage, savingsAmount, savingsPercentage };
}

// ============================================================================
// DYNAMIC CLINICAL EXPLANATIONS
// ============================================================================

export function getClinicalExplanations(input: AssessmentInput): ClinicalExplanation[] {
  const symptoms = Array.isArray(input?.symptoms) ? input.symptoms : [];
  const familyHistory = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  const hasNoFamilyHistory = familyHistory.includes('none');

  const prioritized: string[] = [];

  const pushIfNew = (param: string) => {
    if (!prioritized.includes(param)) {
      prioritized.push(param);
    }
  };

  // Dynamic priority hoisting based on detected clinical flags
  if (symptoms.includes('thirst_urination') || (!hasNoFamilyHistory && familyHistory.includes('diabetes'))) {
    pushIfNew('HbA1c');
  }
  if (symptoms.includes('bp_concerns') || (!hasNoFamilyHistory && familyHistory.includes('hypertension'))) {
    pushIfNew('Lipid Profile');
    pushIfNew('KFT');
  }
  if (symptoms.includes('joint_pain')) {
    pushIfNew('Vitamin D3');
    pushIfNew('CBC');
  }
  if (symptoms.includes('fatigue')) {
    pushIfNew('CBC');
    pushIfNew('Vitamin D3');
    pushIfNew('LFT');
  }
  if (!hasNoFamilyHistory && familyHistory.includes('kidney')) {
    pushIfNew('KFT');
  }

  // Append remaining parameters to guarantee all 6 key tests are represented
  const allParams = ['HbA1c', 'CBC', 'KFT', 'LFT', 'Lipid Profile', 'Vitamin D3'];
  for (const param of allParams) {
    pushIfNew(param);
  }

  return prioritized.map((param) => CLINICAL_EXPLANATIONS[param]);
}

// ============================================================================
// UNIFIED ASSESSMENT CALCULATION
// ============================================================================

export function calculateVitalityAssessment(input: AssessmentInput): AssessmentResult {
  const { vitalityScore, vitalityBracket } = calculateVitalityScore(input);
  const riskAxes = calculateRiskAxes(input);
  const { primaryPackage, campAlternativePackage, savingsAmount, savingsPercentage } =
    determinePackageRecommendation(input);
  const clinicalExplanations = getClinicalExplanations(input);

  return {
    vitalityScore,
    vitalityBracket,
    riskAxes,
    primaryPackage,
    campAlternativePackage,
    savingsAmount,
    savingsPercentage,
    clinicalExplanations,
  };
}
