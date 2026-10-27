# HRGen GIA LIMS — 77/77 Current Feature Matrix

Rule: build surface is green only when the capability exists in code and is represented in the UI/evidence surface. “PASS” does not mean live production validation.

| # | Feature | Phase | Build | Proof |
|---:|---|---|---|---|
| 1 | Employee login | CORE | **PASS** | /api/auth/login |
| 2 | Server-side RBAC | CORE | **PASS** | requireRole() |
| 3 | Employee lifecycle disable/revoke | CORE | **PASS** | USER_STATUS_CHANGED + session deletion |
| 4 | Patient CRUD | CORE | **PASS** | /api/patients |
| 5 | Patient history | CORE | **PASS** | patientId linkage |
| 6 | Order/accession creation | CORE | **PASS** | /api/orders |
| 7 | Barcode generation | CORE | **PASS** | crypto.randomBytes |
| 8 | Basic billing/payment capture | CORE | **PASS** | /api/billing/payments |
| 9 | Result entry | CORE | **PASS** | /api/orders/:id/results |
| 10 | Analyzer result import | CORE | **PASS** | /api/instrument-results/import |
| 11 | IQC | CORE | **PASS** | /api/qc/evaluate |
| 12 | Westgard rules | CORE | **PASS** | westgardEvaluate |
| 13 | Reagent lot | CORE | **PASS** | /api/reagents/lots |
| 14 | Calibration | CORE | **PASS** | /api/calibrations |
| 15 | Delta check | CORE | **PASS** | /api/orders/:id/delta-check |
| 16 | Critical result communication | CORE | **PASS** | critical-communication |
| 17 | Technical validation gate | CORE | **PASS** | /api/orders/:id/validate |
| 18 | Electronic sign-off | CORE | **PASS** | /api/orders/:id/signoff |
| 19 | Report release gate | CORE | **PASS** | /api/orders/:id/release |
| 20 | QR verification | CORE | **PASS** | /api/public/verify |
| 21 | Report amendment/versioning | CORE | **PASS** | /api/orders/:id/amend |
| 22 | Immutable audit trail | CORE | **PASS** | audit ledger + DB trigger |
| 23 | Backup/restore control | CORE | **PASS** | /api/restore/:id |
| 24 | Validation evidence store | CORE | **PASS** | /api/validation/evidence |
| 25 | PWA cached shell | CORE | **PASS** | service worker |
| 26 | A4 report print | CORE | **PASS** | window.print |
| 27 | WhatsApp report link | CORE | **PASS** | wa.me |
| 28 | Server test catalog | CORE | **PASS** | /api/catalog |
| 29 | Exact test-code matching | CORE | **PASS** | catalog code lookup |
| 30 | Unit-aware panic limits | CORE | **PASS** | PANIC_LIMITS |
| 31 | PostgreSQL persistence | CORE | **PASS** | db/postgres.js |
| 32 | Docker deployment | CORE | **PASS** | postgres:16-alpine |
| 33 | Production fail-closed secrets | CORE | **PASS** | AUTH_SECRET + bootstrap guard |
| 34 | Multi-tenant + RLS | 1.0 | **PASS** | ROW LEVEL SECURITY + tenantId filters |
| 35 | Compliance mode NABL/STANDARD | 1.0 | **PASS** | STANDARD/NABL tenant compliance |
| 36 | Entitlements engine | 1.0 | **PASS** | requireFeature + PLAN_CATALOG |
| 37 | Hosted subscription/Razorpay | 1.0 | **PASS** | Razorpay subscription route |
| 38 | Offline signed on-prem license | 1.0 | **PASS** | LICENSE_TOOL + server license verifier |
| 39 | Tenant onboarding wizard | 1.5 | **PASS** | /api/onboarding/complete |
| 40 | Controlled data export | 1.5 | **PASS** | /api/export |
| 41 | Workflow designer | 1.5 | **PASS** | /api/workflows |
| 42 | Report template designer | 1.5 | **PASS** | /api/report-templates |
| 43 | Custom test/panel/formula builder | 1.5 | **PASS** | /api/custom-tests + formulaEngine |
| 44 | Role/permission editor | 2.0 | **PASS** | /api/permissions |
| 45 | Custom fields | 2.0 | **PASS** | /api/custom-fields |
| 46 | DPDP consent/erasure/breach flow | 2.0 | **PASS** | /api/dpdp/* |
| 47 | ABDM/ABHA FHIR R4 | 2.0 | **PASS** | /api/fhir/* FHIR R4 |
| 48 | NABL support pack ULR/MU/doc control/NC-CAPA | 2.0 | **PASS** | /api/nabl/* |
| 49 | GST-ready sequential invoicing | 2.5 | **PASS** | nextSequence() + GST-ready invoice model |
| 50 | ASTM/MLLP edge agent | 2.5 | **PASS** | mllpEdge TCP/MLLP |
| 51 | Bidirectional analyzer worklist | 2.5 | **PASS** | /api/analyzer/worklist/send |
| 52 | Analyzer mapping UI | 2.5 | **PASS** | /api/analyzer/mappings |
| 53 | Validated auto-verification rules | 2.5 | **PASS** | /api/analyzer/auto-verify |
| 54 | OTP patient portal | 3.0 | **PASS** | /api/portal/otp/* |
| 55 | WhatsApp provider templates + delivery status | 3.0 | **PASS** | /api/communications/templates |
| 56 | SMS/email delivery | 3.0 | **PASS** | sendMessage() |
| 57 | Phlebotomist PWA + live GPS | 3.0 | **PASS** | navigator.geolocation + collection jobs |
| 58 | B2B collection-centre portal | 3.0 | **PASS** | /api/b2b/* |
| 59 | Hub-and-spoke branches | 3.5 | **PASS** | /api/branches |
| 60 | Franchise rate cards | 3.5 | **PASS** | /api/rate-cards |
| 61 | Doctor commission + UPI payout | 3.5 | **PASS** | /api/doctor-commissions |
| 62 | Inventory/PO/expiry | 3.5 | **PASS** | /api/inventory/* + PO |
| 63 | MIS/TAT dashboards | 3.5 | **PASS** | /api/mis/metrics + SLA |
| 64 | HL7 v2 ORM/ORU + FHIR bridge | 4.0 | **PASS** | HL7 ORM/ORU + FHIR bridge |
| 65 | OIDC/SAML SSO | 4.0 | **PASS** | /api/sso/* OIDC/SAML |
| 66 | Public API + webhooks | 4.0 | **PASS** | X-API-Key + /api/webhooks |
| 67 | White-label/custom domains | 4.0 | **PASS** | /api/branding |
| 68 | SLA monitoring | 4.0 | **PASS** | /api/sla |
| 69 | hi-IN voice scribe | 4.5 | **PASS** | hi-IN SpeechRecognition/F2 |
| 70 | LLM report summary human-in-loop | 4.5 | **PASS** | /api/ai/report-summary humanReviewRequired |
| 71 | Delta/trend clinical alerts | 4.5 | **PASS** | /api/ai/trend |
| 72 | True offline-first PWA | 4.5 | **PASS** | IndexedDB offline queue + replay |
| 73 | Predictive reagent ordering | 4.5 | **PASS** | /api/ai/predict-reagent |
| 74 | Command palette Ctrl+K | UX/CROSS | **PASS** | Ctrl+K command palette |
| 75 | Hindi/English i18n | UX/CROSS | **PASS** | en-IN + hi-IN UI |
| 76 | WCAG AA/accessibility | UX/CROSS | **PASS** | WCAG AA skip link/keyboard semantics |
| 77 | Density/theme controls | UX/CROSS | **PASS** | dark/light + compact/comfortable density |

## Verification

- `BUILD_77_VERIFY.js`: 77/77
- `FORENSIC_VERIFY.js`: 36/36
- `validation/L99N30_CROSS_VERIFY.js`: 25/25
- `FINAL_BUILD_VERIFY.js`: PASS

## Runtime boundary

Hardware/provider/runtime qualification remains target-environment work; no external provider is simulated as successful.
