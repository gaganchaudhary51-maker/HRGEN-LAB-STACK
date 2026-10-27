# TEST_INFRA — HRGen GIA LIMS Test Infrastructure & Dual Track Specification

## 1. Architecture Overview & Dual Track Philosophy

HRGen GIA LIMS is a server-authoritative Laboratory Information Management System built for high-reliability clinical pathology workflows (compliant with ISO 15189:2022 principles and applicable NABL criteria). Because patient safety depends upon strict state machine transitions, fail-closed clinical gates, and multi-tenant isolation, testing follows a rigorous **Dual Track Architecture**:

- **Track 1: White-Box / Gray-Box Unit, Verification & Security Static Checks**
  - **Vitest Unit Suite (`npm test`)**: Verifies phase 0 architectural invariants, credential requirements, bcrypt hashing, and database adapter contracts.
  - **Static & Forensic Validation Suite (`npm run qa:all`, `npm run forensic`, `npm run build77`, `npm run verify:final`)**: 10 verifier scripts analyzing ASTs, regex invariants, Westgard mathematical boundary conditions, tenant isolation policies, and clinical gate code paths.
  - **PostgreSQL RLS Integration Test (`npm run test:rls`)**: Validates database role least-privilege (`hrgen_app`), advisory single-writer locks, and row-level security policies (`NULLIF(current_setting('app.tenant_id', true), '')`).

- **Track 2: Opaque-Box End-to-End System Tests (`npm run test:e2e` via Playwright)**
  - Exercises the running HTTP API and browser UI strictly from the outside as opaque consumers.
  - Does not rely on internal memory access; all interactions occur through authenticated REST endpoints, form payloads, browser navigation, and public verification endpoints.
  - Validates real request lifecycles from user login, order accessioning, pre-analytical acceptance, analyzer import, IQC approval, technical validation, pathologist sign-off, to report release and QR code public verification.

---

## 2. Test Runner Infrastructure & Environment

- **Test Framework**: `@playwright/test` (v1.55.0) for browser and HTTP opaque-box testing; `vitest` (v3.2.4) for unit testing.
- **Browser Runtime**: Headless Chromium (`npx playwright install chromium`).
- **Configuration Separation**:
  - `playwright.config.js`: Targets `tests/**/*.spec.js`, timeout 30,000ms, default `baseURL: http://127.0.0.1:3001`.
  - `vitest.config.js`: Includes `tests/**/*.test.js`, excludes `tests/**/*.spec.js`.
- **Environment Variables**:
  - `PORT`: Server port (default `3001`).
  - `BASE_URL`: Base target URL for Playwright tests (default `http://127.0.0.1:3001`).
  - `NODE_ENV`: Runtime mode (`development` or `production`).
  - `AUTH_SECRET`: HMAC key for session token derivation, report hashing, and audit ledger integrity.
  - `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD`: Default administrative credentials for bootstrap.

---

## 3. Requirements Traceability Matrix (R1 – R5)

| Requirement | Description | Test Layer | Target Suites |
|-------------|-------------|------------|---------------|
| **R1** | Non-Destructive Environment & Baseline Verification | Track 1 & 2 | `FINAL_BUILD_VERIFY.js`, `BUILD_77_VERIFY.js`, `tests/phase0.test.js`, `tests/e2e.spec.js` |
| **R2** | P0/P1 Clinical Safety & Workflow Gate Enforcement | Track 1 & 2 | `CLINICAL_GATE_FIX_VERIFY.js`, `LEVEL4A_WESTGARD_VERIFY.js`, `tests/e2e.spec.js` |
| **R3** | PostgreSQL Tenant Isolation & Persistence | Track 1 & 2 | `TENANT_RLS_STATIC_VERIFY.js`, `POSTGRES_RLS_INTEGRATION_TEST.js`, `tests/e2e.spec.js` |
| **R4** | Automated Testing & Browser E2E Execution | Track 1 & 2 | `npm run qa:all`, `npm test`, `npm run test:e2e` |
| **R5** | Runtime Evidence & Verification Publication | Track 1 & 2 | `validation/runtime-evidence/`, `TEST_READY.md` |

---

## 4. Opaque-Box E2E Test Suite Matrix (4 Tiers)

### Tier 1: Feature Coverage (>=5 Tests per Core Feature)

#### Feature 1: User Authentication & Role Boundaries (RBAC)
1. **T1.1.1**: Authenticate as `admin` with valid credentials → returns 200, JWT/bearer session token, and `admin` role.
2. **T1.1.2**: Authenticate as `tech` operator → returns 200, role `tech`, verified permissions.
3. **T1.1.3**: Authenticate as `pathologist` → returns 200, role `pathologist`.
4. **T1.1.4**: Reject invalid password → returns 401 `Invalid credentials`.
5. **T1.1.5**: Reject disabled user account → returns 401/403.
6. **T1.1.6**: Deny unauthenticated requests to protected endpoints → returns 401 `Authentication required`.

#### Feature 2: Patient Registration & Order Accessioning
1. **T1.2.1**: Register new patient with valid demographics → returns 201, UHID generated, token assigned.
2. **T1.2.2**: Create order with valid catalog test codes (e.g. `CBC`, `FBS`, `CREAT`) → returns 201, initial state `DRAFT`, `specimenStatus: 'PENDING_COLLECTION'`.
3. **T1.2.3**: Reject order containing unknown test code → returns 400 with missing code details.
4. **T1.2.4**: Reject order with empty test list (0 tests) → returns 400.
5. **T1.2.5**: Calculate gross, discount, and net payable accurately → bounds `paidAmount` between 0 and `netPayable`.

#### Feature 3: Specimen Acceptance & Pre-Analytical Quality Gates
1. **T1.3.1**: Inspect specimen queue → verifies order initializes with `specimenStatus: 'PENDING_COLLECTION'`.
2. **T1.3.2**: Accept specimen with matching tube code → transitions `specimenStatus` to `ACCEPTED`, records operator & timestamp.
3. **T1.3.3**: Reject specimen with valid reason (`HEMOLYSIS`, `ICTERIC`, `LIPEMIA`, `CLOTTED`, etc.) → transitions `specimenStatus` to `REJECTED`, sets `recollectionRequired: true`.
4. **T1.3.4**: Reject specimen acceptance if tube code does not match catalog requirement → returns 400.
5. **T1.3.5**: Prevent specimen status mutation after validation/release → returns 409 fail-closed.

#### Feature 4: Result Entry & Analyzer Result Import
1. **T1.4.1**: Block result entry when specimen is not accepted (`PENDING_COLLECTION` or `REJECTED`) → returns 409 pre-analytical gate error.
2. **T1.4.2**: Enter manual results on `ACCEPTED` specimen → transitions order to `RESULTS_ENTERED`, clears prior validation/QC.
3. **T1.4.3**: Import analyzer results with exact accession code set matching → persists values in `UNREVIEWED` status with instrument metadata.
4. **T1.4.4**: Reject analyzer import with omitted accession test code → returns 409 with expected vs received codes.
5. **T1.4.5**: Reject analyzer import with extra or duplicate test code → returns 409 fail-closed.

#### Feature 5: Quality Control (QC) Provenance & Westgard Approval Gate
1. **T1.5.1**: Evaluate IQC run with in-control points → returns `evaluation.status === 'PASS'`.
2. **T1.5.2**: Evaluate IQC run violating 1_3s rule (point > 3 SD) → returns `evaluation.status === 'REJECT'` with `1_3s`.
3. **T1.5.3**: Approve QC on `RESULTS_ENTERED` order with matching instrument, active lot, passing calibration, and PASS IQC run → transitions `pipelineStatus` to `QC_APPROVED`.
4. **T1.5.4**: Reject QC approval when IQC run status is `REJECT` → returns 409.
5. **T1.5.5**: Reject QC approval when reagent lot is expired or belongs to different instrument → returns 409.
6. **T1.5.6**: Reject QC approval when test code on QC run is missing from order accession → returns 409.

#### Feature 6: Critical / Panic Values & Clinical Communication
1. **T1.6.1**: Auto-flag panic value for Potassium (`K`) > 6.5 mmol/L as `isPanic: true`.
2. **T1.6.2**: Block technical validation when critical value is unacknowledged → returns 409 with missing acknowledgment list.
3. **T1.6.3**: Record critical result communication with recipient, method, read-back, and timestamp → marks `criticalValueAcknowledged: true`.
4. **T1.6.4**: Re-authentication / audit ledger records actor and witness details for critical communication.
5. **T1.6.5**: Validate non-panic values proceed through validation without requiring critical communication.

#### Feature 7: Pathologist Electronic Sign-Off & Dual Re-Authentication
1. **T1.7.1**: Require order in `VALIDATED` state before sign-off can be initiated → reject on `DRAFT` or `RESULTS_ENTERED` with 409.
2. **T1.7.2**: Restrict sign-off endpoint to `pathologist` role → reject `tech` or `phlebotomist` with 403.
3. **T1.7.3**: Enforce live credential re-authentication (`bcrypt.compare` against pathologist password) → reject incorrect password with 401.
4. **T1.7.4**: Successful pathologist sign-off records electronic signature block (`signatureId`, timestamp, MCI registration number).
5. **T1.7.5**: Pathologist sign-off updates report hash and creates tamper-evident audit ledger record.

#### Feature 8: Report Release Gate, Immutable Snapshot & Public Verification
1. **T1.8.1**: Block release if specimen is not `ACCEPTED` → returns 409 pre-analytical gate error.
2. **T1.8.2**: Block release if pathologist sign-off is missing → returns 409.
3. **T1.8.3**: Successful release transitions `pipelineStatus` to `RELEASED`, locks immutable snapshot schema v2, generates verification token.
4. **T1.8.4**: Query public verification endpoint `/api/public/verify/:token` → returns 200 `valid: true`, masked patient name, lab letterhead, test table.
5. **T1.8.5**: Verify HTML report verification route `/verify/:token` renders authenticated letterhead, verification badge, and HMAC-SHA256 hash.
6. **T1.8.6**: Invalidate report verification on invalid or fabricated token → returns 404 `valid: false`.

---

### Tier 2: Boundary & Corner Cases

- **T2.1: Zero and Negative Values**: Test catalog price bounds, payment amount bounds (reject negative or > net payable).
- **T2.2: Extreme Number of Tests**: Order with 1 test (minimum) vs 100 tests (maximum boundary) vs 101 tests (rejected with 400).
- **T2.3: Panic Limit Exact Thresholds**: Test potassium at exact boundary 6.5 mmol/L (not panic) vs 6.51 mmol/L (panic flagged).
- **T2.4: Reagent Expiration Boundary**: Reagent lot expiring at end of current UTC day vs expired 1 minute ago.
- **T2.5: Immutability of Released Reports**: Attempting to edit results, modify timestamps, or change specimen status on a `RELEASED` report returns HTTP 409.
- **T2.6: SQL / Special Character Injection in Demographics**: Patient names with apostrophes, hyphens, Unicode (Hindi देवनागरी), and quotes are safely handled with parameterized persistence.

---

### Tier 3: Cross-Feature Combinations & Negative Gate Workflows

- **T3.1: Specimen Rejected Workflow**:
  - Register patient → Accession order → Reject specimen for `HEMOLYSIS` → Attempt result entry → Verify HTTP 409 block.
- **T3.2: Analyzer Instrument Mismatch**:
  - Accession order → Accept specimen → Attempt analyzer import with inactive instrument → Verify HTTP 409 block.
- **T3.3: QC Failed Lockout**:
  - Accession order → Accept specimen → Enter results → Submit IQC run with 1_3s violation → Attempt QC approval with failing run → Verify HTTP 409 block.
- **T3.4: Cross-Instrument QC Provenance Rejection**:
  - Active instrument A and active instrument B; IQC run evaluated on instrument A; Reagent lot registered to instrument B; Attempt QC approval linking run A with lot B → Verify HTTP 409 block.
- **T3.5: Validation Bypass Defense**:
  - Attempt direct fast-track release (`/api/orders/:id/fast-track`) → Permanently disabled HTTP 409.
  - Attempt batch validation (`/api/orders/batch-validate-normal`) → Permanently disabled HTTP 409.
- **T3.6: Non-Pathologist Sign-off Attempt**:
  - Technician or phlebotomist session attempts `/api/orders/:id/signoff` → HTTP 403 Forbidden.

---

### Tier 4: Real-World Clinical End-to-End Scenarios

- **T4.1: Standard Complete Outpatient Diagnostic Life Cycle**:
  1. Administrative login & setup verification.
  2. OPD patient registration with demographic details.
  3. Accessioning CBC + Glucose panel.
  4. Phlebotomy sample collection and laboratory reception specimen acceptance (`tubeCode: 'ALL'`).
  5. Automated analyzer batch import (exact test matching, marked `UNREVIEWED`).
  6. Technician Westgard IQC execution and QC approval.
  7. Technical supervisor validation.
  8. Pathologist electronic sign-off with credential check.
  9. Report release with QR code verification token generation.
  10. Public external verification check confirming report integrity and data match.

- **T4.2: Critical Hemolyzed Specimen Rejection & Recollection Workflow**:
  1. Accession order.
  2. Specimen arrival: grossly hemolyzed. Rejection recorded with reason `HEMOLYSIS` and recollection flag.
  3. Pre-analytical gate verifies result entry is blocked.
  4. Recollection sample arrives: accepted by phlebotomist.
  5. Workflow unblocked: results entered and successfully processed.

- **T4.3: Panic Alert Escalation & Pathologist Review Workflow**:
  1. Accession order with Electrolytes (`K`, `NA`).
  2. Results entered with Serum Potassium `K = 7.1 mmol/L` (Panic High > 6.5).
  3. System flags `isPanic: true`.
  4. Validation blocked until critical communication documented with treating physician read-back.
  5. Communication logged; validation passes; pathologist signs and releases.

- **T4.4: Dual-Tenant Isolation & Zero Leakage Verification**:
  1. Tenant 1 accessions order `ORD-T1`.
  2. Tenant 2 operator attempts to fetch or mutate `ORD-T1` → Returns HTTP 404 (zero data leakage across tenants).
  3. Missing tenant context in application queries fails closed.

---

## 5. Execution Commands & Exit Criteria

```bash
# Execute unit & static forensic verification (Track 1)
npm run qa:all
npm test

# Execute Playwright E2E browser and API test suite (Track 2)
npm run test:e2e
```

**Success Criteria**:
- 100% of Track 1 static and unit verifiers pass with exit code 0.
- All Playwright E2E test suites in `tests/e2e.spec.js` pass with exit code 0.
- All clinical safety gates verify fail-closed behavior under negative inputs.
