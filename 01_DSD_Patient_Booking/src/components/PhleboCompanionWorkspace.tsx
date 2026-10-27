import React, { useState, useRef } from 'react';
import { 
  Truck, 
  Wallet, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Fuel, 
  Phone, 
  Download, 
  Plus, 
  X, 
  QrCode, 
  LogOut,
} from 'lucide-react';
import { generateAndDownloadNablPdf } from '../services/nablPdfEngine';
import SpecimenTubeGraphic from './SpecimenTubeGraphic';

interface PhleboCompanionWorkspaceProps {
  onClose: () => void;
  collectorName?: string;
}

interface CollectionJob {
  id: string;
  patientName: string;
  phone: string;
  address: string;
  packageName: string;
  timeSlot: string;
  status: 'Assigned' | 'En Route' | 'Arrived' | 'Collected' | 'In Lab';
  barcode?: string;
  reportAvailable?: boolean;
}

interface CommissionRecord {
  id: string;
  patientName: string;
  packageName: string;
  commission: number;
  date: string;
  status: 'Credited' | 'Pending Approval';
}

const INITIAL_JOBS: CollectionJob[] = [
  {
    id: 'DSD-2401',
    patientName: 'Sunita Sharma (Age 52)',
    phone: '+91 98370 12345',
    address: '1246, Vidyanagar Colony, Ramghat Road (Near Vishal Mart)',
    packageName: 'DSD Smart Health Advance (Fasting)',
    timeSlot: '07:00–09:00 AM',
    status: 'En Route',
    barcode: 'BC-DSD-98124',
    reportAvailable: true
  },
  {
    id: 'DSD-2402',
    patientName: 'Virendra Singh (Age 64)',
    phone: '+91 94123 45678',
    address: 'House #42, Centre Point Market',
    packageName: 'Diabetic Package + HbA1c',
    timeSlot: '08:30–10:00 AM',
    status: 'Assigned',
    reportAvailable: false
  },
  {
    id: 'DSD-2404',
    patientName: 'Mohd. Zeeshan (Age 45)',
    phone: '+91 97580 54321',
    address: 'Dodhpur Road, Near AMU Circle',
    packageName: 'Executive Full Body Checkup',
    timeSlot: '07:30–09:00 AM',
    status: 'Collected',
    barcode: 'BC-DSD-98112',
    reportAvailable: true
  }
];

const INITIAL_COMMISSIONS: CommissionRecord[] = [
  { id: 'COMM-101', patientName: 'Sunita Sharma', packageName: 'DSD Smart Health Advance', commission: 100, date: 'Today, 07:10 AM', status: 'Credited' },
  { id: 'COMM-102', patientName: 'Mohd. Zeeshan', packageName: 'Executive Full Body Checkup', commission: 200, date: 'Today, 06:45 AM', status: 'Credited' },
  { id: 'COMM-103', patientName: 'Rajesh Gupta', packageName: 'Basic Health Pack', commission: 50, date: 'Yesterday', status: 'Credited' }
];

export const PhleboCompanionWorkspace: React.FC<PhleboCompanionWorkspaceProps> = ({
  onClose,
  collectorName = 'Rahul Sharma'
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'wallet' | 'expense' | 'attendance'>('queue');
  const [onDuty, setOnDuty] = useState(true);
  const [jobs, setJobs] = useState<CollectionJob[]>(INITIAL_JOBS);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(INITIAL_COMMISSIONS);
  const [walletBalance, setWalletBalance] = useState(2450);
  const [odometerKm] = useState(28.4);
  const [toastMessage, setToastMessage] = useState('');
  
  // Barcode entry state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeJobIdForBarcode, setActiveJobIdForBarcode] = useState<string | null>(null);

  // Self-Booking commission creator state
  const [selfBookingOpen, setSelfBookingOpen] = useState(false);
  const [selfPatient, setSelfPatient] = useState('');
  const [selfPackage, setSelfPackage] = useState('smartadvance');

  // Attendance camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieCaptured, setSelfieCaptured] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Start Camera for Face Attendance
  const handleStartCamera = async () => {
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleCaptureSelfie = () => {
    // Generate snapshot
    setSelfieCaptured('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
    setCameraActive(false);
    setOnDuty(true);
    showToast('Face Verified & Morning Attendance Marked! GPS Duty Started.');
  };

  const handleJobStatusChange = (jobId: string, nextStatus: CollectionJob['status']) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: nextStatus } : j));
    showToast(`Order #${jobId} status updated to: ${nextStatus}`);
  };

  const handleSaveBarcode = (jobId: string) => {
    if (!barcodeInput.trim()) return;
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, barcode: barcodeInput.trim(), status: 'Collected' } : j));
    setActiveJobIdForBarcode(null);
    setBarcodeInput('');
    showToast(`Sample Barcoded & Collected for ${jobId}!`);
  };

  const handleAddSelfBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfPatient.trim()) return;

    const commMap: Record<string, { name: string; comm: number }> = {
      basiccamp: { name: 'Basic Health Pack', comm: 50 },
      smartadvance: { name: 'DSD Smart Health Advance', comm: 100 },
      executive: { name: 'Executive Full Body Checkup', comm: 200 }
    };

    const chosen = commMap[selfPackage] || { name: 'Custom Health Pack', comm: 75 };
    const newRecord: CommissionRecord = {
      id: `COMM-${Date.now().toString().slice(-4)}`,
      patientName: selfPatient.trim(),
      packageName: chosen.name,
      commission: chosen.comm,
      date: 'Just now',
      status: 'Credited'
    };

    setCommissions([newRecord, ...commissions]);
    setWalletBalance(prev => prev + chosen.comm);
    setSelfPatient('');
    setSelfBookingOpen(false);
    showToast(`Package Sold! ₹${chosen.comm} credited to your Phlebo Wallet.`);
  };

  const fuelAllowance = Number((odometerKm * 3.5).toFixed(2));

  return (
    <div className="opsOverlay" role="dialog" aria-modal="true">
      <div className="phleboWorkspaceShell">
        
        {/* Header */}
        <header className="phleboHeader">
          <div className="phleboHeaderBrand">
            <div className="phleboBadge">
              <Truck size={20} />
            </div>
            <div>
              <h3>Phlebo Mobile Companion</h3>
              <small>{collectorName} · Field Logistics & Wallet Node</small>
            </div>
          </div>

          <div className="phleboHeaderRight">
            <div className={`dutyPill ${onDuty ? 'active' : 'off'}`}>
              <span className="liveDot" />
              <span>{onDuty ? 'ON FIELD DUTY' : 'OFF DUTY'}</span>
            </div>

            <button 
              type="button" 
              className="dutyToggleBtn"
              onClick={() => {
                setOnDuty(!onDuty);
                showToast(onDuty ? 'Logged out of field duty.' : 'Shift Started!');
              }}
            >
              <LogOut size={14} /> {onDuty ? 'End Shift' : 'Punch In'}
            </button>

            <button type="button" className="opsClose" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="phleboToast">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="phleboNavTabs">
          <button 
            type="button" 
            className={activeTab === 'queue' ? 'active' : ''} 
            onClick={() => setActiveTab('queue')}
          >
            <Truck size={16} /> Collection Queue ({jobs.length})
          </button>
          <button 
            type="button" 
            className={activeTab === 'wallet' ? 'active' : ''} 
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet size={16} /> Phlebo Wallet (₹{walletBalance})
          </button>
          <button 
            type="button" 
            className={activeTab === 'expense' ? 'active' : ''} 
            onClick={() => setActiveTab('expense')}
          >
            <Fuel size={16} /> Mileage & Fuel (₹{fuelAllowance})
          </button>
          <button 
            type="button" 
            className={activeTab === 'attendance' ? 'active' : ''} 
            onClick={() => setActiveTab('attendance')}
          >
            <Camera size={16} /> VR Face Attendance
          </button>
        </nav>

        {/* Workspace Body */}
        <div className="phleboBody">
          
          {/* TAB 1: COLLECTION QUEUE */}
          {activeTab === 'queue' && (
            <div className="tabContent">
              <div className="queueList">
                {jobs.map((job) => (
                  <article key={job.id} className="phleboJobCard">
                    <div className="jobHead">
                      <div>
                        <span className="jobIdBadge">{job.id}</span>
                        <h4>{job.patientName}</h4>
                        <p className="jobAddress"><MapPin size={14} /> {job.address}</p>
                      </div>

                      <div className="jobSlotBadge">
                        <Clock size={14} /> {job.timeSlot}
                      </div>
                    </div>

                    <div className="jobMetaRow">
                      <span className="packageTag">{job.packageName}</span>
                      <a href={`tel:${job.phone}`} className="phoneBtn">
                        <Phone size={13} /> Call Patient
                      </a>
                    </div>

                    {job.barcode && (
                      <div className="barcodePill">
                        <QrCode size={14} />
                        <span>Vacutainer Barcode: <b>{job.barcode}</b></span>
                      </div>
                    )}

                    {/* Progress Control Actions */}
                    <div className="jobActions">
                      {job.status === 'Assigned' && (
                        <button 
                          type="button" 
                          className="statusActionBtn enroute"
                          onClick={() => handleJobStatusChange(job.id, 'En Route')}
                        >
                          Start Ride (En Route)
                        </button>
                      )}

                      {job.status === 'En Route' && (
                        <button 
                          type="button" 
                          className="statusActionBtn arrived"
                          onClick={() => handleJobStatusChange(job.id, 'Arrived')}
                        >
                          Arrived at Patient Home
                        </button>
                      )}

                      {job.status === 'Arrived' && (
                        <button 
                          type="button" 
                          className="statusActionBtn barcode"
                          onClick={() => setActiveJobIdForBarcode(job.id)}
                        >
                          Scan / Enter Barcode
                        </button>
                      )}

                      {job.status === 'Collected' && (
                        <button 
                          type="button" 
                          className="statusActionBtn delivered"
                          onClick={() => handleJobStatusChange(job.id, 'In Lab')}
                        >
                          Deliver to Central Lab
                        </button>
                      )}

                      {job.status === 'In Lab' && (
                        <div className="deliveredStatusTag">
                          <CheckCircle2 size={16} /> Sample Delivered & In Analyzer
                        </div>
                      )}

                      {job.reportAvailable && (
                        <button 
                          type="button" 
                          className="reportDownloadBtn"
                          onClick={() => {
                            generateAndDownloadNablPdf({
                              bookingId: job.id,
                              patientName: job.patientName,
                              ageGender: 'Adult',
                              phone: job.phone,
                              packageName: job.packageName,
                              barcode: job.barcode || 'BC-DSD-98124',
                              collectionTime: 'Today, 08:30 AM',
                              reportedTime: 'Today, 02:15 PM',
                              verifiedBy: 'Dr. Ananya Verma, MD (Pathology) · NABL Reg #48192',
                              parameters: [
                                { category: 'Hematology', name: 'Hemoglobin (Hb)', value: '14.0', unit: 'g/dL', refRange: '12.0 - 16.0', method: 'SLS Method', status: 'Normal' },
                                { category: 'Biochemistry', name: 'Fasting Blood Sugar', value: '92', unit: 'mg/dL', refRange: '70 - 99', method: 'Hexokinase', status: 'Normal' },
                                { category: 'Biochemistry', name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', refRange: '0.6 - 1.2', method: 'Jaffe Kinetic', status: 'Normal' },
                                { category: 'Lipid Profile', name: 'Total Cholesterol', value: '172', unit: 'mg/dL', refRange: '< 200', method: 'CHOD-PAP', status: 'Normal' }
                              ]
                            });
                            showToast(`Official NABL QR Report PDF for ${job.id} downloaded ✓`);
                          }}
                        >
                          <Download size={14} /> Download Verified NABL Report
                        </button>
                      )}
                    </div>

                    {/* Barcode Input Form Modal with 4K Vacutainers */}
                    {activeJobIdForBarcode === job.id && (
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-700/80 my-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-cyan-400">4K Clinical Vacutainers to Draw:</span>
                          <span className="text-[10px] text-slate-400 font-mono">Becton Dickinson Specs</span>
                        </div>
                        <div className="flex items-center justify-around gap-2 py-1 bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                          <SpecimenTubeGraphic
                            capColor="#a855f7"
                            capLabel="EDTA"
                            tubeName="Lavender EDTA (CBC)"
                            additive="K2 EDTA"
                            height={52}
                            width={22}
                          />
                          <SpecimenTubeGraphic
                            capColor="#eab308"
                            capLabel="SST Gel"
                            tubeName="Gold SST (LFT/KFT)"
                            hasGelSeparator={true}
                            liquidColor="#ca8a04"
                            additive="Polymer Gel"
                            height={52}
                            width={22}
                          />
                          <SpecimenTubeGraphic
                            capColor="#94a3b8"
                            capLabel="Fluoride"
                            tubeName="Grey Fluoride (FBS)"
                            liquidColor="#881337"
                            additive="NaF Oxalate"
                            height={52}
                            width={22}
                          />
                        </div>
                        <div className="barcodeFormRow">
                          <input 
                            type="text" 
                            placeholder="Enter tube barcode (e.g. BC-DSD-98124)..." 
                            value={barcodeInput}
                            onChange={e => setBarcodeInput(e.target.value)}
                            autoFocus
                          />
                          <button 
                            type="button" 
                            className="opsPrimary"
                            onClick={() => handleSaveBarcode(job.id)}
                          >
                            Save Barcode
                          </button>
                          <button 
                            type="button" 
                            className="opsClose"
                            onClick={() => setActiveJobIdForBarcode(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PHLEBO WALLET & INCENTIVES */}
          {activeTab === 'wallet' && (
            <div className="tabContent">
              <div className="walletSummaryGrid">
                <div className="walletCard main">
                  <span>TOTAL WALLET BALANCE</span>
                  <b>₹{walletBalance.toLocaleString('en-IN')}</b>
                  <small>Available for bank transfer / cash payout</small>
                  <button 
                    type="button" 
                    className="payoutBtn"
                    onClick={() => showToast('Withdrawal request submitted to Lab Director.')}
                  >
                    Request Payout
                  </button>
                </div>

                <div className="walletCard rateCard">
                  <span>COMMISSION RATE STRUCTURE</span>
                  <div className="rateRow">
                    <span>Basic Health Pack (₹299):</span>
                    <b>₹50</b>
                  </div>
                  <div className="rateRow">
                    <span>DSD Smart Health Advance (₹499):</span>
                    <b>₹100</b>
                  </div>
                  <div className="rateRow">
                    <span>Executive Full Body (₹999):</span>
                    <b>₹200</b>
                  </div>
                  <button 
                    type="button" 
                    className="sellPackageBtn"
                    onClick={() => setSelfBookingOpen(true)}
                  >
                    <Plus size={14} /> Direct Patient Booking (Earn Commission)
                  </button>
                </div>
              </div>

              {/* Commission Ledger Table */}
              <div className="ledgerTitle">
                <h4>Package Sales & Earnings Ledger</h4>
              </div>

              <div className="opsTableWrap">
                <table className="opsTable">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Patient Name</th>
                      <th>Package Sold</th>
                      <th>Commission</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id}>
                        <td><b>{c.id}</b></td>
                        <td>{c.patientName}</td>
                        <td><span className="opsPill">{c.packageName}</span></td>
                        <td><b className="textEmerald">+₹{c.commission}</b></td>
                        <td><small>{c.date}</small></td>
                        <td><span className="badgeAudit">{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Direct Booking Modal */}
              {selfBookingOpen && (
                <div className="feedbackOverlay">
                  <div className="feedbackCard">
                    <div className="feedbackHead">
                      <h4>Sell Package & Earn Instant Commission</h4>
                      <button type="button" onClick={() => setSelfBookingOpen(false)}><X size={16} /></button>
                    </div>

                    <form onSubmit={handleAddSelfBooking}>
                      <label>
                        Patient Name & Phone
                        <input 
                          type="text" 
                          placeholder="e.g. Ramesh Kumar (+91 98370 00000)"
                          value={selfPatient}
                          onChange={e => setSelfPatient(e.target.value)}
                          required
                        />
                      </label>

                      <label>
                        Select Diagnostic Package
                        <select value={selfPackage} onChange={e => setSelfPackage(e.target.value)}>
                          <option value="smartadvance">DSD Smart Health Advance (Earn ₹100)</option>
                          <option value="executive">Executive Full Body (Earn ₹200)</option>
                          <option value="basiccamp">Basic Health Pack (Earn ₹50)</option>
                        </select>
                      </label>

                      <button type="submit" className="opsPrimary full">
                        Confirm Booking & Credit Wallet
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MILEAGE & FUEL EXPENSE */}
          {activeTab === 'expense' && (
            <div className="tabContent">
              <div className="expenseOverview">
                <div className="kpiCard">
                  <div className="kpiTop">
                    <span>GPS DISTANCE TODAY</span>
                    <MapPin size={16} className="textCyan" />
                  </div>
                  <b>{odometerKm} km</b>
                  <small>Aligarh Ramghat Rd · Center Point · Vidyanagar</small>
                </div>

                <div className="kpiCard">
                  <div className="kpiTop">
                    <span>FUEL REIMBURSEMENT (@ ₹3.5/KM)</span>
                    <Fuel size={16} className="textEmerald" />
                  </div>
                  <b>₹{fuelAllowance}</b>
                  <small>Auto-calculated from live GPS coordinates</small>
                </div>
              </div>

              <div className="expenseActionBox">
                <h4>Submit Field Expense (Toll / Parking / Ice Pack)</h4>
                <div className="expenseInputs">
                  <input type="text" placeholder="Expense description (e.g. Dry Ice Pack for transport box)..." />
                  <input type="number" placeholder="Amount (₹)..." style={{ width: 130 }} />
                  <button 
                    type="button" 
                    className="opsPrimary"
                    onClick={() => showToast('Field expense submitted for lab approval.')}
                  >
                    Submit Expense
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VR FACE ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="tabContent">
              <div className="attendanceCard">
                <div className="attHead">
                  <Camera size={24} className="textCyan" />
                  <div>
                    <h4>AI Face & Geofenced GPS Attendance</h4>
                    <p>Facial snapshot verified with Aligarh Zone 1 GPS geofence (27.8974° N, 78.0880° E)</p>
                  </div>
                </div>

                {cameraActive ? (
                  <div className="cameraStreamWrap">
                    <video ref={videoRef} autoPlay playsInline className="videoStream" />
                    <button type="button" className="opsPrimary captureBtn" onClick={handleCaptureSelfie}>
                      <Camera size={16} /> Capture Face & Clock In
                    </button>
                  </div>
                ) : selfieCaptured ? (
                  <div className="selfiePreviewBox">
                    <img src={selfieCaptured} alt="Phlebo attendance selfie" className="selfieImg" />
                    <div className="selfieMeta">
                      <div className="verifiedBadge">
                        <CheckCircle2 size={16} className="textEmerald" /> Face Verified
                      </div>
                      <b>Clock-In: Today, 06:45 AM</b>
                      <small>Location: Vidyanagar Colony, Ramghat Road (Verified)</small>
                    </div>
                  </div>
                ) : (
                  <div className="cameraStartBox">
                    <button type="button" className="opsPrimary" onClick={handleStartCamera}>
                      <Camera size={16} /> Open Camera for Morning Punch-In
                    </button>
                    <button 
                      type="button" 
                      className="demoSnapBtn"
                      onClick={handleCaptureSelfie}
                    >
                      Use Demo Face Punch-In (Test Mode)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default PhleboCompanionWorkspace;
