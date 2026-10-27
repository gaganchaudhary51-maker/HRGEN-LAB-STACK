import React, { useState, useEffect } from 'react';
import { SpecimenTubeGraphic } from './SpecimenTubeGraphic';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ShoppingBag, 
  Sparkles,
  Droplet,
  Heart,
  Activity,
  Stethoscope,
  Flame,
  Thermometer,
  Microscope
} from 'lucide-react';

export interface DiagnosticPackage {
  id: string;
  name: string;
  desc: string;
  price: number;
  old: number;
  tag: string;
  category: string;
  image: string;
  parametersCount?: number;
  fastingHours?: number;
  sampleType?: string;
  tat?: string;
  symptoms?: string[];
  whyTake?: string;
  inclusionsList?: string[];
  organEmoji?: string;
  organ3DColor?: string;
  analyzerName?: string;
  vacutainerTubes?: {
    name: string;
    capColor: string;
    liquidColor?: string;
    liquidTopColor?: string;
    hasGelSeparator?: boolean;
    type?: string;
  }[];
  tubes?: { name: string; color: string; purpose: string }[];
  categoriesBreakdown?: {
    groupKey?: string;
    groupName: string;
    analyzer?: string;
    vacutainer?: string;
    tests: { 
      name: string; 
      range?: string; 
      unit?: string; 
      desc?: string; 
    }[];
  }[];
  clinicalSignificance?: string;
}

interface PackageDetailModalProps {
  pkg: DiagnosticPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (pkg: DiagnosticPackage) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  pkg,
  isOpen,
  onClose,
  onBook,
}) => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'clinical' | 'preparation'>('parameters');

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pkg) return null;

  const discountPercent = Math.max(0, Math.round(((pkg.old - pkg.price) / pkg.old) * 100));

  // Default authoritative breakdown if not supplied directly
  const breakdown = (pkg.categoriesBreakdown && pkg.categoriesBreakdown.length > 0) ? pkg.categoriesBreakdown : [
    {
      groupKey: 'hemogram',
      groupName: 'Complete Hemogram / CBC (24 Parameters)',
      analyzer: 'Sysmex XN-550 Automated 5-Part Differential Counter',
      vacutainer: 'Lavender (EDTA)',
      tests: [
        { name: 'Hemoglobin (Hb)', range: '13.0 - 17.0 g/dL (M) / 12.0 - 15.0 g/dL (F)', unit: 'g/dL', desc: 'Carries oxygen through the bloodstream' },
        { name: 'Total Leucocyte Count (TLC / WBC)', range: '4,000 - 11,000', unit: '/cumm', desc: 'Primary circulating immune defense cells' },
        { name: 'Platelet Count', range: '1.50 - 4.50', unit: 'Lakhs/cumm', desc: 'Essential blood clotting components' },
        { name: 'RBC Count', range: '4.50 - 5.50 (M) / 3.80 - 4.80 (F)', unit: 'mill/cumm', desc: 'Total circulating red blood cells' },
        { name: 'Packed Cell Volume (PCV / Hematocrit)', range: '40.0 - 50.0 % (M) / 36.0 - 46.0 % (F)', unit: '%', desc: 'Fraction of whole blood volume occupied by erythrocytes' },
        { name: 'Neutrophils (DLC)', range: '40.0 - 70.0', unit: '%', desc: 'First-line bacterial phagocytic granulocytes' },
        { name: 'Lymphocytes (DLC)', range: '20.0 - 40.0', unit: '%', desc: 'Adaptive viral immune cells (B & T cells)' }
      ]
    },
    {
      groupKey: 'liver',
      groupName: 'Liver Function Test - LFT (12 Parameters)',
      analyzer: 'Beckman Coulter DxC 700 AU (Enzymatic UV)',
      vacutainer: 'Gold SST Gel',
      tests: [
        { name: 'SGPT / ALT (Alanine Aminotransferase)', range: '< 45 U/L (M) / < 34 U/L (F)', unit: 'U/L', desc: 'Specific marker for liver inflammation and cellular damage' },
        { name: 'SGOT / AST (Aspartate Aminotransferase)', range: '< 40 U/L (M) / < 35 U/L (F)', unit: 'U/L', desc: 'Hepatic and cardiac cellular enzyme' },
        { name: 'Total Bilirubin', range: '0.20 - 1.20', unit: 'mg/dL', desc: 'Bile pigment breakdown index; screens for clinical jaundice' },
        { name: 'Alkaline Phosphatase (ALP)', range: '44 - 147', unit: 'U/L', desc: 'Biliary canalicular & bone metabolic turnover enzyme' },
        { name: 'Total Protein & Albumin', range: '6.40 - 8.30', unit: 'g/dL', desc: 'Liver synthetic oncotic capacity indicator' }
      ]
    },
    {
      groupKey: 'kidney',
      groupName: 'Kidney Function & Electrolytes - KFT (10 Parameters)',
      analyzer: 'Beckman Coulter DxC 700 AU (Kinetic Jaffe & Crown-Ether ISE)',
      vacutainer: 'Gold SST Gel',
      tests: [
        { name: 'Serum Creatinine', range: '0.70 - 1.30 (M) / 0.50 - 1.10 (F)', unit: 'mg/dL', desc: 'Primary renal clearance baseline and nephron health index' },
        { name: 'Blood Urea & BUN', range: '15.0 - 40.0', unit: 'mg/dL', desc: 'Protein metabolism waste elimination clearance' },
        { name: 'Serum Uric Acid', range: '3.50 - 7.20 (M) / 2.60 - 6.00 (F)', unit: 'mg/dL', desc: 'Gout, purine crystal and joint inflammation screening' },
        { name: 'Estimated GFR (eGFR)', range: '> 90.0', unit: 'mL/min/1.73m²', desc: 'Global nephron filtration efficiency' }
      ]
    },
    {
      groupKey: 'lipid',
      groupName: 'Lipid Profile · Cardiovascular Risk (9 Parameters)',
      analyzer: 'Beckman Coulter DxC 700 AU (Direct Enzymatic CHOD-PAP)',
      vacutainer: 'Gold SST Gel',
      tests: [
        { name: 'Total Cholesterol', range: '< 200.0', unit: 'mg/dL', desc: 'Circulatory sterol lipid concentration; atherogenic metric' },
        { name: 'HDL Cholesterol (Good)', range: '> 40.0 (M) / > 50.0 (F)', unit: 'mg/dL', desc: 'Cardioprotective reverse-cholesterol transport lipoprotein' },
        { name: 'LDL Cholesterol (Bad)', range: '< 100.0', unit: 'mg/dL', desc: 'Atherogenic particle infiltrating coronary arterial wall' },
        { name: 'Triglycerides', range: '< 150.0', unit: 'mg/dL', desc: 'Dietary blood fat energy store; elevated in metabolic syndrome' }
      ]
    },
    {
      groupKey: 'diabetes',
      groupName: 'Diabetes & Glycemic Control (4 Parameters)',
      analyzer: 'Bio-Rad D-10 HPLC + Beckman Coulter AU',
      vacutainer: 'Lavender EDTA + Grey Fluoride',
      tests: [
        { name: 'Fasting Blood Sugar (FBS)', range: '70.0 - 99.0', unit: 'mg/dL', desc: 'Baseline overnight glucose homeostasis preserved in fluoride' },
        { name: 'HbA1c Glycated Hemoglobin', range: '< 5.7 % (Normal) / 5.7 - 6.4 % (Prediabetes)', unit: '%', desc: 'Gold-standard 90-day three-month glucose mean via HPLC' },
        { name: 'Estimated Average Glucose (eAG)', range: '90.0 - 120.0', unit: 'mg/dL', desc: 'Calculated continuous average blood glucose' }
      ]
    }
  ];

  const totalParams = pkg.parametersCount || breakdown.reduce((acc, cat) => acc + cat.tests.length, 0);

  // Derive tubes
  const displayTubes = (pkg.vacutainerTubes && pkg.vacutainerTubes.length > 0) ? pkg.vacutainerTubes : [
    { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'Whole Blood (CBC)' },
    { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Serum (Biochemistry)' },
    { name: 'Grey Fluoride', capColor: '#94a3b8', liquidColor: '#b91c1c', type: 'Fluoride Plasma (Glucose)' }
  ];

  return (
    <div 
      className="opsOverlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-package-name"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-950/40 text-slate-100 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header bar (Strict 8px rhythm & min 44px tap target) */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 flex items-start justify-between relative">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck size={13} /> NABL ISO-15189 Certified
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {totalParams}+ Clinical Parameters
              </span>
              {discountPercent > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                  {discountPercent}% OFF
                </span>
              )}
              {pkg.analyzerName && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                  <Microscope size={12} /> {pkg.analyzerName.split(' ')[0]} {pkg.analyzerName.split(' ')[1] || ''}
                </span>
              )}
            </div>
            
            <h2 id="modal-package-name" className="text-2xl font-black text-white tracking-tight">{pkg.name}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{pkg.desc}</p>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Clinical Spec Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Droplet size={18} className="text-rose-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">Sample Required</div>
              <div className="font-semibold text-slate-200">{pkg.sampleType || 'Blood & Spot Urine'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Clock size={18} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">Fasting Protocol</div>
              <div className="font-semibold text-slate-200">{pkg.fastingHours ? `${pkg.fastingHours} hrs overnight fasting` : 'Non-fasting OK'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Activity size={18} className="text-sky-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">Turnaround Time</div>
              <div className="font-semibold text-slate-200">{pkg.tat || 'Same Day within 6 hrs'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">Lab Sign-Off</div>
              <div className="font-semibold text-slate-200">Dual MD Pathologists</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (min 44px tap height) */}
        <div className="flex items-center gap-6 px-6 pt-3 border-b border-slate-800 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('parameters')}
            className={`min-h-[44px] pb-3 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'parameters' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Included Tests & Parameters ({totalParams})
            {activeTab === 'parameters' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`min-h-[44px] pb-3 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'clinical' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            यह टेस्ट क्यों कराएं? (Why Take)
            {activeTab === 'clinical' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preparation')}
            className={`min-h-[44px] pb-3 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'preparation' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pre-Test Instructions
            {activeTab === 'preparation' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Scrollable Tab Body (Locked 8px rhythm: p-6, space-y-6) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              {/* Doctor Consultation Strip */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-sky-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5 text-sm">
                      Includes Free MBBS Doctor Teleconsultation & Diet Plan
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      1-on-1 confidential phone/video review once your encrypted report is released.
                    </div>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30 whitespace-nowrap font-bold">
                  ₹0 EXTRA CHARGE
                </span>
              </div>

              {/* Realistic Vacutainer Tubes with Fluid Meniscus & Gel Separators */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Microscope size={15} className="text-cyan-400" />
                    Required Vacutainer Vials (Physical Surface Meniscus & Gel Separators)
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Thermometer size={13} /> Monitored at 3.8°C Cold Chain
                  </span>
                </div>
                
                <div className="flex items-center justify-around flex-wrap gap-4 pt-2">
                  {displayTubes.map((tube, tIdx) => (
                    <div key={tIdx} className="flex flex-col items-center">
                      <SpecimenTubeGraphic
                        capColor={tube.capColor}
                        tubeName={tube.name}
                        hasGelSeparator={tube.hasGelSeparator || tube.name.toLowerCase().includes('sst') || tube.name.toLowerCase().includes('gold')}
                        liquidColor={tube.liquidColor}
                        width={30}
                        height={76}
                        fillPercent={70}
                      />
                      <span className="text-[11px] text-slate-400 font-medium mt-1 text-center">
                        {tube.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Analyzer Attribution Banner */}
              {pkg.analyzerName && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Microscope size={18} className="text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Primary Automated Analyzer:</span>
                      <b className="text-white text-xs block">{pkg.analyzerName}</b>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                    6-Sigma QC Calibrated
                  </span>
                </div>
              )}

              {/* Categorized Test Breakdown with Biological Reference Intervals */}
              {breakdown.map((group, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-sm text-white block">{group.groupName}</span>
                      {group.analyzer && (
                        <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Analyzer: {group.analyzer}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-sky-400 font-mono font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                      {group.tests.length} Parameters
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {group.tests.map((test, tIdx) => (
                      <div key={tIdx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-800/40 transition-colors">
                        <div>
                          <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                            {test.name}
                          </div>
                          {test.desc && (
                            <div className="text-xs text-slate-400 mt-0.5 ml-6">{test.desc}</div>
                          )}
                        </div>
                        <div className="sm:text-right shrink-0 ml-6 sm:ml-0">
                          {test.range && (
                            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 inline-block">
                              Ref: {test.range} {test.unit ? `(${test.unit})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="space-y-6">
              {/* Doctor-grade Vernacular Clinical Rationale in Hindi/Hinglish */}
              <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 space-y-2 text-cyan-200">
                <h4 className="font-bold text-base text-cyan-300 flex items-center gap-2">
                  <Sparkles size={18} /> यह टेस्ट क्यों कराएं? (Why Take This Test)
                </h4>
                <p className="text-sm leading-relaxed text-slate-200 font-medium">
                  {pkg.whyTake || 'सालाना प्रिवेंटिव हेल्थ चेकअप: लिवर, किडनी, कोलेस्ट्रॉल, साइलेंट डायबिटीज और खून की कमी का किसी भी लक्षण के उभरने से पहले शुरुआती स्टेज पर पता लगाने हेतु।'}
                </p>
                {pkg.clinicalSignificance && (
                  <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-cyan-900/50">
                    <b className="text-slate-300">Clinical Pathology:</b> {pkg.clinicalSignificance}
                  </p>
                )}
              </div>

              {/* Symptoms Checklist ("प्रमुख लक्षण") */}
              {pkg.symptoms && pkg.symptoms.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <Flame size={16} className="text-rose-400" />
                    प्रमुख लक्षण (Targeted Symptoms Checklist):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pkg.symptoms.map((sym, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span>{sym}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Who should take & Lab guarantee grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <Heart size={16} className="text-rose-400" /> Who Should Take This Package?
                  </div>
                  <ul className="space-y-2 text-slate-300 list-disc list-inside">
                    <li>Individuals with family history of diabetes, hypertension or cardiac disease</li>
                    <li>Adults aged 25+ experiencing fatigue, joint aches or unexplained weight fluctuations</li>
                    <li>Sedentary professionals seeking routine annual preventive screening</li>
                    <li>Patients monitoring long-term prescription medication impact on liver & kidney</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" /> NABL Quality Guarantee
                  </div>
                  <ul className="space-y-2 text-slate-300 list-disc list-inside">
                    <li>Fully automated Beckman Coulter & Roche clinical chemistry analyzers</li>
                    <li>Barcoded vacuum blood collection with zero manual touch</li>
                    <li>Dual Pathologist review and digital sign-off before electronic release</li>
                    <li>Digital temperature tracking maintained at 3.8°C throughout transport</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preparation' && (
            <div className="space-y-5 text-xs">
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-amber-200 space-y-2.5">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <AlertCircle size={18} /> Mandatory Pre-Test Preparation
                </h4>
                <ul className="space-y-2 list-disc list-inside text-slate-300">
                  <li><b>10 to 12 Hours Overnight Fasting:</b> Do not consume any meals, tea, coffee, milk, or juices after dinner.</li>
                  <li><b>Plain Water Allowed:</b> Staying properly hydrated with plain water is encouraged as it eases vein palpation and blood draw.</li>
                  <li><b>Avoid Alcohol & Strenuous Workouts:</b> Refrain from heavy exercise and alcohol for 24 hours prior to blood draw.</li>
                  <li><b>Morning Medications:</b> Inform the phlebotomist about regular morning blood pressure or thyroid tablets.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-white">What Happens During Home Collection?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <b className="text-sky-400 block mb-1">1. Phlebo Arrival</b>
                    Certified vaccinated phlebotomist arrives with single-use BD Vacutainer kit.
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <b className="text-sky-400 block mb-1">2. Barcode Sealing</b>
                    Vials are barcoded in front of you and packed into cold-storage temperature boxes.
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <b className="text-sky-400 block mb-1">3. Live Telemetry</b>
                    Track sample transfer to Aligarh central lab via live GPS ride tracking at 3.8°C.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions (min 44px tap targets & 8px rhythm) */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-slate-400">Total All-Inclusive Camp Offer</div>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl font-black text-white">₹{pkg.price}</span>
                {pkg.old > pkg.price && (
                  <span className="text-sm line-through text-slate-500 font-mono">₹{pkg.old}</span>
                )}
                <span className="text-xs text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                  Free Home Collection
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors text-center"
            >
              Back to Catalog
            </button>
            <button
              type="button"
              onClick={() => {
                onBook(pkg);
                onClose();
              }}
              className="min-h-[44px] w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <ShoppingBag size={16} /> Book Package Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PackageDetailModal;
