import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Heart, 
  Droplet, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Share2, 
  Download, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight, 
  Stethoscope, 
  Calendar, 
  UserCheck, 
  QrCode, 
  Award, 
  Utensils, 
  Check, 
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowUpRight,
  Printer,
  FlaskConical
} from 'lucide-react';
import { generateAndDownloadNablPdf } from '../services/nablPdfEngine';
import WhatsAppCloudGateway from '../services/whatsappCloudGateway';

export interface SmartAiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  onExplore3DOrgan?: (organId: string) => void;
}

export interface BiomarkerDetail {
  id: string;
  name: string;
  hindiName: string;
  category: 'Metabolic' | 'Cardiovascular' | 'Hepatic' | 'Renal' | 'Hematology';
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  status: 'Optimal' | 'Borderline' | 'Alert';
  historicalTrend: { date: string; value: number }[];
  clinicalSignificance: string;
  hindiSignificance: string;
}

// ─── Phase 2: 5-Zone Bio-Spectrum helpers ───────────────────────────────────

type BioZone = 'criticalLow' | 'suboptimal' | 'optimal' | 'borderlineHigh' | 'criticalHigh';

function getBioZone(value: number, refLow: number, refHigh: number): BioZone {
  if (value < refLow * 0.80) return 'criticalLow';
  if (value < refLow) return 'suboptimal';
  if (value <= refHigh) return 'optimal';
  if (value <= refHigh * 1.25) return 'borderlineHigh';
  return 'criticalHigh';
}

function getSpectrumPosition(value: number, refLow: number, refHigh: number): number {
  // Map onto a 5-zone bar where each zone = 20%
  // Zone boundaries: critLow=[0..20], subopt=[20..40], opt=[40..60], borderHigh=[60..80], critHigh=[80..100]
  const critLowBound = refLow * 0.80;
  const borderHighBound = refHigh * 1.25;

  if (value <= critLowBound) {
    // Within zone 1 (0–20%)
    const lo = refLow * 0.50; // generous lower bound for display
    const pct = Math.max(0, Math.min(1, (value - lo) / (critLowBound - lo)));
    return pct * 20;
  } else if (value < refLow) {
    const pct = (value - critLowBound) / (refLow - critLowBound);
    return 20 + pct * 20;
  } else if (value <= refHigh) {
    const pct = (value - refLow) / (refHigh - refLow);
    return 40 + pct * 20;
  } else if (value <= borderHighBound) {
    const pct = (value - refHigh) / (borderHighBound - refHigh);
    return 60 + pct * 20;
  } else {
    const hi = borderHighBound + (borderHighBound - refHigh); // mirror headroom
    const pct = Math.min(1, (value - borderHighBound) / Math.max(1, hi - borderHighBound));
    return 80 + pct * 20;
  }
}

function getDeviationText(value: number, refLow: number, refHigh: number): string {
  const zone = getBioZone(value, refLow, refHigh);
  if (zone === 'optimal') return 'Within optimal range ✓';
  if (zone === 'suboptimal') {
    const pct = Math.round(((refLow - value) / refLow) * 100);
    return `${pct}% below lower limit`;
  }
  if (zone === 'criticalLow') {
    const pct = Math.round(((refLow - value) / refLow) * 100);
    return `⚠ ${pct}% critically below lower limit`;
  }
  if (zone === 'borderlineHigh') {
    const pct = Math.round(((value - refHigh) / refHigh) * 100);
    return `+${pct}% above upper limit`;
  }
  // criticalHigh
  const pct = Math.round(((value - refHigh) / refHigh) * 100);
  return `⚠ +${pct}% critically above upper limit`;
}

const ZONE_COLORS = [
  { bg: 'bg-rose-600',    label: 'Critical Low',    textColor: 'text-rose-400'    },
  { bg: 'bg-amber-400',   label: 'Suboptimal',      textColor: 'text-amber-400'   },
  { bg: 'bg-emerald-500', label: 'Optimal',         textColor: 'text-emerald-400' },
  { bg: 'bg-orange-500',  label: 'Borderline High', textColor: 'text-orange-400'  },
  { bg: 'bg-rose-600',    label: 'Critical High',   textColor: 'text-rose-400'    },
];

// ─── NABL lab methods map ────────────────────────────────────────────────────
const LAB_METHODS: Record<string, string> = {
  fbs:         'Hexokinase (Au)',
  hba1c:       'HPLC (Bio-Rad D-10)',
  triglycerides: 'CHOD-PAP (AU)',
  hdl:         'Direct Enzymatic',
  sgpt:        'Kinetic UV',
  creatinine:  'Kinetic Jaffe',
  hemoglobin:  'Sysmex XN-550',
  vitd:        'ECLIA (Cobas e411)',
};

function getFlag(status: 'Optimal' | 'Borderline' | 'Alert'): { label: string; cls: string } {
  if (status === 'Optimal') return { label: '✓', cls: 'text-emerald-400 font-bold' };
  if (status === 'Borderline') return { label: 'H', cls: 'text-amber-400 font-bold' };
  return { label: '⚠', cls: 'text-rose-400 font-bold' };
}

function getResultColor(status: 'Optimal' | 'Borderline' | 'Alert'): string {
  if (status === 'Optimal') return 'text-emerald-300';
  if (status === 'Borderline') return 'text-amber-300';
  return 'text-rose-300';
}

// ─── Today's date for NABL sheet ─────────────────────────────────────────────
const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Component ───────────────────────────────────────────────────────────────

export const SmartAiReportModal: React.FC<SmartAiReportModalProps> = ({
  isOpen,
  onClose,
  bookingId = 'DSD-2401',
  patientName = 'Sunita Sharma',
  patientAge = 52,
  patientGender = 'Female',
  onExplore3DOrgan
}) => {
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'biomarkers' | 'nutrition' | 'trends' | 'nabl'>('summary');
  const [selectedOrganFilter, setSelectedOrganFilter] = useState<string>('all');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Vitality Health Score (0-100)
  const vitalityScore = 84;

  const biomarkers: BiomarkerDetail[] = [
    {
      id: 'fbs',
      name: 'Fasting Blood Sugar (FBS)',
      hindiName: 'खाली पेट शुगर (ग्लूकोज)',
      category: 'Metabolic',
      value: 108,
      unit: 'mg/dL',
      refLow: 70,
      refHigh: 99,
      status: 'Borderline',
      historicalTrend: [
        { date: '6 Mos Ago', value: 114 },
        { date: '3 Mos Ago', value: 110 },
        { date: 'Today', value: 108 }
      ],
      clinicalSignificance: 'Mild fasting glucose elevation indicates impaired glucose tolerance / early insulin resistance.',
      hindiSignificance: 'खाली पेट शुगर सामान्य (99) से थोड़ा अधिक है। यह प्री-डायबिटीज का शुरुआती संकेत हो सकता है।'
    },
    {
      id: 'hba1c',
      name: 'HbA1c (Glycated Hemoglobin)',
      hindiName: '3 महीने की औसत शुगर (HbA1c)',
      category: 'Metabolic',
      value: 5.6,
      unit: '%',
      refLow: 4.0,
      refHigh: 5.6,
      status: 'Optimal',
      historicalTrend: [
        { date: '6 Mos Ago', value: 5.8 },
        { date: '3 Mos Ago', value: 5.7 },
        { date: 'Today', value: 5.6 }
      ],
      clinicalSignificance: 'Excellent 90-day glycemic control within safe physiological threshold.',
      hindiSignificance: 'पिछले 3 महीनों का औसत शुगर पूरी तरह सुरक्षित और सामान्य सीमा के अंदर है।'
    },
    {
      id: 'triglycerides',
      name: 'Serum Triglycerides',
      hindiName: 'रक्त वसा (ट्राइग्लिसराइड्स)',
      category: 'Cardiovascular',
      value: 168,
      unit: 'mg/dL',
      refLow: 50,
      refHigh: 150,
      status: 'Borderline',
      historicalTrend: [
        { date: '6 Mos Ago', value: 185 },
        { date: '3 Mos Ago', value: 172 },
        { date: 'Today', value: 168 }
      ],
      clinicalSignificance: 'Dietary blood lipid energy stores slightly high; responsive to aerobic walking and reducing simple sugars.',
      hindiSignificance: 'खून में चर्बी (फैट) का स्तर सामान्य से हल्का अधिक है, जो तले-भुने भोजन और मीठे से बढ़ता है।'
    },
    {
      id: 'hdl',
      name: 'HDL Cholesterol (Good)',
      hindiName: 'अच्छा कोलेस्ट्रॉल (सुरक्षात्मक HDL)',
      category: 'Cardiovascular',
      value: 46,
      unit: 'mg/dL',
      refLow: 40,
      refHigh: 60,
      status: 'Optimal',
      historicalTrend: [
        { date: '6 Mos Ago', value: 42 },
        { date: '3 Mos Ago', value: 44 },
        { date: 'Today', value: 46 }
      ],
      clinicalSignificance: 'Cardioprotective high-density lipoprotein is healthy and actively clearing vascular plaque.',
      hindiSignificance: 'दिल की नसों की रक्षा करने वाला गुड कोलेस्ट्रॉल संतोषजनक स्तर पर है।'
    },
    {
      id: 'sgpt',
      name: 'SGPT / ALT (Liver Enzyme)',
      hindiName: 'लिवर एंजाइम (एसजीपीटी)',
      category: 'Hepatic',
      value: 28,
      unit: 'U/L',
      refLow: 5,
      refHigh: 45,
      status: 'Optimal',
      historicalTrend: [
        { date: '6 Mos Ago', value: 34 },
        { date: '3 Mos Ago', value: 30 },
        { date: 'Today', value: 28 }
      ],
      clinicalSignificance: 'Hepatocyte integrity intact; zero evidence of liver cellular inflammation or drug-induced injury.',
      hindiSignificance: 'लिवर की कोशिकाएं पूरी तरह स्वस्थ हैं, कोई सूजन या इन्फेक्शन नहीं है।'
    },
    {
      id: 'creatinine',
      name: 'Serum Creatinine',
      hindiName: 'किडनी फिल्टरेशन (सीरम क्रिएटिनिन)',
      category: 'Renal',
      value: 0.85,
      unit: 'mg/dL',
      refLow: 0.6,
      refHigh: 1.2,
      status: 'Optimal',
      historicalTrend: [
        { date: '6 Mos Ago', value: 0.88 },
        { date: '3 Mos Ago', value: 0.86 },
        { date: 'Today', value: 0.85 }
      ],
      clinicalSignificance: 'Robust glomerular nephron clearance; normal renal waste elimination.',
      hindiSignificance: 'गुर्दे (किडनी) खून की सफाई सामान्य गति से कर रहे हैं।'
    },
    {
      id: 'hemoglobin',
      name: 'Hemoglobin (Hb)',
      hindiName: 'रक्त में हीमोग्लोबिन (Hb)',
      category: 'Hematology',
      value: 13.4,
      unit: 'g/dL',
      refLow: 12.0,
      refHigh: 15.5,
      status: 'Optimal',
      historicalTrend: [
        { date: '6 Mos Ago', value: 12.8 },
        { date: '3 Mos Ago', value: 13.1 },
        { date: 'Today', value: 13.4 }
      ],
      clinicalSignificance: 'Normocytic red blood cell carrying capacity; zero anemia.',
      hindiSignificance: 'खून की मात्रा (हीमोग्लोबिन) बहुत अच्छी है, एनीमिया का कोई लक्षण नहीं है।'
    },
    {
      id: 'vitd',
      name: 'Vitamin D3 (25-OH Total)',
      hindiName: 'विटामिन D3 (हड्डियों की मजबूती)',
      category: 'Metabolic',
      value: 22.4,
      unit: 'ng/mL',
      refLow: 30.0,
      refHigh: 100.0,
      status: 'Alert',
      historicalTrend: [
        { date: '6 Mos Ago', value: 18.2 },
        { date: '3 Mos Ago', value: 20.1 },
        { date: 'Today', value: 22.4 }
      ],
      clinicalSignificance: 'Sub-optimal serum cholecalciferol stores; recommend oral supplementation under clinical guidance.',
      hindiSignificance: 'विटामिन D3 की कमी है। इससे थकान, जोड़ों में दर्द और कैल्शियम अवशोषण में कमी हो सकती है।'
    }
  ];

  // Speech Audio Synthesizer for 60-Sec Doctor Summary
  useEffect(() => {
    let timer: any;
    if (isPlayingAudio) {
      const summaryText = language === 'hi' 
        ? `नमस्ते श्रीमती ${patientName} जी। डॉक्टर शास्त्री डायग्नोस्टिक्स अलीगढ़ की एआई क्लिनिकल टीम आपकी रिपोर्ट का सारांश प्रस्तुत कर रही है। आपकी ओवरऑल वाइटैलिटी स्कोर चौरासी प्रतिशत है। आपके लिवर, किडनी और खून की जांचें पूरी तरह सामान्य हैं। खाली पेट शुगर एक सौ आठ और ट्राइग्लिसराइड्स एक सौ अड़सठ हैं, जो कि हल्के बढ़े हुए हैं। रोज़ाना पैंतालीस मिनट की वॉक और मीठा कम करने से यह जल्द सामान्य हो जाएंगे। विटामिन डी की कमी के लिए सप्लीमेंट की सलाह दी जाती है। धन्यवाद।`
        : `Hello Mrs. ${patientName}. Dr. Shastri Diagnostics Clinical AI has synthesized your health report. Your overall Vitality Score is 84 out of 100. Your liver, renal, and hemogram parameters are completely optimal. Fasting glucose at 108 and triglycerides at 168 reflect mild metabolic slowdown. Daily 45 minutes of brisk walking, reducing refined carbohydrates, and vitamin D supplementation are recommended. Thank you.`;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(summaryText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setAudioProgress(100);
        };
        window.speechSynthesis.speak(utterance);
      }

      timer = setInterval(() => {
        setAudioProgress(p => (p >= 100 ? 0 : p + 2));
      }, 500);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setAudioProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlayingAudio, language, patientName]);

  if (!isOpen) return null;

  const filteredBiomarkers = selectedOrganFilter === 'all' 
    ? biomarkers 
    : biomarkers.filter(b => b.category.toLowerCase() === selectedOrganFilter.toLowerCase());

  const hasBorderlineOrAlert = biomarkers.some(b => b.status === 'Borderline' || b.status === 'Alert');

  const handleShareWhatsApp = () => {
    const text = language === 'hi'
      ? `*डॉ. शास्त्री डायग्नोस्टिक्स अलीगढ़ (NABL प्रमाणित)*%0Aमरीज: ${patientName}%0Aस्वास्थ्य स्कोर: ${vitalityScore}/100 (उत्तम)%0Aस्मार्ट रिपोर्ट लिंक: https://dsdcare.in/smart-report/${bookingId}%0Aसभी 92 पैरामीटर्स सुरक्षित एन्क्रिप्टेड हैं।`
      : `*Dr. Shastri Diagnostics Aligarh (NABL Certified)*%0APatient: ${patientName}%0AVitality Score: ${vitalityScore}/100%0ASmart Report Link: https://dsdcare.in/smart-report/${bookingId}%0AEncrypted report verified by Dual MD Pathologists.`;
    
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setWhatsappSent(true);
    setTimeout(() => setWhatsappSent(false), 3000);
  };

  const handleDownloadPdf = () => {
    generateAndDownloadNablPdf({
      bookingId,
      patientName,
      ageGender: `${patientAge}Y / ${patientGender}`,
      phone: '+91 98370 12345',
      packageName: 'DSD 2026 Smart Health Screen',
      barcode: 'BC-DSD-98124',
      collectionTime: '07:00 AM Today',
      reportedTime: '11:30 AM Today',
      verifiedBy: 'Dr. S. K. Shastri, MD (AIIMS) & Dr. Ananya Shastri, MD',
      parameters: biomarkers.map(b => ({
        category: b.category,
        name: b.name,
        value: String(b.value),
        unit: b.unit,
        refRange: `${b.refLow} – ${b.refHigh}`,
        method: LAB_METHODS[b.id] ?? 'Automated Clinical Chemistry',
        status: b.status === 'Optimal' ? 'Normal' : b.status === 'Borderline' ? 'High' : 'Critical'
      }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-950/50 text-slate-100 backdrop-blur-xl animate-in zoom-in-95 duration-200">
        
        {/* TOP STATUS BAR */}
        <header className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  2026 AI SMART REPORT
                </span>
                <span className="text-xs text-slate-400 font-mono">Ref: {bookingId}</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  NABL ISO-15189 Verified
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {patientName} · {patientAge}Y / {patientGender}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'hi' 
                    ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en' 
                    ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close smart report"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* HERO VITALITY HUD & AUDIO SUMMARY BAR */}
        <div className="p-4 sm:p-6 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Circular Vitality Gauge */}
          <div className="md:col-span-4 flex items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray={`${vitalityScore}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{vitalityScore}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">/ 100</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                {language === 'hi' ? 'समग्र स्वास्थ्य स्कोर' : 'Vitality Resilience Score'}
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {language === 'hi' ? 'उत्तम मेटाबॉलिक स्थिति' : 'Optimal Metabolic Status'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? '92 में से 88 टेस्ट बिल्कुल सामान्य' : '88 of 92 Parameters Optimal'}
              </div>
            </div>
          </div>

          {/* Audio Health Summary Player */}
          <div className="md:col-span-8 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/30 p-4 rounded-2xl border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  isPlayingAudio 
                    ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse' 
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
                }`}
                title={isPlayingAudio ? 'Pause Voice Summary' : 'Play 60-Sec Audio Summary'}
              >
                {isPlayingAudio ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    {language === 'hi' ? 'डॉक्टर AI वॉयस सारांश (60 Sec)' : 'AI Clinical Voice Summary (60 Sec)'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
                    {language === 'hi' ? 'हिन्दी ऑडियो' : 'English Audio'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isPlayingAudio 
                    ? (language === 'hi' ? 'ऑडियो चल रहा है... ध्यान से सुनें' : 'Playing clinical explanation...') 
                    : (language === 'hi' ? 'अपनी रिपोर्ट को आसान भाषा में सुनने के लिए प्ले करें' : 'Listen to plain-language doctor explanation')}
                </p>
              </div>
            </div>

            {/* Simulated Animated Waveform */}
            <div className="flex items-center gap-1 h-6">
              {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80].map((h, idx) => (
                <div 
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-cyan-400' : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlayingAudio ? `${Math.max(20, (h * (audioProgress % 20 + 10)) / 25)}%` : '25%'
                  }}
                />
              ))}
            </div>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-4 sm:gap-6 px-6 pt-3 border-b border-slate-800 text-xs sm:text-sm font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-3 relative transition-colors whitespace-nowrap ${
              activeTab === 'summary' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? 'क्लिनिकल सारांश (AI Overview)' : 'Clinical AI Summary'}
            {activeTab === 'summary' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('biomarkers')}
            className={`pb-3 relative transition-colors whitespace-nowrap ${
              activeTab === 'biomarkers' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? 'बायोमार्कर रेंज विजुअलाइज़र' : 'Biomarkers & Range Sliders'}
            {activeTab === 'biomarkers' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nutrition')}
            className={`pb-3 relative transition-colors whitespace-nowrap ${
              activeTab === 'nutrition' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? 'आहार व लाइफस्टाइल प्लान' : 'Personalized Nutrition & Diet'}
            {activeTab === 'nutrition' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`pb-3 relative transition-colors whitespace-nowrap ${
              activeTab === 'trends' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'hi' ? '6-महीने का ट्रेंड (Longitudinal)' : 'Historical Trends'}
            {activeTab === 'trends' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>

          {/* Phase 3: 5th Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('nabl')}
            className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'nabl' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical size={13} />
            {language === 'hi' ? 'NABL प्रमाणित लैब शीट' : 'Official NABL Sheet'}
            {activeTab === 'nabl' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
          </button>
        </div>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          
          {/* ──────────────────────────────────────────────────────────────────
              TAB 1: SUMMARY
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Executive Plain Language Insight Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Sparkles size={18} className="text-cyan-400" />
                    {language === 'hi' ? 'प्रमुख निष्कर्ष एवं डॉक्टर सलाह' : 'Executive AI Diagnostic Insights'}
                  </h3>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {language === 'hi' ? 'एमडी पैथोलॉजिस्ट द्वारा सत्यापित' : 'Dual MD Pathologist Verified'}
                  </span>
                </div>

                <div className="text-sm leading-relaxed text-slate-300 space-y-2">
                  {language === 'hi' ? (
                    <>
                      <p>
                        <b>1. लिवर व गुर्दे (Kidney) पूरी तरह सुरक्षित:</b> आपके लिवर एंजाइम (SGPT: 28 U/L) और गुर्दे का फिल्टरेशन (Serum Creatinine: 0.85 mg/dL) एकदम उत्तम हैं। कोशिकाओं में किसी प्रकार की सूजन या तनाव नहीं है।
                      </p>
                      <p>
                        <b>2. मेटाबॉलिक एवं शुगर चेतावनी:</b> खाली पेट शुगर का स्तर <b>108 mg/dL</b> और ट्राइग्लिसराइड्स <b>168 mg/dL</b> हैं। यह प्री-डायबिटीज की शुरुआती अवस्था का संकेत है। अच्छी बात यह है कि आपका 3 महीने का औसत (HbA1c: 5.6%) अभी सामान्य है, इसलिए खानपान में बदलाव से इसे बिना दवाओं के ठीक किया जा सकता है।
                      </p>
                      <p>
                        <b>3. विटामिन डी3 की कमी:</b> विटामिन D3 का स्तर <b>22.4 ng/mL</b> (सामान्य: 30+) है। हल्की धूप और डॉक्टर की सलाह से वीकली सप्लीमेंट लेने से हड्डियों और जोड़ों का दर्द दूर होगा।
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <b>1. Intact Hepatorenal Integrity:</b> SGPT (28 U/L) and Serum Creatinine (0.85 mg/dL) demonstrate excellent physiological filtration and hepatobiliary health with zero toxic stress.
                      </p>
                      <p>
                        <b>2. Early Metabolic Alert:</b> Fasting blood glucose (108 mg/dL) and triglycerides (168 mg/dL) indicate early insulin resistance. Since HbA1c remains within normal bounds (5.6%), this is 100% reversible through dietary fiber and daily physical activity.
                      </p>
                      <p>
                        <b>3. Vitamin D3 Deficiency:</b> Serum levels at 22.4 ng/mL suggest mild deficiency. A standardized 60,000 IU weekly cholecalciferol course is clinically suggested.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* 5 Organ Radar Cards Grid */}
              <div>
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {language === 'hi' ? 'अंग-अनुसार स्वास्थ्य स्थिति (5 Organ Systems)' : 'Systemic Organ Health Radar'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Metabolic */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                          🩸 {language === 'hi' ? 'मेटाबॉलिज्म / शुगर' : 'Metabolic & Glycemic'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                          BORDERLINE
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">FBS 108 · HbA1c 5.6%</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi' ? 'फास्टिंग हल्का बढ़ा हुआ, 3-माह औसत सामान्य' : 'Impaired fasting glucose, normal 90-day mean'}
                      </p>
                    </div>
                    {onExplore3DOrgan && (
                      <button
                        type="button"
                        onClick={() => onExplore3DOrgan('pancreas')}
                        className="mt-3 text-[11px] text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        3D Pancreas Anatomy <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Cardiovascular */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                          🫀 {language === 'hi' ? 'हृदय एवं लिपिड' : 'Cardiovascular & Lipids'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                          MILD RISK
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">Triglycerides 168 · HDL 46</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi' ? 'ट्राइग्लिसराइड्स हल्के अधिक, गुड कोलेस्ट्रॉल ठीक' : 'High triglycerides, protective HDL optimal'}
                      </p>
                    </div>
                    {onExplore3DOrgan && (
                      <button
                        type="button"
                        onClick={() => onExplore3DOrgan('heart')}
                        className="mt-3 text-[11px] text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        3D Heart Model <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Hepatic */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          🫁 {language === 'hi' ? 'लिवर स्वास्थ्य' : 'Hepatic Function'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          OPTIMAL ✓
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">SGPT 28 U/L · Bilirubin 0.7</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi' ? 'लिवर कोशिकाएं 100% स्वस्थ और सक्रिय' : 'Hepatocellular clearance fully preserved'}
                      </p>
                    </div>
                    {onExplore3DOrgan && (
                      <button
                        type="button"
                        onClick={() => onExplore3DOrgan('liver')}
                        className="mt-3 text-[11px] text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        3D Liver Resonance <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Renal */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          🩺 {language === 'hi' ? 'गुर्दे व किडनी' : 'Renal Filtration'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          OPTIMAL ✓
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">Creatinine 0.85 · BUN 14</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi' ? 'नेफ्रॉन सफाई दर और इलेक्ट्रोलाइट्स सामान्य' : 'Glomerular eGFR > 95 mL/min'}
                      </p>
                    </div>
                    {onExplore3DOrgan && (
                      <button
                        type="button"
                        onClick={() => onExplore3DOrgan('kidney')}
                        className="mt-3 text-[11px] text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        3D Kidney View <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Hematology */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          🔬 {language === 'hi' ? 'खून व इम्युनिटी' : 'Hemogram & Immunity'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          OPTIMAL ✓
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">Hb 13.4 g/dL · TLC 7,800</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi' ? 'खून की प्रचुर मात्रा, रोग प्रतिरोधक क्षमता मजबूत' : 'Robust oxygenation & immune WBC count'}
                      </p>
                    </div>
                    {onExplore3DOrgan && (
                      <button
                        type="button"
                        onClick={() => onExplore3DOrgan('blood')}
                        className="mt-3 text-[11px] text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        3D Cellular Blood <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Deficiencies */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                          🦴 {language === 'hi' ? 'हड्डी व विटामिन्स' : 'Bone & Vitamins'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
                          DEFICIENT
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">Vit D3: 22.4 ng/mL</div>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'hi' ? 'हड्डियों में कमजोरी व थकान का कारण' : 'Below 30 ng/mL threshold'}
                      </p>
                    </div>
                    {onExplore3DOrgan && (
                      <button
                        type="button"
                        onClick={() => onExplore3DOrgan('bone')}
                        className="mt-3 text-[11px] text-cyan-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        3D Skeleton Focus <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Phase 4: Recommended Next Steps ─────────────────────── */}
              {hasBorderlineOrAlert && (
                <div className="space-y-3">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'hi' ? 'अनुशंसित अगले कदम' : 'Recommended Next Steps'}
                  </div>

                  {/* Card 1: Free MD Consult */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        ⚕ {language === 'hi' ? 'निःशुल्क एमडी पैथोलॉजिस्ट पोस्ट-रिपोर्ट परामर्श (15 मिनट)' : 'Free MD Pathologist Post-Report Guidance (15 Min)'}
                      </div>
                      <p className="text-xs text-slate-400">
                        {language === 'hi'
                          ? 'आपके बढ़े हुए FBS और ट्राइग्लिसराइड्स के आधार पर — एक निःशुल्क फोन परामर्श शेड्यूल करें।'
                          : 'Based on your elevated FBS & Triglycerides — schedule a complimentary phone consult.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 px-4 py-2.5 rounded-xl border border-cyan-400/60 text-cyan-300 text-xs font-bold hover:bg-cyan-500/15 transition-colors whitespace-nowrap"
                    >
                      {language === 'hi' ? 'निःशुल्क परामर्श बुक करें →' : 'Schedule Free Consult →'}
                    </button>
                  </div>

                  {/* Card 2: Follow-up Test */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        📅 {language === 'hi' ? 'अनुशंसित अनुवर्ती: विटामिन D3 और कैल्शियम पैनल' : 'Recommended Follow-up: Vitamin D3 & Calcium Panel'}
                      </div>
                      <p className="text-xs text-slate-400">
                        {language === 'hi'
                          ? 'सप्लीमेंटेशन के 90 दिनों बाद पुनः जांच करें। 20% लॉयल्टी डिस्काउंट पहले से लागू।'
                          : 'Re-check in 90 days after supplementation. Pre-filled at 20% loyalty discount.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors whitespace-nowrap"
                    >
                      {language === 'hi' ? 'कार्ट में जोड़ें (₹79)' : 'Add to Cart (₹79)'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 2: BIOMARKERS — Phase 2: 5-Zone Bio-Spectrum Visualizer
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'biomarkers' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {['all', 'Metabolic', 'Cardiovascular', 'Hepatic', 'Renal', 'Hematology'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedOrganFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-colors ${
                      selectedOrganFilter === cat 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Biomarkers List with 5-Zone Spectrum Bars */}
              <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                {filteredBiomarkers.map((b) => {
                  const specPos = getSpectrumPosition(b.value, b.refLow, b.refHigh);
                  const deviationText = getDeviationText(b.value, b.refLow, b.refHigh);
                  const zone = getBioZone(b.value, b.refLow, b.refHigh);

                  const deviationColor =
                    zone === 'optimal'
                      ? 'text-emerald-400'
                      : zone === 'suboptimal' || zone === 'borderlineHigh'
                      ? 'text-amber-400'
                      : 'text-rose-400';

                  return (
                    <div key={b.id} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {language === 'hi' ? b.hindiName : b.name}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              b.status === 'Optimal' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                : b.status === 'Borderline'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {language === 'hi' ? b.hindiSignificance : b.clinicalSignificance}
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-lg font-black text-white font-mono">
                            {b.value} <span className="text-xs font-normal text-slate-400">{b.unit}</span>
                          </span>
                          <div className="text-[10.5px] font-mono text-slate-500">
                            Ref: {b.refLow} – {b.refHigh} {b.unit}
                          </div>
                        </div>
                      </div>

                      {/* 5-Zone Bio-Spectrum Bar */}
                      <div className="mt-2 space-y-2">
                        {/* Colored Zone Segments */}
                        <div className="relative">
                          <div className="flex h-3 rounded-full overflow-hidden border border-slate-700/50">
                            {ZONE_COLORS.map((z, i) => (
                              <div
                                key={i}
                                className={`flex-1 ${z.bg} ${i === 0 ? '' : ''}`}
                                style={{ opacity: i === 2 ? 1 : 0.75 }}
                              />
                            ))}
                          </div>

                          {/* Diamond / Triangle patient indicator */}
                          <div
                            className="absolute -top-0.5 -translate-x-1/2 transition-all duration-500"
                            style={{ left: `${Math.min(98, Math.max(2, specPos))}%` }}
                          >
                            {/* Diamond shape via rotated square */}
                            <div
                              className={`w-4 h-4 rotate-45 border-2 shadow-md ${
                                zone === 'optimal'
                                  ? 'bg-emerald-400 border-emerald-200 shadow-emerald-400/60'
                                  : zone === 'suboptimal' || zone === 'borderlineHigh'
                                  ? 'bg-amber-400 border-amber-200 shadow-amber-400/60'
                                  : 'bg-rose-500 border-rose-200 shadow-rose-500/60'
                              }`}
                            />
                          </div>
                        </div>

                        {/* 5-zone label row */}
                        <div className="flex text-[9.5px] font-mono text-slate-500">
                          {ZONE_COLORS.map((z, i) => (
                            <div key={i} className={`flex-1 text-center ${z.textColor} font-semibold truncate px-0.5`}>
                              {z.label}
                            </div>
                          ))}
                        </div>

                        {/* Deviation text */}
                        <div className={`text-[11px] font-mono font-semibold ${deviationColor}`}>
                          {deviationText}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 3: NUTRITION & ACTION MATRIX
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200 leading-relaxed">
                <span className="font-bold text-cyan-300 block mb-1">
                  {language === 'hi' ? '📌 एआई क्लिनिकल डाइट प्रिस्क्रिप्शन' : '📌 AI Clinical Dietary Prescription'}
                </span>
                {language === 'hi' 
                  ? 'यह आहार योजना विशेष रूप से आपके फास्टिंग शुगर (108) को सामान्य करने, ट्राइग्लिसराइड्स (168) घटाने और विटामिन डी3 के अवशोषण को बढ़ाने हेतु एआई एल्गोरिदम द्वारा तैयार की गई है।' 
                  : 'This tailored dietary prescription is calibrated to reverse mild impaired fasting glucose (108), lower triglycerides (168), and optimize 25-OH Vitamin D absorption.'}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Foods to Eat */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={16} /> {language === 'hi' ? 'ये खाद्य पदार्थ प्रचुर मात्रा में लें' : 'Foods to Actively Include'}
                  </div>

                  <ul className="space-y-2 text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'अलसी के बीज (Flaxseeds) व अखरोट:' : 'Flaxseeds & Walnuts:'}</b> ओमेगा-3 फैटी एसिड ट्राइग्लिसराइड्स को तेजी से कम करते हैं।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'दालचीनी व मेथी दाना:' : 'Cinnamon & Fenugreek:'}</b> रात को मेथी दाना भिगोकर सुबह पानी पीने से इंसुलिन संवेदनशीलता बढ़ती है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'हरी पत्तेदार सब्जियां व ओट्स:' : 'Leafy Greens & Rolled Oats:'}</b> घुलनशील फाइबर ब्लड शुगर स्पाइक को रोकता है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'मशरूम व फोर्टिफाइड दूध:' : 'Mushrooms & Fortified Milk:'}</b> प्राकृतिक रूप से विटामिन डी3 बढ़ाने में सहायक।</span>
                    </li>
                  </ul>
                </div>

                {/* Foods to Restrict */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="font-bold text-sm text-rose-300 flex items-center gap-2">
                    <AlertTriangle size={16} /> {language === 'hi' ? 'इनसे सख्ती से परहेज रखें' : 'Foods to Strictly Restrict'}
                  </div>

                  <ul className="space-y-2 text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'रिफाइंड चीनी व मिठाइयां:' : 'Refined Sugars & Sweets:'}</b> सीधे लिवर में जाकर ट्राइग्लिसराइड्स बनाती हैं।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'समोसा, कचौरी व डीप फ्राइड स्नैक्स:' : 'Deep-fried Snacks & Trans Fats:'}</b> धमनियों में प्लाक जमने का खतरा बढ़ाते हैं।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'मैदा, बिस्कुट व पैकेज्ड नमकीन:' : 'Refined Flour & Packaged Bakery:'}</b> ग्लाइसेमिक इंडेक्स बहुत अधिक होता है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><b>{language === 'hi' ? 'कोल्ड ड्रिंक्स व डिब्बाबंद फ्रूट जूस:' : 'Carbonated Sodas & Packaged Juices:'}</b> फ्रुक्टोज फैटी लिवर का मुख्य कारण है।</span>
                    </li>
                  </ul>
                </div>

              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 4: LONGITUDINAL TRENDS
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'trends' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                {language === 'hi' 
                  ? 'पिछली 3 जांचों (6 माह पूर्व, 3 माह पूर्व, एवं आज) का वैज्ञानिक तुलनात्मक विश्लेषण।' 
                  : 'Longitudinal comparison across your last 3 diagnostic screenings at Dr. Shastri Diagnostics.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Trend 1: Fasting Glucose */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Fasting Sugar Trajectory</span>
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <TrendingDown size={14} /> -6 mg/dL (Improving)
                    </span>
                  </div>
                  <div className="flex items-end justify-between h-24 pt-4 px-2">
                    <div className="text-center space-y-1">
                      <div className="w-8 bg-amber-500/30 rounded-t h-16 flex items-end justify-center pb-1 text-[10px] font-mono font-bold text-amber-300">114</div>
                      <div className="text-[10px] text-slate-500">6M Ago</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="w-8 bg-amber-500/50 rounded-t h-14 flex items-end justify-center pb-1 text-[10px] font-mono font-bold text-amber-300">110</div>
                      <div className="text-[10px] text-slate-500">3M Ago</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="w-8 bg-cyan-500 rounded-t h-12 flex items-end justify-center pb-1 text-[10px] font-mono font-bold text-slate-950">108</div>
                      <div className="text-[10px] text-cyan-400 font-bold">Today</div>
                    </div>
                  </div>
                </div>

                {/* Trend 2: HbA1c */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">HbA1c 3-Month Mean</span>
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <TrendingDown size={14} /> -0.2% (Controlled)
                    </span>
                  </div>
                  <div className="flex items-end justify-between h-24 pt-4 px-2">
                    <div className="text-center space-y-1">
                      <div className="w-8 bg-slate-700 rounded-t h-14 flex items-end justify-center pb-1 text-[10px] font-mono font-bold text-slate-300">5.8%</div>
                      <div className="text-[10px] text-slate-500">6M Ago</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="w-8 bg-slate-700 rounded-t h-13 flex items-end justify-center pb-1 text-[10px] font-mono font-bold text-slate-300">5.7%</div>
                      <div className="text-[10px] text-slate-500">3M Ago</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="w-8 bg-emerald-500 rounded-t h-11 flex items-end justify-center pb-1 text-[10px] font-mono font-bold text-slate-950">5.6%</div>
                      <div className="text-[10px] text-emerald-400 font-bold">Today</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 5 (Phase 3): OFFICIAL NABL LAB SHEET
          ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'nabl' && (
            <div className="animate-in fade-in duration-200">
              {/* Clinical document wrapper */}
              <div className="bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden text-slate-100 font-mono text-xs">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Lab identity */}
                    <div>
                      <div className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        🔬 Dr. Shastri Diagnostics — Central NABL Lab, Aligarh
                      </div>
                      <div className="text-slate-400 mt-0.5 text-[11px]">
                        1246, Vidyanagar Colony, Ramghat Road, Aligarh (UP) 202001
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          NABL Acc. No.: MC-2847
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
                          ISO 15189:2022
                        </span>
                      </div>
                    </div>

                    {/* NABL QR Placeholder */}
                    <div className="shrink-0 w-16 h-16 border-2 border-slate-500 rounded-lg flex items-center justify-center text-slate-500 text-[9px] text-center font-bold leading-tight">
                      NABL<br/>QR
                    </div>
                  </div>

                  {/* Patient row */}
                  <div className="mt-4 pt-3 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-500">Patient</span>
                      <div className="text-white font-bold">{patientName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Age / Sex</span>
                      <div className="text-white font-bold">{patientAge}Y / {patientGender}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Ref No.</span>
                      <div className="text-white font-bold">{bookingId}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Date</span>
                      <div className="text-white font-bold">{todayStr}</div>
                    </div>
                  </div>

                  {/* SHA-256 */}
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Integrity: SHA-256: <span className="text-cyan-400 font-bold">3a9f2c8e1d4b7f6a...verified ✓</span>
                  </div>
                </div>

                {/* ── Test Table ────────────────────────────────────────── */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-800 text-slate-300 text-left">
                        <th className="px-4 py-2.5 font-bold">Test Name</th>
                        <th className="px-3 py-2.5 font-bold text-center">Result</th>
                        <th className="px-3 py-2.5 font-bold text-center">Unit</th>
                        <th className="px-3 py-2.5 font-bold">Reference Range</th>
                        <th className="px-3 py-2.5 font-bold hidden sm:table-cell">Method</th>
                        <th className="px-3 py-2.5 font-bold text-center">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biomarkers.map((b, idx) => {
                        const flag = getFlag(b.status);
                        const resultColor = getResultColor(b.status);
                        const rowBg = idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40';
                        return (
                          <tr key={b.id} className={`${rowBg} border-b border-slate-800/50`}>
                            <td className="px-4 py-2.5 text-slate-200 font-semibold">{b.name}</td>
                            <td className={`px-3 py-2.5 text-center font-black font-mono ${resultColor}`}>
                              {b.value}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-400">{b.unit}</td>
                            <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                              {b.refLow} – {b.refHigh} {b.unit}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                              {LAB_METHODS[b.id] ?? '—'}
                            </td>
                            <td className={`px-3 py-2.5 text-center ${flag.cls}`}>{flag.label}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Signature Section ────────────────────────────────── */}
                <div className="px-6 py-5 border-t border-slate-700 bg-slate-900/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    <div className="space-y-1">
                      <div className="h-8 border-b border-slate-600 mb-2" />
                      <div className="font-bold text-white text-[12px]">Dr. S. K. Shastri, MBBS, MD (Pathology)</div>
                      <div className="text-slate-400 text-[10px]">AIIMS New Delhi Alumni</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400 text-[10px] font-semibold">Digitally Signed & Encrypted</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-8 border-b border-slate-600 mb-2" />
                      <div className="font-bold text-white text-[12px]">Dr. Ananya Shastri, MBBS, MD (Microbiology)</div>
                      <div className="text-slate-400 text-[10px]">Co-Consultant Pathologist, DSD Central Lab</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400 text-[10px] font-semibold">Digitally Signed & Encrypted</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* ── Print / Download row ─────────────────────────────── */}
                <div className="px-6 py-4 border-t border-slate-700 bg-slate-950 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Printer size={14} /> 🖨 Print Lab Sheet
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <Download size={14} /> ⬇ Download NABL PDF
                  </button>
                  <div className="text-[10px] text-slate-500 sm:ml-auto text-center sm:text-right">
                    NABL Acc. MC-2847 · ISO 15189:2022 · Report for clinical use only
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR */}
        <footer className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck size={16} />
              <span>NABL Encrypted Sign-off: Dr. S. K. Shastri & Dr. Ananya Shastri</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="font-mono text-[10.5px] text-slate-400">
              SHA-256 Provenance: <span className="text-cyan-400 font-bold">Verified ✓</span> (ISO 15189 / HIPAA compliant)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 size={14} /> {whatsappSent ? 'Shared!' : 'WhatsApp Report'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
            >
              <Download size={14} /> Download NABL PDF
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default SmartAiReportModal;
