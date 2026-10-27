# Dispatch: Milestone 3 Empirical Challenger 1 (Run 2)

## Role & Mission
Empirically stress-test the quiz state machine, input validation, and cart integration in `VitalityAssessment.tsx` and `App.tsx`.

## Verification Requirements
1. Author and execute an empirical test script verifying:
   - Step 1: Blocks progression if any required field is missing.
   - Step 2: Selecting 'general_checkup' clears all other symptoms; selecting any symptom clears 'general_checkup'.
   - Step 3: Selecting 'none' clears all diseases; selecting any disease clears 'none'.
   - Back navigation preserves previously selected values without loss.
   - Reset/Retake clears state and returns to Step 1 cleanly.
   - 1-click cart addition invokes `onAddToCart` with exact package IDs (`primaryPackage.id`, `campAlternativePackage.id`).
2. Run `npm run build` and `node e2e_tests/run_tests.js`.
3. Provide empirical results and definitive verdict: **APPROVE** or **REQUEST_CHANGES** in `handoff.md`.
