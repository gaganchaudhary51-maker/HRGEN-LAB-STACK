/**
 * Dr. Shastri Diagnostics (DSD Care) — Interactive Health Risk & Vitality Assessment
 * Module: src/components/VitalityAssessment/useSpringValue.ts
 *
 * Production-grade, zero-dependency Spring Physics Hook implementing:
 * - Second-order damped harmonic oscillator ODE: m d²x/dt² + c dx/dt + k(x - target) = 0
 * - Default parameters: stiffness (k) = 300, damping (c) = 30, mass (m) = 1
 * - Tuned subtle 1.05x overshoot support (c = 22.8 / SPRING_PRESETS.awwwards)
 * - Substepped Semi-Implicit Euler (Symplectic) integration for 60Hz/120Hz framerate invariance
 * - Delta time (dt) clamping against browser background throttling (MAX_FRAME_DT = 64ms, MAX_SUBSTEP_DT = 8ms)
 * - Momentum preservation during mid-flight target retargeting
 * - Full React 19 StrictMode idempotency & rAF cleanup
 * - Accessible @media (prefers-reduced-motion: reduce) instant bypass with dynamic listener
 */

import { useState, useEffect, useRef } from 'react';

export interface SpringConfig {
  /**
   * Spring stiffness coefficient (k).
   * Higher values increase the pull towards the target value.
   * @default 300
   */
  stiffness?: number;

  /**
   * Damping coefficient (c).
   * Controls dissipation of kinetic energy.
   * - c = 30: Textbook underdamped baseline (zeta = 0.866)
   * - c = 22.8: Tuned for exact 1.05x subtle peak overshoot
   * @default 30
   */
  damping?: number;

  /**
   * Oscillating mass (m).
   * @default 1
   */
  mass?: number;

  /**
   * Initial value on component mount before animating to targetValue.
   * If omitted, defaults to targetValue (prevents unwanted mount pop for resting elements).
   * Set to 0 for entrance animations (e.g. dial moving from 0 to target score).
   * @default undefined
   */
  initialValue?: number;

  /**
   * Absolute distance tolerance to consider position settled.
   * @default 0.05
   */
  settleTolerance?: number;

  /**
   * Absolute velocity tolerance to consider motion settled.
   * @default 0.05
   */
  velocityTolerance?: number;

  /**
   * If true, clamps value so it never exceeds targetValue.
   * @default false
   */
  clampOvershoot?: boolean;
}

/**
 * Curated Spring Physics Presets for UI Micro-Interactions
 */
export const SPRING_PRESETS = {
  /** Awwwards-grade subtle 1.05x overshoot dial animation */
  awwwards: { stiffness: 300, damping: 22.8, mass: 1 },
  /** Smooth damped harmonic oscillator baseline */
  smooth: { stiffness: 300, damping: 30, mass: 1 },
  /** Fast responsive pop for button clicks and toggles */
  snappy: { stiffness: 420, damping: 32, mass: 1 },
  /** Gentle relaxed glide for expansive panels */
  gentle: { stiffness: 180, damping: 24, mass: 1 },
} as const;

// Safe rAF wrappers for SSR / Node.js test execution
const safeRequestAnimationFrame = (callback: FrameRequestCallback): number => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
};

const safeCancelAnimationFrame = (id: number): void => {
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Custom React 19 Hook: useSpringValue
 *
 * @param targetValue The target scalar value to animate towards
 * @param config Optional spring physics configuration
 * @returns The current animated scalar value
 */
export function useSpringValue(
  targetValue: number,
  config?: SpringConfig
): number {
  // Extract configuration with safe defaults
  const stiffness = config?.stiffness ?? 300;
  const damping = config?.damping ?? 30;
  const mass = config?.mass ?? 1;
  const settleTolerance = config?.settleTolerance ?? 0.05;
  const velocityTolerance = config?.velocityTolerance ?? 0.05;
  const clampOvershoot = config?.clampOvershoot ?? false;
  const initialValue = config?.initialValue;

  // React state reflecting current animated value
  const [current, setCurrent] = useState<number>(() =>
    initialValue !== undefined ? initialValue : targetValue
  );

  // Mutable refs preserving physics state across renders & React 19 StrictMode cycles
  const currentRef = useRef<number>(
    initialValue !== undefined ? initialValue : targetValue
  );
  const velocityRef = useRef<number>(0);
  const targetRef = useRef<number>(targetValue);
  const animFrameRef = useRef<number | null>(null);

  // Keep targetRef updated on every render
  targetRef.current = targetValue;

  useEffect(() => {
    // ------------------------------------------------------------------------
    // 1. Accessibility Check: Prefers-Reduced-Motion Bypass & Dynamic Listener
    // ------------------------------------------------------------------------
    const mql =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (mql?.matches) {
      if (animFrameRef.current !== null) {
        safeCancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      currentRef.current = targetValue;
      velocityRef.current = 0;
      setCurrent(targetValue);
      return;
    }

    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        if (animFrameRef.current !== null) {
          safeCancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        currentRef.current = targetRef.current;
        velocityRef.current = 0;
        setCurrent(targetRef.current);
      }
    };

    if (mql) {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleMotionPreferenceChange);
      } else if (typeof (mql as any).addListener === 'function') {
        (mql as any).addListener(handleMotionPreferenceChange);
      }
    }

    // ------------------------------------------------------------------------
    // 2. Early Settled Check: Zero Displacement Boundary Condition
    // ------------------------------------------------------------------------
    const initialDisplacement = Math.abs(currentRef.current - targetValue);
    if (
      initialDisplacement <= settleTolerance &&
      Math.abs(velocityRef.current) <= velocityTolerance
    ) {
      currentRef.current = targetValue;
      velocityRef.current = 0;
      setCurrent(targetValue);
      return () => {
        if (mql) {
          if (typeof mql.removeEventListener === 'function') {
            mql.removeEventListener('change', handleMotionPreferenceChange);
          } else if (typeof (mql as any).removeListener === 'function') {
            (mql as any).removeListener(handleMotionPreferenceChange);
          }
        }
      };
    }

    // ------------------------------------------------------------------------
    // 3. Substepped Semi-Implicit Euler Physics Loop
    // ------------------------------------------------------------------------
    let lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const MAX_FRAME_DT = 0.064;    // 64ms maximum frame clamp (guards against tab resume spikes)
    const MAX_SUBSTEP_DT = 0.008;  // 8ms substep size for high numerical fidelity

    const step = (now: number) => {
      const dtRaw = (now - lastTime) / 1000;
      lastTime = now;

      // Skip negligible or negative time steps (e.g. clock adjustments)
      if (dtRaw <= 0) {
        animFrameRef.current = safeRequestAnimationFrame(step);
        return;
      }

      const dt = Math.min(dtRaw, MAX_FRAME_DT);

      // Substepped integration: dt / 0.008
      let remainingDt = dt;
      while (remainingDt > 0) {
        const dtStep = Math.min(remainingDt, MAX_SUBSTEP_DT);
        const displacement = currentRef.current - targetRef.current;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * velocityRef.current;
        const acceleration = (springForce + dampingForce) / mass;

        // Symplectic update: velocity first, then position
        velocityRef.current += acceleration * dtStep;
        currentRef.current += velocityRef.current * dtStep;

        // Optional overshoot clamping
        if (clampOvershoot) {
          if (displacement < 0 && currentRef.current > targetRef.current) {
            currentRef.current = targetRef.current;
            velocityRef.current = 0;
          } else if (displacement > 0 && currentRef.current < targetRef.current) {
            currentRef.current = targetRef.current;
            velocityRef.current = 0;
          }
        }

        remainingDt -= dtStep;
      }

      // Check settling conditions
      const settled =
        Math.abs(currentRef.current - targetRef.current) <= settleTolerance &&
        Math.abs(velocityRef.current) <= velocityTolerance;

      if (!settled) {
        setCurrent(currentRef.current);
        animFrameRef.current = safeRequestAnimationFrame(step);
      } else {
        // Snap cleanly to final target value
        currentRef.current = targetRef.current;
        velocityRef.current = 0;
        setCurrent(targetRef.current);
        animFrameRef.current = null;
      }
    };

    // Kick off animation frame loop
    animFrameRef.current = safeRequestAnimationFrame(step);

    // ------------------------------------------------------------------------
    // 4. Cleanup on Unmount or Dependency Change
    // ------------------------------------------------------------------------
    return () => {
      if (animFrameRef.current !== null) {
        safeCancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mql) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', handleMotionPreferenceChange);
        } else if (typeof (mql as any).removeListener === 'function') {
          (mql as any).removeListener(handleMotionPreferenceChange);
        }
      }
    };
  }, [
    targetValue,
    stiffness,
    damping,
    mass,
    settleTolerance,
    velocityTolerance,
    clampOvershoot,
  ]);

  return current;
}

export default useSpringValue;
