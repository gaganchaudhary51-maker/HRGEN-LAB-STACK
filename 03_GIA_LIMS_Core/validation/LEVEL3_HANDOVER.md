# HRGen GIA LIMS — Level 3 Enterprise Integration Handover

## Scope
- Hardened HL7 v2 MLLP parsing and ACK handling.
- Added strict MSH-10 message-control ID handling.
- Added malformed-message fail-closed behavior.
- Added MLLP frame size, connection-count, idle-timeout and socket-error boundaries.
- Added ASTM E1381/E1394-style TCP frame/checksum parser and ACK/NAK transport edge.
- Added configurable ASTM runtime gate: `ASTM_ENABLED`, `ASTM_PORT`.
- Existing MLLP gate retained: `MLLP_ENABLED`, `MLLP_PORT`.

## Fresh evidence
- `LEVEL3_ENTERPRISE_INTEGRATION_VERIFY.js` = 9/9 PASS.
- Phase A = 18/18 PASS.
- Phase B = 65/65 PASS.
- Phase C = 34/34 PASS.
- Level 1 = 29/29 PASS.
- Level 2 = 23/23 PASS.
- Tenant leak = 4/4 PASS.
- UX = 20/20 PASS.
- Cross verification = 25/25 PASS.
- Deterministic fuzz = 50,000/50,000 PASS.
- Level 2 mutation = 5/5 killed.
- Phase C mutation = 8/8 killed.
- Deep forensic mutation precheck = 4/4 PASS.

## Qualification boundary
This build verifies protocol implementation and static/security regression. It does **not** claim live analyzer hardware qualification, serial-port OQ/PQ, hospital EHR interoperability acceptance, or production release readiness without target-environment execution.
