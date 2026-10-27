# Risk Assessment / FMEA
Scoring: Severity (S) 1-5, Occurrence (O) 1-5, Detectability (D) 1-5. RPN = S×O×D.

| ID | Failure mode | Effect | S | O | D | RPN | Control / residual acceptance |
|---|---|---|---:|---:|---:|---:|---|
| FMEA-001 | Unauthorized PHI access | Confidentiality breach | 5 | 3 | 3 | 45 | Server auth/RBAC; negative tests PASS |
| FMEA-002 | QC failure bypassed | Incorrect report release | 5 | 2 | 2 | 20 | Westgard + release gate |
| FMEA-003 | Expired reagent used | Invalid analytical result | 5 | 3 | 3 | 45 | Active/expiry lot gate |
| FMEA-004 | Invalid calibration context | Analytical error | 5 | 3 | 3 | 45 | PASS calibration tied to instrument |
| FMEA-005 | Critical result not communicated | Patient-safety risk | 5 | 2 | 2 | 20 | Read-back communication gate |
| FMEA-006 | Delta change missed | Result plausibility issue | 4 | 3 | 3 | 36 | Delta check + acknowledgement |
| FMEA-007 | Released report silently altered | Traceability failure | 5 | 2 | 2 | 20 | Immutable release + amendment version |
| FMEA-008 | Signature spoofing | Unauthorized approval | 5 | 2 | 3 | 30 | Server re-authentication |
| FMEA-009 | Audit tampering | Loss of evidence | 5 | 2 | 3 | 30 | HMAC chain + verifier |
| FMEA-010 | Backup corruption | Data loss | 5 | 2 | 3 | 30 | SHA-256 manifest + restore verification |
| FMEA-011 | Wrong reference interval | Misclassification | 5 | 3 | 3 | 45 | Method/age/sex/unit verification required |
| FMEA-012 | Interface mapping error | Wrong patient/result association | 5 | 2 | 3 | 30 | Message ID + instrument provenance + UAT |

Residual risk is accepted only after documented controls and successful verification evidence.
