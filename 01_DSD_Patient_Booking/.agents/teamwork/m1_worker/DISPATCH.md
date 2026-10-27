## 2026-10-25T11:36:19Z
You are the Worker (teamwork_preview_worker) for Milestone 1: Clinical Scoring & Hybrid Recommendation Engine.
Your working directory is: C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m1_worker

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. Read the Authoritative Original Request at:
   C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the Master Project Blueprint at:
   C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\PROJECT.md
3. Read the Explorer Reports:
   - C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m1_explorer_scoring\handoff.md
   - C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m1_explorer_axes\handoff.md
   - C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m1_spec_miner_rec\handoff.md
4. File Ownership:
   You EXCLUSIVELY own and implement:
   `src/components/VitalityAssessment/scoringEngine.ts`
   (Create directory `src/components/VitalityAssessment/` if it does not exist).
   DO NOT modify any other files in this milestone.
5. Implementation Requirements:
   Implement a 100% genuine, robust, strictly typed TypeScript clinical calculation engine exporting:
   - Interfaces: `AssessmentInput`, `RiskLevel`, `RiskAxis`, `RecommendedPackage`, `ClinicalExplanation`, `AssessmentResult`.
   - Constants: `DIAGNOSTIC_PACKAGES` (all 10 catalog packages with exact IDs, prices, tags, parameters matching App.tsx), `CLINICAL_EXPLANATIONS` (HbA1c, CBC, KFT, LFT, Lipid Profile, Vitamin D3).
   - Functions:
     * `calculateVitalityScore(input: AssessmentInput): { vitalityScore: number, vitalityBracket: 'Optimal' | 'Moderate' | 'Elevated Risk' }` (Strictly integer bounded within [15, 98]).
     * `calculateRiskAxes(input: AssessmentInput)` or individual axis functions returning percentage [0, 100], level ('Low' | 'Moderate' | 'High'), and summary.
     * `determinePackageRecommendation(input: AssessmentInput)` returning targeted primary package, camp alternative (`smartadvance` ₹499 or `basiccamp` ₹299), and exact savings.
     * `getClinicalExplanations(input: AssessmentInput): ClinicalExplanation[]` returning dynamic explanations with hoisted matching markers.
     * `calculateVitalityAssessment(input: AssessmentInput): AssessmentResult` combining all calculations into the unified result.
6. Verification Requirements:
   - Write and execute a test script (or run node) to verify all boundary cases (best score = 98, worst score = 15, empty input, invalid/null protection, all scenario mappings).
   - Run `npm run build` from `C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking` to ensure zero compilation or TypeScript errors.
   - Document verification commands and output in your handoff report.
7. Write your handoff report to:
   C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking\.agents\teamwork\m1_worker\handoff.md
8. When finished, send a message to orchestrator (conversation ID: 63a9feaa-29f3-414f-bf16-7954bebdd2e5).
