# Milestone 3 Architecture & Specification: 3-Step Clinical Quiz State Machine

**Component Target**: `src/components/VitalityAssessment/VitalityAssessment.tsx`  
**Styles Target**: `src/components/VitalityAssessment/vitality-assessment.css`  
**Explorer**: `m3_explorer_quiz_flow`  
**Date**: 2026-10-25  

---

## 1. Executive Summary & Design Philosophy

The **Vitality Assessment Quiz Flow** is a 60-second, 3-step interactive clinical diagnostic instrument designed for the Dr. Shastri Diagnostics (DSD Care) patient booking portal. It translates raw patient demographics, everyday lifestyle habits, presenting symptoms, and hereditary clinical history into a multi-axial health risk analysis and an Overall Vitality Score (strictly bounded to $[15, 98]$ on a 0–100 scale).

The quiz interface must embody:
1. **Clinical Rigor & Zero Ambiguity**: Deterministic validation gates ensuring no unvalidated or malformed states can proceed to clinical scoring.
2. **Awwwards-Grade Motion ($k=300, c=30, m=1$)**: Natural spring physics transitions with $1.05\times$ subtle overshoot for dials, progress indicators, and interactive cards.
3. **Dark Glassmorphic Tactility**: 28px blur backdrop surfaces, specular top-lit highlights, ambient occlusion shadows, and subtle emerald glow halos (`#48ed86`).
4. **Strict Accessibility & Mobile Ergonomics (WCAG AA & F9)**: All touch targets $\ge 44\text{px}$, `pb-24` clearance for the fixed 56px mobile dock, full keyboard navigation (`Tab`, `Space`, `Enter`), and automatic reduced-motion bypass.

---

## 2. Quiz State Machine Specification

### 2.1 State Representation & Type Definitions

```typescript
/**
 * src/components/VitalityAssessment/types.ts
 */

import {
  AssessmentInput,
  AssessmentResult,
  RiskLevel,
  RiskAxis,
  RecommendedPackage,
  ClinicalExplanation
} from './scoringEngine';

export type QuizStep = 1 | 2 | 3;
export type QuizStatus = 'in_progress' | 'calculating' | 'completed';
export type NavigationDirection = 'forward' | 'backward';

export interface QuizState {
  currentStep: QuizStep;
  status: QuizStatus;
  direction: NavigationDirection;
  
  // Step 1: Demographics & Lifestyle
  ageGroup: '18-29' | '30-45' | '46-60' | '60+' | null;
  gender: 'male' | 'female' | 'other' | null;
  activityLevel: 'sedentary' | 'moderate' | 'active' | null;
  sleepStress: 'restful' | 'moderate_stress' | 'poor_sleep_high_stress' | null;
  
  // Step 2: Primary Symptoms & Concerns
  symptoms: Array<'fatigue' | 'thirst_urination' | 'joint_pain' | 'bp_concerns' | 'general_checkup'>;
  
  // Step 3: Family Medical History
  familyHistory: Array<'diabetes' | 'hypertension' | 'kidney' | 'thyroid' | 'none'>;
  
  // Computed Clinical Output
  result: AssessmentResult | null;
  
  // Step Validation Tracking
  stepValidationErrors: {
    step1?: string[];
    step2?: string;
    step3?: string;
  };
}

export type QuizAction =
  | { type: 'SET_FIELD'; field: 'ageGroup'; value: '18-29' | '30-45' | '46-60' | '60+' }
  | { type: 'SET_FIELD'; field: 'gender'; value: 'male' | 'female' | 'other' }
  | { type: 'SET_FIELD'; field: 'activityLevel'; value: 'sedentary' | 'moderate' | 'active' }
  | { type: 'SET_FIELD'; field: 'sleepStress'; value: 'restful' | 'moderate_stress' | 'poor_sleep_high_stress' }
  | { type: 'TOGGLE_SYMPTOM'; value: 'fatigue' | 'thirst_urination' | 'joint_pain' | 'bp_concerns' | 'general_checkup' }
  | { type: 'TOGGLE_FAMILY_HISTORY'; value: 'diabetes' | 'hypertension' | 'kidney' | 'thyroid' | 'none' }
  | { type: 'GO_TO_STEP'; step: QuizStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'START_CALCULATION' }
  | { type: 'COMPLETE_CALCULATION'; result: AssessmentResult }
  | { type: 'RESET_QUIZ' }
  | { type: 'RETAKE_WITH_PREVIOUS' };
```

---

### 2.2 Initial State & Reducer Implementation Design

```typescript
export const INITIAL_QUIZ_STATE: QuizState = {
  currentStep: 1,
  status: 'in_progress',
  direction: 'forward',
  ageGroup: null,
  gender: null,
  activityLevel: null,
  sleepStress: null,
  symptoms: [],
  familyHistory: [],
  result: null,
  stepValidationErrors: {}
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_FIELD': {
      return {
        ...state,
        [action.field]: action.value,
        stepValidationErrors: {
          ...state.stepValidationErrors,
          step1: undefined
        }
      };
    }

    case 'TOGGLE_SYMPTOM': {
      const sym = action.value;
      let nextSymptoms: QuizState['symptoms'];

      if (sym === 'general_checkup') {
        // Exclusivity: General Checkup clears all specific ailments
        nextSymptoms = state.symptoms.includes('general_checkup') ? [] : ['general_checkup'];
      } else {
        // Selecting a specific symptom automatically drops 'general_checkup'
        const filtered = state.symptoms.filter(s => s !== 'general_checkup');
        if (filtered.includes(sym)) {
          nextSymptoms = filtered.filter(s => s !== sym);
        } else {
          nextSymptoms = [...filtered, sym];
        }
      }

      return {
        ...state,
        symptoms: nextSymptoms,
        stepValidationErrors: {
          ...state.stepValidationErrors,
          step2: undefined
        }
      };
    }

    case 'TOGGLE_FAMILY_HISTORY': {
      const cond = action.value;
      let nextHistory: QuizState['familyHistory'];

      if (cond === 'none') {
        // Exclusivity: 'none' clears all specific medical history
        nextHistory = state.familyHistory.includes('none') ? [] : ['none'];
      } else {
        // Selecting a specific condition drops 'none'
        const filtered = state.familyHistory.filter(c => c !== 'none');
        if (filtered.includes(cond)) {
          nextHistory = filtered.filter(c => c !== cond);
        } else {
          nextHistory = [...filtered, cond];
        }
      }

      return {
        ...state,
        familyHistory: nextHistory,
        stepValidationErrors: {
          ...state.stepValidationErrors,
          step3: undefined
        }
      };
    }

    case 'GO_TO_STEP': {
      if (action.step === state.currentStep) return state;
      const direction = action.step > state.currentStep ? 'forward' : 'backward';
      return {
        ...state,
        currentStep: action.step,
        direction
      };
    }

    case 'NEXT_STEP': {
      if (state.currentStep >= 3) return state;
      return {
        ...state,
        currentStep: (state.currentStep + 1) as QuizStep,
        direction: 'forward'
      };
    }

    case 'PREV_STEP': {
      if (state.currentStep <= 1) return state;
      return {
        ...state,
        currentStep: (state.currentStep - 1) as QuizStep,
        direction: 'backward'
      };
    }

    case 'START_CALCULATION': {
      return {
        ...state,
        status: 'calculating'
      };
    }

    case 'COMPLETE_CALCULATION': {
      return {
        ...state,
        status: 'completed',
        result: action.result
      };
    }

    case 'RESET_QUIZ': {
      return {
        ...INITIAL_QUIZ_STATE
      };
    }

    case 'RETAKE_WITH_PREVIOUS': {
      return {
        ...state,
        currentStep: 1,
        status: 'in_progress',
        direction: 'backward',
        result: null
      };
    }

    default:
      return state;
  }
}
```

---

## 3. Step Progression & Field Validation Matrix

| Step | Scope | Required Fields | Validation Rule | Exclusivity Rules | Error State Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Demographics & Lifestyle | `ageGroup`, `gender`, `activityLevel`, `sleepStress` | `ageGroup !== null && gender !== null && activityLevel !== null && sleepStress !== null` | Single choice per group (`radio` behavior). Each group must have 1 active selection. | "Next: Symptoms & Concerns" disabled with visual prompt (`opacity-50 pointer-events-none`). Highlights incomplete radio clusters. |
| **Step 2** | Primary Symptoms & Concerns | `symptoms` array | `symptoms.length > 0` | Multi-select chips. `general_checkup` is mutually exclusive with specific symptoms (`fatigue`, `thirst_urination`, `joint_pain`, `bp_concerns`). | "Next: Family Medical History" disabled until at least 1 symptom or "General Checkup" is toggled. |
| **Step 3** | Family Medical History | `familyHistory` array | `familyHistory.length > 0` | Multi-select chips. `none` is mutually exclusive with specific conditions (`diabetes`, `hypertension`, `kidney`, `thyroid`). | "Calculate My Vitality Score" button disabled until at least 1 condition or "None" is selected. |

---

## 4. Complete Option Catalog & Clinical Mapping

### 4.1 Step 1: Demographics & Lifestyle
```typescript
export const STEP1_OPTIONS = {
  ageGroup: [
    { value: '18-29', label: '18–29 yrs', desc: 'Young adult physiological baseline' },
    { value: '30-45', label: '30–45 yrs', desc: 'Early metabolic & lifestyle vigilance' },
    { value: '46-60', label: '46–60 yrs', desc: 'Midlife cardiovascular & endocrine care' },
    { value: '60+', label: '60+ yrs', desc: 'Comprehensive senior health monitoring' },
  ],
  gender: [
    { value: 'male', label: 'Male', desc: 'Cardiovascular & metabolic reference' },
    { value: 'female', label: 'Female', desc: 'Endocrine & musculoskeletal reference' },
    { value: 'other', label: 'Other', desc: 'Inclusive clinical baseline' },
  ],
  activityLevel: [
    { value: 'active', label: 'Active', desc: 'Daily exercise, sports, or high movement' },
    { value: 'moderate', label: 'Moderate', desc: 'Light workouts, walking 2–3x weekly' },
    { value: 'sedentary', label: 'Sedentary', desc: 'Desk bound, <3,000 steps per day' },
  ],
  sleepStress: [
    { value: 'restful', label: 'Restful Sleep', desc: '7–8 hours restful sleep, manageable stress' },
    { value: 'moderate_stress', label: 'Moderate Stress', desc: 'Occasional sleep disruption or fatigue' },
    { value: 'poor_sleep_high_stress', label: 'Poor Sleep & High Stress', desc: '<6 hours sleep, chronic mental or physical exhaustion' },
  ],
} as const;
```

### 4.2 Step 2: Primary Symptoms & Concerns
```typescript
export const STEP2_OPTIONS = [
  {
    value: 'fatigue',
    label: 'Fatigue & Low Stamina',
    sublabel: 'Daytime sluggishness, unexplained tiredness, or slow recovery',
    icon: 'Activity',
    clinicalImpact: 'Triggers CBC hemogram, Vitamin D3/B12, and LFT profile evaluations.'
  },
  {
    value: 'thirst_urination',
    label: 'Frequent Thirst / Nocturia',
    sublabel: 'Frequent urination, dry mouth, or elevated fluid thirst',
    icon: 'Droplets',
    clinicalImpact: 'Strong metabolic risk marker; triggers HbA1c HPLC and Diabetic Package.'
  },
  {
    value: 'joint_pain',
    label: 'Joint Stiffness & Pain',
    sublabel: 'Morning joint stiffness, crepitus, knee or lower back aches',
    icon: 'Bone',
    clinicalImpact: 'Inflammatory and musculoskeletal marker; triggers Uric Acid, Calcium & Joint Panels.'
  },
  {
    value: 'bp_concerns',
    label: 'Blood Pressure Concerns',
    sublabel: 'High BP readings, dizziness, throbbing temples or vascular strain',
    icon: 'HeartPulse',
    clinicalImpact: 'Cardiovascular & hemodynamic indicator; triggers complete Lipid Profile & KFT.'
  },
  {
    value: 'general_checkup',
    label: 'General Preventive Health Checkup',
    sublabel: 'No active acute symptoms; seeking routine annual health audit',
    icon: 'ShieldCheck',
    clinicalImpact: 'Zero deduction baseline; matches Executive Full Body Checkup or Smart Advance.'
  },
] as const;
```

### 4.3 Step 3: Family Medical History
```typescript
export const STEP3_OPTIONS = [
  {
    value: 'diabetes',
    label: 'Diabetes / High Blood Sugar',
    sublabel: 'First-degree relative (parent/sibling) with Type 2 Diabetes',
    icon: 'Activity',
    clinicalImpact: 'Adds +25% hereditary metabolic vulnerability; triggers early HbA1c screening.'
  },
  {
    value: 'hypertension',
    label: 'Hypertension / Heart Disease',
    sublabel: 'Immediate family history of hypertension, stroke, or heart event',
    icon: 'Heart',
    clinicalImpact: 'Adds +26% cardiovascular risk load; triggers lipid and renal arterial tracking.'
  },
  {
    value: 'kidney',
    label: 'Kidney Conditions / Stones',
    sublabel: 'Familial history of chronic kidney disease or recurring stones',
    icon: 'Filter',
    clinicalImpact: 'Adds +32% renal risk; triggers Serum Creatinine, Urea, and Renal Screening.'
  },
  {
    value: 'thyroid',
    label: 'Thyroid Conditions',
    sublabel: 'Family history of hypothyroidism, hyperthyroidism, or goiter',
    icon: 'Stethoscope',
    clinicalImpact: 'Triggers Thyroid Profile (T3, T4, TSH) alongside metabolic screening.'
  },
  {
    value: 'none',
    label: 'No Known Family History',
    sublabel: 'No diagnosed chronic hereditary ailments in immediate family',
    icon: 'CheckCircle',
    clinicalImpact: 'Provides -5% protective offset across metabolic, cardio, and renal axes.'
  },
] as const;
```

---

## 5. Spring Physics & Micro-Interaction Specifications

### 5.1 Spring Parameter Constants
As specified in R3 and `PROJECT.md:F6`:
- **Stiffness ($k$)**: `300`
- **Damping ($c$)**: `30` (or `22.8` for $1.05\times$ subtle overshoot)
- **Mass ($m$)**: `1`
- **Integration**: Damped harmonic oscillator ODE implemented via `useSpringValue.ts`.

### 5.2 Micro-Interactions Matrix
| Element | Interaction | Animation Parameters | Visual State |
| :--- | :--- | :--- | :--- |
| **Progress Bar** | Step progression ($33\% \to 66\% \to 100\%$) | `useSpringValue(targetPercent, { stiffness: 300, damping: 30 })` | Gradient fill `from-[#48ed86] to-[#10b981]` with soft photon aura (`box-shadow: 0 0 10px rgba(72,237,134,0.4)`). |
| **Option Cards** | Hover / Focus | `transform: translateY(-2px) scale(1.015)` (180ms ease-out) | Specular top-lit border (`rgba(255,255,255,0.2)`), inner glow tint (`rgba(72,237,134,0.08)`). |
| **Option Cards** | Active (Click/Press) | `transform: translateY(0px) scale(0.98)` (80ms ease-in) | Sinks into surface with tactile damping. |
| **Selected State** | Toggle ON | Spring pulse (`scale(1.02) -> scale(1.0)`) | Active emerald border (`#48ed86`), background `rgba(72,237,134,0.12)`, glowing checkmark badge. |
| **Step Transitions** | Step Forward / Back | Slide-fade transition | Forward: enter from `translateX(24px)` with opacity fade ($0 \to 1$); Backward: enter from `translateX(-24px)`. |
| **Score Gauge** | Calculation Complete | Spring dial sweep from 0 to `vitalityScore` | Head particle glowing tip tracks circular arc ($r=92\text{px}$) with live integer counter. |

---

## 6. Accessibility & Mobile Responsiveness (WCAG AA & F9)

1. **Touch Target Dimensions**:
   - Every selectable radio card, chip, button, and navigation arrow has a computed height of $\ge 44\text{px}$ (`min-height: 44px;`).
   - Padding rhythm on mobile: `p-3.5` to `p-4` with minimum gap of `8px` between adjacent interactive targets.
2. **Mobile Dock Clearance**:
   - The assessment wrapper must enforce `pb-24` (or `padding-bottom: 96px;`) on mobile viewports ($\le 768\text{px}$) to prevent occlusion by the 56px fixed `.mobileDock`.
3. **Contrast Compliance (WCAG AA)**:
   - Primary text (`#ffffff` and `#f1f3f2`): Contrast $> 18:1$ on dark glass (`#0c1720`).
   - Subtitles & muted labels (`#a7bbaa` and `#9ca5a0`): Contrast $> 5.8:1$.
   - Emerald brand accent (`#48ed86`): Contrast $> 10.2:1$ against obsidian base.
4. **ARIA Roles & Keyboard Navigation**:
   - Step 1: `role="radiogroup"` with individual options bearing `role="radio"`, `aria-checked={isSelected}`, and `tabIndex={isSelected ? 0 : -1}`.
   - Steps 2 & 3: `role="group"` with chips bearing `role="checkbox"`, `aria-checked={isSelected}`, and full `Space` / `Enter` toggle handling.
   - Step indicator: Screen reader live region (`aria-live="polite"`).
   - Radial Gauge: `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
5. **Reduced Motion**:
   - `@media (prefers-reduced-motion: reduce)` removes all CSS transforms and transitions (`transition: none !important; animation: none !important;`), while `useSpringValue` immediately snaps to target values.

---

## 7. Portal Integration & Cart Synchronization

### 7.1 Component Interface Contract
```typescript
export interface VitalityAssessmentProps {
  /**
   * Invoked when patient clicks 'Add to Cart' or 'Add Camp Alternative'.
   * Synchronizes with App.tsx cart state: qty(packageId, 1).
   */
  onAddToCart: (packageId: string) => void;
  
  /**
   * Optional direct booking handler (e.g. opens booking modal directly).
   */
  onBookPackage?: (packageId: string) => void;
  
  /**
   * Custom outer container styling override.
   */
  className?: string;
}
```

### 7.2 Action Workflow
1. Patient completes Step 3 and clicks **"Calculate My Vitality Score ✨"**.
2. State transitions to `status = 'calculating'` with a brief 500ms synthesis pulse.
3. Engine runs `calculateVitalityAssessment(answers)`:
   - Returns bounded `vitalityScore` ($[15, 98]$), 4 risk axes, primary package match, and camp alternative.
4. Component transitions to `status = 'completed'` and renders the results panel.
5. Patient clicks **"Add to Cart (₹840)"** on the Primary Match:
   - Triggers `onAddToCart('diabetes')`.
   - In `App.tsx`: calls `qty('diabetes', 1)`.
   - Floating cart badge immediately updates from `0` to `1`.
   - Toast notification appears: "Diabetic Package added to your cart."
6. Patient can alternatively click **"Add Camp Alternative (₹499)"**:
   - Triggers `onAddToCart('smartadvance')`.
   - Cart badge increments; WhatsApp booking payload serializes the savings tag.

---

## 8. Summary of Implementation Recommendations for Implementer

1. **Keep Component Self-Contained**: Place `VitalityAssessment.tsx` and `vitality-assessment.css` in `src/components/VitalityAssessment/`.
2. **Leverage Pre-Built Physics**: Import `useSpringValue` directly from `./useSpringValue` (no extra external libraries required).
3. **Reuse Existing Radial Gauge**: Import `<RadialScoreGauge />` directly from `./RadialScoreGauge`.
4. **Pure State Reducer**: Use the provided `quizReducer` and initial state for robust multi-step navigation, back-tracking without data loss, and exclusivity toggles.
5. **Glassmorphism Styling**: Follow the exact CSS tokens (`backdrop-filter: blur(28px)`, specular borders, ambient shadows) in `vitality-assessment.css`.
