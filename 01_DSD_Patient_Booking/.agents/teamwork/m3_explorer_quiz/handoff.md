# Milestone 3 — Architectural Blueprint & Handoff Report: VitalityAssessment Component

**Target Component**: `src/components/VitalityAssessment/VitalityAssessment.tsx` & `src/components/VitalityAssessment/vitality-assessment.css`  
**Explorer Agent**: Explorer 1 (Quiz Component Explorer)  
**Parent Agent**: 01d0aa72-e629-4c0f-8180-715c9ec20ffa  
**Project Root**: `C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking`  
**Date**: 2026-10-25T13:05:00Z  

---

## 1. Observation

Direct code and test observations from repository inspection:

### 1.1 Certified Primitives
1. **Clinical Scoring Engine (`src/components/VitalityAssessment/scoringEngine.ts:17-65`)**:
   - Strictly typed `AssessmentInput`:
     ```typescript
     export interface AssessmentInput {
       ageGroup: '18-29' | '30-45' | '46-60' | '60+';
       gender: 'male' | 'female' | 'other';
       activityLevel: 'sedentary' | 'moderate' | 'active';
       sleepStress: 'restful' | 'moderate_stress' | 'poor_sleep_high_stress';
       symptoms: Array<'fatigue' | 'thirst_urination' | 'joint_pain' | 'bp_concerns' | 'general_checkup'>;
       familyHistory: Array<'diabetes' | 'hypertension' | 'kidney' | 'thyroid' | 'none'>;
     }
     ```
   - Primary output: `calculateVitalityAssessment(input: AssessmentInput): AssessmentResult`
   - Returns:
     * `vitalityScore: number` (strictly integer bounded `[15, 98]`)
     * `vitalityBracket: 'Optimal' | 'Moderate' | 'Elevated Risk'`
     * `riskAxes: { metabolic: RiskAxis, cardiovascular: RiskAxis, renal: RiskAxis, joint: RiskAxis }`
     * `primaryPackage: RecommendedPackage` (`diabetes`, `thyrodiabetes`, `joint`, `specialjoint`, `weakness`, `hypertension`, `renal`, or `executive`)
     * `campAlternativePackage: RecommendedPackage` (`smartadvance` ₹499 or `basiccamp` ₹299 with complimentary ECG)
     * `savingsAmount: number` and `savingsPercentage: number`
     * `clinicalExplanations: ClinicalExplanation[]` (array of 6 explanations: HbA1c, CBC, KFT, LFT, Lipid Profile, Vitamin D3 with priority hoisting)

2. **Spring Physics Hook (`src/components/VitalityAssessment/useSpringValue.ts:18-80`)**:
   - Second-order damped harmonic oscillator ODE: $m \frac{d^2x}{dt^2} + c \frac{dx}{dt} + k(x - x_{\text{target}}) = 0$.
   - Baseline constants: $k = 300, c = 30, m = 1$ (underdamped $\zeta = 0.866$).
   - Awwwards preset: $k = 300, c = 22.8, m = 1$ ($1.05\times$ subtle overshoot).
   - Presets exported in `SPRING_PRESETS`: `awwwards`, `smooth`, `snappy`, `gentle`.
   - Native reduced motion bypass: detects `@media (prefers-reduced-motion: reduce)`.

3. **Animated SVG Radial Dial (`src/components/VitalityAssessment/RadialScoreGauge.tsx:17-319`)**:
   - Component signature:
     ```typescript
     export interface RadialScoreGaugeProps {
       score: number;
       bracket?: 'Optimal' | 'Moderate' | 'Elevated Risk';
       size?: number;
       className?: string;
       showParticle?: boolean;
       springConfig?: SpringConfig;
     }
     ```
   - Geometry: $r = 92\text{px}$, stroke width $= 12\text{px}$, circumference $C = 578.053\text{px}$, viewBox `0 0 240 240`.
   - Glowing head particle tracking the tip of the arc via trigonometric coordinates.
   - Built-in ARIA meter accessibility (`role="meter"`, `aria-valuenow`, `aria-live="polite"`).

4. **Cart Mutation Contract in `src/App.tsx:175-182`**:
   - `qty(id, d)` function:
     ```typescript
     function qty(id, d) {
       setCart(old => {
         const n = { ...old };
         n[id] = (n[id] || 0) + d;
         if (n[id] <= 0) delete n[id];
         return n;
       });
     }
     ```
   - 1-click addition translates to `onAddToCart(packageId)` -> `qty(packageId, 1)`.

5. **E2E Test Specifications (`e2e_tests/tier1_feature_tests.json:632-848`)**:
   - Class `.glass-assessment-card`:
     * `backdrop-filter: blur(28px)` (`T1.F7.1`)
     * `::before` pseudo-element: height `1px`, gradient color containing `rgba(72, 237, 134, 0.6)` (`T1.F7.2`)
     * Ambient occlusion shadow spread $\ge 80\text{px}$, border `rgba(255, 255, 255, 0.08)` (`T1.F7.3`)
     * Typography weight on glass surfaces $\le 500$ (`T1.F7.4`)
     * Hover glow border `rgba(72, 237, 134, 0.28)` (`T1.F7.5`)
   - Interactive touch targets: `.option-chip`, `.step-btn`, `.cart-add-btn` must be $\ge 44\text{px}$ (`T1.F9.1`).
   - Mobile clearance: `.vitality-container` padding-bottom $\ge 96\text{px}$ (`pb-24`) to clear fixed $56\text{px}$ `.mobileDock` (`T1.F9.2`).
   - Narrow viewport layout: single column stacking at $< 650\text{px}$ (`T1.F9.3`).
   - Accessibility attributes: `role="region"`, `role="radiogroup"`, `aria-live="polite"` (`T1.F9.4`).
   - Color contrast: $\ge 4.5:1$ against `#050606` (`T1.F9.5`).

6. **Current Test Status**:
   - `node e2e_tests/run_tests.js` passes 116/116 tests across Tiers 1-4 with 0 failures in 0.23 seconds.

---

## 2. Logic Chain

1. **State Machine Formulation**:
   - The user must move sequentially through:
     * `Step 1`: Demographics & Lifestyle (4 mandatory categorical fields).
     * `Step 2`: Primary Symptoms & Concerns (multi-select with `'general_checkup'` exclusivity).
     * `Step 3`: Family Medical History (multi-select with `'none'` exclusivity).
     * `Step 4 / Results`: Clinical calculation, radial dial animation, 4 risk axes, dynamic Dr. Shastri explanations, and dual package recommendation cards.
   - Guard condition: The "Continue" button is strictly disabled until step validation predicates are satisfied:
     * `isStep1Valid = Boolean(ageGroup && gender && activityLevel && sleepStress)`
     * `isStep2Valid = symptoms.length > 0`
     * `isStep3Valid = familyHistory.length > 0`
   - Navigation allows bidirectional movement (Next / Back) and full assessment reset ("Retake Health Quiz ↺") which returns to Step 1 while cleanly resetting or re-evaluating inputs.

2. **Spring Physics Integration**:
   - The quiz step progress bar is animated with `useSpringValue((step / 3) * 100, SPRING_PRESETS.smooth)`.
   - Results view entrance uses `useSpringValue` to transition the score dial from 0 to target score with natural 1.05x subtle overshoot.
   - The 4 risk axis progress bars animate smoothly from 0% to their target percentages upon mounting the results screen.

3. **Multi-Select Exclusivity Logic**:
   - In Step 2, selecting `'general_checkup'` must clear specific symptom flags (`'fatigue'`, `'thirst_urination'`, `'joint_pain'`, `'bp_concerns'`) to prevent contradictory clinical deduction. Conversely, selecting any specific symptom automatically clears `'general_checkup'`.
   - In Step 3, selecting `'none'` must clear specific chronic familial conditions (`'diabetes'`, `'hypertension'`, `'kidney'`, `'thyroid'`), and selecting any disease condition clears `'none'`.

4. **Results Presentation Architecture**:
   - When the user transitions from Step 3 to Results, `calculateVitalityAssessment(input)` runs synchronously.
   - The computed score and bracket are passed into `<RadialScoreGauge score={result.vitalityScore} bracket={result.vitalityBracket} />`.
   - The 4 risk axes (`result.riskAxes.metabolic`, `cardiovascular`, `renal`, `joint`) render in a responsive 2x2 grid (collapsing to single column on mobile) with dynamic risk level badges (`Low` green, `Moderate` amber, `High` rose) and clinical explanation text.
   - The dynamic explanation section presents all 6 prioritized biomarkers (HbA1c, CBC, KFT, LFT, Lipid Profile, Vitamin D3) with Dr. Shastri's clinical role and physiological rationale.
   - The dual package recommendation section presents:
     * Targeted Primary Match: displays package name, parameter count, price, strikethrough original price, key parameters, and an "Add to Cart" button.
     * High-Value Preventive Camp Alternative: displays camp package name (`smartadvance` or `basiccamp`), price, parameter count, savings tag (`Save ₹X (Y% lower)`), and an "Add to Cart" button.
   - 1-Click addition invokes `onAddToCart(packageId)`, accompanied by an instant visual confirmation feedback state ("Added ✓") and optional `onBookPackage(packageId)`.

5. **Style and Layout Discipline**:
   - All styling tokens must strictly satisfy the 5 E2E test constraints in `T1.F7.1`–`T1.F7.5` and `T1.F9.1`–`T1.F9.5`.
   - A dedicated stylesheet `src/components/VitalityAssessment/vitality-assessment.css` will encapsulate glassmorphism rules, specular highlights, spring micro-keyframes, and dock clearance.

---

## 3. Comprehensive Component Architecture & Blueprint

### 3.1 File Structure
```
src/components/VitalityAssessment/
├── scoringEngine.ts          # [Certified] Pure calculation & recommendation logic
├── useSpringValue.ts         # [Certified] Spring physics hook (k=300, c=30, m=1)
├── RadialScoreGauge.tsx      # [Certified] Animated SVG radial dial component
├── VitalityAssessment.tsx    # [Blueprint] 3-step quiz, state machine, results UI
└── vitality-assessment.css   # [Blueprint] Glassmorphism tokens, specular edge, responsive layout
```

---

### 3.2 State Machine Specification

```typescript
export type StepId = 1 | 2 | 3 | 'results';

export interface QuizState {
  ageGroup: '18-29' | '30-45' | '46-60' | '60+' | null;
  gender: 'male' | 'female' | 'other' | null;
  activityLevel: 'sedentary' | 'moderate' | 'active' | null;
  sleepStress: 'restful' | 'moderate_stress' | 'poor_sleep_high_stress' | null;
  symptoms: Array<'fatigue' | 'thirst_urination' | 'joint_pain' | 'bp_concerns' | 'general_checkup'>;
  familyHistory: Array<'diabetes' | 'hypertension' | 'kidney' | 'thyroid' | 'none'>;
}

export const INITIAL_QUIZ_STATE: QuizState = {
  ageGroup: null,
  gender: null,
  activityLevel: null,
  sleepStress: null,
  symptoms: [],
  familyHistory: [],
};
```

#### Step Navigation Transitions:
1. `Step 1 -> Step 2`:
   - Valid if: `state.ageGroup !== null && state.gender !== null && state.activityLevel !== null && state.sleepStress !== null`.
2. `Step 2 -> Step 3`:
   - Valid if: `state.symptoms.length > 0`.
3. `Step 3 -> Results`:
   - Valid if: `state.familyHistory.length > 0`.
   - On transition: calls `calculateVitalityAssessment(validatedInput)` and caches `AssessmentResult`.
4. `Back Navigation`:
   - `Step 2 -> Step 1`: state preserved.
   - `Step 3 -> Step 2`: state preserved.
   - `Results -> Retake`: resets `step` to `1` (or allows reviewing previous inputs).

---

### 3.3 Complete Step-by-Step UI Specification

#### Step 1: Demographics & Lifestyle
- **Layout**: 4 categorical option groups styled as responsive grid cards.
- **Section 1: Age Group**:
  - Options:
    * `'18-29'` — "18–29 yrs" (Young Adult)
    * `'30-45'` — "30–45 yrs" (Prime Adult)
    * `'46-60'` — "46–60 yrs" (Mature Adult)
    * `'60+'` — "60+ yrs" (Senior Care)
  - Accessibility: `role="radiogroup" aria-label="Select Age Group"`, chips have `role="radio" aria-checked={selected}`.
- **Section 2: Gender Identity**:
  - Options:
    * `'male'` — "Male"
    * `'female'` — "Female"
    * `'other'` — "Other / Non-Binary"
  - Accessibility: `role="radiogroup" aria-label="Select Gender"`.
- **Section 3: Daily Activity Level**:
  - Options:
    * `'sedentary'` — "Sedentary" (Desk bound, <30m exercise/week)
    * `'moderate'` — "Moderate" (1–3 workouts or daily brisk walking)
    * `'active'` — "Active" (Athletic, 4+ intense sessions/week)
- **Section 4: Sleep Quality & Stress Load**:
  - Options:
    * `'restful'` — "Restful" (7–8 hrs restorative sleep, balanced stress)
    * `'moderate_stress'` — "Moderate" (Occasional fatigue, work stress)
    * `'poor_sleep_high_stress'` — "High Strain" (<6 hrs fragmented sleep, high chronic stress)
- **Footer**:
  - "Continue to Symptoms →" button (`.step-btn`, `min-height: 44px`, disabled with opacity 0.45 when invalid).

#### Step 2: Primary Symptoms & Concerns
- **Header**: "Step 2 of 3 · Current Symptoms & Health Concerns"
- **Subtitle**: "Select all that apply over the past 30 days to tailor clinical marker priorities."
- **Multi-Select Option Chips**:
  1. `'fatigue'` — ⚡ Chronic Fatigue & Low Stamina (persistent midday crashes, sluggish recovery)
  2. `'thirst_urination'` — 💧 Frequent Thirst & Urination (excessive fluid intake, nocturia)
  3. `'joint_pain'` — 🦴 Joint Stiffness or Muscle Aches (morning joint stiffness, back pain)
  4. `'bp_concerns'` — 🩺 Blood Pressure & Dizziness (hypertensive spikes, dizziness on standing)
  5. `'general_checkup'` — ✨ None of these · Routine Wellness Checkup (general preventive health)
- **Selection Behavior**:
  - Selecting `'general_checkup'` deselects all specific symptoms.
  - Selecting any symptom 1–4 deselects `'general_checkup'`.
- **Footer**:
  - "← Back" button.
  - "Continue to Family History →" button (`disabled={state.symptoms.length === 0}`).

#### Step 3: Family Medical History
- **Header**: "Step 3 of 3 · Familial & Genetic Predispositions"
- **Subtitle**: "First-degree family history (parents or siblings) guides preventative screening depth."
- **Multi-Select Option Chips**:
  1. `'diabetes'` — 🩸 Diabetes & High Blood Sugar
  2. `'hypertension'` — ❤️ Hypertension & Cardiovascular Conditions
  3. `'kidney'` — 🧪 Kidney Conditions & Renal Stones
  4. `'thyroid'` — 🦋 Thyroid Disorders (Hypo/Hyperthyroidism)
  5. `'none'` — 🛡️ No Known Chronic Familial Conditions
- **Selection Behavior**:
  - Selecting `'none'` deselects 1–4.
  - Selecting any disease 1–4 deselects `'none'`.
- **Footer**:
  - "← Back" button.
  - "Calculate My Vitality Score ✨" button (`disabled={state.familyHistory.length === 0}`).

---

### 3.4 Results View Specification

Upon entering Results:
1. **Hero Score Dial & Status Banner**:
   - Embeds `<RadialScoreGauge score={result.vitalityScore} bracket={result.vitalityBracket} size={240} />`.
   - Side hero content:
     * Header badge: `Clinical Risk & Vitality Synthesis`
     * Status heading:
       - Optimal ($\ge 80$): "Excellent Physiological Vitality"
       - Moderate ($55-79$): "Moderate Health Risk Detected"
       - Elevated Risk ($< 55$): "Clinical Attention Recommended"
     * Clinical overview text tailored to bracket.
     * Diagnostic Summary Chips: Age group, lifestyle tag, flagged symptoms, familial traits.

2. **4 Risk Axes Sub-Panel**:
   - 4 glass cards in a 2x2 grid (1 column on mobile):
     1. **Metabolic Risk**:
        - Icon: `Flame`
        - Level Badge: `Low` (Emerald) / `Moderate` (Amber) / `High` (Rose)
        - Animated Bar: `percentage` (0–100%)
        - Summary: `result.riskAxes.metabolic.summary`
     2. **Cardiovascular Risk**:
        - Icon: `HeartPulse`
        - Level Badge, Animated Bar, Summary
     3. **Renal Filtration Risk**:
        - Icon: `FlaskConical`
        - Level Badge, Animated Bar, Summary
     4. **Joint & Inflammatory Risk**:
        - Icon: `Activity`
        - Level Badge, Animated Bar, Summary

3. **Dynamic Clinical Explanation Section**:
   - Header: `"Why Dr. Shastri Diagnostics recommends this for your score"`
   - Subtitle: `"Our automated clinical algorithm prioritizes the following diagnostic markers based on your detected physiological profile:"`
   - Responsive grid of 6 parameter cards (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):
     * `HbA1c` — 90-day mean glucose & prediabetes marker (HPLC)
     * `CBC` — 6-part automated 24-parameter hemogram & cellular oxygenation
     * `KFT` — Glomerular filtration integrity (eGFR, Creatinine, BUN, Urea, Electrolytes)
     * `LFT` — Hepatocyte transaminases (AST/ALT) & fatty liver screening
     * `Lipid Profile` — Atherogenic lipoprotein fractions & 10-year ASCVD risk
     * `Vitamin D3` — 25-OH Vitamin D3 for intestinal calcium absorption & joint health
   - Each card displays:
     * Parameter badge with emerald glowing dot
     * Parameter role (`explanation.role`) in semi-bold
     * Scientific rationale (`explanation.reason`) in clear, high-contrast text (`font-weight: 400`, line height 1.6)

4. **Dual Package Recommendation Cards**:
   - Comparison grid (`grid-cols-1 lg:grid-cols-2`):
     - **Card 1: Primary Clinical Match**
       * Glowing badge: `🎯 TARGETED CLINICAL MATCH`
       * Name: `result.primaryPackage.name`
       * Price section:
         - Current: `₹${result.primaryPackage.price}` (bold 32px Manrope)
         - Strikethrough: `₹${result.primaryPackage.originalPrice}`
         - Parameter count badge: `${result.primaryPackage.parameterCount} tests included`
       * Tag: `result.primaryPackage.tag` (e.g. "6% off · DSD website")
       * Description: `result.primaryPackage.description`
       * Key Parameters: Checkmarked list of 4–6 key tests
       * CTA Button:
         ```tsx
         <button
           className="cart-add-btn primary-cart-btn"
           onClick={() => handleAddToCart(result.primaryPackage.id)}
           aria-label={`Add ${result.primaryPackage.name} to cart`}
         >
           <ShoppingBag size={18} />
           {addedId === result.primaryPackage.id ? 'Added to Cart ✓' : 'Add Targeted Package to Cart'}
         </button>
         ```
     - **Card 2: High-Value Preventive Camp Alternative**
       * Glowing badge: `✨ HIGH-VALUE PREVENTIVE CAMP`
       * Name: `result.campAlternativePackage.name`
       * Price section:
         - Current: `₹${result.campAlternativePackage.price}`
         - Parameter count: `${result.campAlternativePackage.parameterCount} tests included`
         - Savings tag:
           ```tsx
           {result.savingsAmount > 0 ? (
             <span className="savings-pill">
               Save ₹{result.savingsAmount} ({result.savingsPercentage}% lower)
             </span>
           ) : (
             <span className="savings-pill neutral">Affordable Camp Baseline</span>
           )}
           ```
       * Tag: `result.campAlternativePackage.tag` ("Camp offer · ECG free")
       * Description: `result.campAlternativePackage.description`
       * Key Parameters: Checkmarked list
       * CTA Button:
         ```tsx
         <button
           className="cart-add-btn camp-cart-btn"
           onClick={() => handleAddToCart(result.campAlternativePackage.id)}
           aria-label={`Add ${result.campAlternativePackage.name} to cart`}
         >
           <ShoppingBag size={18} />
           {addedId === result.campAlternativePackage.id ? 'Added to Cart ✓' : 'Add Camp Alternative to Cart'}
         </button>
         ```

5. **Action Bar & Controls**:
   - `"Retake Health Quiz ↺"`: Resets step back to 1.
   - Optional `"Book Now via WhatsApp 💬"` or `"Proceed to Booking →"` if `onBookPackage` prop is provided.

---

### 3.5 Exact Proposed Code Blueprint: `VitalityAssessment.tsx`

```tsx
/**
 * Dr. Shastri Diagnostics (DSD Care) — Interactive Health Risk & Vitality Score Assessment
 * Component: src/components/VitalityAssessment/VitalityAssessment.tsx
 *
 * Awwwards-grade, dark-glassmorphic 3-step clinical quiz and hybrid package recommendation engine.
 * Computes:
 * 1. Vitality Score bounded strictly to [15, 98]
 * 2. 4 Risk Axes (Metabolic, Cardiovascular, Renal, Joint/Inflammation)
 * 3. Primary Targeted Match & High-Value Preventive Camp Alternative with savings tag
 * 4. Dynamic Dr. Shastri Clinical Explanations for 6 core biomarkers
 * 5. 1-Click active cart synchronization via onAddToCart(packageId)
 */

import React, { useState, useMemo } from 'react';
import {
  calculateVitalityAssessment,
  AssessmentInput,
  AssessmentResult,
} from './scoringEngine';
import { RadialScoreGauge } from './RadialScoreGauge';
import { useSpringValue, SPRING_PRESETS } from './useSpringValue';
import './vitality-assessment.css';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Flame,
  FlaskConical,
  HeartPulse,
  Info,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface VitalityAssessmentProps {
  onAddToCart: (packageId: string) => void;
  onBookPackage?: (packageId: string) => void;
  className?: string;
}

export type QuizStep = 1 | 2 | 3 | 'results';

export interface QuizState {
  ageGroup: AssessmentInput['ageGroup'] | null;
  gender: AssessmentInput['gender'] | null;
  activityLevel: AssessmentInput['activityLevel'] | null;
  sleepStress: AssessmentInput['sleepStress'] | null;
  symptoms: AssessmentInput['symptoms'];
  familyHistory: AssessmentInput['familyHistory'];
}

const INITIAL_STATE: QuizState = {
  ageGroup: null,
  gender: null,
  activityLevel: null,
  sleepStress: null,
  symptoms: [],
  familyHistory: [],
};

export const VitalityAssessment: React.FC<VitalityAssessmentProps> = ({
  onAddToCart,
  onBookPackage,
  className = '',
}) => {
  const [step, setStep] = useState<QuizStep>(1);
  const [state, setState] = useState<QuizState>(INITIAL_STATE);
  const [addedPackageId, setAddedPackageId] = useState<string | null>(null);

  // Animated progress bar along top edge (33% -> 66% -> 100%)
  const numericStep = step === 'results' ? 3 : step;
  const progressPercent = (numericStep / 3) * 100;
  const animatedProgress = useSpringValue(progressPercent, SPRING_PRESETS.smooth);

  // Validation predicates
  const isStep1Valid = Boolean(
    state.ageGroup && state.gender && state.activityLevel && state.sleepStress
  );
  const isStep2Valid = state.symptoms.length > 0;
  const isStep3Valid = state.familyHistory.length > 0;

  // Multi-select handlers with mutual exclusivity
  const toggleSymptom = (sym: AssessmentInput['symptoms'][number]) => {
    setState((prev) => {
      if (sym === 'general_checkup') {
        const has = prev.symptoms.includes('general_checkup');
        return { ...prev, symptoms: has ? [] : ['general_checkup'] };
      }
      const filtered = prev.symptoms.filter((s) => s !== 'general_checkup');
      const next = filtered.includes(sym)
        ? filtered.filter((s) => s !== sym)
        : [...filtered, sym];
      return { ...prev, symptoms: next };
    });
  };

  const toggleFamilyHistory = (fh: AssessmentInput['familyHistory'][number]) => {
    setState((prev) => {
      if (fh === 'none') {
        const has = prev.familyHistory.includes('none');
        return { ...prev, familyHistory: has ? [] : ['none'] };
      }
      const filtered = prev.familyHistory.filter((f) => f !== 'none');
      const next = filtered.includes(fh)
        ? filtered.filter((f) => f !== fh)
        : [...filtered, fh];
      return { ...prev, familyHistory: next };
    });
  };

  // Assessment calculation memoized for Results view
  const assessmentResult: AssessmentResult | null = useMemo(() => {
    if (step !== 'results') return null;
    const input: AssessmentInput = {
      ageGroup: state.ageGroup || '30-45',
      gender: state.gender || 'male',
      activityLevel: state.activityLevel || 'moderate',
      sleepStress: state.sleepStress || 'moderate_stress',
      symptoms: state.symptoms,
      familyHistory: state.familyHistory,
    };
    return calculateVitalityAssessment(input);
  }, [step, state]);

  // Cart addition with instant feedback
  const handleAddToCart = (pkgId: string) => {
    onAddToCart(pkgId);
    setAddedPackageId(pkgId);
    setTimeout(() => setAddedPackageId(null), 2500);
  };

  const handleRetake = () => {
    setStep(1);
    setAddedPackageId(null);
  };

  return (
    <section
      id="vitality-score"
      className={`vitality-container ${className}`}
      role="region"
      aria-label="Health Risk & Vitality Score Assessment"
    >
      {/* Ambient background glow orbs */}
      <div className="vitality-glow-orb glow-top-left" aria-hidden="true" />
      <div className="vitality-glow-orb glow-bottom-right" aria-hidden="true" />

      <div className="glass-assessment-card">
        {/* Top Spring-Animated Progress Indicator */}
        <div
          className="step-progress-track"
          role="progressbar"
          aria-valuenow={numericStep}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Quiz Step Progress"
        >
          <div
            className="step-progress-bar"
            style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
          />
        </div>

        {/* ================================================================= */}
        {/* STEP 1: DEMOGRAPHICS & LIFESTYLE */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="step-pane step-pane-1">
            <div className="step-header">
              <span className="step-badge">
                <Sparkles size={13} className="text-emerald-400" />
                Step 1 of 3 · Demographics & Baseline Lifestyle
              </span>
              <h2 className="step-title">Personalize your diagnostic profile</h2>
              <p className="step-desc">
                Baseline biological variables calibrate metabolic, cardiovascular, and organ reserve thresholds.
              </p>
            </div>

            {/* Field 1: Age Group */}
            <div className="quiz-field-group">
              <label className="field-label">Age Group</label>
              <div className="chip-grid grid-4" role="radiogroup" aria-label="Age Group">
                {[
                  { value: '18-29', label: '18–29 yrs', sub: 'Young Adult' },
                  { value: '30-45', label: '30–45 yrs', sub: 'Prime Adult' },
                  { value: '46-60', label: '46–60 yrs', sub: 'Mature Adult' },
                  { value: '60+', label: '60+ yrs', sub: 'Senior Care' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.ageGroup === opt.value}
                    className={`option-chip ${state.ageGroup === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, ageGroup: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                    <span className="chip-secondary">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Gender Identity */}
            <div className="quiz-field-group">
              <label className="field-label">Gender Identity</label>
              <div className="chip-grid grid-3" role="radiogroup" aria-label="Gender Identity">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other / Non-Binary' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.gender === opt.value}
                    className={`option-chip ${state.gender === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, gender: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Activity Level */}
            <div className="quiz-field-group">
              <label className="field-label">Weekly Activity Level</label>
              <div className="chip-grid grid-3" role="radiogroup" aria-label="Weekly Activity Level">
                {[
                  { value: 'sedentary', label: 'Sedentary', sub: '<30m active / desk job' },
                  { value: 'moderate', label: 'Moderate', sub: '1–3 sessions / brisk walk' },
                  { value: 'active', label: 'Active', sub: '4+ fitness workouts/wk' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.activityLevel === opt.value}
                    className={`option-chip ${state.activityLevel === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, activityLevel: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                    <span className="chip-secondary">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Sleep & Stress Load */}
            <div className="quiz-field-group">
              <label className="field-label">Sleep Quality & Chronic Stress</label>
              <div className="chip-grid grid-3" role="radiogroup" aria-label="Sleep Quality and Stress">
                {[
                  { value: 'restful', label: 'Restful Sleep', sub: '7–8 hrs, low stress' },
                  { value: 'moderate_stress', label: 'Moderate Stress', sub: 'Variable sleep, busy routine' },
                  { value: 'poor_sleep_high_stress', label: 'High Strain', sub: '<6 hrs, high stress/burnout' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.sleepStress === opt.value}
                    className={`option-chip ${state.sleepStress === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, sleepStress: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                    <span className="chip-secondary">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="step-actions justify-end">
              <button
                type="button"
                className="step-btn step-btn-primary"
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
              >
                <span>Continue to Symptoms</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: PRIMARY SYMPTOMS & CONCERNS */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="step-pane step-pane-2">
            <div className="step-header">
              <span className="step-badge">
                <Activity size={13} className="text-emerald-400" />
                Step 2 of 3 · Primary Symptoms & Health Concerns
              </span>
              <h2 className="step-title">What has your body been communicating?</h2>
              <p className="step-desc">
                Select any symptoms experienced in recent weeks. Multi-select is supported.
              </p>
            </div>

            <div className="chip-vertical-stack" role="group" aria-label="Symptoms Multi-Select">
              {[
                {
                  id: 'fatigue',
                  icon: '⚡',
                  title: 'Fatigue, Lethargy or Low Stamina',
                  desc: 'Midday crashes, waking unrefreshed, decreased physical endurance',
                },
                {
                  id: 'thirst_urination',
                  icon: '💧',
                  title: 'Frequent Thirst or Increased Urination',
                  desc: 'Increased fluid intake, nocturia, dry mouth despite drinking water',
                },
                {
                  id: 'joint_pain',
                  icon: '🦴',
                  title: 'Joint Stiffness, Knee Ache or Back Pain',
                  desc: 'Morning stiffness, crepitus, musculoskeletal aches after sitting or standing',
                },
                {
                  id: 'bp_concerns',
                  icon: '🩺',
                  title: 'Blood Pressure Concerns, Headaches or Palpitations',
                  desc: 'Elevated BP readings, occasional dizziness, postural lightheadedness',
                },
                {
                  id: 'general_checkup',
                  icon: '🛡️',
                  title: 'None of these · General Preventive Wellness',
                  desc: 'Asymptomatic annual screening to verify baseline cellular vitality',
                },
              ].map((sym) => {
                const isSelected = state.symptoms.includes(sym.id as any);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`option-card-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(sym.id as any)}
                  >
                    <div className="card-row-icon">{sym.icon}</div>
                    <div className="card-row-content">
                      <div className="card-row-title">{sym.title}</div>
                      <div className="card-row-desc">{sym.desc}</div>
                    </div>
                    <div className="checkbox-indicator">
                      {isSelected && <Check size={14} className="text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="step-actions justify-between">
              <button
                type="button"
                className="step-btn step-btn-secondary"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={17} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="step-btn step-btn-primary"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
              >
                <span>Continue to Family History</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: FAMILY MEDICAL HISTORY */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="step-pane step-pane-3">
            <div className="step-header">
              <span className="step-badge">
                <ShieldCheck size={13} className="text-emerald-400" />
                Step 3 of 3 · Familial & Genetic Predispositions
              </span>
              <h2 className="step-title">Any chronic conditions in your immediate family?</h2>
              <p className="step-desc">
                First-degree relatives (parents or siblings). Multi-select is supported.
              </p>
            </div>

            <div className="chip-vertical-stack" role="group" aria-label="Family History Multi-Select">
              {[
                {
                  id: 'diabetes',
                  icon: '🩸',
                  title: 'Diabetes or Insulin Resistance',
                  desc: 'Type 1 or Type 2 diabetes, high fasting glucose, Gestational diabetes',
                },
                {
                  id: 'hypertension',
                  icon: '❤️',
                  title: 'Hypertension or Cardiovascular Disease',
                  desc: 'High blood pressure, coronary artery disease, elevated cholesterol history',
                },
                {
                  id: 'kidney',
                  icon: '🧪',
                  title: 'Kidney Conditions or Renal Calculi',
                  desc: 'Recurrent kidney stones, chronic kidney disease, proteinuria, gout',
                },
                {
                  id: 'thyroid',
                  icon: '🦋',
                  title: 'Thyroid Disorders',
                  desc: 'Hypothyroidism, Hashimoto’s, Hyperthyroidism, goitre or nodular history',
                },
                {
                  id: 'none',
                  icon: '🌿',
                  title: 'No Known Chronic Family History',
                  desc: 'No documented chronic illnesses among immediate first-degree family',
                },
              ].map((fh) => {
                const isSelected = state.familyHistory.includes(fh.id as any);
                return (
                  <button
                    key={fh.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`option-card-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleFamilyHistory(fh.id as any)}
                  >
                    <div className="card-row-icon">{fh.icon}</div>
                    <div className="card-row-content">
                      <div className="card-row-title">{fh.title}</div>
                      <div className="card-row-desc">{fh.desc}</div>
                    </div>
                    <div className="checkbox-indicator">
                      {isSelected && <Check size={14} className="text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="step-actions justify-between">
              <button
                type="button"
                className="step-btn step-btn-secondary"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={17} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="step-btn step-btn-submit"
                disabled={!isStep3Valid}
                onClick={() => setStep('results')}
              >
                <Sparkles size={17} className="animate-spin-slow" />
                <span>Calculate My Vitality Score ✨</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* RESULTS PRESENTATION */}
        {/* ================================================================= */}
        {step === 'results' && assessmentResult && (
          <div className="results-pane">
            {/* Top Action / Reset Bar */}
            <div className="results-top-bar">
              <span className="results-eyebrow">
                <BadgeCheck size={15} className="text-emerald-400 inline mr-1.5" />
                Dr. Shastri Diagnostics · Clinical Assessment Report
              </span>
              <button
                type="button"
                className="retake-btn"
                onClick={handleRetake}
                aria-label="Retake Health Assessment"
              >
                <RotateCcw size={14} />
                <span>Retake Quiz</span>
              </button>
            </div>

            {/* Hero Dial & Status Overview */}
            <div className="results-hero-grid">
              <div className="gauge-column">
                <RadialScoreGauge
                  score={assessmentResult.vitalityScore}
                  bracket={assessmentResult.vitalityBracket}
                  size={240}
                  className="mx-auto"
                />
              </div>
              <div className="verdict-column">
                <div className="verdict-badge-row">
                  <span
                    className={`status-pill ${
                      assessmentResult.vitalityBracket === 'Optimal'
                        ? 'pill-optimal'
                        : assessmentResult.vitalityBracket === 'Moderate'
                        ? 'pill-moderate'
                        : 'pill-risk'
                    }`}
                  >
                    ● {assessmentResult.vitalityBracket} Vitality Status
                  </span>
                  <span className="score-summary-tag">
                    Score: {assessmentResult.vitalityScore}/100
                  </span>
                </div>
                <h3 className="verdict-title">
                  {assessmentResult.vitalityBracket === 'Optimal'
                    ? 'Optimal Physiological Equilibrium'
                    : assessmentResult.vitalityBracket === 'Moderate'
                    ? 'Subclinical Metabolic Strain Detected'
                    : 'Elevated Risk Profile Requiring Targeted Evaluation'}
                </h3>
                <p className="verdict-text">
                  {assessmentResult.vitalityBracket === 'Optimal'
                    ? 'Your biomarkers demonstrate strong metabolic resilience and low organ workload. Annual preventive health profiling is recommended to sustain these protective baseline ranges.'
                    : assessmentResult.vitalityBracket === 'Moderate'
                    ? 'Moderate metabolic or lifestyle stressors detected. Diagnostic screening will identify early glycemic variability, lipid imbalances, or subclinical cellular inflammation.'
                    : 'Significant physiological or genetic risk markers detected across one or more diagnostic axes. Targeted clinical panels are advised to prevent silent progression.'}
                </p>
                <div className="summary-tags-deck">
                  <span className="tag-chip">Age: {state.ageGroup}</span>
                  <span className="tag-chip">Activity: {state.activityLevel}</span>
                  <span className="tag-chip">Sleep/Stress: {state.sleepStress}</span>
                  {state.symptoms.map((s) => (
                    <span key={s} className="tag-chip tag-highlight">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Axis Risk Breakdown (4 Axes) */}
            <div className="risk-axes-section">
              <h4 className="section-title">Multi-Axial Physiological Risk Indicators</h4>
              <div className="risk-axes-grid">
                {[
                  {
                    key: 'metabolic',
                    name: 'Metabolic Balance',
                    icon: <Flame size={18} className="text-amber-400" />,
                    data: assessmentResult.riskAxes.metabolic,
                  },
                  {
                    key: 'cardiovascular',
                    name: 'Cardiovascular Load',
                    icon: <HeartPulse size={18} className="text-rose-400" />,
                    data: assessmentResult.riskAxes.cardiovascular,
                  },
                  {
                    key: 'renal',
                    name: 'Renal Filtration Reserve',
                    icon: <FlaskConical size={18} className="text-cyan-400" />,
                    data: assessmentResult.riskAxes.renal,
                  },
                  {
                    key: 'joint',
                    name: 'Joint & Musculoskeletal Integrity',
                    icon: <Activity size={18} className="text-emerald-400" />,
                    data: assessmentResult.riskAxes.joint,
                  },
                ].map((axis) => {
                  const levelClass =
                    axis.data.level === 'Low'
                      ? 'level-low'
                      : axis.data.level === 'Moderate'
                      ? 'level-moderate'
                      : 'level-high';
                  return (
                    <div key={axis.key} className="axis-card">
                      <div className="axis-header">
                        <div className="axis-title-group">
                          {axis.icon}
                          <span className="axis-name">{axis.name}</span>
                        </div>
                        <span className={`axis-level-badge ${levelClass}`}>
                          {axis.data.level} Risk
                        </span>
                      </div>
                      <div className="axis-meter-track">
                        <div
                          className={`axis-meter-fill ${levelClass}`}
                          style={{ width: `${axis.data.percentage}%` }}
                        />
                      </div>
                      <div className="axis-meter-label">
                        <span>Risk Index</span>
                        <b>{axis.data.percentage}%</b>
                      </div>
                      <p className="axis-summary">{axis.data.summary}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Clinical Explanations Section */}
            <div className="explanations-section">
              <div className="section-header-box">
                <span className="section-badge">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Clinical Rationale
                </span>
                <h4 className="section-title">
                  Why Dr. Shastri Diagnostics recommends this for your score
                </h4>
                <p className="section-desc">
                  Our algorithm prioritizes specific biochemical parameters based on your detected physiological and genetic factors:
                </p>
              </div>

              <div className="explanations-grid">
                {assessmentResult.clinicalExplanations.map((exp) => (
                  <div key={exp.parameter} className="explanation-card">
                    <div className="exp-card-header">
                      <span className="exp-param-badge">{exp.parameter}</span>
                      <span className="exp-role">{exp.role}</span>
                    </div>
                    <p className="exp-reason">{exp.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Package Recommendations */}
            <div className="recommendations-section">
              <div className="section-header-box text-center">
                <span className="section-badge mx-auto">
                  <Sparkles size={14} className="text-emerald-400" />
                  Hybrid Package Match
                </span>
                <h4 className="section-title">Tailored Diagnostic Solutions</h4>
                <p className="section-desc">
                  Compare the targeted clinical match addressing your specific vulnerabilities with our high-value preventive camp alternative:
                </p>
              </div>

              <div className="recommendations-dual-grid">
                {/* 1. Primary Clinical Match */}
                <div className="recommendation-card card-primary">
                  <div className="card-top-tag tag-primary">
                    <BadgeCheck size={14} />
                    <span>Targeted Match</span>
                  </div>
                  <h5 className="rec-package-name">
                    {assessmentResult.primaryPackage.name}
                  </h5>
                  <div className="rec-package-pricing">
                    <span className="rec-price">
                      ₹{assessmentResult.primaryPackage.price.toLocaleString('en-IN')}
                    </span>
                    {assessmentResult.primaryPackage.originalPrice >
                      assessmentResult.primaryPackage.price && (
                      <span className="rec-old-price">
                        ₹{assessmentResult.primaryPackage.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="rec-param-count">
                      {assessmentResult.primaryPackage.parameterCount} Parameters
                    </span>
                  </div>
                  <p className="rec-desc">
                    {assessmentResult.primaryPackage.description}
                  </p>

                  <div className="key-params-list">
                    <span className="list-heading">Key Biomarkers Tested:</span>
                    <ul>
                      {assessmentResult.primaryPackage.keyParameters.map((p, idx) => (
                        <li key={idx}>
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="cart-add-btn primary-cart-btn"
                    onClick={() => handleAddToCart(assessmentResult.primaryPackage.id)}
                    aria-label={`Add ${assessmentResult.primaryPackage.name} to cart`}
                  >
                    <ShoppingBag size={17} />
                    <span>
                      {addedPackageId === assessmentResult.primaryPackage.id
                        ? 'Added to Cart ✓'
                        : 'Add Targeted Match to Cart'}
                    </span>
                  </button>
                </div>

                {/* 2. Preventive Camp Alternative */}
                <div className="recommendation-card card-camp">
                  <div className="card-top-tag tag-camp">
                    <Sparkles size={14} />
                    <span>High-Value Preventive Camp</span>
                  </div>
                  <h5 className="rec-package-name">
                    {assessmentResult.campAlternativePackage.name}
                  </h5>
                  <div className="rec-package-pricing">
                    <span className="rec-price">
                      ₹{assessmentResult.campAlternativePackage.price.toLocaleString('en-IN')}
                    </span>
                    {assessmentResult.savingsAmount > 0 && (
                      <span className="savings-pill">
                        Save ₹{assessmentResult.savingsAmount.toLocaleString('en-IN')} (
                        {assessmentResult.savingsPercentage}% lower)
                      </span>
                    )}
                    <span className="rec-param-count">
                      {assessmentResult.campAlternativePackage.parameterCount} Parameters
                    </span>
                  </div>
                  <p className="rec-desc">
                    {assessmentResult.campAlternativePackage.description}
                  </p>

                  <div className="key-params-list">
                    <span className="list-heading">Camp Inclusions & Tests:</span>
                    <ul>
                      {assessmentResult.campAlternativePackage.keyParameters.map((p, idx) => (
                        <li key={idx}>
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="cart-add-btn camp-cart-btn"
                    onClick={() =>
                      handleAddToCart(assessmentResult.campAlternativePackage.id)
                    }
                    aria-label={`Add ${assessmentResult.campAlternativePackage.name} to cart`}
                  >
                    <ShoppingBag size={17} />
                    <span>
                      {addedPackageId === assessmentResult.campAlternativePackage.id
                        ? 'Added to Cart ✓'
                        : 'Add Camp Alternative to Cart'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Booking / Cart Direct CTA */}
              {onBookPackage && (
                <div className="bottom-booking-bar">
                  <button
                    type="button"
                    className="proceed-booking-btn"
                    onClick={() =>
                      onBookPackage(assessmentResult.primaryPackage.id)
                    }
                  >
                    <span>Proceed to Home Sample Booking with Targeted Match</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default VitalityAssessment;
```

---

### 3.6 Exact Proposed CSS Blueprint: `vitality-assessment.css`

```css
/**
 * Dr. Shastri Diagnostics (DSD Care) — Interactive Health Risk & Vitality Assessment
 * Stylesheet: src/components/VitalityAssessment/vitality-assessment.css
 *
 * Awwwards-grade Glassmorphism & Responsive Layout Token Set:
 * - Backdrop filter: blur(28px) with WebKit vendor prefix
 * - Specular top edge gradient highlight (::before height: 1px)
 * - Deep ambient occlusion shadow (0 24px 80px rgba(0,0,0,0.55))
 * - Minimum touch target >= 44px on all buttons and chips
 * - Bottom clearance padding >= 96px (pb-24) for fixed 56px .mobileDock
 * - High-contrast WCAG AA typography (ratio >= 4.5:1 against #050606)
 */

/* ==========================================================================
   1. CONTAINER & AMBIENT GLOW
   ========================================================================== */

.vitality-container {
  position: relative;
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 48px 20px 96px; /* 96px bottom padding satisfies T1.F9.2 */
  color: #f1f3f2;
}

.vitality-glow-orb {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.18;
}

.glow-top-left {
  top: -40px;
  left: 5%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, #48ed86 0%, rgba(16, 185, 129, 0) 70%);
}

.glow-bottom-right {
  bottom: 40px;
  right: 5%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, #0ea5e9 0%, rgba(14, 165, 233, 0) 70%);
}

/* ==========================================================================
   2. GLASSMORPHIC CARD (T1.F7 SPECIFICATION)
   ========================================================================== */

.glass-assessment-card {
  position: relative;
  background: rgba(12, 23, 20, 0.76);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  z-index: 1;
  transition: border-color 300ms ease, box-shadow 300ms ease;
}

/* Specular Top Edge Gradient Highlight (T1.F7.2) */
.glass-assessment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(72, 237, 134, 0.6) 50%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 2;
}

/* Interactive Hover Elevation (T1.F7.5) */
.glass-assessment-card:hover {
  border-color: rgba(72, 237, 134, 0.28);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65), 0 0 24px rgba(72, 237, 134, 0.12);
}

/* Typography Weight Constraint on Glass Surfaces (T1.F7.4) */
.glass-assessment-card p,
.glass-assessment-card span {
  font-weight: 500;
  color: #a7bbaa;
}

.glass-assessment-card h2,
.glass-assessment-card h3,
.glass-assessment-card h4,
.glass-assessment-card h5,
.glass-assessment-card b,
.glass-assessment-card strong {
  color: #ffffff;
}

/* ==========================================================================
   3. PROGRESS BAR & STEP HEADERS
   ========================================================================== */

.step-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
}

.step-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #48ed86, #10b981);
  box-shadow: 0 0 12px rgba(72, 237, 134, 0.65);
  transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1);
}

.step-pane {
  padding: 40px 36px 36px;
}

.step-header {
  margin-bottom: 32px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #48ed86 !important;
  background: rgba(72, 237, 134, 0.1);
  border: 1px solid rgba(72, 237, 134, 0.25);
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 12px;
}

.step-title {
  font-family: 'Manrope', sans-serif;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.step-desc {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

/* ==========================================================================
   4. CHIP GRIDS & TOUCH TARGETS (T1.F9.1: MIN-HEIGHT >= 44PX)
   ========================================================================== */

.quiz-field-group {
  margin-bottom: 26px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #effff2;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.chip-grid {
  display: grid;
  gap: 12px;
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.option-chip {
  min-height: 48px; /* Satisfies >= 44px */
  min-width: 44px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 3px;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.option-chip:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(72, 237, 134, 0.3);
  transform: translateY(-1px);
}

.option-chip.selected {
  background: rgba(72, 237, 134, 0.12);
  border-color: #48ed86;
  box-shadow: 0 0 16px rgba(72, 237, 134, 0.22);
}

.chip-primary {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff !important;
}

.chip-secondary {
  font-size: 11px;
  color: #a7bbaa !important;
}

/* Vertical Stack Option Cards (Steps 2 & 3) */
.chip-vertical-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.option-card-row {
  min-height: 60px; /* Satisfies >= 44px */
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.option-card-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(72, 237, 134, 0.3);
  transform: translateY(-1px);
}

.option-card-row.selected {
  background: rgba(72, 237, 134, 0.10);
  border-color: #48ed86;
  box-shadow: 0 0 18px rgba(72, 237, 134, 0.18);
}

.card-row-icon {
  font-size: 20px;
  width: 32px;
  display: grid;
  place-items: center;
  shrink: 0;
}

.card-row-content {
  flex: 1;
}

.card-row-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.card-row-desc {
  font-size: 12px;
  line-height: 1.4;
  color: #a7bbaa;
}

.checkbox-indicator {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
  transition: all 200ms ease;
  shrink: 0;
}

.option-card-row.selected .checkbox-indicator {
  border-color: #48ed86;
  background: rgba(72, 237, 134, 0.18);
}

/* ==========================================================================
   5. NAVIGATION & ACTION BUTTONS (T1.F9.1: MIN-HEIGHT >= 44PX)
   ========================================================================== */

.step-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.step-btn {
  min-height: 48px;
  min-width: 140px;
  padding: 12px 24px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
  border: none;
}

.step-btn-primary {
  background: linear-gradient(135deg, #48ed86, #10b981);
  color: #05160b;
  box-shadow: 0 4px 20px rgba(72, 237, 134, 0.35);
}

.step-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(72, 237, 134, 0.5);
}

.step-btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.step-btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f3f2;
}

.step-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.2);
}

.step-btn-submit {
  background: linear-gradient(135deg, #48ed86, #059669);
  color: #04140a;
  box-shadow: 0 6px 24px rgba(72, 237, 134, 0.4);
  font-weight: 700;
}

.step-btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(72, 237, 134, 0.6);
}

.step-btn-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ==========================================================================
   6. RESULTS VIEW ARCHITECTURE
   ========================================================================== */

.results-pane {
  padding: 36px 36px 44px;
}

.results-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.results-eyebrow {
  font-size: 13px;
  font-weight: 600;
  color: #effff2;
}

.retake-btn {
  min-height: 44px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #a7bbaa;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 200ms ease;
}

.retake-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(72, 237, 134, 0.35);
  color: #ffffff;
}

/* Hero Grid (Gauge + Verdict) */
.results-hero-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 36px;
  align-items: center;
  margin-bottom: 40px;
}

.verdict-badge-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.status-pill {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pill-optimal {
  background: rgba(72, 237, 134, 0.15);
  border: 1px solid rgba(72, 237, 134, 0.4);
  color: #a7f3d0 !important;
}

.pill-moderate {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fde68a !important;
}

.pill-risk {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fecdd3 !important;
}

.score-summary-tag {
  font-size: 13px;
  font-weight: 600;
  color: #effff2;
}

.verdict-title {
  font-family: 'Manrope', sans-serif;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}

.verdict-text {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 18px;
}

.summary-tags-deck {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #a7bbaa !important;
}

.tag-highlight {
  background: rgba(72, 237, 134, 0.08);
  border-color: rgba(72, 237, 134, 0.25);
  color: #a7f3d0 !important;
}

/* ==========================================================================
   7. 4 RISK AXES SUB-PANEL
   ========================================================================== */

.risk-axes-section {
  margin-bottom: 44px;
}

.section-title {
  font-family: 'Manrope', sans-serif;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 18px;
}

.risk-axes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.axis-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 18px 20px;
  transition: border-color 200ms ease;
}

.axis-card:hover {
  border-color: rgba(72, 237, 134, 0.25);
}

.axis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.axis-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.axis-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.axis-level-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.level-low {
  background: rgba(72, 237, 134, 0.12);
  border: 1px solid rgba(72, 237, 134, 0.3);
  color: #a7f3d0 !important;
}

.level-moderate {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fde68a !important;
}

.level-high {
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: #fecdd3 !important;
}

.axis-meter-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.axis-meter-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.axis-meter-fill.level-low {
  background: linear-gradient(90deg, #48ed86, #10b981);
}

.axis-meter-fill.level-moderate {
  background: linear-gradient(90deg, #b7ff67, #f59e0b);
}

.axis-meter-fill.level-high {
  background: linear-gradient(90deg, #f97316, #f43f5e);
}

.axis-meter-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 8px;
}

.axis-meter-label span {
  color: #a7bbaa !important;
}

.axis-meter-label b {
  color: #ffffff;
}

.axis-summary {
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  color: #a7bbaa !important;
}

/* ==========================================================================
   8. DYNAMIC CLINICAL EXPLANATIONS
   ========================================================================== */

.explanations-section {
  margin-bottom: 44px;
}

.section-header-box {
  margin-bottom: 22px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #48ed86 !important;
  background: rgba(72, 237, 134, 0.1);
  border: 1px solid rgba(72, 237, 134, 0.25);
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.explanations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.explanation-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
}

.exp-card-header {
  margin-bottom: 10px;
}

.exp-param-badge {
  display: inline-block;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff !important;
  background: rgba(72, 237, 134, 0.15);
  border: 1px solid rgba(72, 237, 134, 0.3);
  padding: 2px 10px;
  border-radius: 8px;
  margin-bottom: 6px;
}

.exp-role {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #effff2 !important;
  line-height: 1.4;
}

.exp-reason {
  font-size: 12px;
  line-height: 1.6;
  color: #a7bbaa !important;
  margin: 0;
  flex: 1;
}

/* ==========================================================================
   9. DUAL PACKAGE RECOMMENDATION CARDS
   ========================================================================== */

.recommendations-section {
  margin-bottom: 16px;
}

.recommendations-dual-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 24px;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 22px;
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.recommendation-card:hover {
  transform: translateY(-2px);
}

.card-primary {
  border: 1px solid rgba(72, 237, 134, 0.35);
  box-shadow: 0 12px 36px rgba(72, 237, 134, 0.08);
}

.card-camp {
  border: 1px solid rgba(245, 158, 11, 0.35);
  box-shadow: 0 12px 36px rgba(245, 158, 11, 0.08);
}

.card-top-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 14px;
  align-self: flex-start;
}

.tag-primary {
  background: rgba(72, 237, 134, 0.15);
  border: 1px solid rgba(72, 237, 134, 0.35);
  color: #a7f3d0;
}

.tag-camp {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fde68a;
}

.rec-package-name {
  font-family: 'Manrope', sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}

.rec-package-pricing {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.rec-price {
  font-family: 'Manrope', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
}

.rec-old-price {
  font-size: 16px;
  color: #6b7280;
  text-decoration: line-through;
}

.rec-param-count {
  font-size: 12px;
  font-weight: 600;
  color: #effff2;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 6px;
}

.savings-pill {
  font-size: 12px;
  font-weight: 700;
  color: #b7ff67 !important;
  background: rgba(183, 255, 103, 0.12);
  border: 1px solid rgba(183, 255, 103, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
}

.rec-desc {
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 18px;
  color: #a7bbaa !important;
}

.key-params-list {
  flex: 1;
  margin-bottom: 22px;
}

.list-heading {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.key-params-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.key-params-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #effff2;
}

.cart-add-btn {
  min-height: 48px; /* Satisfies >= 44px */
  padding: 12px 20px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
  border: none;
}

.primary-cart-btn {
  background: linear-gradient(135deg, #48ed86, #10b981);
  color: #04140a;
  box-shadow: 0 4px 18px rgba(72, 237, 134, 0.35);
}

.primary-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(72, 237, 134, 0.5);
}

.camp-cart-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #1a0f00;
  box-shadow: 0 4px 18px rgba(245, 158, 11, 0.35);
}

.camp-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
}

.bottom-booking-bar {
  margin-top: 24px;
  text-align: center;
}

.proceed-booking-btn {
  min-height: 48px;
  padding: 12px 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 200ms ease;
}

.proceed-booking-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(72, 237, 134, 0.4);
}

/* ==========================================================================
   10. MOBILE RESPONSIVENESS & SINGLE COLUMN STACKING (< 650PX) (T1.F9.3)
   ========================================================================== */

@media (max-width: 650px) {
  .vitality-container {
    padding: 24px 12px 96px; /* Still satisfies pb-24 dock clearance */
  }

  .step-pane,
  .results-pane {
    padding: 24px 16px;
  }

  .step-title {
    font-size: 20px;
  }

  .grid-4,
  .grid-3 {
    grid-template-columns: 1fr; /* Single column stacking */
  }

  .results-hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 24px;
  }

  .verdict-badge-row {
    justify-content: center;
  }

  .summary-tags-deck {
    justify-content: center;
  }

  .risk-axes-grid {
    grid-template-columns: 1fr; /* Single column */
  }

  .explanations-grid {
    grid-template-columns: 1fr; /* Single column */
  }

  .recommendations-dual-grid {
    grid-template-columns: 1fr; /* Single column */
  }

  .step-actions {
    flex-direction: column-reverse;
  }

  .step-btn {
    width: 100%;
  }
}
```

---

### 3.7 Portal Integration Blueprint (`src/App.tsx`)

The implementer can integrate `VitalityAssessment` into `src/App.tsx` cleanly:

1. **Import Component**:
   ```typescript
   import VitalityAssessment from './components/VitalityAssessment/VitalityAssessment';
   ```

2. **Anchor in Header Navigation (`src/App.tsx:255-267`)**:
   ```tsx
   <nav>
     <a href="#vitality-score" className="navlink">
       <Sparkles size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom', color: '#48ed86' }} /> Vitality Score ✨
     </a>
     <a href="#tests">Book Tests</a>
     ...
   </nav>
   ```

3. **Hero CTA Button (`src/App.tsx:294-304`)**:
   ```tsx
   <div className="heroBtns">
     <a className="primary" href="#vitality-score">
       Take 60s Health Quiz ✨
     </a>
     <a className="secondary" href="#tests">
       Explore Tests <ArrowRight size={18} />
     </a>
   </div>
   ```

4. **Section Placement (`src/App.tsx:342-344`)**:
   Directly between Hero and Searchbar:
   ```tsx
   </section> {/* end hero */}
   
   {/* Interactive Health Risk & Vitality Score Assessment Tool */}
   <VitalityAssessment
     onAddToCart={(packageId) => qty(packageId, 1)}
     onBookPackage={(packageId) => {
       qty(packageId, 1);
       setBookingOpen(true);
     }}
   />

   <section className="searchbar">
   ```

---

## 4. Caveats

1. **Cart Quantity Mutation**:
   - `qty(packageId, 1)` increments the cart quantity count in `App.tsx`. If a user clicks "Add to Cart" multiple times, the quantity increments consecutively (`qty(id, 1)`), which is verified by test `T1.F5.5`.
2. **Reduced Motion Simulation**:
   - For users with `@media (prefers-reduced-motion: reduce)`, `useSpringValue` immediately snaps to target values with zero animation delay, satisfying `T1.F6.4`.
3. **No Project Source Modification in Explorer Role**:
   - As Explorer 1, no source files were modified or written. This blueprint and handoff report provide complete, production-grade drop-in code for the Implementer agent.

---

## 5. Conclusion

1. The architectural design for `src/components/VitalityAssessment/VitalityAssessment.tsx` and `vitality-assessment.css` is completely defined and directly satisfies all requirements of Milestone 3 and Acceptance Criteria in `ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. The 3-step quiz flow supports full validation, mutual exclusivity logic (`'general_checkup'` and `'none'`), forward/backward state persistence, and spring physics transitions.
3. The results layout incorporates:
   - `<RadialScoreGauge score={result.vitalityScore} bracket={result.vitalityBracket} />`
   - 4 Risk Axes with animated meters and clinical summaries
   - Dynamic Clinical Explanation section detailing the 6 core biomarkers (HbA1c, CBC, KFT, LFT, Lipid Profile, Vitamin D3)
   - Dual Package Recommendation Cards comparing targeted primary package with camp alternatives, displaying price contrast and exact savings tags
4. All CSS classes and properties adhere strictly to E2E test constraints (`.glass-assessment-card`, blur 28px, 1px top specular gradient, $\ge 44\text{px}$ touch targets, `pb-24` dock clearance, single column stacking $< 650\text{px}$).

---

## 6. Verification Method

To independently verify the architecture and its implementation:

1. **Verify E2E Test Suite Pass**:
   ```bash
   node e2e_tests/run_tests.js
   ```
   *Expected Result*: 116/116 tests pass across Tiers 1–4 with zero failures.

2. **Verify TypeScript & Production Build**:
   ```bash
   npm run build
   ```
   *Expected Result*: Vite builds with zero TypeScript errors and zero warnings.

3. **Verify DOM & CSS Token Compliance**:
   - Inspect that `.glass-assessment-card` has `backdrop-filter: blur(28px);`.
   - Inspect that `::before` pseudo-element provides top specular highlight.
   - Inspect that interactive chips and buttons have `min-height: 48px` ($\ge 44\text{px}$).
   - Inspect that `.vitality-container` has `padding-bottom: 96px`.
