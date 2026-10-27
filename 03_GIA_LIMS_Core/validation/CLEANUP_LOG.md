# L99N30 Cleanup / Build Log — v6.0.0

## Preserved core

Existing LIS core remains canonical: employee login, RBAC, patient, accession, billing, barcode, result entry, QC/Westgard, provenance, validation, sign-off, release, QR, amendments, audit, backup/restore, print and PWA shell.

## Removed / repaired

- Duplicate legacy QC route removed.
- Fake billing/history fallbacks removed.
- Fake/offline success wording removed.
- Misleading accreditation wording removed.
- Demo/placeholder patient/doctor/barcode content removed.
- Obsolete schema/persistence artifacts removed.
- Browser patient/report storage removed.
- Result-entry code retention repaired.
- Patient history authoritative-ID linkage repaired.
- Audit ordering made deterministic.
- Backup/restore changed to explicit replace transaction with pre-restore snapshot retention.
- Platform records and sequence counters included in state backup/restore.
- Tenant-specific catalog code uniqueness hardened.
- On-prem license verification added.

## 77 build additions

All roadmap capabilities #34–#77 now have implementation surfaces without maintaining a parallel SQLite architecture.

## Verification

`FINAL_BUILD_VERIFY.js` is the canonical composed static proof runner.
