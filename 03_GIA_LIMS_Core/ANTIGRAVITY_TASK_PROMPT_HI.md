# ANTIGRAVITY TASK — HRGen GIA LIMS — L99N100XN30 LIVE VERIFICATION

You are operating inside the HRGen GIA LIMS project workspace. Continue in THIS project; do not create a duplicate project or redesign the UI.

## Non-negotiable constraints
- Preserve existing UI, navigation, styling, Hindi/English features, and HRGen-specific workflows.
- Docker is already installed. Detect and use the existing Docker CLI/Desktop and the existing Compose setup; do not reinstall Docker.
- Preserve all user data and Docker volumes. Never run `docker compose down -v`, prune volumes, or destructive reset commands.
- Start by checking `git status`, current branch/commit, package scripts, `.env` presence without printing secrets, Docker version, Compose version, containers and health, database migrations, and project structure.
- Create a Git checkpoint/backup before code edits. Do not overwrite an existing `.env` or print tokens/passwords/patient information.
- Use only synthetic test data and an isolated test database; never use production patient records.
- Do not weaken tests, remove assertions, fabricate QC/calibration/sign-off evidence, or bypass clinical safety gates to obtain green results.

## Execution plan
1. Inspect this project and verify its source identity. Record commit and SHA-256 of important source files. Identify whether this workspace already contains local changes before editing.
2. Validate Docker/Compose and inspect the existing stack without destroying volumes. Run health checks and migrations safely against the test environment.
3. Run all existing QA/forensic scripts, unit tests (including Vitest), and Playwright E2E tests. Fix dependency/runner configuration problems properly; do not treat static checks as live tests.
4. Execute real PostgreSQL tests with at least two synthetic tenants:
   - Tenant A cannot read/update/delete Tenant B rows.
   - Missing tenant context fails closed.
   - Runtime role cannot bypass RLS or run migrations.
   - Rollback and concurrent writes are consistent.
   - Committed data survives application/database restart.
5. Run browser E2E across login, order creation, specimen receipt/accept/reject, result entry, QC review, pathologist sign-off, report release, critical-result restrictions, and audit history.
6. Fix P0/P1 findings with small, reviewable patches while keeping UI unchanged. Re-run affected tests and full regression suite after each fix.
7. Save timestamped commands, exit codes, redacted logs, screenshots/traces, DB test output, and test summaries under `validation/runtime-evidence/`.
8. Create `validation/runtime-evidence/L99N100XN30_LIVE_VERIFICATION_REPORT.md` with source commit/hash, tool versions, tests actually run, PASS/FAIL/BLOCKED, changed files, remaining P0/P1 findings, and final release recommendation.

## Release gate
If any P0/P1 issue remains, tenant isolation is unproven, or a required live test is blocked, clearly report `PRODUCTION RELEASE BLOCKED`. Never call this production-ready based only on static QA or a successful build.

Begin now with safe inspection and the first verification command. Continue autonomously until a real blocker requires user input. Give concise progress updates and finish with the report path and exact evidence-backed results.
