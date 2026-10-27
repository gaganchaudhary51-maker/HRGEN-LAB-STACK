# HRGen GIA LIMS — Phase B Handover / L100X-L99N30

## Scope
Phase B implements the OPD Reception / Pre-Analytical transaction on top of the existing Phase A / 77-capability PostgreSQL architecture.

### Built
1. Exact patient age capture: Years / Months / Days.
2. Referral doctor master with percentage/fixed commission configuration.
3. Fast server-backed test catalog search.
4. Server-authoritative test pricing.
5. Basket duplicate protection.
6. Percentage/fixed discount calculation with caps.
7. Cash / UPI / Card / Credit payment capture and due calculation.
8. Server-authoritative dynamic UPI QR generation; absent UPI configuration fails closed.
9. Accession/invoice generation using the existing PostgreSQL sequence mechanism.
10. Referral commission snapshot at accession time.
11. 50×25 mm tube-label payloads.
12. Tube routing rules for EDTA, citrate, serum and microbiology.
13. Deterministic Code 128-B barcode encoding and SVG rendering.
14. Label print surface with 50×25 mm print CSS.
15. OPD payment endpoint with overpayment protection.
16. OPD registration idempotency using `X-Idempotency-Key` and persisted replay evidence.
17. Tenant-scoped OPD catalog, doctors, patients and orders.
18. Append-only audit events for OPD registration and payment capture.

## Architecture rule
The existing backend architecture is preserved: Express + PostgreSQL + existing auth/RBAC + existing 77-feature registry. No SQLite fallback or alternate persistence layer was introduced.

## GMP-style engineering controls
This document uses **GMP-style build discipline** (traceability, controlled changes, deterministic calculations, audit evidence, release identity and hash verification). It is **not a claim of GMP certification or laboratory accreditation**.

## Verification evidence
| Evidence | Result |
|---|---:|
| Phase B verifier | PASS — 65/65 |
| Deterministic property/fuzz tests | PASS — 50,000 checks |
| 77-feature verifier | PASS — 77/77 |
| Primary forensic verifier | PASS — 36/36 |
| Cross forensic verifier | PASS — 25/25 |
| QA/QC break-it verifier | PASS — 86/86 |
| Phase A regression verifier | PASS — 18/18 |
| JS syntax checks | PASS — 24 files |
| Static HTTP index smoke | PASS — HTTP 200 |
| HTML parser / duplicate-ID check | PASS — 17 IDs, 0 duplicates |

## Runtime boundary
`npm install --no-audit --no-fund` was attempted but timed out in the execution environment. No `node_modules` directory was available afterward, and `npm test` therefore could not execute (`vitest: not found`). PostgreSQL was also not available through this execution environment. Therefore this release does **not** claim live Express/PostgreSQL OQ/PQ/UAT.

## Release rule
The Phase B ZIP SHA-256 is the release identity. Any byte-level change requires a new hash and a new verification run.
