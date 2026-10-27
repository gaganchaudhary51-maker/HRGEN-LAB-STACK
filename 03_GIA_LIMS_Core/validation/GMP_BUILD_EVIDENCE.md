# GMP-Style Build Evidence — Phase B

## 1. Traceability matrix
| Requirement | Implementation | Proof |
|---|---|---|
| Exact Y/M/D | `server/services/opdService.js::normalizeAge` | 65-check verifier + 5,000 age property checks |
| Referral doctor | `/api/opd/doctors` | Phase B verifier |
| Commission | server-side calculation + order snapshot | Phase B verifier |
| Fast test basket | `/api/opd/catalog` + OPD UI | Phase B verifier + HTTP UI smoke |
| Price authority | catalog prices read server-side | source inspection + pricing tests |
| Discount | `calculatePricing` | deterministic unit checks + fuzz |
| Due | `calculateDue` | boundary checks + fuzz |
| Dynamic UPI | server env + `QRCode.toDataURL` | UPI fail-closed checks |
| Tube routing | `tubeForTest` | EDTA/citrate/serum checks |
| 50×25 mm labels | `makeLabelData` + print CSS | label dimension checks + UI smoke |
| Code128-B | deterministic encoder | start/stop/checksum + 5,000 fuzz checks |
| Duplicate request safety | `X-Idempotency-Key` | persisted replay design + verifier |
| Tenant isolation | tenant filters | source verifier |
| Audit trail | OPD audit events | source verifier |

## 2. Failure-injection / adversarial cases
- Invalid age rejected.
- Zero age rejected.
- Invalid mobile rejected.
- Duplicate test basket rejected.
- Unknown test code rejected.
- Fixed discount cannot exceed gross.
- Percentage discount cannot exceed 100%.
- Payment cannot exceed net payable.
- Payment cannot exceed order balance.
- Invalid UPI ID rejected.
- Zero UPI amount rejected.
- Missing server UPI configuration returns `NOT_CONFIGURED` rather than simulated success.
- Duplicate OPD request in-flight returns `409`.
- Persisted idempotency response is replayable after a successful save.
- Tenant filters are present on OPD patient/order/catalog paths.

## 3. Integrity controls
- PostgreSQL-only architecture retained.
- No SQLite dependency.
- Existing RLS / FORCE RLS controls remain in baseline.
- Existing append-only audit chain remains in baseline.
- Existing 77-feature and forensic verification suites remain green.
- Release ZIP receives a SHA-256 digest.

## 4. Validation limitation
No live database or dependency-complete runtime execution was possible in the supplied environment. Static, deterministic, property-based, syntax, HTTP-static and forensic checks are real executed evidence; live OQ/PQ/UAT remains a deployment-stage requirement.
