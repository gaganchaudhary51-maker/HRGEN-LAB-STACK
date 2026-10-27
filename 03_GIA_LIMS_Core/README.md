# HRGen GIA LIMS v6.0.0 — 77/77 Capability Surface / L99N100XN30 Fix Cycle

Server-authoritative pathology LIS foundation upgraded for a sellable SaaS/on-prem product path. The 77-capability build surface is implemented across the existing LIS core and phased SaaS/on-prem modules without maintaining a parallel SQLite architecture.

## Storage decision

**PostgreSQL-only.** SQLite and filesystem `db.json` are not supported. Docker Compose ships PostgreSQL 16 and the application uses relational tables for users, patients, orders, order tests, catalog, QC, instruments, reagent lots, calibration, delta checks, critical communication, report versions, backups, validation evidence and audit events.

## Current 77/77 build controls

- Per-user authentication with bcrypt password hashes.
- User-bound server sessions and immediate session revocation on disable.
- Pathologist-only electronic report sign-off with server-side password re-authentication.
- Exact test-code matching against the authoritative catalog.
- Unit-aware panic/critical flag evaluation for configured analytes (Na, K, Ca, INR, creatinine); laboratory-approved limits must be verified before production.
- Golden-vector/behavior-test scaffolding with Vitest and Playwright.
- No default patient/order seed data.
- No hard-coded role passwords.
- Production bootstrap requires explicit credentials through environment variables.
- No fake payment/dispatch/accreditation state.
- PostgreSQL transactions for persistence.

## Existing LIS workflow preserved

Patient → Order/Billing → Sample/Barcode → Result Entry or Instrument Import → IQC/QC → Delta/Critical checks → Pathologist Validation → Electronic Sign-off → Release → QR Verification → Audit.

## Setup

1. Copy `.env.example` to `.env`.
2. Generate three distinct strong, URL-safe secrets for `POSTGRES_ADMIN_PASSWORD`, `POSTGRES_APP_PASSWORD`, and `POSTGRES_MIGRATOR_PASSWORD` (for example, `openssl rand -hex 32`). Keep `DATABASE_URL` on `hrgen_app` and `MIGRATION_DATABASE_URL` on `hrgen_migrator`; set `AUTH_SECRET`, bootstrap admin credentials, and laboratory configuration. Do not reuse passwords.
3. Run `docker compose up -d --build`.
4. For local development with PostgreSQL already available: `npm install && npm start`.

## L99N100XN30 fix cycle — 2026-10-15

- Result entry and report release require an accepted specimen.
- Specimen acceptance validates tube code against accession requirements; specimen rejection requires an explicit allowed reason and retains specimen history.
- Analyzer import requires an active instrument in the authenticated tenant and an exact, non-duplicated accession test set. Imported values remain `UNREVIEWED` until reviewed.
- Direct fast-track release is disabled because it previously fabricated QC, calibration and sign-off evidence.
- Batch validation is fail-closed until it can invoke the canonical single-order validator.
- Analyzer simulation is blocked in production and requires a tenant-owned active instrument.
- PostgreSQL RLS now fails closed on missing tenant context and NULL tenant ownership; startup checks that the runtime role is not superuser/BYPASSRLS and does not own tenant tables.
- Schema migrations use a separate `hrgen_migrator` role; runtime uses least-privilege `hrgen_app`.
- A single-writer advisory lease blocks multiple application instances while the shared in-memory state architecture remains.
- Playwright discovery is limited to `*.spec.js`, so Vitest unit tests are not misidentified as browser tests.

## Validation gate

`npm run qa:all`, `npm run forensic`, `npm run build77`, and `npm run verify:final` run the static/source-level suite. The new `npm run verify:clinical-gates` checks the fixes above. Passing these checks does not prove live PostgreSQL behavior, browser E2E, analyzer integration, NABL accreditation, ISO 15189 compliance, or production readiness.

The portable source bundle excludes `node_modules`. Run `npm ci` on the target OS. `npm test` and Playwright E2E remain blocked in this build environment because dependency installation did not complete and the Playwright CLI test command is unavailable in the partial install. No live PostgreSQL or Docker runtime is available here, so `npm run test:rls` was not executed. For a fresh database volume, Docker initializes the dedicated roles automatically. For an existing database volume, the init script will not rerun: create the roles, run `db/migrations/20261015_tenant_rls_hardening.sql` as PostgreSQL administrator, map any NULL `tenant_id` rows to verified owners, and then configure distinct connection URLs. The application still loads shared all-tenant state in memory; the single-writer lock is a temporary guard, not proof of complete tenant isolation. Production clinical release remains blocked until live two-tenant RLS tests, tenant-scoped transactional repositories, browser E2E, analyzer integration, OQ/PQ/UAT, backup/restore, and DR gates pass.

## Cross-forensic rule
Existing features are retained unless duplicate/obsolete; roadmap features are not duplicated prematurely. See `validation/FEATURE_FORENSIC_MATRIX.md` and `validation/CLEANUP_LOG.md`.

## Final 77-build status (2026-10-06)
77/77 capability surface passes static verification. Live provider/hardware/OQ/PQ/UAT remain target-environment gates.
