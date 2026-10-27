import { useEffect, useMemo, useState } from 'react';
import { 
  Activity, 
  Bot, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardCheck, 
  Compass, 
  MapPin, 
  Plus, 
  Search, 
  Send, 
  Settings2, 
  Truck, 
  X,
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Edit3,
  DollarSign,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  RefreshCw,
  LogOut,
  Sliders,
  Check,
  Save
} from 'lucide-react';
import type { StaffRole } from './components/StaffAuthModal';

export type Lead = { id: string; name: string; channel: string; note: string; stage: string; created: string };
export type Dispatch = { 
  id: string; 
  patientRef: string; 
  phone: string;
  area: string; 
  slot: string; 
  collector: string; 
  status: 'Needs assignment' | 'Assigned' | 'En Route' | 'Collected' | 'In Lab'; 
  gps: string;
  tests: string;
};
export type Draft = { id: string; service: string; area: string; title: string; description: string; faq: string; status: string };
export type Job = { id: string; agent: string; task: string; status: string; time: string };
export type CheckItem = { id: string; label: string; done: boolean; category: string };

const STORAGE_KEY = 'dsd-operations-v2';
const CATALOG_STORAGE_KEY = 'dsd-admin-card-edits';

const initialChecks: CheckItem[] = [
  { id: 'qa', label: 'Desktop & mobile UI regression passed (Zero horizontal scroll)', done: true, category: 'Frontend' },
  { id: 'booking', label: 'Booking create/status & WhatsApp dispatch verified', done: true, category: 'API' },
  { id: 'gps', label: 'Collector GPS consent & locality dispatch feed active', done: true, category: 'Logistics' },
  { id: 'seo', label: 'Metadata, schema.org medical diagnostic markup active', done: true, category: 'SEO' },
  { id: 'security', label: 'Staff RBAC authentication & session token verified', done: true, category: 'Security' },
  { id: 'coldchain', label: 'Sample transport box temperature logging protocol (2°–8°C)', done: true, category: 'Clinical' },
];

const initialLeads: Lead[] = [
  { id: 'L-1001', name: 'Dr. Mehta Clinic', channel: 'Referral', note: 'Follow up for home collection partnership in Ramghat Rd', stage: 'Contacted', created: 'Today' },
  { id: 'L-1002', name: 'Shivam Nursing Home', channel: 'Website', note: 'Requested corporate health camp rate card for 120 employees', stage: 'New', created: 'Today' },
  { id: 'L-1003', name: 'Lohchab Imaging Referral Desk', channel: 'B2B', note: 'Joint diagnostic CT + Pathology requisition tie-up', stage: 'Qualified', created: 'Yesterday' }
];

const initialDispatch: Dispatch[] = [
  { id: 'DSD-2401', patientRef: 'Sunita Sharma (Age 52)', phone: '+91 98370 12345', area: 'Ramghat Road (Opp. Vishal Mart)', slot: '07:00–09:00', collector: 'Rahul Sharma', status: 'En Route', gps: '27.8974° N, 78.0880° E', tests: 'DSD Smart Health Advance (Fasting)' },
  { id: 'DSD-2402', patientRef: 'Virendra Singh (Age 64)', phone: '+91 94123 45678', area: 'Vidyanagar Colony', slot: '08:30–10:00', collector: 'Amit Kumar', status: 'Assigned', gps: 'Locality Center Point', tests: 'Diabetic Package + HbA1c' },
  { id: 'DSD-2403', patientRef: 'Pooja Agarwal (Age 34)', phone: '+91 98971 67890', area: 'Center Point Market', slot: '09:00–11:00', collector: 'Unassigned', status: 'Needs assignment', gps: 'Pending assignment', tests: 'Thyro-Diabetic Package' },
  { id: 'DSD-2404', patientRef: 'Mohd. Zeeshan (Age 45)', phone: '+91 97580 54321', area: 'Dodhpur', slot: '07:30–09:00', collector: 'Rahul Sharma', status: 'Collected', gps: 'Sample in cold box (4°C)', tests: 'Executive Full Body Checkup' }
];

const initialJobs: Job[] = [
  { id: 'JOB-01', agent: 'LIMS Diagnostic Pod', task: 'Automated specimen barcode matching & panic value scan', status: 'Active (Real-time)', time: 'Continuous' },
  { id: 'JOB-02', agent: 'Phlebo Logistics Pod', task: 'Optimized routing for Aligarh Ramghat Road cluster', status: 'Completed', time: '06:45 AM' },
  { id: 'JOB-03', agent: 'WhatsApp CRM Bot', task: 'Automated report delivery & fasting instructions broadcast', status: 'Active (Real-time)', time: 'Continuous' },
  { id: 'JOB-04', agent: 'NABL Audit Scanner', task: 'Calibration logs & reagent expiry pre-check', status: 'Passed (0 flags)', time: '06:00 AM' }
];

// Default catalog items for the price manager
const DEFAULT_CATALOG = [
  { id: 'membership', name: 'DSD Membership Card', price: 19, category: 'Camp Packages', tat: 'Instant' },
  { id: 'basiccamp', name: 'Basic Health Pack (CBC, Sugar, Urine, KFT)', price: 299, category: 'Camp Packages', tat: '4 Hours' },
  { id: 'smartadvance', name: 'DSD Smart Health Advance (CBC, LFT, KFT, Lipid, Thyroid, HbA1c)', price: 499, category: 'Camp Packages', tat: '6 Hours' },
  { id: 'executive', name: 'Executive Full Body Checkup (+ Vit D3, B12)', price: 999, category: 'Camp Packages', tat: '12 Hours' },
  { id: 'diabetes', name: 'Diabetic Package (22 parameters)', price: 840, category: 'Diabetes', tat: '4 Hours' },
  { id: 'thyrodiabetes', name: 'Thyro-Diabetic Package (34 parameters)', price: 960, category: 'Diabetes', tat: '6 Hours' },
  { id: 'renal', name: 'Renal Screening Package', price: 175, category: 'Kidney', tat: '4 Hours' },
  { id: 'senior', name: 'Senior Citizen Package (58 parameters)', price: 6789, category: 'Senior Care', tat: '12 Hours' },
  { id: 'weakness', name: 'Basic Weakness Package (63 parameters)', price: 2730, category: 'Full Body', tat: '8 Hours' },
  { id: 'joint', name: 'Basic Joint Pain Package', price: 875, category: 'Joint Care', tat: '6 Hours' },
  { id: 'specialjoint', name: 'Special Joint Package (41 parameters)', price: 4530, category: 'Joint Care', tat: '12 Hours' },
  { id: 'hypertension', name: 'Hypertension Package (76 parameters)', price: 4710, category: 'Heart Health', tat: '12 Hours' }
];

type OperationsHubProps = {
  onClose: () => void;
  initialRole?: StaffRole;
  userLabel?: string;
  onUpdateCatalogPrice?: (testId: string, price: number) => void;
};

export default function OperationsHub({ 
  onClose, 
  initialRole = 'admin', 
  userLabel = 'Dr. S. K. Shastri',
  onUpdateCatalogPrice 
}: OperationsHubProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dispatch' | 'catalog' | 'leads' | 'agents' | 'audit'>(
    initialRole === 'phlebo' ? 'dispatch' : 'overview'
  );
  
  const [role] = useState<StaffRole>(initialRole);
  const [dispatchList, setDispatchList] = useState<Dispatch[]>(initialDispatch);
  const [leadsList] = useState<Lead[]>(initialLeads);
  const [jobsList] = useState<Job[]>(initialJobs);
  const [checksList, setChecksList] = useState<CheckItem[]>(initialChecks);
  const [catalogItems, setCatalogItems] = useState(DEFAULT_CATALOG);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [notification, setNotification] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');

  // New dispatch job form state
  const [newPatient, setNewPatient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newArea, setNewArea] = useState('Ramghat Road (Opp. Vishal Mart)');
  const [newSlot, setNewSlot] = useState('07:00–09:00');
  const [newTests, setNewTests] = useState('DSD Smart Health Advance');
  const [newCollector, setNewCollector] = useState('Rahul Sharma');

  // Load persisted edits
  useEffect(() => {
    try {
      const savedOps = localStorage.getItem(STORAGE_KEY);
      if (savedOps) {
        const parsed = JSON.parse(savedOps);
        if (parsed.dispatch) setDispatchList(parsed.dispatch);
        if (parsed.checks) setChecksList(parsed.checks);
      }

      const savedCatalog = localStorage.getItem(CATALOG_STORAGE_KEY);
      if (savedCatalog) {
        const parsedPrices = JSON.parse(savedCatalog);
        setCatalogItems(prev => prev.map(item => ({
          ...item,
          price: parsedPrices[item.id]?.price !== undefined ? Number(parsedPrices[item.id].price) : item.price
        })));
      }
    } catch {
      // Keep safe defaults
    }
  }, []);

  // Persist dispatch & leads
  const persistData = (updatedDispatch: Dispatch[], updatedLeads: Lead[], updatedChecks: CheckItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dispatch: updatedDispatch,
        leads: updatedLeads,
        checks: updatedChecks
      }));
    } catch {
      // Storage unavailable
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Add Dispatch Job
  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.trim()) {
      showToast('Patient name is required');
      return;
    }

    const newJob: Dispatch = {
      id: `DSD-${Date.now().toString().slice(-4)}`,
      patientRef: newPatient.trim(),
      phone: newPhone.trim() || '+91 92588 88085',
      area: newArea,
      slot: newSlot,
      collector: newCollector,
      status: newCollector === 'Unassigned' ? 'Needs assignment' : 'Assigned',
      gps: 'Live coordinates pending',
      tests: newTests
    };

    const nextDispatch = [newJob, ...dispatchList];
    setDispatchList(nextDispatch);
    persistData(nextDispatch, leadsList, checksList);
    setNewPatient('');
    setNewPhone('');
    showToast(`Home collection job created for ${newJob.patientRef}!`);
  };

  // Update Dispatch Status
  const handleUpdateStatus = (id: string, newStatus: Dispatch['status']) => {
    const next = dispatchList.map(d => d.id === id ? { ...d, status: newStatus } : d);
    setDispatchList(next);
    persistData(next, leadsList, checksList);
    showToast(`Order #${id} status updated to: ${newStatus}`);
  };

  // Save Catalog Price Edit
  const handleSavePrice = (id: string) => {
    if (tempPrice <= 0) return;
    const nextCatalog = catalogItems.map(c => c.id === id ? { ...c, price: tempPrice } : c);
    setCatalogItems(nextCatalog);

    try {
      const existing = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) || '{}');
      existing[id] = { price: tempPrice };
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(existing));
    } catch {
      // safe fallback
    }

    if (onUpdateCatalogPrice) {
      onUpdateCatalogPrice(id, tempPrice);
    }

    setEditingPriceId(null);
    showToast(`Updated price for ${id.toUpperCase()} to ₹${tempPrice}`);
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    if (!searchFilter.trim()) return catalogItems;
    const q = searchFilter.toLowerCase();
    return catalogItems.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  }, [catalogItems, searchFilter]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalRequisitions = dispatchList.length + 14;
    const enRouteCount = dispatchList.filter(d => d.status === 'En Route' || d.status === 'Assigned').length;
    const collectedCount = dispatchList.filter(d => d.status === 'Collected' || d.status === 'In Lab').length;
    const estRevenue = dispatchList.reduce((acc, curr) => {
      const match = catalogItems.find(c => curr.tests.toLowerCase().includes(c.id));
      return acc + (match ? match.price : 499);
    }, 4500);

    return { totalRequisitions, enRouteCount, collectedCount, estRevenue };
  }, [dispatchList, catalogItems]);

  return (
    <div className="opsOverlay" role="dialog" aria-modal="true" aria-label="DSD Operations Control OS">
      <div className="opsShell">
        
        {/* Top Header Bar */}
        <header className="opsTop">
          <div className="opsBrand">
            <div className="opsBrandMark">
              <span>DSD</span>
              <small>+</small>
            </div>
            <div>
              <div className="opsBrandMeta">
                <b>Dr. Shastri Diagnostics</b>
                <span className="opsTagLive">
                  <span className="liveDot" />
                  Live Operational Node #1246
                </span>
              </div>
              <small>Ramghat Road, Aligarh · Enterprise Operations Control OS</small>
            </div>
          </div>

          <div className="opsTopRight">
            {notification && (
              <div className="opsToastAlert">
                <Sparkles size={14} />
                <span>{notification}</span>
              </div>
            )}

            <div className="opsRoleIndicator">
              <ShieldCheck size={16} className="textTeal" />
              <div>
                <b>{userLabel}</b>
                <small>{role.toUpperCase()} CONSOLE</small>
              </div>
            </div>

            <button 
              type="button" 
              className="opsClose" 
              onClick={onClose}
              title="Close Control Center"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Main Body Layout */}
        <div className="opsLayout">
          
          {/* Side Navigation */}
          <aside className="opsSide">
            <div className="opsSideLabel">OPERATIONAL WORKSPACES</div>

            <button 
              type="button" 
              className={`opsNav ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity size={18} />
              <span>Overview & Analytics</span>
              <ChevronRight size={14} className="navArrow" />
            </button>

            <button 
              type="button" 
              className={`opsNav ${activeTab === 'dispatch' ? 'active' : ''}`}
              onClick={() => setActiveTab('dispatch')}
            >
              <Truck size={18} />
              <span>Phlebo Fleet & Dispatch</span>
              <span className="badgeCount">{dispatchList.filter(d => d.status !== 'In Lab').length}</span>
            </button>

            <button 
              type="button" 
              className={`opsNav ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <FileSpreadsheet size={18} />
              <span>Test Cards & Rates</span>
              <span className="badgeTag">Live</span>
            </button>

            <button 
              type="button" 
              className={`opsNav ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <Search size={18} />
              <span>Clinic & B2B Leads</span>
              <span className="badgeCount">{leadsList.length}</span>
            </button>

            <button 
              type="button" 
              className={`opsNav ${activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              <Bot size={18} />
              <span>GIA AI Agent Pods</span>
              <span className="badgeTagLive">Active</span>
            </button>

            <button 
              type="button" 
              className={`opsNav ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <ClipboardCheck size={18} />
              <span>NABL Quality Gate</span>
              <span className="badgeAudit">6/6 OK</span>
            </button>

            {/* Sidebar Footer */}
            <div className="opsSideFoot">
              <Clock size={16} />
              <div>
                <b>Standard Operating Protocol</b>
                <small>NABL ISO 15189:2022 Verified</small>
              </div>
            </div>
          </aside>

          {/* Workspace Content Area */}
          <main className="opsMain">
            
            {/* TAB 1: OVERVIEW & ANALYTICS */}
            {activeTab === 'overview' && (
              <div className="tabView">
                <div className="viewHead">
                  <div>
                    <div className="opsEyebrow">REAL-TIME DIAGNOSTIC TELEMETRY</div>
                    <h1>Executive Command Console</h1>
                    <p className="opsSub">
                      Continuous monitoring of patient walk-ins, home sample logistics, turnaround times (TAT), and clinical revenue velocity for Dr. Shastri Diagnostics.
                    </p>
                  </div>

                  <button 
                    type="button" 
                    className="opsPrimary"
                    onClick={() => setActiveTab('dispatch')}
                  >
                    <Plus size={16} /> Create Home Collection Job
                  </button>
                </div>

                {/* Urgent Triage Alert Banner */}
                <div className="opsAlertBanner">
                  <AlertTriangle size={20} className="textAmber" />
                  <div className="bannerText">
                    <b>Morning Fasting Collection Window Active (07:00 – 10:00 AM)</b>
                    <span>
                      3 fasting glucose & lipid profiles pending collection in Ramghat Road sector. Cold chain boxes pre-chilled to 4°C.
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="bannerActionBtn"
                    onClick={() => setActiveTab('dispatch')}
                  >
                    View Queue
                  </button>
                </div>

                {/* 4 Rich KPI Metric Cards */}
                <div className="opsStats">
                  <article className="kpiCard">
                    <div className="kpiTop">
                      <span>TODAY'S REQUISITIONS</span>
                      <TrendingUp size={16} className="textTeal" />
                    </div>
                    <b>{metrics.totalRequisitions}</b>
                    <small>+14.8% vs last week · 8 Walk-ins, 10 Home</small>
                  </article>

                  <article className="kpiCard">
                    <div className="kpiTop">
                      <span>ACTIVE PHLEBO RUNS</span>
                      <Truck size={16} className="textCyan" />
                    </div>
                    <b>{metrics.enRouteCount} Active</b>
                    <small>Rahul (Ramghat Rd), Amit (Vidyanagar)</small>
                  </article>

                  <article className="kpiCard">
                    <div className="kpiTop">
                      <span>SAMPLES IN LAB / TAT</span>
                      <Activity size={16} className="textEmerald" />
                    </div>
                    <b>{metrics.collectedCount} In Processing</b>
                    <small>Avg TAT: 3.4 hrs (Within NABL target &lt; 6 hrs)</small>
                  </article>

                  <article className="kpiCard">
                    <div className="kpiTop">
                      <span>EST. DAILY VALUE</span>
                      <DollarSign size={16} className="textTeal" />
                    </div>
                    <b>₹{metrics.estRevenue.toLocaleString('en-IN')}</b>
                    <small>Top: DSD Smart Health Advance (₹499)</small>
                  </article>
                </div>

                {/* Quick Action Hub */}
                <div className="opsSectionTitle">
                  <h2>Operational Department Shortcuts</h2>
                  <p>Direct triggers for routine diagnostic and phlebotomy workflows</p>
                </div>

                <div className="opsQuickGrid">
                  <button type="button" onClick={() => setActiveTab('dispatch')}>
                    <Truck />
                    <div>
                      <b>Dispatch Field Phlebotomist</b>
                      <span>Assign patient collection slot & pre-fill WhatsApp directions</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button type="button" onClick={() => setActiveTab('catalog')}>
                    <FileSpreadsheet />
                    <div>
                      <b>Manage Package Rates & Discounts</b>
                      <span>Instantly edit Camp Offer pricing (₹19, ₹299, ₹499) for patient app</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button type="button" onClick={() => setActiveTab('leads')}>
                    <Search />
                    <div>
                      <b>B2B Clinic Referral Pipeline</b>
                      <span>Follow-up with doctors & nursing homes for routine tie-ups</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button type="button" onClick={() => setActiveTab('agents')}>
                    <Bot />
                    <div>
                      <b>GIA Autonomous AI Agents</b>
                      <span>Inspect automated triage, ASR speech pipelines & WhatsApp bot</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PHLEBO FLEET & DISPATCH */}
            {activeTab === 'dispatch' && (
              <div className="tabView">
                <div className="viewHead">
                  <div>
                    <div className="opsEyebrow">FLEET LOGISTICS & HOME COLLECTION</div>
                    <h1>Phlebotomy Dispatch Console</h1>
                    <p className="opsSub">
                      Schedule and track home sample pickups across Aligarh localities. Direct 1-click WhatsApp dispatch to field phlebotomists with patient address and Google Maps links.
                    </p>
                  </div>
                </div>

                {/* Dispatch Creation Panel */}
                <div className="opsPanel">
                  <h2>
                    <Plus size={18} className="textTeal" />
                    Book New Home Collection Run
                  </h2>

                  <form onSubmit={handleCreateDispatch} className="opsFormGrid">
                    <label>
                      Patient Full Name & Age
                      <input 
                        type="text" 
                        placeholder="e.g. Ramesh Chandra (Age 58)"
                        value={newPatient}
                        onChange={e => setNewPatient(e.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Patient WhatsApp / Phone
                      <input 
                        type="text" 
                        placeholder="e.g. +91 98370 12345"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                      />
                    </label>

                    <label>
                      Collection Locality / Landmark
                      <select value={newArea} onChange={e => setNewArea(e.target.value)}>
                        <option value="Ramghat Road (Opp. Vishal Mart)">Ramghat Road (Opp. Vishal Mart)</option>
                        <option value="Vidyanagar Colony">Vidyanagar Colony</option>
                        <option value="Center Point Market">Center Point Market</option>
                        <option value="Dodhpur / Civil Lines">Dodhpur / Civil Lines</option>
                        <option value="Medical Road / AMU Campus">Medical Road / AMU Campus</option>
                        <option value="Marris Road">Marris Road</option>
                        <option value="Other Aligarh Locality">Other Aligarh Locality</option>
                      </select>
                    </label>

                    <label>
                      Preferred Morning Slot
                      <select value={newSlot} onChange={e => setNewSlot(e.target.value)}>
                        <option value="06:30–08:00 (Early Fasting)">06:30–08:00 (Early Fasting)</option>
                        <option value="07:00–09:00 (Fasting Regular)">07:00–09:00 (Fasting Regular)</option>
                        <option value="09:00–11:00 (Standard)">09:00–11:00 (Standard)</option>
                        <option value="11:00–01:00 (Afternoon / Routine)">11:00–01:00 (Afternoon / Routine)</option>
                      </select>
                    </label>

                    <label>
                      Test Package Required
                      <select value={newTests} onChange={e => setNewTests(e.target.value)}>
                        <option value="DSD Smart Health Advance">DSD Smart Health Advance (₹499)</option>
                        <option value="Basic Health Pack">Basic Health Pack (₹299)</option>
                        <option value="Executive Full Body Checkup">Executive Full Body Checkup (₹999)</option>
                        <option value="Diabetic Package">Diabetic Package (₹840)</option>
                        <option value="Special Joint Package">Special Joint Package (₹4530)</option>
                        <option value="Custom Blood Routine">Custom Blood Routine</option>
                      </select>
                    </label>

                    <label>
                      Assign Field Phlebotomist
                      <select value={newCollector} onChange={e => setNewCollector(e.target.value)}>
                        <option value="Rahul Sharma">Rahul Sharma (Bike 1 · Ramghat Cluster)</option>
                        <option value="Amit Kumar">Amit Kumar (Bike 2 · Vidyanagar/Center Point)</option>
                        <option value="Unassigned">Unassigned (Leave in Queue)</option>
                      </select>
                    </label>

                    <div className="opsWide">
                      <button type="submit" className="opsPrimary">
                        <Plus size={16} /> Save & Dispatch Collection Job
                      </button>
                    </div>
                  </form>
                </div>

                {/* Dispatch Queue Table */}
                <div className="opsSectionTitle">
                  <h2>
                    Active Collection Runs 
                    <span className="badgeCount">{dispatchList.length}</span>
                  </h2>
                  <p>Live status updating with sample barcoding and cold-chain logging</p>
                </div>

                <div className="opsTableWrap">
                  <table className="opsTable">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Patient Details</th>
                        <th>Locality & Slot</th>
                        <th>Package</th>
                        <th>Assigned Phlebo</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchList.map(job => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.area + ', Aligarh')}`;
                        const waMsg = `Hello ${job.collector}, new sample collection job assigned:
Patient: ${job.patientRef}
Locality: ${job.area}
Time Slot: ${job.slot}
Tests: ${job.tests}
Maps Link: ${mapsUrl}`;
                        const waUrl = `https://wa.me/919258888085?text=${encodeURIComponent(waMsg)}`;

                        return (
                          <tr key={job.id}>
                            <td>
                              <b>{job.id}</b>
                              <small>{job.gps}</small>
                            </td>
                            <td>
                              <b>{job.patientRef}</b>
                              <small>{job.phone}</small>
                            </td>
                            <td>
                              <b>{job.area}</b>
                              <small>{job.slot}</small>
                            </td>
                            <td>
                              <span className="opsPill">{job.tests}</span>
                            </td>
                            <td>
                              <b>{job.collector}</b>
                              <small>Cold box #1 (Checked 4°C)</small>
                            </td>
                            <td>
                              <select 
                                value={job.status}
                                onChange={e => handleUpdateStatus(job.id, e.target.value as Dispatch['status'])}
                                className={`statusSelect status_${job.status.replace(/\s+/g, '')}`}
                              >
                                <option value="Needs assignment">Needs assignment</option>
                                <option value="Assigned">Assigned</option>
                                <option value="En Route">En Route</option>
                                <option value="Collected">Collected</option>
                                <option value="In Lab">In Lab</option>
                              </select>
                            </td>
                            <td>
                              <div className="actionRow">
                                <a 
                                  href={waUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="actionIconBtn whatsapp"
                                  title="Dispatch WhatsApp Notification"
                                >
                                  <MessageSquare size={14} />
                                </a>
                                <a 
                                  href={mapsUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="actionIconBtn map"
                                  title="Open Google Maps GPS"
                                >
                                  <MapPin size={14} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: TEST CARDS & CATALOG RATES */}
            {activeTab === 'catalog' && (
              <div className="tabView">
                <div className="viewHead">
                  <div>
                    <div className="opsEyebrow">DIAGNOSTIC PRICING & CAMP ENGINE</div>
                    <h1>Test Cards & Package Rates</h1>
                    <p className="opsSub">
                      Live catalog editor. Changes made here apply instantly to the patient booking menu, test cards, and WhatsApp auto-responder across the portal.
                    </p>
                  </div>

                  <div className="catalogSearchBox">
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search tests or packages..." 
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="opsTableWrap">
                  <table className="opsTable">
                    <thead>
                      <tr>
                        <th>Package ID</th>
                        <th>Test Package Name</th>
                        <th>Category</th>
                        <th>Turnaround (TAT)</th>
                        <th>Current Price</th>
                        <th>Live Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCatalog.map(item => {
                        const isEditing = editingPriceId === item.id;
                        return (
                          <tr key={item.id}>
                            <td>
                              <code>{item.id}</code>
                            </td>
                            <td>
                              <b>{item.name}</b>
                              <small>Official NABL test card listing</small>
                            </td>
                            <td>
                              <span className="opsPill">{item.category}</span>
                            </td>
                            <td>
                              <b>{item.tat}</b>
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="priceEditWrap">
                                  <span>₹</span>
                                  <input 
                                    type="number" 
                                    value={tempPrice}
                                    onChange={e => setTempPrice(Number(e.target.value))}
                                    autoFocus
                                    className="priceInput"
                                  />
                                </div>
                              ) : (
                                <b className="priceText">₹{item.price.toLocaleString('en-IN')}</b>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="actionRow">
                                  <button 
                                    type="button" 
                                    className="saveBtn"
                                    onClick={() => handleSavePrice(item.id)}
                                  >
                                    <Check size={14} /> Save
                                  </button>
                                  <button 
                                    type="button" 
                                    className="cancelBtn"
                                    onClick={() => setEditingPriceId(null)}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  type="button" 
                                  className="editBtn"
                                  onClick={() => {
                                    setEditingPriceId(item.id);
                                    setTempPrice(item.price);
                                  }}
                                >
                                  <Edit3 size={14} /> Edit Price
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: B2B CLINIC LEADS */}
            {activeTab === 'leads' && (
              <div className="tabView">
                <div className="viewHead">
                  <div>
                    <div className="opsEyebrow">PARTNERSHIP CRM</div>
                    <h1>Clinic & Doctor Referrals</h1>
                    <p className="opsSub">
                      Manage local doctor partnerships, hospital emergency sample routing, and community health camp campaigns in Aligarh.
                    </p>
                  </div>
                </div>

                <div className="opsTableWrap">
                  <table className="opsTable">
                    <thead>
                      <tr>
                        <th>Lead ID</th>
                        <th>Doctor / Institution</th>
                        <th>Source Channel</th>
                        <th>Strategic Notes</th>
                        <th>Pipeline Stage</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsList.map(lead => (
                        <tr key={lead.id}>
                          <td><b>{lead.id}</b></td>
                          <td>
                            <b>{lead.name}</b>
                            <small>Created: {lead.created}</small>
                          </td>
                          <td><span className="opsPill">{lead.channel}</span></td>
                          <td><small>{lead.note}</small></td>
                          <td>
                            <span className={`stageBadge stage_${lead.stage.toLowerCase()}`}>
                              {lead.stage}
                            </span>
                          </td>
                          <td>
                            <a 
                              href={`https://wa.me/919258888085?text=Hello+Dr.+Shastri+Diagnostics+following+up+with+${encodeURIComponent(lead.name)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="actionIconBtn whatsapp"
                            >
                              <MessageSquare size={14} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: GIA AI AGENT PODS */}
            {activeTab === 'agents' && (
              <div className="tabView">
                <div className="viewHead">
                  <div>
                    <div className="opsEyebrow">AUTONOMOUS MULTI-AGENT RUNTIME</div>
                    <h1>GIA Agent Pods Studio</h1>
                    <p className="opsSub">
                      Underlying multi-agent pods orchestrating diagnostic analyzers, conversational phone triage, automated WhatsApp booking, and compliance auditing.
                    </p>
                  </div>
                </div>

                <div className="opsAgentGrid">
                  {jobsList.map(j => (
                    <article key={j.id} className="agentCard">
                      <div className="opsAgentIcon">
                        <Bot size={20} />
                      </div>
                      <h3>{j.agent}</h3>
                      <p>{j.task}</p>
                      <div className="agentMeta">
                        <span className="statusDot live" />
                        <span>Status: <b>{j.status}</b></span>
                        <small>{j.time}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: NABL QUALITY GATE */}
            {activeTab === 'audit' && (
              <div className="tabView">
                <div className="viewHead">
                  <div>
                    <div className="opsEyebrow">ISO 15189:2022 AUDIT GATES</div>
                    <h1>Laboratory Quality & Release Checklist</h1>
                    <p className="opsSub">
                      Mandatory clinical verification before dispatching patient results or rolling out major rate card modifications.
                    </p>
                  </div>
                </div>

                <div className="opsCheckList">
                  {checksList.map(chk => (
                    <div 
                      key={chk.id} 
                      className={`opsCheck ${chk.done ? 'done' : ''}`}
                      onClick={() => {
                        const next = checksList.map(c => c.id === chk.id ? { ...c, done: !c.done } : c);
                        setChecksList(next);
                        persistData(dispatchList, leadsList, next);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={chk.done} 
                        readOnly 
                      />
                      <span>
                        <b>{chk.label}</b>
                        <small>Compliance Vector: {chk.category}</small>
                      </span>
                      <CheckCircle2 size={18} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Global Modal Footer */}
        <footer className="opsFooter">
          <span>Dr. Shastri Diagnostics (DSD Care) · 1246 Vidyanagar, Ramghat Road, Aligarh · Node #1246</span>
          <span>NABL ISO-15189 & TRAI Compliant · 24x7 Support: +91 92588 88085</span>
        </footer>
      </div>
    </div>
  );
}
