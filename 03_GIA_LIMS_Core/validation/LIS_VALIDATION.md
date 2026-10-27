# LIS Validation Matrix

| Domain | Requirement source | Verification | Evidence |
|---|---|---|---|
| Patient identity | URS-001 | API/state test | VAL-LIS-001 |
| Result integrity | URS-003/008 | workflow + mutation test | VAL-LIS-002 |
| QC | URS-003/005 | Westgard suite | VAL-QC-001 |
| Provenance | URS-004 | instrument/lot/calibration test | VAL-QC-002 |
| Critical values | URS-006 | communication gate | VAL-SAFE-001 |
| Delta check | URS-007 | threshold scenarios | VAL-SAFE-002 |
| E-signature | URS-009 | negative/positive test | VAL-SEC-001 |
| Audit | URS-010 | chain/tamper test | VAL-AUD-001 |
| QR | URS-011 | release/tamper test | VAL-QR-001 |
| DR | URS-012 | backup/restore | VAL-DR-001 |
