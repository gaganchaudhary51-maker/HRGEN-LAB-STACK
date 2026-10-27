/**
 * Dr. Shastri Diagnostics (DSD Care) — Interactive Health Risk & Vitality Score Assessment
 * Component: src/components/VitalityAssessment/VitalityAssessment.tsx
 *
 * Awwwards-grade, dark-glassmorphic 3-step clinical quiz and hybrid package recommendation engine.
 * Features:
 * 1. 3-Step Interactive Clinical Quiz with strict validation and mutual exclusivity logic.
 * 2. Second-order spring physics integration for smooth progress tracking.
 * 3. Animated SVG RadialScoreGauge dial with dynamic multi-tier color glow.
 * 4. 4 Multi-axial physiological risk indicators (Metabolic, Cardiovascular, Renal, Joint/Inflammation).
 * 5. Dynamic Dr. Shastri Clinical Explanations highlighting 6 core biomarkers.
 * 6. Dual Package Recommendation Cards: Targeted Primary Match vs High-Value Preventive Camp Alternative with savings comparison.
 * 7. 1-Click active cart synchronization via onAddToCart(packageId) and direct home sample collection booking.
 */

import React, { useState, useMemo } from 'react';
import {
  calculateVitalityAssessment,
  AssessmentInput,
  AssessmentResult,
} from './scoringEngine';
import { RadialScoreGauge } from './RadialScoreGauge';
import { useSpringValue, SPRING_PRESETS } from './useSpringValue';
import './vitality-assessment.css';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Flame,
  FlaskConical,
  HeartPulse,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export interface VitalityAssessmentProps {
  onAddToCart: (packageId: string) => void;
  onBookPackage?: (packageId: string) => void;
  className?: string;
}

export type QuizStep = 1 | 2 | 3 | 'results';

export interface QuizState {
  ageGroup: AssessmentInput['ageGroup'] | null;
  gender: AssessmentInput['gender'] | null;
  activityLevel: AssessmentInput['activityLevel'] | null;
  sleepStress: AssessmentInput['sleepStress'] | null;
  symptoms: AssessmentInput['symptoms'];
  familyHistory: AssessmentInput['familyHistory'];
}

const INITIAL_STATE: QuizState = {
  ageGroup: null,
  gender: null,
  activityLevel: null,
  sleepStress: null,
  symptoms: [],
  familyHistory: [],
};

export const VitalityAssessment: React.FC<VitalityAssessmentProps> = ({
  onAddToCart,
  onBookPackage,
  className = '',
}) => {
  const [step, setStep] = useState<QuizStep>(1);
  const [state, setState] = useState<QuizState>(INITIAL_STATE);
  const [addedPackageId, setAddedPackageId] = useState<string | null>(null);

  // Animated progress bar along top edge (33% -> 66% -> 100%)
  const numericStep = step === 'results' ? 3 : step;
  const progressPercent = (numericStep / 3) * 100;
  const animatedProgress = useSpringValue(progressPercent, SPRING_PRESETS.smooth);

  // Validation predicates
  const isStep1Valid = Boolean(
    state.ageGroup && state.gender && state.activityLevel && state.sleepStress
  );
  const isStep2Valid = state.symptoms.length > 0;
  const isStep3Valid = state.familyHistory.length > 0;

  // Multi-select handlers with mutual exclusivity
  const toggleSymptom = (sym: AssessmentInput['symptoms'][number]) => {
    setState((prev) => {
      if (sym === 'general_checkup') {
        const has = prev.symptoms.includes('general_checkup');
        return { ...prev, symptoms: has ? [] : ['general_checkup'] };
      }
      const filtered = prev.symptoms.filter((s) => s !== 'general_checkup');
      const next = filtered.includes(sym)
        ? filtered.filter((s) => s !== sym)
        : [...filtered, sym];
      return { ...prev, symptoms: next };
    });
  };

  const toggleFamilyHistory = (fh: AssessmentInput['familyHistory'][number]) => {
    setState((prev) => {
      if (fh === 'none') {
        const has = prev.familyHistory.includes('none');
        return { ...prev, familyHistory: has ? [] : ['none'] };
      }
      const filtered = prev.familyHistory.filter((f) => f !== 'none');
      const next = filtered.includes(fh)
        ? filtered.filter((f) => f !== fh)
        : [...filtered, fh];
      return { ...prev, familyHistory: next };
    });
  };

  // Assessment calculation memoized for Results view
  const assessmentResult: AssessmentResult | null = useMemo(() => {
    if (step !== 'results') return null;
    const input: AssessmentInput = {
      ageGroup: state.ageGroup || '30-45',
      gender: state.gender || 'male',
      activityLevel: state.activityLevel || 'moderate',
      sleepStress: state.sleepStress || 'moderate_stress',
      symptoms: state.symptoms,
      familyHistory: state.familyHistory,
    };
    return calculateVitalityAssessment(input);
  }, [step, state]);

  // Cart addition with instant visual feedback
  const handleAddToCart = (pkgId: string) => {
    onAddToCart(pkgId);
    setAddedPackageId(pkgId);
    setTimeout(() => setAddedPackageId(null), 2500);
  };

  const handleRetake = () => {
    setStep(1);
    setAddedPackageId(null);
  };

  return (
    <section
      id="vitality-score"
      className={`vitality-container ${className}`}
      role="region"
      aria-label="Health Risk & Vitality Score Assessment"
    >
      {/* Ambient background glow orbs */}
      <div className="vitality-glow-orb glow-top-left" aria-hidden="true" />
      <div className="vitality-glow-orb glow-bottom-right" aria-hidden="true" />

      <div className="glass-assessment-card">
        {/* Top Spring-Animated Progress Indicator */}
        <div
          className="step-progress-track"
          role="progressbar"
          aria-valuenow={numericStep}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Quiz Step Progress"
        >
          <div
            className="step-progress-bar"
            style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
          />
        </div>

        {/* ================================================================= */}
        {/* STEP 1: DEMOGRAPHICS & LIFESTYLE */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="step-pane step-pane-1">
            <div className="step-header">
              <span className="step-badge">
                <Sparkles size={13} className="text-emerald-400" />
                Step 1 of 3 · Demographics & Baseline Lifestyle
              </span>
              <h2 className="step-title">Personalize your diagnostic profile</h2>
              <p className="step-desc">
                Baseline biological variables calibrate metabolic, cardiovascular, and organ reserve thresholds.
              </p>
            </div>

            {/* Field 1: Age Group */}
            <div className="quiz-field-group">
              <label className="field-label">Age Group</label>
              <div className="chip-grid grid-4" role="radiogroup" aria-label="Age Group">
                {[
                  { value: '18-29', label: '18–29 yrs', sub: 'Young Adult' },
                  { value: '30-45', label: '30–45 yrs', sub: 'Prime Adult' },
                  { value: '46-60', label: '46–60 yrs', sub: 'Mature Adult' },
                  { value: '60+', label: '60+ yrs', sub: 'Senior Care' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.ageGroup === opt.value}
                    className={`option-chip ${state.ageGroup === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, ageGroup: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                    <span className="chip-secondary">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Gender Identity */}
            <div className="quiz-field-group">
              <label className="field-label">Gender Identity</label>
              <div className="chip-grid grid-3" role="radiogroup" aria-label="Gender Identity">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other / Non-Binary' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.gender === opt.value}
                    className={`option-chip ${state.gender === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, gender: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Activity Level */}
            <div className="quiz-field-group">
              <label className="field-label">Weekly Activity Level</label>
              <div className="chip-grid grid-3" role="radiogroup" aria-label="Weekly Activity Level">
                {[
                  { value: 'sedentary', label: 'Sedentary', sub: '<30m active / desk job' },
                  { value: 'moderate', label: 'Moderate', sub: '1–3 sessions / brisk walk' },
                  { value: 'active', label: 'Active', sub: '4+ fitness workouts/wk' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.activityLevel === opt.value}
                    className={`option-chip ${state.activityLevel === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, activityLevel: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                    <span className="chip-secondary">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Sleep & Stress Load */}
            <div className="quiz-field-group">
              <label className="field-label">Sleep Quality & Chronic Stress</label>
              <div className="chip-grid grid-3" role="radiogroup" aria-label="Sleep Quality and Stress">
                {[
                  { value: 'restful', label: 'Restful Sleep', sub: '7–8 hrs, low stress' },
                  { value: 'moderate_stress', label: 'Moderate Stress', sub: 'Variable sleep, busy routine' },
                  { value: 'poor_sleep_high_stress', label: 'High Strain', sub: '<6 hrs, high stress/burnout' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={state.sleepStress === opt.value}
                    className={`option-chip ${state.sleepStress === opt.value ? 'selected' : ''}`}
                    onClick={() => setState((p) => ({ ...p, sleepStress: opt.value as any }))}
                  >
                    <span className="chip-primary">{opt.label}</span>
                    <span className="chip-secondary">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="step-actions justify-end">
              <button
                type="button"
                className="step-btn step-btn-primary"
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
              >
                <span>Continue to Symptoms</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: PRIMARY SYMPTOMS & CONCERNS */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="step-pane step-pane-2">
            <div className="step-header">
              <span className="step-badge">
                <Activity size={13} className="text-emerald-400" />
                Step 2 of 3 · Primary Symptoms & Health Concerns
              </span>
              <h2 className="step-title">What has your body been communicating?</h2>
              <p className="step-desc">
                Select any symptoms experienced in recent weeks. Multi-select is supported.
              </p>
            </div>

            <div className="chip-vertical-stack" role="group" aria-label="Symptoms Multi-Select">
              {[
                {
                  id: 'fatigue',
                  icon: '⚡',
                  title: 'Fatigue, Lethargy or Low Stamina',
                  desc: 'Midday crashes, waking unrefreshed, decreased physical endurance',
                },
                {
                  id: 'thirst_urination',
                  icon: '💧',
                  title: 'Frequent Thirst or Increased Urination',
                  desc: 'Increased fluid intake, nocturia, dry mouth despite drinking water',
                },
                {
                  id: 'joint_pain',
                  icon: '🦴',
                  title: 'Joint Stiffness, Knee Ache or Back Pain',
                  desc: 'Morning stiffness, crepitus, musculoskeletal aches after sitting or standing',
                },
                {
                  id: 'bp_concerns',
                  icon: '🩺',
                  title: 'Blood Pressure Concerns, Headaches or Palpitations',
                  desc: 'Elevated BP readings, occasional dizziness, postural lightheadedness',
                },
                {
                  id: 'general_checkup',
                  icon: '🛡️',
                  title: 'None of these · General Preventive Wellness',
                  desc: 'Asymptomatic annual screening to verify baseline cellular vitality',
                },
              ].map((sym) => {
                const isSelected = state.symptoms.includes(sym.id as any);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`option-card-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(sym.id as any)}
                  >
                    <div className="card-row-icon">{sym.icon}</div>
                    <div className="card-row-content">
                      <div className="card-row-title">{sym.title}</div>
                      <div className="card-row-desc">{sym.desc}</div>
                    </div>
                    <div className="checkbox-indicator">
                      {isSelected && <Check size={14} className="text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="step-actions justify-between">
              <button
                type="button"
                className="step-btn step-btn-secondary"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={17} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="step-btn step-btn-primary"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
              >
                <span>Continue to Family History</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: FAMILY MEDICAL HISTORY */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="step-pane step-pane-3">
            <div className="step-header">
              <span className="step-badge">
                <ShieldCheck size={13} className="text-emerald-400" />
                Step 3 of 3 · Familial & Genetic Predispositions
              </span>
              <h2 className="step-title">Any chronic conditions in your immediate family?</h2>
              <p className="step-desc">
                First-degree relatives (parents or siblings). Multi-select is supported.
              </p>
            </div>

            <div className="chip-vertical-stack" role="group" aria-label="Family History Multi-Select">
              {[
                {
                  id: 'diabetes',
                  icon: '🩸',
                  title: 'Diabetes or Insulin Resistance',
                  desc: 'Type 1 or Type 2 diabetes, high fasting glucose, Gestational diabetes',
                },
                {
                  id: 'hypertension',
                  icon: '❤️',
                  title: 'Hypertension or Cardiovascular Disease',
                  desc: 'High blood pressure, coronary artery disease, elevated cholesterol history',
                },
                {
                  id: 'kidney',
                  icon: '🧪',
                  title: 'Kidney Conditions or Renal Calculi',
                  desc: 'Recurrent kidney stones, chronic kidney disease, proteinuria, gout',
                },
                {
                  id: 'thyroid',
                  icon: '🦋',
                  title: 'Thyroid Disorders',
                  desc: 'Hypothyroidism, Hashimoto’s, Hyperthyroidism, goitre or nodular history',
                },
                {
                  id: 'none',
                  icon: '🌿',
                  title: 'No Known Chronic Family History',
                  desc: 'No documented chronic illnesses among immediate first-degree family',
                },
              ].map((fh) => {
                const isSelected = state.familyHistory.includes(fh.id as any);
                return (
                  <button
                    key={fh.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`option-card-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleFamilyHistory(fh.id as any)}
                  >
                    <div className="card-row-icon">{fh.icon}</div>
                    <div className="card-row-content">
                      <div className="card-row-title">{fh.title}</div>
                      <div className="card-row-desc">{fh.desc}</div>
                    </div>
                    <div className="checkbox-indicator">
                      {isSelected && <Check size={14} className="text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="step-actions justify-between">
              <button
                type="button"
                className="step-btn step-btn-secondary"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={17} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="step-btn step-btn-submit"
                disabled={!isStep3Valid}
                onClick={() => setStep('results')}
              >
                <Sparkles size={17} />
                <span>Calculate My Vitality Score ✨</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* RESULTS PRESENTATION */}
        {/* ================================================================= */}
        {step === 'results' && assessmentResult && (
          <div className="results-pane">
            {/* Top Action / Reset Bar */}
            <div className="results-top-bar">
              <span className="results-eyebrow">
                <BadgeCheck size={15} className="text-emerald-400" />
                Dr. Shastri Diagnostics · Clinical Assessment Report
              </span>
              <button
                type="button"
                className="retake-btn"
                onClick={handleRetake}
                aria-label="Retake Health Assessment"
              >
                <RotateCcw size={14} />
                <span>Retake Quiz</span>
              </button>
            </div>

            {/* Hero Dial & Status Overview */}
            <div className="results-hero-grid">
              <div className="gauge-column">
                <RadialScoreGauge
                  score={assessmentResult.vitalityScore}
                  bracket={assessmentResult.vitalityBracket}
                  size={240}
                  className="mx-auto"
                />
              </div>
              <div className="verdict-column">
                <div className="verdict-badge-row">
                  <span
                    className={`status-pill ${
                      assessmentResult.vitalityBracket === 'Optimal'
                        ? 'pill-optimal'
                        : assessmentResult.vitalityBracket === 'Moderate'
                        ? 'pill-moderate'
                        : 'pill-risk'
                    }`}
                  >
                    ● {assessmentResult.vitalityBracket} Vitality Status
                  </span>
                  <span className="score-summary-tag">
                    Score: {assessmentResult.vitalityScore}/100
                  </span>
                </div>
                <h3 className="verdict-title">
                  {assessmentResult.vitalityBracket === 'Optimal'
                    ? 'Optimal Physiological Equilibrium'
                    : assessmentResult.vitalityBracket === 'Moderate'
                    ? 'Subclinical Metabolic Strain Detected'
                    : 'Elevated Risk Profile Requiring Targeted Evaluation'}
                </h3>
                <p className="verdict-text">
                  {assessmentResult.vitalityBracket === 'Optimal'
                    ? 'Your biomarkers demonstrate strong metabolic resilience and low organ workload. Annual preventive health profiling is recommended to sustain these protective baseline ranges.'
                    : assessmentResult.vitalityBracket === 'Moderate'
                    ? 'Moderate metabolic or lifestyle stressors detected. Diagnostic screening will identify early glycemic variability, lipid imbalances, or subclinical cellular inflammation.'
                    : 'Significant physiological or genetic risk markers detected across one or more diagnostic axes. Targeted clinical panels are advised to prevent silent progression.'}
                </p>
                <div className="summary-tags-deck">
                  <span className="tag-chip">Age: {state.ageGroup}</span>
                  <span className="tag-chip">Activity: {state.activityLevel}</span>
                  <span className="tag-chip">Sleep/Stress: {state.sleepStress}</span>
                  {state.symptoms.map((s) => (
                    <span key={s} className="tag-chip tag-highlight">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Axis Risk Breakdown (4 Axes) */}
            <div className="risk-axes-section">
              <h4 className="section-title">Multi-Axial Physiological Risk Indicators</h4>
              <div className="risk-axes-grid">
                {[
                  {
                    key: 'metabolic',
                    name: 'Metabolic Balance',
                    icon: <Flame size={18} className="text-amber-400" />,
                    data: assessmentResult.riskAxes.metabolic,
                  },
                  {
                    key: 'cardiovascular',
                    name: 'Cardiovascular Load',
                    icon: <HeartPulse size={18} className="text-rose-400" />,
                    data: assessmentResult.riskAxes.cardiovascular,
                  },
                  {
                    key: 'renal',
                    name: 'Renal Filtration Reserve',
                    icon: <FlaskConical size={18} className="text-cyan-400" />,
                    data: assessmentResult.riskAxes.renal,
                  },
                  {
                    key: 'joint',
                    name: 'Joint & Musculoskeletal Integrity',
                    icon: <Activity size={18} className="text-emerald-400" />,
                    data: assessmentResult.riskAxes.joint,
                  },
                ].map((axis) => {
                  const levelClass =
                    axis.data.level === 'Low'
                      ? 'level-low'
                      : axis.data.level === 'Moderate'
                      ? 'level-moderate'
                      : 'level-high';
                  return (
                    <div key={axis.key} className="axis-card">
                      <div className="axis-header">
                        <div className="axis-title-group">
                          {axis.icon}
                          <span className="axis-name">{axis.name}</span>
                        </div>
                        <span className={`axis-level-badge ${levelClass}`}>
                          {axis.data.level} Risk
                        </span>
                      </div>
                      <div className="axis-meter-track">
                        <div
                          className={`axis-meter-fill ${levelClass}`}
                          style={{ width: `${axis.data.percentage}%` }}
                        />
                      </div>
                      <div className="axis-meter-label">
                        <span>Risk Index</span>
                        <b>{axis.data.percentage}%</b>
                      </div>
                      <p className="axis-summary">{axis.data.summary}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Clinical Explanations Section */}
            <div className="explanations-section">
              <div className="section-header-box">
                <span className="section-badge">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Clinical Rationale
                </span>
                <h4 className="section-title">
                  Why Dr. Shastri Diagnostics recommends this for your score
                </h4>
                <p className="section-desc">
                  Our algorithm prioritizes specific biochemical parameters based on your detected physiological and genetic factors:
                </p>
              </div>

              <div className="explanations-grid">
                {assessmentResult.clinicalExplanations.map((exp) => (
                  <div key={exp.parameter} className="explanation-card">
                    <div className="exp-card-header">
                      <span className="exp-param-badge">{exp.parameter}</span>
                      <span className="exp-role">{exp.role}</span>
                    </div>
                    <p className="exp-reason">{exp.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Package Recommendations */}
            <div className="recommendations-section">
              <div className="section-header-box text-center">
                <span className="section-badge mx-auto">
                  <Sparkles size={14} className="text-emerald-400" />
                  Hybrid Package Match
                </span>
                <h4 className="section-title">Tailored Diagnostic Solutions</h4>
                <p className="section-desc">
                  Compare the targeted clinical match addressing your specific vulnerabilities with our high-value preventive camp alternative:
                </p>
              </div>

              <div className="recommendations-dual-grid">
                {/* 1. Primary Clinical Match */}
                <div className="recommendation-card card-primary">
                  <div className="card-top-tag tag-primary">
                    <BadgeCheck size={14} />
                    <span>Targeted Match</span>
                  </div>
                  <h5 className="rec-package-name">
                    {assessmentResult.primaryPackage.name}
                  </h5>
                  <div className="rec-package-pricing">
                    <span className="rec-price">
                      ₹{assessmentResult.primaryPackage.price.toLocaleString('en-IN')}
                    </span>
                    {assessmentResult.primaryPackage.originalPrice >
                      assessmentResult.primaryPackage.price && (
                      <span className="rec-old-price">
                        ₹{assessmentResult.primaryPackage.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="rec-param-count">
                      {assessmentResult.primaryPackage.parameterCount} Parameters
                    </span>
                  </div>
                  <p className="rec-desc">
                    {assessmentResult.primaryPackage.description}
                  </p>

                  <div className="key-params-list">
                    <span className="list-heading">Key Biomarkers Tested:</span>
                    <ul>
                      {assessmentResult.primaryPackage.keyParameters.map((p, idx) => (
                        <li key={idx}>
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="cart-add-btn primary-cart-btn"
                    onClick={() => handleAddToCart(assessmentResult.primaryPackage.id)}
                    aria-label={`Add ${assessmentResult.primaryPackage.name} to cart`}
                  >
                    <ShoppingBag size={17} />
                    <span>
                      {addedPackageId === assessmentResult.primaryPackage.id
                        ? 'Added to Cart ✓'
                        : 'Add Targeted Match to Cart'}
                    </span>
                  </button>
                </div>

                {/* 2. Preventive Camp Alternative */}
                <div className="recommendation-card card-camp">
                  <div className="card-top-tag tag-camp">
                    <Sparkles size={14} />
                    <span>High-Value Preventive Camp</span>
                  </div>
                  <h5 className="rec-package-name">
                    {assessmentResult.campAlternativePackage.name}
                  </h5>
                  <div className="rec-package-pricing">
                    <span className="rec-price">
                      ₹{assessmentResult.campAlternativePackage.price.toLocaleString('en-IN')}
                    </span>
                    {assessmentResult.savingsAmount > 0 && (
                      <span className="savings-badge">
                        Save ₹{assessmentResult.savingsAmount.toLocaleString('en-IN')} (
                        {assessmentResult.savingsPercentage}% lower)
                      </span>
                    )}
                    <span className="rec-param-count">
                      {assessmentResult.campAlternativePackage.parameterCount} Parameters
                    </span>
                  </div>
                  <p className="rec-desc">
                    {assessmentResult.campAlternativePackage.description}
                  </p>

                  <div className="key-params-list">
                    <span className="list-heading">Camp Inclusions & Tests:</span>
                    <ul>
                      {assessmentResult.campAlternativePackage.keyParameters.map((p, idx) => (
                        <li key={idx}>
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="cart-add-btn camp-cart-btn"
                    onClick={() =>
                      handleAddToCart(assessmentResult.campAlternativePackage.id)
                    }
                    aria-label={`Add ${assessmentResult.campAlternativePackage.name} to cart`}
                  >
                    <ShoppingBag size={17} />
                    <span>
                      {addedPackageId === assessmentResult.campAlternativePackage.id
                        ? 'Added to Cart ✓'
                        : 'Add Camp Alternative to Cart'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Booking / Cart Direct CTA */}
              {onBookPackage && (
                <div className="bottom-booking-bar">
                  <button
                    type="button"
                    className="proceed-booking-btn"
                    onClick={() =>
                      onBookPackage(assessmentResult.primaryPackage.id)
                    }
                  >
                    <span>Proceed to Home Sample Booking with Targeted Match</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default VitalityAssessment;
