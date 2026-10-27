# Original User Request

## 2026-10-25T11:07:51Z

Interactive Health Risk & Vitality Score assessment tool with Awwwards-grade spring physics and glassmorphism, intelligently calculating patient risk profiles via a 60-second 3-step smart quiz and recommending tailored primary and preventive diagnostic packages with 1-click cart addition in the DSD Care - Patient Portal.

Working directory: C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking
Integrity mode: development

## Requirements

### R1. 60-Second Smart Health & Risk Scoring Assessment
- 3-step interactive clinical quiz:
  - Step 1: Demographics & Lifestyle (Age group, Gender, Activity level, Sleep/Stress)
  - Step 2: Primary Symptoms & Concerns (Fatigue/Weakness, Frequent Thirst/Urination, Joint Stiffness/Pain, Blood Pressure concerns, General Checkup)
  - Step 3: Family Medical History (Diabetes, Hypertension, Kidney conditions, Thyroid, None)
- Multi-axial clinical calculation computing an Overall Vitality Score (0–100) and specific risk indicators (Metabolic, Cardiovascular, Renal, Joint/Inflammation).

### R2. Intelligent Hybrid Test Package Recommendation Engine
- Recommend both:
  1. Primary Clinical Match: The exact targeted package addressing the detected risk (e.g., Diabetic Package, Special Joint Package, Basic Weakness Package, Renal Screening).
  2. Preventive/Camp Alternative: A cost-effective comprehensive screening (e.g., DSD Smart Health Advance ₹499 or Basic Health Pack ₹299) with side-by-side price and test parameter comparison.
- Dynamic clinical explanation section ("Why Dr. Shastri Diagnostics recommends this for your score") highlighting key test parameters (HbA1c, CBC, KFT, LFT, Lipid, Vitamin D3).
- Instant 1-click "Add to Cart" and home collection booking flow synchronization.

### R3. Awwwards-Grade Motion & Visual Polish (/awwwards-motion)
- Spring physics on all interactive elements: stiffness: 300, damping: 30, mass: 1 with 1.05x subtle overshoot.
- Multi-layered dark glassmorphic cards (backdrop-filter: blur(28px), ambient shadows, subtle glow accents, gradient border highlights).
- Animated SVG radial circular score gauge smoothly transitioning from 0 to target score with glowing particle highlights.
- Seamless mobile responsiveness and accessibility.

## Acceptance Criteria

### Clinical Scoring & Match Quality
- [ ] Vitality score calculations produce valid, bounded scores (0-100) across all input combinations.
- [ ] Selecting diabetes symptoms or family history accurately recommends Diabetic Package or Thyro-Diabetic Package.
- [ ] Selecting joint pain recommends Basic Joint Pain Package or Special Joint Package.
- [ ] Selecting general fatigue/wellness recommends Executive Full Body Checkup or Basic Weakness Package.
- [ ] The preventive alternative package is displayed with clear price contrast and savings tags.

### UX, Motion & Integration
- [ ] Score dial and option cards use spring physics with natural settle.
- [ ] Clicking "Book Recommended Package" or "Book Camp Alternative" directly adds the package to the active DSD Care cart and notifies the user.
- [ ] Zero TypeScript or console errors; npm run build succeeds cleanly.


## 2026-10-27T01:15:49Z

Build a 2026 cutting-edge Clinical AI Diagnostic Report Engine & Spatial Health UI for Dr. Shastri Diagnostics (DSD Care) Aligarh, converting raw laboratory analyzer data into interactive, patient-friendly bilingual (Hindi + English) visual reports with AI-calculated Organ Vitality Scores, longitudinal biomarker trends, personalized nutrition matrix, and real-time 3D organ resonance.

Working directory: C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking
Integrity mode: development

## Requirements

### R1. 2026 Generative AI Smart Clinical Report Engine
- Transform raw numeric laboratory test results into clear, plain-language patient summaries.
- Support instant bilingual switching between **हिन्दी आसान भाषा सारांश** (vernacular Hindi) and **English Clinical Summary**.
- Highlight critical clinical takeaways, abnormal flags, and immediate medical next steps without medical jargon.

### R2. Organ Vitality & Biological Health Score Algorithm (0–100)
- Calculate a weighted holistic vitality score across 5 key physiological organ systems:
  - Metabolic / Diabetes (HbA1c, Fasting Glucose)
  - Cardiovascular & Lipids (Cholesterol, HDL, LDL, Triglycerides)
  - Hepatic Function (SGOT, SGPT, Bilirubin, Albumin)
  - Renal & Electrolytes (Creatinine, BUN, Uric Acid, eGFR)
  - Hemogram & Immunity (Hemoglobin, TLC, Platelets)
- Render an animated circular SVG speedometer gauge and individual organ score cards with status badges (Optimal, Borderline, High Risk).

### R3. Biomarker Trajectory & Longitudinal Trend Visualizations
- Plot patient values along color-coded continuous reference ranges (Green = Optimal, Amber = Borderline, Rose = High Risk).
- Display longitudinal trend curves / sparklines comparing current test readings against previous 3-month and 6-month historical tests.

### R4. Personalized Clinical Nutrition & Action Matrix
- Automatically generate dietary and lifestyle recommendations customized to the patient's detected abnormal flags (e.g. anti-inflammatory foods for liver enzymes, low-purine foods for uric acid, high-soluble fiber for lipid management).
- Provide clear "Foods to Include" vs. "Foods to Restrict" guidance.

### R5. Spatial Health UI, 3D Anatomy Resonance & Audio Readout
- Implement modern 2026 spatial glassmorphic UI (Apple VisionOS / Linear Health aesthetic: dark luxury slate, subtle cyan/emerald neon accents, frosted blur).
- Enable bidirectional sync with `Interactive3DAnatomyAtlas.tsx` so clicking any flagged test marker focuses and pulses the corresponding 3D organ in real time.
- Include an interactive audio waveform player with voice readout ("सुनिए अपनी रिपोर्ट का आसान सारांश").
- Provide 1-click encrypted WhatsApp report sharing and verified NABL PDF export.

## Acceptance Criteria

### Clinical AI & Report Interactivity
- [ ] Clicking "View 2026 AI Smart Report" in the patient portal opens the full spatial report modal without page reload.
- [ ] Vitality Score gauge animates smoothly to the calculated score (0–100).
- [ ] Bilingual toggle seamlessly swaps between Hindi and English clinical summaries.
- [ ] Every biomarker displays its numerical value, unit, reference range slider, and color-coded clinical status.
- [ ] Nutrition matrix displays tailored recommendations matching the patient's test flags.
- [ ] Audio player toggles play/pause with animated soundwave visualizer.

### 3D Organ Sync & Design Quality
- [ ] Clicking a biomarker card highlights the corresponding organ in the 3D atlas.
- [ ] Layout adheres strictly to the 8px grid spacing rhythm with WCAG AA compliant contrast.

### Code Quality & Build Verification
- [ ] `npm run build` succeeds with 0 TypeScript/build errors.
- [ ] Headless browser audit on `http://127.0.0.1:5174/` confirms 0 console errors.
