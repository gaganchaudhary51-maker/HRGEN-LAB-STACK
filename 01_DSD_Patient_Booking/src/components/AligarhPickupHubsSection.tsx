import React, { useState } from 'react';
import {
  MapPin,
  Bike,
  ShieldCheck,
  ThermometerSnowflake,
  Navigation,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export interface AligarhHub {
  id: string;
  name: string;
  landmark: string;
  coverageAreas: string[];
  avgArrivalMins: number;
  activePhlebos: number;
  leadPhlebo: string;
  leadPhone: string;
  coldChainTemp: string;
  tag: string;
}

export const ALIGARH_HUBS: AligarhHub[] = [
  {
    id: 'hub-ramghat',
    name: 'Central NABL Lab & Ramghat Road Hub',
    landmark: '1246, Vidyanagar Colony, Near Kishanpur Tiraha (Opposite Vishal Mart)',
    coverageAreas: ['Ramghat Road', 'Vidyanagar', 'Kishanpur', 'Swarna Jayanti Nagar', 'Medical College Road', 'ITI Road', 'Vishnupuri'],
    avgArrivalMins: 18,
    activePhlebos: 4,
    leadPhlebo: 'Rahul Sharma (Senior NABL Collector)',
    leadPhone: '+91 92588 88085',
    coldChainTemp: '3.6°C',
    tag: 'Primary Processing Hub'
  },
  {
    id: 'hub-centrepoint',
    name: 'Centre Point & Civil Lines Hub',
    landmark: 'Marris Road Crossing, Near Samad Road & Centre Point Market',
    coverageAreas: ['Centre Point', 'Marris Road', 'Civil Lines', 'AMU Circle', 'Dodhpur', 'Sir Syed Nagar', 'Jamalpur', 'Samad Road'],
    avgArrivalMins: 22,
    activePhlebos: 3,
    leadPhlebo: 'Amit Verma (BD Certified)',
    leadPhone: '+91 92588 88085',
    coldChainTemp: '3.8°C',
    tag: 'Commercial & Campus Express'
  },
  {
    id: 'hub-gtroad',
    name: 'GT Road & Sasni Gate Old City Hub',
    landmark: 'Near Achal Taal & Sasni Gate Chauraha, Aligarh',
    coverageAreas: ['Sasni Gate', 'Delhi Gate', 'Achal Taal', 'Sarai Hakim', 'Subhash Chowk', 'Hathras Road', 'Railway Station Area'],
    avgArrivalMins: 28,
    activePhlebos: 3,
    leadPhlebo: 'Manoj Kumar (Sterile Kit Lead)',
    leadPhone: '+91 92588 88085',
    coldChainTemp: '3.7°C',
    tag: 'Old City Rapid Transit'
  },
  {
    id: 'hub-quansi',
    name: 'Quansi Bypass & Talanagri Hub',
    landmark: 'Quansi Chauraha, Near Surendra Nagar Bypass',
    coverageAreas: ['Quansi', 'Surendra Nagar', 'Gandhi Eye Hospital', 'Talanagri Industrial Sector', 'Sarsol', 'GT Road Bypass'],
    avgArrivalMins: 25,
    activePhlebos: 2,
    leadPhlebo: 'Deepak Saini (Industrial Fleet)',
    leadPhone: '+91 92588 88085',
    coldChainTemp: '3.9°C',
    tag: 'Industrial & Bypass Wing'
  },
  {
    id: 'hub-khair',
    name: 'Khair Bypass & University Outer Hub',
    landmark: 'Naurangabad, Khair Road Junction, Aligarh',
    coverageAreas: ['Khair Road', 'Naurangabad', 'Lodha', 'University Outer Ring', 'Satha', 'Chharra Adda Bypass'],
    avgArrivalMins: 32,
    activePhlebos: 2,
    leadPhlebo: 'Neeraj Upadhyay (Outer Zone Specialist)',
    leadPhone: '+91 92588 88085',
    coldChainTemp: '3.8°C',
    tag: 'Outer District Connector'
  }
];

interface AligarhPickupHubsSectionProps {
  onSelectHubForBooking: (hub: AligarhHub) => void;
  onOpenLiveTracking: () => void;
}

export const AligarhPickupHubsSection: React.FC<AligarhPickupHubsSectionProps> = ({
  onSelectHubForBooking,
  onOpenLiveTracking
}) => {
  const [selectedHub, setSelectedHub] = useState<AligarhHub>(ALIGARH_HUBS[0]);
  const [searchArea, setSearchArea] = useState('');

  const filteredHubs = ALIGARH_HUBS.filter(hub => {
    if (!searchArea.trim()) return true;
    const q = searchArea.toLowerCase();
    return (
      hub.name.toLowerCase().includes(q) ||
      hub.landmark.toLowerCase().includes(q) ||
      hub.coverageAreas.some(area => area.toLowerCase().includes(q))
    );
  });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section className="aligarhHubsSection py-16 px-4 sm:px-6 max-w-7xl mx-auto" id="aligarh-hubs">
      
      {/* SECTION HEADER LOCKED TO 8PX GRID */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200">
            <Bike size={14} className="text-pink-600 animate-bounce" />
            <span>Aligarh District Doorstep Fleet · 60-Min SLA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Local Phlebotomy Dispatch Hubs in Aligarh
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Dr. Shastri Diagnostics operates 5 dedicated temperature-controlled phlebotomy dispatch stations across Aligarh. Samples are drawn with vacuum vacutainers and couriered to our Ramghat Central NABL Lab at continuous 3.8°C.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenLiveTracking}
            className="min-h-[44px] px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-pink-500 text-pink-600 font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-pink-500/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <Navigation size={16} className="text-pink-600" />
            Launch Live 3D Phlebo Map
          </button>
        </div>
      </div>

      {/* QUICK LOCALITY SEARCH BAR */}
      <div className="mb-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full text-xs text-slate-700">
          <MapPin size={18} className="text-emerald-600 shrink-0" />
          <input
            type="text"
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            placeholder="Type your Aligarh locality (e.g. Ramghat Road, Centre Point, Civil Lines, Sasni Gate, Quansi, AMU)…"
            className="w-full bg-transparent border-none outline-none text-slate-900 text-sm placeholder:text-slate-400"
          />
        </div>
        {searchArea && (
          <button
            type="button"
            onClick={() => setSearchArea('')}
            className="min-h-[44px] text-xs text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl bg-slate-100 transition-colors flex items-center justify-center"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* 5 HUBS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredHubs.map((hub) => {
          const isSelected = selectedHub.id === hub.id;
          return (
            <div
              key={hub.id}
              onClick={() => setSelectedHub(hub)}
              onMouseMove={handleCardMouseMove}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-2 border-pink-500 shadow-xl shadow-pink-500/25 ring-1 ring-pink-500'
                  : 'bg-white border-slate-200 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {hub.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>~{hub.avgArrivalMins} Mins ETA</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <MapPin size={16} className="text-pink-600 shrink-0" />
                  {hub.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {hub.landmark}
                </p>

                {/* Localities Covered Pills */}
                <div className="space-y-1.5 mb-6">
                  <div className="text-[10.5px] font-mono text-slate-500 uppercase tracking-wider">
                    Neighborhood Coverage:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hub.coverageAreas.map((area) => (
                      <span
                        key={area}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hub Bottom Telemetry */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <ThermometerSnowflake size={14} className="text-pink-600" />
                  <span className="font-mono text-pink-600 font-bold">{hub.coldChainTemp}</span>
                  <span className="text-slate-500">· {hub.activePhlebos} Phlebos Active</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHubForBooking(hub);
                  }}
                  className="min-h-[44px] px-3 font-mono text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 hover:underline"
                >
                  ⚡ Pre-Route Dispatch <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED HUB DETAIL FOOTER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-50/70 via-white to-pink-50/70 border border-pink-200 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="text-xs font-mono text-pink-600 font-bold uppercase tracking-wider">
              Selected Collection Hub
            </div>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              {selectedHub.name} (Coverage: {selectedHub.coverageAreas.slice(0, 4).join(', ')}…)
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Phlebo Lead: <b className="text-slate-900">{selectedHub.leadPhlebo}</b> · Cold Box Digital Sensor: <b className="text-emerald-700">{selectedHub.coldChainTemp} Verified</b>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectHubForBooking(selectedHub)}
          className="min-h-[44px] w-full md:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 active:scale-95 transition-all shrink-0"
        >
          ⚡ 1-Click Pre-Route Dispatch from this Hub <ArrowRight size={17} />
        </button>
      </div>

    </section>
  );
};

export default AligarhPickupHubsSection;
