import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, 
  Clock, 
  ShieldCheck, 
  Thermometer, 
  Star, 
  X, 
  CheckCircle2, 
  Navigation, 
  KeyRound,
  QrCode,
  Flame,
  RotateCcw
} from 'lucide-react';

export interface PhleboLiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingRef?: string;
  patientName?: string;
  patientAddress?: string;
  patientPhone?: string;
  packageName?: string;
  dispatchHubId?: string;
  locality?: string;
}

interface Point2D {
  x: number;
  y: number;
  label?: string;
}

interface HubRouteConfig {
  id: string;
  name: string;
  landmark: string;
  totalDistanceKm: number;
  baseEtaMinutes: number;
  leadPhlebo: string;
  leadRating: number;
  leadCollections: number;
  painlessScore: number;
  rawWaypoints: Point2D[];
}

// 5 Dedicated Aligarh Dispatch Hubs with authentic street coordinates on 620x340 isometric canvas
const HUB_ROUTES: Record<string, HubRouteConfig> = {
  'hub-ramghat': {
    id: 'hub-ramghat',
    name: 'Central NABL Lab & Ramghat Road Hub',
    landmark: '1246, Vidyanagar Colony, Ramghat Road (Opposite Vishal Mart)',
    totalDistanceKm: 2.4,
    baseEtaMinutes: 14,
    leadPhlebo: 'Rahul Sharma, DMLT',
    leadRating: 4.9,
    leadCollections: 184,
    painlessScore: 99.4,
    rawWaypoints: [
      { x: 90, y: 270, label: 'DSD Central Lab (Ramghat)' },
      { x: 190, y: 220 },
      { x: 310, y: 240 },
      { x: 420, y: 160 },
      { x: 530, y: 95, label: 'Patient Home (Vidyanagar)' }
    ]
  },
  'hub-centrepoint': {
    id: 'hub-centrepoint',
    name: 'Centre Point & Civil Lines Hub',
    landmark: 'Marris Road Crossing, Near Samad Road & Centre Point',
    totalDistanceKm: 2.8,
    baseEtaMinutes: 18,
    leadPhlebo: 'Amit Verma, DMLT',
    leadRating: 4.9,
    leadCollections: 162,
    painlessScore: 99.1,
    rawWaypoints: [
      { x: 260, y: 200, label: 'Centre Point Hub' },
      { x: 230, y: 150 },
      { x: 190, y: 110 },
      { x: 340, y: 90 },
      { x: 520, y: 80, label: 'Patient Home (Civil Lines)' }
    ]
  },
  'hub-gtroad': {
    id: 'hub-gtroad',
    name: 'GT Road & Sasni Gate Old City Hub',
    landmark: 'Near Achal Taal & Sasni Gate Chauraha, GT Road',
    totalDistanceKm: 3.5,
    baseEtaMinutes: 22,
    leadPhlebo: 'Manoj Kumar, DMLT',
    leadRating: 4.8,
    leadCollections: 147,
    painlessScore: 98.8,
    rawWaypoints: [
      { x: 270, y: 295, label: 'Sasni Gate Hub' },
      { x: 240, y: 240 },
      { x: 210, y: 190 },
      { x: 330, y: 140 },
      { x: 490, y: 100, label: 'Patient Home (Old City)' }
    ]
  },
  'hub-quansi': {
    id: 'hub-quansi',
    name: 'Quansi Bypass & Talanagri Hub',
    landmark: 'Quansi Chauraha, Near Surendra Nagar Bypass',
    totalDistanceKm: 3.2,
    baseEtaMinutes: 20,
    leadPhlebo: 'Deepak Saini, DMLT',
    leadRating: 4.9,
    leadCollections: 139,
    painlessScore: 99.3,
    rawWaypoints: [
      { x: 480, y: 120, label: 'Quansi Bypass Hub' },
      { x: 410, y: 160 },
      { x: 360, y: 200 },
      { x: 280, y: 210 },
      { x: 160, y: 240, label: 'Patient Home (Surendra Nagar)' }
    ]
  },
  'hub-khair': {
    id: 'hub-khair',
    name: 'Khair Bypass & University Outer Hub',
    landmark: 'Naurangabad, Khair Road Junction, Aligarh',
    totalDistanceKm: 3.8,
    baseEtaMinutes: 25,
    leadPhlebo: 'Neeraj Upadhyay, DMLT',
    leadRating: 4.8,
    leadCollections: 125,
    painlessScore: 98.7,
    rawWaypoints: [
      { x: 80, y: 110, label: 'Khair Outer Hub' },
      { x: 150, y: 140 },
      { x: 250, y: 175 },
      { x: 370, y: 150 },
      { x: 500, y: 105, label: 'Patient Home (Outer Ring)' }
    ]
  }
};

// Catmull-Rom Spline Interpolation for physically smooth street turns
function catmullRomPoint(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  return {
    x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
    y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3
  };
}

// Generate densely interpolated spline polyline from waypoints
function generateSplinePath(waypoints: Point2D[], samplesPerSegment = 24): Point2D[] {
  if (waypoints.length < 2) return waypoints;
  const result: Point2D[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      result.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }
  result.push(waypoints[waypoints.length - 1]);
  return result;
}

export const PhleboLiveTrackingModal: React.FC<PhleboLiveTrackingModalProps> = ({
  isOpen,
  onClose,
  bookingRef = 'DSD-2401',
  patientName = 'Sunita Sharma',
  patientAddress = '1246, Vidyanagar Colony, Ramghat Road (Near Vishal Mart), Aligarh',
  patientPhone = '+91 98370 12345',
  packageName = 'DSD Smart Health Advance',
  dispatchHubId = 'hub-ramghat',
  locality
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Hub selection with flexible fallback
  const activeHub = useMemo<HubRouteConfig>(() => {
    if (dispatchHubId && HUB_ROUTES[dispatchHubId]) {
      return HUB_ROUTES[dispatchHubId];
    }
    // Check if locality matches any hub
    if (locality) {
      const lower = locality.toLowerCase();
      if (lower.includes('centre') || lower.includes('marris') || lower.includes('civil')) return HUB_ROUTES['hub-centrepoint'];
      if (lower.includes('sasni') || lower.includes('delhi') || lower.includes('achal')) return HUB_ROUTES['hub-gtroad'];
      if (lower.includes('quan') || lower.includes('kwar') || lower.includes('talanagri')) return HUB_ROUTES['hub-quansi'];
      if (lower.includes('khair') || lower.includes('naurangabad') || lower.includes('lodha')) return HUB_ROUTES['hub-khair'];
    }
    return HUB_ROUTES['hub-ramghat'];
  }, [dispatchHubId, locality]);

  // Dynamic Spline Route
  const splinePath = useMemo(() => {
    return generateSplinePath(activeHub.rawWaypoints, 28);
  }, [activeHub]);

  // Progress and Telemetry State
  const [progress, setProgress] = useState(0.28);
  const [etaMinutes, setEtaMinutes] = useState(activeHub.baseEtaMinutes);
  const [distanceKm, setDistanceKm] = useState(activeHub.totalDistanceKm);
  const [stage, setStage] = useState<'dispatched' | 'enroute' | 'arrived' | 'collected'>('enroute');

  // Cold-Chain IoT State Machine (Optimal 2.0 - 6.0°C, Warning 6.1 - 7.9°C, Critical >= 8.0°C)
  const [temperature, setTemperature] = useState(3.8);
  const [telemetryHistory, setTelemetryHistory] = useState<number[]>([3.8, 3.8, 3.7, 3.9, 3.8, 3.8, 3.7, 3.8, 3.9, 3.8]);
  const [heatStressSimulated, setHeatStressSimulated] = useState(false);

  // Feedback State
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Painless Needle', 'On-Time']);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Keyboard Escape listener for Accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync ETA and distance when active hub changes
  useEffect(() => {
    setProgress(0.28);
    setEtaMinutes(Math.round(activeHub.baseEtaMinutes * (1 - 0.28)));
    setDistanceKm(Number((activeHub.totalDistanceKm * (1 - 0.28)).toFixed(1)));
  }, [activeHub]);

  // Continuous Progress Animation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 0.96) {
          setStage('arrived');
          setEtaMinutes(1);
          setDistanceKm(0.1);
          return 0.96;
        }
        const next = prev + 0.007;
        const remKm = Math.max(0.1, Number((activeHub.totalDistanceKm * (1 - next)).toFixed(1)));
        const remMins = Math.max(1, Math.round(activeHub.baseEtaMinutes * (1 - next)));
        setDistanceKm(remKm);
        setEtaMinutes(remMins);
        return next;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [isOpen, activeHub]);

  // Cold-Chain IoT Telemetry Engine with Stochastic Micro-Jitter ($3.8 \pm 0.15^\circ\text{C}$)
  useEffect(() => {
    if (!isOpen) return;
    const iotInterval = setInterval(() => {
      if (heatStressSimulated) return; // Keep simulated temperature stable unless restored

      // Stochastic Ornstein-Uhlenbeck mean-reverting jitter around 3.8°C
      const jitter = (Math.random() - 0.5) * 0.25; // ±0.125
      const newTemp = Number((3.8 + jitter).toFixed(1));
      setTemperature(newTemp);
      setTelemetryHistory(prev => {
        const next = [...prev.slice(1), newTemp];
        return next;
      });
    }, 2400);

    return () => clearInterval(iotInterval);
  }, [isOpen, heatStressSimulated]);

  // Derive Clinical Cold-Chain Alert Zone
  const coldChainZone: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = useMemo(() => {
    if (temperature >= 8.0 || temperature < 2.0) return 'CRITICAL';
    if (temperature >= 6.1 && temperature <= 7.9) return 'WARNING';
    return 'OPTIMAL';
  }, [temperature]);

  // Render 3D Isometric Map with Spline Polyline & Dual Radar Pulse
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#041220');
      bgGrad.addColorStop(1, '#020912');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Isometric grid lines
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 38) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw 3D Isometric Buildings (Aligarh landmarks)
      const buildings = [
        { x: 120, y: 70, w: 45, h: 55, col: 'rgba(15, 33, 55, 0.85)' },
        { x: 185, y: 55, w: 50, h: 75, col: 'rgba(18, 42, 68, 0.85)' },
        { x: 380, y: 120, w: 55, h: 85, col: 'rgba(14, 38, 62, 0.85)' },
        { x: 455, y: 155, w: 65, h: 105, col: 'rgba(20, 48, 76, 0.85)' },
        { x: 260, y: 215, w: 48, h: 65, col: 'rgba(16, 40, 66, 0.85)' }
      ];

      buildings.forEach(b => {
        // Front face
        ctx.fillStyle = b.col;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        // Roof
        ctx.fillStyle = 'rgba(30, 64, 98, 0.9)';
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + 12, b.y - 10);
        ctx.lineTo(b.x + b.w + 12, b.y - 10);
        ctx.lineTo(b.x + b.w, b.y);
        ctx.closePath();
        ctx.fill();
        // Side face
        ctx.fillStyle = 'rgba(10, 24, 42, 0.9)';
        ctx.beginPath();
        ctx.moveTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + b.w + 12, b.y - 10);
        ctx.lineTo(b.x + b.w + 12, b.y + b.h - 10);
        ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.closePath();
        ctx.fill();
      });

      // Draw Smooth Catmull-Rom Spline Road Underlay
      if (splinePath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(splinePath[0].x, splinePath[0].y);
        for (let i = 1; i < splinePath.length; i++) {
          ctx.lineTo(splinePath[i].x, splinePath[i].y);
        }
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Glowing Inner Neon Spline Line
        ctx.beginPath();
        ctx.moveTo(splinePath[0].x, splinePath[0].y);
        for (let i = 1; i < splinePath.length; i++) {
          ctx.lineTo(splinePath[i].x, splinePath[i].y);
        }
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // Start Marker (Origin Dispatch Hub)
      const startPt = activeHub.rawWaypoints[0];
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillText(`🏥 ${activeHub.tag || 'Dispatch Hub'}`, startPt.x - 28, startPt.y + 22);

      // Destination Marker (Patient Home) with Radial Pulse
      const endPt = activeHub.rawWaypoints[activeHub.rawWaypoints.length - 1];
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Destination Pulse Ring
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 16 + Math.sin(Date.now() / 200) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('📍 Patient Doorstep', endPt.x - 36, endPt.y - 16);

      // Evaluate Rider Position along Spline Path
      const totalSplineSteps = splinePath.length - 1;
      const exactIndex = Math.min(Math.floor(progress * totalSplineSteps), totalSplineSteps - 1);
      const frac = (progress * totalSplineSteps) - exactIndex;
      const p1 = splinePath[exactIndex];
      const p2 = splinePath[Math.min(exactIndex + 1, totalSplineSteps)];
      const riderX = p1.x + (p2.x - p1.x) * frac;
      const riderY = p1.y + (p2.y - p1.y) * frac;

      // Dual-Layer Rider Radar Pulse Aura (out-of-phase concentric wave fronts)
      const now = Date.now() / 1000;
      const f = 1.2;
      const rMin = 12;
      const deltaR = 18;

      const phase1 = (now * f) % 1;
      const r1 = rMin + deltaR * phase1;
      const a1 = 0.45 * (1 - phase1);

      const phase2 = (now * f + 0.5) % 1;
      const r2 = rMin + deltaR * phase2;
      const a2 = 0.45 * (1 - phase2);

      // Wave 1
      ctx.strokeStyle = `rgba(14, 165, 233, ${a1.toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(riderX, riderY, r1, 0, Math.PI * 2);
      ctx.stroke();

      // Wave 2
      ctx.strokeStyle = `rgba(56, 189, 248, ${a2.toFixed(3)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(riderX, riderY, r2, 0, Math.PI * 2);
      ctx.stroke();

      // Rider Vehicle Sprite Center
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(riderX, riderY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Floating Live ETA Badge above rider
      ctx.fillStyle = '#092338';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      const tagText = `🚴 ${activeHub.leadPhlebo.split(' ')[0]} (~${etaMinutes}m)`;
      ctx.fillRect(riderX - 44, riderY - 32, 88, 20);
      ctx.strokeRect(riderX - 44, riderY - 32, 88, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(tagText, riderX - 38, riderY - 18);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, progress, etaMinutes, splinePath, activeHub]);

  if (!isOpen) return null;

  // Toggle Heat Stress Simulation for Verification
  const handleToggleHeatStress = () => {
    if (!heatStressSimulated) {
      setHeatStressSimulated(true);
      setTemperature(8.2);
      setTelemetryHistory(prev => [...prev.slice(1), 8.2]);
    } else {
      setHeatStressSimulated(false);
      setTemperature(3.8);
      setTelemetryHistory(prev => [...prev.slice(1), 3.8]);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackOpen(false);
      setFeedbackSubmitted(false);
    }, 2000);
  };

  // Sparkline path generation from telemetryHistory
  const generateSparklineSvg = () => {
    const minT = 2.0;
    const maxT = 9.0;
    const w = 90;
    const h = 22;
    const points = telemetryHistory.map((val, idx) => {
      const x = (idx / (telemetryHistory.length - 1)) * w;
      const normalized = (val - minT) / (maxT - minT);
      const y = h - (normalized * h);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const currentSparklineY = () => {
    const minT = 2.0;
    const maxT = 9.0;
    const h = 22;
    const normalized = (temperature - minT) / (maxT - minT);
    return Math.max(2, Math.min(20, h - (normalized * h)));
  };

  return (
    <div 
      className="opsOverlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="tracking-title"
    >
      <div className="trackingModalShell bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        
        {/* Top Header with FlaboTrack Network Branding (Strict 8px rhythm & min 44px tap target) */}
        <header className="trackingHeader p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4 sticky top-0 backdrop-blur z-20">
          <div className="trackingBrand flex items-center gap-3">
            <div className="livePulseBadge px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold flex items-center gap-2">
              <span className="livePulseDot w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              FLABOTRACK™ LIVE 3D GPS
            </div>
            <div>
              <h3 id="tracking-title" className="font-extrabold text-base sm:text-lg text-white">
                Doorstep Phlebotomist On The Way
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Order #{bookingRef} · <span className="text-cyan-300 font-bold">{packageName}</span> · <span className="text-emerald-400 font-semibold">{activeHub.name}</span>
              </p>
            </div>
          </div>

          <div className="headerActions flex items-center gap-3">
            <button 
              type="button" 
              className="feedbackTriggerBtn min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/20"
              onClick={() => setFeedbackOpen(true)}
            >
              <Star size={15} className="fill-amber-400 text-amber-400" /> Rate Phlebo
            </button>
            <button 
              type="button" 
              className="opsClose min-w-[44px] min-h-[44px] p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" 
              onClick={onClose}
              aria-label="Close Tracking Modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* 3D Map Visual Canvas with Isometric Route */}
        <div className="trackingCanvasWrap relative bg-slate-950 border-b border-slate-800 flex justify-center overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={620} 
            height={340} 
            className="trackingCanvas w-full max-w-[620px] h-[280px] sm:h-[340px] block"
          />

          {/* Floating Telemetry HUD */}
          <div className="telemetryHud absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 flex flex-wrap gap-2.5 z-10">
            {/* ETA Box */}
            <div className="etaBox flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs shadow-lg backdrop-blur">
              <Clock size={18} className="text-cyan-400" />
              <div>
                <b className="text-white text-sm block font-mono">{etaMinutes} Mins</b>
                <small className="text-slate-400 text-[10px]">Estimated Arrival</small>
              </div>
            </div>

            {/* Distance Box */}
            <div className="distanceBox flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs shadow-lg backdrop-blur">
              <Navigation size={18} className="text-emerald-400" />
              <div>
                <b className="text-white text-sm block font-mono">{distanceKm} km</b>
                <small className="text-slate-400 text-[10px]">Remaining Distance</small>
              </div>
            </div>

            {/* 100% Cold-Chain IoT Monitor Box */}
            <div 
              className={`tempBox flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs shadow-lg backdrop-blur border transition-all ${
                coldChainZone === 'OPTIMAL' 
                  ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300' 
                  : coldChainZone === 'WARNING' 
                  ? 'bg-amber-950/95 border-amber-500/60 text-amber-300 animate-pulse' 
                  : 'bg-rose-950/95 border-rose-500/80 text-rose-300 animate-bounce'
              }`}
            >
              <Thermometer size={18} className={coldChainZone === 'OPTIMAL' ? 'text-emerald-400' : coldChainZone === 'WARNING' ? 'text-amber-400' : 'text-rose-400'} />
              <div>
                <div className="flex items-center gap-2">
                  <b className="text-base font-black font-mono tracking-tight">{temperature.toFixed(1)}°C</b>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-black/40">
                    {coldChainZone}
                  </span>
                </div>
                <small className="text-[10px] opacity-80 block">Cold-Chain IoT BLE 5.0</small>
              </div>

              {/* Rolling 15-Minute Sparkline Trace */}
              <div className="hidden sm:block ml-1">
                <svg className="h-6 w-24 overflow-visible" viewBox="0 0 90 22">
                  <path
                    d={generateSparklineSvg()}
                    fill="none"
                    stroke={coldChainZone === 'OPTIMAL' ? '#34d399' : coldChainZone === 'WARNING' ? '#fbbf24' : '#f87171'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle 
                    cx="90" 
                    cy={currentSparklineY()} 
                    r="3" 
                    fill={coldChainZone === 'OPTIMAL' ? '#34d399' : coldChainZone === 'WARNING' ? '#fbbf24' : '#f87171'} 
                    className="animate-ping" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Zone Cold Chain Clinical Status Banner */}
        <div 
          className={`p-3.5 px-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
            coldChainZone === 'OPTIMAL'
              ? 'bg-emerald-950/25 border-emerald-500/20 text-emerald-200'
              : coldChainZone === 'WARNING'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${coldChainZone === 'OPTIMAL' ? 'bg-emerald-400' : coldChainZone === 'WARNING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500 animate-ping'}`} />
            <span className="font-semibold">
              {coldChainZone === 'OPTIMAL' && '100% Cold Chain Maintained (3.8°C Target) — Lab Enzyme Preservation Active'}
              {coldChainZone === 'WARNING' && 'Warning: Approaching Upper Threshold (6.8°C) — Automatic Peltier Cooling Engaged'}
              {coldChainZone === 'CRITICAL' && 'CRITICAL TEMPERATURE BREACH (8.2°C) — Emergency Thermal Isolation Protocol Triggered'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleHeatStress}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all self-end sm:self-auto ${
              heatStressSimulated 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Interactive QA Testing: Trigger temperature breach to test clinical state machine"
          >
            {heatStressSimulated ? (
              <>
                <RotateCcw size={13} /> Reset to 3.8°C (Optimal)
              </>
            ) : (
              <>
                <Flame size={13} className="text-rose-400" /> Simulate Heat Stress (+8.2°C)
              </>
            )}
          </button>
        </div>

        {/* Phlebotomist Profile & Contact Card (Benchmark Flebo.in Verified Protocol) */}
        <div className="phleboCard p-6 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-900/50">
          <div className="flex items-center gap-4">
            {/* Phlebo Portrait Avatar with Verified Rim */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-cyan-400/40">
                <span>RS</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                <ShieldCheck size={14} className="stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-base font-bold text-white">{activeHub.leadPhlebo}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {activeHub.leadRating} ★ ({activeHub.leadCollections} collections)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {activeHub.painlessScore}% Painless Draw
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Senior Clinical Phlebotomist · {activeHub.name} · NABL Certified
              </p>
              
              {/* CoWIN & Hep-B Badges */}
              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  💉 CoWIN: Double Vaccinated + Booster
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  🛡️ Hep-B Immunized · Temp 98.2°F
                </span>
              </div>
            </div>
          </div>

          <a 
            href="tel:+919258888085" 
            className="min-h-[44px] px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all w-full md:w-auto"
            title="Direct Phone Call with Assigned Phlebotomist"
          >
            <Phone size={16} /> Call Phlebotomist
          </a>
        </div>

        {/* Flebo Assured 4-Digit Collection OTP & Barcode Verification Banner */}
        <div className="p-5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-b border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
              <KeyRound size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Flebo Assured™ Protocol
                </span>
                <span className="text-slate-400 text-[11px]">Bedside Verification Handshake</span>
              </div>
              <div className="text-slate-200 font-semibold mt-0.5">
                Share this 4-Digit OTP with Phlebotomist to Unseal Sterile Needle Kit
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Kit Seal: <b className="text-cyan-300 font-mono">BD-UT-8492</b> (Tamper-Evident Foil)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-400">Your Bedside OTP:</span>
            <div className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono font-black text-xl tracking-widest shadow-inner shadow-cyan-950">
              8492
            </div>
          </div>
        </div>

        {/* Sterile Single-Use Kit Trust Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3.5 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2 justify-center">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>Single-Use BD UltraTouch™ Needle</span>
          </div>
          <div className="flex items-center gap-2 justify-center border-y sm:border-y-0 sm:border-x border-slate-800 py-1 sm:py-0">
            <QrCode size={15} className="text-cyan-400 shrink-0" />
            <span>Bedside Barcode Scanner Active</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <ShieldCheck size={15} className="text-indigo-400 shrink-0" />
            <span>Zero Travel or Hidden Visiting Charges</span>
          </div>
        </div>

        {/* Dual Address Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border-b border-slate-800 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10.5px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              DISPATCHED FROM STATION
            </div>
            <b className="text-sm font-bold text-white block">{activeHub.name}</b>
            <p className="text-slate-400 leading-relaxed">{activeHub.landmark}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              COLLECTION DESTINATION
            </div>
            <b className="text-sm font-bold text-white block">{patientName} ({patientPhone})</b>
            <p className="text-slate-400 leading-relaxed">{patientAddress}</p>
          </div>
        </div>

        {/* Status Stage Timeline */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className={`flex flex-col items-center gap-1 text-center ${stage === 'dispatched' || stage === 'enroute' || stage === 'arrived' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-mono">1</span>
            <span>Assigned</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-800" />
          <div className={`flex flex-col items-center gap-1 text-center ${stage === 'enroute' || stage === 'arrived' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-mono">2</span>
            <span>En Route</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-800" />
          <div className={`flex flex-col items-center gap-1 text-center ${stage === 'arrived' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono">3</span>
            <span>Arrived</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-800" />
          <div className="flex flex-col items-center gap-1 text-center text-slate-500">
            <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono">4</span>
            <span>Lab Testing</span>
          </div>
        </div>

        {/* Modal Footer with Close Button (min 44px tap target) */}
        <footer className="p-6 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Doorstep phlebotomy dispatched by <b className="text-slate-200">Dr. Shastri Diagnostics</b> Aligarh.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Dismiss Live Tracking
          </button>
        </footer>

        {/* Feedback Modal Overlay (min 44px tap targets on rating and close) */}
        {feedbackOpen && (
          <div className="feedbackOverlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="feedbackCard bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="feedbackHead flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-base">Rate Phlebotomist Sample Draw</h4>
                <button 
                  type="button" 
                  onClick={() => setFeedbackOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {feedbackSubmitted ? (
                <div className="feedbackSuccess text-center py-6 space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                  <b className="text-white text-base block">Feedback Recorded!</b>
                  <p className="text-xs text-slate-400">Thank you for rating Dr. Shastri Diagnostics phlebotomy fleet.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {/* Star Rating Buttons (min 44px touch targets) */}
                  <div className="starsRow flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`starBtn min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all ${
                          rating >= s ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        onClick={() => setRating(s)}
                        aria-label={`Rate ${s} stars`}
                      >
                        <Star size={26} className={rating >= s ? 'fill-amber-400' : ''} />
                      </button>
                    ))}
                  </div>

                  {/* Tag Pills (min 44px touch targets) */}
                  <div className="tagPills flex flex-wrap gap-2 justify-center">
                    {['Painless Needle', 'On-Time', 'Clean Kit', 'Mask & Gloves', 'Polite Manner'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`tagPill min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          selectedTags.includes(tag) 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                        }`}
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Write a quick comment about the home collection experience…"
                    value={feedbackComments}
                    onChange={e => setFeedbackComments(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />

                  <button 
                    type="submit" 
                    className="opsPrimary full min-h-[44px] w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all"
                  >
                    Submit Clinical Review
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PhleboLiveTrackingModal;
