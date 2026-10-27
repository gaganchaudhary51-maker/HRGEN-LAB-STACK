# HRGen GIA LIMS v6.0.0 — L99N30 QA/QC/Break-It Final

Date: 2026-10-06

## Proof results

- 77/77 capability surface: PASS
- Primary forensic verifier: 36/36 PASS
- Cross-forensic verifier: 25/25 PASS
- QA/QC/Break-It harness: 86/86 PASS
- Final composed verifier: PASS
- Formula smoke: PASS
- HL7 smoke: PASS
- FHIR smoke: PASS
- Ed25519 license smoke: PASS

## Break-It coverage

The harness checks roadmap cardinality, phase gates, duplicate route declarations, tenant fields/RLS, catalog isolation, authentication/RBAC, sign-off/release immutability, QC provenance, calibration/reagent safety, backup/restore protections, analyzer/HL7/FHIR surfaces, portals, messaging, business modules, SSO/API/webhooks, AI/offline/voice, command palette, i18n/accessibility/theme, provider failure behavior and anti-demo/default hazards.

## Runtime limitation

The audited artifact does not contain `node_modules`; the isolated environment has no cached responses for all npm dependencies and no Docker runtime was available. Therefore live API/OQ/PQ/UAT remains target-environment work. `npm test` and Playwright execution are not claimed as PASS here; their executable tooling is present in `package.json`.

## Next plan

1. Reproducible build: add/lock `package-lock.json`, run `npm ci --omit=dev`, build Docker image.
2. Staging OQ: run authentication/RBAC, tenant isolation, CRUD/order/result, QC, sign-off, release, QR, amendment, audit and backup/restore API tests.
3. Clinical PQ: execute lab-approved reference ranges, QC golden vectors, delta/critical scenarios, report calculations and analyzer interface verification.
4. UAT/VMR: role-wise employee/pathologist/admin workflows, deviations, signatures and release decision.
5. Production gate: approved change control + VMR signatures + zero critical/P1 defects.
6. Commercial next: provider credentials, payment webhooks, real analyzer/HL7/MLLP commissioning, tenant/site deployment and observability.
