# Enterprise Forensic Audit and Local Verification

**Date:** 2026-10-18  
**Scope:** Source-tree audit of UI/UX, architecture, backend/API security, clinical workflow gates, capability claims, and operational readiness.  
**Workspace:** `C:\Users\pc\Desktop\HRGEN GIA LIMS FINAL`  
**Method:** Reviewed current source and validation harnesses; ran local static/clinical/unit/E2E/UI checks and an isolated embedded PostgreSQL RLS suite. No `.env` values were read and no existing/shared database was used. This workspace is not a Git checkout, so there is no Git diff or commit evidence.

## Executive result

Confirmed issues in capability reporting, report export access, SAML metadata XML encoding, the offline sync API response, and the PostgreSQL test cleanup boundary were corrected. Responsive layout, form contrast, visible error rendering, and keyboard scrolling of data tables were also improved. The current local synthetic suites pass. The isolated PostgreSQL harness ran against its own unique temporary cluster and passed its RLS assertions.

This is not production release evidence. The browser and E2E suites use an in-memory synthetic test server; the production server was not launched. Docker and `psql` are unavailable. The application architecture still holds shared multi-tenant state in process memory, and several advertised integration capabilities are incomplete or carry unresolved security/operational risks. No clinical validation, accreditation, or production readiness conclusion follows from these checks.

## Findings and dispositions

### Fixed in this audit

| Severity | Area | Evidence and behavior | Remediation |
|---|---|---|---|
| High | Capability claims / validation | `/api/features` presented registry entries as implemented, and `/api/validation/77` returned a fabricated readiness result. The registry is not runtime/UI/evidence validation. | Feature status is now `REGISTERED`; validation endpoint reports `NOT_VERIFIED` and `VALIDATION_REQUIRED`, with null proof fields. |
| High | Clinical result exports | FHIR DiagnosticReport/Observation and HL7 ORU exports could expose unreleased results or be called without a common explicit clinical role gate. | Added role and `RELEASED` checks plus tenant-bound patient/order lookup. Public API order disclosure also refuses unreleased orders. |
| High | Offline sync API | `/api/offline/sync` responded as if sync were accepted although no action replay occurred. | Returns HTTP 501 `NOT_IMPLEMENTED`; it no longer implies acceptance. The browser’s offline queue now serializes replay locally, sorts by creation time, stops on first replay failure, and listens for service-worker sync requests. |
| Medium | XML / SAML metadata | Unescaped and invalid XML attribute characters could corrupt metadata or inject markup into an XML attribute. | Added XML attribute escaping and invalid control-character removal. |
| High (test safety) | PostgreSQL RLS test harness | Harness used a fixed port and recursively removed workspace `.tmp_postgres_live`, risking unrelated local data. | Harness creates a uniquely named directory under the OS temp directory, selects a free port, and removes only its owned directory after shutdown. |
| Medium | Responsive UI / forms | At 390px viewport, the document expanded to 2,663px; native form controls had poor contrast in dark theme. | Constrained/wrapped shell layout, dark form-control styling, and horizontally scrollable, keyboard-focusable table regions. Post-fix document width measured 390px. |
| Medium | UI error rendering / accessible names | API error text was inserted as markup; rendered controls lacked accessible names; tables had no keyboard scroll region. | API errors are escaped; unnamed controls receive an aria-label derived from their existing placeholder/name/id; table wrappers have region names and keyboard focus. The UI audit found no unnamed visible controls in the sampled views. |
| Low | Dispatch capability wording | UI said “Live GPS Dispatch” although it only captures a location at assignment time. | Changed the label to “GPS captured at job assignment.” |

**Compatibility note:** `/api/offline/sync` now returns HTTP 501 instead of a false-success response. Callers that depended on the incorrect success shape must use original API routes or handle the explicit unsupported status. No other new public routes or response formats were introduced.

### Remaining release risks / incomplete capabilities

| Severity | Area | Evidence / impact | Gate |
|---|---|---|---|
| High | Tenant isolation architecture | `server.js` loads database records into a shared process-level `DB` object; PostgreSQL adapter has a single-writer advisory lease. Route-level tenant filters and live RLS tests are useful controls, but every route must consistently filter the shared state. This is not tenant-isolated process architecture. | Before multi-tenant enterprise release, replace all-tenant state loading with tenant-scoped access or demonstrate a complete route-by-route tenant isolation review and production deployment controls. Existing README and RLS hardening report disclose this limitation. |
| High | Webhook test SSRF / response disclosure | `POST /api/webhooks/:id/test` fetches the tenant-configured URL and returns up to 2,000 characters of the remote response. URL configuration is not shown enforcing public-address-only resolution, redirect restrictions, or DNS/IP pinning. This can allow internal-network requests and response disclosure by an authorized tenant admin. | Enforce scheme/host policy, block private/link-local/loopback destinations after DNS resolution, prevent unsafe redirects, and avoid returning remote response bodies; add adversarial SSRF tests. |
| High | Offline replay semantics | Browser queue sends `X-Idempotency-Key`, but the ordinary API path does not establish server-side idempotency for mutations. If a server commits and the response is lost, replay may duplicate an action. Also, queueing is local to the browser and cannot prove server acceptance. | Add durable server-side idempotency scoped to tenant/user/route and verify replay outcomes; make UI distinguish “saved locally/pending” from server-confirmed success. Current behavior is not exactly-once. |
| High | SSO completeness | OIDC/SAML registry and endpoints imply SSO. Current source provides SAML metadata and an OIDC code exchange path, but review did not find full OIDC ID-token validation/session issuance or a complete SAML assertion-consumer flow. | Treat SSO as incomplete until assertion/token validation, issuer/audience/signature/nonce/state checks, session issuance, and negative integration tests are implemented. |
| Medium | Capability surfaces vs delivered workflows | Several module surfaces are explicitly “Phase A shell surface” and say detailed workflow lands later. Registry presence and shell rendering do not demonstrate end-to-end functionality. | Publish capability state from tested server/UI/evidence rather than registry presence; validate each advertised workflow against release acceptance criteria. |
| Medium | Accessibility / usability | Runtime sampled 12 modules for keyboard-focusable tables, accessible names, render errors and narrow viewport overflow. Labels are often derived from placeholders rather than persistent visible labels; this is a pragmatic improvement, not a WCAG AA audit. | Run assistive-technology and full keyboard-only testing, visible-label review, focus order, contrast, zoom, and formal WCAG 2.1 AA evaluation. |
| Medium | Runtime deployment | Docker and `psql` are unavailable; production app/service configuration was not started and `.env` was intentionally not examined. | Run deployment/backup/restore, TLS, secrets, migrations, operational monitoring, and disaster recovery checks in an approved isolated staging environment. |

## Local verification evidence

| Check | Result | Boundary |
|---|---|---|
| `npm run qa:all` | PASS | Includes static, clinical, tenant/RLS source checks, and enterprise audit assertions. |
| `npm test` | PASS: 1 file, 5 tests | Required an approved elevated rerun because esbuild could not read its config directory in the sandbox. |
| `npm run test:e2e` | PASS: 63/63 | Playwright against synthetic in-memory test server, not the production PostgreSQL-backed application. |
| `node validation/UI_UX_RUNTIME_AUDIT.js` | PASS | 12 sampled modules, desktop and 390px narrow viewport; no render errors, browser page errors, unnamed visible controls, or document overflow. Error-rendering probe confirmed injected markup remained text. Screenshots: `%TEMP%\hrgen-ui-ux-desktop.png` and `%TEMP%\hrgen-ui-ux-mobile.png`. |
| `node validation/ENTERPRISE_AUDIT_VERIFY.js` | PASS: 6 checks | Verifies the focused security, capability, and harness corrections. |
| `node validation/RUN_LIVE_POSTGRES_RLS_SUITE.js` | PASS | Isolated embedded PostgreSQL 18.4 cluster, dynamically selected port, synthetic tenants, 7 RLS assertions, transaction rollback/concurrency/restart checks. Used an approved elevated run because the sandbox runtime failed during OS user lookup. The owned temporary directory was removed. |
| Docker/`psql` production-stack checks | BLOCKED | Docker and `psql` are not installed. No check was counted as passing. |
| Existing historical runtime logs | NOT CURRENT PROOF | Prior report records refer to a different directory and/or mocked runtime; they were not treated as current verification. |

## Reproduction and source pointers

- Capability and validation responses: `server/platformRoutes.js` (`/api/features`, `/api/validation/77`).
- FHIR export guards and offline endpoint: `server/platformRoutes.js` (`/api/fhir/DiagnosticReport/:id`, `/api/fhir/Observation/:orderId`, `/api/offline/sync`).
- Webhook URL fetch path requiring SSRF controls: `server/platformRoutes.js` (`/api/webhooks/:id/test`).
- Process state bootstrap and single-writer limitation: `server.js` (`bootstrapDatabase`) and `db/postgres.js`; see the architecture note in `README.md` and tenant RLS hardening evidence.
- Safe disposable RLS cluster: `validation/RUN_LIVE_POSTGRES_RLS_SUITE.js`.
- Focused audit assertions: `validation/ENTERPRISE_AUDIT_VERIFY.js`; included in `npm run qa:all` and available as `npm run verify:enterprise-audit`.
- Runtime UI audit harness: `validation/UI_UX_RUNTIME_AUDIT.js` (synthetic test server only).

## Release decision

**Do not interpret this local audit as production approval.** The confirmed fixes passed their local checks, but the tenant state architecture, webhook SSRF boundary, server-side replay idempotency, incomplete SSO flows, production deployment controls, and formal clinical/accessibility validation remain release gates.
