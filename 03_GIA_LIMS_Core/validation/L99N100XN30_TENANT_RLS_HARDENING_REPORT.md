# HRGen GIA LIMS — L99N100XN30 Tenant Isolation Hardening

**Status:** Source changes implemented; live PostgreSQL qualification blocked by unavailable PostgreSQL/Docker runtime in the build environment.
**UI baseline:** Preserved. `public/index.html` and existing visual assets were not changed in this cycle.

## Implemented

1. Split the PostgreSQL connections: `DATABASE_URL` is the runtime connection; `MIGRATION_DATABASE_URL` is reserved for schema migrations.
2. Startup now fails closed if the runtime role is superuser, has `BYPASSRLS`, can create objects in `public`, or owns tenant tables.
3. Added a PostgreSQL init script that creates separate `hrgen_app` and `hrgen_migrator` roles with `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, and `NOINHERIT`.
4. Tenant-owned tables now use strict RLS predicates: `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')`. NULL tenant rows and missing context no longer receive a permissive policy.
5. `ensureSchema()` blocks startup if legacy tenant-owned tables contain NULL `tenant_id` values. This avoids silently assigning clinical records to the wrong laboratory; data owners must map those rows before enabling strict RLS.
6. Extended RLS coverage to `sequence_counters`, `api_keys`, and `refresh_tokens`.
7. Added an advisory single-writer lease. A second application instance fails startup while the shared in-memory state architecture remains in use, preventing unqualified multi-writer operation.
8. Added `validation/POSTGRES_RLS_INTEGRATION_TEST.js` to test role privileges, forced RLS, tenant A/B read isolation, cross-tenant write denial, and missing-context fail-closed behavior.
9. Docker builds now use `npm ci --omit=dev` with `package-lock.json`; `.dockerignore` excludes secrets and local dependencies.
10. Existing UI, Hindi/English strings, cards, navigation, and HRGen-specific workflows were left unchanged.

## Verification executed

- `npm run qa:all`: PASS, including existing 77-feature surface check, 86 break-it checks, Westgard 23/23, clinical gates 17/17, analyzer/UI verifier 20/20, and new tenant RLS static verifier 21/21.
- `node --check db/postgres.js`, `node --check server.js`, and `node --check validation/POSTGRES_RLS_INTEGRATION_TEST.js`: PASS.
- ZIP integrity and SHA-256: verified after packaging (checksum distributed beside the archive).
- `npm test`: BLOCKED — `npm ci` did not complete before the environment timeout; `vitest` executable is unavailable in the partial install.
- Live RLS integration: NOT RUN — no PostgreSQL server/client or Docker executable is available here.
- Playwright E2E discovery: BLOCKED — the partial install reports `unknown command test`; browser E2E and clinical OQ/PQ/UAT were not run.

## Important remaining risks

- The application still loads a shared all-tenant state object in memory. The database RLS work is defense-in-depth, not completion of tenant-scoped repository isolation. The single-writer lease intentionally prevents running multiple app instances until this architecture is replaced.
- Existing database volumes do not execute Docker's init scripts a second time. For an existing deployment, create the two roles with unique strong passwords, run `db/migrations/20261015_tenant_rls_hardening.sql` as a PostgreSQL administrator, resolve NULL `tenant_id` rows with verified ownership, then configure distinct `DATABASE_URL` and `MIGRATION_DATABASE_URL` values.
- `hrgen_migrator` must own the tables. `hrgen_app` must not be a superuser, must not own tenant tables, and must not have `BYPASSRLS` or schema CREATE privileges.
- Do not use this build for clinical production until live two-tenant PostgreSQL tests, concurrent mutation/rollback tests, browser E2E, analyzer validation, backup/restore, DR, load/chaos, and signed OQ/PQ/UAT pass.

## Next execution gate

Replace the shared in-memory all-tenant state and whole-state upserts with tenant-scoped transactional repositories. Keep the single-writer lease in place until this is verified under concurrent mutation and multi-tenant tests.
