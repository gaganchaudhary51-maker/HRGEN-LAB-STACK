# CLINICAL LABORATORY STANDARD OPERATING PROCEDURES (SOP) & TRACEABILITY MANUAL
## Clinical Diagnostic Laboratory Operating System — HRGen GIA LIMS (L99N100XN30 Hardened Golden Master)

```
========================================================================================================================
                      DOCUMENT CONTROL & STATUTORY COMPLIANCE SPECIFICATION
========================================================================================================================
Document Identifier   : HRGEN-LIMS-SOP-MANUAL-2026-V5.2
Effective Date        : October 18, 2026
Supersedes Version    : HRGEN-LIMS-SOP-V5.1 (Archived October 2026)
Review Cycle          : Annual / Post-Regulatory Audit
Accreditation Scope   : NABL (ISO 15189:2022) | ISO 17025:2017 | EU GMP Annex 11 | US FDA 21 CFR Part 11 | CLSI GP41 / C24-A4
Target Platforms      : HRGen GIA LIMS Hardened Golden Master (`C:\Users\pc\Desktop\HRGEN GIA LIMS`)
                        Portable Distribution Vault (`D:\HRGEN GIA LIMS FINAL`)
Classification        : Controlled Medical Laboratory Governance Document
Approving Authority   : Laboratory Director, Lead Pathologist & Quality Assurance Manager
========================================================================================================================
```

---

## TABLE OF CONTENTS

1. [Executive Regulatory Framework & Laboratory Operational Architecture](#1-executive-regulatory-framework--laboratory-operational-architecture)
2. [SOP-01: Front-Desk Receptionist & Billing Operator Workflow](#2-sop-01-front-desk-receptionist--billing-operator-workflow)
   - 2.1 Document Control & Statutory Baseline
   - 2.2 Scope & Operational Objective
   - 2.3 Roles, Responsibilities & Access Level (RACI)
   - 2.4 Patient Registration & Exact Demographic Validation Protocol
   - 2.5 Unique Health Identifier (UHID) Allocation & OPD Token Queue
   - 2.6 Dynamic Test Catalog Accessioning & Fast Package Selection
   - 2.7 Algorithmic Pricing Engine & Financial Float Safeguards
   - 2.8 Discount Governance, Reason Attestation & Managerial Authorization
   - 2.9 Multi-Channel Payment Ingest (Cash Tendered, Dynamic NPCI UPI QR, Card POS)
   - 2.10 Sequential GST Tax Invoice Generation & Accession Barcode Printing
   - 2.11 Process Flow Diagram (ASCII)
   - 2.12 Failure Modes, Exceptions & Immutable Audit Event Logging
   - 2.13 Operational Readiness & Verification Checklist
3. [SOP-02: Phlebotomist & Specimen Collection Procedure](#3-sop-02-phlebotomist--specimen-collection-procedure)
   - 3.1 Document Control & Statutory Baseline
   - 3.2 Scope & Clinical Safety Objective
   - 3.3 Roles, Responsibilities & Access Level (RACI)
   - 3.4 Patient Identification Protocol (Mandatory Dual-Identifier Verification)
   - 3.5 Vacutainer Tube Color-Coding, Additives & Specimen Matrix Specifications
     * 3.5.1 LIMS Automated Tube Routing Logic (`opdService.js:tubeForTest()`) & Default Fallback Behavior
     * 3.5.2 Phlebotomist Standard Operating Procedure: Plasma Glucose (Grey) vs. Serum Glucose (Red/Gold SST)
   - 3.6 CLSI GP41-A6 Compliant Order of Draw Protocol
   - 3.7 Deterministic Code 128-B SVG Barcode Label Generation & Thermal Layout (50 mm × 25 mm)
   - 3.8 Specimen Inversion, Centrifugation & Pre-Analytical Bench Inspection
   - 3.9 Standardized ISO/NABL Specimen Rejection Codes & Recollection Protocol
   - 3.10 Fail-Closed Specimen Acceptance Gate Protocol (`specimenStatus === 'ACCEPTED'`)
   - 3.11 Process Flow Diagram (ASCII)
   - 3.12 Failure Modes, Exceptions & Immutable Audit Event Logging
   - 3.13 Operational Readiness & Verification Checklist
4. [SOP-03: Laboratory Technician, Analyzer Interface & QC Workflow](#4-sop-03-laboratory-technician-analyzer-interface--qc-workflow)
   - 4.1 Document Control & Statutory Baseline
   - 4.2 Scope & Analytical Precision Objective
   - 4.3 Roles, Responsibilities & Access Level (RACI)
   - 4.4 Automated Analyzer Connectivity Architecture (ASTM E1381/E1394 & HL7 v2.5 MLLP)
   - 4.5 Machine Result Ingestion Gate: Fail-Closed Specimen Check & Strict 1:1 Accession Matching
   - 4.6 Mandatory `'UNREVIEWED'` Status Tagging & Catalog Metadata Preservation
   - 4.7 Internal Quality Control (IQC) Protocol & Reagent Aliquot Preparation
   - 4.8 Statistical Westgard 6-Rule Evaluation Engine ($1_{2s}, 1_{3s}, 2_{2s}, R_{4s}, 4_{1s}, 10_x$)
   - 4.9 Multi-Factor Order QC Approval Gate (Run, Instrument, Lot, Calibration)
   - 4.10 Automated Mathematical Formula Derivation Engines (CKD-EPI 2021 eGFR, Friedewald Lipids, FIB-4)
   - 4.11 Process Flow Diagram (ASCII)
   - 4.12 Non-Conformance, Out-of-Control Corrective Actions (CAPA) & Audit Event Logging
   - 4.13 Operational Readiness & Verification Checklist
5. [SOP-04: Pathologist Clinical Validation, Panic Value Handling & Report Sign-Off](#5-sop-04-pathologist-clinical-validation-panic-value-handling--report-sign-off)
   - 5.1 Document Control & Statutory Baseline
   - 5.2 Scope & Diagnostic Governance Objective
   - 5.3 Roles, Responsibilities & Access Level (RACI)
   - 5.4 Technical Validation Gate Checks & Worklist Review Cockpit
   - 5.5 Unit-Aware Critical / Panic Limits Table & Immediate Flagging
   - 5.6 Historical Delta Check Comparison Engine & Biological Drift Screening
   - 5.7 Verbal Readback Communication & Dual-Witness Bcrypt Re-Authentication Protocol
   - 5.8 Pathologist Electronic Sign-Off Protocol, Live Re-Authentication & MCI Registration Logging
   - 5.9 Canonical Report Snapshot Freezing (Letterhead, Profile, Demographics)
   - 5.10 Cryptographic HMAC-SHA256 Digital Sealing & Public Verification QR Code
   - 5.11 Process Flow Diagram (ASCII)
   - 5.12 Failure Modes, Post-Release Amendments & Immutable Audit Event Logging
   - 5.13 Operational Readiness & Verification Checklist
6. [SOP-05: Laboratory Director Disaster Recovery, Backup & Audit Ledger Verification](#6-sop-05-laboratory-director-disaster-recovery-backup--audit-ledger-verification)
   - 6.1 Document Control & Statutory Baseline
   - 6.2 Scope & Enterprise Continuity Objective
   - 6.3 Roles, Responsibilities & Access Level (RACI)
   - 6.4 Cold Snapshot Archiving Protocol (`makeBackup`) & SHA-256 Manifest Registration
   - 6.5 Hot PostgreSQL Transactional Archiving & Point-In-Time Recovery (PITR)
   - 6.6 Cryptographic Backup Verification & Automated Pre-Restore Safety Snapshot Protocol
   - 6.7 PostgreSQL 18 Row Level Security (RLS) Verification Across 19 Tenant Tables
   - 6.8 Least-Privilege Role Separation (`hrgen_app` vs `hrgen_migrator`) & Single-Writer Advisory Lock
   - 6.9 Tamper-Evident Append-Only Audit Ledger Verification (`trg_audit_ledger_immutable` & `verifyAuditChain`)
   - 6.10 Air-Gapped Ed25519 Cryptographic License Audit & Renewal Procedure
   - 6.11 Process Flow Diagram (ASCII)
   - 6.12 Disaster Recovery Execution Runbook & Immutable Audit Event Logging
   - 6.13 Operational Readiness & Verification Checklist
7. [Appendix: Master Error Codes, Rejection Code Cross-Walk & Regulatory Concordance](#7-appendix-master-error-codes-rejection-code-cross-walk--regulatory-concordance)

---

## 1. Executive Regulatory Framework & Laboratory Operational Architecture

HRGen GIA LIMS enforces an uncompromising, fail-closed clinical state machine governed by the international principles of medical laboratory accreditation (**ISO 15189:2022**, **NABL 112**), testing competence (**ISO/IEC 17025:2017**), computerized systems in validated environments (**EU GMP Annex 11**, **US FDA 21 CFR Part 11**, **GAMP 5 Category 4/5**), and clinical venipuncture standards (**CLSI GP41-A6**, **CLSI C24-A4**).

The system architecture guarantees that clinical safety rules cannot be bypassed through user interface manipulation, missing network parameters, or manual administrative fast-tracking. Every state transition is gated server-side, checked against tenant security contexts, and sealed into a cryptographically verified, append-only audit trail.

```
+======================================================================================================================+
|                                    END-TO-END CLINICAL SPECIMEN LIFECYCLE PIPELINE                                    |
+======================================================================================================================+
|                                                                                                                      |
|   +--------------------------+         +--------------------------+         +----------------------------------+     |
|   |         SOP-01           |         |          SOP-02          |         |              SOP-03              |     |
|   |  Receptionist / Billing  |         |       Phlebotomist       |         |       Laboratory Technician      |     |
|   |--------------------------|         |--------------------------|         |----------------------------------|     |
|   | - Search / Register PT   |         | - 2-Identifier Match     |         | - ASTM / HL7 Analyzer Ingest     |     |
|   | - Exact Age (Y/M/D)      |  Order  | - CLSI Order of Draw     | Specimen| - Gate: Specimen Must be ACCEPTED|     |
|   | - Indian Mobile (10-D)   |=======> | - Code 128-B Barcoding   |========>| - Strict 1:1 Accession Test Match|     |
|   | - Test Accessioning      | Access'd| - Triage (HEM/LIP/CLOT)  | ACCEPTED| - Tagged as 'UNREVIEWED'         |     |
|   | - Algorithmic Pricing    |         | - Fail-Closed Reject Gate|         | - Westgard 6-Rule IQC Engine     |     |
|   | - Dynamic UPI QR / Cash  |         | - Specimen ACCEPT Gate   |         | - 4-Factor QC Gate (Run/Lot/Cal) |     |
|   | - Sequential GST Invoice |         |   (specimenStatus=ACCPT) |         | - Auto Form Derivation (eGFR/Lip)|     |
|   +--------------------------+         +--------------------------+         +----------------------------------+     |
|                                                                                              |                       |
|                                                                                              | Tested Worklist       |
|                                                                                              v                       |
|   +----------------------------------------------------+         +---------------------------------------+           |
|   |                       SOP-05                       |         |                SOP-04                 |           |
|   |                 Laboratory Director                |         |              Pathologist              |           |
|   |----------------------------------------------------|         |---------------------------------------|           |
|   | - Cold Backup (makeBackup + SHA-256 Manifest)      | Disaster| - Technical Validation Review         |           |
|   | - Hot PostgreSQL Transactional Archiving & PITR    | Recovery| - Unit-Aware Panic Value Detection    |           |
|   | - Cryptographic Pre-Restore Safety Snapshot        | & Audit | - Mandatory Dual-Witness Re-Auth Log  |           |
|   | - PostgreSQL 18 RLS Verification (19 Tables)       |<========| - Historical Delta Check Analysis     |           |
|   | - Append-Only Audit Ledger (trg_audit_ledger_immut)| Ledger  | - Live Bcrypt Re-Auth Sign-Off        |           |
|   | - verifyAuditChain() Traversal                     |         | - Freeze Canonical Report Snapshot    |           |
|   | - Ed25519 Air-Gapped Digital License Audit         |         | - HMAC-SHA256 Digital Seal + QR Token |           |
|   +----------------------------------------------------+         +---------------------------------------+           |
|                                                                                                                      |
+======================================================================================================================+
```

---

## 2. SOP-01: Front-Desk Receptionist & Billing Operator Workflow

### 2.1 Document Control & Statutory Baseline
- **SOP Number**: `SOP-LAB-01`
- **Title**: Front-Desk Patient Onboarding, Demographic Validation, Accessioning, Dynamic Pricing, Payment Processing, and Sequential Tax Invoicing.
- **Regulatory References**:
  * NABL ISO 15189:2022 §7.2.1, §7.2.2 (Information for patients and users; Request form information).
  * Central Goods and Services Tax (CGST) Act, 2017 §31, Rule 46 (Tax Invoice Requirements).
  * National Health Authority (NHA) Ayushman Bharat Digital Mission (ABDM) Patient Demographic Specifications.
  * EU GMP Annex 11 §9 (Audit Trails) & US FDA 21 CFR Part 11 §11.10(e).

### 2.2 Scope & Operational Objective
This Standard Operating Procedure governs the standardized workflow executed by front-desk billing executives, receptionists, out-patient department (OPD) operators, and cashiers across all collection centers and satellite branches. 
The objective is to eliminate demographic errors at the point of entry, prevent duplicate patient records, guarantee mathematical accuracy in financial billing, enforce institutional discount policies, and issue legally compliant tax invoices while generating accession records ready for phlebotomy.

### 2.3 Roles, Responsibilities & Access Level (RACI)
- **Responsible (R)**: Front-Desk Receptionist / Billing Executive (Role: `admin` or designated billing user). Enters patient demographics, adds tests, captures payments, and issues receipts.
- **Accountable (A)**: Operations Manager / Head of Front-Office. Ensures compliance with zero-error demographic capture and daily cash reconciliation.
- **Consulted (C)**: Supervising Medical Officer / Pathologist. Consulted when test codes or test combinations require clinical clarification.
- **Informed (I)**: Phlebotomy Team. Automatically notified via specimen bench queue as soon as an order is accessioned.

### 2.4 Patient Registration & Exact Demographic Validation Protocol
1. **Mandatory Duplicate Search Protocol**:
   - The operator must never register a patient without conducting a search in the master registry.
   - Navigate to the **Reception / OPD** module (`/#opd` or `GET /api/patients?q=...`).
   - Query the search field using the patient's **10-digit mobile number**, **full name**, or previously issued **UHID**.
   - If an existing record matches the patient, the operator must select that profile (`patientId`), verify contact information, and proceed directly to order accessioning.
2. **New Patient Demographic Ingest (`POST /api/patients`)**:
   - If no matching record is retrieved, open the **Register Patient** dialog.
   - **Full Name**: Enter the legal name (minimum 2 characters, title-cased). Strip leading/trailing whitespaces and illegal punctuation.
   - **Biological Sex / Gender**: Select strictly from `Male`, `Female`, or `Other`. *Biological sex is clinically mandatory for gender-specific reference intervals (e.g., Hemoglobin, Serum Creatinine, Serum Ferritin, Uric Acid).*
   - **Exact Age Entry (`normalizeAge()` in `server/services/opdService.js`)**:
     * The operator must record exact chronological age in **Years (0–130)**, **Months (0–11)**, and **Days (0–31)**.
     * The engine strictly validates:
       $$\text{Years} \in [0, 130] \cap \mathbb{Z}, \quad \text{Months} \in [0, 11] \cap \mathbb{Z}, \quad \text{Days} \in [0, 31] \cap \mathbb{Z}$$
     * The system rejects total zero age (`0Y 0M 0D`) with a fail-closed exception: `Error: Exact age cannot be 0Y 0M 0D`.
     * The engine generates a normalized display string: e.g., `42Y 3M 14D`.
   - **Indian Mobile Phone Number (`normalizePhone()` in `server/services/opdService.js`)**:
     * Enter the patient's 10-digit primary mobile telephone number.
     * The system strips all non-digit formatting characters (`()`, `-`, spaces).
     * If 10 digits are provided, it normalizes to E.164 country format: `91XXXXXXXXXX`.
     * If 12 digits starting with `91` are provided, it is accepted as valid.
     * Any number with $< 10$ or $> 12$ digits, or failing the numeric pattern, is rejected fail-closed: `Error: Valid 10-digit Indian mobile number required`.
   - **Referring Physician / Hospital**:
     * Select from registered clinical consultants (`DB.platformRecords` where `entityType='doctor'`) or enter the full name and medical registration number of the external referring clinician. If the patient is self-referred, select `SELF / DIRECT WALKIN`.

### 2.5 Unique Health Identifier (UHID) Allocation & OPD Token Queue
1. Upon submission, the server executes transactional persistence in PostgreSQL:
   ```sql
   INSERT INTO patients (id, tenant_id, uhid, name, gender, age_years, age_months, age_days, phone, ...)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ...)
   ```
2. The server generates an immutable, non-colliding **Unique Health Identifier (UHID)**:
   $$\text{UHID} = \text{APX-PT-} + \text{randomBytes}(4).\text{toUpperCase()}$$
   *(e.g., `APX-PT-9B2F04E1`).*
3. The patient is assigned a daily chronological OPD Token (e.g., `TK-042`) for physical waiting-room queue management.

### 2.6 Dynamic Test Catalog Accessioning & Fast Package Selection
1. Navigate to the **Order Accessioning** section of the active patient record.
2. Query the live tenant test catalog (`GET /api/catalog`). The operator may select:
   - **Individual Diagnostic Tests**: Search by test code (e.g., `CBC`, `CREAT`, `FBS`, `TSH`, `LIPID`, `URINE_RE`).
   - **Pre-Configured Health Packages / Panels**: Select bundle panels via `opdAddPackage()` (e.g., `Executive Health Checkup`, `Diabetic Comprehensive Panel`, `Antenatal Profile`).
3. **Strict Catalog Code Validation**:
   - The server verifies each submitted test code against the active database catalog:
     ```javascript
     const activeCatalog = DB.testCatalog.filter(x => x.active !== false);
     const unknown = requestedCodes.filter(c => !activeCatalog.some(x => x.code === c));
     if (unknown.length > 0) return res.status(400).json({ error: 'Unknown or missing test code', codes: unknown });
     ```
   - Client-side injection of non-catalog or unpriced tests is strictly blocked.
4. **Initial Pipeline Invariants**:
   - Every newly accessioned order is assigned initial status:
     * `pipelineStatus = 'DRAFT'`
     * `specimenStatus = 'PENDING_COLLECTION'`
     * `tests[i].status = 'Pending'`
     * `tests[i].value = 'Pending'`
   - Client attempts to post-fill initial result values or pre-approve QC during registration are purged by the server schema normalizer.

### 2.7 Algorithmic Pricing Engine & Financial Float Safeguards
The billing operator must never manually compute or override item prices. All computations are performed deterministically by `calculatePricing()` in `server/services/opdService.js`:

1. **Gross Amount Computation**:
   $$\text{Gross} = \text{money}\left(\sum_{i=1}^{n} (\text{unitPrice}_i \times \text{qty}_i)\right)$$
   where `money(v)` guarantees two-decimal IEEE-754 financial float precision:
   ```javascript
   function money(v) {
     const n = Number(v);
     return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : 0;
   }
   ```
2. **Discount Calculation**:
   - The engine supports two discount types:
     * **`PERCENTAGE`**:
       $$\text{Discount} = \text{money}\left(\min\left(\text{Gross}, \text{Gross} \times \frac{\min(\text{discountValue}, 100)}{100}\right)\right)$$
     * **`FIXED`**:
       $$\text{Discount} = \text{money}\left(\min\left(\text{Gross}, \text{discountValue}\right)\right)$$
     * **`NONE`**: $\text{Discount} = 0.00$.
3. **Net Payable**:
   $$\text{Net Payable} = \text{money}(\text{Gross} - \text{Discount})$$
   *Net payable is guaranteed to be $\ge 0.00$ and $\le \text{Gross}$.*

### 2.8 Discount Governance, Reason Attestation & Managerial Authorization
1. **Tier 1 Discount ($0\% - 10\%$)**: Front-desk operator is authorized to apply routine institutional discounts (e.g., Senior Citizen, Student). A mandatory selection of `discountReason` must be chosen from the catalog.
2. **Tier 2 Discount ($> 10\%$)**: Requires supervisor authorization. The billing operator must enter the administrator PIN/credential and document the authorized clinical or managerial justification (e.g., `BPL Card Holder`, `Director Courtesy`, `Hospital Staff Family`).
3. **Immutable Audit Trail**: All discount applications and subsequent billing modifications record an audit record in `DB.auditLedger` capturing `actor`, `discountType`, `discountValue`, `discountReason`, and `timestamp`.

### 2.9 Multi-Channel Payment Ingest (Cash Tendered, Dynamic NPCI UPI QR, Card POS)
The operator invokes `calculateDue(net, paid)` to determine payment standing:
1. **Validation Rules**:
   - The paid amount must be non-negative and cannot exceed net payable:
     $$0.00 \le \text{paidAmount} \le \text{Net Payable}$$
   - If $\text{paidAmount} > \text{Net Payable}$, the server throws: `Error: Payment exceeds net payable`.
2. **Derived Payment Status**:
   - $\text{paidAmount} == 0 \implies \text{paymentStatus} = \text{'UNPAID'}$
   - $0 < \text{paidAmount} < \text{Net} \implies \text{paymentStatus} = \text{'PARTIAL'}$
   - $\text{paidAmount} == \text{Net} \implies \text{paymentStatus} = \text{'PAID'}$
   - $\text{balanceDue} = \text{money}(\text{Net} - \text{paidAmount})$.
3. **Payment Modality Execution**:
   - **Modality A: Dynamic NPCI UPI QR Code (`buildUpiUri()` in `opdService.js`)**:
     * When the patient opts for UPI payment, the system constructs a canonical NPCI payment URI:
       ```
       upi://pay?pa=<LAB_UPI_ID>&pn=<LAB_NAME>&am=<AMOUNT>&cu=INR&tn=<INVOICE_NUMBER>
       ```
     * Validates that `upiId` conforms to regex: `/^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,100}$/`.
     * Encodes the URI into a high-density QR code rendered directly on the front-desk dual screen or printed slip.
     * The patient scans via BHIM, Google Pay, PhonePe, or Paytm; the exact transaction reference is captured.
   - **Modality B: Cash Tendered**:
     * The operator enters `tenderedAmount`. The UI calculates change return: $\text{Change} = \text{tenderedAmount} - \text{paidAmount}$.
   - **Modality C: Card / POS Terminal**:
     * The operator swipes/taps card on bank EDC machine and records the 6-to-12-digit Bank Approval / RRN code into `paymentNotes`.

### 2.10 Sequential GST Tax Invoice Generation & Accession Barcode Printing
1. **Monotonic GST Sequence Counter**:
   - Invoices are numbered sequentially via the tenant's atomic database sequence (`sequence_counters` table):
     ```sql
     UPDATE sequence_counters SET next_value = next_value + 1 
     WHERE tenant_id = $1 AND counter_key = 'invoice_seq' 
     RETURNING next_value;
     ```
   - Formats the legal invoice number: e.g., `INV-2026-00842`. Zero gaps or cross-counter collisions are permitted.
2. **Accession Barcode Allocation**:
   - Generates unique accession identifier: `barcode = APX-LAB-` + alphanumeric string (e.g., `APX-LAB-890124`).
3. **Thermal Receipt / Money Receipt Issuance**:
   - The operator prints an A5 or 80 mm thermal receipt containing:
     * Full Laboratory Name, Address, Contact, GSTIN, and NABL Accreditation Number.
     * Patient UHID, Name, Exact Age, Gender, Mobile Number, Referring Doctor.
     * Invoice Number, Date, Time, Billing Cashier ID.
     * Itemized table of diagnostic investigations with individual catalog prices.
     * Gross Total, Discount breakdown, Net Payable, Amount Paid, and Balance Due.
     * Scannable Accession Barcode for instant phlebotomy routing.

### 2.11 Process Flow Diagram (ASCII)

```
[ FRONT-DESK RECEPTIONIST & BILLING WORKFLOW ]
                   |
                   v
     +---------------------------+
     |  Query Master Registry    |  (GET /api/patients?q=phone/name)
     +---------------------------+
                   |
         +---------+---------+
         |                   |
    [Found Existing]    [New Patient]
         |                   |
         v                   v
     Select PT       +---------------------------------------------+
     (patientId)     | Input Legal Demographics:                   |
         |           | - Full Name (min 2 chars)                   |
         |           | - Exact Age: normalizeAge() (Y/M/D)         |
         |           | - Gender: Male / Female / Other             |
         |           | - Phone: normalizePhone() (10-digit -> 91..) |
         |           | - Ref Clinician / Walk-in                   |
         |           +---------------------------------------------+
         |                   |
         |                   v
         |           Generate UHID (`APX-PT-XXXX`)
         +---------> Assign OPD Token (`TK-XX`)
                   |
                   v
     +---------------------------------------------+
     | Accession Diagnostic Investigations         |  (POST /api/orders)
     | - Select Single Tests / Health Packages     |
     | - Verify Active Server Test Catalog Codes   |
     | - Init: pipelineStatus='DRAFT'              |
     |         specimenStatus='PENDING_COLLECTION' |
     +---------------------------------------------+
                   |
                   v
     +---------------------------------------------+
     | Server Algorithmic Pricing Engine           |  (calculatePricing())
     | - Gross = sum(unitPrice * qty)              |
     | - Apply Discount (PERCENTAGE / FIXED)       |
     |   * > 10% requires Admin Authorization      |
     | - Net Payable = Gross - Discount            |
     +---------------------------------------------+
                   |
                   v
     +---------------------------------------------+
     | Multi-Channel Payment Ingest                |  (calculateDue())
     | - Cash Tendered / Card POS / Dynamic UPI QR |
     | - Verify: 0 <= paidAmount <= Net Payable    |
     | - Derive: PAID / PARTIAL / UNPAID           |
     +---------------------------------------------+
                   |
                   v
     +---------------------------------------------+
     | Monotonic GST Sequence Counter              |  (sequence_counters)
     | - Assign Invoice: INV-2026-XXXXX            |
     | - Assign Accession Barcode: APX-LAB-XXXXXX  |
     | - Print Itemized Tax Receipt & Barcode Slip |
     +---------------------------------------------+
                   |
                   v
     Routing to Phlebotomy Collection Bench (SOP-02)
```

### 2.12 Failure Modes, Exceptions & Immutable Audit Event Logging
- **Failure Mode 1: Invalid Age Format**: Entering text, decimal fractions, or zero age (`0Y 0M 0D`) triggers immediate form validation rejection. The operator must record exact verified units.
- **Failure Mode 2: Duplicate Phone Registration**: If a phone number is registered under multiple family members, the system prompts for explicit family member disambiguation while preserving a shared contact reference.
- **Failure Mode 3: Unauthorized Price Tampering**: If a client sends modified item prices in the POST payload, the server discards client prices and computes strictly from `DB.testCatalog`.
- **Audit Logging**: Every action emits an immutable audit event to `DB.auditLedger`:
  * `PATIENT_CREATED`: Captures patient ID, UHID, and actor.
  * `ORDER_CREATED`: Captures order ID, accession barcode, line items, and gross amount.
  * `PAYMENT_RECORDED`: Captures order ID, paid amount, payment mode, and balance due.

### 2.13 Operational Readiness & Verification Checklist
- [ ] Master patient registry search performed before creating new records.
- [ ] Exact age verified and normalized to Years, Months, and Days.
- [ ] 10-digit Indian mobile number validated and prefixed with country code 91.
- [ ] Biological sex correctly recorded for reference interval assignment.
- [ ] Diagnostic test codes verified against active catalog definitions.
- [ ] Gross, discount, and net payable computed via server pricing engine.
- [ ] Discounts exceeding 10% attested with documented administrative reason.
- [ ] Payment captured and reconciled against dynamic UPI QR, Cash, or POS slip.
- [ ] Sequential GST invoice issued with zero sequence gaps.
- [ ] Accession order successfully initialized in `DRAFT` and `PENDING_COLLECTION`.

---

## 3. SOP-02: Phlebotomist & Specimen Collection Procedure

### 3.1 Document Control & Statutory Baseline
- **SOP Number**: `SOP-LAB-02`
- **Title**: Biological Specimen Collection, Positive Patient Identification, Vacutainer Tube Color-Coding, Order of Draw, Deterministic Barcoding, Pre-Analytical Inspection, and Acceptance/Rejection Gates.
- **Regulatory References**:
  * Clinical and Laboratory Standards Institute (CLSI) Standard GP41-A6 (Procedures for the Collection of Diagnostic Blood Specimens by Venipuncture).
  * NABL ISO 15189:2022 §7.2.3, §7.2.4, §7.2.5 (Pre-examination activities, Collection and handling, Specimen reception).
  * World Health Organization (WHO) Guidelines on Drawing Blood: Best Practices in Phlebotomy.
  * Occupational Safety and Health Administration (OSHA) Bloodborne Pathogens Standard (29 CFR 1910.1030).

### 3.2 Scope & Clinical Safety Objective
This Standard Operating Procedure applies to all qualified phlebotomists, medical laboratory technicians, home-collection agents, and nursing staff collecting biological specimens. 
The objective is to enforce positive 2-identifier patient verification, eliminate additive cross-contamination via strict CLSI Order of Draw adherence, generate deterministic Code 128-B barcode labels, perform rigorous physical inspection for pre-analytical interference, and enforce the system's fail-closed specimen acceptance gate (`specimenStatus === 'ACCEPTED'`).

### 3.3 Roles, Responsibilities & Access Level (RACI)
- **Responsible (R)**: Phlebotomist / Collection Technician (Role: `phlebotomist` or `tech`). Performs venipuncture, labels tubes, inspects specimens, records acceptance or rejection.
- **Accountable (A)**: Laboratory Quality Manager & Head Phlebotomist. Ensures 100% adherence to order of draw and verifies rejection metrics.
- **Consulted (C)**: Supervising Pathologist. Consulted when questionable pre-analytical interference (e.g., borderline hemolysis) requires clinical review.
- **Informed (I)**: Patient & Laboratory Analyzer Technicians.

### 3.4 Patient Identification Protocol (Mandatory Dual-Identifier Verification)
1. **Active Positive Identification**:
   - The phlebotomist must never ask passive questions (e.g., *"Are you Ramesh Kumar?"*).
   - The phlebotomist must request the patient to state their full legal name and date of birth or age.
2. **2-Identifier Match Rule**:
   - Compare the verbally stated information against the physical invoice/token slip and the LIMS display screen (`/#specimens`):
     * **Identifier 1**: Full Patient Legal Name.
     * **Identifier 2**: Unique Health Identifier (UHID) or Accession Barcode Number.
   - If any discrepancy is discovered between the patient statement, the wristband/invoice, and the LIMS record, venipuncture is **immediately halted** until resolved by Front-Desk administration.

### 3.5 Vacutainer Tube Color-Coding, Additives & Specimen Matrix Specifications
The LIMS automated routing engine (`tubeForTest()` in `server/services/opdService.js`) maps accessioned test codes to specific vacutainer collection tubes according to defined clinical department rules and chemical additive requirements:

```
+=============================================================================================================================================+
|                                              VACUTAINER TUBE SPECIFICATIONS & CLINICAL PANELS                                                |
+=============================================================================================================================================+
| Tube Color | Tube Code | Chemical Additive / Stopper Matrix | Department / Tests                 | Inversion Count | Fill  | Software Mapping    |
|------------+-----------+------------------------------------+------------------------------------+-----------------+-------+---------------------|
| Light Blue | BLUE      | 3.2% Buffered Sodium Citrate       | Coagulation: PT, INR, APTT,        | 3 – 4 gentle    | EXACT | Automated rule in   |
|            |           | (1:9 anticoagulant-to-blood ratio) | D-Dimer, Fibrinogen                | inversions      | MARK  | tubeForTest()       |
|------------+-----------+------------------------------------+------------------------------------+-----------------+-------+---------------------|
| Red / Gold | SERUM     | Clot Activator & Polymer Gel       | Clinical Biochemistry (LFT, KFT,   | 5 gentle (SST)  | NOM   | SYSTEM DEFAULT      |
|            |           | Separator (SST) / Plain Silica     | Lipids, Routine Glucose), Serology | 0 (Plain glass) | VOL   | Fallback in code    |
|------------+-----------+------------------------------------+------------------------------------+-----------------+-------+---------------------|
| Lavender   | EDTA      | Dipotassium / Tripotassium EDTA    | Hematology: CBC, HbA1c, ESR,       | 8 – 10 gentle   | NOM   | Automated rule in   |
|            |           | (K2EDTA / K3EDTA, 1.8 mg/mL)       | Blood Grouping, Reticulocytes      | inversions      | VOL   | tubeForTest()       |
|------------+-----------+------------------------------------+------------------------------------+-----------------+-------+---------------------|
| Grey       | FLUORIDE  | Sodium Fluoride (glycolytic inhib) | Plasma Glucose (FBS, PPBS, OGTT),  | 8 – 10 gentle   | NOM   | Phlebotomist        |
|            |           | & Potassium Oxalate (anticoagulant)| Blood Alcohol, Blood Lactate       | inversions      | VOL   | Override / Catalog  |
|------------+-----------+------------------------------------+------------------------------------+-----------------+-------+---------------------|
| Sterile Cup| STERILE   | Preservative-Free Sterile Wide-    | Microbiology & Biological Fluids:  | Swirl gently    | > 15  | Automated rule in   |
|            |           | Mouth Polypropylene Container      | Urine Routine, Cultures, Fluids    | to homogenize   | mL    | tubeForTest()       |
+=============================================================================================================================================+
```

#### 3.5.1 LIMS Automated Tube Routing Logic (`opdService.js:tubeForTest()`) & Default Fallback Behavior
To ensure predictable pre-analytical operation, phlebotomists, accession operators, and laboratory technicians must understand the exact programmatic logic executing within `server/services/opdService.js:tubeForTest()`:

```javascript
function tubeForTest(test){
  const dept=String(test.department||'').toLowerCase(), name=String(test.name||'').toLowerCase(), code=String(test.code||'').toUpperCase();
  if(code.includes('PT')||code.includes('INR')||name.includes('prothrombin')||name.includes('coag')) return {sampleType:'CITRATED PLASMA',tubeColor:'LIGHT BLUE',tubeCode:'BLUE'};
  if(dept.includes('hemat')||['CBC','HB','WBC','PLT','PCV','MCV','MCH','MCHC','DLC','ESR'].includes(code)) return {sampleType:'EDTA WHOLE BLOOD',tubeColor:'LAVENDER',tubeCode:'EDTA'};
  if(dept.includes('microbiology')||name.includes('culture')) return {sampleType:'MICROBIOLOGY',tubeColor:'STERILE',tubeCode:'STERILE'};
  if(dept.includes('serology')||dept.includes('immun')) return {sampleType:'SERUM',tubeColor:'RED/GOLD',tubeCode:'SERUM'};
  return {sampleType:'SERUM',tubeColor:'RED/GOLD',tubeCode:'SERUM'};
}
```

**Key Architectural Invariants & Routing Rules**:
1. **Explicit Pattern Matching**: The routing engine inspects test attributes in this exact priority sequence:
   - Coagulation: `code.includes('PT') || code.includes('INR') || name.includes('prothrombin') || name.includes('coag')` $\to$ yields `LIGHT BLUE` (`tubeCode: 'BLUE'`, `sampleType: 'CITRATED PLASMA'`).
   - Hematology: `dept.includes('hemat') || ['CBC','HB','WBC','PLT','PCV','MCV','MCH','MCHC','DLC','ESR'].includes(code)` $\to$ yields `LAVENDER` (`tubeCode: 'EDTA'`, `sampleType: 'EDTA WHOLE BLOOD'`).
   - Microbiology: `dept.includes('microbiology') || name.includes('culture')` $\to$ yields `STERILE` container (`tubeCode: 'STERILE'`, `sampleType: 'MICROBIOLOGY'`).
   - Serology / Immunology: `dept.includes('serology') || dept.includes('immun')` $\to$ yields `RED/GOLD` (`tubeCode: 'SERUM'`, `sampleType: 'SERUM'`).
2. **Default Fallback Behavior (Biochemistry & Glucose)**:
   - Notice that `tubeForTest()` contains **no automatic pattern matching for Grey Fluoride tubes** (e.g. no conditional checks for `code.includes('GLU')`, `code.includes('FBS')`, `code.includes('PPBS')`, or `code.includes('OGTT')`).
   - Any accessioned test that does not trigger one of the four specific branches above falls through directly to line 48:  
     `return {sampleType:'SERUM',tubeColor:'RED/GOLD',tubeCode:'SERUM'};`
   - Consequently, out-of-the-box, all routine Clinical Biochemistry tests — including Fasting Blood Sugar (`FBS`), Post-Prandial Blood Sugar (`PPBS`), Random Blood Sugar (`RBS`), and Oral Glucose Tolerance Tests (`OGTT`) — **default programmatically to Red/Gold SST Serum tubes (`tubeCode: 'SERUM'`)**.
3. **Routing to Grey Fluoride Tubes (Configuration vs Override)**:
   - **Custom Catalog Configuration**: When `makeLabelData(order, patient, catalog)` aggregates labels, it merges catalog attributes:
     `const c=catalog.find(x=>x.code===String(t.code).toUpperCase())||{}; const tube=tubeForTest({...c,...t});`
     If the laboratory director or system administrator configures dedicated plasma glucose catalog records (e.g., test codes `GLU-PLA`, `FBS-F`, `PPBS-F`, or `OGTT-F`) specifying `{ tubeColor: 'GREY', tubeCode: 'FLUORIDE', sampleType: 'FLUORIDE PLASMA' }`, the engine preserves this specification, routing the test to a separate Grey tube barcode label (`LBL-<ORDER_ID>-X`).
   - **Manual Phlebotomist Override**: If tests were booked under generic codes (`FBS`, `PPBS`) that default to Red/Gold SST, the phlebotomist can click **"Override Tube"** in the Phlebotomy Accessioning Console (`/#specimens`) to switch the collection container to `Grey - Sodium Fluoride / Potassium Oxalate` prior to printing barcode labels.

#### 3.5.2 Phlebotomist Standard Operating Procedure: Plasma Glucose (Grey Tube) vs. Serum Glucose (Red/Gold SST)
To eliminate pre-analytical ambiguity and prevent clinically catastrophic diagnostic errors (such as falsely low glucose due to ex-vivo glycolysis or artificial hyperkalemia due to anticoagulant cross-contamination), phlebotomists must follow this comparative protocol.

##### A. Clinical Science: In-Vitro Glycolysis & Pre-Analytical Drift
- **Rate of Glycolytic Depletion**: Following venipuncture, viable erythrocytes, leukocytes, and platelets continue cellular respiration, metabolizing uninhibited blood glucose at an average rate of **$5\% \text{ to } 7\%$ per hour** ($0.3 - 0.6\text{ mmol/L}$ or $5 - 10\text{ mg/dL}$ per hour) at ambient room temperature ($20 - 25^\circ\text{C}$).
- **Amplifying Pathological Conditions**: In specimens with marked leukocytosis (e.g., acute infection, chronic lymphocytic leukemia, AML with WBC $> 25,000/\mu\text{L}$), thrombocytosis, or neonatal erythrocytosis, glycolysis rates can accelerate to $> 12\% \text{ to } 15\%$ per hour.
- **Diagnostic Harm**: If unseparated blood in a plain or SST tube stands uncentrifuged for $> 45 - 60\text{ minutes}$, measured glucose is significantly falsely decreased. This can result in:
  1. Missed diabetes diagnoses (falsely normal fasting values in diabetic patients);
  2. False-negative gestational diabetes mellitus (GDM) screens during OGTT;
  3. Spurious critical panic hypoglycemia flags ($< 45\text{ mg/dL}$), prompting unwarranted IV dextrose administration.
- **Mechanisms of Chemical Action in Grey Vacutainers**:
  * **Sodium Fluoride ($2.5\text{ mg/mL}$)**: Specifically inactivates enolase (phosphopyruvate hydratase), the penultimate enzyme in the Embden-Meyerhof glycolytic pathway. *Crucial Clinical Nuance*: Fluoride inhibition requires 60 to 90 minutes to achieve complete intracellular enzyme inactivation; during the first hour, unchilled specimens may still experience a minor ($2 - 4\text{ mg/dL}$) glucose drop.
  * **Potassium Oxalate ($2.0\text{ mg/mL}$)**: Acts as an anticoagulant by chelating ionized calcium ($Ca^{2+}$), preventing thromboplastin conversion and fibrin clot formation, yielding whole blood/plasma.

##### B. Comparative Clinical Protocol Matrix
```
+=========================================================================================================================================+
|                                    SERUM GLUCOSE (RED/GOLD SST) vs. FLUORIDE PLASMA GLUCOSE (GREY TUBE)                                 |
+=========================================================================================================================================+
| Clinical & Operational Parameter   | Serum Glucose (Red / Gold SST Tube)                  | Plasma Glucose (Grey Vacutainer Tube)               |
+====================================+======================================================+=====================================================+
| System Software Status             | 🟢 AUTOMATED DEFAULT via `tubeForTest()` fallback    | 🟡 REQUIRES Phlebotomist Override or Catalog Mapping|
| Vacutainer Stopper Color           | Red (Plain Silica) or Gold / Yellow (Gel SST)        | Grey (Standard BD Vacutainer / Greiner Bio-One)     |
| Active Chemical Additives          | Clot Activator (micronized silica) + Polymer Gel     | Sodium Fluoride (2.5 mg/mL) + Potassium Oxalate     |
| Biological Matrix Yielded          | Centrifuged Serum (Acellular liquid after clotting)  | Anticoagulated Plasma (Inhibited glycolysis)        |
| Mandatory Clinical Indications     | Core Hospital Laboratory / On-Site Phlebotomy Booth  | Home Collection / Outreach Camps / Transit > 45 min |
| Pre-Centrifugation Window          | Strictly ≤ 30 – 45 minutes from venipuncture to spin | Stable up to 24 – 48 hours without immediate spin   |
| Clotting Period Required           | Mandatory 20 – 30 minutes upright at 20 - 25°C       | ZERO clotting wait; can be centrifuged immediately  |
| Centrifugation Parameters          | 1,800 – 2,200 x g for 10 minutes in swinging bucket  | 1,500 – 2,000 x g for 10 minutes                    |
| Shared Panel Consolidation         | High: Shares single tube with LFT, KFT, and Lipids   | None: Dedicated tube; cannot be shared with KFT/LFT |
| Absolute Contraindications         | NEVER use if courier transit delay > 45 min expected | NEVER use for K+, Ca2+, Amylase, ALP, or BUN tests  |
+=========================================================================================================================================+
```

##### C. Step-by-Step Phlebotomist Decision & Collection Workflow
Phlebotomists must follow this deterministic two-path protocol based on the physical collection environment and transit logistics:

```
                          [ PATIENT ACCESSIONED FOR GLUCOSE INVESTIGATION ]
                                                 |
                                                 v
                       +---------------------------------------------------+
                       | Is specimen collected ON-SITE in Core Hospital Lab|
                       | and guaranteed to be CENTRIFUGED within 30-45 min?|
                       +---------------------------------------------------+
                                         /               \
                                   YES  /                 \  NO (Home collection, outreach camp,
                                       /                   \     courier delay > 45 min, or OGTT)
                                      v                     v
                +-----------------------------+     +-----------------------------------------+
                | PATH A: ROUTINE SERUM FLOW  |     | PATH B: DEDICATED FLUORIDE PLASMA FLOW  |
                +-----------------------------+     +-----------------------------------------+
                | 1. Accept LIMS default Gold |     | 1. In Phlebotomy Console (/#specimens): |
                |    SST label (tubeCode=SERUM|     |    Click "Override Tube" -> Select GREY |
                | 2. Draw Red/Gold tube (Step |     |    (or select catalog code FBS-F/PPBS-F)|
                |    3 in CLSI Order of Draw) |     | 2. Thermal barcode prints with:         |
                | 3. Invert gently 5 times.   |     |    "Tube: GREY | Matrix: FLUORIDE PLASMA"
                | 4. Stand upright 20-30 min  |     | 3. Draw Grey tube LAST (Step 6 in CLSI  |
                |    to allow complete clot.  |     |    Order of Draw, after Lavender EDTA). |
                | 5. Centrifuge 2000g x 10 min|     | 4. Invert IMMEDIATELY 8 - 10 times.     |
                | 6. Verify gel barrier seal. |     | 5. Maintain at 2 - 8°C during transit.  |
                | 7. Route to Biochemistry.   |     | 6. Centrifuge upon arrival; inspect.    |
                +-----------------------------+     +-----------------------------------------+
```

##### D. Critical Pre-Analytical Contamination & Rejection Warnings
1. **Electrolyte Falsification Disaster (Avoid Grey Tube Contamination)**:
   - Potassium Oxalate is a concentrated potassium salt ($2.0\text{ mg/mL}$). Drawing a Grey tube before a serum tube, or needle carryover contamination, causes **massive artificial pseudo-hyperkalemia** ($K^+ > 8.0\text{ mmol/L}$) and **pseudo-hypocalcemia** (oxalate precipitates $Ca^{2+}$, resulting in undetectable calcium $< 3.0\text{ mg/dL}$).
   - *Mandatory Rule*: Always draw Grey vacutainers as the **final tube** in the CLSI order of draw (Step 6).
2. **Enzyme Inhibition Artifacts**:
   - Sodium Fluoride is a potent non-specific enzyme toxin that irreversibly inactivates acid phosphatase, alkaline phosphatase (ALP), amylase, and urease.
   - *Mandatory Rule*: Never aliquot fluoride plasma for general clinical chemistry, liver function tests, or kinetic urea/BUN determinations.
3. **Pre-Analytical Rejection Triggers for Glucose Specimens**:
   - **Code `OTHER`**: Reject unseparated Red/Gold SST blood arriving from external transit exceeding 60 minutes (*"Pre-analytical transit delay exceeding 60 minutes without serum separation; risk of significant in-vitro glycolysis"*).
   - **Code `CLOTTED`**: Reject Grey vacutainers exhibiting visible micro-clots or fibrinous threads (*"Inadequate tube inversion following draw; incomplete oxalate anticoagulation"*).
   - **Code `QNS`**: Reject Grey tubes filled below the nominal vacuum fill line ($> 10\%$ volume deficit) (*"Excessive oxalate/fluoride concentration relative to plasma volume induces hyperosmolar erythrocyte crenation, hemolysis, and dilutional error"*).

### 3.6 CLSI GP41-A6 Compliant Order of Draw Protocol
To prevent cross-contamination of chemical additives between tubes (which causes devastating pre-analytical errors, such as EDTA potassium salts contaminating red/gold serum tubes to cause pseudohyperkalemia and pseudohypocalcemia), blood must be drawn in the strict CLSI order:

```
CLSI ORDER OF DRAW SEQUENCE:
1. Blood Culture Bottles (Sterile Yellow/Silver bottles)
2. Coagulation Tube (Light Blue Cap - Sodium Citrate)
3. Serum Tube with or without Clot Activator / Gel (Red or Gold SST Cap)
4. Heparin Tube with or without Gel Separator (Green Cap, if ordered)
5. EDTA Hematology Tube (Lavender Cap - K2/K3 EDTA)
6. Glycolytic Inhibitor Tube (Grey Cap - Sodium Fluoride / Potassium Oxalate)
```

*Note on Citrate Tubes*: When using a winged blood collection set (butterfly needle), the phlebotomist must first draw a discard tube to prime the tubing dead-space ($0.5\text{ mL}$) before collecting the Light Blue tube. Failure to do so causes under-filling and invalidates coagulation results.

*Note on Glycolytic Inhibitor (Grey) Tubes*: Grey vacutainers containing Sodium Fluoride and Potassium Oxalate must ALWAYS be drawn as the final tube in the CLSI sequence (Step 6, after EDTA). Drawing grey tubes prior to serum or heparin tubes causes needle carry-over of potassium oxalate and sodium fluoride, severely falsifying electrolyte panels (producing lethal pseudo-hyperkalemia and pseudo-hypocalcemia) and inactivating diagnostic enzymes.

### 3.7 Deterministic Code 128-B SVG Barcode Label Generation & Thermal Layout (50 mm × 25 mm)
1. **Label Data Aggregation (`makeLabelData()` in `opdService.js`)**:
   - The system aggregates all ordered tests by their required tube code (`grouped.set(tubeCode)`).
   - Generates one dedicated label per required physical tube:
     * Label 1: `LBL-<ORDER_ID>-1` (e.g., Lavender EDTA for CBC)
     * Label 2: `LBL-<ORDER_ID>-2` (e.g., Gold SST for LFT, KFT, and routine Serum Glucose)
     * Label 3: `LBL-<ORDER_ID>-3` (e.g., Grey Fluoride for Plasma Glucose when overridden or catalog-mapped)
2. **Deterministic Code 128-B Encoding (`code128BSvg()` in `opdService.js`)**:
   - Encodes the alphanumeric accession barcode (`order.barcode`, e.g., `APX-LAB-890124`) using **Code 128 Subset B** (supporting ASCII characters 32 through 126).
   - Evaluates the modulo-103 checksum deterministically:
     $$\text{Checksum} = \left(\text{START\_B (104)} + \sum_{i=1}^{n} (\text{value}_i \times i)\right) \pmod{103}$$
   - Appends stop character `106` and renders vector SVG modules ($1.35\text{ mm}$ module width, $34\text{ mm}$ height, $8\text{ mm}$ quiet zones).
3. **Physical Label Affixing Rules**:
   - Thermal label size: Standard $50\text{ mm} \times 25\text{ mm}$.
   - Contains: Patient Full Name, Exact Age, Gender, UHID, Accession Barcode (Vector + Human Readable), Tube Color/Code, Target Department, Test Code List, and Collection Timestamp.
   - **Affixing Technique**: Affix the label lengthwise along the axis of the vacutainer tube, ensuring the barcode is perfectly vertical and smooth with no creases. Leave a clear visual window on the opposite side to permit specimen inspection.

### 3.8 Specimen Inversion, Centrifugation & Pre-Analytical Bench Inspection
1. **Immediate Inversion**: Immediately after each tube is filled and disengaged from the needle holder, gently invert the tube according to the specification table (never shake vigorously, which induces mechanical hemolysis).
2. **Clotting & Centrifugation Protocol**:
   - Serum tubes (Red / Gold SST) must be allowed to clot completely at room temperature for $20 - 30\text{ minutes}$ in an upright position.
   - Centrifuge serum tubes at $1,800 - 2,200 \times g$ (RCF) for $10\text{ minutes}$ in a calibrated swinging-bucket centrifuge.
   - Inspect the gel barrier: must form an impervious seal separating serum from the packed cell layer.
3. **Pre-Analytical Triage Inspection**:
   - Prior to bench routing, the phlebotomist/technician must visually inspect every tube against standard optical interference indices:
     * **Hemolysis (HEM)**: Pink to deep red coloration of serum/plasma caused by erythrocyte rupture. Releases intracellular Potassium ($K^+$), LDH, AST, and interferes with spectrophotometry.
     * **Icterus (ICT)**: Amber to dark brown coloration caused by bilirubin ($> 2.5\text{ mg/dL}$). Interferes with creatinine and cholesterol assays.
     * **Lipemia (LIP)**: Turbid, milky opalescence caused by elevated triglycerides ($> 400\text{ mg/dL}$). Causes severe light scattering in optical analyzers.
     * **Fibrin Clots (CLOT)**: Fibrin strings or solid micro-clots in EDTA or Citrate blood. Causes analyzer aspiration probe blockage and falsely depresses platelet/cell counts.
     * **Quantity Not Sufficient (QNS)**: Tube filled below nominal line. Alters blood-to-anticoagulant liquid ratios.

### 3.9 Standardized ISO/NABL Specimen Rejection Codes & Recollection Protocol
If any specimen fails pre-analytical triage, the operator must reject it immediately via `POST /api/specimens/reject`:

```
+======================================================================================================================+
|                                    NABL / ISO 15189 SPECIMEN REJECTION CODES                                         |
+======================================================================================================================+
| Rejection Code   | Clinical Criteria / Physical Defect         | Primary Analytes Invalidated | Immediate Action     |
|------------------+---------------------------------------------+------------------------------+----------------------|
| `HEMOLYSIS`      | Pink/red serum; Free Hb > 50 mg/dL          | Potassium, LDH, AST, Iron    | Reject & Recall PT   |
| `ICTERIC`        | Severe dark yellow/brown bilirubin tint     | Creatinine (Jaffe), Lipids   | Document index / dil |
| `LIPEMIA`        | Milky turbidity; Triglycerides > 400 mg/dL  | Electrolytes, Total Protein  | Ultracentrifuge / rec|
| `CLOTTED`        | Visible micro-clots in EDTA / Citrate tube  | Complete Blood Count, PT/INR | Reject & Recollect   |
| `QNS`            | Volume below minimum marking (>10% deficit) | Coagulation ratios, CBC      | Reject & Recollect   |
| `MISLABELED`     | Barcode / name mismatch with patient token  | All clinical investigations  | Reject & Incident Rpt|
| `CONTAINER_LEAK` | Cracked tube, loose cap, blood on exterior  | Biohazard, Sample evaporation| Reject & Recollect   |
| `OTHER`          | Temperature breach, transit delay > 6 hrs   | Glucose, Lactate, Enzymes    | Document reason      |
+======================================================================================================================+
```

**Rejection Execution**:
- The operator selects the appropriate rejection code and indicates whether recollection is requested (`requestRecollection: true`).
- System sets `order.specimenStatus = 'REJECTED'`.
- **FAIL-CLOSED ARCHITECTURAL INVARIANT**: An order with `specimenStatus === 'REJECTED'` is permanently locked:
  * Manual result entry (`PUT /api/orders/:id/results`) is blocked with `HTTP 409`.
  * Machine analyzer result ingest (`POST /api/instrument-results/import`) is blocked with `HTTP 409`.
  * Pathologist report release (`POST /api/orders/:id/release`) is blocked with `HTTP 409`.

### 3.10 Fail-Closed Specimen Acceptance Gate Protocol (`specimenStatus === 'ACCEPTED'`)
1. If the specimen passes all physical and labeling inspection criteria, the operator invokes `POST /api/specimens/accept`.
2. **Parameters Submitted**:
   * `orderId`: Accession order identifier.
   * `tubeCode`: Specific tube verified (e.g., `'EDTA'`, `'SERUM'`, or `'ALL'`).
   * `centrifuged`: Boolean confirmation of centrifugation where applicable.
3. **State Transition**:
   * System sets `order.specimenStatus = 'ACCEPTED'`.
   * Records metadata: `specimen.acceptedBy = req.auth.role`, `acceptedAt = now`, `centrifugeSpeed = '2000g'`, `centrifugeDuration = '10min'`.
   * Appends immutable audit event: `SPECIMEN_ACCEPTED`.
   * **Only upon reaching `specimenStatus === 'ACCEPTED'` is the accession order unlocked and displayed in the Laboratory Technician Processing Worklist (`/#worklist`).**

### 3.11 Process Flow Diagram (ASCII)

```
[ PHLEBOTOMIST & SPECIMEN COLLECTION WORKFLOW ]
                       |
                       v
     +-----------------------------------+
     | Positive Patient Identification   |  (Ask Full Name + DOB)
     | - Compare with Invoice & LIMS     |  (2-Identifier Match: Name + UHID)
     +-----------------------------------+
                       |
                       v
     +-----------------------------------+
     | Retrieve Order Tube Mapping       |  (tubeForTest() in opdService.js)
     | - Light Blue: Sodium Citrate      |  (Automated Coagulation rule)
     | - Lavender: K2/K3 EDTA Whole Blood|  (Automated Hematology rule)
     | - Sterile Cup: Microbiology       |  (Automated Culture rule)
     | - Red/Gold SST: DEFAULT Fallback  |  (Biochemistry & Routine Serum Glucose)
     | * Dedicated Plasma Glucose Flow:  |
     |   Grey: Sodium Fluoride/Oxalate   |  (Phlebotomist Override or Catalog Map)
     +-----------------------------------+
                       |
                       v
     +-----------------------------------+
     | Execute Venipuncture              |  (CLSI GP41-A6 Order of Draw)
     | 1. Blood Cultures -> 2. Citrate   |
     | 3. Serum SST      -> 4. Heparin   |
     | 5. EDTA Hematology-> 6. Fluoride  |
     +-----------------------------------+
                       |
                       v
     +-----------------------------------+
     | Generate & Affix Barcodes         |  (makeLabelData() + code128BSvg())
     | - Thermal 50mm x 25mm Vector SVG  |  (Deterministic Modulo-103)
     | - Vertical Axis Affixing          |
     +-----------------------------------+
                       |
                       v
     +-----------------------------------+
     | Pre-Analytical Bench Triage       |  (Centrifuge Serum 2000g x 10m)
     | Inspect for HEM / LIP / CLOT / QNS|
     +-----------------------------------+
                       |
            +----------+----------+
            |                     |
     [Fails Triage]        [Passes Triage]
            |                     |
            v                     v
+-----------------------+ +---------------------------------------------+
| Reject Specimen       | | Accept Specimen Gate (POST /api/specimens/accept)
| (POST /specimens/reject) | - order.specimenStatus = 'ACCEPTED'         |
| Select 1 of 8 Codes:  | | - Log timestamp, operator, centrifuge params|
| HEMOLYSIS, CLOTTED,   | | - Append Audit: SPECIMEN_ACCEPTED           |
| QNS, MISLABELED, etc. | +---------------------------------------------+
| Fail-Closed Lock      |                 |
| Trigger Recall Order  |                 v
+-----------------------+   Route to Laboratory Technician Bench (SOP-03)
```

### 3.12 Failure Modes, Exceptions & Immutable Audit Event Logging
- **Failure Mode 1: Tube Underfilling (QNS)**: Common in Citrate Blue tubes. The 1:9 ratio is distorted, artificially prolonging clotting times. Phlebotomist must reject with `QNS` and recollect.
- **Failure Mode 2: Inverted Order of Draw**: If EDTA is collected before serum, Potassium EDTA droplets contaminate the serum tube, causing reported Potassium $> 8\text{ mmol/L}$ with unmeasurable Calcium. Phlebotomist must reject and document incident.
- **Failure Mode 3: Pre-Analytical Glycolysis Drift in Unseparated Serum Glucose**: If a glucose specimen is collected in a Red/Gold SST tube and left uncentrifuged for $> 45\text{ minutes}$ (e.g., during transit from remote camps or courier delays), cellular glycolysis decreases glucose concentration by $5 - 7\%$ per hour, causing falsely normal fasting results or spurious hypoglycemia. If processing delay $> 45\text{ minutes}$ is anticipated, phlebotomist must collect in a Grey Fluoride/Oxalate tube (or centrifuge and separate serum on-site within $30 - 45\text{ minutes}$).
- **Failure Mode 4: Inadvertent Use of Grey Fluoride Tube for Electrolytes or Enzymes**: Phlebotomist mistakenly draws a Grey top vacutainer for KFT/Electrolytes or Enzyme panels. Potassium Oxalate releases massive exogenous $K^+$ (causing pseudo-hyperkalemia $> 8.0\text{ mmol/L}$) and chelates $Ca^{2+}$ (causing pseudo-hypocalcemia $< 4.0\text{ mg/dL}$), while Sodium Fluoride destroys amylase, alkaline phosphatase, and urease activity. Specimen must be rejected with code `OTHER` (*"Fluoride/Oxalate contamination in electrolyte or enzyme panel"*) and immediately recollected in Red/Gold SST.
- **Audit Logging**:
  * `SPECIMEN_ACCEPTED`: Records order ID, tube code, accepting user, and timestamp.
  * `SPECIMEN_REJECTED`: Records order ID, rejection code, explanatory notes, and recollection trigger flag.

### 3.13 Operational Readiness & Verification Checklist
- [ ] Active dual-identifier patient verification completed prior to needle insertion.
- [ ] Vacutainer tubes inspected for intact vacuum and valid expiry dates.
- [ ] Appropriate collection tube verified for Glucose investigations: Red/Gold SST for on-site core lab processing (centrifuged ≤ 30-45 min); Grey Fluoride/Oxalate selected via manual override or catalog code for transit > 45 min, outreach camps, home collection, or strict diagnostic OGTT.
- [ ] Winged butterfly discard tube used when drawing Citrate Blue tubes.
- [ ] CLSI Order of Draw strictly maintained across all multi-tube draws (Grey Fluoride vacutainers drawn LAST).
- [ ] Immediate gentle inversion executed (3-4x Blue, 5x SST, 8-10x EDTA/Grey).
- [ ] Code 128-B barcode printed cleanly with scannable quiet zones and affixed vertically.
- [ ] Serum tubes clotted upright for 20-30 min and centrifuged at 2,000 x g for 10 min.
- [ ] Visual inspection confirms absence of hemolysis, icterus, lipemia, and fibrin clots.
- [ ] Non-conforming tubes rejected under standardized NABL codes (`POST /api/specimens/reject`).
- [ ] Conforming tubes formally accepted (`POST /api/specimens/accept`) setting `specimenStatus = 'ACCEPTED'`.

---

## 4. SOP-03: Laboratory Technician, Analyzer Interface & QC Workflow

### 4.1 Document Control & Statutory Baseline
- **SOP Number**: `SOP-LAB-03`
- **Title**: Machine Analyzer Interfacing (ASTM E1381/E1394 & HL7 v2.5 MLLP), Pre-Analytical Ingestion Gates, Internal Quality Control (IQC), Westgard 6-Rule Engine, 4-Factor QC Approval Gate, and Mathematical Formula Auto-Derivation.
- **Regulatory References**:
  * NABL ISO 15189:2022 §7.3.1, §7.3.2, §7.3.7 (Examination processes, Verification of methods, Ensuring validity of results).
  * CLSI C24-A4 (Statistical Quality Control for Quantitative Measurement Procedures: Principles and Definitions).
  * ASTM E1381-02 & E1394-97 (Standard Specifications for Low Level and High Level Protocol to Transfer Messages Between Clinical Laboratory Instruments and Computer Systems).
  * Health Level Seven (HL7) Version 2.5 Standard Protocol Specifications.
  * EU GMP Annex 11 §5 & §6 (Data Input, Accuracy Checks).

### 4.2 Scope & Analytical Precision Objective
This Standard Operating Procedure governs the daily operations of medical laboratory technicians, biomedical instrument engineers, and section supervisors. 
The objective is to establish robust, automated analyzer communication, enforce the fail-closed specimen acceptance gate on all incoming machine data, eliminate data overwrite corruption via strict 1:1 accession test matching and mandatory `'UNREVIEWED'` status tagging, maintain statistical process control via the Westgard 6-rule IQC engine, enforce the 4-factor QC approval gate, and auto-derive complex clinical mathematical formulas without manual calculation errors.

### 4.3 Roles, Responsibilities & Access Level (RACI)
- **Responsible (R)**: Medical Laboratory Technician (Role: `tech`). Operates automated analyzers, reviews imported results, runs daily IQC, investigates Westgard violations, enters manual bench tests, and triggers QC approval.
- **Accountable (A)**: Section Chief / Technical Supervisor. Ensures analyzers are calibrated, reagent lots are tracked, and IQC rules are strictly enforced.
- **Consulted (C)**: Biomedical Service Engineer & Consulting Pathologist. Consulted during calibration drift or out-of-control Westgard rejections.
- **Informed (I)**: Reviewing Pathologists.

### 4.4 Automated Analyzer Connectivity Architecture (ASTM E1381/E1394 & HL7 v2.5 MLLP)
HRGen GIA LIMS provides dual native edge interface servers running concurrently in background daemon processes:

```
+======================================================================================================================+
|                                    AUTOMATED ANALYZER INTERFACE ARCHITECTURE                                         |
+======================================================================================================================+
|  Clinical Chemistry / Hematology / Immunoassay Analyzers (Roche, Sysmex, Beckman, Mindray, Horiba, Abbott, etc.)     |
|                                                  |                                                                   |
|         +----------------------------------------+----------------------------------------+                          |
|         |                                                                                 |                          |
|         v                                                                                 v                          |
|  [ ASTM E1381/E1394 TCP Edge ]                                            [ HL7 v2.5 / MLLP TCP Edge ]               |
|  - Host: 0.0.0.0 | Port: 5000 (`ASTM_PORT`)                               - Host: 0.0.0.0 | Port: 2575 (`MLLP_PORT`) |
|  - Low-Level Handshake: ENQ -> ACK -> STX..ETX -> EOT                     - Framing: VT (0x0B) ... FS (0x1C)+CR(0x0D)|
|  - Checksum: Modulo-256 Sum over Frame                                    - Parsed Segments: MSH, PID, OBR, OBX      |
|  - 1 MB Memory Buffer Guard (`astm.js`)                                   - Deterministic ACK Response (`hl7.js`)    |
|         |                                                                                 |                          |
|         +----------------------------------------+----------------------------------------+                          |
|                                                  |                                                                   |
|                                                  v                                                                   |
|                                [ Edge Quarantine Ingestion Buffer ]                                                 |
|                                                  |                                                                   |
|                                                  v                                                                   |
|                           [ GATE 1: Pre-Analytical Specimen ACCEPTED Check ]                                         |
|                             o.specimenStatus === 'ACCEPTED' (HTTP 409 Fail)                                          |
|                                                  |                                                                   |
|                                                  v                                                                   |
|                           [ GATE 2: Active Tenant Instrument Verification ]                                          |
|                             instrument.active !== false && instrument.tenantId match                                 |
|                                                  |                                                                   |
|                                                  v                                                                   |
|                           [ GATE 3: Strict 1:1 Accession Test Set Matching ]                                         |
|                             incomingCodes.sort() === accessionCodes.sort()                                           |
|                             (Rejects partial, extra, or omitted tests fail-closed)                                   |
|                                                  |                                                                   |
|                                                  v                                                                   |
|                           [ Transform & Tag Incoming Values ]                                                        |
|                             status: 'UNREVIEWED' | source: 'INSTRUMENT'                                              |
|                             pipelineStatus: 'RESULTS_ENTERED' | qcPassed: false                                      |
+======================================================================================================================+
```

1. **ASTM E1381/E1394 Edge Server (`server/integrations/astm.js`)**:
   - Listens on TCP port `5000` (configurable via environment variable `ASTM_PORT`).
   - Implements bi-directional byte-level transmission:
     * Receives `ENQ (0x05)`: Responds with `ACK (0x06)`.
     * Receives Frame: `STX (0x02)` + Sequence + Text + `ETX (0x03)` / `ETB (0x17)` + 2-Hex Checksum + `CRLF`.
     * Computes frame checksum: $\sum (\text{byte}) \pmod{256}$, formatted as 2-character uppercase hex.
     * Enforces `maxBufferBytes = 1048576` (1 MB) to protect against memory exhaustion attacks.
     * Receives `EOT (0x04)`: Transmits `ACK` and flushes accumulated records to `parseASTM()`.
     * Parses Header (`H`), Patient (`P`), Order (`O`), and Result (`R`) records.
2. **HL7 v2.5 / MLLP Edge Server (`server/integrations/mllpEdge.js` & `hl7.js`)**:
   - Listens on TCP port `2575` (configurable via environment variable `MLLP_PORT`).
   - Implements Minimal Lower Layer Protocol (MLLP) framing:
     * Prefix: Vertical Tab `VT (0x0B)`.
     * Suffix: File Separator `FS (0x1C)` followed by Carriage Return `CR (0x0D)`.
   - Parses segments: `MSH` (Header), `PID` (Patient), `OBR` (Observation Request), and `OBX` (Observation Result).
   - Generates deterministic HL7 Acknowledgement frame: `MSH|^~\&|HRGEN|LIS... \r MSA|AA|<ControlID>\r`.

### 4.5 Machine Result Ingestion Gate: Fail-Closed Specimen Check & Strict 1:1 Accession Matching
When raw machine results are submitted to `POST /api/instrument-results/import`:
1. **Pre-Analytical Gate Enforcement**:
   ```javascript
   if (o.specimenStatus !== 'ACCEPTED') {
     return res.status(409).json({ 
       error: 'Pre-analytical gate blocked: specimen must be ACCEPTED before analyzer result import.' 
     });
   }
   ```
   *Any import attempt on a specimen that is PENDING_COLLECTION or REJECTED is rejected immediately with HTTP 409.*
2. **Strict 1:1 Accession Test Set Matching**:
   ```javascript
   const accessionCodes = (o.tests || []).map(t => String(t.code || '').trim().toUpperCase()).sort();
   const incomingCodes = results.map(t => String(t?.code || '').trim().toUpperCase()).sort();
   if (incomingCodes.some(x => !x) || 
       new Set(incomingCodes).size !== incomingCodes.length || 
       incomingCodes.length !== accessionCodes.length || 
       incomingCodes.some((x, i) => x !== accessionCodes[i])) {
     return res.status(409).json({
       error: 'Analyzer result codes must exactly match the accession test set; omitted, extra, or duplicate tests are rejected.',
       expected: accessionCodes,
       received: incomingCodes
     });
   }
   ```
   *If an analyzer attempts to transmit a partial test set (e.g., 4 tests out of a 6-test KFT panel) or unsolicited extraneous test channels, the import is strictly rejected with HTTP 409.*

### 4.6 Mandatory `'UNREVIEWED'` Status Tagging & Catalog Metadata Preservation
To protect clinical safety and prevent destructive data overwriting, the server maps incoming values into the existing accession tests without destroying reference intervals, units, or pricing:
```javascript
o.tests = (o.tests || []).map(t => {
  const r = incoming.get(String(t.code || '').trim().toUpperCase());
  return {
    ...t,
    value: String(r.value ?? 'Pending'),
    status: 'UNREVIEWED',
    method: String(r.method || `Automated Analyzer (${instrument.name || instrument.id})`),
    source: 'INSTRUMENT',
    instrumentId: instrument.id
  };
});
o.pipelineStatus = 'RESULTS_ENTERED';
o.qcPassed = false;
o.qc = null;
```
*Key Invariants*:
- Every machine-imported result is explicitly marked `status = 'UNREVIEWED'`.
- The order transitions to `RESULTS_ENTERED`.
- `qcPassed` is reset to `false`. No test can skip technician review.

### 4.7 Internal Quality Control (IQC) Protocol & Reagent Aliquot Preparation
1. **Daily IQC Schedule**:
   - At the beginning of each 8-hour shift, before analyzing patient specimens, technicians must run two levels of assayed control materials (Level 1 Normal and Level 2 Pathological/Abnormal).
   - Control materials must be reconstituted with calibrated volumetric pipettes using analytical-grade deionized water and equilibrated at room temperature for $30\text{ minutes}$.
2. **IQC Run Execution (`POST /api/qc/evaluate`)**:
   - The technician enters the control assay value, target mean, and standard deviation ($\sigma$) into the LIMS QC module (`/#qc`).

### 4.8 Statistical Westgard 6-Rule Evaluation Engine ($1_{2s}, 1_{3s}, 2_{2s}, R_{4s}, 4_{1s}, 10_x$)
The deterministic Westgard engine (`server/services/westgard.js`) computes standard Z-scores:
$$Z = \frac{x - \text{Mean}}{\text{SD}}$$
and evaluates the chronological series using **strict exceedance thresholding** (a value exactly on the limit does not trigger a violation):

```
+======================================================================================================================+
|                                        WESTGARD 6-RULE EVALUATION MATRIX                                             |
+======================================================================================================================+
| Rule Symbol | Mathematical Condition                        | Error Type Flagged   | Action / Status                 |
|-------------+-----------------------------------------------+----------------------+---------------------------------|
| $1_{2s}$    | $|Z_{\text{last}}| > 2$                       | Random / Systematic  | WARNING (Analytical run permits |
|             |                                               | Early Warning        | conditional continuation)       |
|-------------+-----------------------------------------------+----------------------+---------------------------------|
| $1_{3s}$    | $|Z_{\text{last}}| > 3$                       | Random Error         | REJECT / FAIL                   |
|             |                                               |                      | (Immediate run halt)            |
|-------------+-----------------------------------------------+----------------------+---------------------------------|
| $2_{2s}$    | $|Z_n| > 2 \land |Z_{n-1}| > 2$               | Systematic Error     | REJECT / FAIL                   |
|             | with $\text{sign}(Z_n) == \text{sign}(Z_{n-1})$|                      | (Immediate run halt)            |
|-------------+-----------------------------------------------+----------------------+---------------------------------|
| $R_{4s}$    | Within-Run Paired Controls:                   | Random Error         | REJECT / FAIL                   |
|             | $(Z_1 > 2 \land Z_2 < -2) \lor$               |                      | (Immediate run halt;            |
|             | $(Z_2 > 2 \land Z_1 < -2)$                    |                      | within-run controls differ > 4s)|
|-------------+-----------------------------------------------+----------------------+---------------------------------|
| $4_{1s}$    | Last 4 consecutive points $|Z| > 1$          | Systematic Bias      | REJECT / FAIL                   |
|             | on the same side of the mean                  |                      | (Immediate run halt)            |
|-------------+-----------------------------------------------+----------------------+---------------------------------|
| $10_x$      | Last 10 consecutive points lie strictly on    | Systematic Drift     | REJECT / FAIL                   |
|             | one side of the mean ($Z > 0 \lor Z < 0$)     |                      | (Immediate run halt)            |
+======================================================================================================================+
```

*Status Outcomes*:
- If any rejection rule triggers $\implies \text{status} = \text{'FAIL'}$.
- If only $1_{2s}$ triggers $\implies \text{status} = \text{'WARNING'}$.
- If no rules trigger $\implies \text{status} = \text{'PASS'}$.

### 4.9 Multi-Factor Order QC Approval Gate (Run, Instrument, Lot, Calibration)
To advance an accession order from `RESULTS_ENTERED` to `QC_APPROVED` (`POST /api/qc/approve/:orderId`), the technician must satisfy **4 independent physical verification factors** enforced server-side:

```javascript
// Factor 1: Passing IQC Run
const run = DB.qcRuns.find(r => r.id === qcRunId);
if (!run || run.status !== 'PASS') 
  return res.status(409).json({ error: 'A passing IQC evaluation is required' });

// Factor 2: Instrument Match
if (run.instrumentId !== instrument.id) 
  return res.status(409).json({ error: 'QC run instrument must match order instrument' });

// Factor 3: Accession Test Code Match
const orderCodes = new Set((o.tests || []).map(t => String(t.code || '').trim().toUpperCase()));
if (!orderCodes.has(String(run.testCode || '').trim().toUpperCase())) 
  return res.status(409).json({ error: 'QC run test code must be present in the accession test set' });

// Factor 4: Valid Active Reagent Lot & Passing Calibration
const lot = DB.reagentLots.find(l => l.id === reagentLotId && l.instrumentId === instrument.id);
if (!lot || lot.status !== 'ACTIVE' || (lot.expiresAt && new Date(lot.expiresAt) < new Date()))
  return res.status(409).json({ error: 'Active, non-expired reagent lot registered to instrument is required' });

const cal = DB.calibrations.find(c => c.id === calibrationId && c.instrumentId === instrument.id);
if (!cal || cal.status !== 'PASS' || !cal.evidenceRef)
  return res.status(409).json({ error: 'Passing calibration with valid evidenceRef required' });
```
*Upon successful verification*:
- Sets `order.pipelineStatus = 'QC_APPROVED'`, `order.qcPassed = true`.
- Records complete traceability metadata linking the exact `qcRunId`, `reagentLotId`, and `calibrationId`.

### 4.10 Automated Mathematical Formula Derivation Engines (CKD-EPI 2021 eGFR, Friedewald Lipids, FIB-4)
Technicians must never perform manual mathematical calculations or transcribe external calculator outputs. The reactive formula engine (`server/services/formulaEngine.js`) auto-derives dependent parameters:

1. **CKD-EPI 2021 eGFR (Estimated Glomerular Filtration Rate)**:
   - Evaluated automatically when Serum Creatinine (`CREAT`) is entered:
     $$\text{eGFR} = 142 \times \min(S_{cr}/\kappa, 1)^\alpha \times \max(S_{cr}/\kappa, 1)^{-1.200} \times 0.9938^{\text{Age}} \times [1.012\text{ if Female}]$$
   - Parameter constants:
     * Female: $\kappa = 0.7$, $\alpha = -0.241$, Gender Factor $= 1.012$.
     * Male: $\kappa = 0.9$, $\alpha = -0.302$, Gender Factor $= 1.000$.
   - KDIGO 2021 Compliance: Excludes race coefficient entirely. Rounded to one decimal place.
2. **Friedewald Lipid Fractions**:
   - Auto-derived from Total Cholesterol (`CHOL`), HDL, and Triglycerides (`TG`):
     $$\text{VLDL} = \frac{\text{TG}}{5}$$
     $$\text{LDL} = \text{CHOL} - \text{HDL} - \frac{\text{TG}}{5} \quad (\text{Calculated strictly when } \text{TG} < 400\text{ mg/dL})$$
     $$\text{Cholesterol / HDL Ratio} = \frac{\text{CHOL}}{\text{HDL}}$$
   - If $\text{TG} \ge 400\text{ mg/dL}$, the Friedewald LDL calculation is automatically suppressed, and the system appends a clinical note: *"Direct LDL assay required; Friedewald calculation invalid at Triglycerides $\ge 400\text{ mg/dL}$."*
3. **FIB-4 Liver Fibrosis Index**:
   - Auto-derived from Age, AST, ALT, and Platelet count:
     $$\text{FIB-4} = \frac{\text{Age (years)} \times \text{AST (U/L)}}{\text{Platelet count } (10^9/\text{L}) \times \sqrt{\text{ALT (U/L)}}}$$
4. **Bilirubin Fractions**:
   $$\text{Indirect Bilirubin} = \text{Total Bilirubin} - \text{Direct Bilirubin}$$
Derived parameters are tagged with `isAutoDerived: true` and documented with their exact formula methodology string.

### 4.11 Process Flow Diagram (ASCII)

```
[ LABORATORY TECHNICIAN & ANALYZER QC WORKFLOW ]
                       |
                       v
     +-----------------------------------+
     | Daily IQC Evaluation              |  (POST /api/qc/evaluate)
     | - Run Level 1 & Level 2 Controls  |
     | - Evaluate Westgard 6-Rule Engine |
     |   * 1_2s (Warning)                |
     |   * 1_3s, 2_2s, R_4s, 4_1s, 10x   |
     +-----------------------------------+
                       |
            +----------+----------+
            |                     |
     [Status: FAIL]        [Status: PASS]
            |                     |
            v                     v
+-----------------------+ +---------------------------------------------+
| Halt Patient Testing  | | Automated Analyzer Ingest                   |
| Execute CAPA Runbook  | | - ASTM Port 5000 / HL7 Port 2575            |
| Check Reagent/Tubing  | | - Ingest Gate: specimenStatus === 'ACCEPTED'|
| Recalibrate Analyzer  | | - Gate: Exact 1:1 Accession Test Match      |
+-----------------------+ | - Tag Incoming: status = 'UNREVIEWED'       |
                          +---------------------------------------------+
                                          |
                                          v
                          +---------------------------------------------+
                          | Reactive Mathematical Formula Derivation    |
                          | (deriveCalculatedTests() in formulaEngine)  |
                          | - CKD-EPI 2021 eGFR (from Creatinine + Age) |
                          | - Friedewald LDL, VLDL, Chol/HDL Ratio      |
                          | - FIB-4 Liver Fibrosis Risk Index           |
                          +---------------------------------------------+
                                          |
                                          v
                          +---------------------------------------------+
                          | 4-Factor QC Approval Gate                   |
                          | (POST /api/qc/approve/:orderId)             |
                          | Factor 1: Passing IQC Run (status === 'PASS')|
                          | Factor 2: Instrument ID Match               |
                          | Factor 3: Accession Test Code Match         |
                          | Factor 4: Active Lot + Valid Calibration    |
                          +---------------------------------------------+
                                          |
                                          v
                            Advance to Pathologist Cockpit (SOP-04)
                            (pipelineStatus = 'QC_APPROVED')
```

### 4.12 Non-Conformance, Out-of-Control Corrective Actions (CAPA) & Audit Event Logging
- **Out-of-Control Action Plan**:
  1. Immediately suspend all clinical testing for affected analytes on that instrument.
  2. Inspect reagent onboard stability, lot number, volume, and storage temperature.
  3. Inspect instrument optics, tubing, fluidics, and waste lines.
  4. Thaw and reconstitute a fresh aliquot of control material and repeat assay.
  5. If the re-run fails, perform full multipoint instrument recalibration (`POST /api/calibrations`).
  6. Document the corrective and preventive action in the LIMS incident registry.
- **Audit Logging**:
  * `QC_EVALUATED`: Records run ID, test code, target, SD, calculated Z-scores, and Westgard rule status.
  * `QC_APPROVED`: Records order ID, approving technician, instrument, reagent lot, and calibration reference.
  * `INSTRUMENT_RESULT_IMPORT`: Records order ID, instrument ID, and message control ID.

### 4.13 Operational Readiness & Verification Checklist
- [ ] ASTM (Port 5000) and HL7 MLLP (Port 2575) listeners verified active in background.
- [ ] Daily Level 1 and Level 2 IQC controls run and evaluated via Westgard engine.
- [ ] Out-of-control Westgard alerts resolved with documented CAPA before specimen processing.
- [ ] Machine import verifies `specimenStatus === 'ACCEPTED'` prior to ingestion.
- [ ] Machine import verifies exact 1:1 match with accession test codes.
- [ ] Imported results verified with `status = 'UNREVIEWED'` and `source = 'INSTRUMENT'`.
- [ ] Auto-derived formulas (eGFR, Lipids, FIB-4) verified for mathematical consistency.
- [ ] 4-factor QC approval verified (Passing Run, Instrument match, Valid Lot, Valid Calibration).
- [ ] Order successfully advanced to `QC_APPROVED`.

---

## 5. SOP-04: Pathologist Clinical Validation, Panic Value Handling & Report Sign-Off

### 5.1 Document Control & Statutory Baseline
- **SOP Number**: `SOP-LAB-04`
- **Title**: Clinical Report Validation, Unit-Aware Critical / Panic Alert Management, Historical Delta Check Analysis, Verbal Readback Logging, Pathologist Electronic Sign-Off, Canonical Report Freezing, and HMAC-SHA256 Digital Sealing.
- **Regulatory References**:
  * NABL ISO 15189:2022 §7.4.1, §7.4.2 (Reporting of results, Review and release of results).
  * National Medical Commission (NMC) / Medical Council of India (MCI) Code of Medical Ethics Regulations.
  * US FDA 21 CFR Part 11 §11.50 & §11.200 (Signature manifestations, Electronic signature components).
  * Joint Commission International (JCI) International Patient Safety Goals (IPSG.2: Improve Effective Communication).
  * EU GMP Annex 11 §14 (Electronic Signatures).

### 5.2 Scope & Diagnostic Governance Objective
This Standard Operating Procedure governs the clinical decision-making workflow executed exclusively by authorized Consulting Pathologists, Section Chiefs, and Laboratory Medical Directors. 
The objective is to mandate comprehensive clinical review, enforce unit-aware life-threatening panic limits, execute longitudinal delta checks against patient history, require dual-witness bcrypt re-authentication for critical communication, enforce live pathologist re-authentication for electronic report sign-off, freeze canonical immutable report snapshots, and seal reports with HMAC-SHA256 digital signatures and public verification QR codes.

### 5.3 Roles, Responsibilities & Access Level (RACI)
- **Responsible (R)**: Consulting Pathologist (Role: `pathologist`). Reviews clinical correlations, verifies delta checks, conducts critical verbal readbacks, re-authenticates to electronically sign reports, and authorizes report release.
- **Accountable (A)**: Head of Pathology / Laboratory Medical Director. Legally accountable for diagnostic accuracy and clinical governance under MCI/NMC regulations.
- **Consulted (C)**: Treating / Referring Clinician. Contacted immediately during critical panic breaches.
- **Informed (I)**: Patient, Clinic Administration, and Phlebotomy Bench.

### 5.4 Technical Validation Gate Checks & Worklist Review Cockpit
1. The pathologist opens the **Pathologist Review Cockpit** (`/#pathology`).
2. The cockpit displays all orders in `pipelineStatus === 'QC_APPROVED'`.
3. **Execution of Technical Validation (`POST /api/orders/:id/validate`)**:
   - Access is restricted strictly to authenticated `pathologist` and `admin` roles.
   - The validation engine executes automated integrity checks:
     * Verifies that every accession test contains a non-blank, non-pending numerical or textual value.
     * Verifies that all test codes match active server catalog records and retain explicit methodology strings.
     * Verifies that QC status is confirmed (`qcPassed === true`).
     * Verifies that any flagged critical panic values have been acknowledged (`criticalValueAcknowledged === true`).
   - Order pipeline status transitions to `pipelineStatus: 'VALIDATED'`.
   - Records `validatedBy = req.auth.role`, `validatedAt = now`.

### 5.5 Unit-Aware Critical / Panic Limits Table & Immediate Flagging
The system evaluates all entered test results against the unit-aware panic matrix (`PANIC_LIMITS` and `evaluatePanic()` in `server.js`). If a result breaches defined thresholds, the system flags `isPanic = true` and `status = 'Critical'`:

```
+======================================================================================================================+
|                                  UNIT-AWARE CRITICAL PANIC ALERT THRESHOLDS                                          |
+======================================================================================================================+
| Analyte / Test Code  | Canonical Unit | Low Panic Limit | High Panic Limit | Life-Threatening Pathophysiology        |
|----------------------+----------------+-----------------+------------------+-----------------------------------------|
| Serum Potassium (`K`)| mmol/L         | < 2.5           | > 6.5            | Fatal cardiac arrest, ventricular fib   |
| Serum Sodium (`NA`)  | mmol/L         | < 120           | > 160            | Cerebral edema, herniation, coma        |
| Serum Calcium (`CA`) | mg/dL          | < 6.0           | > 13.0           | Tetany, laryngospasm, hypercalc. crisis |
| Blood Glucose (`FBS`)| mg/dL          | < 45            | > 450            | Hypoglycemic coma, severe DKA / HHS     |
| Hemoglobin (`HB`)    | g/dL           | < 7.0           | > 20.0           | Severe myocardial ischemia, hypovolemia |
| Platelet Count (`PLT`)| 10^3 / uL     | < 20            | > 1,000          | Spontaneous intracranial bleed, thromb  |
| Coagulation (`INR`)  | Ratio          | —               | > 5.0            | Spontaneous fatal internal hemorrhage   |
| Creatinine (`CREAT`) | mg/dL          | —               | > 4.0 / 10.0     | Acute renal shutdown, anuria, uremia    |
+======================================================================================================================+
```

*Unit-Aware Safety Rule*: If the recorded unit does not exactly match the canonical unit configured in `PANIC_LIMITS`, `evaluatePanic()` marks `source = 'UNIT_MISMATCH_OR_NON_NUMERIC'` and demands technician unit reconciliation, preventing false negative panic dismissals.

### 5.6 Historical Delta Check Comparison Engine & Biological Drift Screening
1. **Delta Check Trigger (`POST /api/orders/:id/delta-check`)**:
   - The engine queries the patient's previous validated or released orders (`findLatestComparable()`):
   - Computes percentage change:
     $$\Delta\% = \frac{|\text{Current Value} - \text{Previous Value}|}{\text{Previous Value}} \times 100$$
2. **Review Action Thresholds**:
   - For analytes with narrow intra-individual biological variation (Creatinine, Potassium, Hemoglobin):
     * If $\Delta\% > 30\%$ within $30\text{ days}$, the system sets `status = 'REVIEW'`.
   - **RELEASE GATE LOCK**: If any delta check flags `status === 'REVIEW'`, report release is blocked unless the pathologist explicitly attests clinical review by submitting `deltaReviewed: true` in the release payload.

### 5.7 Verbal Readback Communication & Dual-Witness Bcrypt Re-Authentication Protocol
Under international patient safety goals (IPSG.2 and ISO 15189 §7.4.2), critical panic values must be communicated immediately to the treating clinical caregiver with verbal readback:
1. **Critical Communication Endpoint (`POST /api/orders/:id/critical-communication`)**:
   - Mandatory parameters: `testName`, `recipient` (Attending Physician Name & Telephone), `method` (`PHONE` or `IN_PERSON`), `communicatedAt`, `readBack` (`YES_VERIFIED`), `notes`.
2. **Dual-Witness Re-Authentication (`server.js:876-905`)**:
   - **Primary Clinician Re-Authentication**:
     * The pathologist or supervising technician enters their password.
     * Verified via: `bcrypt.compare(password, signer.passwordHash)`.
   - **Secondary Witness Re-Authentication**:
     * A second staff member enters their username (`witnessUser`) and password (`witnessPassword`).
     * Verified via: `bcrypt.compare(witnessPassword, witnessAccount.passwordHash)`.
   - System constructs immutable `dualAuthorization` metadata:
     ```json
     {
       "primarySigner": "Dr. Rajesh Sharma, MD (Path)",
       "primaryRole": "pathologist",
       "reauthenticated": true,
       "witness": "CLINICIAN_READBACK (Dr. Anita Verma, ICU Reg 45912)",
       "witnessRole": "READBACK_RECEIVING_CLINICIAN",
       "timestamp": "2026-10-18T02:15:00.000Z"
     }
     ```
   - Sets `t.criticalValueAcknowledged = true`.
   - Appends audit event: `CRITICAL_RESULT_COMMUNICATED`.

### 5.8 Pathologist Electronic Sign-Off Protocol, Live Re-Authentication & MCI Registration Logging
1. **Sign-Off Endpoint (`POST /api/orders/:id/signoff`)**:
   - Restricted strictly to authenticated users with `role: 'pathologist'`.
   - Prerequisites: Order must be in `pipelineStatus === 'VALIDATED'`.
2. **Cryptographic Re-Authentication**:
   - The pathologist must re-enter their secret password.
   - Verified server-side via `bcrypt.compare(suppliedPassword, signer.passwordHash)`. Bypasses or saved session overrides are strictly impossible.
3. **MCI Registration & Credential Binding**:
   - The system retrieves the pathologist's statutory Medical Council of India (MCI) or State Medical Council Registration Number (e.g., `MCI-34821`).
   - Generates a unique, non-colliding digital signature identifier:
     $$\text{signatureId} = \text{rid('SIG')} \quad (\text{e.g., } \text{SIG-9DF42A8C10B24F11})$$
   - Records `signatureMethod = 'REAUTHENTICATED_SERVER_CREDENTIAL'`.
   - Stores `order.signoff = { pathologist, pathologistMci, pathologistTime, signatureId, dualCredential, ... }`.
   - Appends audit event: `PATHOLOGIST_SIGNOFF`.

### 5.9 Canonical Report Snapshot Freezing (Letterhead, Profile, Demographics)
Upon invoking report release (`POST /api/orders/:id/release`):
1. **The Pre-Analytical Specimen Gate Double-Check**:
   ```javascript
   if (order.specimenStatus !== 'ACCEPTED') 
     return res.status(409).json({ error: 'Pre-analytical gate blocked: accepted specimen evidence is required before release.' });
   if (!order.signoff) 
     return res.status(409).json({ error: 'Pathologist sign-off is required before release' });
   ```
2. **Freezing the Canonical Snapshot (`canonicalReleasedSnapshot()` in `server.js`)**:
   - The server creates a deep, frozen clone of the report state containing:
     * Patient Demographics (UHID, Name, Normalized Exact Age, Gender, Phone).
     * Order Accession Data (Barcode, Invoice Number, Accession Timestamp).
     * Itemized Clinical Tests (Code, Name, Value, Unit, Reference Interval, Method, Status, Panic Flag).
     * Signing Pathologist Credentials (Name, MCI Number, Signature ID, Timestamp).
     * **Active Laboratory Letterhead Branding**: Copies the active Lab Name, NABL Reg, Address, Phone, Email, and Official Logos directly into the snapshot.
   - *Immutability Invariant*: Any subsequent administrative updates to clinic letterhead, doctor names, or test catalog prices do **not** alter historically released reports.

### 5.10 Cryptographic HMAC-SHA256 Digital Sealing & Public Verification QR Code
1. **HMAC-SHA256 Digital Seal (`releasedReportHash()` in `server.js`)**:
   - Computes a cryptographic digital seal over the canonical snapshot using the server `AUTH_SECRET`:
     $$\text{reportHash} = \text{crypto.createHmac('sha256', AUTH\_SECRET)}.\text{update}(\text{canonicalSnapshot}).\text{digest('hex')}$$
   - Stores `order.reportSnapshotHashAlgorithm = 'HMAC-SHA256'`.
   - Stores `order.reportHash = reportHash`.
2. **High-Entropy Public Verification Token**:
   - Generates a 192-bit URL-safe base64 cryptographic token:
     $$\text{verificationToken} = \text{crypto.randomBytes}(24).\text{toString('base64url')}$$
   - Constructs public verification URL: `https://<DOMAIN>/verify/<verificationToken>`.
   - Renders a high-resolution scannable QR Code Data URL (`QRCode.toDataURL()`) embedded directly on the final printable diagnostic report.
3. **Automated WhatsApp Notification**:
   - If the patient has a valid mobile number, the system automatically dispatches a WhatsApp release announcement with direct report download and verification links.
   - Order pipeline status completes: `pipelineStatus: 'RELEASED'`.
   - Appends audit event: `REPORT_RELEASED`.

### 5.11 Process Flow Diagram (ASCII)

```
[ PATHOLOGIST CLINICAL VALIDATION & SIGN-OFF WORKFLOW ]
                          |
                          v
        +-----------------------------------+
        | Review Cockpit (/#pathology)      |  (pipelineStatus === 'QC_APPROVED')
        | - Inspect All Test Results        |
        +-----------------------------------+
                          |
                          v
        +-----------------------------------+
        | Critical Panic Screening          |  (evaluatePanic() in server.js)
        | - Unit-Aware Limit Table Check    |
        | - Flags: isPanic=true / Critical  |
        +-----------------------------------+
                          |
               +----------+----------+
               |                     |
        [Panic Triggered]     [No Panic Values]
               |                     |
               v                     |
+------------------------------+     |
| Verbal Readback Log          |     |
| (POST /critical-communication)|    |
| - Attending Physician Name   |     |
| - Readback: YES_VERIFIED     |     |
| - Bcrypt Dual Re-Auth Witness|     |
+------------------------------+     |
               |                     |
               +----------+----------+
                          |
                          v
        +-----------------------------------+
        | Historical Delta Check Engine     |  (POST /api/orders/:id/delta-check)
        | - Compare with Prior Orders       |
        | - If Delta > 30% -> status=REVIEW |
        | - Requires deltaReviewed: true    |
        +-----------------------------------+
                          |
                          v
        +-----------------------------------+
        | Technical Validation Gate         |  (POST /api/orders/:id/validate)
        | - Verify all tests non-pending    |
        | - Set: pipelineStatus='VALIDATED' |
        +-----------------------------------+
                          |
                          v
        +-----------------------------------+
        | Pathologist Electronic Sign-Off   |  (POST /api/orders/:id/signoff)
        | - Restricted to 'pathologist' role|
        | - Live Bcrypt Password Re-Auth    |
        | - Capture MCI Reg Number          |
        | - Issue Signature ID (SIG-XXXXX)  |
        +-----------------------------------+
                          |
                          v
        +-----------------------------------+
        | Final Release Gate Protocol       |  (POST /api/orders/:id/release)
        | - Pre-Analytical Gate Check:      |
        |   specimenStatus === 'ACCEPTED'   |
        | - Freeze Canonical Report Snapshot|
        | - Seal HMAC-SHA256 Digital Hash   |
        | - Generate QR Verification Token  |
        | - Auto-Dispatch WhatsApp Notice   |
        | - Set: pipelineStatus = 'RELEASED'|
        +-----------------------------------+
```

### 5.12 Failure Modes, Post-Release Amendments & Immutable Audit Event Logging
- **Failure Mode 1: Attempted Release of Unsigned Report**: The server rejects with `HTTP 409 (Pathologist sign-off is required before release)`.
- **Failure Mode 2: Unacknowledged Panic Value**: The server rejects with `HTTP 409 (Critical communication acknowledgement required before release)`.
- **Post-Release Amendment Protocol (`POST /api/orders/:id/amend`)**:
  * Released reports are strictly immutable. They cannot be modified via SQL `UPDATE` or API `PUT`.
  * If a clinical amendment is required post-release, an authorized pathologist must create an amended version (`POST /api/orders/:id/amend`).
  * Requires a mandatory documented `reason` (minimum 5 characters).
  * System clones the parent order into a new order version: `reportVersion = parent.version + 1`.
  * The parent report remains archived and untouched; a permanent record is created in `DB.reportVersions` linking the previous report hash to the new amended version.
- **Audit Logging**:
  * `REPORT_VALIDATED`: Captures order ID and validating pathologist.
  * `PATHOLOGIST_SIGNOFF`: Captures order ID, signature ID, and MCI number.
  * `REPORT_RELEASED`: Captures order ID, report hash, and verification token.
  * `REPORT_AMENDMENT_CREATED`: Captures parent order ID, amended order ID, and documented clinical amendment reason.

### 5.13 Operational Readiness & Verification Checklist
- [ ] Pathologist authenticated with dedicated personal credentials (no shared logins).
- [ ] Technical validation gate confirms all accessioned tests possess valid results.
- [ ] Critical panic values detected, communicated with verbal readback, and logged.
- [ ] Dual-witness bcrypt re-authentication verified for critical result communications.
- [ ] Historical delta checks analyzed; significant drifts attested with `deltaReviewed: true`.
- [ ] Live bcrypt password re-authentication executed during electronic sign-off.
- [ ] Pathologist MCI / State Medical Council registration number captured in signature.
- [ ] Release gate verifies `specimenStatus === 'ACCEPTED'` and `order.signoff` existence.
- [ ] Canonical report snapshot frozen with permanent laboratory letterhead configuration.
- [ ] HMAC-SHA256 digital seal computed and high-entropy QR verification token generated.
- [ ] Released report verified immutable; post-release modifications routed through amendment engine.

---

## 6. SOP-05: Laboratory Director Disaster Recovery, Backup & Audit Ledger Verification

### 6.1 Document Control & Statutory Baseline
- **SOP Number**: `SOP-LAB-05`
- **Title**: Laboratory Information System Disaster Recovery, Automated Database Backup Regimes, Cryptographic Manifest Verification, Automated Pre-Restore Safety Snapshots, PostgreSQL Row Level Security (RLS) Governance, Immutable Audit Ledger Hash-Chaining, and Ed25519 License Verification.
- **Regulatory References**:
  * NABL ISO 15189:2022 §8.3.1, §8.3.2, §8.3.3 (Control of records, Information management).
  * EU GMP Annex 11 §7.1, §7.2, §9, §16 (Data Storage, Audit Trails, Business Continuity).
  * US FDA 21 CFR Part 11 §11.10(c), §11.10(e) (Protection of records, Append-only audit trails).
  * Good Automated Manufacturing Practice (GAMP 5) Category 4/5 System Governance.

### 6.2 Scope & Enterprise Continuity Objective
This Standard Operating Procedure governs the administrative responsibilities executed by the Laboratory Medical Director, Lead Quality Assurance Manager, and Senior IT Systems Administrator. 
The objective is to establish foolproof business continuity via hot and cold backup regimes, guarantee data integrity through bitwise SHA-256 cryptographic verification, enforce automated pre-restore snapshots to prevent data loss during recovery, ensure absolute tenant data isolation across 19 PostgreSQL tables via Row Level Security (RLS), verify the tamper-evident blockchain-style append-only audit ledger, and maintain offline Ed25519 cryptographic license governance.

### 6.3 Roles, Responsibilities & Access Level (RACI)
- **Responsible (R)**: Senior IT Systems Administrator / Lead DevOps Engineer. Executes routine backups, performs disaster recovery drills, validates RLS policies, and audits system hashes.
- **Accountable (A)**: Laboratory Medical Director. Legally accountable for laboratory data preservation, 5-year patient record archiving, and regulatory inspection compliance.
- **Consulted (C)**: Quality Assurance Lead & Database Security Consultant.
- **Informed (I)**: Institutional Board & NABL / Regulatory Audit Teams.

### 6.4 Cold Snapshot Archiving Protocol (`makeBackup`) & SHA-256 Manifest Registration
1. **Cold State Backup Execution (`POST /api/backup` & `makeBackup()` in `server.js`)**:
   - Access restricted strictly to authenticated `admin` users.
   - Serializes the entire operational laboratory state into a standardized JSON payload.
   - Generates unique backup ID: `id = rid('BKP')` (e.g., `BKP-7C210E481A`).
   - Writes archive file to protected disk directory: `data/backups/backup_<ID>.json` with restrictive POSIX permissions (`0o600`).
2. **Bitwise SHA-256 Cryptographic Digest Calculation**:
   - Computes a SHA-256 cryptographic hash over the serialized archive file:
     $$\text{sha256} = \text{crypto.createHash('sha256')}.\text{update}(\text{payload}).\text{digest('hex')}$$
3. **Manifest Registration**:
   - Registers the record in `DB.backupManifest` and persists into PostgreSQL `backup_manifest` table:
     ```json
     {
       "id": "BKP-7C210E481A",
       "file": "backup_7C210E481A.json",
       "sha256": "3a8b2c4e...",
       "sizeBytes": 481024,
       "reason": "Scheduled Nightly Cold Backup",
       "actor": "admin",
       "createdAt": "2026-10-18T00:00:00.000Z"
     }
     ```
   - Appends audit event: `BACKUP_CREATED`.

### 6.5 Hot PostgreSQL Transactional Archiving & Point-In-Time Recovery (PITR)
1. **Automated Scheduled PostgreSQL Dump**:
   - For transactional continuity, execute scheduled backups of the PostgreSQL 18 container/service:
     ```bash
     pg_dump -Fc -v -d hrgen_lis -f /var/backups/hrgen_lis_$(date +%Y%m%d_%H%M%S).dump
     ```
2. **Write-Ahead Logging (WAL) Continuous Archiving**:
   - Configure PostgreSQL `archive_mode = on` and `archive_command = 'cp %p /var/backups/wal_archive/%f'`.
   - Enables Point-In-Time Recovery (PITR) to restore the database to the exact second prior to an administrative error or storage failure.
3. **Service Level Continuity Metrics**:
   - **Recovery Point Objective (RPO)**: $< 15\text{ minutes}$ (maximum allowable data loss window).
   - **Recovery Time Objective (RTO)**: $< 30\text{ minutes}$ (maximum allowable downtime to full restoration).

### 6.6 Cryptographic Backup Verification & Automated Pre-Restore Safety Snapshot Protocol
When an administrator initiates a system restore (`POST /api/restore/:id`):
1. **Locate & Read Backup Archive**:
   - Locates backup record in `DB.backupManifest`. Reads physical archive from disk.
2. **Bitwise SHA-256 Integrity Verification**:
   ```javascript
   const payload = fs.readFileSync(file);
   const hash = crypto.createHash('sha256').update(payload).digest('hex');
   if (!timingSafeEqualString(hash, m.sha256)) {
     return res.status(409).json({ error: 'Backup integrity check failed: bitwise hash mismatch' });
   }
   ```
   *Ransomware & Tamper Resistance*: If even a single byte of the backup file has been altered, corrupted, or encrypted, the restore operation immediately aborts with `HTTP 409`.
3. **Automated Pre-Restore Safety Snapshot**:
   - Prior to applying the restored data, the system **automatically executes a safety snapshot of the currently running active database**:
     ```javascript
     const preRestore = await makeBackup('Pre-restore snapshot', actorOf(req));
     ```
   - Guarantees that if an administrator accidentally restores an outdated or incorrect archive, the pre-restore snapshot can be restored immediately with zero data loss.
4. **Atomic State Swap & Audit Persistence**:
   - Loads the validated payload, normalizes schema structures, retains the pre-restore backup in the active manifest, and logs `BACKUP_RESTORED` in `DB.auditLedger`.
   - Atomically updates PostgreSQL with `{ replace: true }`.

### 6.7 PostgreSQL 18 Row Level Security (RLS) Verification Across 19 Tenant Tables
To guarantee medical data privacy and prevent cross-tenant data leakage (BOLA vulnerabilities) in multi-clinic environments, HRGen GIA LIMS enforces strict PostgreSQL Row Level Security:

```
+======================================================================================================================+
|                                    19 TENANT TABLES UNDER FORCE ROW LEVEL SECURITY                                   |
+======================================================================================================================+
| 1. users                  | 6. qc_runs                | 11. critical_communications | 16. platform_records   |
| 2. patients               | 7. instruments            | 12. report_versions         | 17. sequence_counters  |
| 3. orders                 | 8. reagent_lots           | 13. backup_manifest         | 18. api_keys           |
| 4. order_tests            | 9. calibrations           | 14. validation_evidence     | 19. refresh_tokens     |
| 5. test_catalog           | 10. delta_checks          | 15. audit_ledger            |                        |
+======================================================================================================================+
```

1. **Mandatory Table Constraints**:
   - Every tenant table enforces:
     ```sql
     ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
     ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;
     ```
   - `FORCE ROW LEVEL SECURITY` guarantees that policies apply even to table owners.
2. **Canonical Tenant Isolation Policy**:
   ```sql
   CREATE POLICY tenant_isolation_<table_name> ON <table_name>
   USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
   WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
   ```
   *Fail-Closed Enforcement*: If a database query is executed without explicitly setting `app.tenant_id`, `current_setting('app.tenant_id', true)` evaluates to empty/null, and the query returns **zero rows** (fail-closed read) and throws a permission violation on insert/update.
3. **Zero Orphaned NULL Row Policy**:
   - During startup migrations (`ensureSchema()` in `db/postgres.js`), the engine scans all 19 tables for any rows with `tenant_id IS NULL`.
   - If any NULL rows exist, startup aborts immediately: `Error: Tenant isolation migration blocked: table contains NULL tenant_id`.

### 6.8 Least-Privilege Role Separation (`hrgen_app` vs `hrgen_migrator`) & Single-Writer Advisory Lock
1. **PostgreSQL Role Separation**:
   - **`hrgen_migrator`**: Administrative DDL owner role. Used exclusively during startup schema generation via `migrationPool`.
   - **`hrgen_app`**: Standard application runtime role. Possesses:
     * `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOINHERIT`.
     * Explicit configuration: `ALTER ROLE hrgen_app SET row_security = on;`.
     * Granted only DML privileges (`SELECT, INSERT, UPDATE, DELETE`) on public tables and `USAGE` on sequences.
     * Denied `CREATE` privileges on schema `public` and owns zero tenant tables.
2. **Startup Runtime Privilege Self-Audit (`assertRuntimeRole()`)**:
   - Upon startup (`server.js`), the system queries PostgreSQL system catalogs:
     * Confirms the connected runtime user is not superuser (`usesuper = false`).
     * Confirms runtime user does not have `usebypassrls = true`.
     * Confirms runtime user owns zero tables in schema `public`.
     * If any privilege check fails, the server refuses to start.
3. **Single-Writer Advisory Lock Lease (`acquireSingleWriterLease()`)**:
   - Acquires PostgreSQL session-level advisory lock:
     ```sql
     SELECT pg_try_advisory_lock(hashtext('hrgen_gia_lims_single_writer_v1'));
     ```
   - Prevents accidental multi-instance horizontal concurrency from causing in-memory state desynchronization. If another instance is running, startup fails closed.

### 6.9 Tamper-Evident Append-Only Audit Ledger Verification (`trg_audit_ledger_immutable` & `verifyAuditChain`)
Under EU GMP Annex 11 §9 and FDA 21 CFR Part 11 §11.10(e), medical laboratory audit trails must be completely tamper-evident, append-only, and impossible to modify or truncate:

1. **Database-Level Immutability Trigger (`db/postgres.js:65-67`)**:
   ```sql
   CREATE OR REPLACE FUNCTION prevent_audit_ledger_mutation() RETURNS trigger AS $$
   BEGIN 
     RAISE EXCEPTION 'audit_ledger is append-only'; 
   END; $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_audit_ledger_immutable 
   BEFORE UPDATE OR DELETE ON audit_ledger 
   FOR EACH ROW EXECUTE FUNCTION prevent_audit_ledger_mutation();
   ```
   *Any SQL `UPDATE` or `DELETE` statement issued against `audit_ledger` is aborted with an exception, even if attempted by a database administrator.*
2. **Cryptographic Blockchain Hash-Chaining**:
   - Each audit entry links to the previous entry via SHA-256 block hashing:
     $$\text{block\_hash}_n = \text{SHA-256}(\text{audit\_seq}_n \parallel \text{timestamp}_n \parallel \text{action}_n \parallel \text{actor}_n \parallel \text{previous\_hash}_{n-1} \parallel \text{details}_n)$$
3. **Audit Ledger Verification Routine (`verifyAuditChain()` via `GET /api/audit/verify`)**:
   - Traverses the entire audit log chronologically from sequence 1 to current head.
   - Recomputes the SHA-256 hash at every block link.
   - If all hashes match $\implies$ returns `200 OK (valid: true, auditedBlocks: N)`.
   - If any record was modified, deleted, or inserted out of sequence $\implies$ returns `500 Internal Server Error (valid: false, brokenLink: sequenceNumber)`.

### 6.10 Air-Gapped Ed25519 Cryptographic License Audit & Renewal Procedure
HRGen GIA LIMS enforces commercial licensing offline using asymmetric elliptic curve cryptography (Ed25519), requiring zero internet connectivity:

```
+======================================================================================================================+
|                                    AIR-GAPPED Ed25519 CRYPTOGRAPHIC LICENSING                                        |
+======================================================================================================================+
|  [ Central Licensing Authority ]                                          [ Air-Gapped Laboratory Server ]           |
|  - Ed25519 Private Key (offline HSM)                                      - Public Key: `license-public.pem` (SPKI)  |
|  - Signs payload: tenantSlug, expiresAt,                                  - License File: `license.json`             |
|    maxUsers, amcUntil, features                                           - Verification Tool: `LICENSE_TOOL.js`     |
|         |                                                                                 |                          |
|         +--------------------- Transferred via Secure USB ------------------------------->+                          |
|                                                                                           |                          |
|                                                                                           v                          |
|                                                                           [ crypto.verify(null, payload, key, sig) ] |
|                                                                                           |                          |
|                                                                          +----------------+----------------+         |
|                                                                          |                                 |         |
|                                                                    [Valid Signature]              [Tampered / Expired]
|                                                                          |                                 |         |
|                                                                          v                                 v         |
|                                                                   Permit Operations              Fail-Closed Abort   |
+======================================================================================================================+
```

1. **License Audit Execution (`node LICENSE_TOOL.js verify license.json license-public.pem [tenantSlug]`)**:
   - Reads SPKI public key from `license-public.pem`.
   - Reads `license.json` containing base64 payload and Ed25519 signature.
   - Executes asymmetric cryptographic verification:
     ```javascript
     const verified = crypto.verify(null, payloadBuffer, publicKey, signatureBuffer);
     ```
2. **Temporal & Tenant Boundary Verification**:
   - Parses payload JSON:
     * `expiresAt`: Must be a valid future ISO-8601 date or string `'PERPETUAL'`.
     * `amcUntil`: Validates Annual Maintenance Contract entitlement.
     * `tenantSlug`: Must match the authenticated clinic tenant identifier.
     * `features`: Confirms authorized functional modules.
   - If verification succeeds, returns exit code `0`. If signature fails or license has expired, returns exit code `1` and halts server startup.

### 6.11 Process Flow Diagram (ASCII)

```
[ LABORATORY DIRECTOR DISASTER RECOVERY & AUDIT WORKFLOW ]
                            |
                            v
     +---------------------------------------------+
     | Scheduled & On-Demand Backup Protocol       |  (POST /api/backup)
     | - makeBackup(): Serialize State to Disk     |
     | - Calculate Bitwise SHA-256 Digest          |
     | - Register Record in DB.backupManifest      |
     | - PostgreSQL pg_dump & WAL Archiving (PITR) |
     +---------------------------------------------+
                            |
                            v
     +---------------------------------------------+
     | System Restore Protocol                     |  (POST /api/restore/:id)
     | - Read Target Backup Archive                |
     | - Verify Bitwise SHA-256 (Abort if Mismatch)|
     | - Execute Automated Pre-Restore Snapshot    |
     |   (Guarantees Zero Data Loss Rollback)      |
     | - Atomic State Swap & Audit Logging         |
     +---------------------------------------------+
                            |
                            v
     +---------------------------------------------+
     | PostgreSQL 18 Multi-Tenant RLS Audit        |  (db/postgres.js)
     | - Verify FORCE ROW LEVEL SECURITY (19 Tables|
     | - Policy: NULLIF(app.tenant_id, '')         |
     | - Confirm hrgen_app Has Least-Privilege DML |
     | - Acquire Single-Writer Advisory Lock       |
     +---------------------------------------------+
                            |
                            v
     +---------------------------------------------+
     | Tamper-Evident Audit Ledger Verification    |  (GET /api/audit/verify)
     | - Database Trigger: trg_audit_ledger_immut  |
     |   (Raises Exception on UPDATE / DELETE)     |
     | - verifyAuditChain(): Traverses SHA-256 Chain|
     | - Returns 200 OK (Intact) or 500 (Broken)   |
     +---------------------------------------------+
                            |
                            v
     +---------------------------------------------+
     | Air-Gapped Ed25519 License Audit            |  (LICENSE_TOOL.js verify)
     | - Verify Elliptic Curve Signature           |
     | - Check Temporal Expiry & Tenant Slug       |
     | - Confirm License Authenticity              |
     +---------------------------------------------+
```

### 6.12 Disaster Recovery Execution Runbook & Immutable Audit Event Logging
- **Disaster Scenario: Hardware Failure or Ransomware Corruption**:
  1. Provision replacement server PC with Windows 10/11 Pro and install Node.js v24+ and PostgreSQL 18.
  2. Restore the latest verified cold snapshot file (`backup_<ID>.json`) from off-site USB or NAS storage.
  3. Verify the archive's SHA-256 checksum against the signed physical manifest log.
  4. Invoke restore endpoint: `POST /api/restore/:id`. The system automatically generates a pre-restore checkpoint, parses the state, and repopulates the operational database.
  5. Verify RLS policies: Run `node validation/TENANT_RLS_STATIC_VERIFY.js`.
  6. Verify audit chain: Execute `GET /api/audit/verify` to confirm ledger continuity.
  7. Verify Ed25519 license: Execute `node LICENSE_TOOL.js verify license.json license-public.pem`.
  8. Resume laboratory diagnostic operations within $< 30\text{ minutes}$.
- **Audit Logging**:
  * `BACKUP_CREATED`: Captures backup ID, filename, SHA-256 digest, size, and actor.
  * `BACKUP_RESTORED`: Captures restored backup ID, pre-restore snapshot ID, and actor.
  * `AUDIT_CHAIN_VERIFIED`: Captures verification status, total verified blocks, and timestamp.

### 6.13 Operational Readiness & Verification Checklist
- [ ] Automated cold backups executed daily; SHA-256 digests recorded in manifest.
- [ ] PostgreSQL continuous WAL archiving configured for Point-In-Time Recovery.
- [ ] Backup restore verified to reject tampered files via bitwise SHA-256 matching.
- [ ] Automated pre-restore snapshot verified to create rollback point before data restoration.
- [ ] 19 tenant tables verified under `FORCE ROW LEVEL SECURITY`.
- [ ] Database trigger `trg_audit_ledger_immutable` verified to block SQL updates/deletes.
- [ ] Audit blockchain traversed via `verifyAuditChain()` and confirmed intact.
- [ ] Application runtime role `hrgen_app` verified with least-privilege DML permissions.
- [ ] Single-writer advisory lock lease verified to prevent concurrent instance corruption.
- [ ] Offline Ed25519 cryptographic license audited and confirmed valid.

---

## 7. Appendix: Master Error Codes, Rejection Code Cross-Walk & Regulatory Concordance

```
+======================================================================================================================+
|                                    MASTER ERROR CODES & REJECTION CODE CROSS-WALK                                    |
+======================================================================================================================+
| Error / Code       | Category        | Triggering Condition                    | Statutory / Standard Reference     |
|--------------------+-----------------+-----------------------------------------+------------------------------------|
| `HTTP 400`         | Front-Desk      | Exact age is 0Y 0M 0D; Phone not 10 dig | ISO 15189:2022 §7.2.2              |
| `HTTP 409`         | Phlebotomy      | Result entry/import on unaccepted sample| ISO 15189:2022 §7.2.5              |
| `HEMOLYSIS`        | Rejection Code  | Visible RBC lysis; Free Hb > 50 mg/dL   | CLSI GP41-A6; ISO 15189 §7.2.5     |
| `CLOTTED`          | Rejection Code  | Micro-clots in EDTA / Citrate tube      | CLSI GP41-A6; WHO Blood Drawing    |
| `QNS`              | Rejection Code  | Quantity Not Sufficient (<90% fill)     | CLSI GP41-A6 (Citrate 1:9 ratio)   |
| `1_3s`             | Westgard IQC    | Random analytical error (|Z| > 3)       | CLSI C24-A4; ISO 15189 §7.3.7      |
| `2_2s`             | Westgard IQC    | Systematic analytical error (|Z| > 2x2) | CLSI C24-A4; ISO 15189 §7.3.7      |
| `HTTP 409`         | QC Approval     | Mismatched lot, invalid calibration, run| ISO 15189 §7.3.7; GMP Annex 11 §6  |
| `PANIC_ALERT`      | Critical Value  | Potassium > 6.5, Glucose < 45, etc.     | ISO 15189:2022 §7.4.2; IPSG.2      |
| `HTTP 401`         | Pathologist Sign| Live Bcrypt password re-auth failure    | 21 CFR Part 11 §11.200; MCI Ethics |
| `HTTP 409`         | Report Release  | Missing pathologist sign-off or accepted| ISO 15189:2022 §7.4.1              |
| `RLS_VIOLATION`    | Multi-Tenancy   | Missing app.tenant_id or cross-tenant   | PostgreSQL 18 RLS; BOLA Security   |
| `LEDGER_IMMUTABLE` | Audit Trail     | Attempted UPDATE/DELETE on audit_ledger | EU GMP Annex 11 §9; 21 CFR Part 11 |
+======================================================================================================================+
```

---

```
========================================================================================================================
                                      END OF AUTHORITATIVE SOP MANUAL
                                    HRGEN GIA LIMS (L99N100XN30 HARDENED)
========================================================================================================================
```
