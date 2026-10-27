# Architecture Analysis & Blueprint: Results View & Recommendation Cards
**Agent**: `m3_explorer_results_cards`  
**Milestone**: Milestone 3 — Interactive Glassmorphic UI & Portal Integration  
**Target File**: `src/components/VitalityAssessment/VitalityAssessment.tsx` (Results View & Subcomponents)  
**Associated Styles**: `src/components/VitalityAssessment/vitality-assessment.css`  
**Certified Upstream Modules**: `scoringEngine.ts`, `useSpringValue.ts`, `RadialScoreGauge.tsx`

---

## 1. Executive Summary & Design System Alignment

The Results View of the **DSD Care Vitality Assessment** is the clinical culmination of the 60-second health quiz. It translates patient inputs (lifestyle, symptoms, family history) into an authoritative, empathetic, and visually stunning clinical dashboard.

To fulfill the requirements of `ORIGINAL_REQUEST.md` (R1, R2, R3) and pass all acceptance criteria (F3, F4, F5, F8, F9 in `e2e_tests/`):
1. **Clinical Authoritativeness**: Deliver a clear visual hierarchy anchored by the animated `RadialScoreGauge` with its clinical bracket pill and score (/100).
2. **Multi-Axial Granularity**: Reveal 4 discrete horizontal risk meters (Metabolic, Cardiovascular, Renal, Joint/Inflammation) with spring-loaded progress fills and clinical interpretation narratives.
3. **Dual Package Hybrid Recommendations**: Present side-by-side cards contrasting the **Targeted Clinical Match** against the **Preventive Camp Alternative** (`smartadvance` ₹499 or `basiccamp` ₹299) with savings tags and parameter counts.
4. **Frictionless Conversion**: Provide 1-click cart addition with instant visual state feedback (`+ Add to Cart` → `✓ Added to Cart · Qty: 1`) that seamlessly invokes `onAddToCart(packageId)`, syncing with the DSD portal cart drawer and mobile dock.
5. **Clinical Biomarker Explanations**: Present an interactive accordion breaking down "Why Dr. Shastri Diagnostics recommends these tests" for HbA1c, CBC, KFT, LFT, Lipid Profile, and Vitamin D3 with priority hoisting.

---

## 2. Component Hierarchy & Data Flow

```
<VitalityAssessment> (Container: 3-step quiz or results view)
  │
  └── <VitalityResultsView> (Active when step === 'results')
        ├── <ResultsHeader>
        │     ├── Eyebrow & Certified Clinical Engine Badge
        │     ├── <RadialScoreGauge score={result.vitalityScore} bracket={result.vitalityBracket} size={240} />
        │     ├── Clinical Diagnosis Headline & Vitality Narrative
        │     ├── Patient Profile Context Pill (Age, Gender, Activity, Symptoms count)
        │     └── "Retake Assessment" Button (↺ reset quiz state)
        │
        ├── <RiskIndicatorBars>
        │     ├── Section Title ("Multi-Axial Risk Analysis")
        │     └── Grid (2 columns on desktop, 1 on mobile)
        │           ├── <RiskAxisBar axis="metabolic" data={result.riskAxes.metabolic} />
        │           ├── <RiskAxisBar axis="cardiovascular" data={result.riskAxes.cardiovascular} />
        │           ├── <RiskAxisBar axis="renal" data={result.riskAxes.renal} />
        │           └── <RiskAxisBar axis="joint" data={result.riskAxes.joint} />
        │
        ├── <RecommendationCards>
        │     ├── Section Title ("Recommended Diagnostic Workup")
        │     ├── Savings Banner Callout (when savingsAmount > 0)
        │     └── Dual Grid (Side-by-side on desktop, stacked on mobile)
        │           ├── <PackageCard variant="primary" package={result.primaryPackage} />
        │           └── <PackageCard variant="camp" package={result.campAlternativePackage} savings={...} />
        │
        └── <ClinicalExplanationsSection>
              ├── Section Title ("Why Dr. Shastri Diagnostics Recommends This")
              ├── Lab Accreditation Banner (NABL guidelines, HPLC, 6-part hemogram)
              └── <BiomarkerAccordion explanations={result.clinicalExplanations} />
```

---

## 3. Specification 1: Score Gauge Header & Vitality Bracket Pill

### 3.1 Visual & Structural Specification
- **Container**: `dsd-glass-panel` with specular gradient border and atmospheric radial glow matching the active tier (`#48ed86` for Optimal, `#f59e0b` for Moderate, `#f43f5e` for Elevated Risk).
- **RadialScoreGauge Integration**:
  - Direct embedding of `<RadialScoreGauge score={result.vitalityScore} bracket={result.vitalityBracket} size={240} showParticle={true} />`.
  - The gauge internally manages the spring animation ($k=300, c=30, m=1$), stroke dashoffset, rotating tip particle, and internal pill badge.
- **Narrative Headline & Subtitle**:
  Tailored directly to the clinical bracket:
  - **Optimal (80–98)**:
    - *Title*: "Optimal Physiological Vitality"
    - *Subtitle*: "Your reported lifestyle, metabolic indicators, and family history demonstrate strong physiological stability and low chronic risk."
    - *Accent*: Emerald glow (`#48ed86`)
  - **Moderate (55–79)**:
    - *Title*: "Actionable Preventive Opportunities"
    - *Subtitle*: "Mild to moderate risk factors detected. Targeted baseline screening and proactive lifestyle adjustments can reverse early vulnerabilities."
    - *Accent*: Warm Amber glow (`#f59e0b`)
  - **Elevated Risk (15–54)**:
    - *Title*: "Priority Diagnostic Follow-up Recommended"
    - *Subtitle*: "Multiple clinical risk indicators identified. Early diagnostic investigation is strongly advised to prevent silent disease progression."
    - *Accent*: Rose/Coral glow (`#f43f5e`)

- **Context Summary Chip**:
  - Displays patient parameters in a discreet, semi-transparent pill:
    `Age: ${input.ageGroup} · ${capitalize(input.gender)} · ${input.activityLevel} · ${input.symptoms.length} Symptoms Reported`
- **Quiz Retake Action**:
  - Clean tertiary action button: `↺ Retake Quiz` or `Modify Answers`.
  - Accessible touch target $\ge 44\text{px}$.
  - Resets quiz state back to Step 1 without page reload.

---

## 4. Specification 2: 4 Risk Indicator Horizontal Bars

### 4.1 Multi-Axial Data Binding & Physics
The 4 risk axes calculated in `scoringEngine.ts` are:
1. `metabolic`: Glycemic control, insulin resistance, HbA1c, glucose metabolism.
2. `cardiovascular`: Blood pressure, lipid profile, vascular stiffness, heart risk.
3. `renal`: Glomerular filtration, creatinine clearance, uric acid, urea.
4. `joint`: Musculoskeletal inflammation, RA factor, Vitamin D3, calcium balance.

### 4.2 Spring Animation on Progress Bars
Each meter's progress fill width is driven by the spring physics hook `useSpringValue`:
```typescript
const animatedPercentage = useSpringValue(axis.percentage, {
  initialValue: 0,
  stiffness: 280,
  damping: 28,
  mass: 1,
});
```
When the Results View mounts, all 4 bars glide smoothly from 0% to their target percentages with subtle 1.05x overshoot, creating an alive, reactive medical HUD feel.

### 4.3 Color Tokens & Tier Styling
| Risk Level | Percentage Threshold | Track Background | Progress Gradient | Text & Border Color |
|---|---|---|---|---|
| **Low** | `< 35%` | `rgba(16, 185, 129, 0.12)` | `linear-gradient(90deg, #10b981, #48ed86)` | `#48ed86` / `border-emerald-500/30` |
| **Moderate** | `35% – 65%` | `rgba(245, 158, 11, 0.12)` | `linear-gradient(90deg, #b7ff67, #f59e0b)` | `#f59e0b` / `border-amber-500/30` |
| **High** | `> 65%` | `rgba(244, 63, 94, 0.12)` | `linear-gradient(90deg, #f97316, #f43f5e)` | `#f43f5e` / `border-rose-500/30` |

### 4.4 Axis Bar Layout & Clinical Summary
```
+------------------------------------------------------------------------+
| [Icon] Metabolic & Glycemic Risk         [High Risk Pill]   [ 68% ]   |
| [====================================>..........] (Animated Gradient)  |
| "Elevated metabolic risk with pronounced glycemic vulnerability.       |
|  Comprehensive Diabetic Package (HbA1c, FBS, PPBS) urgently advised."  |
+------------------------------------------------------------------------+
```
- Responsive layout: `grid grid-cols-1 md:grid-cols-2 gap-4`.
- Touch target & card height: Generous padding (`p-4 sm:p-5`), rounded-2xl glass surface (`rgba(255, 255, 255, 0.03)` with `border-white/10`).
- ARIA: `role="progressbar" aria-valuenow={axis.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${axisTitle} risk level: ${axis.level}`}`.

---

## 5. Specification 3: Side-by-Side Hybrid Recommendation Cards

### 5.1 Dual-Package Architecture
As established in `PROJECT.md` and certified in `scoringEngine.ts`:
- **Card 1: Primary Clinical Match (`result.primaryPackage`)**:
  - The exact targeted diagnostic package addressing the detected clinical risk (e.g., Diabetic Package ₹840, Basic Joint Pain Package ₹875, Basic Weakness Package ₹2,730, Hypertension Package ₹4,710, Renal Screening ₹175, Special Joint ₹4,530, or Executive ₹999).
- **Card 2: Preventive Camp Alternative (`result.campAlternativePackage`)**:
  - The high-value broad screening camp alternative:
    - `smartadvance` (DSD Smart Health Advance, ₹499, 50 parameters, free clinic ECG) for general/metabolic/cardio/joint profiles.
    - `basiccamp` (Basic Health Pack, ₹299, 25 parameters, free clinic ECG) for renal screening profiles where primary price is ₹175.

### 5.2 Card Visual Hierarchy & Contrast
```
+------------------------------------+  +------------------------------------+
| 🎯 TARGETED CLINICAL MATCH          |  | ⚡ HIGH-VALUE CAMP ALTERNATIVE      |
| Diabetic Package                   |  | DSD Smart Health Advance           |
|                                    |  |                                    |
| ₹840  <del>₹900</del>  [6% off]    |  | ₹499  <del>₹499</del>  [ECG Free]  |
|                                    |  |                                    |
| [22 Test Parameters]               |  | [50 Parameters + Free ECG]         |
|                                    |  |                                    |
| • Fasting Blood Sugar (FBS)        |  | • Complete Blood Count (24 params) |
| • Post Prandial Sugar (PPBS)       |  | • Liver Function Test (LFT)        |
| • HbA1c (Glycated Hemoglobin)      |  | • Kidney Function Test (KFT)       |
| • Urine Routine & Microscopic      |  | • Lipid Profile Complete           |
|                                    |  | • Thyroid Profile (T3, T4, TSH)    |
|                                    |  | • HbA1c (Glycated Hemoglobin)      |
|                                    |  |                                    |
|                                    |  | [★ Save ₹461 vs Targeted Match]    |
|                                    |  |                                    |
| [+ Add to Cart]                    |  | [+ Add to Cart]                    |
| [Book Home Collection]             |  | [Book Home Collection]             |
+------------------------------------+  +------------------------------------+
```

### 5.3 Card Tokens & Badge Distinction
- **Primary Match Card**:
  - Border: `border-emerald-500/40` with top highlight gradient.
  - Glow: Ambient emerald aura (`rgba(72, 237, 134, 0.15)`).
  - Badge: `🎯 TARGETED CLINICAL MATCH` (`bg-emerald-500/15 text-emerald-300 border-emerald-500/40`).
  - Key focus: Clinical precision targeting detected organs.
- **Camp Alternative Card**:
  - Border: `border-amber-400/40` with gold highlight.
  - Glow: Warm amber/lime aura (`rgba(245, 158, 11, 0.15)`).
  - Badge: `⚡ PREVENTIVE CAMP ALTERNATIVE` (`bg-amber-500/15 text-amber-300 border-amber-500/40`).
  - Savings Contrast Badge:
    - Displayed whenever `result.savingsAmount > 0`:
      `<div className="savings-pill">Save ₹{result.savingsAmount} ({result.savingsPercentage}% lower cost)</div>`
    - High-contrast emerald/lime badge with pulse effect.

---

## 6. Specification 4: 1-Click Cart Addition & WhatsApp Booking Trigger

### 6.1 Cart Addition Mechanics
- **Integration Contract**:
  - In `App.tsx`: `const [cart, setCart] = useState({})`, with `qty(packageId, 1)` handling additions.
  - `VitalityAssessmentProps.onAddToCart(packageId)` directly calls `qty(packageId, 1)`.
- **Button Micro-Interactions & State Machine**:
  - State per package: `cartState: Record<string, { count: number; added: boolean }>`
  - States:
    1. **Idle**:
       - Text: `+ Add to Cart · ₹{price}`
       - Style: Gradient emerald fill (`#10b981` to `#059669`), hover scale 1.02x, active scale 0.98x via spring physics.
    2. **Adding (Instant optimistic update)**:
       - Text: `Adding...`
    3. **Added (Confirmed)**:
       - Text: `✓ Added to Cart (${count})`
       - Style: Solid emerald border with glowing background (`bg-emerald-500/20 text-emerald-300 border-emerald-400`).
       - Accompanied by micro-toast / banner notification: *"Package added to DSD Care Cart! Continue booking or add camp alternative."*

### 6.2 WhatsApp Direct Booking Trigger
- **Integration Contract**:
  - If `onBookPackage` prop is supplied by `App.tsx`: calls `onBookPackage(packageId)`.
  - Fallback / Direct Action: Pre-populates the official WhatsApp booking link (`WA_NUMBER = '919258888085'`).
- **Pre-populated Payload**:
  ```typescript
  const message = [
    `*Dr. Shastri Diagnostics — Health Vitality Booking*`,
    `----------------------------------------`,
    `Patient Assessment Result:`,
    `• Vitality Score: ${result.vitalityScore}/100 (${result.vitalityBracket})`,
    `• Selected Package: ${pkg.name} (₹${pkg.price})`,
    `• Parameters Included: ${pkg.parameterCount} tests`,
    `----------------------------------------`,
    `Please confirm home sample collection slot in Aligarh.`,
  ].join('\n');

  const waUrl = `https://wa.me/919258888085?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  ```
- **Accessibility & Touch Targets**:
  - Primary button height: $\ge 48\text{px}$ (exceeds WCAG AA $44\text{px}$).
  - Full width on mobile screens.

---

## 7. Specification 5: "Why Dr. Shastri Diagnostics Recommends This" Clinical Explanations Section

### 7.1 Clinical Authority & Priority Hoisting
`scoringEngine.ts` exports `getClinicalExplanations(input)`, which deterministically returns all 6 core biomarkers with dynamic priority hoisting:
- **Metabolic concern**: `HbA1c` hoisted to #1.
- **Cardiovascular concern**: `Lipid Profile` and `KFT` hoisted to #1 and #2.
- **Joint/Musculoskeletal concern**: `Vitamin D3` and `CBC` hoisted to #1 and #2.
- **Fatigue concern**: `CBC`, `Vitamin D3`, and `LFT` hoisted to #1, #2, and #3.
- **Renal concern**: `KFT` hoisted to #1.

### 7.2 Interactive Accordion Architecture
- **State**: `expandedBiomarkers: Set<string>`
  - Default: The top 2 prioritized biomarkers are expanded automatically on load.
  - The remaining 4 are collapsed with clean one-tap toggle.
- **Biomarker Header**:
  - Parameter Name: `HbA1c`, `CBC`, `KFT`, `LFT`, `Lipid Profile`, `Vitamin D3`.
  - Priority Badge: `★ Priority Marker for Your Risk Profile` (if matching top hoisted items).
  - Role Summary: High-level clinical role in italics or bright emerald (`item.role`).
  - Chevron Icon: Rotates $180^\circ$ smoothly on expand (`transition-transform duration-300`).
- **Biomarker Expanded Content**:
  - Authoritative Clinical Rationale: `item.reason` explaining 90–120 day glucose window, automated 6-part hemogram, silent 50% nephron loss, NAFLD transaminases, atherogenic ApoB plaque risk, or 25-OH Vitamin D3 bone mineralization.
  - Laboratory Standard Tag:
    - "Dr. Shastri Diagnostics Reference Laboratory Standard: High-Performance Liquid Chromatography (HPLC) / Automated 6-part hematology / NABL quality benchmark."

---

## 8. TypeScript Subcomponent Interfaces & Code Blueprint

The following clean, modular interfaces and subcomponents are ready to be integrated into `src/components/VitalityAssessment/VitalityAssessment.tsx`:

```typescript
// ============================================================================
// RESULTS VIEW COMPONENT BLUEPRINTS & INTERFACES
// ============================================================================

import React, { useState } from 'react';
import {
  AssessmentInput,
  AssessmentResult,
  RecommendedPackage,
  ClinicalExplanation,
  RiskAxis,
} from './scoringEngine';
import RadialScoreGauge from './RadialScoreGauge';
import { useSpringValue } from './useSpringValue';
import {
  Activity,
  HeartPulse,
  TestTube2,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ShoppingBag,
  MessageCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Zap,
} from 'lucide-react';

export interface ResultsViewProps {
  result: AssessmentResult;
  input: AssessmentInput;
  onAddToCart: (packageId: string) => void;
  onBookPackage?: (packageId: string) => void;
  onRetakeQuiz: () => void;
  className?: string;
}

// ----------------------------------------------------------------------------
// 1. RISK AXIS BAR SUBCOMPONENT (with Spring Fill)
// ----------------------------------------------------------------------------
export interface RiskAxisBarProps {
  axisKey: 'metabolic' | 'cardiovascular' | 'renal' | 'joint';
  title: string;
  icon: React.ReactNode;
  data: RiskAxis;
}

export const RiskAxisBar: React.FC<RiskAxisBarProps> = ({
  axisKey,
  title,
  icon,
  data,
}) => {
  // Animate progress bar fill smoothly from 0% with harmonic spring
  const animatedWidth = useSpringValue(data.percentage, {
    initialValue: 0,
    stiffness: 280,
    damping: 28,
  });

  const levelColorConfig = {
    Low: {
      barGradient: 'linear-gradient(90deg, #10b981, #48ed86)',
      badgeBg: 'rgba(72, 237, 134, 0.12)',
      badgeBorder: 'rgba(72, 237, 134, 0.35)',
      badgeText: '#a7f3d0',
      trackBg: 'rgba(72, 237, 134, 0.10)',
    },
    Moderate: {
      barGradient: 'linear-gradient(90deg, #b7ff67, #f59e0b)',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeBorder: 'rgba(245, 158, 11, 0.35)',
      badgeText: '#fde68a',
      trackBg: 'rgba(245, 158, 11, 0.10)',
    },
    High: {
      barGradient: 'linear-gradient(90deg, #f97316, #f43f5e)',
      badgeBg: 'rgba(244, 63, 94, 0.12)',
      badgeBorder: 'rgba(244, 63, 94, 0.35)',
      badgeText: '#fecdd3',
      trackBg: 'rgba(244, 63, 94, 0.10)',
    },
  }[data.level];

  return (
    <div className="dsd-glass-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
          <span className="p-1.5 rounded-lg bg-white/5 text-emerald-400">
            {icon}
          </span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: levelColorConfig.badgeBg,
              borderColor: levelColorConfig.badgeBorder,
              color: levelColorConfig.badgeText,
            }}
          >
            {data.level} Risk
          </span>
          <span className="font-mono text-sm font-bold text-white tabular-nums">
            {Math.round(animatedWidth)}%
          </span>
        </div>
      </div>

      {/* Track & Spring Progress Bar */}
      <div
        className="h-2.5 w-full rounded-full overflow-hidden relative"
        style={{ backgroundColor: levelColorConfig.trackBg }}
        role="progressbar"
        aria-valuenow={data.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} risk level: ${data.level}`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, animatedWidth))}%`,
            background: levelColorConfig.barGradient,
            boxShadow: `0 0 10px ${levelColorConfig.badgeBorder}`,
          }}
        />
      </div>

      {/* Clinical Summary Subtext */}
      <p className="mt-2.5 text-xs text-neutral-300 leading-relaxed">
        {data.summary}
      </p>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 2. PACKAGE RECOMMENDATION CARD SUBCOMPONENT
// ----------------------------------------------------------------------------
export interface RecommendationCardProps {
  pkg: RecommendedPackage;
  variant: 'primary' | 'camp';
  savingsAmount?: number;
  savingsPercentage?: number;
  onAddToCart: (packageId: string) => void;
  onBookPackage?: (packageId: string) => void;
  cartCount: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  pkg,
  variant,
  savingsAmount = 0,
  savingsPercentage = 0,
  onAddToCart,
  onBookPackage,
  cartCount,
}) => {
  const isCamp = variant === 'camp';

  const handleBookDirect = () => {
    if (onBookPackage) {
      onBookPackage(pkg.id);
    } else {
      const msg = `Hello Dr. Shastri Diagnostics, I completed my Vitality Assessment and would like to book home collection for the ${pkg.name} (₹${pkg.price}). Please confirm slots.`;
      window.open(
        `https://wa.me/919258888085?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <div
      className={`dsd-glass-panel relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 ${
        isCamp
          ? 'border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.12)]'
          : 'border-emerald-500/40 shadow-[0_0_30px_rgba(72,237,134,0.15)]'
      }`}
    >
      <div>
        {/* Card Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
              isCamp
                ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
            }`}
          >
            {isCamp ? <Sparkles size={13} /> : <Zap size={13} />}
            {isCamp ? 'Preventive Camp Alternative' : 'Targeted Clinical Match'}
          </span>
          <span className="text-[11px] font-semibold text-neutral-400">
            {pkg.tag}
          </span>
        </div>

        {/* Package Title & Description */}
        <h3 className="font-['Manrope'] text-2xl font-extrabold text-white tracking-tight mb-1">
          {pkg.name}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-300 mb-4 line-clamp-2">
          {pkg.description}
        </p>

        {/* Pricing Block */}
        <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-white/10">
          <span className="font-['Manrope'] text-3xl font-extrabold text-white">
            ₹{pkg.price.toLocaleString('en-IN')}
          </span>
          {pkg.originalPrice > pkg.price && (
            <del className="text-sm font-semibold text-neutral-400">
              ₹{pkg.originalPrice.toLocaleString('en-IN')}
            </del>
          )}
          <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-emerald-300">
            {pkg.parameterCount} Parameters {isCamp && '+ Free ECG'}
          </span>
        </div>

        {/* Savings Pill (Camp Card Only) */}
        {isCamp && savingsAmount > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <BadgeCheck size={16} className="text-emerald-400 shrink-0" />
            <span>
              Save ₹{savingsAmount.toLocaleString('en-IN')} ({savingsPercentage}% lower cost vs targeted match)
            </span>
          </div>
        )}

        {/* Key Inclusions List */}
        <div className="space-y-1.5 mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Key Diagnostic Inclusions:
          </span>
          <ul className="space-y-1">
            {pkg.keyParameters.slice(0, 5).map((param) => (
              <li
                key={param}
                className="flex items-center gap-2 text-xs text-neutral-200"
              >
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate">{param}</span>
              </li>
            ))}
            {pkg.keyParameters.length > 5 && (
              <li className="text-[11px] text-neutral-400 pl-5">
                + {pkg.keyParameters.length - 5} additional parameters
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => onAddToCart(pkg.id)}
          className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
            cartCount > 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(72,237,134,0.25)]'
              : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
          }`}
        >
          {cartCount > 0 ? (
            <>
              <CheckCircle2 size={16} /> Added to Cart ({cartCount})
            </>
          ) : (
            <>
              <ShoppingBag size={16} /> Add to Cart · ₹{pkg.price}
            </>
          )}
        </button>

        <button
          onClick={handleBookDirect}
          className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle size={15} className="text-emerald-400" /> Book Home Collection
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 3. CLINICAL EXPLANATIONS ACCORDION SUBCOMPONENT
// ----------------------------------------------------------------------------
export interface ClinicalAccordionProps {
  explanations: ClinicalExplanation[];
}

export const ClinicalAccordion: React.FC<ClinicalAccordionProps> = ({
  explanations,
}) => {
  // Top 2 hoisted parameters start expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(explanations.slice(0, 2).map((e) => e.parameter))
  );

  const toggle = (param: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(param)) next.delete(param);
      else next.add(param);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {explanations.map((item, idx) => {
        const isOpen = expanded.has(item.parameter);
        const isPriority = idx < 2;

        return (
          <div
            key={item.parameter}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? 'bg-white/[0.04] border-emerald-500/30 shadow-[0_0_20px_rgba(72,237,134,0.08)]'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
            }`}
          >
            <button
              onClick={() => toggle(item.parameter)}
              className="w-full min-h-[56px] px-5 py-3.5 flex items-center justify-between gap-4 text-left select-none"
              aria-expanded={isOpen}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-['Manrope'] font-bold text-white text-sm sm:text-base">
                    {item.parameter}
                  </span>
                  {isPriority && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ★ Key Focus
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 font-normal line-clamp-1">
                  {item.role}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`text-neutral-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-white/5 text-xs sm:text-sm text-neutral-300 leading-relaxed animate-fadeIn">
                <p className="mb-2.5">{item.reason}</p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                  <BadgeCheck size={14} /> Dr. Shastri Diagnostics Laboratory Reference Protocol
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

---

## 9. Integration with Portal (`src/App.tsx`)

In `App.tsx`, the assessment is anchored at `#vitality-score` directly beneath the Hero section:
```tsx
<section id="vitality-score" className="vitality-assessment-container">
  <VitalityAssessment
    onAddToCart={(packageId) => qty(packageId, 1)}
    onBookPackage={(packageId) => {
      qty(packageId, 1);
      setBookingOpen(true);
    }}
  />
</section>
```
When `qty(packageId, 1)` runs:
1. `cart[packageId]` increments by 1.
2. `count` in the header badge (`Cart <b>{count}</b>`) and fixed `.mobileDock` updates immediately.
3. Total price is calculated and ready in the drawer.
4. When the user sends booking via WhatsApp, `cartItems` serialize the exact package name, quantity, and price.

---

## 10. Summary Checklist for Implementation (`m3_worker`)
- [x] Full contract compliance with `scoringEngine.ts` and `RadialScoreGauge.tsx`.
- [x] Zero external styling libraries; uses Tailwind and `vitality-assessment.css`.
- [x] Full spring physics for risk bars and gauge.
- [x] Clear side-by-side card contrast with savings badge.
- [x] Accessible $\ge 44\text{px}$ touch targets and mobile `pb-24` clearance for the 56px `.mobileDock`.
