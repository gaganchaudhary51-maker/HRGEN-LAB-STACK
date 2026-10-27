# DEEP A-TO-Z FORENSIC GAP ANALYSIS & ARCHITECTURAL DISPARITY AUDIT
## Authoritative Forensic Comparison: Live Hardened Workspace (C:) vs. Portable Production Vault (D:)

**Target Systems**:
- **Live Hardened Production Workspace (C:)**: `C:\Users\pc\Desktop\HRGEN GIA LIMS`
- **Portable Distribution Vault (D:)**: `D:\HRGen LIMS` (Specifically `HRGENLIMS\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026` & `HRGENLIMS\HRGen-GIA-LIMS-FULL-PRODUCT-L99N30-LEVEL4A`)
**Document Identifier**: `LIMS-FORENSIC-ATOZ-C-VS-D-20261016`  
**Security & Compliance Level**: L99N100XN30 / ISO 15189 / 21 CFR Part 11 / GAMP 5 Category 4  
**Date of Audit**: October 16, 2026  
**Status**: Authoritative Reference Document (Synthesized M1 Surface, Clinical & Database/AI Forensics)  

---

## Table of Contents
1. [Executive Summary & Forensic Verdict](#1-executive-summary--forensic-verdict)
   - 1.1 Executive Overview
   - 1.2 Definitive Forensic Verdict: Golden Master vs. Unhardened Distribution
   - 1.3 High-Level Architectural Comparison Scorecard
2. [Forensic Comparison Matrix (R1 Acceptance Criteria)](#2-forensic-comparison-matrix-r1-acceptance-criteria)
   - 2.1 Full File Inventory, Exact Byte Counts & Cryptographic Hashes
     - 2.1.1 Mismatched Files Between C: and D: (10 Files)
     - 2.1.2 Files Unique to Portable Vault (23 Files)
     - 2.1.3 100% Identical Core Files (12 Files)
     - 2.1.4 Hardened Infrastructure Files Unique to Live Workspace (C:)
   - 2.2 Frontend App Shell Microscopic Diff (`public/index.html`)
     - 2.2.1 Quantitative Structural Metrics (121 KB vs. 254 KB)
     - 2.2.2 CSS Styling & High-Contrast Design System
     - 2.2.3 Desktop-Grade Universal History Navigation Stack (`viewHistory`, `viewFuture`, Scroll Memory)
     - 2.2.4 Header Breadcrumb Trail (`#breadcrumbTrail`), Tooltips & Physical Keyboard Shortcuts
     - 2.2.5 View-by-View Character Expansion & Functional Density Matrix
     - 2.2.6 Missing PWA & Desktop Icon Assets (Live 404 Defect vs. Vault Integrity)
     - 2.2.7 Client-Side Clinical Gate Disparities & Batch Validation Vulnerabilities
   - 2.3 Backend API & Route Surface Microscopic Diff
     - 2.3.1 Route Handler Inventory & Architecture (`server/platformRoutes.js` & `server.js`)
     - 2.3.2 Route Diffs in `server/platformRoutes.js` (90 KB vs. 178 KB)
     - 2.3.3 Route Diffs in `server.js` (82.2 KB vs. 82.4 KB)
     - 2.3.4 Forensic Audit of the 15 Copilot Chat Intents (Admin vs. Backdoors)
     - 2.3.5 Supplementary Service Engines (`clinicalInterpretation.js`, `astm.js` buffer guard, `resultNormalization.js`)
   - 2.4 Native Windows Shell, Launchers & Packaging Audit
     - 2.4.1 Native Desktop Executable Architecture (`bin/HRGen-GIA-LIMS.exe`, C# .NET 8 WebView2)
     - 2.4.2 Process Supervision Lifecycle & Fallback Path Caveat
     - 2.4.3 Batch Launchers & Operational Scripts (`START_LIMS.bat`, `ACTIVATE_LICENSE.bat`, `README_INSTALL.txt`)
   - 2.5 Licensing & Cryptography Deep Comparison
     - 2.5.1 Ed25519 Implementation Diff (`LICENSE_TOOL.js` 1 KB Stub vs. 4.4 KB Verifier)
     - 2.5.2 Empirical Cryptographic Verification Evidence
3. [Clinical Safety, PostgreSQL RLS & AI Disparity Audit (R2 Acceptance Criteria)](#3-clinical-safety-postgresql-rls--ai-disparity-audit-r2-acceptance-criteria)
   - 3.1 Pre-Analytical Specimen Gate Enforcement (`specimenStatus === 'ACCEPTED'`)
     - 3.1.1 Result Entry Gate (`PUT /api/orders/:id/results`)
     - 3.1.2 Final Report Release Gate (`POST /api/orders/:id/release`)
     - 3.1.3 Specimen Acceptance & Rejection Workflow
   - 3.2 Analyzer Ingestion, 1:1 Matching & Test Set Integrity
     - 3.2.1 Direct Ingestion Route (`POST /api/instrument-results/import`)
     - 3.2.2 Destructive Mutation in D: vs. Metadata Preservation in C:
     - 3.2.3 Simulator Route in Production (`POST /api/integrations/simulate-analyzer`)
     - 3.2.4 ASTM TCP Edge Buffer Resilience Guard
   - 3.3 Westgard 6-Rule Engine & IQC Validation
     - 3.3.1 Engine Core Verification (`server/services/westgard.js`)
     - 3.3.2 Order QC Approval Gate (`POST /api/qc/approve/:orderId`)
   - 3.4 Panic Value Communication & Pathologist Re-Authentication
     - 3.4.1 Panic Communication Dual Witness & Bcrypt Authentication
     - 3.4.2 Pathologist Sign-Off Credential Verification
   - 3.5 Backdoors & Malpractice Vectors in Vault (D:)
     - 3.5.1 Copilot Intent 0.11: Fake Result Auto-Fill Injection
     - 3.5.2 Copilot Intent 0.12: Fabricated Westgard IQC PASS
     - 3.5.3 Copilot Intent 0.13: Forged Pathologist Electronic Signature
     - 3.5.4 Copilot Intent 0.14: Unverified Report Release Backdoor
     - 3.5.5 Batch Normal Validation Bypass (`POST /api/orders/batch-validate-normal`)
     - 3.5.6 Fast-Draft Results Route (`POST /api/orders/:id/fast-draft-results`)
   - 3.6 PostgreSQL Multi-Tenant Row-Level Security (RLS) Audit
     - 3.6.1 Least-Privilege Role Separation (`hrgen_app` vs. `hrgen_migrator`)
     - 3.6.2 Startup Role Privilege Self-Audit (`assertRuntimeRole()`)
     - 3.6.3 Single-Writer Advisory Lock Lease (`pg_try_advisory_lock`)
     - 3.6.4 FORCE ROW LEVEL SECURITY Scope (19 Tables in C: vs. 16 in D:)
     - 3.6.5 Scoped Tenant Context Execution (`app.tenant_id`)
     - 3.6.6 Elimination of Standalone Mock in C: vs. Volatile Risk in D:
     - 3.6.7 SQL Migration Architecture (`20261015_tenant_rls_hardening.sql`)
   - 3.7 Gemini AI Integration & Sandboxing Audit
     - 3.7.1 Official `@google/genai` (v2.30.0) SDK vs. Deprecated Fetch
     - 3.7.2 Deterministic Structured Output via `responseJsonSchema`
     - 3.7.3 API Key Security & Query String Leak Prevention
     - 3.7.4 Bilingual Voice Dictation Draft Engine
     - 3.7.5 Non-Clinical Medical Disclaimer & Gate Check Middleware (`/clinical-gate-check`)
4. [Actionable Gap Matrix & Merging Roadmap (R3 Acceptance Criteria)](#4-actionable-gap-matrix--merging-roadmap-r3-acceptance-criteria)
   - 4.1 Side-by-Side Comprehensive Feature Inventory (Unique to C: vs. Unique to D:)
   - 4.2 Comprehensive Risk Analysis Matrix (Extreme/Forbidden, High, Medium, Low)
   - 4.3 Step-by-Step Non-Destructive Consolidation & Migration Roadmap
     - Phase 1: Safe Binaries, Desktop Shell & PWA Asset Consolidation
     - Phase 2: Sanitized UI Shell & Safe Administrative Route Porting
     - Phase 3: Gemini AI SDK Harmonization & ASTM TCP Hardening
     - Phase 4: Clinical Invariant & PostgreSQL RLS Preservation (Strict Prohibition of Overwrites)
     - Phase 5: Comprehensive Automated Regression Verification
5. [Independent Verification Commands & Evidence Runbook](#5-independent-verification-commands--evidence-runbook)
   - 5.1 Cryptographic Hash & File Size Verification
   - 5.2 Clinical Safety Gate Verification (`CLINICAL_GATE_FIX_VERIFY.js`)
   - 5.3 PostgreSQL Multi-Tenant RLS Verification (`TENANT_RLS_STATIC_VERIFY.js` & Integration Suite)
   - 5.4 Gemini AI Sandboxing Verification (`GEMINI_SANDBOX_VERIFY.js`)
   - 5.5 Ed25519 Cryptographic License Verification
   - 5.6 Automated E2E and Test Suite Execution Commands

---

## 1. Executive Summary & Forensic Verdict

### 1.1 Executive Overview
A microscopic, line-by-line, byte-by-byte forensic audit was conducted across the Live hardened workspace on Drive `C:` (`C:\Users\pc\Desktop\HRGEN GIA LIMS`) and the reference Distribution Vault on Drive `D:` (`D:\HRGen LIMS\HRGENLIMS\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026` and its parent distribution `HRGen-GIA-LIMS-FULL-PRODUCT-L99N30-LEVEL4A`).

The investigation utilized three dedicated domain-specialist exploration engines covering:
1. **Surface Diff & Topography** (File trees, SHA-256 digests, frontend DOM/AST, routes, native wrappers, licensing).
2. **Clinical Safety & Quality Gates** (Pre-analytical gates, analyzer matching, Westgard IQC, panic re-auth, backdoors).
3. **Database Architecture & AI Integration** (PostgreSQL 18 RLS, role separation, advisory locks, `@google/genai` SDK).

### 1.2 Definitive Forensic Verdict: Golden Master vs. Unhardened Distribution
The forensic investigation establishes the following definitive classification:

1. **Live Workspace (`C:\Users\pc\Desktop\HRGEN GIA LIMS`) is the GOLDEN MASTER for Clinical Safety, PostgreSQL Multi-Tenant Isolation, and AI Compliance:**
   - It enforces fail-closed pre-analytical gates (`specimenStatus === 'ACCEPTED'`) on result entry, analyzer imports, simulator feeds, and final report release.
   - It guarantees analyzer test set integrity via strict 1:1 code matching and marks imported results as `'UNREVIEWED'`.
   - It enforces dual-witness bcrypt re-authentication on panic/critical communication and pathologist electronic sign-off.
   - It enforces verified PostgreSQL 18 Row-Level Security (`FORCE ROW LEVEL SECURITY`) across 19 tenant tables with least-privilege `hrgen_app` database roles, startup privilege verification (`assertRuntimeRole()`), and single-writer advisory lock leases (`pg_try_advisory_lock`).
   - It isolates AI capabilities into a non-clinical sandbox using the official `@google/genai` (v2.30.0) SDK with strict schema constraints (`responseJsonSchema`), bilingual speech parsing, and HTTP 403 clinical action firewalls.
   - It contains an exhaustive 1,127-line Playwright browser E2E test suite (`tests/e2e.spec.js`) and complete automated verification runners.
   - **Vulnerabilities in Live (C:)**: It contains a minified/truncated frontend app shell (`public/index.html` at 121 KB), lacks browser history/breadcrumb navigation, lacks native Windows wrappers (`bin/`), lacks turnkey launchers (`START_LIMS.bat`), is missing 6 PWA/desktop icons (producing browser 404 errors), and has a stubbed `LICENSE_TOOL.js` that cannot verify licenses.

2. **Portable Distribution Vault (`D:\...\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026`) is an UNHARDENED Build Possessing Advanced UI/UX, Native Packaging, and Turnkey Assets, but Riddled with 4 Severe Clinical Backdoors and Missing Database Hardening:**
   - It contains a rich, 254 KB clinical SPA (`public/index.html`) with complete universal history navigation (`viewHistory`/`viewFuture`), breadcrumb trails (`#breadcrumbTrail`), physical keyboard shortcuts (`Alt+Left`, `Escape`, `Backspace`), high-contrast styling, real-time workload sparklines, center KYC onboarding views, ISO 15189 diagnostic interpretations, and staff password management.
   - It contains a compiled Microsoft Edge WebView2 C# .NET 8 native desktop shell (`bin/HRGen-GIA-LIMS.exe`), turnkey batch launchers (`START_LIMS.bat`, `ACTIVATE_LICENSE.bat`), full Ed25519 cryptographic license verification, and 178 KB platform routes with 30 legitimate administrative intents.
   - It contains superior network buffering in `server/integrations/astm.js` (`maxBufferBytes = 1048576`, socket state checks) and sub-parameter preservation in `server/services/resultNormalization.js`.
   - **CATASTROPHIC CLINICAL & SECURITY DEFECTS IN VAULT (D:)**:
     - **Zero Pre-Analytical Gate**: Reverts `CLINICAL_GATE_FIX_VERIFY.js` from 17/17 PASS to 0/17 PASS (100% failure).
     - **Destructive Analyzer Overwrite**: Overwrites `o.tests` with incoming objects, destroying accession test set integrity and deleting unmeasured panel tests.
     - **Four Autonomous AI Copilot Backdoors**:
       * *Intent 0.11*: Automatically injects hardcoded fake benchmark results (HB: 14.2, TLC: 7400, FBS: 92, etc.) into real patient orders upon voice/text command without physical testing.
       * *Intent 0.12*: Fabricates artificial Westgard IQC PASS runs out of thin air and mass-marks all tenant orders as `qcPassed = true`.
       * *Intent 0.13*: Forges the electronic signature and MCI registration of an MD Pathologist (`Dr. Rajesh Sharma, MD (Path) [MCI-34821]`) with zero authentication.
       * *Intent 0.14*: Releases final patient diagnostic reports with tamper-evident HMAC seals without requiring pre-analytical acceptance or clinical validation.
     - **Batch Validation Bypass**: Exposes an unvalidated `POST /api/orders/batch-validate-normal` route wired to a green bypass button in the UI.
     - **Database Multi-Tenancy Failure**: Runs as database owner/superuser, omits 3 critical tables (`sequence_counters`, `api_keys`, `refresh_tokens`) from RLS, lacks `assertRuntimeRole()`, lacks advisory lock leases, never sets `app.tenant_id` context, and relies on a volatile in-memory fallback (`StandaloneClient`) that silently masks database outages.
     - **Gemini Key Leakage**: Uses legacy raw HTTP fetch to `v1beta` and leaks the API key in URL query parameters.

```
========================================================================================================================
                                     DEFINITIVE SYSTEM CLASSIFICATION VERDICT
========================================================================================================================
 Domain / Pillar                     Live Hardened (C:)                   Distribution Vault (D:)
------------------------------------------------------------------------------------------------------------------------
 Clinical Safety & Gates             GOLDEN MASTER (Fail-Closed)          UNACCEPTABLE (4 Backdoors + 0/12 Gates)
 PostgreSQL Multi-Tenant RLS         GOLDEN MASTER (Least Privilege)      UNACCEPTABLE (Superuser / 3 Omissions)
 Gemini AI Integration               GOLDEN MASTER (SDK + Sandbox)        VULNERABLE (Legacy Fetch / Key Leak)
 Automated Testing & E2E             GOLDEN MASTER (1,127-line Suite)     MINIMAL (9-line smoke stub)
 Frontend UI/UX Shell                TRUNCATED (121 KB, No History)       GOLDEN MASTER (254 KB Rich Clinical SPA)
 Windows Desktop Shell & Launchers   ABSENT (No bin/ or .bat)             GOLDEN MASTER (WebView2 .NET 8 + Batch)
 PWA & Desktop Icon Assets           BROKEN (404 Not Found on 6 Icons)    GOLDEN MASTER (All 6 Icons Verified)
 Ed25519 Offline Licensing Tool      STUBBED (1 KB, No verify command)    GOLDEN MASTER (4.4 KB Complete Verifier)
 ASTM TCP Network Resilience         STANDARD                             HARDENED (1 MB Buffer Guard + Writable)
========================================================================================================================
 CONSOLIDATION MANDATE: 
 Preserve C: as the immutable golden master for Clinical Gates, PostgreSQL RLS, and Gemini SDK.
 Surgically port Vault (D:) UI shell, desktop wrapper, launchers, licensing, and clean routes into C:
 after purging the 4 backdoors, removing batch validation bypasses, and injecting clinical gate invariants.
========================================================================================================================
```

---

## 2. Forensic Comparison Matrix (R1 Acceptance Criteria)

### 2.1 Full File Inventory, Exact Byte Counts & Cryptographic Hashes
All files across both repositories were indexed, measured for exact byte length, counted for line count, and digested using **SHA-256**.

#### Summary of Repository File Counts:
- **Live Workspace (C:)**: 171 tracked files (excluding `node_modules`, `.agents`, `.tmp_postgres_live`, `.git`).
- **Portable Distribution Vault (D1:)**: 45 tracked files.
- **Full Product Distribution (D2:)**: 2,427 tracked files (includes 2,204 pre-generated test accession data records in `data/`, 23 C# project files in `desktop/`, and 106 validation scripts/reports).

---

#### 2.1.1 Mismatched Files Between C: and D: (10 Files)
There are exactly **10 modified files** between Live (`C:\Users\pc\Desktop\HRGEN GIA LIMS`) and Portable Vault (`D:\...\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026`). Every byte difference has been accounted for:

| # | Relative Path | Live (C:) Bytes | Vault (D:) Bytes | Live Lines | Vault Lines | Live SHA-256 Digest | Vault SHA-256 Digest | Bitwise Nature of Disparity |
|---|---------------|-----------------|------------------|------------|-------------|---------------------|----------------------|-----------------------------|
| 1 | `.env` | 753 | 1,007 | 21 | 33 | `a8cd32b812585e91a751cea8a8f27bee0461506276db8c310a0bffde3054c12e` | `0a9887fa62db42be9341d68cea738bba9a265abb5c9abc2371716d8650e4a272` | D: contains production defaults, license seeds, and desktop port bindings. |
| 2 | `db/postgres.js` | 34,823 | 35,045 | 258 | 294 | `7a9bf1499a42ef35af1e9ee62e673ad1ef23262595fffa40ec132e29f484c66f` | `4d95d372ad4ce1e2fb0799c25e7129813fbddc45ce2b5c990c0cadf644b2814d` | C: has 19 tables RLS, `assertRuntimeRole()`, advisory lock lease; D: has 16 tables, StandaloneClient mock. |
| 3 | `LICENSE_TOOL.js` | 1,091 | 4,463 | 11 | 103 | `bb1951bb1e34c78964a9b8a713ea0917ac4a0425cde1d9bc5bc512fadde3236d` | `e70e5b9cda6fcb4d4ec8ba72c99a24b7ce79dc9fc63255645434e41222996647` | C: is a 10-line stub lacking `verify`; D: is a full 102-line Ed25519 verification CLI with exit code signaling. |
| 4 | `package.json` | 2,173 | 1,762 | 48 | 43 | `6aa8d6df38e47c23fd5207e121b28f7bd715cbc7775d848f7a127874e741fd53` | `40a4d2fd028d51327624c16c7de3ba1b7aaffca6ab63d729dd0c830bf9961379` | C: includes `@google/genai` (v2.30.0), Playwright, Vitest; D: lacks official SDK and browser test harness. |
| 5 | `public/index.html` | 121,206 | 254,806 | 262 | 3,221 | `0c47900eeea578968043a8be48c7db8531f8ea08f065c60ac6bfb55ed4e38345` | `12fb31465244b078920ecfb7c7302bd1447b9e1f58e9661da2fccc6241d66997` | C: minified/truncated, missing navigation/views; D: rich clinical SPA, universal history, breadcrumbs. |
| 6 | `server/integrations/astm.js` | 3,020 | 3,258 | 41 | 43 | `deb121d5b982df235cb90f758249f2e624b2b6121c0cfc01d6c1a7bc41dd48ae` | `bcc6e9d6e9d03b56f6ed15436478aa78839c880807b0c004c3055c4f4908a553` | D: implements 1 MB buffer limit (`maxBufferBytes`) and `socket.writable` network guards. |
| 7 | `server/platformRoutes.js` | 90,472 | 178,821 | 578 | 1,934 | `e6b212b9ac48e4f9e0e92b2c955ac843665947eeb494f7fc57ab79a3cba84c6e` | `1c4b2255e2f150ca8f415b41d3f4a08af85f217b26801d6e4f237c5a7f956c6f` | D: adds 1,356 lines containing 15 copilot intents, KYC, license, and interpretation endpoints. |
| 8 | `server/services/geminiCopilot.js` | 13,901 | 8,412 | 318 | 192 | `71ec820def08d14ebf6c191cd5056d9ed685140ce3c524d0dd6663bbcf0154e5` | `5b801a7d2c9c3a12f6d0808a993426523253d3f7976b5f67e5442b4bb70a214d` | C: uses `@google/genai` v2.30.0 with `responseJsonSchema` and dictation draft; D: legacy HTTP fetch. |
| 9 | `server/services/resultNormalization.js` | 1,443 | 1,825 | 44 | 46 | `22ca4f3df961c905a8bfb2e1adb23aabae2b0aa793c602c1ddf48c2ed0f876ad` | `8ede72ec63a845b85c8d621b033476ff740391f0b33b86aa04f950d6d2c6b8fa` | D: preserves nested `subParameters` for multi-analyte panels (CBC differentials, LFT enzymes). |
| 10 | `server.js` | 82,211 | 82,454 | 1,093 | 1,097 | `254ce4e16b9a2e9170bcc156c4f0e11884e666207cce0bca4dec8f0922383414` | `a157dcce4c02b28467f28bdc96dc6d41f0328e1e3b4f134986e558092a50ac7f` | C: fail-closed gates, role checks, advisory lock; D: adds 4 administrative routes (`/api/audit`, etc.). |

---

#### 2.1.2 Files Unique to Portable Vault (23 Files)
The following **23 files** exist exclusively in Portable Vault (`D:\...\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026`) and are completely absent from Live (C:):

| # | Relative Path | Bytes | Lines | SHA-256 Cryptographic Hash | Architectural Role & Functional Description |
|---|---------------|-------|-------|----------------------------|---------------------------------------------|
| 1 | `.env.production` | 1,007 | 33 | `0a9887fa62db42be9341d68cea738bba9a265abb5c9abc2371716d8650e4a272` | Production defaults template copied by `START_LIMS.bat` on initial startup. |
| 2 | `ACTIVATE_LICENSE.bat` | 1,060 | 37 | `8e43396ef4cfe591a995ff2c859dc9e0672d7308edd2a1cdc7ac09add1736d08` | 1-click Windows batch script verifying offline Ed25519 cryptographic license. |
| 3 | `bin/HRGen-GIA-LIMS.deps.json` | 2,838 | 94 | `89dc03eee16b11d8e10f6e75d80340d198fe66dfc930cc41502d29f7eea0fba2` | Microsoft .NET 8 dependency and assembly resolution manifest. |
| 4 | `bin/HRGen-GIA-LIMS.dll` | 19,456 | Binary | `583ff55ef235857cf4f4db1d70792389c697f34cc1beb3bbd8a1cbfd16320408` | Compiled .NET 8 desktop application managed assembly. |
| 5 | `bin/HRGen-GIA-LIMS.exe` | 160,256 | Binary | `5bcf45fb5c8c03e739e6e3e2a5f8a021f97087f2b0db0ba77ef2bf3839c6b25d` | Microsoft Edge WebView2 C# .NET 8 native desktop shell executable. |
| 6 | `bin/HRGen-GIA-LIMS.runtimeconfig.json` | 458 | 19 | `c71152bf25e40d647b2440c5b39be157a3d356106be9d5b678ab97bb87b4e782` | .NET 8 runtime options configuring Windows Desktop framework targeting. |
| 7 | `bin/Microsoft.Web.WebView2.Core.dll` | 698,208 | Binary | `d60e6e94245078cb56e44ebd5f360dc04bf18e460136be93bfc4cfca43b98505` | Microsoft Edge WebView2 Core managed interop assembly (v1.0.4258.31). |
| 8 | `bin/Microsoft.Web.WebView2.WinForms.dll` | 39,264 | Binary | `84b5772260dbdfe95591197edc9315dcd2cc86ad610e4b14ddd5e4291e31a381` | Microsoft Edge WebView2 Windows Forms container integration component. |
| 9 | `bin/Microsoft.Web.WebView2.Wpf.dll` | 87,392 | Binary | `4cbabd120344cc47f313f168fb86022d8f7423e09adff43da643e0e88570fa0c` | Microsoft Edge WebView2 WPF managed interop component. |
| 10 | `bin/runtimes/win-arm64/native/WebView2Loader.dll` | 180,064 | Binary | `4f48cb32d34298c86cca2108057eea0d900b5e422575e926e8086318a0b9cbf0` | Native Windows ARM64 loader for Microsoft Edge WebView2 runtime. |
| 11 | `bin/runtimes/win-x64/native/WebView2Loader.dll` | 194,912 | Binary | `3426dcc55fdfb8b5e7ac623cf33b4ccf283fbf68a0c5a65bddfdb4d749a8abee` | Native Windows x64 loader for Microsoft Edge WebView2 runtime. |
| 12 | `bin/runtimes/win-x86/native/WebView2Loader.dll` | 155,488 | Binary | `87c61e2cae380112c60853e28178b8ea9a0d63739fc03cead680d4ad3fde6b7d` | Native Windows x86 loader for Microsoft Edge WebView2 runtime. |
| 13 | `license.json` | 504 | 17 | `44233bc3b072a739709e7fdf366f511c74d571611481defd4f2f4081c967022f` | Active offline Ed25519 cryptographic license file (Perpetual Enterprise). |
| 14 | `license-public.pem` | 113 | 4 | `338fb8e355645eb9552d84df21392121816f5fb08d5025d6121fbdf779eaa0ac` | Ed25519 SPKI public key for validating offline license signatures. |
| 15 | `public/app-icon.ico` | 8,597 | Binary | `0717921e17945fa69e07bc20067114bfa49b07394235514f91ce4dbe53123731` | Windows multi-resolution desktop icon embedded in WebView2 window frame. |
| 16 | `public/favicon.ico` | 8,597 | Binary | `0717921e17945fa69e07bc20067114bfa49b07394235514f91ce4dbe53123731` | Browser tab favicon (Missing in Live, causing browser 404 errors!). |
| 17 | `public/icon-192.png` | 5,790 | Binary | `34e2e24b684ca6d1e76e9bbeafee2a63c234fec39938f1d721d9652d0481694a` | Standard 192x192 PWA application icon referenced in `manifest.json`. |
| 18 | `public/icon-192-maskable.png` | 5,790 | Binary | `34e2e24b684ca6d1e76e9bbeafee2a63c234fec39938f1d721d9652d0481694a` | Adaptive maskable 192x192 PWA icon for modern Android/Windows shells. |
| 19 | `public/icon-512.png` | 16,730 | Binary | `5e8adddde8c2bd89bb034bcaf43193e8aa411e2b503a1cb51e9e2731ca244b8e` | High-resolution 512x512 PWA splash and installation badge icon. |
| 20 | `public/icon-512-maskable.png` | 16,730 | Binary | `5e8adddde8c2bd89bb034bcaf43193e8aa411e2b503a1cb51e9e2731ca244b8e` | Adaptive maskable 512x512 PWA splash icon referenced in `manifest.json`. |
| 21 | `README_INSTALL.txt` | 1,411 | 33 | `f6b5a170d0cf4e88ff97d21415e4561984a484b62b09afa6727ef00cd8a033a1` | 3-step air-gapped turnkey deployment instructions for clinical staff. |
| 22 | `server/services/clinicalInterpretation.js` | 8,211 | 148 | `4fa1e9dd0e6d5eebaa18d7bec683d0d2d8f8dd9cc23d8b760b761a0550ba9db0` | ISO 15189 diagnostic reference interpretation library (Widal, Dengue, HbA1c, etc.). |
| 23 | `START_LIMS.bat` | 738 | 23 | `85a95229ba72c05b5b45806ee5a4ee7e51d605529fd36e8d1cd1bc884e4b8f2a` | Turnkey application boot launcher orchestrating Node.js and WebView2 desktop shell. |

---

#### 2.1.3 100% Identical Core Files (12 Files)
These **12 files** share identical cryptographic SHA-256 digests across both repositories:

1. `public/manifest.json` (`2,111 bytes`, SHA-256: `3794a19e1d8854627deb926b2be6cf8a0f4b9776b8b50650a0ea570bd086e3e6`)
2. `public/sw.js` (`3,171 bytes`, SHA-256: `470b943a6bf417ae85870e410c3023ec1925da76a8a8c06ec5a0255ebfab9cd4`)
3. `server/featureRegistry.js` (`3,069 bytes`, SHA-256: `00346ac4159ff27e7351d528e3ca4a49e9a5be991abc9247ffdd5714d8d87cca`)
4. `server/integrations/hl7.js` (`2,089 bytes`, SHA-256: `408f40ad4c5b20562c7a71e461bfb24157b64e8ef679d957746dcc5980fc6303`)
5. `server/integrations/mllpEdge.js` (`1,725 bytes`, SHA-256: `785ff9885b566d27cc38d74a3c5b4f6086debf1ef3fd1691fc6063a4bdc447d4`)
6. `server/services/cryptoEngine.js` (`3,564 bytes`, SHA-256: `2ba2164b01540cb38bc0a8361c914b0082d1adb93c2cfe4ab117708d1836170a`)
7. `server/services/fhir.js` (`1,268 bytes`, SHA-256: `79b1de87a5077ca177d341af464b3660d27c340de788dfd2fe9abc5936e45194`)
8. `server/services/formulaEngine.js` (`6,860 bytes`, SHA-256: `c059dd29b2431307791b4381f1abc9ddfb49394fd803b8471dbb04c6d8b648f8`)
9. `server/services/integrations.js` (`2,085 bytes`, SHA-256: `c18348a4b8c0fbd4a6c90eee4887e9b1c0c2f8bf83204075190db62c8cad3d27`)
10. `server/services/opdService.js` (`6,410 bytes`, SHA-256: `88f8d1bd410851477a14d7468febdddff69e2f0d9f5a4ea97bb1cefc4673ec4f`)
11. `server/services/westgard.js` (`3,155 bytes`, SHA-256: `80bb4c8fd1c3706863af584d37d77b55501f0710ca1f92fe1be2749938aa8426`)
12. `server/services/whatsappBot.js` (`5,346 bytes`, SHA-256: `a2046ae50a8a6f80543744811f66040c105be33fa8f8b703fd1e91e89f21a73c`)

---

#### 2.1.4 Hardened Infrastructure Files Unique to Live Workspace (C:)
The Live workspace (`C:`) possesses essential clinical safety, database isolation, and automated testing infrastructure completely missing from Vault (`D:`):
1. `db/migrations/20261015_tenant_rls_hardening.sql` (`1,536 bytes`, SHA-256: `4bfb2701340ddaf1e1f771f323afead5d31fc70fc958a32c026759cecc30d5d8`): Enforces table ownership transfer to `hrgen_migrator` and least privilege grants to `hrgen_app`.
2. `docker/postgres-init/10-roles.sh` (`792 bytes`, SHA-256: `fe442b41921b9dfe01ff50bc21ba48db1c085685ec78cfe543d521f5f7653cf6`): Automated container provisioning of segregated PostgreSQL roles.
3. `tests/e2e.spec.js` (`53,749 bytes`, 1,127 lines, SHA-256: `2f34f4888b99559829c6e9e4b9e2f901740f70c05b1b64ad2060d648f692a04f`): Comprehensive Playwright end-to-end browser qualification test harness covering login to final report release.
4. `tests/e2e/testServer.js` (`35,704 bytes`, SHA-256: `a93391121106fb5141165db9d8c44651aa7cc3eaef2fb1921e7417672d63dc7e`): Isolated in-process test server lifecycle harness.
5. Verification Suites:
   - `validation/CLINICAL_GATE_FIX_VERIFY.js`: 17-assertion fail-closed clinical gate verifier (17/17 PASS).
   - `validation/GEMINI_SANDBOX_VERIFY.js`: 7-rule non-clinical AI boundary verifier.
   - `validation/POSTGRES_RLS_INTEGRATION_TEST.js`: Synthetic 2-tenant PostgreSQL isolation harness.
   - `validation/TENANT_RLS_STATIC_VERIFY.js`: 21-rule static SQL and policy verifier.
   - `validation/RUN_LIVE_POSTGRES_RLS_SUITE.js`: Multi-tenant live execution test runner.
   - `validation/L99N100XN30_UI_ANALYZER_VERIFY.js`: UI analyzer and clinical workflow verifier.

---

### 2.2 Frontend App Shell Microscopic Diff (`public/index.html`)

#### 2.2.1 Quantitative Structural Metrics (121 KB vs. 254 KB)
A character-level AST and DOM audit demonstrates that Vault (`D:`) contains more than double the code payload of Live (`C:`):

| Structural Metric | Live Workspace (C:) | Portable Vault (D:) | Absolute Delta | Percentage Delta |
|:---|:---:|:---:|:---:|:---:|
| **File Size (Bytes)** | 121,206 B | 254,806 B | +133,600 B | **+110.2%** |
| **Total Lines** | 261 lines | 3,220 lines | +2,959 lines | +1,133.7% (Unminified) |
| **Cryptographic Digest (SHA-256)** | `0c47900eeea57896...` | `12fb31465244b078...` | Divergent | Non-identical build |
| **CSS Stylesheet Size (Chars)** | 11,783 chars | 12,906 chars | +1,123 chars | +9.5% |
| **JavaScript Logic Size (Chars)** | 108,438 chars | 236,306 chars | +127,868 chars | **+117.9%** |
| **Declared Function Count** | 84 functions | 123 functions | +39 functions | +46.4% |
| **Defined UI Views (`views.*`)** | 24 views | 27 views | +3 primary views | +12.5% |

---

#### 2.2.2 CSS Styling & High-Contrast Design System
Vault contains an expanded CSS framework engineered specifically for clinical readability and accessibility:
- **High-Contrast Theme**: Vault introduces high-contrast CSS overrides (`body.theme-high-contrast`) enhancing borders to `#ffffff`, backgrounds to pure `#000000`, and contrast ratios to exceed WCAG AAA standards (7:1).
- **Sticky Application Shell**: Modern flex-column viewport architecture (`height: 100vh; overflow: hidden`) with dedicated scrolling main viewport (`#mainContent { overflow-y: auto; flex: 1; }`).
- **Telemetry Sparkline Styling**: Specific CSS classes for micro-charts and TAT distribution bars (`.sparkline-bar`, `.tat-badge-green`, `.tat-badge-red`).

---

#### 2.2.3 Desktop-Grade Universal History Navigation Stack (`viewHistory`, `viewFuture`, Scroll Memory)
Vault implements an enterprise navigation engine that is **completely non-existent in Live**:
1. **History Stacks**:
   ```javascript
   window.viewHistory = [];
   window.viewFuture = [];
   window._viewScrollPositions = {};
   ```
2. **Deterministic Navigation Functions**:
   - `goBack()`: Pops previous view from `window.viewHistory`, pushes current view to `window.viewFuture`, and invokes `show(prev, true)`.
   - `goForward()`: Pops next view from `window.viewFuture`, pushes current view to `window.viewHistory`, and invokes `show(next, true)`.
3. **Scroll Position Preservation**:
   - In `show(v, isNavAction)`: When navigating away from a view, it captures `window.scrollY` into `window._viewScrollPositions[S.view]`.
   - When returning to a view, it restores the exact scroll position:
     ```javascript
     const savedScroll = window._viewScrollPositions[v] || 0;
     window.scrollTo({ top: savedScroll, behavior: 'instant' });
     ```
4. **HTML5 History API Integration**:
   - Executes `history.pushState({ view: v }, '', '#' + v)`.
   - Listens to browser events: `window.addEventListener('popstate', e => { if (e.state?.view) show(e.state.view, true); });`.

---

#### 2.2.4 Header Breadcrumb Trail (`#breadcrumbTrail`), Tooltips & Physical Keyboard Shortcuts
- **Dynamic Breadcrumbs**: Top navigation bar features dedicated `← Back` and `Forward →` action buttons. It dynamically renders `#breadcrumbTrail` with category hierarchy (e.g. `CLINICAL › Pathologist Cockpit › Order #ORD-101`) and sets tooltip text showing the previous view name with `(Alt+Left)`.
- **Physical Keyboard Traversal**:
  - `Alt + ArrowLeft`: Invokes `goBack()`.
  - `Alt + ArrowRight`: Invokes `goForward()`.
  - `Escape`: Hierarchically closes active topmost drawer (`#iqcDrawer`, `#insDrawer`, `#calDrawer`, `#homeJobModal`, `#command`), or if no modal is active, executes `goBack()`.
  - `Backspace`: When focus is outside of `INPUT`, `TEXTAREA`, and `SELECT` elements, safely executes `goBack()`.
  - `Ctrl + K` / `Cmd + K`: Triggers global command palette modal (`#commandModal`).

---

#### 2.2.5 View-by-View Character Expansion & Functional Density Matrix
A quantitative comparison of JavaScript character counts across primary views reveals dramatic expansion in Vault:

| View Function | Live (C:) Chars | Vault (D:) Chars | Expansion Ratio | Architectural & Functional Upgrades in Vault |
|:---|:---:|:---:|:---:|:---|
| `views.dashboard` | 1,662 | 13,874 | **8.35x** | Real-time workload queue, TAT sparklines, revenue telemetry, critical panic counters, quick action hub. |
| `views.analytics` | 760 | 6,267 | **8.25x** | Department test volume breakdown, TAT distribution histograms, referring doctor referral revenue metrics. |
| `views.users` | 291 | 3,011 | **10.35x** | Full staff user management table, role badge toggles, password reset modal (`openChangePasswordModal`). |
| `views.audit` | 291 | 2,358 | **8.10x** | ISO 15189 blockchain ledger viewer, SHA-256 block hash verification, CSV export (`exportAuditLedgerCSV`). |
| `views.qc` | 5,932 | 12,794 | **2.16x** | Interactive Levey-Jennings SVG charts, calibration drawer (`openCalDrawer`), instrument management drawer. |
| `views.gia` | 1,662 | 7,022 | **4.23x** | Offline voice copilot UI, canvas audio waveform visualizer (`jarvisCanvas`), hands-free live talk engine. |
| `views.home` | 1,662 | 5,357 | **3.22x** | Phlebotomist dispatch routing, GPS status tracking, accession assignment, home sample collection queue. |
| `views.kyc` | **0 (Absent)** | 5,281 | **NEW** | Center statutory profile, NABL/ISO accreditation, letterhead margin studio, doctor signatures. |
| `views.interpretations` | **0 (Absent)** | 3,602 | **NEW** | ISO 15189 diagnostic interpretation reference library with category filters and guideline modal. |
| `views.booking` | **0 (Absent)** | Alias | **NEW** | Direct fast-booking alias mapping directly to `views.opd()`. |
| `views.opd` | 2,996 | 4,945 | 1.65x | Health package quick-add (`opdAddPackage`), multi-test barcode auto-generation, invoice breakdown. |
| `views.pathologist` | 3,129 | 4,690 | 1.50x | Dedicated password authorization modal (`pathologistSignModal`, `submitPathologistSign`). |
| `views.settings` | 5,989 | 8,562 | 1.43x | Offline Ed25519 license status card, activation modal, print margin calibration preview. |

---

#### 2.2.6 Missing PWA & Desktop Icon Assets (Live 404 Defect vs. Vault Integrity)
Live's `public/manifest.json` specifies:
```json
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icon-192-maskable.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png" }
]
```
- **Live (C:) Defect**: None of these four icon files, nor `favicon.ico` or `app-icon.ico`, exist in Live's `public/` directory! Every browser load in Live triggers **404 Not Found** errors for icons in developer consoles and network waterfalls.
- **Vault (D:) Integrity**: All six icon files are present in `public/` with verified cryptographic hashes (`favicon.ico` 8.5 KB, `icon-192.png` 5.7 KB, `icon-512.png` 16.7 KB).

---

#### 2.2.7 Client-Side Clinical Gate Disparities & Batch Validation Vulnerabilities
- **Live Clinical Safety Invariant**: In Live `public/index.html` (line 95), orders displayed in the QC and pathologist cockpits are strictly filtered by:
  `orders.filter(x => x.pipelineStatus === 'RESULTS_ENTERED' && x.specimenStatus === 'ACCEPTED')`
  Uncollected or rejected specimens cannot appear in validation queues.
- **Vault Clinical Safety Flaw**: Vault omits `&& x.specimenStatus === 'ACCEPTED'`, allowing rejected or uncollected specimens to be reviewed and authorized.
- **Unsafe Batch Validation UI**: Vault contains `batchValidateNormal()` wired to a green bypass button (`⚡ Batch Authorize Normal & QC PASS`) in `views.worklist` and `views.pathologist`. In Live, this bypass was completely removed.

---

### 2.3 Backend API & Route Surface Microscopic Diff

#### 2.3.1 Route Handler Inventory & Architecture (`server/platformRoutes.js` & `server.js`)
- **`server/platformRoutes.js`**:
  - Live (C:): 125 registered route handlers | 90,472 bytes (577 lines)
  - Vault (D:): 128 registered route handlers | 178,821 bytes (1,933 lines)
- **`server.js`**:
  - Live (C:): 46 registered route handlers | 82,211 bytes (1,092 lines)
  - Vault (D:): 48 registered route handlers | 82,454 bytes (1,096 lines)

---

#### 2.3.2 Route Diffs in `server/platformRoutes.js` (90 KB vs. 178 KB)

##### Routes Unique to Vault (D:):
1. `POST /api/ai/copilot-chat`: Autonomous Voice/Text Copilot Engine with 15 self-customization intents and DOM mutations.
2. `GET /api/onboarding/kyc`: Retrieves lab profile, statutory license, letterhead margins, and doctor signatures.
3. `PUT /api/onboarding/kyc`: Updates lab profile and statutory records.
4. `GET /api/clinical-interpretations`: Serves ISO 15189 clinical interpretation reference guidelines.
5. `GET /api/license/status`: Returns offline Ed25519 license validity and tier.
6. `POST /api/license/activate`: Ingests and verifies offline license payload and signature.
7. `POST /api/orders/:id/fast-draft-results`: Pre-populates benchmark values for test catalog parameters.

##### Routes Unique to Live (C:):
1. `POST /api/ai/sandbox/bilingual-summary`: Non-clinical AI patient summary draft.
2. `POST /api/ai/sandbox/dictation-draft`: Non-clinical speech transcription draft.
3. `POST /api/ai/sandbox/clinical-gate-check`: Validates whether AI is attempting to approve QC or release reports (fail-closed HTTP 403).
4. `POST /api/orders/:id/fast-track`: Fast-track stub.

---

#### 2.3.3 Route Diffs in `server.js` (82.2 KB vs. 82.4 KB)

##### New Administrative Endpoints in Vault `server.js`:
1. `GET /api/audit`: Returns ISO 15189 tamper-evident audit ledger entries (`DB.auditLedger`).
2. `POST /api/auth/change-password`: Self password modification for logged-in staff (`oldPassword`, `newPassword` minimum 6 chars).
3. `POST /api/users/:id/password`: Administrator reset of another user's password (`newPassword`).
4. `PUT /api/orders/:id/billing`: Administrative discount/billing adjustment with mandatory audit reason.
5. `POST /api/orders/:id/cancel`: Administrative cancellation of orders with mandatory reason logging.

##### Security Disparities in `server.js`:
- **Startup Invariant Qualification**: Live explicitly calls `await assertRuntimeRole()` and `await acquireSingleWriterLease()` at startup. Vault lacks both calls.
- **Tenant Matching Helper**: Vault introduces `matchTenant(entityTenant, reqTenant)` which transparently aliases `DEFAULT` to `TEN-DEFAULT` to prevent tenant mismatches during single-clinic offline operation.
- **Loopback Rate-Limit Bypass**: Vault elevates rate limit to 10,000 requests for localhost (`127.0.0.1`, `::1`) to accommodate automated instrument polling and rapid desktop UI navigation.

---

#### 2.3.4 Comprehensive Forensic Audit of the 15 Copilot Intents in Vault
Vault's `/api/ai/copilot-chat` endpoint processes bilingual natural language (Hindi and English) and returns structured mutations that update state and DOM. The audit categorizes these into **Category A (Forbidden Clinical Backdoors)** and **Category B (Safe Administrative & Operational Intents)**:

```
========================================================================================================================
                                     VAULT COPILOT INTENTS: CATEGORICAL BREAKDOWN
========================================================================================================================
 Intent Category       Intent Count   Risk Level       Action in Consolidation
------------------------------------------------------------------------------------------------------------------------
 Category A: Clinical  4 intents      CRITICAL P0      STRICTLY FORBIDDEN / PURGE PERMANENTLY
 Category B: Admin     30 intents     LOW / BENIGN     SAFE TO HARMONIZE / PORT UNDER ROLE GATES
========================================================================================================================
```

##### Category A: High-Severity Clinical Gate Violations (Backdoors to be Purged):
1. **Intent 0.11 (Auto-Fill Results)**: Injects hardcoded fake benchmark values for 30+ tests (`HB: 14.2`, `TLC: 7400`, `FBS: 92`, `CREAT: 0.88`, etc.) into real patient orders upon voice/text command. Falsifies diagnostic records without physical testing.
2. **Intent 0.12 (Autonomous Westgard IQC)**: Fabricates an artificial Westgard IQC PASS run out of thin air (`LOT-2026-N04`) and mass-marks all tenant orders as `qcPassed = true`.
3. **Intent 0.13 (Pathologist Sign-Off)**: Forges the digital signature and MCI registration of an MD Pathologist (`Dr. Rajesh Sharma, MD (Path) [MCI-34821]`) with zero password and zero role check.
4. **Intent 0.14 (Report Release)**: Releases final patient diagnostic reports with tamper-evident HMAC seals without checking specimen acceptance, panic values, or delta checks.

##### Category B: Legitimate Administrative Intents (Safe to Harmonize):
1. **0.1 Set Lab Name**: "set lab name to Apex Diagnostics", "lab ka naam City Care kardo" -> Updates `kyc` platform record.
2. **0.2 Set Lab Phone**: "update phone to +91 9876543210" -> Updates `kyc.phone`.
3. **0.3 Margin Calibration**: "set top margin to 25mm" -> Updates `kyc.printMarginTop`.
4. **0.4 Toggle QR on Print**: "turn on qr verification" -> Updates `kyc.enableQrVerification`.
5. **0.5 Update Test Rate**: "set CBC rate to 250", "rate of Widal to 300" -> Updates `D.testCatalog` and appends audit log.
6. **0.6 Add Doctor Commission**: "add 15% commission for Dr. Gupta" -> Creates referring doctor entry in `D.doctors` with UPI/commission.
7. **0.7 High-Contrast Theme**: "switch to high contrast theme" -> Mutation `{ type: 'THEME_TOGGLED', theme: 'high-contrast' }`.
8. **0.8 Universal Module Navigation**: Routes user across primary dashboard views.
9. **0.9 Patient Registration**: "register patient Ramesh Kumar 45 male 9876543210" -> Creates patient record in `D.patients`.
10. **0.10 Test Booking**: "book CBC for Ramesh Kumar" -> Acceses new order in `D.orders`.
11. **0.15 Send WhatsApp Report**: Dispatches WhatsApp Web API URI for patient report link.
12. **0.16 Apply Invoice Discount**: Updates discount and recalculates net payable with audit log.
13. **0.17 Record Cash/UPI Payment**: Updates payment balance and receipts.
14. **0.18 Daily Accounts Summary**: Summarizes collections and outstanding balances.
15. **0.19 Create Test**: Adds custom test parameter to catalog.
16. **0.20 Create Health Package**: Bundles multiple tests into discounted panel.
17. **0.21 Universal Search**: Full-text search across patients, orders, and doctors.
18. **0.22 Lab Setup Wizard**: Guided onboarding sequence for new laboratory centers.
19. **1. Patient Search Intent**: Natural language patient status lookup.
20. **2. CBC Parameters Intent**: Explains normal biological reference intervals.
21. **3. Tab Explanation Intent**: Explains LIMS modules in Hindi and English.
22. **4–11. Informational Reference Intents**: KYC, Margin, Catalogue, Referral, Panic, QC, Audit, and System Status explanations.

---

#### 2.3.5 Supplementary Service Engines
- **`server/services/clinicalInterpretation.js`** (`8,211 bytes`, 147 lines, SHA-256: `4fa1e9dd...`): Exists **only in Vault**. Contains clinical diagnostic comments for Widal agglutination, Dengue NS1/IgM/IgG, HbA1c (ADA criteria), Lipid profiles, Liver Function, Renal Function, and Thyroid panels.
- **`server/integrations/astm.js`** (`3,258 bytes` in Vault vs. `3,020 bytes` in Live): Vault adds a `maxBufferBytes = 1048576` (1 MB) buffer overflow guard, `if (socket.writable)` guards before writes, and server error logging.
- **`server/services/resultNormalization.js`** (`1,825 bytes` in Vault vs. `1,443 bytes` in Live): Vault preserves multi-parameter panel structures by propagating `subParameters` (e.g. CBC differentials, LFT enzymes).

---

### 2.4 Native Windows Shell, Launchers & Packaging Audit

#### 2.4.1 Native Desktop Executable Architecture (`bin/HRGen-GIA-LIMS.exe`, C# .NET 8 WebView2)
Vault includes a turnkey native Windows desktop architecture that is completely missing from Live:
- **Compiler Target**: C# .NET 8.0 Windows Application (`net8.0-windows`).
- **Dependencies**: `Microsoft.Web.WebView2` (v1.0.4258.31), `Microsoft.Web.WebView2.Core.dll` (698 KB), `WebView2Loader.dll` across x64, x86, and arm64.
- **Desktop Window Specifications**:
  - Size: 1440 × 900 pixels, centered on primary screen.
  - Background color: Dark `#090D16`.
  - Icon: Bound to `public\app-icon.ico`.
  - Security configuration: DevTools disabled (`AreDevToolsEnabled = false`), status bar disabled, default context menus enabled.
  - Dedicated cache folder: `data\webview_cache`.

#### 2.4.2 Process Supervision Lifecycle & Fallback Path Caveat
- **Headless Node.js Lifecycle Supervision**:
  ```csharp
  // Excerpt from desktop/Program.cs
  var psi = new ProcessStartInfo {
      FileName = "node.exe",
      Arguments = "--env-file=.env server.js",
      WorkingDirectory = rootDir,
      CreateNoWindow = true,
      UseShellExecute = false,
      WindowStyle = ProcessWindowStyle.Hidden
  };
  _nodeProcess = Process.Start(psi);
  ```
  The executable launches `server.js` hidden in the background, polls `http://127.0.0.1:3001/api/system/info` until healthy (up to 10 seconds), navigates the WebView2 control to `:3001`, and on window close, automatically kills the Node.js process tree (`_nodeProcess.Kill(true)`).
- **Hardcoded Path Caveat**: In `desktop/Program.cs`, `FindRootDir()` contains a fallback to `g:\Desktop\Desktop\HRGENLIMS\HRGen-GIA-LIMS-FULL-PRODUCT-L99N30-LEVEL4A` if `server.js` is not found within 5 parent directories. While harmless when running inside the portable directory, this should be neutralized.

#### 2.4.3 Batch Launchers & Operational Scripts
- **`START_LIMS.bat`** (`738 bytes`, SHA-256: `85a95229...`):
  - Checks for `%~dp0.env`. If missing, copies `%~dp0.env.production` to `%~dp0.env`.
  - Displays default credentials (`admin` / `Admin@12345678`).
  - Launches `start "" "%~dp0bin\HRGen-GIA-LIMS.exe"`.
- **`ACTIVATE_LICENSE.bat`** (`1,060 bytes`, SHA-256: `8e43396e...`):
  - Verifies presence of `license.json` and `license-public.pem`.
  - Executes `node LICENSE_TOOL.js verify license.json license-public.pem`.
  - Checks `%ERRORLEVEL% EQU 0` to confirm offline cryptographic unlock.
- **`README_INSTALL.txt`** (`1,411 bytes`, SHA-256: `f6b5a170...`):
  - Turnkey 3-step offline guide (1. Extract/Copy -> 2. Run ACTIVATE_LICENSE.bat -> 3. Run START_LIMS.bat). Zero internet or external browser required.

---

### 2.5 Licensing & Cryptography Deep Comparison

#### 2.5.1 Ed25519 Implementation Diff (`LICENSE_TOOL.js` 1 KB Stub vs. 4.4 KB Verifier)
- **Live (C:) Implementation (`1,091 bytes`, 10 lines)**:
  - Only implements `keygen` and `sign`.
  - Has **NO `verify` command**.
  - Attempting to run `node LICENSE_TOOL.js verify` produces an error and exits with code 1.
  - Live contains no `license.json` or `license-public.pem` in its workspace.
- **Vault (D:) Implementation (`4,463 bytes`, 102 lines)**:
  - Implements `keygen`, `sign`, and `verify [licenseFile] [publicFile] [tenantSlug]`.
  - Performs Ed25519 elliptic curve signature verification:
    ```javascript
    const ok = crypto.verify(null, payload, { key: publicKey, format: 'pem', type: 'spki' }, sig);
    ```
  - Validates temporal constraints: `expiresAt` (expiration date) and `amcUntil` (Annual Maintenance Contract date).
  - Validates multi-tenant isolation: ensures `tenantSlug` in the cryptographic payload matches the active clinic.
  - Formats human-readable verification scorecard with exit code `0` on success.

---

#### 2.5.2 Empirical Cryptographic Verification Evidence
Both scripts were executed via command line to test cryptographic verification:

1. **Running in Vault (`D:\...\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026`)**:
   ```
   Command: node LICENSE_TOOL.js verify license.json license-public.pem
   Exit Code: 0
   Output:
   ======================================================================
     HRGen GIA LIMS — Offline Ed25519 Cryptographic License Verified
   ======================================================================
   Tenant Slug  : default
   Issued To    : HRGen Diagnostic Enterprise Client
   Tier         : ENTERPRISE_LIMS_L99N30
   Expires At   : PERPETUAL
   AMC Until    : ACTIVE
   Signature    : VALID (Ed25519 cryptographic match)
   LICENSE_VERIFIED_VALID: Licensed to HRGen Diagnostic Enterprise Client
   ======================================================================
   ```

2. **Running in Live (`C:\Users\pc\Desktop\HRGEN GIA LIMS`)**:
   ```
   Command: node LICENSE_TOOL.js verify
   Exit Code: 1
   Output:
   Usage: node LICENSE_TOOL.js keygen [private.pem] [public.pem] | sign payload.json private.pem license.json
   ```

---

## 3. Clinical Safety, PostgreSQL RLS & AI Disparity Audit (R2 Acceptance Criteria)

### 3.1 Pre-Analytical Specimen Gate Enforcement (`specimenStatus === 'ACCEPTED'`)

#### 3.1.1 Result Entry Gate (`PUT /api/orders/:id/results`)
- **Live Codebase (C:) - `server.js:672-675`**:
  ```javascript
  if (['VALIDATED','RELEASED'].includes(order.pipelineStatus)) 
    return res.status(409).json({ error: 'Released/validated reports are immutable; create an amended report workflow instead.' });
  if (order.specimenStatus !== 'ACCEPTED') 
    return res.status(409).json({ error: 'Pre-analytical gate blocked: specimen must be ACCEPTED before result entry.' });
  ```
  *Status*: **ENFORCED (Fail-Closed)**. Rejects result entry with HTTP 409 if `specimenStatus !== 'ACCEPTED'`.
- **Vault Codebase (D:) - `server.js:706-711`**:
  ```javascript
  if (['VALIDATED','RELEASED'].includes(order.pipelineStatus)) 
    return res.status(409).json({ error: 'Released/validated reports are immutable; create an amended report workflow instead.' });
  const catalogForTenant = DB.testCatalog.filter(x => matchTenant(x.tenantId, tid) && x.active !== false);
  ```
  *Status*: **COMPLETELY ABSENT (Fail-Open)**. The check `if (order.specimenStatus !== 'ACCEPTED')` does not exist anywhere in `D:`. Results can be entered on uncollected, in-transit, or rejected specimens.

#### 3.1.2 Final Report Release Gate (`POST /api/orders/:id/release`)
- **Live Codebase (C:) - `server.js:731-733`**:
  ```javascript
  const order = req.order;
  if (order.specimenStatus !== 'ACCEPTED') 
    return res.status(409).json({ error: 'Pre-analytical gate blocked: accepted specimen evidence is required before release.' });
  if (!order.signoff) 
    return res.status(409).json({ error: 'Pathologist sign-off is required before release' });
  ```
  *Status*: **ENFORCED (Fail-Closed)**. Release is strictly blocked with HTTP 409 if accepted specimen evidence is missing.
- **Vault Codebase (D:) - `server.js:758-760`**:
  ```javascript
  const order = req.order;
  if (!order.signoff) 
    return res.status(409).json({ error: 'Pathologist sign-off is required before release' });
  ```
  *Status*: **COMPLETELY ABSENT (Fail-Open)**. Reports can be sealed and released to patients even if the specimen was rejected for severe hemolysis, clotting, or QNS.

#### 3.1.3 Specimen Acceptance & Rejection Workflow
- **Specimen Acceptance (`POST /api/specimens/accept`)**:
  - `C: (platformRoutes.js:302-318)`: Enforces post-validation immutability, blocks double-acceptance, validates tube container type against accession catalog, and archives specimen audit history in `o.specimenHistory`.
  - `D: (platformRoutes.js:520-530)`: Lacks immutability check, lacks double-acceptance check, lacks tube type validation, and lacks history archival.
- **Specimen Rejection (`POST /api/specimens/reject`)**:
  - `C: (platformRoutes.js:320-335)`: Enforces post-validation immutability, validates rejection reason against 8 ISO/NABL reasons (`HEMOLYSIS`, `ICTERIC`, `LIPEMIA`, `CLOTTED`, `QNS`, `MISLABELED`, `CONTAINER_LEAK`, `OTHER`), rejects invalid input with HTTP 400, and archives previous specimen state.
  - `D: (platformRoutes.js:532-545)`: Lacks immutability check, silently falls back invalid reasons to `'OTHER'`, and lacks history archival.

---

### 3.2 Analyzer Ingestion, 1:1 Matching & Test Set Integrity

#### 3.2.1 Direct Ingestion Route (`POST /api/instrument-results/import`)
- **Live Codebase (C:) - `server.js:854-870`**:
  - Requires `specimenStatus === 'ACCEPTED'`.
  - Requires active instrument owned by the requesting tenant.
  - **Exact 1:1 Accession Test Set Validation**:
    ```javascript
    const accessionCodes = (o.tests||[]).map(t=>String(t.code||'').trim().toUpperCase()).sort();
    const incomingCodes = results.map(t=>String(t?.code||'').trim().toUpperCase()).sort();
    if(incomingCodes.some(x=>!x) || new Set(incomingCodes).size!==incomingCodes.length || 
       incomingCodes.length!==accessionCodes.length || incomingCodes.some((x,i)=>x!==accessionCodes[i]))
      return res.status(409).json({error:'Analyzer result codes must exactly match the accession test set; omitted, extra, or duplicate tests are rejected.',expected:accessionCodes,received:incomingCodes});
    ```
  - **Metadata Preservation & Unreviewed State**:
    ```javascript
    o.tests = (o.tests||[]).map(t => {
      const r = incoming.get(String(t.code||'').trim().toUpperCase());
      return {
        ...t,
        value: String(r.value??'Pending'),
        status: 'UNREVIEWED',
        method: String(r.method || `Automated Analyzer (${instrument.name||instrument.id})`),
        source: 'INSTRUMENT',
        instrumentId: instrument.id
      };
    });
    ```
    Preserves reference ranges, billing units, critical thresholds, and sets status strictly to `'UNREVIEWED'`.

#### 3.2.2 Destructive Mutation in D: vs. Metadata Preservation in C:
- **Vault Codebase (D:) - `server.js:863-868`**:
  ```javascript
  o.tests = results.map(t => ({...t, value: String(t.value??'Pending'), source: 'INSTRUMENT'}));
  ```
  - Destructively replaces `o.tests` with incoming objects. If an automated analyzer sends 3 results out of an 8-test panel, the remaining 5 tests on the accession are deleted!
  - Catalog pricing, reference intervals, and clinical metadata are destroyed.
  - Fails to label imported results as `'UNREVIEWED'`.

#### 3.2.3 Simulator Route in Production (`POST /api/integrations/simulate-analyzer`)
- **Live Codebase (C:) - `platformRoutes.js:501-531`**: Disabled in production (`NODE_ENV === 'production'` returns HTTP 403), requires `specimenStatus === 'ACCEPTED'`, sets `t.status = 'UNREVIEWED'`.
- **Vault Codebase (D:) - `platformRoutes.js:712-735`**: Active in all environments, lacks specimen check, and sets `t.status = 'Normal'`, directly stamping uninspected simulated numbers as normal without review.

#### 3.2.4 ASTM TCP Edge Buffer Resilience Guard
- **Vault Codebase (D:) Superiority**: `server/integrations/astm.js` in Vault implements `maxBufferBytes = 1048576` (1 MB limit) to prevent memory exhaustion denial-of-service and checks `if (socket.writable)` before writes. This hardening from `D:` should be merged into `C:`.

---

### 3.3 Westgard 6-Rule Engine & IQC Validation

#### 3.3.1 Engine Core Verification (`server/services/westgard.js`)
Bitwise comparison confirms that the core Westgard engine is **100% IDENTICAL** across both repositories (`3,155 bytes`, SHA-256: `80bb4c8fd1c3706863af584d37d77b55501f0710ca1f92fe1be2749938aa8426`):
- `1_2s`: Warning rule (absLast > 2 SD).
- `1_3s`: Rejection rule for random error (absLast > 3 SD).
- `2_2s`: Rejection rule for systematic error (2 consecutive > 2 SD on same side).
- `R_4s`: Rejection rule for within-run range (|z1 - z2| with opposite sides > 2 SD).
- `4_1s`: Rejection rule for systematic shift (4 consecutive > 1 SD on same side).
- `10x`: Rejection rule for systematic drift (10 consecutive on one side of mean).

#### 3.3.2 Order QC Approval Gate (`POST /api/qc/approve/:orderId`)
- **Live Codebase (C:) - `server.js:813-827`**:
  - Enforces QC run evaluation status is `PASS`.
  - Enforces instrument matching: `run.instrumentId === instrument.id`.
  - Enforces accession test code matching:
    ```javascript
    const orderCodes = new Set((o.tests||[]).map(t=>String(t.code||'').trim().toUpperCase()));
    if (!orderCodes.has(String(run.testCode||'').trim().toUpperCase())) 
      return res.status(409).json({error:'QC run test code must be present in the accession test set'});
    ```
  - Enforces reagent lot belongs to the instrument, is active, and is not expired.
  - Enforces calibration belongs to the instrument and is `PASS`.
- **Vault Codebase (D:) - `server.js:847-860`**:
  - Lacks accession test code matching: A Glucose QC run can approve a Hemoglobin order!
  - Lacks instrument matching on reagent lot and calibration.

---

### 3.4 Panic Value Communication & Pathologist Re-Authentication

#### 3.4.1 Panic Communication Dual Witness & Bcrypt Authentication
- **Live Codebase (C:) - `server.js:876-905`**:
  - Implements live `bcrypt.compare` re-authentication for the primary clinician.
  - Implements dual-witness secondary re-authentication (`witnessUser` and `witnessPassword` checked with `bcrypt.compare`).
- **Vault Codebase (D:) - `server.js:870-871`**:
  - **Zero Password Check**: Accepts `req.body` and marks `t.criticalValueAcknowledged = true` with no password or credential verification.
  - **Zero Witness Capability**: Any unauthorized user at an unlocked terminal can silence panic alerts.

#### 3.4.2 Pathologist Sign-Off Credential Verification
- Manual `/api/orders/:id/signoff` verifies pathologist role and bcrypt password in both codebases.
- **However**, in Vault, the autonomous AI Copilot in `server/platformRoutes.js:1269-1302` completely circumvents this endpoint via chat.

---

### 3.5 Backdoors & Malpractice Vectors in Vault (D:)

```
========================================================================================================================
                                     VAULT MALPRACTICE BACKDOORS IN COPILOT CHAT
========================================================================================================================
 Intent / Route        Trigger Phrase Example             Malpractice & Forensic Impact
------------------------------------------------------------------------------------------------------------------------
 Intent 0.11           "auto-fill normal results"         Falsifies lab results with hardcoded benchmark constants
 Intent 0.12           "run westgard qc"                  Fabricates Westgard PASS out of thin air across all orders
 Intent 0.13           "sign-off report"                  Forges MD Pathologist signature (MCI-34821) without credentials
 Intent 0.14           "release report"                   Releases diagnostic reports with HMAC seal without gates
 batch-validate-normal "⚡ Batch Authorize Normal"         Mass-validates normal orders without individual review
 fast-draft-results    POST /fast-draft-results           Defaults missing parameters to 'Normal' without specimen gate
========================================================================================================================
```

1. **Intent 0.11: Fake Result Auto-Fill Injection (`platformRoutes.js:1176-1224`)**:
   Populates hardcoded constants (`HB: 14.2`, `TLC: 7400`, `FBS: 92`, `CREAT: 0.88`, `BILI-T: 0.75`, `CHOL: 168`) into patient records. A severe malpractice violation that fakes diagnostic data.
2. **Intent 0.12: Fabricated Westgard IQC PASS (`platformRoutes.js:1226-1267`)**:
   Generates a synthetic IQC run (`LOT-2026-N04`) and marks `o.qcPassed = true` across all orders in the tenant without testing control aliquots.
3. **Intent 0.13: Forged Pathologist Electronic Signature (`platformRoutes.js:1269-1302`)**:
   Injects `name: 'Dr. Rajesh Sharma, MD (Path)', regNo: 'MCI-34821'` with zero credentials, allowing any unauthenticated user to sign reports via chat.
4. **Intent 0.14: Unverified Report Release (`platformRoutes.js:1304-1335`)**:
   Sets order status to `RELEASED` and signs HMAC token without checking specimen acceptance or panic communication.
5. **Batch Normal Validation Bypass (`POST /api/orders/batch-validate-normal`)**:
   Exposed in Vault backend and UI (`batchValidateNormal()`). Bypasses individual review. Disabled in Live (HTTP 409).
6. **Fast-Draft Results Route (`POST /api/orders/:id/fast-draft-results`)**:
   Defaults unmeasured parameters to `'Normal'` and sets status to `RESULTS_ENTERED` without checking specimen acceptance.

---

### 3.6 PostgreSQL Multi-Tenant Row-Level Security (RLS) Audit

#### 3.6.1 Least-Privilege Role Separation (`hrgen_app` vs. `hrgen_migrator`)
- **Live Codebase (C:)**:
  - `hrgen_migrator`: Table and schema owner, used only during migrations via `migrationPool`.
  - `hrgen_app`: Application runtime user. `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`. Has `ALTER ROLE hrgen_app SET row_security = on;`. Granted only `SELECT, INSERT, UPDATE, DELETE` on tables and `USAGE, SELECT, UPDATE` on sequences. Has **zero table ownership**, denied `CREATE` on schema `public`, and denied `TRUNCATE` on clinical tables.
- **Vault Codebase (D:)**:
  - Zero role separation. Connects over a single shared pool as database owner or superuser (`postgres`). Superusers bypass RLS entirely.

#### 3.6.2 Startup Role Privilege Self-Audit (`assertRuntimeRole()`)
- In Live (C:), `server.js:72` executes `assertRuntimeRole()`:
  - Verifies current user is not superuser and does not have `BYPASSRLS`.
  - Verifies current user does not have `CREATE` privilege on schema `public`.
  - Verifies current user owns zero tenant tables.
  - Verifies current user cannot `TRUNCATE` clinical tables.
  - In production, enforces that `DATABASE_URL !== MIGRATION_DATABASE_URL`.
- Vault lacks `assertRuntimeRole()`.

#### 3.6.3 Single-Writer Advisory Lock Lease (`pg_try_advisory_lock`)
- In Live (C:), `server.js:73` and `db/postgres.js:204-222` acquire a session advisory lock lease:
  `SELECT pg_try_advisory_lock(hashtext('hrgen_gia_lims_single_writer_v1')) AS acquired`
  Blocks multi-instance horizontal scaling to prevent in-memory cache desynchronization.
- Vault lacks any advisory lock lease, allowing concurrent writers to corrupt database state.

#### 3.6.4 FORCE ROW LEVEL SECURITY Scope (19 Tables in C: vs. 16 in D:)
- **Live (C:) covers 19 tables**:
  `users`, `patients`, `orders`, `order_tests`, `test_catalog`, `qc_runs`, `instruments`, `reagent_lots`, `calibrations`, `delta_checks`, `critical_communications`, `report_versions`, `backup_manifest`, `validation_evidence`, `audit_ledger`, `platform_records`, `sequence_counters`, `api_keys`, `refresh_tokens`.
- **Vault (D:) covers only 16 tables**:
  - **Omitted from RLS in Vault**:
    1. `sequence_counters`: Invoice and accession counters are globally shared across tenants!
    2. `api_keys`: Tenant API keys can be traversed across tenants!
    3. `refresh_tokens`: Refresh tokens can be hijacked across tenants!
- Live also automatically prunes all conflicting permissive policies (`DROP POLICY`) and blocks migrations if rows exist with `tenant_id IS NULL`.

#### 3.6.5 Scoped Tenant Context Execution (`app.tenant_id`)
- In Live (C:), every database operation sets `app.tenant_id`:
  - `setTenantContext(client, tenantId)` executes `SELECT set_config('app.tenant_id', $1, true)`.
  - `loadState()` iterates tenants setting context per tenant before querying.
  - `persistState()` sets context per row before updates/inserts.
- In Vault (D:), `loadState()` executes raw unqualified queries (`SELECT * FROM users`). `app.tenant_id` is **never set**. Under a hardened non-superuser role, these queries return 0 rows.

#### 3.6.6 Elimination of Standalone Mock in C: vs. Volatile Risk in D:
- Live (C:) completely purged `StandaloneClient` and `standaloneState`. If PostgreSQL fails, it fails closed with a fatal error.
- Vault (D:) contains `class StandaloneClient` that silently falls back to volatile in-memory storage if PostgreSQL fails, masking database outages and losing patient data upon reboot.

#### 3.6.7 SQL Migration Architecture (`20261015_tenant_rls_hardening.sql`)
- Live (C:) includes dedicated SQL migrations transferring ownership to `hrgen_migrator` and setting default privileges.
- Vault (D:) contains zero migration files.

---

### 3.7 Gemini AI Integration & Sandboxing Audit

#### 3.7.1 Official `@google/genai` (v2.30.0) SDK vs. Deprecated Fetch
- Live (C:) installs and uses the official `@google/genai` (v2.30.0) SDK:
  `const ai = new GoogleGenAI({ apiKey })`
- Vault (D:) lacks the SDK and uses raw HTTP `fetch` to legacy `v1beta` endpoints.

#### 3.7.2 Deterministic Structured Output via `responseJsonSchema`
- In Live (C:) (`geminiCopilot.js:71-96`), strict typing guarantees deterministic output:
  ```javascript
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: {
      type: Type.OBJECT,
      properties: {
        differentialInsight: { type: Type.STRING },
        patientExplanationHindi: { type: Type.STRING },
        patientExplanationEnglish: { type: Type.STRING },
        riskLevel: { type: Type.STRING, enum: ['NORMAL', 'MONITOR', 'CRITICAL'] }
      },
      required: ['differentialInsight', 'patientExplanationHindi', 'patientExplanationEnglish', 'riskLevel']
    }
  }
  ```
- Vault relies on unconstrained text prompts ("Respond in valid JSON"), lacks `riskLevel`, and crashes on markdown backticks.

#### 3.7.3 API Key Security & Query String Leak Prevention
- Live passes the API key securely via client initialization headers.
- Vault interpolates the key directly in the URL query string (`?key=${KEY}`), leaking API credentials in server access logs and telemetry.

#### 3.7.4 Bilingual Voice Dictation Draft Engine
- Live provides `generateDictationDraft(transcript, catalog)`:
  - Online: Uses `@google/genai` to extract `{ testCode, numericValue, unit, morphologyNote }`.
  - Offline: Deterministic regex parsing covering Hindi numbers (`das point paanch` -> `10.5`, `pandrah` -> `15`) and clinical alias mapping (`HEMOGLOBIN` -> `HB`, `SUGAR` -> `FBS`).
  - Attaches mandatory review flags: `humanReviewRequired: true`, `canApproveQC: false`, `canReleaseReport: false`.
- Vault does not have this engine.

#### 3.7.5 Non-Clinical Medical Disclaimer & Gate Check Middleware (`/clinical-gate-check`)
- Live enforces `POST /api/ai/sandbox/clinical-gate-check`:
  Blocks actions `['APPROVE_QC', 'RELEASE_REPORT', 'OVERRIDE_PANIC', 'VALIDATE_RESULTS']` with HTTP 403.
- Vault lacks this firewall.

---

## 4. Actionable Gap Matrix & Merging Roadmap (R3 Acceptance Criteria)

### 4.1 Side-by-Side Comprehensive Feature Inventory

| Capability / Asset | Unique to Live (C:) | Unique to Vault (D:) | Architectural & Operational Significance |
|:---|:---:|:---:|:---|
| **Pre-analytical Specimen Gate** | **YES** | NO | Live enforces `specimenStatus === 'ACCEPTED'` across all entry and release points. |
| **Analyzer 1:1 Matching** | **YES** | NO | Live rejects omitted, extra, or duplicate tests; preserves reference intervals and pricing. |
| **Analyzer Unreviewed Status** | **YES** | NO | Live marks imported analyzer results as `'UNREVIEWED'`. |
| **Panic Dual Re-Authentication** | **YES** | NO | Live enforces bcrypt password and dual witness for critical values. |
| **PostgreSQL Least-Privilege Role** | **YES** | NO | Live runs as `hrgen_app` (no superuser, no ownership, no public schema CREATE). |
| **Advisory Lock Writer Lease** | **YES** | NO | Live enforces `pg_try_advisory_lock` to block multi-writer split-brain corruption. |
| **19 Tables Under FORCE RLS** | **YES** | NO | Live covers sequence counters, API keys, and tokens under strict tenant isolation. |
| **Official @google/genai SDK** | **YES** | NO | Live uses `@google/genai` v2.30.0 with `responseJsonSchema` and header authentication. |
| **Bilingual Dictation Normalizer** | **YES** | NO | Live parses Hindi and English voice transcripts to test codes and numbers. |
| **Non-Clinical AI Gate Check** | **YES** | NO | Live blocks AI from approving QC or releasing reports (HTTP 403 fail-closed). |
| **Playwright E2E Suite (1,127 L)** | **YES** | NO | Live contains comprehensive browser E2E test harness (`tests/e2e.spec.js`). |
| **Dedicated SQL Migrations** | **YES** | NO | Live maintains `db/migrations/20261015_tenant_rls_hardening.sql`. |
| **Rich 254 KB UI Shell** | NO | **YES** | Vault contains complete clinical SPA with real-time sparklines and high density. |
| **Universal History Navigation** | NO | **YES** | Vault provides `goBack()`, `goForward()`, scroll preservation, and breadcrumbs. |
| **Physical Keyboard Shortcuts** | NO | **YES** | Vault supports `Alt+Left`, `Alt+Right`, `Escape`, `Backspace`, `Ctrl+K`. |
| **Center KYC & Lab Profile View** | NO | **YES** | Vault includes statutory accreditation, doctor signatures, and letterhead studio. |
| **Diagnostic Interpretations View** | NO | **YES** | Vault includes ISO 15189 reference library (`views.interpretations`). |
| **PWA & Desktop Icons (6 Assets)** | NO | **YES** | Vault contains `favicon.ico`, `app-icon.ico`, `icon-192.png`, `icon-512.png`, etc. |
| **Native WebView2 Desktop Wrapper** | NO | **YES** | Vault contains compiled C# .NET 8 desktop executable (`bin/HRGen-GIA-LIMS.exe`). |
| **Turnkey Batch Launchers** | NO | **YES** | Vault provides `START_LIMS.bat`, `ACTIVATE_LICENSE.bat`, `README_INSTALL.txt`. |
| **Ed25519 License Verifier CLI** | NO | **YES** | Vault provides full 4.4 KB `LICENSE_TOOL.js` with `verify` command and exit codes. |
| **Offline License Files** | NO | **YES** | Vault contains perpetual `license.json` and `license-public.pem`. |
| **Administrative Route Handlers** | NO | **YES** | Vault provides `/api/audit`, password change, order billing, order cancel routes. |
| **ASTM Edge TCP Buffer Guard** | NO | **YES** | Vault enforces 1 MB buffer limit (`maxBufferBytes`) and socket state checks. |
| **Sub-parameter Preservation** | NO | **YES** | Vault preserves `subParameters` for multi-analyte test panels. |

---

### 4.2 Comprehensive Risk Analysis Matrix

```
========================================================================================================================
                                             RISK ANALYSIS MATRIX
========================================================================================================================
 Risk Level     Vulnerability / Action               Impact & Failure Mode
------------------------------------------------------------------------------------------------------------------------
 EXTREME /      Overwriting Live db/postgres.js      Destroys least-privilege security. Disables RLS for 3 tables.
 FORBIDDEN      with Vault version                   Re-introduces StandaloneClient mock, masking database outages.

 EXTREME /      Overwriting Live server.js           Eliminates pre-analytical specimen ACCEPTED gates. Re-enables
 FORBIDDEN      with Vault version                   destructive analyzer overwrites. Re-opens unauthenticated panic.

 EXTREME /      Porting Copilot Intents              Permits AI to fake diagnostic lab results, fabricate Westgard
 FORBIDDEN      0.11, 0.12, 0.13, 0.14               IQC compliance, forge MD signatures, and release unverified tests.

 HIGH           Retaining batch-validate-normal      Allows bulk release of normal orders bypassing individual clinical
                in UI or backend routes              verification and pathologist re-authentication.

 HIGH           Using raw Gemini HTTP fetch          Leaks API key in URL query parameters. Vulnerable to JSON breaks
                without responseJsonSchema           and markdown backtick formatting crashes.

 MEDIUM         Porting desktop Program.cs with      If server.js is not found within 5 parent directories, fallback
                hardcoded G:\ path                   attempts to access hardcoded developer path on drive G:.

 LOW /          Copying PWA & desktop icon assets    Fixes browser 404 console errors on Live; enables PWA installation.
 BENIGN         from Vault public/ to Live public/

 LOW /          Copying bin/ and desktop/ WebView2   Provides standalone air-gapped desktop application experience.
 BENIGN         wrapper into Live

 LOW /          Copying START_LIMS.bat &             Provides 1-click turnkey startup and Ed25519 license verification.
 BENIGN         ACTIVATE_LICENSE.bat into Live
========================================================================================================================
```

---

### 4.3 Step-by-Step Non-Destructive Consolidation & Migration Roadmap

```
========================================================================================================================
                                     CONSOLIDATION ROADMAP: PHASE-BY-PHASE EXECUTION
========================================================================================================================
```

#### Phase 1: Safe Binaries, Desktop Shell & PWA Asset Consolidation
*Zero risk of regression; pure additive file imports.*
1. **Copy Native Desktop Binaries**:
   Copy `bin/` directory from Vault to Live (`bin/HRGen-GIA-LIMS.exe`, `WebView2Loader.dll`, `Microsoft.Web.WebView2.*.dll`).
2. **Copy Desktop Source**:
   Copy `desktop/` directory from Vault to Live. Neutralize the fallback path in `desktop/Program.cs` so it safely defaults to `AppDomain.CurrentDomain.BaseDirectory`.
3. **Copy Launchers and Operational Guides**:
   Copy `START_LIMS.bat`, `ACTIVATE_LICENSE.bat`, `README_INSTALL.txt`, and `.env.production` into Live root.
4. **Copy Missing Static PWA & Desktop Icons**:
   Copy `app-icon.ico`, `favicon.ico`, `icon-192.png`, `icon-192-maskable.png`, `icon-512.png`, `icon-512-maskable.png` from Vault `public/` to Live `public/`. Eliminates all 404 errors on Live.
5. **Upgrade Ed25519 Licensing Utility**:
   Overwrite Live's stubbed `LICENSE_TOOL.js` with Vault's complete 4.4 KB version. Copy `license.json` and `license-public.pem` into Live root. Verify offline activation via `node LICENSE_TOOL.js verify license.json license-public.pem`.

#### Phase 2: Sanitized UI Shell & Safe Administrative Route Porting
*High clinical impact; requires surgical sanitization before integration.*
1. **Sanitize Vault `public/index.html`**:
   - Extract the rich 254 KB UI shell, desktop universal history engine (`viewHistory`, `viewFuture`, scroll memory), breadcrumb trail (`#breadcrumbTrail`), keyboard shortcuts, sparklines, `views.kyc`, and `views.interpretations`.
   - **MANDATORY CLINICAL GATE INJECTION**:
     In the worklist and pathologist cockpit views, restore Live's strict pre-analytical filter:
     `orders.filter(x => x.pipelineStatus === 'RESULTS_ENTERED' && x.specimenStatus === 'ACCEPTED')`
   - **MANDATORY BYPASS REMOVAL**:
     Completely delete `batchValidateNormal()` and remove the green `⚡ Batch Authorize Normal & QC PASS` button from `views.worklist` and `views.pathologist`.
2. **Port Safe Administrative Routes into `server.js`**:
   - Add `/api/audit` (ISO 15189 ledger reader).
   - Add `/api/auth/change-password` and `/api/users/:id/password`.
   - Add `/api/orders/:id/billing` and `/api/orders/:id/cancel` (with mandatory audit logging).
   - Ensure all new routes wrap database queries in `setTenantContext(client, tenantOf(req))`.
3. **Sanitize `server/platformRoutes.js` and Port Safe Intents**:
   - Copy `server/services/clinicalInterpretation.js` into Live `server/services/`.
   - Expose read-only `GET /api/clinical-interpretations`.
   - Expose Center KYC endpoints: `GET /api/onboarding/kyc` and `PUT /api/onboarding/kyc`.
   - Expose offline license endpoints: `GET /api/license/status` and `POST /api/license/activate`.
   - Port Category B administrative copilot intents (Lab Name, Phone, Margins, Rates, Doctor Commission, Navigation, Registration, Packages).
   - **STRICTLY EXPUNGE AND PURGE ALL 4 CATEGORY A BACKDOORS**:
     * Purge Intent 0.11 (Auto-Fill Results).
     * Purge Intent 0.12 (Autonomous Westgard IQC).
     * Purge Intent 0.13 (Pathologist Sign-Off).
     * Purge Intent 0.14 (Report Release).
   - Ensure `/api/orders/batch-validate-normal` remains permanently disabled (HTTP 409).
   - Ensure `/api/orders/:id/fast-draft-results` is permanently blocked or deleted.

#### Phase 3: Gemini AI SDK Harmonization & ASTM TCP Hardening
1. **Harmonize AI Copilot with Official SDK**:
   - Route conversational copilot requests through `@google/genai` (v2.30.0) using `gemini-2.5-flash`.
   - Pass API key strictly via HTTP Authorization headers (eliminate URL query parameter leaks).
   - Enforce structured output via `responseJsonSchema`.
   - Bind all AI outputs to `clinicalGateStatus: 'NON_CLINICAL_DRAFT_ONLY'` and enforce HTTP 403 on `/api/ai/sandbox/clinical-gate-check`.
2. **Hardening ASTM Edge Server**:
   - Merge `maxBufferBytes = 1048576` and `if (socket.writable)` guards from Vault into Live `server/integrations/astm.js`.
3. **Preserve Sub-Parameter Panels**:
   - Update Live `server/services/resultNormalization.js` to propagate `subParameters` for multi-analyte panels.

#### Phase 4: Clinical Invariant & PostgreSQL RLS Preservation (Strict Prohibition of Overwrites)
*Immutable Golden Master Invariants.*
1. **DO NOT MODIFY OR OVERWRITE `db/postgres.js`**:
   - Preserve `assertRuntimeRole()`, `acquireSingleWriterLease()`, `migrationPool`, and `setTenantContext()`.
   - Preserve `FORCE ROW LEVEL SECURITY` across all 19 tenant tables.
   - Preserve PostgreSQL migration `db/migrations/20261015_tenant_rls_hardening.sql`.
   - Preserve fail-closed database connectivity (no `StandaloneClient` mock).
2. **DO NOT MODIFY OR OVERWRITE Fail-Closed Clinical Gates in `server.js`**:
   - Preserve specimen `ACCEPTED` gate on result entry (`server.js:674`).
   - Preserve specimen `ACCEPTED` gate on report release (`server.js:732`).
   - Preserve 1:1 analyzer accession test set validation and `'UNREVIEWED'` status (`server.js:854-870`).
   - Preserve bcrypt password and dual-witness re-authentication on panic values (`server.js:876-905`).
   - Preserve instrument, lot, and calibration matching on QC approval (`server.js:813-827`).

#### Phase 5: Comprehensive Automated Regression Verification
Execute the full test and verification battery to prove zero regressions:
1. Static and clinical gate verification:
   `node validation/CLINICAL_GATE_FIX_VERIFY.js` (Must score 17/17 PASS).
2. PostgreSQL multi-tenant RLS static verification:
   `node validation/TENANT_RLS_STATIC_VERIFY.js` (Must score 21/21 PASS).
3. Gemini AI sandboxing verification:
   `node validation/GEMINI_SANDBOX_VERIFY.js` (Must score 7/7 PASS).
4. Ed25519 licensing verification:
   `node LICENSE_TOOL.js verify license.json license-public.pem` (Must exit code 0).
5. Comprehensive test suites:
   `npm run qa:all`
   `npm run forensic`
   `npm run build77`
   `npm test`
   `npx playwright test`

---

## 5. Independent Verification Commands & Evidence Runbook

All forensic observations, cryptographic digests, clinical gates, and multi-tenant policies documented in this report can be independently verified using the exact terminal commands below:

### 5.1 Cryptographic Hash & File Size Verification
Verify the exact byte size and SHA-256 digest of key mismatched files across Live (`C:`) and Vault (`D:`):
```powershell
# In PowerShell (Run from C:\Users\pc\Desktop\HRGEN GIA LIMS)
Get-FileHash public/index.html, server/platformRoutes.js, server.js, LICENSE_TOOL.js -Algorithm SHA256 | Format-Table -AutoSize
Get-Item public/index.html, server/platformRoutes.js, server.js, LICENSE_TOOL.js | Format-Table Name, Length

# Compare against Vault on D:
Get-FileHash "D:\HRGen LIMS\HRGENLIMS\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026\public\index.html" -Algorithm SHA256
Get-FileHash "D:\HRGen LIMS\HRGENLIMS\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026\server\platformRoutes.js" -Algorithm SHA256
```

### 5.2 Clinical Safety Gate Verification (`CLINICAL_GATE_FIX_VERIFY.js`)
Demonstrate that Live (`C:`) passes 17/17 clinical safety gates, while Vault (`D:`) fails critical gates:
```powershell
# Test Live Codebase (C:) — Expected: 17/17 PASS (CLINICAL_GATE_FIX_VERIFY PASS (17/17))
node validation/CLINICAL_GATE_FIX_VERIFY.js

# Test Vault Codebase (D:) — Expected: Fails critical clinical gate checks (0/17 PASS)
node -e "
const fs = require('fs');
const dServer = fs.readFileSync('D:/HRGen LIMS/HRGENLIMS/HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026/server.js', 'utf8');
console.log('D result entry has specimen ACCEPTED check:', dServer.includes(\"specimenStatus !== 'ACCEPTED'\"));
console.log('D analyzer import enforces 1:1 test set matching:', dServer.includes('Analyzer result codes must exactly match'));
console.log('D analyzer import sets UNREVIEWED status:', dServer.includes(\"status:'UNREVIEWED'\"));
console.log('D critical panic communication enforces bcrypt:', dServer.includes('Critical communication re-authentication failed'));
"
```

### 5.3 PostgreSQL Multi-Tenant RLS Verification (`TENANT_RLS_STATIC_VERIFY.js`)
Demonstrate that Live (`C:`) covers 19 tables under `FORCE ROW LEVEL SECURITY` with least-privilege roles, while Vault (`D:`) only covers 16 tables and runs as superuser:
```powershell
# Test Live Codebase (C:) — Expected: 21/21 PASS
node validation/TENANT_RLS_STATIC_VERIFY.js

# Verify Table Disparity between C: and D:
node -e "
const fs = require('fs');
const c = fs.readFileSync('db/postgres.js', 'utf8');
const d = fs.readFileSync('D:/HRGen LIMS/HRGENLIMS/HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026/db/postgres.js', 'utf8');
console.log('C has assertRuntimeRole:', c.includes('assertRuntimeRole'));
console.log('D has assertRuntimeRole:', d.includes('assertRuntimeRole'));
console.log('C has acquireSingleWriterLease:', c.includes('acquireSingleWriterLease'));
console.log('D has acquireSingleWriterLease:', d.includes('acquireSingleWriterLease'));
console.log('C RLS table count:', c.match(/tenantTables = \[([^\]]+)\]/s)[1].split(',').length);
console.log('D RLS table count:', d.match(/for \(const table of \[([^\]]+)\]\)/s)[1].split(',').length);
console.log('D has StandaloneClient mock:', d.includes('class StandaloneClient'));
console.log('C has StandaloneClient mock:', c.includes('class StandaloneClient'));
"
```

### 5.4 Gemini AI Sandboxing Verification (`GEMINI_SANDBOX_VERIFY.js`)
Demonstrate that Live (`C:`) enforces official SDK sandboxing with response schemas and clinical action firewalls:
```powershell
# Test Live Codebase (C:) — Expected: 7/7 PASS
node validation/GEMINI_SANDBOX_VERIFY.js

# Verify Vault Copilot Clinical Backdoors
node -e "
const fs = require('fs');
const dRoutes = fs.readFileSync('D:/HRGen LIMS/HRGENLIMS/HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026/server/platformRoutes.js', 'utf8');
console.log('D auto-fills fake benchmark results (0.11):', dRoutes.includes('Auto-Fill Benchmark Results'));
console.log('D executes fake Westgard IQC (0.12):', dRoutes.includes('Autonomous Westgard IQC Execution'));
console.log('D forges MD Pathologist signature (0.13):', dRoutes.includes('Dr. Rajesh Sharma, MD (Path)'));
console.log('D releases reports via chat (0.14):', dRoutes.includes('Autonomous GIA Copilot released final report'));
console.log('D has batch validate normal bypass:', dRoutes.includes('batch-validate-normal'));
"
```

### 5.5 Ed25519 Cryptographic License Verification
Demonstrate that Vault (`D:`) contains the working 4.4 KB Ed25519 verifier, while Live (`C:`) has only a 1 KB stub:
```powershell
# Run in Vault directory — Expected: Exit Code 0, LICENSE_VERIFIED_VALID
cd "D:\HRGen LIMS\HRGENLIMS\HRGen-GIA-LIMS-PORTABLE-PRODUCTION-VAULT-2026"
node LICENSE_TOOL.js verify license.json license-public.pem
echo "Exit Code: $LASTEXITCODE"

# Run in Live directory — Expected: Exit Code 1, Usage error (No verify command)
cd "C:\Users\pc\Desktop\HRGEN GIA LIMS"
node LICENSE_TOOL.js verify
echo "Exit Code: $LASTEXITCODE"
```

### 5.6 Automated E2E and Test Suite Execution Commands
```powershell
# Run full static and unit validation suites
npm run qa:all
npm run forensic
npm run build77
npm test

# Run Playwright Browser E2E suite
npx playwright test
```

---

## 6. Forensic Sign-Off & Release Recommendation

This Forensic Gap Analysis Report definitively maps the complete architectural and operational surface between Live (`C:`) and Vault (`D:`). 

**Final Release Recommendation**:
1. **PRODUCTION RELEASE AS-IS IS BLOCKED FOR VAULT (D:)**: Vault contains severe regulatory, clinical, and data-loss vulnerabilities (4 AI copilot backdoors, 0/12 clinical gates, destructive analyzer imports, missing multi-tenant RLS, and an unauthenticated batch validation bypass). Vault must **NEVER** be deployed directly to production.
2. **APPROVED CONSOLIDATION PATH**: The user request and technical roadmap require elevating Live (`C:`) to full turnkey production capability by safely importing Vault's UI shell, desktop binaries, launchers, PWA assets, and administrative routes according to the 5-phase roadmap, while treating Live's clinical gates, PostgreSQL RLS, and Gemini AI sandbox as immutable invariants.
