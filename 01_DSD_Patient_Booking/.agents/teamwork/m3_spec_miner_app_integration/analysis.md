# Milestone 3 App Integration & Glassmorphic Styling Specification Analysis

**Target Project**: Dr. Shastri Diagnostics (DSD Care) — Patient Portal  
**Working Directory**: `C:\Users\pc\Desktop\HRGen_Diagnostic_Ecosystem\01_DSD_Patient_Booking`  
**Author**: `m3_spec_miner_app_integration` (Specification Miner)  
**Date**: 2026-10-25  

---

## 1. Executive Summary

This specification mining report delineates the exact architectural integration points within `src/App.tsx` and design token contracts for `src/components/VitalityAssessment/vitality-assessment.css`. 

The integration embeds the Awwwards-grade, dark-glassmorphic **Interactive Health Risk & Vitality Score Assessment** tool into the existing DSD Care single-page diagnostic booking portal. It connects the 3-step clinical scoring quiz (`scoringEngine.ts`), spring physics harmonic oscillator (`useSpringValue.ts`), and animated SVG radial dial (`RadialScoreGauge.tsx`) directly into the portal's reactive cart state (`qty(packageId, 1)`), WhatsApp home collection dispatch payload, and navigation anchor architecture.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | App Nav | Header Nav Link "Vitality Score ✨" | Sticky navigation link in `<header className="header"><nav>` directing smoothly to `#vitality-score` | User click on nav item | Smooth viewport scroll to `#vitality-score` section | If target element not in DOM, fallback anchor jump | `src/App.tsx:255-267`, `PROJECT.md:25` |
| 2 | App Hero | Hero CTA Button "Take 60s Health Quiz ✨" | High-visibility primary action button in `.heroBtns` prompting quiz engagement | User click on hero CTA | Smooth scroll to `#vitality-score` section | Standard link navigation if smooth scroll disabled | `src/App.tsx:294-304`, `PROJECT.md:24` |
| 3 | Component Mount | Dedicated Assessment Mount Section | Section container `<section id="vitality-score">` placed immediately below Hero section (`</section>`) | Portal render lifecycle | Rendered `<VitalityAssessment />` component | Graceful fallback if props undefined | `src/App.tsx:342-343`, `PROJECT.md:23` |
| 4 | Cart Integration | 1-Click "Add to Cart" Handler | Invokes `qty(packageId, 1)` to increment item in `cart` state | `packageId: string` | Incremented `cart` object, updated cart badge count and total | Negative/zero quantities cleanly pruned from cart state | `src/App.tsx:175-182`, `PROJECT.md:26` |
| 5 | Booking Drawer Sync | 1-Click "Book Recommended Package" Handler | Invokes `qty(packageId, 1)` AND `setBookingOpen(true)` | `packageId: string` | Package added to cart, home collection drawer opened | Pruned if invalid ID, drawer opens with valid cart | `src/App.tsx:97, 623-693`, `PROJECT.md:26` |
| 6 | Glassmorphism Core | Multi-Layered Frosted Glass (`blur(28px)`) | Dual backdrop blur token (`backdrop-filter: blur(28px)` with `-webkit-` prefix) | Dark glass card container | Translucent blurred background with 28px diffusion | Degrades gracefully to semi-transparent dark panel on unsupported browsers | `tier1_feature_tests.json:632-643`, `TEST_INFRA.md:101-107` |
| 7 | Glassmorphism Border | Top-Lit Specular Edge Gradient | 1px height pseudo-element (`::before`) simulating ambient directional light | Top edge boundary | Specular emerald gradient highlight (`rgba(72, 237, 134, 0.6)`) | Hidden on pseudo-element suppression | `tier1_feature_tests.json:644-656`, `TEST_INFRA.md:103` |
| 8 | Ambient Shadows | Ambient Occlusion & Border Line Tokens | Deep diffuse shadow (`0 24px 80px rgba(0,0,0,0.55)`) with subtle line (`rgba(255,255,255,0.08)`) | Container bounding box | High-depth card separation from `#050606` background | Standard box shadow fallback | `tier1_feature_tests.json:657-670`, `TEST_INFRA.md:104` |
| 9 | Typography Rules | Optical Weight Constraint ($\le 500$) | Strict typography weight cap ($\le 500$) on glass surfaces to prevent blur halation | Text rendering on glass | Crisp, readable text without optical bloom | Font weight clamped to 400 or 500 | `tier1_feature_tests.json:671-682`, `TEST_INFRA.md:105` |
| 10 | Hover Dynamics | Interactive Glass Card Elevation | Hover elevation with enhanced emerald glow border (`rgba(72, 237, 134, 0.28)`) and spring scale | Pointer hover event | `-4px` translateY and subtle glow bloom | Disabled when pointer is coarse (touch devices) | `tier1_feature_tests.json:683-695`, `TEST_INFRA.md:106` |
| 11 | Mobile Clearance | Mobile Dock Offset Clearance (`pb-24`) | Bottom padding clearance `padding-bottom: 96px` (`pb-24`) to clear fixed 56px `.mobileDock` | Viewport dimensions | Zero interactive overlap between quiz controls and dock | Content scrollable without cut-off | `tier1_feature_tests.json:793-804`, `src/App.tsx:558-568` |
| 12 | Accessibility | Touch Target Scale ($\ge 44\text{px}$) | Minimum $44 \times 44\text{px}$ touch targets for all quiz chips, buttons, and CTAs | Touch / Pointer interaction | WCAG AA touch accessibility compliance | None; enforced via CSS min-height/width | `tier1_feature_tests.json:780-791`, `TEST_INFRA.md:117` |
| 13 | Responsive Grid | Responsive Single-Column Collapse | Grid layout collapses into single column on viewports $< 650\text{px}$ | Screen width change | Stacked single-column mobile presentation | Horizontal overflow prevented (`overflow-x: hidden`) | `tier1_feature_tests.json:806-817`, `src/index.css:970` |
| 14 | Motion Safety | Reduced Motion Safe Bypass | Instant transitions when `prefers-reduced-motion: reduce` is active | User system preference | Zero animation delay, instant value snap | Restores animation when preference disabled | `tier1_feature_tests.json:603-615`, `src/index.css:1277` |
| 15 | Header Offset | Sticky Header Anchor Margin (`scroll-margin-top`) | `scroll-margin-top: 90px` on `#vitality-score` to clear the 82px sticky header | Anchor jump/scroll | Section header remains fully visible beneath sticky header | Without margin, section top is partially occluded | `src/App.tsx:247`, `src/index.css:51` |

---

## 3. Edge Cases Discovered

| # | Feature | Input / Condition | Observed & Specified Behavior |
|---|---------|-------------------|-------------------------------|
| 1 | Header Nav Anchor | Clicking "Vitality Score ✨" when already at `#vitality-score` | Viewport maintains stable position; no jarring layout shift or page refresh. |
| 2 | Sticky Header Occlusion | Smooth scrolling from bottom of page to `#vitality-score` | Without `scroll-margin-top: 90px`, the 82px sticky header (`.header`) occludes the title and progress bar. Setting `scroll-margin-top: 90px` guarantees 8px breathing room. |
| 3 | Mobile Dock Collision | Scrolling to final quiz recommendation cards on mobile ($\le 650\text{px}$) | Fixed `.mobileDock` (height 56px + safe-area) overlays the bottom. Applying `padding-bottom: 96px` (`pb-24`) leaves 40px clear separation above the dock. |
| 4 | Rapid Consecutive Clicks | Clicking "Add to Cart" 5 times in rapid succession on recommended package | Invokes `qty(id, 1)` sequentially. State increments smoothly (`count: 5`, `total: price * 5`) without race conditions or negative mutations. |
| 5 | Dual Package Recommendation | Primary Package cheaper than Camp Alternative (e.g. `renal` ₹175 vs `basiccamp` ₹299) | `scoringEngine.ts` and UI clamp `savingsAmount` and `savingsPercentage` to 0; no negative savings tags displayed. |
| 6 | Browser Without Backdrop Filter | Legacy browser or disabled `backdrop-filter` in system settings | Container utilizes solid fallback background `linear-gradient(145deg, #0d1b28, #071522)` to ensure full WCAG contrast ($> 4.5:1$) without illegible transparency. |
| 7 | Reduced Motion Preference | User has OS setting `prefers-reduced-motion: reduce` | Dial score counter snaps directly to target score; card hover scaling and entrance animations are disabled (`transition: none; animation: none`). |
| 8 | Multi-Symptom Stacking | User selects all 5 symptoms and 4 family history options | UI chips wrap neatly without horizontal scrollbar blowout; scoring engine bounds score strictly to lower threshold of 15. |
| 9 | Direct URL Hash Access | User loads URL with hash `http://localhost:5173/#vitality-score` | Browser parses anchor on initial load, browser scroll engine smooth-scrolls or jumps to `#vitality-score` with correct header offset. |
| 10| Home Collection Booking Flow | User clicks "Book Recommended Package" while cart has other items | Package is added to existing cart items, and the home collection drawer opens with all items aggregated in estimated total. |

---

## 4. Deep-Dive Specification: `src/App.tsx` Integration

### 4.1 Header Navigation Link
- **File**: `src/App.tsx`
- **Current Lines**: 255–267
- **Target Container**: `<header className="header"><nav>`
- **Placement**: Directly after `<a href="#tests">Book Tests</a>` and before the Phlebo 3D button.
- **Specification**:
  ```tsx
  <a
    href="#vitality-score"
    className="navlink vitalityNavLink"
    onClick={(e) => {
      e.preventDefault();
      document.getElementById('vitality-score')?.scrollIntoView({ behavior: 'smooth' });
    }}
  >
    Vitality Score ✨
  </a>
  ```
- **Styling Alignment**:
  - Class `navlink` inherits `.header nav a` font size (12px), color (`#c0cec3`), and hover state (`color: var(--green)`).
  - Sparkle emoji `✨` adds distinct visual hierarchy matching the request.

---

### 4.2 Hero CTA Button
- **File**: `src/App.tsx`
- **Current Lines**: 294–304
- **Target Container**: `<div className="heroBtns">`
- **Placement**: Leading position in `.heroBtns` as the primary quiz action, paired alongside "Explore Tests" and "Track my booking".
- **Specification**:
  ```tsx
  <div className="heroBtns">
    <a
      className="primary heroQuizBtn"
      href="#vitality-score"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById('vitality-score')?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      Take 60s Health Quiz ✨
    </a>
    <a className="secondary" href="#tests">
      Explore Tests <ArrowRight size={18} />
    </a>
    <button
      className="secondary"
      onClick={() => setTrackingOpen(true)}
    >
      <Navigation size={17} /> Track my booking
    </button>
  </div>
  ```
- **Mobile Responsiveness**:
  - `.heroBtns` already has `flex-wrap: wrap` in `src/index.css:1025` for viewports $\le 650\text{px}$.
  - The quiz button seamlessly wraps to full or prominent width without breaking layout.

---

### 4.3 Component Mounting
- **File**: `src/App.tsx`
- **Current Lines**: 341–344 (immediately following the Hero `<section className="hero">` and before `<section className="searchbar">`)
- **Specification**:
  ```tsx
  {/* Vitality Score Interactive Clinical Assessment Section */}
  <section id="vitality-score" className="vitalityScoreSection">
    <VitalityAssessment
      onAddToCart={(id) => qty(id, 1)}
      onBookPackage={(id) => {
        qty(id, 1);
        setBookingOpen(true);
      }}
    />
  </section>
  ```
- **Props Signature Verification**:
  - `onAddToCart: (packageId: string) => void`:
    Invokes `qty(id, 1)`. In `App.tsx:175`, `qty` increments `cart[id]` by 1.
    This triggers immediate re-renders of:
    - Header cart button badge: `<b>{count}</b>`
    - Mobile dock cart counter: `Cart ({count})`
    - Cart slide-out drawer items & estimated total
  - `onBookPackage: (packageId: string) => void`:
    Invokes `qty(id, 1)` AND `setBookingOpen(true)`.
    Adds the package to the active order AND immediately triggers the home sample collection patient details modal drawer (`App.tsx:623-693`), prompting patient name, phone, address, and time slot for WhatsApp dispatch.

---

### 4.4 Required Imports in `src/App.tsx`
```tsx
import VitalityAssessment from './components/VitalityAssessment/VitalityAssessment';
import './components/VitalityAssessment/vitality-assessment.css';
```

---

## 5. CSS Token Specifications for `vitality-assessment.css`

The stylesheet `src/components/VitalityAssessment/vitality-assessment.css` must adhere to the design system established in `PROJECT.md`, `TEST_INFRA.md`, and `src/index.css`.

### 5.1 Design Tokens Table

| Token Variable | Exact Value | Purpose |
|----------------|-------------|---------|
| `--glass-bg` | `rgba(11, 27, 44, 0.65)` | Translucent dark base for assessment containers |
| `--glass-bg-card` | `linear-gradient(150deg, rgba(16, 40, 60, 0.70), rgba(7, 22, 37, 0.85))` | Multi-stop gradient for inner quiz & recommendation cards |
| `--glass-blur` | `28px` | Backdrop filter blur radius |
| `--glass-specular-color` | `rgba(72, 237, 134, 0.6)` | 1px top specular gradient highlight |
| `--glass-border` | `1px solid rgba(255, 255, 255, 0.08)` | Subtle physical bounding edge |
| `--glass-border-hover` | `1px solid rgba(72, 237, 134, 0.28)` | Elevated hover highlight |
| `--glass-shadow-ambient` | `0 24px 80px rgba(0, 0, 0, 0.55)` | Deep ambient occlusion shadow |
| `--glass-shadow-glow` | `0 0 40px -10px rgba(16, 185, 129, 0.15)` | Subtle biological aura |
| `--emerald-signature` | `#48ed86` | DSD signature optimal health indicator |
| `--emerald-deep` | `#10b981` | Secondary emerald gradient stop |
| `--amber-warm` | `#f59e0b` | Moderate risk indicator |
| `--coral-risk` | `#f43f5e` | Elevated risk indicator |
| `--navy-deep` | `#061525` | Base portal canvas background |
| `--navy-surface` | `#0b2339` | Surface panel tone |
| `--text-primary` | `#ffffff` | Headings & high-contrast readouts (16:1 ratio) |
| `--text-secondary` | `#a7bbaa` | Form labels & descriptions (5.8:1 ratio) |
| `--dock-clearance` | `96px` | Mobile dock clearance (`pb-24`) |
| `--touch-min-size` | `44px` | Minimum touch target dimension |

---

### 5.2 Section Anchor & Sticky Offset
```css
.vitalityScoreSection {
  scroll-margin-top: 90px; /* Clears 82px sticky .header with 8px buffer */
  margin: 32px 5.5% 0;
  position: relative;
}

@media (max-width: 650px) {
  .vitalityScoreSection {
    scroll-margin-top: 78px; /* Clears 70px mobile .header with 8px buffer */
    margin: 20px 4% 0;
  }
}
```

---

### 5.3 Glassmorphic Card Container Specifications (`.glass-assessment-card`)
```css
.glass-assessment-card {
  position: relative;
  background: var(--glass-bg, rgba(11, 27, 44, 0.65));
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 
    0 24px 80px rgba(0, 0, 0, 0.55),
    0 0 40px -10px rgba(16, 185, 129, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.35s ease,
              box-shadow 0.35s ease;
}

/* 1px Specular Top Edge Gradient Highlight */
.glass-assessment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 5%, rgba(72, 237, 134, 0.6) 50%, transparent 95%);
  pointer-events: none;
  z-index: 2;
}

/* Hover Elevation */
.glass-assessment-card:hover {
  border-color: rgba(72, 237, 134, 0.28);
  box-shadow: 
    0 28px 90px rgba(0, 0, 0, 0.65),
    0 0 30px rgba(72, 237, 134, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(-4px);
}
```

---

### 5.4 Typography on Glass Rule
```css
/* Typography Weight Constraint: strictly font-weight <= 500 for descriptive text */
.glass-assessment-card p,
.glass-assessment-card span,
.glass-assessment-card label,
.glass-assessment-card small {
  font-weight: 400; /* or 500, never >= 600 for body copy on blurred glass */
  color: var(--text-secondary, #a7bbaa);
  line-height: 1.6;
}

.glass-assessment-card h2,
.glass-assessment-card h3 {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  color: var(--text-primary, #ffffff);
  letter-spacing: -0.02em;
}
```

---

### 5.5 Mobile Clearance & Touch Target Scale
```css
/* Container Mobile Clearance (pb-24 / 96px) */
.vitality-container {
  padding-bottom: 96px; /* Guarantees complete clearance over 56px fixed .mobileDock */
}

/* Touch Target Minimum Scale (>= 44px) */
.option-chip,
.step-btn,
.cart-add-btn,
.vitality-cta-btn {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

---

### 5.6 Responsive Breakpoints & Single-Column Stacking
```css
/* Responsive Grid Breakdown */
.vitality-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .vitality-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 650px) {
  .vitality-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .vitality-container {
    padding-left: 12px;
    padding-right: 12px;
    padding-bottom: 96px; /* Strict pb-24 */
    overflow-x: hidden;
  }
}
```

---

### 5.7 Accessibility & Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .glass-assessment-card,
  .glass-assessment-card:hover,
  .vitality-spring-element {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
```

---

## 6. Implementation Checklist for M3 Agent

1. **`src/App.tsx`**:
   - [ ] Import `VitalityAssessment` from `./components/VitalityAssessment/VitalityAssessment`.
   - [ ] Import `./components/VitalityAssessment/vitality-assessment.css`.
   - [ ] Insert `<a href="#vitality-score" className="navlink vitalityNavLink" ...>Vitality Score ✨</a>` into `<header className="header"><nav>`.
   - [ ] Insert `<a className="primary heroQuizBtn" href="#vitality-score" ...>Take 60s Health Quiz ✨</a>` into `.heroBtns`.
   - [ ] Mount `<section id="vitality-score" className="vitalityScoreSection">` immediately below `<section className="hero">` with `onAddToCart={(id) => qty(id, 1)}` and `onBookPackage={(id) => { qty(id, 1); setBookingOpen(true); }}`.

2. **`src/components/VitalityAssessment/vitality-assessment.css`**:
   - [ ] Configure `.vitalityScoreSection` with `scroll-margin-top: 90px`.
   - [ ] Implement `.glass-assessment-card` with `backdrop-filter: blur(28px)`, `box-shadow: 0 24px 80px rgba(0,0,0,0.55)`, and 1px `::before` specular gradient (`rgba(72, 237, 134, 0.6)`).
   - [ ] Enforce font-weight $\le 500$ on all copy and labels on glass.
   - [ ] Enforce `padding-bottom: 96px` (`pb-24`) on `.vitality-container`.
   - [ ] Set `min-height: 44px` on interactive chips and buttons.
   - [ ] Support `@media (prefers-reduced-motion: reduce)`.
