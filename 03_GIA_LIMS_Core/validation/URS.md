# HRGen Laboratory Reporting System - User Requirements Specification (URS)
Version: 1.0 | Status: Validation baseline

## Scope
Server-authoritative laboratory reporting workflow covering patient/order/result management, IQC, Westgard rules, instrument provenance, reagent lots, calibration, delta checks, critical-result communication, validation, electronic sign-off, release, amendment/versioning, QR verification, audit trail, backup/restore and validation evidence.

## Critical requirements
| ID | Requirement | Risk | Acceptance evidence |
|---|---|---|---|
| URS-001 | All PHI/report state shall be server-authoritative | P1 | API/state test |
| URS-002 | Role-based access shall be enforced server-side | P1 | negative authorization tests |
| URS-003 | Results cannot be released without PASS IQC | P1 | release-gate test |
| URS-004 | QC approval shall reference valid instrument, reagent lot and PASS calibration | P1 | provenance test |
| URS-005 | Westgard evaluation shall be deterministic and traceable | P1 | rule test suite |
| URS-006 | Critical results require documented communication/read-back | P1 | release-gate test |
| URS-007 | Delta-check REVIEW requires acknowledgement before release | P1 | release-gate test |
| URS-008 | Validated/released reports are immutable; amendments create new versions | P1 | mutation/amendment test |
| URS-009 | Electronic signature requires server-side re-authentication | P1 | signature negative test |
| URS-010 | Every material workflow transition creates a tamper-evident audit event | P1 | audit-chain verification |
| URS-011 | Released report QR must verify current report integrity | P1 | QR positive/tamper test |
| URS-012 | Backup integrity and restore operations shall be auditable | P1 | DR test |
| URS-013 | Validation evidence shall record individual checks and overall status | P2 | evidence endpoint test |
| URS-014 | System shall fail closed when required production secrets are absent | P1 | startup/config test |

## Acceptance rule
Any failed P1 requirement blocks production release. A passed software validation does not establish laboratory accreditation or method performance.
