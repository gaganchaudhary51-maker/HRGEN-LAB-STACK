# Security Audit Lab V3.2 L99N30

## Build
- Persistent tenant/principal/token foundation
- Explicit tenant_id on assessments
- SHA-256 API token storage
- Authenticated principal identity endpoint
- 35-entry universal capability catalog
- Dashboard capability count integration
- Cross-tenant isolation and API identity regression tests

## Verification
- 57/57 tests pass
- Python compile pass
- Release gate remains fail-closed for external attestations

## Explicit boundary
The capability catalog describes authorized test surfaces; it is not a claim that all 35 domains have native autonomous scanners in this build.
