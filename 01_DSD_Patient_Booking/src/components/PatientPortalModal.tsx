import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Search, 
  X, 
  ShieldCheck, 
  Activity, 
  Bike,
  Sparkles,
  AlertCircle,
  Lock,
  ExternalLink,
  Send,
  QrCode,
  Star,
  Server
} from 'lucide-react';
import { generateAndDownloadNablPdf } from '../services/nablPdfEngine';
import WhatsAppCloudGateway from '../services/whatsappCloudGateway';
import LimsBridge from '../services/limsBridge';

import UniversalLims from '../services/universalLimsAdapter';

interface PatientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveTracking: (bookingId: string) => void;
  onOpenSmartAiReport?: (bookingId: string) => void;
}

export interface BookingRecord {
  id: string;
  patientName: string;
  phone: string;
  packageName: string;
  price: number;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Phlebo En Route' | 'Sample Collected' | 'In Lab Analysis' | 'Report Ready';
  collector: string;
  barcode: string;
  verifiedBy?: string;
  estimatedDelivery?: string;
  parametersSummary?: { name: string; value: string; unit: string; ref: string; status: 'Normal' | 'Borderline' | 'Alert' }[];
}

const DEMO_BOOKINGS: BookingRecord[] = [
  {
    id: 'DSD-2401',
    patientName: 'Sunita Sharma (Age 52)',
    phone: '+91 98370 12345',
    packageName: 'DSD Smart Health Advance (Fasting)',
    price: 499,
    date: 'Today',
    timeSlot: '07:00–09:00 AM',
    status: 'In Lab Analysis',
    collector: 'Rahul Sharma (+91 92588 88085)',
    barcode: 'BC-DSD-98124',
    estimatedDelivery: 'Today by 07:00 PM',
    verifiedBy: 'Pending MD Pathologist Review'
  },
  {
    id: 'DSD-2398',
    patientName: 'Sunita Sharma (Age 52)',
    phone: '+91 98370 12345',
    packageName: 'Basic Health Pack (CBC, Sugar, KFT)',
    price: 299,
    date: '12 Oct 2026',
    timeSlot: '08:00–09:30 AM',
    status: 'Report Ready',
    collector: 'Amit Kumar',
    barcode: 'BC-DSD-97451',
    verifiedBy: 'Dr. Ananya Verma, MD (Pathology) · NABL Reg #48192',
    parametersSummary: [
      { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', ref: '12.0 - 15.0', status: 'Normal' },
      { name: 'Fasting Blood Sugar', value: '94', unit: 'mg/dL', ref: '70 - 99', status: 'Normal' },
      { name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', ref: '0.6 - 1.2', status: 'Normal' },
      { name: 'Total Cholesterol', value: '178', unit: 'mg/dL', ref: '< 200', status: 'Normal' },
      { name: 'HbA1c Glycated', value: '5.4', unit: '%', ref: '< 5.7%', status: 'Normal' }
    ]
  }
];

export const PatientPortalModal: React.FC<PatientPortalModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveTracking,
  onOpenSmartAiReport
}) => {
  const [searchTerm, setSearchTerm] = useState('DSD-2401');
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(DEMO_BOOKINGS[0]);
  const [authError, setAuthError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [whatsappSentMsg, setWhatsappSentMsg] = useState('');
  const [limsOnline, setLimsOnline] = useState(false);
  const [simulatingLims, setSimulatingLims] = useState(false);
  
  // Patient Experience Feedback State
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Painless Needle', 'On-Time Arrival']);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    LimsBridge.checkHealth().then(online => setLimsOnline(online));
  }, []);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setAuthError('Please enter your Booking ID (e.g. DSD-2401) or 10-digit Phone.');
      return;
    }

    const match = DEMO_BOOKINGS.find(b => 
      b.id.toLowerCase() === term || 
      b.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, ''))
    );

    if (match) {
      setActiveBooking(match);
      setWhatsappSentMsg('');
      return;
    }

    // Dynamic lookup across Universal Adapter (Local DB + LIMS)
    try {
      const universalMatch = await UniversalLims.lookupOrder(term);
      if (universalMatch) {
        setActiveBooking({
          id: universalMatch.id,
          patientName: universalMatch.patientName,
          phone: universalMatch.phone,
          packageName: universalMatch.packageName,
          price: universalMatch.price,
          date: universalMatch.date,
          timeSlot: universalMatch.timeSlot,
          status: universalMatch.status,
          collector: universalMatch.collector,
          barcode: universalMatch.barcode,
          verifiedBy: universalMatch.verifiedBy || (universalMatch.status === 'Report Ready' ? 'Dr. Ananya Verma, MD' : 'Pending Review'),
          parametersSummary: universalMatch.parametersSummary
        });
        setWhatsappSentMsg('');
        return;
      }
    } catch {}

    setAuthError('No active booking found. Try demo: DSD-2401 or DSD-2398');
  };

  const selectDemo = (booking: BookingRecord) => {
    setSearchTerm(booking.id);
    setActiveBooking(booking);
    setAuthError('');
    setWhatsappSentMsg('');
  };

  const handleDownloadReport = () => {
    if (!activeBooking || activeBooking.status !== 'Report Ready') return;

    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      generateAndDownloadNablPdf({
        bookingId: activeBooking.id,
        patientName: activeBooking.patientName,
        ageGender: '52 Yrs / Female',
        phone: activeBooking.phone,
        packageName: activeBooking.packageName,
        barcode: activeBooking.barcode,
        collectionTime: '12-Oct-2026, 08:15 AM',
        reportedTime: '12-Oct-2026, 02:30 PM',
        verifiedBy: activeBooking.verifiedBy || 'Dr. Ananya Verma, MD (Pathology)',
        parameters: [
          { category: 'Hematology', name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', refRange: '12.0 - 15.0', method: 'SLS Hemoglobin Method', status: 'Normal' },
          { category: 'Biochemistry', name: 'Fasting Blood Sugar (FBS)', value: '94', unit: 'mg/dL', refRange: '70 - 99', method: 'Hexokinase Enzymatic', status: 'Normal' },
          { category: 'Biochemistry', name: 'Serum Creatinine (KFT)', value: '0.9', unit: 'mg/dL', refRange: '0.6 - 1.2', method: 'Modified Jaffe Kinetic', status: 'Normal' },
          { category: 'Lipid Profile', name: 'Total Cholesterol', value: '178', unit: 'mg/dL', refRange: '< 200', method: 'CHOD-PAP Enzymatic', status: 'Normal' },
          { category: 'Diabetes Glycemic', name: 'HbA1c Glycated Hemoglobin', value: '5.4', unit: '%', refRange: '< 5.7%', method: 'Automated HPLC Ion-Exchange', status: 'Normal' }
        ]
      });
    }, 400);
  };

  const handleSendWhatsAppAlert = async () => {
    if (!activeBooking) return;
    const res = await WhatsAppCloudGateway.sendPatientAlert({
      toPhoneNumber: activeBooking.phone,
      patientName: activeBooking.patientName,
      bookingId: activeBooking.id,
      type: activeBooking.status === 'Report Ready' ? 'REPORT_READY' : 'PHLEBO_DISPATCHED',
      reportDownloadUrl: `https://dsd.care/portal?ref=${activeBooking.id}`
    });
    setWhatsappSentMsg(`✓ WhatsApp Cloud API sent: ${res.templateUsed} to ${activeBooking.phone}`);
    setTimeout(() => setWhatsappSentMsg(''), 5000);
  };

  const handleFastTrackLimsRelease = async () => {
    if (!activeBooking) return;
    setSimulatingLims(true);
    await LimsBridge.simulateLimsWorkflow(activeBooking.id);
    setActiveBooking({
      ...activeBooking,
      status: 'Report Ready',
      verifiedBy: 'Dr. Ananya Verma, MD (Pathology) · NABL Reg #48192',
      parametersSummary: [
        { name: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', ref: '12.0 - 15.0', status: 'Normal' },
        { name: 'Fasting Blood Sugar', value: '91', unit: 'mg/dL', ref: '70 - 99', status: 'Normal' },
        { name: 'Serum Creatinine', value: '0.88', unit: 'mg/dL', ref: '0.6 - 1.2', status: 'Normal' },
        { name: 'Total Cholesterol', value: '165', unit: 'mg/dL', ref: '< 200', status: 'Normal' },
        { name: 'HbA1c Glycated', value: '5.2', unit: '%', ref: '< 5.7%', status: 'Normal' }
      ]
    });
    setSimulatingLims(false);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    const review = {
      bookingId: activeBooking?.id,
      patientName: activeBooking?.patientName,
      rating,
      tags: selectedTags,
      comments: feedbackComments,
      date: new Date().toISOString()
    };
    try {
      const existing = JSON.parse(localStorage.getItem('dsd_patient_reviews') || '[]');
      localStorage.setItem('dsd_patient_reviews', JSON.stringify([review, ...existing]));
    } catch {}
  };

  const isReportReady = activeBooking?.status === 'Report Ready';

  return (
    <div className="opsOverlay" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl text-slate-100 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">DSD Patient Access & Report Portal</h3>
              <p className="text-xs text-slate-400">Live phlebo telemetry, sample journey & verified NABL report downloads</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border ${
              limsOnline 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Server size={13} className={limsOnline ? 'text-emerald-400' : 'text-slate-500'} />
              <span>GIA LIMS Core (Port 3001): {limsOnline ? 'Online ✓' : 'Connecting…'}</span>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Search Bar / Quick Lookup */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input 
                type="text"
                placeholder="Enter Booking ID (e.g. DSD-2401) or Phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <button 
              type="submit" 
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all"
            >
              Search
            </button>
          </form>

          {/* Quick Demo Switchers */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-500 font-medium">Quick Demo Test:</span>
            <button
              type="button"
              onClick={() => selectDemo(DEMO_BOOKINGS[0])}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors flex items-center gap-1.5 ${
                activeBooking?.id === 'DSD-2401' 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Lock size={12} /> DSD-2401 (Testing / Report Locked)
            </button>

            <button
              type="button"
              onClick={() => selectDemo(DEMO_BOOKINGS[1])}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors flex items-center gap-1.5 ${
                activeBooking?.id === 'DSD-2398' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <CheckCircle2 size={12} /> DSD-2398 (Report Ready / NABL Signed)
            </button>
          </div>

          {authError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" /> {authError}
            </div>
          )}
        </div>

        {/* Active Booking Content */}
        {activeBooking && (
          <div className="p-5 space-y-5">
            {/* Patient Header Badge */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">{activeBooking.patientName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono border border-slate-700">
                    {activeBooking.id}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {activeBooking.packageName} · Slot: <b>{activeBooking.timeSlot}</b>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  activeBooking.status === 'Report Ready' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {activeBooking.status}
                </span>
                <div className="text-xs text-slate-400 mt-1">Paid: ₹{activeBooking.price}</div>
              </div>
            </div>

            {/* 5-Stage Live Sample Journey Timeline */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Sample Telemetry Timeline
              </div>

              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                {/* 1. Order Placed */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/20">
                    <CheckCircle2 size={15} />
                  </div>
                  <span className="text-[11px] font-medium text-emerald-400">Booked</span>
                </div>

                {/* 2. Phlebo Dispatched */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeBooking.status !== 'Confirmed' 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Bike size={15} />
                  </div>
                  <span className={`text-[11px] font-medium ${activeBooking.status !== 'Confirmed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    Dispatched
                  </span>
                </div>

                {/* 3. Sample Collected */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeBooking.status === 'Sample Collected' || activeBooking.status === 'In Lab Analysis' || activeBooking.status === 'Report Ready'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 size={15} />
                  </div>
                  <span className={`text-[11px] font-medium ${
                    activeBooking.status === 'Sample Collected' || activeBooking.status === 'In Lab Analysis' || activeBooking.status === 'Report Ready'
                      ? 'text-emerald-400' 
                      : 'text-slate-500'
                  }`}>
                    Collected
                  </span>
                </div>

                {/* 4. In Lab Analysis */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeBooking.status === 'In Lab Analysis'
                      ? 'bg-sky-500 text-slate-950 animate-pulse shadow-md shadow-sky-500/20'
                      : activeBooking.status === 'Report Ready'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Activity size={15} />
                  </div>
                  <span className={`text-[11px] font-medium ${
                    activeBooking.status === 'In Lab Analysis' 
                      ? 'text-sky-400 font-bold' 
                      : activeBooking.status === 'Report Ready' 
                      ? 'text-emerald-400' 
                      : 'text-slate-500'
                  }`}>
                    Testing
                  </span>
                </div>

                {/* 5. Report Ready */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeBooking.status === 'Report Ready'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <FileText size={15} />
                  </div>
                  <span className={`text-[11px] font-medium ${activeBooking.status === 'Report Ready' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Phlebo Telemetry & Live Tracking Link */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Bike size={18} className="text-sky-400 shrink-0" />
                <div>
                  <div className="text-white font-medium">Phlebotomist: {activeBooking.collector}</div>
                  <div className="text-slate-400">Cold Chain Box: 3.8°C Verified · Barcode: <span className="font-mono text-slate-300">{activeBooking.barcode}</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLiveTracking(activeBooking.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Bike size={14} /> Track 3D GPS
              </button>
            </div>

            {/* Parameter Preview (If Report Ready) */}
            {isReportReady && activeBooking.parametersSummary && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Verified Clinical Scorecard
                  </div>
                  <span className="text-xs text-slate-400">MD Pathologist Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeBooking.parametersSummary.map((param, pIdx) => (
                    <div key={pIdx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-200">{param.name}</div>
                        <div className="text-[10px] text-slate-500">Normal: {param.ref}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">{param.value} {param.unit}</div>
                        <span className="text-[10px] text-emerald-400 font-semibold">{param.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STRICT REPORT DOWNLOAD SECTION & LOCK POLICY */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              {isReportReady ? (
                <div className="space-y-3">
                  <div className="text-xs text-emerald-400 flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> NABL ISO-15189 Verified & Signed by Dr. Ananya Verma (MD)
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-sky-400 font-mono">
                      <QrCode size={13} /> QR Verified
                    </span>
                  </div>

                  {/* 2026 TRENDING AI SMART REPORT (INTERACTIVE & BILINGUAL) */}
                  <button 
                    type="button" 
                    onClick={() => {
                      onClose();
                      onOpenSmartAiReport?.(activeBooking.id);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    <Sparkles size={18} className="text-slate-950" />
                    ⚡ View 2026 AI Smart Report (Interactive · Bilingual · Audio)
                  </button>

                  <button 
                    type="button" 
                    onClick={handleDownloadReport}
                    disabled={isDownloading}
                    className="w-full py-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Download size={16} />
                    {isDownloading ? 'Rendering NABL ISO-15189 Vector PDF...' : 'Download Official Standard NABL Lab PDF'}
                  </button>

                  {/* Automated WhatsApp Cloud API Dispatch */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSendWhatsAppAlert}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send size={13} /> Trigger WhatsApp Cloud API Alert
                    </button>
                    <a
                      href={WhatsAppCloudGateway.getPatientDirectWhatsAppUrl(activeBooking.id, activeBooking.patientName)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      WhatsApp PDF Link <ExternalLink size={12} />
                    </a>
                  </div>

                  {whatsappSentMsg && (
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono animate-in fade-in">
                      {whatsappSentMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs space-y-1.5">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Lock size={15} /> Report Download Locked (Clinical Verification Required)
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Sample is currently undergoing multi-stage automated testing on Beckman Coulter analyzers. As per NABL accreditation rules, diagnostic reports cannot be downloaded until dual MD Pathologist verification is complete.
                    </p>
                    <div className="text-slate-400 pt-1">
                      Estimated Release: <b className="text-white">{activeBooking.estimatedDelivery || 'Today by 07:00 PM'}</b>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    disabled={true}
                    className="w-full py-3 rounded-xl bg-slate-800/80 text-slate-500 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-slate-700/50"
                  >
                    <Lock size={16} /> Official PDF Locked (Pending Pathologist Sign-off)
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      onClose();
                      onOpenSmartAiReport?.(activeBooking.id);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles size={14} className="text-cyan-400" />
                    ⚡ Preview 2026 AI Smart Report (Interactive · Bilingual · Audio)
                  </button>

                  <button 
                    type="button" 
                    onClick={handleFastTrackLimsRelease}
                    disabled={simulatingLims}
                    className="w-full py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} className="text-purple-400" />
                    {simulatingLims ? 'Validating on Analyzer & MD Signing in LIMS...' : 'Simulate MD Pathologist Sign-Off in LIMS (Unlock Report)'}
                  </button>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-900">
                <span>Direct WhatsApp Helpdesk:</span>
                <a 
                  href={`https://wa.me/919258888085?text=Hello+Dr.+Shastri+Diagnostics,+I+need+status+of+booking+${activeBooking.id}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  +91 92588 88085 <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* PATIENT PHLEBOTOMIST & SAMPLE COLLECTION FEEDBACK */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  Rate Your Home Collection Experience
                </div>
                {feedbackSubmitted && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Feedback Saved
                  </span>
                )}
              </div>

              {!feedbackSubmitted ? (
                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 transition-transform hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-slate-600'}`}
                        >
                          <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-300 ml-2">{rating} / 5 Stars</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['Painless Needle', 'On-Time Arrival', 'Sealed Sterile Vials', 'Polite Phlebotomist', 'Quick 5-Min Sample'].map(tag => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedTags(selected ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag]);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                            selected 
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {selected ? '✓ ' : ''}{tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackComments}
                      onChange={e => setFeedbackComments(e.target.value)}
                      placeholder="Remarks for Phlebo (e.g. Rahul was punctual and courteous)..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shrink-0"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Thank you for rating {activeBooking.collector}!</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Rating: {rating} ★ · Tags: {selectedTags.join(', ')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackSubmitted(false)}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PatientPortalModal;
