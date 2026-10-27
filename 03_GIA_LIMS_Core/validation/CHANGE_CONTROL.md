# Change Control — HRGen GIA LIMS v6.0.0

## Change ID
`HRG-LIS-CC-2026-10-03-001`

## Change scope
Controlled upgrade from the v5.0.2 L99N30 hardened LIS baseline to the v6.0.0 77-capability build.

## Major change groups
- PostgreSQL-only multi-tenant foundation and RLS declarations
- Commercial SaaS/on-prem entitlement and license surfaces
- Workflow/customization controls
- India privacy/interoperability support surfaces
- Analyzer/instrument integration surfaces
- Patient/channel/collection/B2B surfaces
- Business operations and MIS
- Enterprise interoperability/SSO/API/white-label/SLA
- GIA AI, voice, offline and predictive capability surfaces
- Cross-forensic security and data-integrity repairs

## Validation impact
- Static 77-feature verification required
- Security/forensic regression required
- Formula/HL7/FHIR smoke verification required
- Live OQ/PQ/UAT required in target environment
- Analyzer/interface verification required before clinical use

## Rollback
Preserve the prior controlled package and PostgreSQL backup. Restore only through the audited restore path after integrity verification.

## Approval
| Role | Name | Signature | Date | Status |
|---|---|---|---|---|
| System Owner | __________________ | __________________ | __________ | PENDING |
| Quality Manager | __________________ | __________________ | __________ | PENDING |
| Technical/Pathology Approver | __________________ | __________________ | __________ | PENDING |
| Laboratory Head / Authorized Approver | __________________ | __________________ | __________ | PENDING |
