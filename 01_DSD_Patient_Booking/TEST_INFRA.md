# TEST_INFRA — DSD Patient Booking Portal Test Infrastructure & Dual Track Specification

## 1. Architecture Overview & Dual Track Philosophy

Dr. Shastri Diagnostics (DSD) Patient Booking Portal features an interactive Health Risk & Vitality Score assessment tool embedded within a high-performance single-page diagnostic application. The assessment tool computes multi-axial clinical risk indicators via a 60-second 3-step smart quiz, renders an Awwwards-grade animated SVG radial score gauge with spring physics ($k=300, c=30, m=1$ with $1.05\times$ subtle overshoot) and dark glassmorphic surfaces (`backdrop-filter: blur(28px)`), and dynamically recommends targeted primary clinical matches alongside high-value preventive camp alternatives with 1-click cart addition.

To ensure medical reliability, mathematical precision, and non-regression across milestones, testing follows a rigorous **Dual Track Architecture**:

- **Track 1: White-Box Implementation Track (M1, M2, M3)**:
  - **M1**: Pure clinical calculation and recommendation engine (`src/components/VitalityAssessment/scoringEngine.ts`). Computes integer Vitality Score clamped strictly to $[15, 98]$, 4 risk axes (Metabolic, Cardiovascular, Renal, Joint/Inflammation), dual package recommendations, and dynamic clinical explanations for 6 biomarkers (HbA1c, CBC, KFT, LFT, Lipid Profile, Vitamin D3).
  - **M2**: Zero-dependency spring physics hook (`src/components/VitalityAssessment/useSpringValue.ts`) and SVG radial score gauge (`src/components/VitalityAssessment/RadialScoreGauge.tsx`).
  - **M3**: Multi-layered dark glassmorphic UI (`VitalityAssessment.tsx`, `vitality-assessment.css`) and portal integration (`src/App.tsx`) with 1-click cart synchronization via `qty(packageId, 1)` and WhatsApp home collection dispatch.

- **Track 2: Opaque-Box End-to-End System Tests (`e2e_tests/run_tests.js`)**:
  - Exercises the clinical contracts, boundary conditions, spring physics formulas, UI tokens, cart mutations, and clinical patient workflows strictly from an external, opaque-box perspective.
  - Requires zero third-party testing dependencies; runs natively on Node.js with colored ANSI progress reporting and fail-closed exit codes.
  - Houses 116 comprehensive test cases distributed across 4 distinct testing tiers.

---

## 2. Test Runner Infrastructure & Environment

- **Execution Command**: `node e2e_tests/run_tests.js`
- **Runtime**: Node.js v18+ / v20+ / v24+ (ES Module runtime adhering to `"type": "module"` in `package.json`).
- **Dependencies**: Zero external dependencies (native Node.js `fs`, `path`, `url`).
- **Configuration & Test Fixture Files**:
  - `e2e_tests/referenceOracle.js`: Authoritative mathematical reference oracle implementing clinical scoring algorithms, harmonic oscillator simulation, SVG radial geometry, and cart synchronization validators derived directly from `PROJECT.md` and `src/App.tsx:29-75`.
  - `e2e_tests/tier1_feature_tests.json`: Tier 1 Feature Coverage (50 tests covering F1–F9).
  - `e2e_tests/tier2_boundary_tests.json`: Tier 2 Boundary & Corner Cases (48 tests covering score clamping $[15, 98]$, empty/max inputs, zero price deltas, age/activity/stress extremes).
  - `e2e_tests/tier3_combination_tests.json`: Tier 3 Cross-Feature Combinations (12 tests covering pairwise and quad-axis clinical co-morbidities).
  - `e2e_tests/tier4_application_tests.json`: Tier 4 Real-World Clinical Workload Scenarios (6 complete end-to-end patient journeys).

---

## 3. Requirements Traceability Matrix (R1 – R3 & F1 – F9)

| Req | Feature | Feature Name & Scope | Test Tier | Test Coverage Count | Status |
|-----|---------|----------------------|-----------|---------------------|--------|
| **R1** | **F1** | 3-Step Interactive Clinical Quiz | Tier 1 | 6 tests (`T1.F1.1` – `T1.F1.6`) | **PASS** |
| **R1** | **F2** | Multi-Axial Clinical Calculation Engine | Tier 1, 2, 3 | 6 tests (`T1.F2.1` – `T1.F2.6`) + Tier 2/3 | **PASS** |
| **R2** | **F3** | Hybrid Package Recommendation Engine | Tier 1, 3, 4 | 6 tests (`T1.F3.1` – `T1.F3.6`) + Tier 4 | **PASS** |
| **R2** | **F4** | Dynamic Clinical Explanation Engine | Tier 1, 3 | 6 tests (`T1.F4.1` – `T1.F4.6`) | **PASS** |
| **R2** | **F5** | 1-Click Cart Addition & Booking Sync | Tier 1, 2, 4 | 5 tests (`T1.F5.1` – `T1.F5.5`) + Tier 4 | **PASS** |
| **R3** | **F6** | Awwwards-Grade Spring Physics ($k=300, c=30, m=1$) | Tier 1, 2 | 5 tests (`T1.F6.1` – `T1.F6.5`) | **PASS** |
| **R3** | **F7** | Multi-Layered Dark Glassmorphism (`blur(28px)`) | Tier 1 | 5 tests (`T1.F7.1` – `T1.F7.5`) | **PASS** |
| **R3** | **F8** | Animated SVG Radial Score Gauge ($r=92\text{px}$) | Tier 1, 2 | 6 tests (`T1.F8.1` – `T1.F8.6`) | **PASS** |
| **R3** | **F9** | Mobile Responsiveness & Accessibility ($\ge 44\text{px}$, `pb-24`) | Tier 1 | 5 tests (`T1.F9.1` – `T1.F9.5`) | **PASS** |

---

## 4. Opaque-Box E2E Test Suite Matrix (4 Tiers)

### Tier 1: Feature Coverage (50 Tests)

- **Feature 1: 3-Step Interactive Clinical Quiz (6 Tests)**:
  - `T1.F1.1`: Step 1 demographics and lifestyle field validation (ageGroup, gender, activityLevel, sleepStress).
  - `T1.F1.2`: Step 2 primary symptoms and concerns multi-select chip capture.
  - `T1.F1.3`: Step 3 family medical history multi-select array capture.
  - `T1.F1.4`: Quiz forward/backward navigation state persistence without loss.
  - `T1.F1.5`: Routine wellness selection (`general_checkup`) preserves optimal vitality baseline.
  - `T1.F1.6`: Invalid symptom string rejection guard.

- **Feature 2: Multi-Axial Clinical Calculation Engine (6 Tests)**:
  - `T1.F2.1`: Vitality score computation for pristine young adult baseline (score: 98, Optimal).
  - `T1.F2.2`: Metabolic risk axis elevation on thirst and family diabetes history (High $\ge 60\%$).
  - `T1.F2.3`: Cardiovascular risk axis elevation on BP concerns and family hypertension (High $\ge 60\%$).
  - `T1.F2.4`: Renal risk axis elevation on family kidney history and osmotic strain (High $\ge 55\%$).
  - `T1.F2.5`: Joint and inflammation axis elevation on stiffness and senior age (High $\ge 55\%$).
  - `T1.F2.6`: Vitality bracket classification boundaries (Optimal $\ge 80$, Moderate $55-79$, Elevated Risk $< 55$).

- **Feature 3: Hybrid Package Recommendation Engine (6 Tests)**:
  - `T1.F3.1`: Diabetic Package (`diabetes` ₹840 / `thyrodiabetes` ₹960) paired with `smartadvance` (₹499).
  - `T1.F3.2`: Basic Joint Pain Package (`joint` ₹875) paired with `smartadvance` (₹499) saving ₹376.
  - `T1.F3.3`: Basic Weakness Package (`weakness` ₹2,730) paired with `smartadvance` (₹499) saving ₹2,231 (82% off).
  - `T1.F3.4`: Hypertension Package (`hypertension` ₹4,710) paired with `smartadvance` (₹499) saving ₹4,211 (89% off).
  - `T1.F3.5`: Renal Screening Package (`renal` ₹175) paired with `basiccamp` (₹299 with free ECG).
  - `T1.F3.6`: Executive Full Body Checkup (`executive` ₹999) paired with `basiccamp` (₹299) saving ₹700.

- **Feature 4: Dynamic Clinical Explanation Engine (6 Tests)**:
  - `T1.F4.1`: HbA1c 3-month erythrocyte glucose rationale highlighted for metabolic indications.
  - `T1.F4.2`: CBC 24+ cellular hemogram and anemia rationale highlighted for fatigue symptoms.
  - `T1.F4.3`: KFT glomerular filtration and creatinine clearance highlighted for renal/vascular indications.
  - `T1.F4.4`: LFT transaminases and fatty liver screening highlighted for hepatic/sedentary profile.
  - `T1.F4.5`: Lipid Profile atherogenic plaque and ASCVD risk highlighted for cardiovascular concerns.
  - `T1.F4.6`: Vitamin D3 calcium absorption and bone mineral balance highlighted for joint stiffness.

- **Feature 5: 1-Click Cart Addition & Booking Synchronization (5 Tests)**:
  - `T1.F5.1`: Cart addition updates item quantity by 1 via `qty(id, 1)`.
  - `T1.F5.2`: Multiple package cart aggregation and price summation.
  - `T1.F5.3`: Cart removal removes key completely when quantity reaches zero (`qty(id, -1)`).
  - `T1.F5.4`: WhatsApp booking URL serialization formats patient name, phone, packages, and total price.
  - `T1.F5.5`: Repeated clicks on "Add to Cart" increment count smoothly without state corruption.

- **Feature 6: Awwwards-Grade Spring Physics (5 Tests)**:
  - `T1.F6.1`: Damped harmonic oscillator configuration ($k=300, c=30, m=1, \omega_0=17.32\text{ rad/s}, \zeta=0.866$).
  - `T1.F6.2`: Spring trajectory exhibits subtle $1.05\times$ overshoot ratio before settling.
  - `T1.F6.3`: Spring settle duration completes within 600ms tolerance band.
  - `T1.F6.4`: `prefers-reduced-motion` bypass disables animated spring delay, assigning value immediately.
  - `T1.F6.5`: Spring velocity decays monotonically to zero after initial transient peak.

- **Feature 7: Multi-Layered Dark Glassmorphism (5 Tests)**:
  - `T1.F7.1`: Backdrop filter blur token set to `28px` (`backdrop-filter: blur(28px)`).
  - `T1.F7.2`: Top-lit specular edge gradient highlight pseudo-element presence (`::before`, height 1px).
  - `T1.F7.3`: Ambient occlusion shadow (`0 24px 80px rgba(0,0,0,0.55)`) and border line tokens.
  - `T1.F7.4`: Typography weight constraint on glass surfaces strictly enforces font-weight $\le 500$ for copy legibility.
  - `T1.F7.5`: Interactive glass card hover state elevation with emerald glow.

- **Feature 8: Animated SVG Radial Score Gauge (6 Tests)**:
  - `T1.F8.1`: Radial gauge geometry ($r=92\text{px}$, circumference $C \approx 578.053\text{px}$).
  - `T1.F8.2`: Stroke dashoffset calculation for Optimal score 85 ($86.708\text{px}$, `#48ed86` emerald glow).
  - `T1.F8.3`: Stroke dashoffset calculation for Moderate score 65 ($202.319\text{px}$, `#f59e0b` amber glow).
  - `T1.F8.4`: Stroke dashoffset calculation for Elevated Risk score 40 ($346.832\text{px}$, `#f43f5e` coral glow).
  - `T1.F8.5`: Orbiting head particle coordinates calculated along circular path ($120 + 92\cos\theta, 120 + 92\sin\theta$).
  - `T1.F8.6`: Numeric counter synchronization rounding smoothly to nearest integer.

- **Feature 9: Mobile Responsiveness & Accessibility (5 Tests)**:
  - `T1.F9.1`: Interactive touch targets maintain minimum $44 \times 44\text{px}$ clickable area.
  - `T1.F9.2`: Bottom padding clearance (`pb-24` / $96\text{px}$) clears $56\text{px}$ fixed `.mobileDock`.
  - `T1.F9.3`: Responsive grid collapses into single-column layout on viewports $< 650\text{px}$.
  - `T1.F9.4`: ARIA accessibility landmarks (`role="region"`, `role="radiogroup"`, `aria-live="polite"`).
  - `T1.F9.5`: Text contrast ratio exceeds WCAG AA $4.5:1$ threshold ($16:1$ primary, $5.8:1$ secondary against `#050606`).

---

### Tier 2: Boundary & Corner Cases (48 Tests)

- **Score Clamping Lower Bound**:
  - `T2.BC.1`: Extreme worst-case multi-morbidity (raw score $-43$) clamps strictly to lower bound $15$.
  - `T2.BC.2`: Sub-15 raw score $10$ clamps strictly to $15$.
  - `T2.BC.3`: Exact lower boundary raw score $15$ evaluates to $15$.
  - `T2.BC.4`: Just above lower boundary raw score $17$ evaluates to $17$ unclamped.
- **Score Clamping Upper Bound**:
  - `T2.BC.5`: Pristine inputs raw score $100$ clamps strictly to upper bound $98$.
  - `T2.BC.6`: Completely empty symptoms raw score $100$ clamps strictly to $98$.
  - `T2.BC.7`: Near upper boundary raw score $98$ is preserved at $98$.
- **Empty Inputs**:
  - `T2.BC.8`: Empty symptoms array `[]` processed safely without null pointer exception.
  - `T2.BC.9`: Empty family history array `[]` processed safely.
  - `T2.BC.10`: Simultaneously empty symptoms and family history processed safely.
- **Max Inputs**:
  - `T2.BC.11`: All 5 symptoms selected simultaneously handled without array overflow.
  - `T2.BC.12`: All 4 medical family histories selected simultaneously handled.
- **Zero & Negative Price Delta Guards**:
  - `T2.BC.13`: Equal package prices yield `savingsAmount = 0` and `savingsPercentage = 0`.
  - `T2.BC.14`: Primary package cheaper than camp package (`renal` ₹175 vs `basiccamp` ₹299) clamps `savingsAmount` to $0$ rather than negative.
- **Demographic & Lifestyle Boundaries**:
  - `T2.BC.15` – `T2.BC.18`: Age group boundary deductions ('18-29': 0, '30-45': -5, '46-60': -12, '60+': -18).
  - `T2.BC.19` – `T2.BC.21`: Activity level boundary deductions ('active': 0, 'moderate': -6, 'sedentary': -14).
  - `T2.BC.22` – `T2.BC.24`: Sleep & stress boundary deductions ('restful': 0, 'moderate_stress': -7, 'poor_sleep_high_stress': -15).
  - `T2.BC.25`: Gender invariance: identical clinical scores across 'male', 'female', and 'other'.
- **Bracket Threshold Boundaries**:
  - `T2.BC.26`: Exact score $80$ is 'Optimal'.
  - `T2.BC.27`: Exact score $79$ is 'Moderate'.
  - `T2.BC.28`: Exact score $55$ is 'Moderate'.
  - `T2.BC.29`: Exact score $54$ is 'Elevated Risk'.
- **Radial Gauge Arc Boundaries**:
  - `T2.BC.30` – `T2.BC.32`: Stroke dashoffset boundaries at score $0$ ($578.053\text{px}$), score $50$ ($289.027\text{px}$), and score $100$ ($0\text{px}$).
- **Cart State Boundaries**:
  - `T2.BC.33`: Invoking `qty(id, 0)` causes no state mutation.
  - `T2.BC.34`: High quantity boundary ($100$ packages) sums accurately.
  - `T2.BC.35`: Decrementing past zero cleanly deletes key without negative counts.
- **Input Sanitization**:
  - `T2.BC.36` – `T2.BC.37`: Duplicate symptoms and family histories deduplicated to prevent double-penalization.
- **Individual Symptom & Family Deductions**:
  - `T2.BC.38` – `T2.BC.46`: Isolated penalties: thirst_urination ($-16$), bp_concerns ($-16$), joint_pain ($-14$), fatigue ($-12$), diabetes ($-10$), hypertension ($-10$), kidney ($-10$), thyroid ($-8$), none ($0$).
- **Explanation & Spring Invariants**:
  - `T2.BC.47`: Guaranteed minimum of 3 clinical explanations returned for any input.
  - `T2.BC.48`: Zero displacement spring invocation stability ($initial = target$).

---

### Tier 3: Cross-Feature Combinations & Co-Morbidities (12 Tests)

- `T3.C.1`: **Diabetes Symptoms + Joint Pain**: Dual Metabolic and Joint risk activation, recommends `thyrodiabetes` and `smartadvance`.
- `T3.C.2`: **Extreme Age (60+) + Hypertension**: High cardiovascular risk, recommends `hypertension` saving ₹4,211 against `smartadvance`.
- `T3.C.3`: **Chronic Fatigue + Sedentary Lifestyle**: Flags anemia/vitality deficit, recommends `weakness` saving ₹2,231 against `smartadvance`.
- `T3.C.4`: **Thirst/Urination + Family Kidney Disease**: Elevated renal risk, highlights KFT and HbA1c parameters.
- `T3.C.5`: **Joint Stiffness + Severe Sleep Disturbance**: Highlights Vitamin D3 bone mineral balance and systemic inflammation.
- `T3.C.6`: **BP Concerns + Family Diabetes + Sedentary**: Cardio-metabolic risk cluster.
- `T3.C.7`: **General Checkup + Maternal Diabetes History**: Asymptomatic prevention with familial risk explanation.
- `T3.C.8`: **Fatigue + BP Concerns Cross Pair**: Combined CBC and Lipid Profile clinical investigation.
- `T3.C.9`: **Senior Age (60+) + Joint Pain + BP Concerns**: Multi-system osteo-cardiovascular co-morbidity.
- `T3.C.10`: **Thirst + Fatigue + Family Thyroid**: Thyro-diabetic metabolic syndrome targeting `thyrodiabetes`.
- `T3.C.11`: **Quad-Axis Multi-Morbidity Stress Test**: All 4 axes triggered, score safely clamped to $15$.
- `T3.C.12`: **Pristine Baseline Control**: Zero pathology symptoms and no family history cleanly achieves $98$ points.

---

### Tier 4: Real-World Clinical Workload Scenarios (6 Tests)

- `T4.APP.1`: **Urban Corporate Executive Anemia & Metabolic Fatigue Journey**:
  - Tech lead (38, sedentary, high stress, fatigue) $\rightarrow$ Vitality Score $54$ $\rightarrow$ Primary: `weakness` (₹2,730) vs Camp: `smartadvance` (₹499) $\rightarrow$ 1-click cart addition verified.
- `T4.APP.2`: **Senior Citizen Hypertensive & Osteoarthritis Patient Journey**:
  - Retired teacher (68, BP concerns, joint stiffness, family hypertension) $\rightarrow$ Vitality Score $29$ $\rightarrow$ Primary: `hypertension` (₹4,710) vs Camp: `smartadvance` (₹499, Save ₹4,211) $\rightarrow$ Home collection drawer sync verified.
- `T4.APP.3`: **Early-Onset Glycemic Warning / Diabetic Workup Journey**:
  - Accountant (32, polyuria, maternal diabetes) $\rightarrow$ Vitality Score $48$ $\rightarrow$ Primary: `thyrodiabetes` (₹960) vs Camp: `smartadvance` (₹499) $\rightarrow$ HbA1c explanation verified.
- `T4.APP.4`: **Post-Menopausal Female Musculoskeletal & Vitamin D3 Journey**:
  - Homemaker (54, knee stiffness) $\rightarrow$ Vitality Score $68$ $\rightarrow$ Primary: `joint` (₹875) vs Camp: `smartadvance` (₹499) $\rightarrow$ Vitamin D3 explanation verified.
- `T4.APP.5`: **Asymptomatic Familial Renal Risk Screening Journey**:
  - Engineer (48, general checkup, family kidney history) $\rightarrow$ Vitality Score $72$ $\rightarrow$ Primary: `renal` (₹175) vs Camp: `basiccamp` (₹299) $\rightarrow$ KFT creatinine clearance verified.
- `T4.APP.6`: **Annual Preventive Camp Seeker & Multi-Package Cart Workflow**:
  - Fitness enthusiast (26, pristine baseline) $\rightarrow$ Vitality Score $98$ $\rightarrow$ Primary: `executive` (₹999) vs Camp: `basiccamp` (₹299) $\rightarrow$ Multi-package cart (`basiccamp` + `membership`, Total ₹318) and WhatsApp link verified.

---

## 5. Execution Commands & Exit Criteria

```bash
# Execute full opaque-box E2E test suite across all 4 tiers
node e2e_tests/run_tests.js
```

**Success Criteria**:
- 100% of the 116 test assertions pass with zero failures.
- Process exits with code 0.
- Output displays colored progress per tier and comprehensive summary banner.
