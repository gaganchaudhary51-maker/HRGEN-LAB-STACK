# Project: DSD Patient Booking — Interactive Health Risk & Vitality Score Assessment Tool

## Architecture
The Health Risk & Vitality Score assessment tool is an Awwwards-grade, dark-glassmorphic interactive component embedded within the Dr. Shastri Diagnostics (DSD) single-page patient booking portal. It calculates patient health risk profiles via a 60-second 3-step clinical quiz and dynamically recommends targeted primary packages alongside high-value preventive camp alternatives with 1-click cart addition.

### System Boundaries & Data Flow
1. **Clinical Scoring & Recommendation Core (`src/components/VitalityAssessment/scoringEngine.ts`)**:
   - Pure, deterministic calculation engine. [COMPLETED & CERTIFIED]
   - Takes 3-step quiz answers: demographics/lifestyle, symptoms/concerns, family history.
   - Computes:
     - Overall Vitality Score: integer bounded [15, 98] on a 0–100 scale.
     - 4 Sub-Axis Risk Profiles: Metabolic, Cardiovascular, Renal, Joint/Inflammation (levels: Low, Moderate, High; percentages: 0–100%).
     - Dual Package Recommendation: Targeted Primary Match + Preventive Camp Alternative (`smartadvance` ₹499 or `basiccamp` ₹299) with savings calculation.
     - Dynamic Clinical Explanation: Parameter breakdown for HbA1c, CBC, KFT, LFT, Lipid Profile, and Vitamin D3 tailored to the patient's detected risk profile.
2. **Spring Physics & Radial Dial Engine (`src/components/VitalityAssessment/useSpringValue.ts` & `RadialScoreGauge.tsx`)**:
   - Zero-dependency damped harmonic oscillator ($k=300, c=30, m=1$) providing smooth 60fps animations with 1.05x subtle overshoot.
   - Animated SVG radial circular score gauge with dynamic multi-stop gradient (Optimal Emerald / Moderate Amber / Elevated Coral), glowing head particle, and live numeric counter.
3. **Interactive Glassmorphic Component (`src/components/VitalityAssessment/VitalityAssessment.tsx` & `vitality-assessment.css`)**:
   - Multi-layered dark glassmorphism (`backdrop-filter: blur(28px)`, specular top-lit borders, ambient shadow diffusion).
   - 3-step interactive clinical quiz navigation with spring transitions.
   - Dual package recommendation cards with savings comparison badges and "Add to Cart" CTAs.
4. **Portal Integration (`src/App.tsx`)**:
   - Embedded interactive section anchored at `#vitality-score` right below Hero.
   - Hero CTA button: "Take 60s Health Quiz ✨".
   - Header Nav button: "Vitality Score ✨".
   - 1-click addition invokes `qty(packageId, 1)`, immediately updating cart badge, cart drawer, and WhatsApp home collection booking payload.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | 3-Step Interactive Clinical Quiz | 3 steps: Demographics/Lifestyle, Symptoms/Concerns, Family Medical History | M3 | ORIGINAL_REQUEST R1 |
| F2 | Multi-Axial Clinical Calculation Engine | Computes Overall Vitality Score (0-100 bounded) and 4 risk axes (Metabolic, Cardio, Renal, Joint) | M1 (DONE) | ORIGINAL_REQUEST R1 |
| F3 | Hybrid Package Recommendation Engine | Pairs Targeted Primary Match with Preventive/Camp Alternative (`smartadvance` ₹499 / `basiccamp` ₹299) with price & savings contrast | M1 (DONE) | ORIGINAL_REQUEST R2 |
| F4 | Dynamic Clinical Explanation Engine | Explains "Why Dr. Shastri Diagnostics recommends this" highlighting HbA1c, CBC, KFT, LFT, Lipid, Vitamin D3 | M1 (DONE) | ORIGINAL_REQUEST R2 |
| F5 | 1-Click Cart Addition & Booking Sync | Invokes `qty(id, 1)` to sync with cart drawer, badge counts, and WhatsApp home collection booking | M3 | ORIGINAL_REQUEST R2 |
| F6 | Awwwards-Grade Spring Physics | Damped harmonic oscillator ($k=300, c=30, m=1, 1.05\times$ overshoot) for dials, steps, and card interactions | M2 (DONE) | ORIGINAL_REQUEST R3 |
| F7 | Multi-Layered Dark Glassmorphism | `backdrop-filter: blur(28px)`, ambient shadows, specular top edge gradient, dark emerald palette | M3 | ORIGINAL_REQUEST R3 |
| F8 | Animated SVG Radial Score Gauge | Circular arc gauge ($r=92\text{px}$), dynamic gradients, glowing particle, numeric counter | M2 (DONE) | ORIGINAL_REQUEST R3 |
| F9 | Mobile Responsiveness & Accessibility | Single-column stacking, $\ge 44\text{px}$ touch targets, `pb-24` clearance for 56px fixed `.mobileDock`, reduced motion support | M3 | ORIGINAL_REQUEST R3 |
| F10| E2E Requirement-Driven Test Suite | Opaque-box test suite covering Tiers 1-4 (Features, Boundaries, Pairwise Combinations, Real-World Scenarios) | E2E-Test (DONE) | Dual Track Mandate |
| F11| Final Verification & Coverage Hardening | 100% E2E test pass, adversarial Tier 5 coverage audit, zero TS/console errors, clean production build | M4 (Final) | Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **E2E-Test** | **E2E Testing Track** | Independent test suite creation (Tiers 1-4), test runner, and publication of `TEST_READY.md` | None | **DONE** |
| **M1** | **Clinical Scoring & Recommendation Engine** | Pure TypeScript module: `scoringEngine.ts`, Vitality Score (0-100), 4 risk axes, package recommendations, Dr. Shastri clinical explanations | None | **DONE** |
| **M2** | **Spring Physics & SVG Radial Gauge** | `useSpringValue.ts`, `RadialScoreGauge.tsx`, spring micro-interactions ($k=300, c=30, m=1, 1.05\times$ overshoot) | None | **DONE** |
| **M3** | **Interactive Glassmorphic UI & Portal Integration** | `VitalityAssessment.tsx`, `vitality-assessment.css`, integration in `App.tsx` (Hero CTA, Nav, `#vitality-score`, 1-click cart addition via `qty(id, 1)`) | M1, M2 | **IN_PROGRESS** |
| **M4** | **Final E2E Pass & Adversarial Hardening** | Phase 1: 100% pass of E2E test suite (Tiers 1-4). Phase 2: Adversarial white-box coverage hardening (Tier 5) | M3, E2E-Test | PLANNED |

---

## Interface Contracts

### Clinical Engine Contract (`scoringEngine.ts`) — Certified
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

### Spring Physics Contract (`useSpringValue.ts`)
```typescript
export interface SpringConfig {
  stiffness?: number; // default: 300
  damping?: number;   // default: 30
  mass?: number;      // default: 1
}

export function useSpringValue(targetValue: number, config?: SpringConfig): number;
```

### Assessment Component Contract (`VitalityAssessment.tsx`)
```typescript
export interface VitalityAssessmentProps {
  onAddToCart: (packageId: string) => void;
  onBookPackage?: (packageId: string) => void;
  className?: string;
}
```

---

## Code Layout
```
01_DSD_Patient_Booking/
├── src/
│   ├── components/
│   │   └── VitalityAssessment/
│   │       ├── scoringEngine.ts         # M1: Clinical calculation & recommendation logic [DONE]
│   │       ├── useSpringValue.ts        # M2: Spring physics hook (k=300, c=30, m=1)
│   │       ├── RadialScoreGauge.tsx     # M2: Animated SVG radial score dial
│   │       ├── VitalityAssessment.tsx   # M3: 3-step quiz, dual cards, Dr. Shastri explanation
│   │       └── vitality-assessment.css  # M3: Glassmorphism tokens (blur 28px), spring keyframes
│   ├── App.tsx                          # M3: Portal integration (Nav, Hero CTA, #vitality-score, cart sync)
│   └── index.css                        # Supporting portal theme styles
├── e2e_tests/                           # E2E-Test Track: Test harness and Tier 1-4 test suites [DONE]
│   ├── referenceOracle.js               # Authoritative test oracle
│   ├── run_tests.js                     # Test runner script (116 tests passing)
│   ├── tier1_feature_tests.json         # Feature coverage tests (50 tests)
│   ├── tier2_boundary_tests.json        # Boundary & corner tests (48 tests)
│   ├── tier3_combination_tests.json     # Cross-feature pairwise tests (12 tests)
│   └── tier4_application_tests.json     # Real-world clinical workload tests (6 tests)
├── TEST_INFRA.md                        # E2E Testing Track architecture & thresholds [DONE]
├── TEST_READY.md                        # Signal that E2E test suite is ready [DONE]
└── PROJECT.md                           # Master Project Blueprint (this document)
```
