import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Interactive3DAnatomyAtlas from './Interactive3DAnatomyAtlas';
import { DiagnosticPackage } from './PackageDetailModal';
import {
  Activity,
  Droplet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  ChevronRight
} from 'lucide-react';

export interface DiseaseAnatomyResonanceArenaProps {
  onAddToCart: (pkg: DiagnosticPackage) => void;
}

interface InteractiveDiseaseFlowItem {
  id: string;
  organId: string;
  categoryName: string;
  badgeTag: string;
  organName: string;
  organEmoji: string;
  accentColor: string;
  secondaryGlow: string;
  tagline: string;
  package: DiagnosticPackage;
  tubes: {
    type: 'Lavender (EDTA)' | 'Grey (Fluoride)' | 'Gold (SST Gel)';
    color: string;
    liquidHex: string;
    label: string;
    fillPercent: number;
  }[];
  constituentTests: {
    name: string;
    tubeTag: string;
    tat: string;
    clinicalMetric: string;
    referenceRange: string;
  }[];
}

const FLOW_ITEMS: InteractiveDiseaseFlowItem[] = [
  {
    id: 'pkg-diabetes',
    organId: 'diabetes',
    categoryName: 'Diabetes Care & Glycemic Shield',
    badgeTag: 'Best Seller · 34 Tests',
    organName: 'Pancreas & Glycemic Metabolism',
    organEmoji: '🩸',
    accentColor: '#00f0ff',
    secondaryGlow: 'rgba(0, 240, 255, 0.4)',
    tagline: 'Dual HbA1c HPLC + Glucose Hexokinase Screen',
    package: {
      id: 'diabeticbasic',
      name: 'Diabetic Profile (FBS + PPBS + HbA1c)',
      desc: 'Gold-standard metabolic screening measuring 90-day glycated hemoglobin average, post-prandial glucose spike, and fasting baseline.',
      price: 199,
      old: 550,
      tag: 'Camp Special · 34 Params',
      category: 'Diabetes',
      image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85',
      parametersCount: 34,
      fastingHours: 10,
      sampleType: 'Fluoride Grey + EDTA Lavender',
      tat: '4 Hours',
      clinicalSignificance: 'Evaluates microvascular glycemic toxicity, insulin resistance, and pancreatic beta-cell workload.'
    },
    tubes: [
      { type: 'Grey (Fluoride)', color: '#94a3b8', liquidHex: '#f43f5e', label: 'Hexokinase Glucose Tube', fillPercent: 78 },
      { type: 'Lavender (EDTA)', color: '#a855f7', liquidHex: '#9333ea', label: 'HPLC HbA1c Glycated Tube', fillPercent: 88 }
    ],
    constituentTests: [
      { name: 'HbA1c Glycated Hemoglobin', tubeTag: 'Lavender EDTA', tat: '4h', clinicalMetric: '3-Month Mean Glucose', referenceRange: '< 5.7% (Normal)' },
      { name: 'Fasting Blood Sugar (FBS)', tubeTag: 'Grey Fluoride', tat: '3h', clinicalMetric: 'Hexokinase Enzymatic', referenceRange: '70 - 99 mg/dL' },
      { name: 'Post-Prandial Blood Sugar (PPBS)', tubeTag: 'Grey Fluoride', tat: '4h', clinicalMetric: '2h Post Meal Glycemic', referenceRange: '< 140 mg/dL' },
      { name: 'Estimated Average Glucose (eAG)', tubeTag: 'Lavender EDTA', tat: '4h', clinicalMetric: 'Calculated Linear Math', referenceRange: '90 - 120 mg/dL' },
      { name: 'Urine Microalbumin/Creatinine', tubeTag: 'Spot Urine', tat: '4h', clinicalMetric: 'Diabetic Nephropathy Risk', referenceRange: '< 30 mg/g' }
    ]
  },
  {
    id: 'pkg-heart',
    organId: 'heart',
    categoryName: 'Cardiac & Hypertension Shield',
    badgeTag: 'Cardiologist Recommended',
    organName: 'Heart & Coronary Endothelium',
    organEmoji: '🫀',
    accentColor: '#ff2a5f',
    secondaryGlow: 'rgba(255, 42, 95, 0.45)',
    tagline: 'Lipid Ratios, hs-CRP & Electrolyte Balance',
    package: {
      id: 'hypertension',
      name: 'Cardiac & Hypertension Shield',
      desc: 'Deep cardiovascular workup: Atherogenic lipid subfractions, high-sensitivity cardiac inflammation, and serum electrolytes.',
      price: 4710,
      old: 7850,
      tag: 'Cardiologist Recommended',
      category: 'Heart Health',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=85',
      parametersCount: 76,
      fastingHours: 12,
      sampleType: 'Gold SST + Lavender EDTA',
      tat: '6 Hours',
      clinicalSignificance: 'Quantifies arterial plaque buildup, vascular endothelial strain, and cardiac event probability.'
    },
    tubes: [
      { type: 'Gold (SST Gel)', color: '#eab308', liquidHex: '#fbbf24', label: 'Lipid & Cardiac Serum', fillPercent: 85 },
      { type: 'Lavender (EDTA)', color: '#a855f7', liquidHex: '#e11d48', label: 'Hemogram & Platelet Stress', fillPercent: 70 }
    ],
    constituentTests: [
      { name: 'Total Cholesterol & Triglycerides', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Enzymatic Colorimetric', referenceRange: '< 200 mg/dL' },
      { name: 'HDL / LDL / VLDL Fractions', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Atherogenic Lipoproteins', referenceRange: 'HDL > 40, LDL < 100' },
      { name: 'High-Sensitivity CRP (hs-CRP)', tubeTag: 'Gold SST', tat: '6h', clinicalMetric: 'Vascular Inflammation', referenceRange: '< 1.0 mg/L' },
      { name: 'Serum Electrolytes (Na/K/Cl)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Arterial Pressure Ion Buffer', referenceRange: 'Na 135-145, K 3.5-5.1' },
      { name: 'Cardiac Risk Ratios (TC/HDL)', tubeTag: 'Calculated', tat: '4h', clinicalMetric: 'Cardiometabolic Stiffening', referenceRange: '< 4.5 Ratio' }
    ]
  },
  {
    id: 'pkg-thyroid',
    organId: 'thyroid',
    categoryName: 'Thyroid & Endocrine Vitality',
    badgeTag: 'Hormone Master · 34 Tests',
    organName: 'Thyroid Gland & Basal Metabolism',
    organEmoji: '🦋',
    accentColor: '#a855f7',
    secondaryGlow: 'rgba(168, 85, 247, 0.45)',
    tagline: 'Ultrasensitive 3rd Gen TSH + T3 + T4',
    package: {
      id: 'thyrodiabetes',
      name: 'Thyro-Diabetic Metabolic Care',
      desc: 'Specialized endocrine panel addressing persistent fatigue, unexplained weight changes, and thyroid-mediated metabolic slowdown.',
      price: 960,
      old: 1850,
      tag: 'Endocrine Panel · 34 Tests',
      category: 'Diabetes',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=85',
      parametersCount: 34,
      fastingHours: 10,
      sampleType: 'Gold SST + Lavender Tube',
      tat: '6 Hours',
      clinicalSignificance: 'Regulates cellular metabolic baseline, thermogenesis, and endocrine balance.'
    },
    tubes: [
      { type: 'Gold (SST Gel)', color: '#eab308', liquidHex: '#c084fc', label: 'Chemiluminescent Hormone Gel', fillPercent: 82 }
    ],
    constituentTests: [
      { name: 'Ultrasensitive TSH (3rd Gen ECLIA)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Chemiluminescence', referenceRange: '0.45 - 4.50 uIU/mL' },
      { name: 'Total Triiodothyronine (T3)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Active Metabolic Thyroid', referenceRange: '0.80 - 2.00 ng/mL' },
      { name: 'Total Thyroxine (T4)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Pro-Hormone Baseline', referenceRange: '5.1 - 14.1 ug/dL' },
      { name: 'Thyro-Glycemic Fasting Blood Sugar', tubeTag: 'Grey Fluoride', tat: '4h', clinicalMetric: 'Hexokinase Sugar', referenceRange: '70 - 99 mg/dL' }
    ]
  },
  {
    id: 'pkg-fullbody',
    organId: 'bone',
    categoryName: 'Executive Full Body Health Screen',
    badgeTag: 'Comprehensive · 84 Tests',
    organName: 'Whole Body Systemic & Bone Matrix',
    organEmoji: '👨',
    accentColor: '#10b981',
    secondaryGlow: 'rgba(16, 185, 129, 0.45)',
    tagline: 'CBC, LFT, KFT, Lipid, HbA1c & Vit D3/B12',
    package: {
      id: 'smartadvance',
      name: 'DSD Smart Health Advance',
      desc: 'All-inclusive 84-parameter executive screen: Full Hemogram, Liver Enzymes, Kidney Function, Lipid Subfractions, Thyroid and HbA1c.',
      price: 499,
      old: 1499,
      tag: 'Best Value · 84 Parameters',
      category: 'Camp Packages',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=85',
      parametersCount: 84,
      fastingHours: 10,
      sampleType: 'EDTA Blood + Fluoride + SST',
      tat: '6 Hours',
      clinicalSignificance: 'Holistic baseline evaluating bone marrow synthesis, renal clearance, hepatic metabolism, and cardiovascular risk.'
    },
    tubes: [
      { type: 'Lavender (EDTA)', color: '#a855f7', liquidHex: '#e11d48', label: 'Whole Blood CBC Vials', fillPercent: 90 },
      { type: 'Gold (SST Gel)', color: '#eab308', liquidHex: '#fbbf24', label: 'Metabolic Serum Vials', fillPercent: 85 },
      { type: 'Grey (Fluoride)', color: '#94a3b8', liquidHex: '#f43f5e', label: 'Glycemic Plasma Vials', fillPercent: 75 }
    ],
    constituentTests: [
      { name: 'Complete Blood Count (CBC - 24 Tests)', tubeTag: 'Lavender EDTA', tat: '3h', clinicalMetric: 'Sysmex 5-Part Differential', referenceRange: '4000 - 11000 cells/uL' },
      { name: 'Liver Function Panel (LFT - 12 Tests)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Beckman Coulter DxC 700 AU', referenceRange: 'SGOT < 35, SGPT < 45' },
      { name: 'Kidney Function Panel (KFT - 10 Tests)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'Jaffe Modified Kinetic', referenceRange: 'Creatinine 0.7 - 1.2 mg/dL' },
      { name: 'Lipid Profile Cardiac Risk (9 Tests)', tubeTag: 'Gold SST', tat: '4h', clinicalMetric: 'CHOD-PAP Spectrophotometry', referenceRange: 'Total Chol < 200 mg/dL' },
      { name: 'Glycated Hemoglobin (HbA1c)', tubeTag: 'Lavender EDTA', tat: '4h', clinicalMetric: 'Automated HPLC Ion Exchange', referenceRange: '< 5.7% (Healthy)' }
    ]
  }
];

export const DiseaseAnatomyResonanceArena: React.FC<DiseaseAnatomyResonanceArenaProps> = ({
  onAddToCart
}) => {
  const [activeItem, setActiveItem] = useState<InteractiveDiseaseFlowItem>(FLOW_ITEMS[0]);
  const [activeOrganId, setActiveOrganId] = useState<string>(FLOW_ITEMS[0].organId);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleSelectPackage = (item: InteractiveDiseaseFlowItem) => {
    setActiveItem(item);
    setActiveOrganId(item.organId);
  };

  return (
    <section className="diseaseResonanceArena py-16 px-4 sm:px-6 max-w-7xl mx-auto" id="disease-3d-flow">
      
      {/* SECTION HEADER LOCKED TO 8PX GRID */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-8 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200 uppercase tracking-widest mb-1 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-600 animate-ping inline-block" />
            Interactive 3D Physiological Map
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Body Systems & Diagnostic Panels
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Select any health profile below to visualize affected physiological systems and corresponding laboratory investigations in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-sm">
            <Activity size={16} className="text-emerald-600 animate-pulse" />
            <span>3D Physiological Resonance Engine</span>
          </div>
        </div>
      </div>

      {/* STEP 1: DISEASE PACKAGE SELECTOR CARDS (4-GRID LOCKED TO 8PX GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {FLOW_ITEMS.map((item) => {
          const isSelected = activeItem.id === item.id;

          return (
            <motion.div
              key={item.id}
              onClick={() => handleSelectPackage(item)}
              onMouseMove={handleCardMouseMove}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`p-6 rounded-3xl border cursor-pointer relative overflow-hidden transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-2 border-pink-500 shadow-xl shadow-pink-500/25 ring-1 ring-pink-500'
                  : 'bg-white border-slate-200 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/10'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-200 bg-pink-50/70"
                  >
                    {item.organEmoji}
                  </div>

                  <span
                    className={`text-[9.5px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isSelected
                        ? 'bg-pink-600 text-white shadow-md font-black'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isSelected ? '3D Active ✓' : 'Select'}
                  </span>
                </div>

                <div className="text-[11px] font-mono font-bold text-pink-600">
                  {item.badgeTag}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-pink-600 transition-colors">
                  {item.categoryName}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {item.tagline}
                </p>
              </div>

              {/* Card Bottom */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">NABL SPECIAL</span>
                  <b className="text-lg font-black text-slate-900">₹{item.package.price}</b>
                </div>

                <span
                  className="font-mono text-[11px] font-bold flex items-center gap-1 hover:underline text-pink-600"
                >
                  Explore 3D <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* STEP 2 & 3: SPLIT INTERACTIVE STAGE (LEFT: 3D ATLAS WITH REAL-TIME BOUNCE | RIGHT: TEST TUBES & TESTS EXPLOSION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT 5 COLS: 3D HUMAN BODY ANATOMY ATLAS (LEARN ANATOMY 3D STYLE) */}
        <div 
          className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[500px]"
          style={{
            borderColor: '#ff007f',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 35px rgba(255, 0, 128, 0.35)'
          }}
        >
          {/* Header Tag */}
          <div className="flex items-center justify-between z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping bg-pink-500" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  3D Organ Resonance: {activeItem.organName}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Target organ expands & emits bioluminescent bloom upon package selection.
              </p>
            </div>
          </div>

          {/* 3D WebGL Canvas */}
          <div className="w-full h-[380px] my-auto relative">
            <Interactive3DAnatomyAtlas
              selectedOrgan={activeOrganId}
              onSelectOrgan={(orgId) => {
                setActiveOrganId(orgId);
                const matched = FLOW_ITEMS.find(f => f.organId === orgId);
                if (matched) setActiveItem(matched);
              }}
              className="w-full h-full"
            />
          </div>

          {/* Bottom Telemetry HUD */}
          <div className="z-10 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between backdrop-blur-md text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{activeItem.organEmoji}</span>
              <div>
                <b className="text-white block font-semibold">{activeItem.organName}</b>
                <span className="text-[10px] text-slate-400 font-mono">Bioluminescent Emission: 1.8 Intensity</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Cold-Chain 3.8°C
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLS: STAGGERED TEST EXPLOSION & VACUUM TEST TUBES DRAWER */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="space-y-6"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200"
                    >
                      {activeItem.package.parametersCount} Parameters Included
                    </span>
                    <span className="text-xs text-slate-500">· NABL ISO-15189 Verified</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {activeItem.package.name}
                  </h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">₹{activeItem.package.price}</span>
                  {activeItem.package.old && (
                    <span className="text-sm text-slate-400 line-through">₹{activeItem.package.old}</span>
                  )}
                </div>
              </div>

              {/* VACUUM SAMPLE TEST TUBES WITH LIQUID MENISCUS ANIMATION */}
              <div>
                <div className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Required Vacuum Sample Tubes</span>
                  <span className="text-emerald-700 font-semibold">Dual Pathologist Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeItem.tubes.map((tube, idx) => (
                    <motion.div
                      key={tube.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: idx * 0.08 }}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4"
                    >
                      {/* Animated Test Tube Graphic */}
                      <div className="w-7 h-12 rounded-b-xl rounded-t-sm border border-slate-300 relative overflow-hidden shrink-0 flex flex-col justify-end p-0.5 bg-slate-200">
                        {/* Tube Cap */}
                        <div className="absolute top-0 left-0 right-0 h-3 rounded-t-sm shadow-sm" style={{ background: tube.color }} />
                        {/* Meniscus Fluid */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${tube.fillPercent}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="w-full rounded-b-lg relative"
                          style={{ background: tube.liquidHex }}
                        >
                          <div className="w-full h-1 bg-white/40" />
                        </motion.div>
                      </div>

                      <div className="truncate">
                        <b className="text-xs font-bold text-slate-900 block truncate">{tube.label}</b>
                        <span className="text-[10px] font-mono text-slate-500">{tube.type}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CONSTITUENT TESTS STAGGERED LIST */}
              <div>
                <div className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Constituent Diagnostic Investigations</span>
                  <span className="text-pink-600 font-semibold">Beckman Coulter & Sysmex</span>
                </div>

                <div className="space-y-2">
                  {activeItem.constituentTests.map((t, i) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25, delay: i * 0.06 }}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-pink-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <div>
                          <b className="text-slate-900 block font-medium">{t.name}</b>
                          <span className="text-[10.5px] text-slate-500">{t.clinicalMetric}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {t.tubeTag}
                        </span>
                        <span className="text-emerald-700 font-bold">{t.referenceRange}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Fasting & Delivery Guarantee */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Clock3 size={16} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">FASTING</span>
                    <b className="text-slate-900">{activeItem.package.fastingHours ? `${activeItem.package.fastingHours}h Overnight Fasting` : 'Non-Fasting OK'}</b>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Droplet size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">TAT REPORT</span>
                    <b className="text-emerald-700">{activeItem.package.tat || 'Within 6 Hours'}</b>
                  </div>
                </div>
              </div>

              {/* 1-Click Booking Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Free Home Sample Collection Waiver Included</span>
                </div>

                <button
                  type="button"
                  onClick={() => onAddToCart(activeItem.package)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
                >
                  Book Package Now (₹{activeItem.package.price}) <ArrowRight size={17} />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>

        </div>

      </div>

    </section>
  );
};

export default DiseaseAnatomyResonanceArena;
