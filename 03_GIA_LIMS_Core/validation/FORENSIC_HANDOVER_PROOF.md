# HRGen GIA LIMS v6.0.0 — L99N30 Forensic Handover Proof

Audit date: 2026-10-06

## Independent proof results

- 77-feature build surface: **77/77 PASS**
- Primary forensic verifier: **36/36 PASS**
- Cross-forensic verifier: **25/25 PASS**
- Final composed verifier: **PASS**
- Formula smoke: PASS
- HL7 smoke: PASS
- FHIR smoke: PASS
- Ed25519 license smoke: PASS
- JavaScript syntax: PASS

## Core repair evidence

| Control | Proof | Status |
|---|---|---|
| Employee login/RBAC | `server.js` auth + `requireRole()` | FIXED/VERIFIED |
| User disable/session revoke | `/api/users/:id/status` | FIXED/VERIFIED |
| Patient history | authoritative patient/order IDs | FIXED/VERIFIED |
| Result test-code integrity | exact catalog match + UI preservation | FIXED/VERIFIED |
| QC provenance | instrument + reagent + calibration gates | FIXED/VERIFIED |
| Sign-off | pathologist-only + bcrypt re-auth | FIXED/VERIFIED |
| Release immutability | mutation guards on released reports | FIXED/VERIFIED |
| QR integrity | server verification + HMAC report hash | FIXED/VERIFIED |
| Audit integrity | HMAC chain + DB append-only trigger + `audit_seq` | FIXED/VERIFIED |
| Backup/restore | SHA-256 + replace transaction + pre-restore snapshot | FIXED/VERIFIED |
| Tenant/catalog isolation | tenant fields + RLS declarations + tenant/code uniqueness | IMPLEMENTED |
| On-prem license | Ed25519 verify + expiry/AMC enforcement | IMPLEMENTED |
| Provider behavior | explicit `NOT_CONFIGURED`; no simulated success | IMPLEMENTED |
| Demo/default cleanup | hard-coded clinical/demo values removed | FIXED/VERIFIED |

## 77 capability build

All feature IDs 1–77 are represented in `server/featureRegistry.js`, mapped in `validation/FEATURE_FORENSIC_MATRIX.md`, and checked by `BUILD_77_VERIFY.js`.

## Runtime boundary

Live deployment, analyzer commissioning, provider credentials, laboratory-approved methods/reference ranges, OQ/PQ/UAT, VMR signatures and change-control approval remain target-environment/organizational gates.

**This artifact does not claim NABL or ISO accreditation.**
