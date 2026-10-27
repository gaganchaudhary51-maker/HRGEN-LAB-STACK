# Analyzer Interface Verification

For each analyzer/interface combination record:
- instrument ID/model/serial
- interface protocol and version
- message ID uniqueness
- patient/sample identifier mapping
- test-code mapping
- units and decimal precision
- flags/abnormal indicators
- date/time handling
- duplicate message handling
- error/rejection handling
- audit event generated

Acceptance requires 100% mapping of approved test messages in the verification set and zero unresolved patient/result mis-association.
