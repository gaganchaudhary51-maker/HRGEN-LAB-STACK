/**
 * Dr. Shastri Diagnostics (DSD Care) — Interactive Health Risk & Vitality Assessment
 * Component: src/components/VitalityAssessment/RadialScoreGauge.tsx
 *
 * Awwwards-grade Animated SVG Radial Score Gauge featuring:
 * - Circle geometry: radius r=92px, strokeWidth=12px, circumference C=578.053px
 * - Zero-dependency spring physics integration (k=300, c=30, m=1, 1.05x overshoot)
 * - Multi-stop dynamic gradients (Optimal Emerald, Moderate Amber, Elevated Coral)
 * - Atmospheric SVG drop-shadows & glowing multi-layer head particle tracking arc tip
 * - Central real-time numeric counter (/100) and clinical status bracket badge
 * - Full WCAG AA accessibility (role="meter", aria-valuenow, sr-only live region)
 */

import React, { useId } from 'react';
import { useSpringValue, SpringConfig } from './useSpringValue';

export interface RadialScoreGaugeProps {
  /** Target vitality score (0 to 100, clinical engine bounds [15, 98]) */
  score: number;
  /** Optional clinical bracket override from scoringEngine */
  bracket?: 'Optimal' | 'Moderate' | 'Elevated Risk';
  /** Diameter of the gauge in pixels (default: 240) */
  size?: number;
  /** Optional container class name for layout positioning */
  className?: string;
  /** Whether to render the glowing photon head particle at arc tip (default: true) */
  showParticle?: boolean;
  /** Custom spring physics configuration override */
  springConfig?: SpringConfig;
}

// ============================================================================
// GEOMETRY & PHYSICS CONSTANTS
// ============================================================================

const RADIUS = 92;
const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(3); // 578.053px
const STROKE_WIDTH = 12;
const CENTER = 120;
const VIEWBOX_SIZE = 240;

const DEFAULT_SPRING: SpringConfig = {
  stiffness: 300,
  damping: 30,
  mass: 1,
  initialValue: 0,
};

// ============================================================================
// TIER VISUAL TOKENS & CLINICAL PALETTES
// ============================================================================

export interface TierTheme {
  gradientId: string;
  startColor: string;
  endColor: string;
  glowColor: string;
  hexGlow: string;
  statusLabel: string;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  sublabel: string;
}

export const GAUGE_THEMES: Record<'Optimal' | 'Moderate' | 'Elevated Risk', TierTheme> = {
  Optimal: {
    gradientId: 'grad-optimal',
    startColor: '#48ed86', // DSD Signature Emerald
    endColor: '#10b981',   // Deep Emerald
    glowColor: 'rgba(72, 237, 134, 0.45)',
    hexGlow: '#48ed86',
    statusLabel: 'Optimal Vitality',
    badgeText: '#a7f3d0',
    badgeBg: 'rgba(72, 237, 134, 0.12)',
    badgeBorder: 'rgba(72, 237, 134, 0.35)',
    sublabel: 'Excellent biomarker stability',
  },
  Moderate: {
    gradientId: 'grad-moderate',
    startColor: '#b7ff67', // Lime Accent
    endColor: '#f59e0b',   // Warm Amber
    glowColor: 'rgba(245, 158, 11, 0.45)',
    hexGlow: '#f59e0b',
    statusLabel: 'Moderate Health Risk',
    badgeText: '#fde68a',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    sublabel: 'Lifestyle intervention recommended',
  },
  'Elevated Risk': {
    gradientId: 'grad-risk',
    startColor: '#f97316', // Orange
    endColor: '#f43f5e',   // Coral / Rose
    glowColor: 'rgba(244, 63, 94, 0.45)',
    hexGlow: '#f43f5e',
    statusLabel: 'Elevated Attention Needed',
    badgeText: '#fecdd3',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    sublabel: 'Diagnostic follow-up advised',
  },
};

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const RadialScoreGauge: React.FC<RadialScoreGaugeProps> = ({
  score,
  bracket,
  size = 240,
  className = '',
  showParticle = true,
  springConfig,
}) => {
  const uniqueId = useId().replace(/:/g, '');

  const effectiveSpringConfig: SpringConfig = {
    ...DEFAULT_SPRING,
    ...springConfig,
  };

  // Animate score value with natural damped harmonic oscillator (k=300, c=30, m=1)
  const animatedScore = useSpringValue(score, effectiveSpringConfig);

  // Integer score for the central readout
  const displayScore = Math.max(0, Math.min(100, Math.round(animatedScore)));
  // Float clamped [0, 100] for smooth stroke arc rendering
  const clampedProgress = Math.max(0, Math.min(100, animatedScore));

  // Circular arc dashoffset: C - (score / 100) * C
  const strokeDashoffset = +(CIRCUMFERENCE - (clampedProgress / 100) * CIRCUMFERENCE).toFixed(3);

  // Determine tier & color styling based on animated value or clinical bracket override
  const activeTier: 'Optimal' | 'Moderate' | 'Elevated Risk' =
    bracket ??
    (clampedProgress >= 80 ? 'Optimal' : clampedProgress >= 55 ? 'Moderate' : 'Elevated Risk');

  const theme = GAUGE_THEMES[activeTier];

  // Trigonometric tip particle coordinates inside the -90deg rotated SVG coordinate system:
  // angleRad = 2 * PI * (progress / 100)
  // x = 120 + 92 * cos(angleRad)
  // y = 120 + 92 * sin(angleRad)
  const angleRad = (2 * Math.PI * clampedProgress) / 100;
  const headParticleX = +(CENTER + RADIUS * Math.cos(angleRad)).toFixed(2);
  const headParticleY = +(CENTER + RADIUS * Math.sin(angleRad)).toFixed(2);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={displayScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${displayScore} out of 100, ${theme.statusLabel}`}
      aria-label="Health Vitality Score Radial Dial"
    >
      {/* Screen Reader Live Region */}
      <div aria-live="polite" className="sr-only">
        Vitality Score: {displayScore} out of 100. Status: {theme.statusLabel}.
      </div>

      {/* SVG Canvas (Rotated -90deg so arc starts cleanly at 12 o'clock apex) */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="w-full h-full transform -rotate-90 pointer-events-none"
        style={{
          filter: `drop-shadow(0 0 18px ${theme.glowColor})`,
          transition: 'filter 400ms ease-out',
        }}
      >
        <defs>
          {/* Optimal Emerald Gradient */}
          <linearGradient id="grad-optimal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#48ed86" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Moderate Lime / Amber Gradient */}
          <linearGradient id="grad-moderate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b7ff67" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Elevated Risk Orange / Coral Gradient */}
          <linearGradient id="grad-risk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Atmospheric Particle Blur Filters */}
          <filter id={`${uniqueId}-particle-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={`${uniqueId}-particle-core`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* 1. Outer Concentric Precision Compass Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS + 14}
          fill="none"
          stroke="rgba(72, 237, 134, 0.10)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* 2. Inner Recessed Aesthetic Guide Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - 14}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />

        {/* 3. Base Background Groove Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={STROKE_WIDTH}
        />

        {/* 4. Spring-Animated Multi-Stop Gradient Progress Arc */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={`url(#${theme.gradientId})`}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke 400ms ease-out',
            willChange: 'stroke-dashoffset',
          }}
        />

        {/* 5. Glowing Trigonometric Photon Head Particle */}
        {showParticle && clampedProgress > 1 && (
          <g className="head-particle-cursor">
            {/* Atmospheric Diffuse Aura */}
            <circle
              cx={headParticleX}
              cy={headParticleY}
              r="10"
              fill={theme.hexGlow}
              opacity="0.35"
              filter={`url(#${uniqueId}-particle-blur)`}
            />
            {/* Intermediate Chromatic Core */}
            <circle
              cx={headParticleX}
              cy={headParticleY}
              r="5.5"
              fill={theme.startColor}
              filter={`url(#${uniqueId}-particle-core)`}
            />
            {/* High-Intensity Photon Beacon */}
            <circle
              cx={headParticleX}
              cy={headParticleY}
              r="3"
              fill="#ffffff"
              style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }}
            />
          </g>
        )}
      </svg>

      {/* Central Metric Value & Clinical Bracket Badge (Absolute Overlay) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-4">
        {/* Subtle Upper Eyebrow */}
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/90 mb-0.5">
          Vitality Score
        </span>

        {/* Animated Numeric Counter */}
        <div className="flex items-baseline justify-center">
          <span className="font-['Manrope'] text-5xl font-extrabold text-white tracking-tight tabular-nums">
            {displayScore}
          </span>
          <span className="text-xl text-neutral-400 font-semibold ml-1">/100</span>
        </div>

        {/* Clinical Status Bracket Pill Badge */}
        <span
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 text-xs font-semibold rounded-full border transition-all duration-300"
          style={{
            borderColor: theme.badgeBorder,
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            boxShadow: `0 0 12px ${theme.glowColor}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: theme.startColor }}
          />
          {theme.statusLabel}
        </span>
      </div>
    </div>
  );
};

export default RadialScoreGauge;
