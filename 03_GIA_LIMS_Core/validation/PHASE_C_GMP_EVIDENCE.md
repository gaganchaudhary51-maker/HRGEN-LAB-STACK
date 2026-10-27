# HRGen GIA LIMS — Phase C GMP-Style Build Evidence

## Release identity
- Canonical artifact: `hrgen-gia-lims-v6.0.0-77BUILD-L99N30-QAQC-FINAL.zip`
- Phase: C — post-analytical/report integrity hardening
- Build rule: `EXISTS → KEEP / PARTIAL → COMPLETE / DUPLICATE → REMOVE / MISSING → BUILD`
- No new project filename is introduced.

## Controlled changes
1. Released reports now receive an immutable server-side report snapshot (schema v2).
2. Snapshot includes patient identity fields, examination results, QC provenance, validation, pathologist sign-off, release timestamp and report version.
3. Release integrity uses HMAC-SHA256 over the stored snapshot.
4. Public/API verification fails closed when the stored hash does not match the snapshot.
5. Added authenticated report-integrity endpoint.
6. Report UI exposes integrity verification, version history and QR verification.
7. Amendment workflow now requires a documented reason of at least 5 characters.
8. Amendment tests are bounded, duplicate-free, and must exactly match the tenant test catalog.
9. Amendment creates a new order/version and leaves the released source order immutable.
10. Amendment provenance records tenant, parent report, previous hash, reason, actor and timestamp.

## Break / leak controls
- Post-release result mutation remains blocked.
- Post-release delta mutation remains blocked.
- Post-release critical-communication mutation remains blocked.
- Released report verification is server-side; no client-generated report hash is trusted.
- Patient/report browser persistence remains prohibited.
- Tenant scoping remains enforced on order, patient and report-version access.
- No accreditation/certification claim was introduced.

## Verification evidence
- Phase C verifier: **34/34 PASS**
- Phase C mutation tests: **8/8 mutations killed**
- Phase B deterministic fuzz: **50,000/50,000 PASS**
- 77-feature regression: **77/77 PASS**
- Primary forensic regression: **36/36 PASS**
- Cross-forensic regression: **25/25 PASS**
- QA/QC break-it regression: **86/86 PASS**
- Phase B verifier: **65/65 PASS**
- JS syntax checks: **PASS**
- HTML parser / duplicate-ID check: **PASS**

## Runtime boundary
Package/runtime dependency installation was attempted but timed out in the execution environment. Therefore this evidence does **not** claim live PostgreSQL OQ/PQ/UAT, external analyzer connectivity, provider delivery, or production deployment validation.

## GMP boundary
This is software engineering validation evidence structured for GMP-style traceability and controlled release review. It is **not** a claim of GMP certification, NABL accreditation, ISO certification, CAP accreditation, or regulatory approval.
