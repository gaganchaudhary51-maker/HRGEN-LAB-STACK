import React, { useEffect } from 'react';
import { DiagnosticPackage } from './PackageDetailModal';
import { SpecimenTubeGraphic } from './SpecimenTubeGraphic';
import { 
  X, 
  FlaskConical, 
  Clock, 
  Droplet, 
  ArrowRight,
  Activity,
  ShieldCheck,
  Microscope
} from 'lucide-react';

export interface OrganTestBreakdownDrawerProps {
  packageData: DiagnosticPackage | null;
  organId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (pkg: DiagnosticPackage) => void;
}

interface DerivedTube {
  name: string;
  capColor: string;
  liquidColor?: string;
  liquidTopColor?: string;
  hasGelSeparator?: boolean;
  type: string;
  additive?: string;
  tests: string[];
}

export const OrganTestBreakdownDrawer: React.FC<OrganTestBreakdownDrawerProps> = ({
  packageData,
  organId,
  isOpen,
  onClose,
  onAddToCart
}) => {
  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !packageData) return null;

  // Dynamically derive realistic clinical tubes from packageData
  const getDynamicTubes = (): DerivedTube[] => {
    if (packageData.vacutainerTubes && packageData.vacutainerTubes.length > 0) {
      return packageData.vacutainerTubes.map(tube => {
        const lower = tube.name.toLowerCase();
        let derivedTests: string[] = [];
        let hasGel = lower.includes('sst') || lower.includes('gold') || lower.includes('gel');
        let additive = 'Standard Diagnostic Additive';

        if (lower.includes('lavender') || lower.includes('edta')) {
          additive = 'Dipotassium K2/K3 EDTA (Whole Blood)';
          derivedTests = packageData.categoriesBreakdown?.find(c => c.groupKey === 'hemogram')?.tests.slice(0, 4).map(t => t.name) || [
            'Complete Blood Count (CBC - 24 Params)',
            'Platelet Indices & MPV',
            'Absolute Neutrophils / Lymphocytes',
            'Hemoglobin (Hb)'
          ];
          if (packageData.categoriesBreakdown?.some(c => c.groupKey === 'diabetes')) {
            derivedTests.push('HbA1c Glycated Hemoglobin (HPLC)');
          }
        } else if (lower.includes('gold') || lower.includes('sst') || lower.includes('yellow')) {
          additive = 'Micronized Silica Clot Activator + Inert Polyester Gel';
          hasGel = true;
          derivedTests = [];
          if (packageData.categoriesBreakdown) {
            packageData.categoriesBreakdown
              .filter(c => Boolean(c.groupKey && ['liver', 'kidney', 'lipid', 'thyroid', 'vitamins'].includes(c.groupKey)))
              .forEach(c => {
                c.tests.slice(0, 2).forEach(t => derivedTests.push(t.name));
              });
          }
          if (derivedTests.length === 0) {
            derivedTests = [
              'Liver Enzymes (SGOT, SGPT, Bilirubin)',
              'Renal Clearance (Creatinine, BUN, Uric Acid)',
              'Lipid Fractions (Cholesterol, HDL, LDL)',
              'Thyroid Stimulating Hormone (Ultrasensitive TSH)'
            ];
          }
        } else if (lower.includes('grey') || lower.includes('gray') || lower.includes('fluoride')) {
          additive = 'Sodium Fluoride (Glycolysis Inhibitor) + Potassium Oxalate';
          derivedTests = [
            'Fasting Blood Glucose (Hexokinase Method)',
            'Post-Prandial Glycemia / Average Glucose'
          ];
        } else if (lower.includes('blue') || lower.includes('citrate')) {
          additive = 'Trisodium Citrate 3.2% (1:9 Coagulation Ratio)';
          derivedTests = [
            'Prothrombin Time (PT - INR)',
            'Activated Partial Thromboplastin Time (APTT)'
          ];
        }

        return {
          name: tube.name,
          capColor: tube.capColor,
          liquidColor: tube.liquidColor,
          type: tube.type || 'Diagnostic Vacutainer',
          hasGelSeparator: hasGel,
          additive,
          tests: derivedTests
        };
      });
    }

    // Default authentic fallback if packageData has no explicit tubes
    return [
      {
        name: 'Lavender EDTA',
        capColor: '#a855f7',
        liquidColor: '#7f1d1d',
        type: 'Hematology Whole Blood',
        hasGelSeparator: false,
        additive: 'K2 EDTA (Whole Blood Preservation)',
        tests: ['Complete Blood Count (CBC - 24 Params)', 'Hemoglobin (Hb)', 'Platelet Count']
      },
      {
        name: 'Gold SST Gel',
        capColor: '#eab308',
        liquidColor: '#ca8a04',
        type: 'Biochemistry Serum',
        hasGelSeparator: true,
        additive: 'Silica Clot Activator + Polymer Gel',
        tests: ['Liver Function (SGOT/SGPT)', 'Kidney Function (Creatinine)', 'Lipid Profile (Cholesterol, HDL)']
      }
    ];
  };

  const dynamicTubes = getDynamicTubes();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breakdown-drawer-title"
    >
      <div 
        className="w-full sm:max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col text-slate-100 animate-in slide-in-from-bottom-8 duration-300"
        style={{
          boxShadow: '0 25px 80px rgba(0, 240, 255, 0.15), 0 0 40px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Drawer Header (Strict 8px grid & min 44px tap target) */}
        <header className="p-6 border-b border-slate-800/80 bg-slate-900/60 sticky top-0 backdrop-blur-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <FlaskConical size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CLINICAL VACUTAINER & PARAMETER BREAKDOWN
                </span>
                <span className="text-xs text-slate-400">· {packageData.parametersCount || 84} Parameters</span>
              </div>
              <h3 id="breakdown-drawer-title" className="font-extrabold text-lg sm:text-xl text-white mt-1">
                {packageData.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Organ Breakdown Drawer"
            className="min-w-[44px] min-h-[44px] p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X size={22} />
          </button>
        </header>

        {/* Drawer Body (Locked 8px rhythm: p-6, space-y-6) */}
        <div className="p-6 space-y-6">
          {/* Clinical Significance Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5 text-xs leading-relaxed">
            <Activity size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <b className="text-white block font-semibold mb-1">Diagnostic Rationale & Organ Correlation:</b>
              <p className="text-slate-300">
                {packageData.clinicalSignificance || packageData.whyTake || 'Clinical panel designed to evaluate core physiological parameters, organ enzyme activity, and metabolic homeostasis.'}
              </p>
            </div>
          </div>

          {/* Dynamic Specimen Tube Vials with Real Meniscus & SST Gel */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="uppercase tracking-wider font-mono text-cyan-400 flex items-center gap-2">
                <Microscope size={15} />
                Required Specimen Vials ({dynamicTubes.length} Tubes)
              </span>
              <span className="text-slate-400 font-normal flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> NABL Dual MD Review
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dynamicTubes.map((tube, idx) => (
                <div
                  key={`${tube.name}-${idx}`}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Realistic 3D SVG Specimen Tube with Meniscus and Gel Layer */}
                    <div className="shrink-0">
                      <SpecimenTubeGraphic
                        capColor={tube.capColor}
                        tubeName={tube.name}
                        hasGelSeparator={tube.hasGelSeparator}
                        liquidColor={tube.liquidColor}
                        fillPercent={70}
                        width={30}
                        height={76}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <b className="text-sm font-bold text-white">{tube.name}</b>
                        <span 
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: `${tube.capColor}20`, color: tube.capColor, border: `1px solid ${tube.capColor}40` }}
                        >
                          {tube.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Additive: {tube.additive}
                      </p>
                      
                      {/* Constituent Test Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tube.tests.map(t => (
                          <span 
                            key={t}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/50"
                          >
                            ✓ {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fasting & Delivery Guarantee Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
              <Clock size={18} className="text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">FASTING REQUIREMENT</span>
                <b className="text-white text-sm">
                  {packageData.fastingHours ? `${packageData.fastingHours} Hours Overnight Fasting` : 'No Fasting Needed'}
                </b>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
              <Droplet size={18} className="text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">REPORT DELIVERY SLA</span>
                <b className="text-emerald-400 text-sm">{packageData.tat || 'Within 6 Hours (NABL Verified)'}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer with Instant Checkout (min 44px tap targets) */}
        <footer className="p-6 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              NABL Standard Home Collection
            </div>
            <div className="flex items-baseline gap-2.5 mt-0.5">
              <b className="text-2xl font-black text-white">₹{packageData.price}</b>
              {packageData.old && (
                <span className="text-sm text-slate-500 line-through">₹{packageData.old}</span>
              )}
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Free Doorstep Visit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex-1 sm:flex-none text-center"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToCart(packageData);
                onClose();
              }}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex-1 sm:flex-none"
            >
              Book Package Now <ArrowRight size={16} />
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default OrganTestBreakdownDrawer;
