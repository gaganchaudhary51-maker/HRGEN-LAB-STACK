# Level 4A — Westgard IQC Build Handover

## Implemented
- Extracted the six-rule evaluator into dependency-free `server/services/westgard.js`.
- Rules: 1_2s warning, 1_3s rejection, 2_2s rejection, R_4s rejection, 4_1s rejection, 10x rejection.
- Strict-exceedance boundaries: a point exactly at the configured SD boundary does not trigger that rule.
- Invalid numeric points, empty/oversized series, non-finite target/SD and SD <= 0 fail closed.
- R_4s is evaluated only when the operator provides an explicit same-run pair of standardized z-scores. Both results must be strictly beyond opposite +2 SD/-2 SD limits; a zero score or an in-range score cannot trigger R_4s. It is not inferred from historical consecutive results, which may belong to different runs.
- Regression fix: prior condition incorrectly treated `0` versus a large positive z-score as opposite-side R_4s. Corrected the rule and added zero/high-positive, insufficient-opposite-limit, and reversed-order vectors.
- QC evaluation requires a registered active instrument and active catalogue test within the authenticated tenant.
- QC runs persist `tenantId`; the history endpoint filters by the authenticated tenant.
- Calibration instrument lookup is tenant-scoped.
- QC UI accepts an optional same-run z-score pair and displays recent IQC runs.
- Dependency-free tests are wired into `pretest`, `verify:westgard`, and `qa:all`.

## Verification performed
- `node --check server.js`: PASS
- `node --check server/services/westgard.js`: PASS
- `LEVEL4A_WESTGARD_VERIFY.js`: 23/23 PASS
- `LEVEL4A_WESTGARD_EDGE_CASES.js`: 10/10 PASS
- `LEVEL4A_QC_TENANT_VERIFY.js`: 7/7 static integration checks PASS
- Front-office behavior: 6 scenarios PASS
- Front-office/report verification: 13/13 PASS
- Final build verifier: PASS (77/77 build surface)
- QA/QC break-it: 86 checks PASS
- Phase A/B/C: 18/65/34 PASS
- Level 1/2/3 verifiers: 29/23/9 PASS
- Tenant leak tests: 4 PASS
- UX/adaptive checks: 20 PASS
- Cross verifier: 25 PASS
- Deterministic fuzz: 50,000 PASS
- Existing mutation suites: Level 2 5/5 killed; Phase C 8/8 killed

## Qualification limits
- These are code-level deterministic and static integration checks. Dependency-backed live HTTP tests and browser E2E were not run because npm registry DNS previously returned `EAI_AGAIN` in the build environment.
- QC rule configuration, control material handling, analyzer-specific QC design, and all acceptance limits require review/approval by the laboratory's authorized quality lead before clinical use. This build does not confer NABL/ISO accreditation or production qualification.
