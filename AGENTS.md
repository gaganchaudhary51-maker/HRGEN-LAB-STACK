# AI Coding Agent Rules & Engineering Discipline (AGENTS.md)
**Project**: Dr. Shastri Diagnostics (DSD Care) Aligarh & GIA LIMS Ecosystem  
**Authority**: Chief Systems Architect & Lead Software Engineer  
**Status**: ACTIVE & MANDATORY FOR ALL AGENTS  

---

## 1. Prime Directives for Coding Agents

### Rule 1: Inspect Before Modifying
- Never write or edit code blind. Always read the relevant target file, surrounding imports, and dependent types before proposing changes.
- Reuse existing component patterns (e.g. `SpecimenTubeGraphic`, `EkgHeartbeatWave`, `Interactive3DAnatomyAtlas`). Do not create duplicate components.

### Rule 2: Strict Type Safety & Clean Compilation
- All TypeScript files must adhere to strict typing (`strict: true`).
- **Zero Implicit `any`**: Explicitly type map iterators, callback parameters, and payload handlers.
- **Zero Unused Variables**: Clean all unused imports and dead code. The build must compile cleanly with `npm run build` and `tsc --noEmit`.

### Rule 3: Supply Chain & Dependency Hygiene
- Never install unvetted third-party packages.
- Every commit or feature implementation must maintain **0 vulnerabilities** under `npm audit`.
- Do not introduce bloated UI libraries when existing Tailwind utilities and native HTML5/CSS primitives suffice.

### Rule 4: Real-World Clinical Grounding
- Dr. Shastri Diagnostics is grounded in its authentic Central NABL Lab at **1246, Vidyanagar Colony, Ramghat Road, Aligarh**.
- Analyzers must reference authentic clinical instruments: Beckman Coulter AU, Sysmex XN-550, Bio-Rad D-10 HPLC, Roche Cobas e411.
- Biological reference intervals and specimen tube additive mappings must be biochemically accurate (e.g. Gold SST Gel for Biochemistry, Lavender EDTA for Hematology, Grey Fluoride for Glucose).

### Rule 5: UI/UX & Design Precision (Linear / Stripe Standard)
- Maintain the **strict 8px spatial rhythm** (`p-2`, `p-4`, `p-6`, `space-y-4`, etc.).
- Maintain optical hierarchy with modern type stacks (Inter, Geist Sans, JetBrains Mono for numerical results).
- All clickable elements must satisfy the **44px minimum touch target** for mobile ergonomic accessibility.
- Never use tacky AI-slop visual tropes (e.g. garish oversaturated blobs, generic SaaS button pills).

### Rule 6: Mandatory Automated Verification Before Handover
- An agent must **NEVER** declare a bug fixed or a task complete based on assumption.
- The agent must:
  1. Run `npm run build` to verify clean compilation.
  2. Inspect the live application in headless Playwright.
  3. Query browser console messages to verify **0 errors and 0 warnings**.
  4. Document the exact command outputs, file links, and verification artifacts in `walkthrough.md`.

---

## 2. Change Control & File Boundaries

| Directory | Role | Allowed Edits |
| :--- | :--- | :--- |
| `01_DSD_Patient_Booking/src` | Patient Booking PWA Frontend | UI, 3D scenes, AI modals, cart, routing |
| `03_GIA_LIMS_Core/src` | Clinical Laboratory Backend | HL7/ASTM drivers, REST APIs, QC engine |
| `04_HRGERN_Security_Inspector` | Automated Security Test Suite | Pytest audit scripts, forensic verification |
| Root `.md` files | Standards Documentation Suite | PRD, DESIGN, ARCHITECTURE, DATABASE, API, AGENTS |
