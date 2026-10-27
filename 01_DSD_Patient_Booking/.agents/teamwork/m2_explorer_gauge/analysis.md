# Radial Score Gauge Deep Architectural Analysis

## 1. Mathematical Circle Geometry
- **Center**: $(cx, cy) = (120, 120)$
- **Radius**: $r = 92\text{px}$
- **Stroke Width**: $12\text{px}$
- **Circumference**:
  $$C = 2 \cdot \pi \cdot r = 2 \cdot \pi \cdot 92 = 184\pi \approx 578.053048... \approx 578.053\text{px}$$
- **Stroke Dasharray**: $578.053$
- **Stroke Dashoffset Formula**:
  $$\text{offset}(s) = C - \left(\frac{s}{100}\right) \cdot C = 578.053 \cdot \left(1 - \frac{s}{100}\right)$$
  - $s = 0 \implies \text{offset} = 578.053$ (0% arc visible)
  - $s = 25 \implies \text{offset} = 433.540$ (25% arc visible)
  - $s = 50 \implies \text{offset} = 289.027$ (50% arc visible)
  - $s = 85 \implies \text{offset} = 86.708$ (85% arc visible)
  - $s = 100 \implies \text{offset} = 0.000$ (100% full circle visible)

## 2. Coordinate System & Rotational Alignment
- Default SVG circle has angle $0$ at 3 o'clock $(212, 120)$ and advances clockwise downwards to 6 o'clock $(120, 212)$ at angle $\pi/2$.
- Rotating the SVG container by $-90^\circ$ (`className="transform -rotate-90"` or `style={{ transform: 'rotate(-90deg)' }}`):
  - Local SVG $(212, 120)$ ($\theta = 0$) rotates to top apex $(120, 28)$ (12 o'clock).
  - Local SVG $(120, 212)$ ($\theta = \pi/2$) rotates to right apex $(212, 120)$ (3 o'clock).
  - Local SVG $(28, 120)$ ($\theta = \pi$) rotates to bottom apex $(120, 212)$ (6 o'clock).
  - Local SVG $(120, 28)$ ($\theta = 3\pi/2$) rotates to left apex $(28, 120)$ (9 o'clock).
- This aligns with the authoritative oracle formula in `e2e_tests/referenceOracle.js:390-392`:
  $$\theta = \frac{2\pi \cdot s}{100}$$
  $$x_{\text{particle}} = 120 + 92 \cdot \cos\theta$$
  $$y_{\text{particle}} = 120 + 92 \cdot \sin\theta$$
- At $s = 25$: $\theta = \pi/2 \implies x = 120, y = 212$.
  Rotated $-90^\circ$, this is visually at 3 o'clock, which matches 25% of the sweep from 12 o'clock!

## 3. Dynamic Multi-Stop Gradients & Atmospheric Glows
| Vitality Tier | Score Range | Primary Stop | Secondary Stop | Glow Shadow | Status Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Optimal** | $s \ge 80$ | `#48ed86` (DSD Emerald) | `#10b981` (Deep Emerald) | `rgba(72, 237, 134, 0.45)` | Optimal Vitality |
| **Moderate** | $55 \le s < 80$ | `#b7ff67` (Lime Accent) | `#f59e0b` (Warm Amber) | `rgba(245, 158, 11, 0.45)` | Moderate Health Risk |
| **Elevated Risk** | $s < 55$ | `#f97316` (Vibrant Orange) | `#f43f5e` (Rose Coral) | `rgba(244, 63, 94, 0.45)` | Elevated Attention Needed |

## 4. Glowing Head Particle Architecture
- Rendered conditionally when $s > 0$.
- Formed of concentric visual layers:
  1. Base outer glow aura: radius $10\text{px}$, `fill={glowColor}`, opacity $0.35$
  2. Intermediate chromatic core: radius $6\text{px}$, `fill={accentColor}`, `filter="url(#particle-glow)"`
  3. High-intensity center beacon: radius $3.5\text{px}$, `fill="#ffffff"`, `drop-shadow(0 0 6px #ffffff)`
- Positions dynamically at $(x_{\text{particle}}, y_{\text{particle}})$ coinciding with the center of the arc's rounded stroke cap (`strokeLinecap="round"`).

## 5. Central Score Counter & Status Badge
- Positioned absolutely inside the relative container, centered over the dial.
- Displays:
  - Top category label: `VITALITY SCORE` in uppercase tracking (`tracking-[0.16em]`, text `emerald-400/80`, 11px)
  - Numeric value: Large bold integer `{displayScore}` in `font-['Manrope'] font-extrabold text-5xl text-white tracking-tight tabular-nums`
  - Max reference denominator: `/100` in `text-xl text-neutral-400 font-semibold ml-1`
  - Status bracket pill badge: pill shaped (`rounded-full px-3 py-0.5 text-xs font-semibold border`), dynamic colors for border, background, and text.
