# L99N30 Front-office / result / report fix handover

## Changed
- Fixed a runtime-breaking regression in new accession creation: `hasResult` was referenced before declaration inside the order-creation map. New orders now normalize through a dedicated dependency-free helper and always start `Pending`; client-supplied result values/statuses are ignored at booking time.
- Result entry uses the same helper with fail-closed status rules: a blank or `Pending` value cannot be marked `Normal`, `High`, `Low`, or `Critical`; unknown statuses remain `Pending`.
- Added six executable behavior scenarios and wired them into the npm `pretest` lifecycle and `qa:all` command.
- Billing page now uses a tenant-loaded patient selector/search and clickable server-catalogue test selection instead of manually typing a patient ID and test codes.
- New-order billing accepts a paid-now amount, validates it against the server-calculated net total, and stores `PAID` / `PARTIAL` / `DUE` state with exact balance due.
- Order test lines preserve catalogue prices for receipts; old order receipts resolve missing line prices from the server catalogue.
- Result entry is a structured per-test table with result value, catalogue unit, catalogue reference interval, status flag, and method. Blank results remain `Pending`; the UI no longer silently marks them normal. Validated/released reports remain immutable.
- Lab profile in Settings persists lab name, logo URL, address, phone, email, optional registration/NABL number, pathologist name, qualification, registration number, signature display name and branding colours.
- Invoice/receipt print includes itemized tests, gross, discount, net, paid and due.
- Report print includes letterhead, patient/accession identifiers, result/unit/reference/flag columns and authorization state. Drafts are explicitly watermarked as not for clinical use.
- At release, the configured lab letterhead and authorized pathologist profile are copied into the integrity-hashed report snapshot; later lab-profile edits do not silently rewrite the saved released report letterhead.
- Added `validation/FRONT_OFFICE_RESULT_REPORT_VERIFY.js` and updated the cross-verifier for the structured result editor.

## Verification
- `node --check server.js`: PASS
- `node --check server/platformRoutes.js`: PASS
- inline browser JavaScript syntax: PASS
- `FRONT_OFFICE_RESULT_REPORT_VERIFY.js`: 13/13 PASS (including accession test-set integrity and blank-result status)
- `FINAL_BUILD_VERIFY.js`: PASS
- `QA_QC_BREAK_IT.js`: 86 checks PASS
- Phase A: 18 checks PASS
- Phase B: 65 checks PASS
- Phase C: 34 checks PASS
- Level 1 admin customization: 29 checks PASS
- Level 2 role rights: 23 checks PASS
- Level 3 enterprise integration: 9 checks PASS
- Tenant-leak checks: 4 checks PASS
- UX/adaptive checks: 20 checks PASS
- Cross verification: 25 checks PASS
- Deterministic fuzz: 50,000 checks PASS
- Level 2 mutation testing: 5/5 killed
- Phase C mutation testing: 8/8 killed
- Deep forensic mutation: 4/4 prechecks PASS (not reported as mutation-killed)

## Qualification boundary
`npm install --no-audit --no-fund` fails before dependency resolution because DNS lookup for `registry.npmjs.org` returns `EAI_AGAIN` in this execution environment. This is an environment/network blocker, not a package version error. Dependency-backed live server tests, browser E2E, PostgreSQL integration, printer output, and actual pathologist sign-off/release were not run here. Those remain required before production use. Do not use real patient data for acceptance testing until the target lab environment is qualified.
