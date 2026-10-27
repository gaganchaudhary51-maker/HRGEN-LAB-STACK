# Design System & UI/UX Specification (DESIGN.md)
**Product**: Dr. Shastri Diagnostics (DSD Care) Aligarh PWA & GIA LIMS  
**Design Standard**: Linear / Stripe / Apple Health Benchmark  
**Spatial Rhythm**: Strict 8px Multiples  
**Accessibility**: WCAG 2.1 Level AA Compliance  
**Status**: APPROVED & ACTIVE  

---

## 1. Visual Direction & Design Philosophy

The Dr. Shastri Diagnostics interface is designed to reflect **clinical precision, cutting-edge diagnostic technology, and patient empathy**.
- **Aesthetic Benchmark**: High-end modern SaaS aesthetics reminiscent of Linear, Raycast, and Stripe.
- **Zero AI Slop**: No generic tacky gradient blobs, garish pill buttons, or uncalibrated layouts. Every pixel serves clinical clarity.
- **Micro-Interactions**: Snappy 150ms–250ms ease-out transitions, subtle borders (`border-slate-800` or `rgba(255,255,255,0.08)`), and spring physics (via Framer Motion) on anatomical organ interaction.

---

## 2. Color Palette & Semantic Tokens

| Token | Hex / CSS Variable | Semantic Usage |
| :--- | :--- | :--- |
| **`bg-canvas`** | `#020617` (Slate 950) | Deep cinematic root background |
| **`bg-surface`** | `#0f172a` (Slate 900) | Card backgrounds, modal containers |
| **`border-muted`** | `#1e293b` (Slate 800) | Subtle structural 1px dividers |
| **`accent-cyan`** | `#00f0ff` / `#06b6d4` | 3D Raycasting focus, active AI badges, primary highlights |
| **`clinical-emerald`**| `#10b981` | Optimal biomarker results, NABL certified badges, cold-chain OK |
| **`clinical-amber`**  | `#f59e0b` | Borderline biomarkers, fasting required alerts, warning states |
| **`clinical-rose`**   | `#f43f5e` | Critical alert biomarkers, fever/inflammation indicators |
| **`brand-purple`**    | `#a855f7` | Lavender EDTA hematology indicators, Super Admin portals |

---

## 3. Typography Stack

- **Primary UI Font**: Inter / Geist Sans (`font-sans`) — Used for all user journeys, descriptions, and clinical narratives.
- **Numerical & Clinical Values**: JetBrains Mono (`font-mono`) — Strictly applied with `tabular-nums` for all lab results, reference ranges, SHA-256 hashes, and telemetry metrics.
- **Headings Hierarchy**:
  - `h1` (Hero): `32px` mobile / `48px` desktop, `tracking-tight`, font-black (900).
  - `h2` (Section Titles): `24px` mobile / `32px` desktop, `tracking-tight`, font-extrabold (800).
  - `h3` (Card Titles): `18px` mobile / `20px` desktop, font-bold (700).
  - `body`: `14px` (sm) or `15px` (base), line-height `1.6`, text-slate-300.
  - `caption / pills`: `10px` – `12px`, uppercase font-mono with letter-spacing `0.05em`.

---

## 4. Spacing Rhythm & Layout Grid

- **Base Unit**: 8px (`0.5rem`). All margins, paddings, gaps, and component heights align strictly to:
  - `4px` (0.5x), `8px` (1x), `16px` (2x), `24px` (3x), `32px` (4x), `48px` (6x), `64px` (8x).
- **Minimum Interactive Tap Target**: Minimum `44px × 44px` for all buttons, tabs, drawer dismissals, and quantity steppers on touch viewports.

---

## 5. Signature Component Library

### 5.1 Interactive 3D Anatomy Atlas
- High-fidelity Three.js WebGL2 canvas with biological organ coordinates (Heart at thoracic cavity, Pancreas retroperitoneal, Liver right hypochondrium).
- Dual mode switcher: **3D Human Atlas** vs. **DNA Double Helix Strand**.
- 72 BPM rhythmic cardiac pulse synchronized with the live telemetry top bar.

### 5.2 Real-Meniscus Vacutainer Specimen Tubes (`SpecimenTubeGraphic`)
- Realistic physics-inspired SVG graphics representing authentic BD Vacutainer tubes:
  - **Lavender (K2 EDTA)**: Purple cap, whole blood dark red column.
  - **Gold (SST Gel Separator)**: Yellow cap, polymer gel separator partition, amber serum column.
  - **Grey (Fluoride Oxalate)**: Grey cap, glycolysis inhibition plasma.
  - **Light Blue (Sodium Citrate)**: Light blue cap, coagulation testing.

### 5.3 5-Zone Bio-Spectrum Visualizer
- Replaces legacy 2-point sliders with a standardized 5-tier biological spectrum:
  1. `Critical Low` (Rose / `< refLow * 0.8`)
  2. `Suboptimal` (Amber / `refLow * 0.8` to `refLow`)
  3. `Optimal Target` (Emerald / `refLow` to `refHigh`)
  4. `Borderline High` (Amber / `refHigh` to `refHigh * 1.25`)
  5. `Critical High` (Rose / `> refHigh * 1.25`)
- Rotating diamond patient indicator (`w-4 h-4 rotate-45`) dynamically positioned at normalized test values.
- Real-time deviation text (e.g. `+9% above upper threshold`).

### 5.4 Pre-Analytical Metadata Badges
- Standardized pill row on all package and test cards:
  - ☕ `Fasting 10–12 Hrs` / `✓ Non-Fasting (Anytime)`
  - ⏱ `TAT: Reports within 6 Hours`
  - 🧪 `Sample: EDTA Blood + Fluoride + SST Gel`
  - ⚙ `6-Sigma Analyzer: Beckman Coulter AU / Sysmex XN-550`

### 5.5 Fasting Morning Slot Selector
- 2x2 tactile grid replacing generic dropdowns:
  - `6:00 – 7:00 AM`: Recommended for Sugar & Lipid (`☕ FASTING REQUIRED`)
  - `7:00 – 8:00 AM`: Peak Fasting Window (`☕ FASTING REQUIRED`)
  - `8:00 – 9:00 AM`: CBC & General Panels (`☕ FASTING REQUIRED`)
  - `9:00 – 10:30 AM`: Post-Prandial / Non-fasting
- On-arrival verification checklist: 4-digit Collection OTP (`8492`), sterile single-use needle protocol, 3.8°C cold-chain bag.

### 5.6 Spatial Mobile Bottom Navigation Dock (<1024px)
- Fixed bottom dock (`<nav aria-label="Mobile Navigation Dock">`) with 5 primary touch points:
  - `Atlas` (3D Human Anatomy)
  - `2026 AI` (Smart Report & Explainer)
  - `Track 3D` (FlaboTrack Live GPS Ride)
  - `Reports` (Patient Portal)
  - `Cart` (Sticky Drawer)

---

## 6. Accessibility & Motion Rules

- **Contrast Compliance**: Minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text against dark slate canvas (WCAG AA).
- **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` by disabling Three.js continuous rotation and spring bounces.
- **Focus Indicators**: Explicit `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none` on all interactive anchors and inputs.
