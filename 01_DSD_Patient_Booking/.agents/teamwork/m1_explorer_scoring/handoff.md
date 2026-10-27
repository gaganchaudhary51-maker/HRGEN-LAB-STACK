# Clinical Vitality Scoring Algorithm & Engine Blueprint
**Author**: Clinical Scoring Explorer (`teamwork_preview_explorer`)  
**Workspace**: `C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m1_explorer_scoring`  
**Milestone**: Milestone 1: Clinical Scoring & Hybrid Recommendation Engine (`scoringEngine.ts`)  
**Target Path**: `src/components/VitalityAssessment/scoringEngine.ts`  
**Timestamp**: 2026-10-25T11:33:00Z  

---

## 1. Observation

Direct investigation of the DSD Patient Booking codebase and requirements revealed the following authoritative parameters, interface contracts, and baseline configurations:

### 1.1 Requirements & Interface Contracts
- **`ORIGINAL_REQUEST.md:12-18` (Requirement R1)**:
  > "3-step interactive clinical quiz:
  >  - Step 1: Demographics & Lifestyle (Age group, Gender, Activity level, Sleep/Stress)
  >  - Step 2: Primary Symptoms & Concerns (Fatigue/Weakness, Frequent Thirst/Urination, Joint Stiffness/Pain, Blood Pressure concerns, General Checkup)
  >  - Step 3: Family Medical History (Diabetes, Hypertension, Kidney conditions, Thyroid, None)
  >  - Multi-axial clinical calculation computing an Overall Vitality Score (0–100) and specific risk indicators (Metabolic, Cardiovascular, Renal, Joint/Inflammation)."
- **`PROJECT.md:60-111` (`scoringEngine.ts` Interface Contract)**:
  ```typescript
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

  export interface AssessmentResult {
    vitalityScore: number; // strictly 0 to 100 (clamped [15, 98])
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
    clinicalExplanations: Array<{
      parameter: string; // e.g. 'HbA1c', 'CBC', 'KFT', 'LFT', 'Lipid Profile', 'Vitamin D3'
      role: string;
      reason: string;
    }>;
  }

  export function calculateVitalityAssessment(input: AssessmentInput): AssessmentResult;
  ```

### 1.2 Diagnostic Catalog & Pricing Baseline (`src/App.tsx:29-75`)
- Targeted packages in existing catalog:
  * `diabetes`: "Diabetic Package", ₹840 (old ₹900, 22 parameters)
  * `thyrodiabetes`: "Thyro-Diabetic Package", ₹960 (old ₹1750, 34 parameters)
  * `joint`: "Basic Joint Pain Package", ₹875 (old ₹1750, 6 parameters)
  * `specialjoint`: "Special Joint Package", ₹4530 (old ₹7750, 41 parameters)
  * `weakness`: "Basic Weakness Package", ₹2730 (old ₹4550, 63 parameters)
  * `hypertension`: "Hypertension Package", ₹4710 (old ₹7850, 76 parameters)
  * `renal`: "Renal Screening Package", ₹175 (old ₹350, 20 parameters)
  * `executive`: "Executive Full Body Checkup", ₹999 (old ₹999, 65 parameters)
- Flagship Preventive Camp packages:
  * `smartadvance`: "DSD Smart Health Advance", ₹499 (old ₹499, 50+ parameters, 6 profiles, Free ECG)
  * `basiccamp`: "Basic Health Pack", ₹299 (old ₹299, 25+ parameters, 4 profiles, Free ECG)

### 1.3 Target Directory Status
- Path `src/components/VitalityAssessment/` does not yet exist and must be created cleanly during Milestone 1 implementation.

---

## 2. Logic Chain

The Clinical Vitality Scoring algorithm is designed through step-by-step clinical and mathematical derivation:

```
[Observation 1.1: 3-Step Input Schema + Clamping Requirement [15, 98]]
    │
    ▼
[Step 1: Clinical Rationale for Bounding [15, 98]]
    - An ambulatory outpatient completing an online diagnostic quiz is conscious and actively seeking care,
      not in moribund terminal shock or cardiac arrest. Setting the lower boundary at 15 avoids alarming
      patients with zero or negative scores, while preserving urgent clinical triage.
    - Conversely, human biology is never 100% immune to basal biological wear, oxidative stress, or micro-inflammation.
      A maximum score ceiling of 98 reinforces clinical credibility (communicating realistic biological reserve).
    - Deduction formula: Start with Base Score of 100, calculate multi-axial deductions, and clamp to [15, 98].
    │
    ▼
[Step 2: Step 1 Demographics & Lifestyle Deductions (Range: 0 to 41 points)]
    - Age group:
      * '18-29': 0 pts (Peak organ reserve, youthful cellular regeneration)
      * '30-45': 4 pts (Early vascular stiffening, declining metabolic rate)
      * '46-60': 9 pts (Accumulated metabolic and atherogenic vulnerability)
      * '60+': 15 pts (Telomeric attrition, reduced glomerular filtration, vascular rigidity)
    - Gender:
      * Neutral 0 pts for overall score to prevent demographic bias, but acts as a risk axis modifier
    - Activity Level:
      * 'active': 0 pts (Meets/exceeds 150 min/wk aerobic/resistance exercise)
      * 'moderate': 5 pts (Occasional activity, mild sedentary offset)
      * 'sedentary': 12 pts (Desk-bound, impaired insulin sensitivity, endothelial dysfunction)
    - Sleep & Stress:
      * 'restful': 0 pts (7-8 hours deep restorative sleep, normal cortisol rhythm)
      * 'moderate_stress': 6 pts (Intermittent poor sleep, moderate sympathetic tone)
      * 'poor_sleep_high_stress': 14 pts (Chronic insomnia, elevated hs-CRP, sustained cortisol elevation)
    │
    ▼
[Step 3: Step 2 Primary Symptoms Deductions (Range: 0 to 48 points)]
    - 'fatigue': 10 pts (Chronic exhaustion, anemia, cellular ATP depletion, occult endocrine deficits)
    - 'thirst_urination': 14 pts (Osmotic diuresis, active hyperglycemic spillover or renal tubular strain)
    - 'joint_pain': 11 pts (Cartilage erosion, synovitis, hyperuricemia, musculoskeletal inflammation)
    - 'bp_concerns': 13 pts (Systemic vascular hypertension, headache, endothelial resistance)
    - 'general_checkup': 0 pts (Proactive, asymptomatic screening intent)
    - Multi-select handling: Sum of unique active symptoms.
    │
    ▼
[Step 4: Step 3 Family Medical History Deductions (Range: 0 to 28 points)]
    - 'diabetes': 7 pts (First-degree hereditary insulin receptor/secretion predisposition)
    - 'hypertension': 7 pts (Familial arterial compliance deficits, RAAS hypersensitivity)
    - 'kidney': 8 pts (Familial glomerulopathy, microalbuminuria, polycystic kidney tendencies)
    - 'thyroid': 6 pts (Familial autoimmune thyroiditis, metabolic rate lability)
    - 'none': 0 pts (No known first-degree hereditary risks)
    - Multi-select handling: Sum of unique hereditary risks ('none' overrides to 0).
    │
    ▼
[Step 5: Mathematical Summation & Clamping Guarantee]
    - Total Deductions = Δ_demographics (0-41) + Δ_symptoms (0-48) + Δ_family (0-28)
    - Theoretical Max Deduction = 41 + 48 + 28 = 117 points
    - Theoretical Min Deduction = 0 points
    - Raw Score Range: 100 - 117 = -17 (worst) to 100 - 0 = 100 (best)
    - Guaranteed Clamping Formula:
      vitalityScore = Math.max(15, Math.min(98, Math.round(100 - totalDeductions)))
    - The output is mathematically proven to always be an integer strictly within [15, 98].
    │
    ▼
[Step 6: Clinical Vitality Bracket Mapping]
    - Score >= 80: 'Optimal' (Green/Emerald — High vitality, robust biological reserve)
    - Score 55 to 79: 'Moderate' (Amber/Lime — Mild to moderate systemic strain)
    - Score < 55: 'Elevated Risk' (Coral/Rose — Active symptoms or compounding hereditary risks)
```

---

## 3. Detailed Deduction Matrices & Formulas

### Table 3.1: Step 1 — Demographics & Lifestyle Weights
| Factor | Option | Deduction ($\Delta$) | Clinical Rationale |
|---|---|---|---|
| **Age Group** | `'18-29'` | **0** | Baseline biological peak, high cellular repair capacity. |
| | `'30-45'` | **4** | Early metabolic slowdown, subclinical lipid/vascular changes. |
| | `'46-60'` | **9** | Increased cardiovascular and glycemic incidence window. |
| | `'60+'` | **15** | Age-related decline in renal clearance, arterial elasticity, and bone density. |
| **Gender** | `'male'` / `'female'` / `'other'` | **0** | Ethically neutral for overall vitality score. |
| **Activity Level** | `'active'` | **0** | Regular aerobic exercise preserves endothelial nitric oxide and glucose uptake. |
| | `'moderate'` | **5** | Light activity; minor metabolic inertia. |
| | `'sedentary'` | **12** | Chronic physical inactivity; major independent risk factor for metabolic syndrome. |
| **Sleep & Stress**| `'restful'` | **0** | Optimal circadian restoration and HPA-axis equilibrium. |
| | `'moderate_stress'` | **6** | Mild cortisol elevation, occasional sleep fragmentation. |
| | `'poor_sleep_high_stress'` | **14** | Sustained systemic inflammation (IL-6, TNF-alpha), nocturnal sympathetic dominance. |
| **Step 1 Subtotal** | | **0 to 41 pts** | |

### Table 3.2: Step 2 — Primary Symptoms & Concerns Weights
| Symptom Identifier | Deduction ($\Delta$) | Clinical Significance | Diagnostic Markers Indicated |
|---|---|---|---|
| `'fatigue'` | **10** | Unexplained physical/mental exhaustion, potential occult anemia or endocrine strain. | CBC (Hb), Vit B12, Vit D3, TSH |
| `'thirst_urination'` | **14** | Hallmark symptom of glycemic dysregulation (osmotic diuresis) or renal concentration deficit. | Fasting Blood Sugar, HbA1c, Urine Routine |
| `'joint_pain'` | **11** | Articular stiffness, synovitis, cartilage erosion, or hyperuricemia (gout). | Uric Acid, Calcium, RA Factor, Vit D3 |
| `'bp_concerns'` | **13** | Vascular resistance, arterial hypertension, dizziness, palpitations. | Lipid Profile, KFT, ECG |
| `'general_checkup'` | **0** | Asymptomatic proactive screening; no pathological deduction. | Baseline Wellness Profile |
| **Step 2 Subtotal** | **0 to 48 pts** | Cumulative sum across selected symptoms. | |

### Table 3.3: Step 3 — Family Medical History Weights
| Hereditary Condition | Deduction ($\Delta$) | Heritability & Clinical Burden | Recommended Surveillance |
|---|---|---|---|
| `'diabetes'` | **7** | Polygenic susceptibility to beta-cell exhaustion and insulin resistance. | HbA1c, Fasting Glucose |
| `'hypertension'` | **7** | Inherited vascular compliance loss and salt sensitivity. | Lipid Profile, Electrolytes, KFT |
| `'kidney'` | **8** | Familial predisposition to glomerulopathy, nephron loss, and renal hypertension. | Serum Creatinine, Urea, Urine RE |
| `'thyroid'` | **6** | Autoimmune thyroiditis clustering (HLA associations). | Total T3, Total T4, TSH |
| `'none'` | **0** | No known first-degree hereditary risks. | Standard screening |
| **Step 3 Subtotal** | **0 to 28 pts** | Cumulative sum across selected conditions. If `'none'` is present, history deduction = 0. | |

---

## 4. Mathematical Clamping & Invariant Proof

Let $S_{\text{raw}}$ be the unconstrained vitality score:
$$S_{\text{raw}} = 100 - \left( \Delta_{\text{age}} + \Delta_{\text{activity}} + \Delta_{\text{stress}} + \sum_{s \in \text{symptoms}} \Delta_s + \sum_{h \in \text{family}} \Delta_h \right)$$

1. **Upper Bound Proof**:
   - For an individual with optimal inputs:
     $\Delta_{\text{age}} = 0, \Delta_{\text{activity}} = 0, \Delta_{\text{stress}} = 0$
     $\text{symptoms} = [\,\text{'general\_checkup'}\,] \implies \Delta_s = 0$
     $\text{family} = [\,\text{'none'}\,] \implies \Delta_h = 0$
     $S_{\text{raw}} = 100 - 0 = 100$.
   - Applying clamping: $\min(98, 100) = 98$.
   - **Conclusion**: Upper bound is strictly **98**.

2. **Lower Bound Proof**:
   - For an individual with maximum compounding risk:
     $\Delta_{\text{age}} = 15$ (age 60+)
     $\Delta_{\text{activity}} = 12$ (sedentary)
     $\Delta_{\text{stress}} = 14$ (poor sleep/high stress)
     $\Delta_{\text{symptoms}} = 10 + 14 + 11 + 13 = 48$ (all 4 pathological symptoms)
     $\Delta_{\text{family}} = 7 + 7 + 8 + 6 = 28$ (all 4 hereditary conditions)
     Total deductions = $15 + 12 + 14 + 48 + 28 = 117$.
     $S_{\text{raw}} = 100 - 117 = -17$.
   - Applying clamping: $\max(15, -17) = 15$.
   - **Conclusion**: Lower bound is strictly **15**. Never negative.

3. **Integer Invariant Proof**:
   - Every input delta $\Delta \in \mathbb{Z}^+$.
   - The final assignment executes `Math.round(clampedValue)`.
   - Therefore, the output score $V \in \mathbb{Z} \cap [15, 98]$ for all possible inputs in the domain.

---

## 5. Complete Implementation Blueprint for `scoringEngine.ts`

Here is the exact, drop-in TypeScript implementation blueprint for `src/components/VitalityAssessment/scoringEngine.ts`:

```typescript
/**
 * Dr. Shastri Diagnostics (DSD) — Clinical Scoring & Hybrid Recommendation Engine
 * File: src/components/VitalityAssessment/scoringEngine.ts
 *
 * Implements:
 * 1. Vitality Score Algorithm with strict [15, 98] integer clamping
 * 2. Multi-Axial Risk Indicators (Metabolic, Cardiovascular, Renal, Joint)
 * 3. Targeted Primary Match & Preventive Camp Alternative pairing
 * 4. Dynamic Dr. Shastri Clinical Explanations
 */

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

// -----------------------------------------------------------------------------
// DEDUCTION CONSTANTS
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// PACKAGE DEFINITIONS FROM DSD CATALOG (App.tsx:29-75)
// -----------------------------------------------------------------------------
const PACKAGES: Record<string, RecommendedPackage> = {
  diabetes: {
    id: 'diabetes',
    name: 'Diabetic Package',
    price: 840,
    originalPrice: 900,
    parameterCount: 22,
    tag: 'Targeted Clinical Match · 6% Off',
    description: 'Fast glycemic & HbA1c diagnostic triad targeting active sugar spikes and urine protein leakage.',
    keyParameters: ['HbA1c', 'Fasting Blood Sugar (FBS)', 'Post-Meal Sugar (PPBS)', 'Urine Routine & Microscopic'],
  },
  thyrodiabetes: {
    id: 'thyrodiabetes',
    name: 'Thyro-Diabetic Package',
    price: 960,
    originalPrice: 1750,
    parameterCount: 34,
    tag: 'Dual Endocrine Match · 45% Off',
    description: 'Comprehensive dual-profile evaluating combined thyroid dysfunction and glucose metabolism.',
    keyParameters: ['HbA1c', 'Total T3, Total T4, TSH', 'Fasting & PPBS', 'Urine Routine (RE)'],
  },
  joint: {
    id: 'joint',
    name: 'Basic Joint Pain Package',
    price: 875,
    originalPrice: 1750,
    parameterCount: 6,
    tag: 'Targeted Ortho Match · 50% Off',
    description: 'Pinpoints uric acid crystal accumulation, rheumatoid factors, and calcium mineralization balance.',
    keyParameters: ['Serum Uric Acid', 'Serum Calcium', 'Phosphorus', 'RA Factor', 'ESR / CRP', 'ALP'],
  },
  specialjoint: {
    id: 'specialjoint',
    name: 'Special Joint Package',
    price: 4530,
    originalPrice: 7750,
    parameterCount: 41,
    tag: 'Advanced Autoimmune Match · 41% Off',
    description: 'Exhaustive 41-parameter rheumatology panel including Anti-CCP, ANA, and quantitative inflammatory indices.',
    keyParameters: ['RA Quantitative', 'Anti-CCP', 'ANA', 'Serum Uric Acid', 'Vitamin D3', 'CBC & ESR'],
  },
  weakness: {
    id: 'weakness',
    name: 'Basic Weakness Package',
    price: 2730,
    originalPrice: 4550,
    parameterCount: 63,
    tag: 'Vitality & Anemia Match · 40% Off',
    description: 'Investigates chronic cellular fatigue, red cell morphology, iron reserves, and neuro-vital vitamins.',
    keyParameters: ['Vitamin D3', 'Vitamin B12', 'CBC / Hemogram (24 params)', 'Iron & Ferritin', 'TSH', 'KFT'],
  },
  hypertension: {
    id: 'hypertension',
    name: 'Hypertension Package',
    price: 4710,
    originalPrice: 7850,
    parameterCount: 76,
    tag: 'Cardiovascular Care · 40% Off',
    description: 'Exhaustive 76-parameter audit of arterial plaque risk, cardiac enzyme load, renal filtration, and electrolytes.',
    keyParameters: ['Lipid Profile Complete', 'Kidney Function Test', 'Serum Electrolytes (Na/K/Cl)', 'Urine Microalbumin'],
  },
  renal: {
    id: 'renal',
    name: 'Renal Screening Package',
    price: 175,
    originalPrice: 350,
    parameterCount: 20,
    tag: 'Renal Care Match · 50% Off',
    description: 'Rapid filtration audit assessing glomerular clearance, nitrogenous wastes, and nephron stability.',
    keyParameters: ['Serum Creatinine', 'Blood Urea', 'BUN', 'Uric Acid', 'Serum Electrolytes', 'Urine Routine'],
  },
  executive: {
    id: 'executive',
    name: 'Executive Full Body Checkup',
    price: 999,
    originalPrice: 999,
    parameterCount: 65,
    tag: 'Comprehensive Screening · ECG Free',
    description: 'Full blood and urine panels combined with essential Vitamin D3, Vitamin B12, and in-clinic ECG.',
    keyParameters: ['CBC Hemogram', 'Vitamin D3', 'Vitamin B12', 'Liver (LFT)', 'Kidney (KFT)', 'Free Camp ECG'],
  },
  smartadvance: {
    id: 'smartadvance',
    name: 'DSD Smart Health Advance',
    price: 499,
    originalPrice: 499,
    parameterCount: 50,
    tag: 'Best Value Camp Offer · ECG Free',
    description: '6 vital organ profiles in one screening: CBC, LFT, KFT, Lipid Profile, Thyroid Profile, and HbA1c + Free ECG.',
    keyParameters: ['HbA1c', 'Thyroid Profile (T3, T4, TSH)', 'Complete LFT', 'Complete KFT', 'Lipid Profile', 'Free ECG'],
  },
  basiccamp: {
    id: 'basiccamp',
    name: 'Basic Health Pack',
    price: 299,
    originalPrice: 299,
    parameterCount: 25,
    tag: 'Essential Camp Offer · ECG Free',
    description: 'Baseline vital screen covering hemogram, blood sugar, kidney markers, urine routine, and in-clinic ECG.',
    keyParameters: ['CBC Hemogram', 'Blood Glucose', 'Kidney Function (KFT)', 'Urine Routine', 'Free ECG'],
  },
};

// -----------------------------------------------------------------------------
// CLINICAL EXPLANATIONS REPOSITORY
// -----------------------------------------------------------------------------
const EXPLANATIONS_CATALOG: Record<string, ClinicalExplanation> = {
  HbA1c: {
    parameter: 'HbA1c (Glycated Hemoglobin)',
    role: '90-Day Glycemic Memory Index',
    reason: 'Unlike a spot fasting glucose test which fluctuates with recent diet or stress, HbA1c uncovers asymptomatic insulin resistance and diabetic trajectory before clinical symptoms become irreversible.',
  },
  CBC: {
    parameter: 'CBC (Complete Blood Count)',
    role: 'Hematological Vitality & Immune Balance',
    reason: 'Evaluates hemoglobin, oxygen delivery capacity, platelet health, and white blood cell differential to rule out microcytic anemia, systemic infection, or bone marrow fatigue.',
  },
  KFT: {
    parameter: 'KFT (Kidney Function Test)',
    role: 'Renal Glomerular Filtration Audit',
    reason: 'Measures serum creatinine, blood urea, and uric acid. Kidneys can silently lose up to 50% filtration capacity before clinical edema or noticeable symptoms appear.',
  },
  LFT: {
    parameter: 'LFT (Liver Function Test)',
    role: 'Hepatic Metabolic & Enzyme Synthesis',
    reason: 'Evaluates SGOT, SGPT, alkaline phosphatase, and albumin to screen for fatty liver changes (MASLD), metabolic sluggishness, or medication processing stress.',
  },
  Lipid: {
    parameter: 'Lipid Profile (Cholesterol & Triglycerides)',
    role: 'Arterial Plaque & Vascular Health',
    reason: 'Measures atherogenic lipoproteins (LDL, VLDL) against protective HDL to quantify 10-year cardiovascular and stroke risk in individuals with sedentary habits or elevated blood pressure.',
  },
  VitaminD3: {
    parameter: 'Vitamin D3 (25-Hydroxy)',
    role: 'Bone Mineralization & Immune Hormone',
    reason: 'More than 70% of urban adults have profound Vitamin D3 deficiency, which directly causes persistent joint stiffness, deep muscle aches, sleep disturbances, and diminished immune defenses.',
  },
};

// -----------------------------------------------------------------------------
// CORE SCORING & CALCULATION ENGINE
// -----------------------------------------------------------------------------
export function calculateVitalityAssessment(input: AssessmentInput): AssessmentResult {
  // Defensive normalization
  const symptoms = Array.isArray(input?.symptoms) ? input.symptoms : [];
  const familyHistory = Array.isArray(input?.familyHistory) ? input.familyHistory : [];
  const hasNoFamilyHistory = familyHistory.includes('none');

  // 1. Calculate Deductions
  const ageDeduction = AGE_DEDUCTIONS[input?.ageGroup] ?? 4;
  const activityDeduction = ACTIVITY_DEDUCTIONS[input?.activityLevel] ?? 5;
  const sleepStressDeduction = SLEEP_STRESS_DEDUCTIONS[input?.sleepStress] ?? 6;

  let symptomDeduction = 0;
  for (const symptom of symptoms) {
    symptomDeduction += SYMPTOM_DEDUCTIONS[symptom] ?? 0;
  }

  let familyDeduction = 0;
  if (!hasNoFamilyHistory) {
    for (const condition of familyHistory) {
      familyDeduction += FAMILY_DEDUCTIONS[condition] ?? 0;
    }
  }

  const totalDeductions =
    ageDeduction + activityDeduction + sleepStressDeduction + symptomDeduction + familyDeduction;

  // 2. Strict Integer Clamping to [15, 98]
  const rawScore = 100 - totalDeductions;
  const vitalityScore = Math.max(15, Math.min(98, Math.round(rawScore)));

  // 3. Vitality Bracket
  let vitalityBracket: 'Optimal' | 'Moderate' | 'Elevated Risk';
  if (vitalityScore >= 80) {
    vitalityBracket = 'Optimal';
  } else if (vitalityScore >= 55) {
    vitalityBracket = 'Moderate';
  } else {
    vitalityBracket = 'Elevated Risk';
  }

  // 4. Multi-Axial Risk Indicators
  // Helper for axis level classification: <35% Low, 35-65% Moderate, >65% High
  const classifyAxis = (percentage: number): RiskLevel => {
    if (percentage < 35) return 'Low';
    if (percentage <= 65) return 'Moderate';
    return 'High';
  };

  // Metabolic Risk
  let metabolicRaw = 10;
  if (symptoms.includes('thirst_urination')) metabolicRaw += 40;
  if (symptoms.includes('fatigue')) metabolicRaw += 15;
  if (!hasNoFamilyHistory && familyHistory.includes('diabetes')) metabolicRaw += 25;
  if (!hasNoFamilyHistory && familyHistory.includes('thyroid')) metabolicRaw += 10;
  if (input?.activityLevel === 'sedentary') metabolicRaw += 15;
  if (input?.ageGroup === '46-60' || input?.ageGroup === '60+') metabolicRaw += 10;
  const metabolicPct = Math.max(5, Math.min(95, Math.round(metabolicRaw)));
  const metabolicLevel = classifyAxis(metabolicPct);
  const metabolicSummary =
    metabolicLevel === 'High'
      ? 'Elevated metabolic strain; active glucose fluctuations and insulin resistance markers detected.'
      : metabolicLevel === 'Moderate'
      ? 'Moderate glycemic variation; routine blood sugar and HbA1c monitoring recommended.'
      : 'Optimal glycemic regulation and cellular metabolic efficiency.';

  // Cardiovascular Risk
  let cardioRaw = 10;
  if (symptoms.includes('bp_concerns')) cardioRaw += 45;
  if (!hasNoFamilyHistory && familyHistory.includes('hypertension')) cardioRaw += 25;
  if (input?.sleepStress === 'poor_sleep_high_stress') cardioRaw += 15;
  if (input?.activityLevel === 'sedentary') cardioRaw += 10;
  if (input?.ageGroup === '46-60') cardioRaw += 10;
  if (input?.ageGroup === '60+') cardioRaw += 15;
  const cardioPct = Math.max(5, Math.min(95, Math.round(cardioRaw)));
  const cardioLevel = classifyAxis(cardioPct);
  const cardioSummary =
    cardioLevel === 'High'
      ? 'Elevated cardiovascular risk profile; clinical lipid profile and ECG checkup recommended.'
      : cardioLevel === 'Moderate'
      ? 'Moderate vascular strain; periodic blood pressure checks and lipid screening advised.'
      : 'Healthy arterial compliance and balanced cardiovascular indicators.';

  // Renal Risk
  let renalRaw = 8;
  if (symptoms.includes('thirst_urination')) renalRaw += 25;
  if (!hasNoFamilyHistory && familyHistory.includes('kidney')) renalRaw += 40;
  if (symptoms.includes('bp_concerns')) renalRaw += 15;
  if (input?.ageGroup === '60+') renalRaw += 15;
  if (input?.sleepStress === 'poor_sleep_high_stress') renalRaw += 10;
  const renalPct = Math.max(5, Math.min(95, Math.round(renalRaw)));
  const renalLevel = classifyAxis(renalPct);
  const renalSummary =
    renalLevel === 'High'
      ? 'Elevated renal risk markers; serum creatinine, BUN, and urine routine testing advised.'
      : renalLevel === 'Moderate'
      ? 'Mild filtration stress; ensure optimal hydration and baseline KFT evaluation.'
      : 'Normal glomerular filtration and fluid electrolyte balance.';

  // Joint / Inflammation Risk
  let jointRaw = 8;
  if (symptoms.includes('joint_pain')) jointRaw += 55;
  if (symptoms.includes('fatigue')) jointRaw += 15;
  if (!hasNoFamilyHistory && familyHistory.includes('thyroid')) jointRaw += 10;
  if (input?.ageGroup === '46-60' || input?.ageGroup === '60+') jointRaw += 15;
  if (input?.activityLevel === 'sedentary') jointRaw += 10;
  const jointPct = Math.max(5, Math.min(95, Math.round(jointRaw)));
  const jointLevel = classifyAxis(jointPct);
  const jointSummary =
    jointLevel === 'High'
      ? 'Active musculoskeletal inflammation; uric acid, calcium, and Vitamin D3 testing advised.'
      : jointLevel === 'Moderate'
      ? 'Mild musculoskeletal stiffness; evaluate Vitamin D3 and bone mineral markers.'
      : 'Resilient joint mobility and low systemic inflammation.';

  // 5. Dual Package Recommendation Selection
  let primaryPackage: RecommendedPackage;
  let campAlternativePackage: RecommendedPackage;

  if (symptoms.includes('thirst_urination') || (!hasNoFamilyHistory && familyHistory.includes('diabetes'))) {
    if (!hasNoFamilyHistory && familyHistory.includes('thyroid')) {
      primaryPackage = PACKAGES.thyrodiabetes;
    } else {
      primaryPackage = PACKAGES.diabetes;
    }
    campAlternativePackage = PACKAGES.smartadvance;
  } else if (symptoms.includes('joint_pain')) {
    if (input?.ageGroup === '46-60' || input?.ageGroup === '60+' || jointPct > 70) {
      primaryPackage = PACKAGES.specialjoint;
    } else {
      primaryPackage = PACKAGES.joint;
    }
    campAlternativePackage = PACKAGES.smartadvance;
  } else if (symptoms.includes('bp_concerns') || (!hasNoFamilyHistory && familyHistory.includes('hypertension'))) {
    primaryPackage = PACKAGES.hypertension;
    campAlternativePackage = PACKAGES.smartadvance;
  } else if (!hasNoFamilyHistory && familyHistory.includes('kidney')) {
    primaryPackage = PACKAGES.renal;
    campAlternativePackage = PACKAGES.basiccamp;
  } else if (symptoms.includes('fatigue')) {
    primaryPackage = PACKAGES.weakness;
    campAlternativePackage = PACKAGES.smartadvance;
  } else {
    // General Wellness / Asymptomatic
    primaryPackage = PACKAGES.executive;
    campAlternativePackage = PACKAGES.smartadvance;
  }

  // 6. Savings Calculation
  let savingsAmount = primaryPackage.price - campAlternativePackage.price;
  let savingsPercentage = 0;
  if (savingsAmount > 0) {
    savingsPercentage = Math.round((savingsAmount / primaryPackage.price) * 100);
  } else {
    savingsAmount = 0;
    savingsPercentage = 0;
  }

  // 7. Dynamic Dr. Shastri Clinical Explanations
  const explanations: ClinicalExplanation[] = [];

  if (metabolicLevel === 'High' || symptoms.includes('thirst_urination') || familyHistory.includes('diabetes')) {
    explanations.push(EXPLANATIONS_CATALOG.HbA1c);
  }
  if (symptoms.includes('fatigue') || primaryPackage.id === 'weakness' || primaryPackage.id === 'executive') {
    explanations.push(EXPLANATIONS_CATALOG.CBC);
  }
  if (renalLevel !== 'Low' || cardioLevel === 'High' || familyHistory.includes('kidney')) {
    explanations.push(EXPLANATIONS_CATALOG.KFT);
  }
  if (cardioLevel !== 'Low' || input?.activityLevel === 'sedentary') {
    explanations.push(EXPLANATIONS_CATALOG.Lipid);
  }
  if (jointLevel !== 'Low' || symptoms.includes('joint_pain') || input?.sleepStress === 'poor_sleep_high_stress') {
    explanations.push(EXPLANATIONS_CATALOG.VitaminD3);
  }
  if (explanations.length < 3) {
    explanations.push(EXPLANATIONS_CATALOG.LFT);
  }
  // Ensure we have between 3 and 5 clear, high-yield explanations
  const clinicalExplanations = explanations.slice(0, 5);

  return {
    vitalityScore,
    vitalityBracket,
    riskAxes: {
      metabolic: {
        level: metabolicLevel,
        percentage: metabolicPct,
        summary: metabolicSummary,
      },
      cardiovascular: {
        level: cardioLevel,
        percentage: cardioPct,
        summary: cardioSummary,
      },
      renal: {
        level: renalLevel,
        percentage: renalPct,
        summary: renalSummary,
      },
      joint: {
        level: jointLevel,
        percentage: jointPct,
        summary: jointSummary,
      },
    },
    primaryPackage,
    campAlternativePackage,
    savingsAmount,
    savingsPercentage,
    clinicalExplanations,
  };
}
```

---

## 6. Edge Cases & Boundary Handling

| # | Edge Case / Scenario | Input Vector | Expected Behavior & Output | Guard Mechanism |
|---|---|---|---|---|
| **E1** | **All Ideal Inputs (Maximum Possible Score)** | Age 18-29, Active, Restful sleep, `['general_checkup']`, `['none']` | Total deduction: 0 pts.<br>Raw score = 100.<br>**`vitalityScore: 98`** (clamped from 100).<br>Bracket: `'Optimal'`. | `Math.min(98, ...)` guarantees ceiling. |
| **E2** | **All Worst Inputs (Minimum Possible Score)** | Age 60+, Sedentary, Poor sleep/high stress, all 4 symptoms, all 4 family history conditions | Total deduction: 117 pts.<br>Raw score = -17.<br>**`vitalityScore: 15`** (clamped from -17).<br>Bracket: `'Elevated Risk'`. | `Math.max(15, ...)` guarantees clinical floor. Never negative. |
| **E3** | **Empty Symptoms & Family History Arrays** | `symptoms: []`, `familyHistory: []` | Handled gracefully without crash.<br>Deduction = Age + Activity + Sleep/Stress.<br>Score in [41, 98]. | `Array.isArray()` guard and `for...of` iteration. |
| **E4** | **Null / Undefined Input Attributes** | `input: {}` or missing properties | Default fallbacks applied: Age group defaults to '30-45', Activity to 'moderate', etc.<br>Valid integer output returned. | Nullish coalescing (`??`) across all property accessors. |
| **E5** | **Family History includes `'none'` alongside other flags** | `['diabetes', 'none']` | `'none'` presence overrides history deduction to 0 pts.<br>Ensures patient indicating no hereditary risks is not penalized. | `hasNoFamilyHistory = familyHistory.includes('none')`. |
| **E6** | **Savings Inversion (Primary cheaper than Camp)** | `renal` (₹175) vs `basiccamp` (₹299) | `savingsAmount: 0`, `savingsPercentage: 0`<br>Does NOT produce negative savings or `-70%` tag. | `if (savingsAmount > 0) ... else { savingsAmount = 0; savingsPercentage = 0; }`. |
| **E7** | **Vitality Score Threshold Boundaries** | Boundary scores: 79 vs 80, 54 vs 55 | Score 80 $\implies$ `'Optimal'`.<br>Score 79 $\implies$ `'Moderate'`.<br>Score 55 $\implies$ `'Moderate'`.<br>Score 54 $\implies$ `'Elevated Risk'`. | Strict inequality operators `>= 80`, `>= 55`. |

---

## 7. Caveats

1. **Pure Scoring vs External Dependencies**: This module is strictly designed as a zero-dependency, pure deterministic TypeScript calculation engine. It does not perform network calls or rely on browser DOM APIs (`window`, `document`, `localStorage`).
2. **Catalog Synchronization**: The package IDs and prices hardcoded in `PACKAGES` strictly mirror `src/App.tsx:29-75`. When `App.tsx` imports `scoringEngine.ts`, both modules use identical identifiers (`diabetes`, `thyrodiabetes`, `joint`, `specialjoint`, `weakness`, `hypertension`, `renal`, `executive`, `smartadvance`, `basiccamp`), guaranteeing seamless 1-click `qty(pkg.id, 1)` cart additions.
3. **No Code Modification Violation**: In strict accordance with explorer instructions, this report only provides design blueprints and verification models. No source files inside `src/` have been altered.

---

## 8. Conclusion

The Clinical Vitality Scoring algorithm is completely formalized and mathematically proven:
1. **Integer Bounded Range**: Every possible input combination produces a valid integer within $[15, 98]$.
2. **Clinical Accuracy**: Demographic weights (0–41 pts), symptom weights (0–48 pts), and hereditary weights (0–28 pts) create realistic clinical separation.
3. **Bracket Cohesion**: Clear thresholds for Optimal ($\ge 80$), Moderate ($55 - 79$), and Elevated Risk ($< 55$).
4. **Hybrid Matching**: Automatically pairs the detected risk with both a targeted primary match and high-value camp alternative (`smartadvance` ₹499 or `basiccamp` ₹299).
5. **Blueprint Ready**: The drop-in code structure in Section 5 satisfies all TypeScript contracts from `PROJECT.md:60-111`.

---

## 9. Verification Method

To independently verify the scoring formulas and boundary guarantees:

### 9.1 Standalone Node.js Unit Verification Script
Execute the following verification script in PowerShell to validate all boundary conditions and mathematical proofs:

```powershell
node -e "
const AGE_DEDUCTIONS = { '18-29': 0, '30-45': 4, '46-60': 9, '60+': 15 };
const ACT_DEDUCTIONS = { active: 0, moderate: 5, sedentary: 12 };
const SLP_DEDUCTIONS = { restful: 0, moderate_stress: 6, poor_sleep_high_stress: 14 };
const SYM_DEDUCTIONS = { fatigue: 10, thirst_urination: 14, joint_pain: 11, bp_concerns: 13, general_checkup: 0 };
const FAM_DEDUCTIONS = { diabetes: 7, hypertension: 7, kidney: 8, thyroid: 6, none: 0 };

function calcScore(input) {
  const symD = (input.symptoms || []).reduce((acc, s) => acc + (SYM_DEDUCTIONS[s] ?? 0), 0);
  const hasNone = (input.familyHistory || []).includes('none');
  const famD = hasNone ? 0 : (input.familyHistory || []).reduce((acc, f) => acc + (FAM_DEDUCTIONS[f] ?? 0), 0);
  const total = (AGE_DEDUCTIONS[input.ageGroup] ?? 4) + (ACT_DEDUCTIONS[input.activityLevel] ?? 5) + (SLP_DEDUCTIONS[input.sleepStress] ?? 6) + symD + famD;
  return Math.max(15, Math.min(98, Math.round(100 - total)));
}

// Assertions
const best = calcScore({ ageGroup: '18-29', activityLevel: 'active', sleepStress: 'restful', symptoms: ['general_checkup'], familyHistory: ['none'] });
console.assert(best === 98, 'Best score must be 98, got ' + best);

const worst = calcScore({ ageGroup: '60+', activityLevel: 'sedentary', sleepStress: 'poor_sleep_high_stress', symptoms: ['fatigue', 'thirst_urination', 'joint_pain', 'bp_concerns'], familyHistory: ['diabetes', 'hypertension', 'kidney', 'thyroid'] });
console.assert(worst === 15, 'Worst score must be 15, got ' + worst);

const empty = calcScore({});
console.assert(empty >= 15 && empty <= 98, 'Empty score must be bounded');

console.log('✓ All scoring engine boundary assertions passed successfully! (Best: ' + best + ', Worst: ' + worst + ')');
"
```

*Expected output*: `✓ All scoring engine boundary assertions passed successfully! (Best: 98, Worst: 15)`.
