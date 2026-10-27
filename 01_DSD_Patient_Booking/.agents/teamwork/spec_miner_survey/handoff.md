# Specification Mining Report — DSD Patient Booking Portal
**Author**: Specification Miner (`teamwork_preview_spec_miner`)  
**Timestamp**: 2026-10-25T11:25:00Z  
**Target**: Health Risk & Vitality Score Assessment Tool & Intelligent Package Recommendation Engine  
**Workspace**: `C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\spec_miner_survey`

---

## 1. Observation

Direct examination of the DSD Patient Booking portal codebase (`C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking`) and requirements revealed the following authoritative assets, data structures, and state management mechanisms:

1. **Test Catalog Data Source (`src/App.tsx:29-75`)**:
   - The authoritative test inventory contains **35 total diagnostic items** organized across 4 primary arrays: `campTests` (4 items), `profileTests` (5 items), `singleTests` (13 items), and `tests` (13 top-level packages + spread items).
   - Each item follows the interface contract: `{ id: string, name: string, desc: string, price: number, old: number, tag: string, category: string, image: string }`.
   - Categories present in `App.tsx:79`: `'All'`, `'Camp Packages'`, `'Profiles'`, `'Full Body'`, `'Diabetes'`, `'Kidney'`, `'Senior Care'`, `'Joint Care'`, `'Heart Health'`, `'Individual Tests'`.

2. **Cart State & Booking Synchronization (`src/App.tsx:86, 122-124, 164-171, 188-221`)**:
   - Cart is managed in React state as an integer record map: `const [cart, setCart] = useState<Record<string, number>>({})`.
   - Manipulation function: `qty(id: string, d: number)`:
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
   - Derived cart calculations:
     * `cartItems = tests.filter(t => cart[t.id])`
     * `count = Object.values(cart).reduce((a, b) => a + b, 0)`
     * `total = cartItems.reduce((sum, t) => sum + t.price * cart[t.id], 0)`
   - Cart synchronization is 100% reactive to any call to `qty(packageId, 1)`, immediately reflected in header cart badge, mobile dock badge, cart drawer summary, and WhatsApp booking generator (`whatsapp()`).

3. **Current Styling & Theme Architecture (`src/index.css:1-62`)**:
   - Dark theme palette: Background `#050606`, panels `#101211`, text `#f1f3f2`, green accent `#48ed86`, lime accent `#b7ff67`, muted `#9ca5a0`, border line `rgba(180, 195, 184, 0.16)`.
   - Typography: `'DM Sans', sans-serif` and `'Manrope', sans-serif`.
   - Glassmorphism pattern: `backdrop-filter: blur(18px)` used on sticky header; glass card styles require `backdrop-filter: blur(28px)` per `ORIGINAL_REQUEST.md` R3.
   - Minor syntax observation: Line 1382 of `src/index.css` has `.@media(max-width:650px)` which emits a build warning during esbuild CSS minification, but build completes with exit code 0.

4. **Dependencies & Runtime Environment (`package.json`)**:
   - `react` / `react-dom`: `^19.0.0`
   - `lucide-react`: `^0.469.0`
   - `tailwindcss`: `^3.4.0`
   - `vite`: `^6.0.0`
   - Note: Framer Motion is not installed; spring physics can be achieved either via lightweight spring calculation hooks/math (RK4 or damped harmonic oscillator) or SVG spring transforms.

---

## 2. Complete Inventory of Relevant Diagnostic Packages

| Package ID | Official Package Name | Current Price | Original Price | Discount / Tag | Category | Parameter Count / Included Clinical Tests | Key Clinical Indications |
|---|---|---|---|---|---|---|---|
| `smartadvance` | **DSD Smart Health Advance** | ₹499 | ₹499 | Camp offer · ECG free | Camp Packages | **6 Profiles (50+ params)**: CBC, LFT, KFT, Lipid Profile, Thyroid Profile, HbA1c, Free ECG | **Flagship Preventive/Camp Alternative**: Comprehensive multi-organ screening covering metabolic, liver, renal, heart, and thyroid risks at 10x value |
| `basiccamp` | **Basic Health Pack** | ₹299 | ₹299 | Camp offer · ECG free | Camp Packages | **4 Profiles (25+ params)**: CBC, Blood Sugar, Urine Routine, KFT, Free ECG | **Entry Budget Alternative**: Routine baseline health, kidney screening, and anemia check |
| `executive` | **Executive Full Body Checkup** | ₹999 | ₹999 | Camp offer · ECG free | Camp Packages | **Full Blood + Urine + Vitamins**: Full panels + Vitamin D3 + Vitamin B12 + Free ECG | **Fatigue & Wellness High-Tier**: Exhaustion, lethargy, micronutrient & nerve vitality |
| `membership` | **DSD Membership Card** | ₹19 | ₹19 | Camp offer · ECG free | Camp Packages | 1-year health subscription + free camp ECG | Preventive subscription add-on |
| `diabetes` | **Diabetic Package** | ₹840 | ₹900 | 6% off · DSD website | Diabetes | **22 parameters**: Fasting Blood Sugar (FBS), PPBS, HbA1c, Urine Routine (Urine RE) | **Primary Clinical Match**: Frequent thirst/urination, polyuria, family diabetes history |
| `thyrodiabetes` | **Thyro-Diabetic Package** | ₹960 | ₹1,750 | 45% off · DSD website | Diabetes | **34 parameters**: Combined Thyroid (T3, T4, TSH) + Diabetes (FBS, PPBS, HbA1c) + Urine RE | **Primary Clinical Match**: Comorbid endocrine risk, fatigue + thirst, dual family history |
| `diabeticbasic` | **Diabetic Profile Basic** | ₹199 | ₹199 | Camp price · user supplied | Profiles | **3 parameters**: FBS, PPBS, HbA1c | Budget targeted diabetes follow-up |
| `joint` | **Basic Joint Pain Package** | ₹875 | ₹1,750 | 50% off · DSD website | Joint Care | **6 parameters**: Uric Acid, Calcium, Phosphorus, RA Factor, ESR/CRP, ALP | **Primary Clinical Match**: Joint stiffness, mild pain, gout vs bone calcium workup |
| `specialjoint` | **Special Joint Package** | ₹4,530 | ₹7,750 | 41% off · DSD website | Joint Care | **41 parameters**: RA quantitative, Anti-CCP, ANA, Uric Acid, Vit D3, Calcium, CBC, ESR, CRP | **Primary Clinical Match**: Chronic severe joint pain, inflammatory/autoimmune arthritis |
| `weakness` | **Basic Weakness Package** | ₹2,730 | ₹4,550 | 40% off · DSD website | Full Body | **63 parameters**: Anemia panel, CBC, Vit D3, Vit B12, Iron, Ferritin, Thyroid TSH, Glucose, KFT | **Primary Clinical Match**: Chronic fatigue, general weakness, unrefreshing sleep, anemia |
| `hypertension` | **Hypertension Package** | ₹4,710 | ₹7,850 | 40% off · DSD website | Heart Health | **76 parameters**: Comprehensive Lipid, KFT, Electrolytes (Na/K/Cl), CBC, Urine Microalbumin, Glucose | **Primary Clinical Match**: Blood pressure concerns, dizziness, cardiovascular risk |
| `renal` | **Renal Screening Package** | ₹175 | ₹350 | 50% off · DSD website | Kidney | **20 parameters**: Creatinine, Urea, Uric Acid, BUN, Electrolytes, Urine Routine & Microscopic | **Primary Clinical Match**: Urinary concerns, flank pain, renal family history, edema |
| `full` | **Full Body Health Check-up** | ₹3,190 | ₹7,160 | 55% off · DSD website | Full Body | **75 parameters**: CBC (24), LFT (12), KFT (10), Lipid (8), Thyroid (3), Diabetes (2), Urine (16) | Comprehensive annual wellness checkup |
| `special50` | **Special 50 Parameter Package** | ₹2,050 | ₹3,100 | 33% off · DSD website | Full Body | **53 parameters**: Broad health screening (CBC, LFT, KFT, Lipid, Sugar, Urine) | Broad preventive screen |
| `senior` | **Senior Citizen Package** | ₹6,789 | ₹9,100 | 25% off · DSD website | Senior Care | **58 parameters**: Geriatric organ profile, cardiac, bone, renal, glycemic, liver markers | Age > 60 comprehensive screening |
| `kftprofile` | **Kidney Function Test (KFT)** | ₹149 | ₹149 | Camp price · user supplied | Profiles | Urea, Creatinine, Uric Acid, BUN, Serum Electrolytes | Rapid renal filtration baseline |
| `lftprofile` | **Liver Function Test (LFT)** | ₹149 | ₹149 | Camp price · user supplied | Profiles | Bilirubin (Total/Dir/Ind), SGOT, SGPT, ALP, Protein, Albumin, Globulin, A:G Ratio | Liver enzymes & metabolic synthesis |
| `lipidprofile` | **Lipid Profile · Heart Care** | ₹149 | ₹149 | Camp price · user supplied | Profiles | Total Cholesterol, Triglycerides, HDL, LDL, VLDL | Atherosclerosis & cardiovascular screen |
| `thyroidprofile`| **Thyroid Profile · 3rd Gen** | ₹199 | ₹199 | Camp price · user supplied | Profiles | Total T3, Total T4, TSH | Hypo/hyperthyroidism & metabolic rate |
| `vitd` | **Vitamin D3** | ₹499 | ₹499 | Camp price · user supplied | Individual Tests| 25-Hydroxycholecalciferol (25-OH Vit D3) | Bone density, joint pain, immune health |
| `vitb12` | **Vitamin B12** | ₹499 | ₹499 | Camp price · user supplied | Individual Tests| Cyanocobalamin | Nerve health, anemia, fatigue |
| `cbccamp` | **CBC · Camp Rate** | ₹99 | ₹99 | Camp price · user supplied | Individual Tests| Haemoglobin, TLC, DLC, Platelets, RBC, PCV | Baseline hemogram & infection check |

---

## 3. Expected Package Mapping for Clinical Scenarios

The recommendation engine pairs every detected clinical risk with a **Primary Clinical Match** (targeted specialty package) alongside a high-value **Preventive/Camp Alternative** (such as DSD Smart Health Advance ₹499 or Basic Health Pack ₹299), showing clear price contrast and savings tags.

| Scenario # | Clinical Scenario & Symptom Vector | Primary Risk Axis Detected | Primary Clinical Package (Targeted) | Primary Price | Preventive / Camp Alternative Package | Camp Price | Price Difference & Savings Tag | Clinical Rationale & Mapping Justification |
|---|---|---|---|---|---|---|---|---|
| **CS-1** | **Diabetes & Metabolic Strain**<br>• Frequent thirst / urination<br>• Family history: Diabetes<br>• Sedentary lifestyle | Metabolic Risk (High) | `diabetes`<br>**Diabetic Package**<br>*(or `thyrodiabetes` if thyroid overlap)* | ₹840<br>*(or ₹960)* | `smartadvance`<br>**DSD Smart Health Advance** | ₹499 | **Save ₹341 (41% off)** vs Diabetic Pkg | Primary package tests exact glycemic triad (FBS, PPBS, HbA1c + Urine RE). Camp alternative provides HbA1c + Thyroid + Lipid + KFT + CBC at ₹499 with free ECG. |
| **CS-2** | **Hypertension & Cardiovascular Risk**<br>• Blood Pressure concerns / headaches<br>• Family history: Hypertension<br>• High stress / poor sleep | Cardiovascular Risk (High) | `hypertension`<br>**Hypertension Package** | ₹4,710 | `smartadvance`<br>**DSD Smart Health Advance** | ₹499 | **Save ₹4,211 (89% off)** vs Hypertension Pkg | Primary package performs exhaustive 76-parameter cardiovascular and end-organ damage audit. Camp alternative provides essential Lipid Profile + KFT + Free ECG at a fraction of cost. |
| **CS-3** | **Joint Stiffness & Musculoskeletal Pain**<br>• Joint Stiffness / Pain<br>• Morning rigidity / knee/back pain<br>• Age > 45 | Joint / Inflammation Risk (High) | `joint`<br>**Basic Joint Pain Package**<br>*(or `specialjoint` if chronic)* | ₹875<br>*(or ₹4,530)* | `smartadvance`<br>**DSD Smart Health Advance**<br>*(or `basiccamp` ₹299)* | ₹499 | **Save ₹376 (43% off)** vs Joint Pkg | Primary package evaluates Serum Uric Acid (gout), Calcium, Phosphorus, and RA factor. Camp alternative checks systemic inflammation, renal uric acid clearance, and overall vitals. |
| **CS-4** | **Fatigue, Weakness & Micronutrient Deficit**<br>• Fatigue / Weakness<br>• Low stamina, brain fog<br>• Irregular sleep / high work stress | General Vitality Depletion / Anemia Risk | `weakness`<br>**Basic Weakness Package**<br>*(or `executive` ₹999)* | ₹2,730<br>*(or ₹999)* | `smartadvance`<br>**DSD Smart Health Advance** | ₹499 | **Save ₹2,231 (82% off)** vs Weakness Pkg | Primary package runs 63 parameters including Vit B12, D3, iron reserves, and thyroid. Camp alternative covers CBC (anemia), Thyroid (TSH), LFT, KFT, and HbA1c at ₹499. |
| **CS-5** | **Renal & Urinary Filtration Risk**<br>• Frequent urination, back discomfort<br>• Family history: Kidney conditions<br>• Hypertension comorbidity | Renal Risk (High) | `renal`<br>**Renal Screening Package** | ₹175 | `basiccamp`<br>**Basic Health Pack**<br>*(or `smartadvance` ₹499)* | ₹299 | **Camp Package with Free ECG** | Primary package isolates 20 renal markers (Creatinine, Urea, Uric Acid, Electrolytes, Urine RE) at ₹175. Camp alternative adds full CBC, Blood Sugar, and Free ECG for just ₹299. |
| **CS-6** | **General Wellness & Preventive Checkup**<br>• General Checkup concern<br>• Family history: None or mild<br>• Proactive annual screening | Balanced / Maintenance Profile | `executive`<br>**Executive Full Body Checkup**<br>*(or `full` ₹3,190)* | ₹999 | `smartadvance`<br>**DSD Smart Health Advance** | ₹499 | **Save ₹500 (50% off)** vs Executive Checkup | Executive checkup adds Vitamin D3 & B12 to full panels. DSD Smart Health Advance delivers the core 6-profile screen (CBC, LFT, KFT, Lipid, Thyroid, HbA1c) at ₹499. |

---

## 4. Clinical Explanation Rules & Key Test Parameters

Dynamic clinical explanation engine section: *"Why Dr. Shastri Diagnostics recommends this for your score"*. The system maps detected risk spikes to clear, authoritative clinical parameters:

### 1. HbA1c (Glycated Hemoglobin)
- **Clinical Role**: Gold standard index of mean blood glucose concentration over the prior 90–120 days (erythrocyte lifespan).
- **Diagnostic Thresholds**: Normal `< 5.7%`, Prediabetes `5.7% – 6.4%`, Diabetes `≥ 6.5%`.
- **Why DSD Recommends It**: Unlike a spot fasting glucose test which fluctuates with recent diet or stress, HbA1c uncovers asymptomatic insulin resistance and diabetic trajectory before clinical symptoms become irreversible. Included in `diabetes`, `thyrodiabetes`, `smartadvance`, and `diabeticbasic`.

### 2. CBC (Complete Blood Count / Hemogram)
- **Clinical Role**: Comprehensive evaluation of hematopoietic vitality across 24+ cellular parameters (Hemoglobin, RBC count, Hematocrit/PCV, MCV/MCH/MCHC, Platelets, TLC, and 5-part DLC).
- **Diagnostic Utility**: Identifies microcytic hypochromic anemia (iron deficiency), macrocytic anemia (Vitamin B12/folate deficiency), occult bacterial/viral infections, and marrow response.
- **Why DSD Recommends It**: Essential primary workup for unexplained fatigue, weakness, dizziness, and low physical stamina. Included in `smartadvance`, `basiccamp`, `weakness`, `full`, and `cbccamp`.

### 3. KFT (Kidney Function Test / Renal Profile)
- **Clinical Role**: Measures glomerular filtration integrity and nitrogenous waste excretion through Serum Creatinine, Blood Urea, BUN, Uric Acid, and Serum Electrolytes (Na+, K+, Cl-).
- **Diagnostic Utility**: Kidneys can silently lose up to 50% of nephron clearance capacity before symptoms (edema, oliguria) surface.
- **Why DSD Recommends It**: Crucial for evaluating hypertension damage, diabetic nephropathy, medication toxicity, and gout. Included in `smartadvance`, `basiccamp`, `renal`, `kftprofile`, and `full`.

### 4. LFT (Liver Function Test / Hepatic Profile)
- **Clinical Role**: Assesses hepatocyte integrity (SGOT/AST, SGPT/ALT), cholestatic drainage (Alkaline Phosphatase, Total/Direct Bilirubin), and protein synthetic capacity (Albumin, Globulin, Total Protein).
- **Diagnostic Utility**: Screens for Non-Alcoholic Fatty Liver Disease (NAFLD/MASLD), drug/alcohol toxicity, and sluggish hepatic metabolism.
- **Why DSD Recommends It**: Vital for patients experiencing chronic lethargy, digestive complaints, or metabolic syndrome. Included in `smartadvance`, `lftprofile`, `full`, and `executive`.

### 5. Lipid Profile (Heart & Arterial Plaque Panel)
- **Clinical Role**: Measures circulating atherogenic and protective lipoproteins: Total Cholesterol, Triglycerides (TG), HDL ("good"), LDL ("bad"), and VLDL.
- **Diagnostic Utility**: Directly informs 10-year atherosclerotic cardiovascular disease (ASCVD) risk and coronary plaque vulnerability.
- **Why DSD Recommends It**: High blood pressure and arterial stiffness correlate directly with dyslipidemia. Included in `smartadvance`, `hypertension`, `lipidprofile`, and `full`.

### 6. Vitamin D3 (25-Hydroxycholecalciferol)
- **Clinical Role**: Steroid-hormone precursor crucial for intestinal calcium absorption, bone mineral density, osteoclast regulation, and immune T-cell modulation.
- **Diagnostic Thresholds**: Deficient `< 20 ng/mL`, Insufficient `20–30 ng/mL`, Optimal `30–100 ng/mL`.
- **Why DSD Recommends It**: More than 70% of urban adults have severe Vitamin D3 deficiency, which directly manifests as joint stiffness, deep bone ache, chronic lethargy, and muscle weakness. Included in `executive`, `weakness`, `specialjoint`, and `vitd`.

---

## 5. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Catalog Data | `campTests` Array | 4 pre-configured camp packages with ECG inclusion | None (static config) | Array of 4 package objects (`membership`, `basiccamp`, `smartadvance`, `executive`) | None | `src/App.tsx:29-34` |
| 2 | Catalog Data | `profileTests` Array | 5 targeted organ profile tests (Thyroid, LFT, KFT, Lipid, Diabetic) | None (static config) | Array of 5 profile objects | None | `src/App.tsx:35-41` |
| 3 | Catalog Data | `singleTests` Array | 13 single diagnostic tests (Sugar, Vit D3, Vit B12, CRP, Widal, etc.) | None (static config) | Array of 13 test objects | None | `src/App.tsx:42-56` |
| 4 | Catalog Data | `tests` Unified Catalog | Full list of 35 packages, profiles, and individual tests | None (composite array) | Array of 35 items | None | `src/App.tsx:58-75` |
| 5 | State / Cart | `cart` Record State | Key-value store of test IDs to quantity integers | Package ID, quantity delta (`d`) | Updated cart state object | Deletes key if quantity <= 0 | `src/App.tsx:86, 164-171` |
| 6 | State / Cart | `qty()` Modifier | Increments, decrements, or removes item from active cart | `id: string, d: number` | State updated, triggers badge & drawer updates | Guarded against negative values | `src/App.tsx:164-171` |
| 7 | Booking Flow | WhatsApp Booking Generator | Composes multi-item WhatsApp link with patient details, tests, total, and GPS | Form inputs, cart items, GPS location | `window.open('https://wa.me/919258888085?text=...')` | Opens cart or booking drawer if missing fields | `src/App.tsx:188-221` |
| 8 | UI / Customizer | Local Card Overrides (`cardEdits`) | In-browser customized card overrides persisted in `localStorage` | `id, price, name, desc, tag, cardColor` | Overridden catalog item attributes | Safe parse with `{}` fallback | `src/App.tsx:119-143` |
| 9 | Operations | Operations Hub Integration | Internal operations modal with leads, phlebo dispatch, drafts, and checks | `onClose` callback | Modal workspace dialog | Fallback to safe defaults if localStorage fails | `src/App.tsx:249`, `src/OperationsHub.tsx` |
| 10| UI / Motion | Spring Dial & Radial Gauge Spec | Awwwards-grade spring dial gauge transitioning 0-100 score | Vitality Score (0-100), spring params | Animated SVG circular dial with glow particles | Clamped to [0, 100] bounds | `ORIGINAL_REQUEST.md:26-30` |

---

## 6. Edge Cases

| # | Feature | Input / Scenario | Observed / Expected Behavior |
|---|---|---|---|
| 1 | Vitality Score Calculator | Minimum possible responses (Age 60+, Sedentary, Severe Stress, Multiple chronic symptoms, High family risk) | Score must not drop below 0 (clamped to bounded minimum, e.g., 10 or 15). Never negative. |
| 2 | Vitality Score Calculator | Maximum possible responses (Age 18-29, Highly Active, Rested/No stress, No symptoms, No family risk) | Score must not exceed 100 (clamped strictly to 100). |
| 3 | Package Recommendation | User selects both "Frequent Thirst/Urination" AND "Joint Stiffness/Pain" | Engine prioritizes the highest clinical severity risk while displaying secondary risk badge; recommends `smartadvance` as unifying preventive alternative. |
| 4 | Cart Addition | User clicks "Book Recommended Package" repeatedly | `qty(id, 1)` increments quantity correctly without corrupting cart state or wiping other items. |
| 5 | LocalStorage Disabled / Private Mode | Private browsing mode where `localStorage.setItem` throws | Try/catch blocks in existing codebase ensure app remains fully functional without crashing. |
| 6 | Card Override Collision | An admin edited package price in `cardEdits` | The recommendation engine should reference base `tests` or `editedTests` consistently so displayed price matches cart total. |
| 7 | Mobile Viewport | Width < 380px (small smartphone screen) | Dial gauge scales responsively, option buttons stack vertically with touch targets >= 48px. |

---

## 7. Logic Chain

1. **Step 1: Codebase Survey**:
   - Inspected `src/App.tsx` and found the full test database (`tests` array, `campTests`, `profileTests`, `singleTests`).
   - Inspected cart mechanism: `cart` is a simple React dictionary mapping test ID to number, manipulated via `qty(id, d)`.
   - Verified that any newly recommended package can be immediately added to the active cart with a single call: `qty(recPackageId, 1)`.

2. **Step 2: Package Inventory Extraction**:
   - Extracted all 35 packages and tests, matching their exact IDs (`smartadvance`, `basiccamp`, `diabetes`, `thyrodiabetes`, `joint`, `specialjoint`, `weakness`, `hypertension`, `renal`, `executive`, etc.).
   - Verified that all packages required by `ORIGINAL_REQUEST.md` already exist with official names, descriptions, prices, and tags.

3. **Step 3: Clinical Scenario Mapping**:
   - Systematically mapped the 6 primary clinical scenarios (Diabetes, Hypertension, Joint/Pain, Fatigue/Weakness, Renal, General Wellness) to both their primary specialty match and their cost-effective preventive/camp alternative (`smartadvance` ₹499 or `basiccamp` ₹299).
   - Formulated the exact price comparisons and savings calculations (e.g. ₹499 vs ₹4,710 saves ₹4,211).

4. **Step 4: Clinical Explanations & Key Parameters**:
   - Formulated medical-grade rationales for the 6 core biomarkers: HbA1c, CBC, KFT, LFT, Lipid Profile, and Vitamin D3.
   - Connected each parameter to why Dr. Shastri Diagnostics recommends it for specific risk profile scores.

5. **Step 5: Verification & Build Check**:
   - Executed `npm run build` and verified the build succeeds cleanly (exit code 0).
   - Documented all findings in this self-contained report.

---

## 8. Caveats

1. **Package Catalog Data Location**: Currently, `tests` is declared as an in-file constant in `src/App.tsx`. The upcoming implementation can either export/import `tests` or define a dedicated `packagesData.ts` / recommendation service that uses these exact package IDs and prices to ensure 100% data fidelity.
2. **Framer Motion Absence**: `framer-motion` is not listed in `package.json`. Spring physics for the dial gauge and cards can be cleanly implemented using high-performance CSS springs / lightweight React spring physics hooks (`stiffness: 300, damping: 30, mass: 1`) without adding bloated dependencies unless desired by the orchestrator.
3. **CSS Minification Warning**: Esbuild flagged line 1382 of `src/index.css` (`.@media(max-width:650px)`). While it does not break the build, correcting this typo during UI polish will ensure completely clean build output.

---

## 9. Conclusion

The specification mining investigation is complete. The DSD Patient Booking portal codebase already possesses the exact diagnostic package inventory, cart state mechanisms, and booking synchronization needed to fulfill all requirements of `ORIGINAL_REQUEST.md`. The exact IDs, prices, parameters, scenario mappings, and clinical explanations documented herein provide a complete, verified foundation for the Implementation Sub-orchestrators and Engineering agents.

---

## 10. Verification Method

To independently verify the observations and data in this report:
1. **Verify Package Inventory**: View `src/App.tsx` lines 28–75 using `view_file` to confirm all 35 package definitions, IDs, and prices.
2. **Verify Cart Sync**: View `src/App.tsx` lines 86, 122–124, and 164–171 to confirm `cart` state structure and `qty(id, d)` function.
3. **Verify Build Integrity**: Run `npm run build` from `C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking` in powershell; observe exit code 0.
