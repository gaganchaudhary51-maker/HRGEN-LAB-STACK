# Project: HRGen GIA LIMS L99N100XN30 Hardening & Verification

## Architecture
HRGen GIA LIMS is a 22-module, multi-tenant Laboratory Information Management System built with Node.js/Express, a native PostgreSQL persistence layer with Row-Level Security (RLS), and a single-page application frontend (`public/index.html`).

- **Persistence Layer**: Native `pg` driver using parameterized queries. Schema operations use `hrgen_migrator` (table owner), while application operations use `hrgen_app` (least-privilege, `NOSUPERUSER`, `NO BYPASSRLS`, no schema `CREATE`, no table ownership, no `TRUNCATE`). All 19 tenant tables enforce `FORCE ROW LEVEL SECURITY` using `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')`.
- **Concurrency & State Protection**: Single-writer lease via PostgreSQL session advisory lock `pg_try_advisory_lock(hashtext('hrgen_gia_lims_single_writer_v1'))` to prevent multi-instance split-brain cache divergence.
- **Clinical State Machine**: Strict sequential workflow progression:
  `DRAFT` → `RESULTS_ENTERED` → `QC_APPROVED` → `VALIDATED` → `RELEASED`
- **Safety Gates**: Pre-analytical specimen acceptance gate (`specimenStatus === 'ACCEPTED'`), 1:1 analyzer accession code matching with `UNREVIEWED` tagging, Westgard IQC run validation with active reagent lot and calibration evidence, dual re-authentication for critical result communication and pathologist sign-off, and permanently disabled fast-track/batch validation bypasses.
- **Frontend / Localization**: Single-page application in `public/index.html` (121 KB) with bilingual English/Hindi localization (`setLang('en-IN')` / `setLang('hi-IN')`), voice dictation, and responsive layouts. Must be preserved without redesign.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Baseline Git Checkpoint | Git repository initialization, local author config, .gitignore update, baseline commit & tag `baseline-pre-hardening` | M1 | R1 |
| 2 | Cross-Platform Test Fix | Fix `FINAL_BUILD_VERIFY.js:9` using `path.join(require('os').tmpdir(), 'hrgen-public-inline.js')` | M1 | R1 |
| 3 | Clean Dependency Installation | Install clean dependencies using `npm install` and ensure Vitest/Playwright config separation | M1 | R1, R4 |
| 4 | UI & Localization Preservation | Non-destructive validation of 22-module UI, Hindi/English localization, and responsive layouts | M1 | R1 |
| 5 | Specimen Initialization Gate | Explicitly initialize `specimenStatus: 'PENDING_COLLECTION'` in order creation (`server.js`) | M2 | R2 |
| 6 | Pre-Analytical Analyzer Gate | Enforce `o.specimenStatus === 'ACCEPTED'` in `/api/instrument-results/import` and simulator | M2 | R2 |
| 7 | Mutation Gate & Auto-Derive Hardening | Enforce accepted specimen status and immutability check on `/api/orders/:id/auto-derive` and timestamp edits | M2 | R2 |
| 8 | Critical Result Re-Authentication | Enforce live password re-authentication (`bcrypt.compare`) and witness logging on `/api/orders/:id/critical-communication` | M2 | R2 |
| 9 | Pathologist Sign-Off Dual Auth | Enforce dual re-authentication verification on `/api/orders/:id/signoff` | M2 | R2 |
| 10 | Permanent Bypass Disable | Ensure fast-track (`/fast-track`) and batch validation (`/batch-validate-normal`) remain fail-closed HTTP 409 | M2 | R2 |
| 11 | Strict Analyzer Code Matching | 1:1 exact accession code matching, metadata preservation, `UNREVIEWED` default status | M2 | R2 |
| 12 | QC Provenance & Approval Gate | Enforce verified PASS IQC run, instrument match, accession test code, active lot, calibration evidence | M2 | R2 |
| 13 | PostgreSQL RLS Verification | Audit 19 core tenant tables for `FORCE ROW LEVEL SECURITY` and canonical `NULLIF` policy | M3 | R3 |
| 14 | Database Role Least-Privilege | Verify `DATABASE_URL` role (`hrgen_app`) is non-superuser, NO BYPASSRLS, 0 table ownership, no CREATE | M3 | R3 |
| 15 | Single-Writer Lease Protection | Verify advisory lock lease `hrgen_gia_lims_single_writer_v1` guards persistence against corruption | M3 | R3 |
| 16 | Synthetic Two-Tenant Isolation Tests | Scripted verification of tenant data isolation and fail-closed missing context | M3 | R3 |
| 17 | Static Quality Suite Execution | Execute 10-script suite `qa:all`, `forensic`, `build77`, `verify:final`, `qa:break-it` | M4 | R4 |
| 18 | Vitest Unit Test Execution | Execute Vitest suite (`npm test`) verifying phase0 security & persistence specifications | M4 | R4 |
| 19 | Playwright Browser E2E Execution | Execute browser E2E test covering login to report release (`npm run test:e2e`) | M4 | R4 |
| 20 | Runtime Evidence Collection | Record exact commands, timestamps, exit codes, and sanitized logs under `validation/runtime-evidence/` | M5 | R5 |
| 21 | Live Verification Report Publication | Generate `L99N100XN30_LIVE_VERIFICATION_REPORT.md` with source hashes, release status, and Docker environment caveats | M5 | R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Environment & Baseline Checkpoint | Git init, local config, .gitignore, baseline commit/tag, fix `FINAL_BUILD_VERIFY.js`, `npm install`, Vitest config | none | DONE |
| M2 | Clinical Safety & Workflow Gate Enforcement | Pre-analytical analyzer gate, specimen status init, auto-derive gate, critical comms re-auth, pathologist dual auth | M1 | DONE |
| M3 | PostgreSQL Tenant Isolation & Persistence | Verify 19 tables RLS, runtime role least privilege, single-writer lease, synthetic two-tenant test validation | M1 | DONE |
| M4 | Automated Testing & Browser E2E Execution | Execute `qa:all`, `forensic`, `build77`, `verify:final`, `npm test`, `npm run test:e2e` | M2, M3 | DONE |
| M5 | Runtime Evidence & Live Verification Report | Collect logs, hashes, timestamps, and author `L99N100XN30_LIVE_VERIFICATION_REPORT.md` | M4 | DONE |

## Interface Contracts
### Client ↔ Server Clinical State Contract
- Orders initialize with `pipelineStatus: 'DRAFT'` and `specimenStatus: 'PENDING_COLLECTION'`.
- Specimen acceptance (`/api/specimens/accept`) transitions `specimenStatus` to `'ACCEPTED'`.
- Result entry (`/api/orders/:id/results`) and analyzer import (`/api/instrument-results/import`) require `specimenStatus === 'ACCEPTED'`; reject with HTTP 409 if not accepted.
- QC approval (`/api/qc/approve/:orderId`) requires `pipelineStatus === 'RESULTS_ENTERED'`.
- Technical validation (`/api/orders/:id/validate`) requires `pipelineStatus === 'QC_APPROVED'`, `specimenStatus === 'ACCEPTED'`, passing Westgard, and all critical values acknowledged.
- Pathologist sign-off (`/api/orders/:id/signoff`) requires `pipelineStatus === 'VALIDATED'` and re-authentication.
- Report release (`/api/orders/:id/release`) requires `pipelineStatus === 'VALIDATED'`, `specimenStatus === 'ACCEPTED'`, pathologist sign-off, critical communication acknowledgment, and delta review.

### Database ↔ Application Multi-Tenancy Contract
- Database connection pools must separate schema migrations (`hrgen_migrator`) from runtime queries (`hrgen_app`).
- Runtime role `hrgen_app` must be `NOSUPERUSER`, `NO BYPASSRLS`, own 0 tables, and have no schema `CREATE` or `TRUNCATE` privileges.
- Every tenant table query must execute with transaction-scoped `SET LOCAL app.tenant_id = $tenantId`.
- Empty or missing `app.tenant_id` must evaluate to `NULL` via `NULLIF(current_setting('app.tenant_id', true), '')` and fail closed (0 rows returned or SQLSTATE 42501 on write).

## Code Layout
- `server.js`: Core Express server, authentication middleware, clinical state machine routes, analyzer import routes, report release, and in-memory DB persistence.
- `server/platformRoutes.js`: Extended clinical benches (specimen queue, accept/reject, timestamp updates, formula auto-derive, bypass blocks).
- `db/postgres.js`: PostgreSQL connection pool, schema bootstrap, RLS policy enforcement, runtime role validation, and single-writer advisory lock lease.
- `public/index.html`: Unified 22-module SPA/PWA client interface with Hindi/English localization.
- `FINAL_BUILD_VERIFY.js`: Static build verification script (requires `path.join(require('os').tmpdir(), ...)`).
- `vitest.config.js`: Vitest configuration excluding Playwright E2E specs.
- `validation/`: Specialized static and dynamic verification scripts (`TENANT_RLS_STATIC_VERIFY.js`, `CLINICAL_GATE_FIX_VERIFY.js`, `POSTGRES_RLS_INTEGRATION_TEST.js`, etc.).
- `validation/runtime-evidence/`: Output directory for runtime execution evidence, test logs, and final verification report.
