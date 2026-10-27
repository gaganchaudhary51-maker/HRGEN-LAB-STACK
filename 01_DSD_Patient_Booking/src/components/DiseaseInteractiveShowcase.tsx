import React from 'react';
import { DiagnosticPackage } from './PackageDetailModal';
import { 
  FlaskConical, 
  ArrowRight
} from 'lucide-react';

export interface DiseaseInteractiveShowcaseProps {
  selectedOrgan: string | null;
  onSelectOrganAndPackage: (organId: string, pkg: DiagnosticPackage) => void;
  onAddToCart: (pkg: DiagnosticPackage) => void;
}

interface DiseaseCardData {
  organId: string;
  categoryTitle: string;
  icon: string;
  tagline: string;
  gradient: string;
  glowColor: string;
  accentHex: string;
  packageItem: DiagnosticPackage;
  constituentTests: { name: string; tube: 'Lavender' | 'Grey' | 'Gold'; refInterval: string }[];
}

export const DISEASE_SHOWCASE_DATA: DiseaseCardData[] = [
  {
    organId: 'diabetes',
    categoryTitle: 'Diabetes Care & Glycemic Shield',
    icon: '🩸',
    tagline: 'Pancreas & Insulin Resistance Screen',
    gradient: 'from-cyan-950/40 via-slate-900 to-cyan-950/20',
    glowColor: 'rgba(0, 240, 255, 0.35)',
    accentHex: '#00f0ff',
    packageItem: {
      id: 'diabeticbasic',
      name: 'Diabetic Profile (FBS + PPBS + HbA1c)',
      desc: 'Gold-standard glycemic evaluation measuring 90-day glucose average, insulin secretion, and fasting glucose baseline.',
      price: 199,
      old: 550,
      tag: 'Camp Special · 34 Params',
      category: 'Diabetes',
      image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85',
      parametersCount: 34,
      fastingHours: 10,
      sampleType: 'Fluoride Grey + EDTA Lavender',
      tat: 'Reports in 4 Hours',
      clinicalSignificance: 'Detects pre-diabetes, microvascular glycemic toxicity, and insulin sensitivity.'
    },
    constituentTests: [
      { name: 'HbA1c Glycated Hemoglobin', tube: 'Lavender', refInterval: '< 5.7%' },
      { name: 'Fasting Blood Glucose (Hexokinase)', tube: 'Grey', refInterval: '70 - 99 mg/dL' },
      { name: 'Post-Prandial Glucose (PPBS)', tube: 'Grey', refInterval: '< 140 mg/dL' },
      { name: 'Estimated Average Glucose (eAG)', tube: 'Lavender', refInterval: '90 - 120 mg/dL' }
    ]
  },
  {
    organId: 'heart',
    categoryTitle: 'Cardiac & Hypertension Shield',
    icon: '🫀',
    tagline: 'Heart Rhythm, Lipids & Endothelial Risk',
    gradient: 'from-rose-950/40 via-slate-900 to-rose-950/20',
    glowColor: 'rgba(255, 42, 95, 0.35)',
    accentHex: '#ff2a5f',
    packageItem: {
      id: 'hypertension',
      name: 'Cardiac & Hypertension Shield',
      desc: 'Comprehensive cardiovascular assessment: Lipid subfractions, atherogenic ratios, cardiac inflammation and renal arterial clearance.',
      price: 4710,
      old: 7850,
      tag: 'Cardiologist Recommended',
      category: 'Heart Health',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=85',
      parametersCount: 76,
      fastingHours: 12,
      sampleType: 'Gold SST + Lavender EDTA',
      tat: 'Same Day Delivery',
      clinicalSignificance: 'Quantifies arterial plaque risk, endothelial strain, and systemic microvascular inflammation.'
    },
    constituentTests: [
      { name: 'Lipid Profile (9 Parameters)', tube: 'Gold', refInterval: 'TC < 200 mg/dL' },
      { name: 'High Sensitivity CRP (hs-CRP)', tube: 'Gold', refInterval: '< 1.0 mg/L (Low Risk)' },
      { name: 'Serum Electrolytes (Na/K/Cl)', tube: 'Gold', refInterval: 'Ion Balance Verified' },
      { name: 'Urine Microalbumin/Creatinine', tube: 'Gold', refInterval: '< 30 mg/g' }
    ]
  },
  {
    organId: 'thyroid',
    categoryTitle: 'Thyroid & Endocrine Vitality',
    icon: '🦋',
    tagline: 'Thyroid Gland, Metabolism & Energy',
    gradient: 'from-purple-950/40 via-slate-900 to-purple-950/20',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    accentHex: '#a855f7',
    packageItem: {
      id: 'thyrodiabetes',
      name: 'Thyro-Diabetic Metabolic Care',
      desc: 'Dual endocrine workup for fatigue, unexplained weight changes, TSH fluctuations and concurrent blood glucose resistance.',
      price: 960,
      old: 1850,
      tag: 'Endocrine Panel · 34 Tests',
      category: 'Diabetes',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=85',
      parametersCount: 34,
      fastingHours: 10,
      sampleType: 'Gold SST + Lavender Tube',
      tat: 'Reports within 6 Hours',
      clinicalSignificance: 'Regulates basal metabolic rate, energy homeostasis, and endocrine hormone axis.'
    },
    constituentTests: [
      { name: 'Ultrasensitive TSH (3rd Gen)', tube: 'Gold', refInterval: '0.45 - 4.50 uIU/mL' },
      { name: 'Total Triiodothyronine (T3)', tube: 'Gold', refInterval: '0.80 - 2.00 ng/mL' },
      { name: 'Total Thyroxine (T4)', tube: 'Gold', refInterval: '5.1 - 14.1 ug/dL' },
      { name: 'Glycemic Fasting Sugar', tube: 'Grey', refInterval: '70 - 99 mg/dL' }
    ]
  },
  {
    organId: 'liver',
    categoryTitle: 'Liver Function & Detox Panel',
    icon: '🫁',
    tagline: 'Hepatic Enzymes, Bilirubin & Protein Balance',
    gradient: 'from-amber-950/40 via-slate-900 to-amber-950/20',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    accentHex: '#f59e0b',
    packageItem: {
      id: 'lftprofile',
      name: 'Liver Function Test (LFT - 12 Tests)',
      desc: 'Detailed hepatic screening: Bilirubin (Total, Direct, Indirect), SGOT/AST, SGPT/ALT, Alkaline Phosphatase, Protein & Albumin/Globulin ratio.',
      price: 149,
      old: 399,
      tag: 'Hepatic Care · 12 Params',
      category: 'Profiles',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=85',
      parametersCount: 12,
      fastingHours: 8,
      sampleType: 'Gold SST Gel Tube',
      tat: 'Reports within 4 Hours',
      clinicalSignificance: 'Assesses hepatocyte integrity, biliary clearance, and nutritional protein synthesis.'
    },
    constituentTests: [
      { name: 'SGPT / ALT (Liver Enzyme)', tube: 'Gold', refInterval: '< 45 U/L' },
      { name: 'SGOT / AST (Enzyme Activity)', tube: 'Gold', refInterval: '< 35 U/L' },
      { name: 'Total & Direct Bilirubin', tube: 'Gold', refInterval: '0.2 - 1.2 mg/dL' },
      { name: 'Serum Albumin & A/G Ratio', tube: 'Gold', refInterval: '3.5 - 5.2 g/dL' }
    ]
  },
  {
    organId: 'kidney',
    categoryTitle: 'Kidney Renal Screening',
    icon: '🩺',
    tagline: 'Renal Clearance, Electrolytes & Urea',
    gradient: 'from-blue-950/40 via-slate-900 to-blue-950/20',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    accentHex: '#06b6d4',
    packageItem: {
      id: 'kftprofile',
      name: 'Kidney Function Test (KFT - 10 Tests)',
      desc: 'Complete renal profile measuring glomerular filtration ability: Serum Creatinine, Blood Urea, BUN, Uric Acid, Calcium and Electrolytes.',
      price: 149,
      old: 399,
      tag: 'Renal Health · 10 Params',
      category: 'Profiles',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=85',
      parametersCount: 10,
      fastingHours: 8,
      sampleType: 'Gold SST Tube',
      tat: 'Reports within 4 Hours',
      clinicalSignificance: 'Monitors renal clearance efficiency, electrolyte balance, and early nephrotoxicity.'
    },
    constituentTests: [
      { name: 'Serum Creatinine (Jaffe Kinetic)', tube: 'Gold', refInterval: '0.7 - 1.2 mg/dL' },
      { name: 'Blood Urea Nitrogen (BUN)', tube: 'Gold', refInterval: '7 - 20 mg/dL' },
      { name: 'Serum Uric Acid', tube: 'Gold', refInterval: '3.5 - 7.2 mg/dL' },
      { name: 'Serum Calcium', tube: 'Gold', refInterval: '8.5 - 10.5 mg/dL' }
    ]
  },
  {
    organId: 'bone',
    categoryTitle: 'Executive Full Body & Bones',
    icon: '👨',
    tagline: '84-Parameter Holistic Systemic Screen',
    gradient: 'from-emerald-950/40 via-slate-900 to-emerald-950/20',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    accentHex: '#10b981',
    packageItem: {
      id: 'smartadvance',
      name: 'DSD Smart Health Advance',
      desc: 'Comprehensive 84-parameter executive screen: CBC, LFT, KFT, Lipid Profile, Thyroid Profile (T3, T4, TSH), and HbA1c with dual MD Pathologist verification.',
      price: 499,
      old: 1499,
      tag: 'Best Value · 84 Parameters',
      category: 'Camp Packages',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=85',
      parametersCount: 84,
      fastingHours: 10,
      sampleType: 'EDTA Blood + Fluoride + SST',
      tat: 'Reports within 6 Hours',
      clinicalSignificance: 'Comprehensive metabolic baseline evaluating cardiovascular risk, liver inflammation, renal clearance, glycemic average, and thyroid hormone activity.'
    },
    constituentTests: [
      { name: 'Complete Blood Count (CBC - 24 Tests)', tube: 'Lavender', refInterval: 'Full Hemogram' },
      { name: 'HbA1c Glycated & Blood Glucose', tube: 'Grey', refInterval: 'Dual Screen' },
      { name: 'Complete Lipid & Cholesterol Panel', tube: 'Gold', refInterval: 'Cardiovascular' },
      { name: 'Liver & Kidney Profiler (LFT + KFT)', tube: 'Gold', refInterval: 'Metabolic Balance' }
    ]
  }
];

export const DiseaseInteractiveShowcase: React.FC<DiseaseInteractiveShowcaseProps> = ({
  selectedOrgan,
  onSelectOrganAndPackage,
  onAddToCart
}) => {
  return (
    <section className="diseaseShowcaseSection py-10 px-4 sm:px-6 max-w-7xl mx-auto" id="disease-packages">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Step 1: Choose Health Concern & Disease Package
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Targeted Diagnostic Packages & Organ Resonance
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Click any disease package card below: watch the <b>3D Human Body light up & bounce</b>, while all constituent test vials open with spring physics.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Spring Physics: Stiffness 300 · Damping 30</span>
        </div>
      </div>

      {/* Disease Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DISEASE_SHOWCASE_DATA.map((disease) => {
          const isSelected = selectedOrgan === disease.organId;

          return (
            <div
              key={disease.organId}
              onClick={() => onSelectOrganAndPackage(disease.organId, disease.packageItem)}
              className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? 'bg-slate-900 border-opacity-100 shadow-2xl scale-[1.03]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:scale-[1.01]'
              }`}
              style={{
                borderColor: isSelected ? disease.accentHex : undefined,
                boxShadow: isSelected ? `0 20px 60px ${disease.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.15)` : undefined,
                backdropFilter: 'blur(28px)'
              }}
            >
              {/* Top Row: Icon & Active Resonance Badge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10"
                    style={{ background: `linear-gradient(135deg, ${disease.accentHex}20, rgba(15, 23, 42, 0.8))` }}
                  >
                    {disease.icon}
                  </div>

                  <span 
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all ${
                      isSelected 
                        ? 'bg-white text-slate-950 shadow-md font-black animate-pulse' 
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isSelected ? '3D Organ Focused ✓' : 'Click to Focus 3D'}
                  </span>
                </div>

                <div className="text-xs font-mono font-semibold" style={{ color: disease.accentHex }}>
                  {disease.tagline}
                </div>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                  {disease.categoryTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {disease.packageItem.desc}
                </p>

                {/* Staggered Constituent Test Pills */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Constituent Lab Tests:</span>
                    <span className="text-white font-bold">{disease.packageItem.parametersCount} Params</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {disease.constituentTests.map((test, i) => (
                      <div 
                        key={test.name}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-300"
                        style={{
                          transitionDelay: `${i * 40}ms`
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ 
                              background: test.tube === 'Lavender' ? '#a855f7' : test.tube === 'Grey' ? '#94a3b8' : '#eab308' 
                            }} 
                          />
                          <span className="truncate">{test.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                          {test.refInterval}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Price & 1-Click Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400">NABL PACKAGE RATE</div>
                  <div className="flex items-baseline gap-1.5">
                    <b className="text-xl font-black text-white">₹{disease.packageItem.price}</b>
                    {disease.packageItem.old && (
                      <span className="text-xs text-slate-500 line-through">₹{disease.packageItem.old}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrganAndPackage(disease.organId, disease.packageItem);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all"
                    title="View 3D Tubes Breakdown"
                  >
                    <FlaskConical size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(disease.packageItem);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                  >
                    Book Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DiseaseInteractiveShowcase;
