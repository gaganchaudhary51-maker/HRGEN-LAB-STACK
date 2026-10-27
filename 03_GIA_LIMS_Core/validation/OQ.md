# Operational Qualification (OQ)

## Functional control tests
- Authentication and RBAC negative tests.
- Patient/order server authority tests.
- Workflow state transition tests.
- IQC Westgard rule tests: 1-3s, 2-2s, R-4s, 4-1s, 10x, warning 1-2s.
- QC provenance tests for instrument, reagent lot, expiry and calibration.
- Delta-check PASS/REVIEW tests.
- Critical-result read-back gate.
- Electronic-signature wrong-password rejection.
- Release gate.
- QR positive and tamper-negative verification.
- Amendment creates new version and preserves original.
- Audit-chain tamper detection.
- Backup checksum and restore test.

**OQ acceptance:** all P1 tests PASS; no open critical defect.
