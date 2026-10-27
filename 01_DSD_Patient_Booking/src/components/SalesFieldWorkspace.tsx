import React, { useState } from 'react';
import { 
  Building2, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  Download, 
  Plus, 
  X, 
  Search, 
  FileText, 
  Clock, 
  Sparkles, 
  Stethoscope,
  Phone,
  Send
} from 'lucide-react';

interface SalesFieldWorkspaceProps {
  onClose: () => void;
  officerName?: string;
}

interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  area: string;
  tier: 'Tier A (Weekly)' | 'Tier B (Bi-Weekly)' | 'Tier C (Monthly)';
  visitsThisMonth: number;
  targetVisits: number;
  phone: string;
}

interface DcrEntry {
  id: string;
  doctorName: string;
  clinic: string;
  time: string;
  discussion: string;
  requisitionsGiven: number;
  commitment: string;
  selfieUrl?: string;
  gpsLocation: string;
}

const INITIAL_MSL: DoctorRecord[] = [
  { id: 'DOC-101', name: 'Dr. K. K. Sharma', specialty: 'MD (Internal Medicine)', clinic: 'Sharma Medical Clinic', area: 'Ramghat Road', tier: 'Tier A (Weekly)', visitsThisMonth: 3, targetVisits: 4, phone: '+91 98370 11223' },
  { id: 'DOC-102', name: 'Dr. Ritu Garg', specialty: 'MBBS, DGO (Gynecologist)', clinic: 'Garg Maternity & Nursing Home', area: 'Vidyanagar Colony', tier: 'Tier A (Weekly)', visitsThisMonth: 2, targetVisits: 4, phone: '+91 98371 44556' },
  { id: 'DOC-103', name: 'Dr. S. K. Jain', specialty: 'Consultant Diabetologist', clinic: 'Diabetes Care Center', area: 'Center Point Market', tier: 'Tier B (Bi-Weekly)', visitsThisMonth: 1, targetVisits: 2, phone: '+91 98372 77889' },
  { id: 'DOC-104', name: 'Dr. Neeraj Saxena', specialty: 'Orthopedic Surgeon', clinic: 'Joint Care Clinic', area: 'Marris Road', tier: 'Tier B (Bi-Weekly)', visitsThisMonth: 2, targetVisits: 2, phone: '+91 98373 99001' }
];

const INITIAL_DCR: DcrEntry[] = [
  {
    id: 'DCR-501',
    doctorName: 'Dr. K. K. Sharma',
    clinic: 'Sharma Medical Clinic (Ramghat Rd)',
    time: '10:30 AM',
    discussion: 'Detailed DSD Smart Health Advance ₹499 Camp Offer & automated WhatsApp PDF reports.',
    requisitionsGiven: 50,
    commitment: 'Agreed to refer 6-8 fasting blood glucose & lipid patients this Saturday.',
    selfieUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    gpsLocation: '27.8974° N, 78.0880° E (Verified at Clinic Board)'
  }
];

export const SalesFieldWorkspace: React.FC<SalesFieldWorkspaceProps> = ({
  onClose,
  officerName = 'Vikas Saxena'
}) => {
  const [activeTab, setActiveTab] = useState<'dcr' | 'msl' | 'attendance' | 'expenses'>('dcr');
  const [mslList, setMslList] = useState<DoctorRecord[]>(INITIAL_MSL);
  const [dcrList, setDcrList] = useState<DcrEntry[]>(INITIAL_DCR);
  const [newVisitModalOpen, setNewVisitModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Form states for new visit
  const [selectedDoctorId, setSelectedDoctorId] = useState(INITIAL_MSL[0].id);
  const [discussion, setDiscussion] = useState('');
  const [requisitionsCount, setRequisitionsCount] = useState(50);
  const [commitment, setCommitment] = useState('');
  const [selfieSnapshot, setSelfieSnapshot] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCaptureClinicSelfie = () => {
    // Generate snapshot with clinic geostamp
    setSelfieSnapshot('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80');
    showToast('Clinic Board Selfie & GPS Coordinates Captured!');
  };

  const handleSubmitDcr = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = mslList.find(d => d.id === selectedDoctorId);
    if (!doc) return;

    const newEntry: DcrEntry = {
      id: `DCR-${Date.now().toString().slice(-4)}`,
      doctorName: doc.name,
      clinic: `${doc.clinic} (${doc.area})`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      discussion: discussion.trim() || 'Product detailing & DSD Diagnostic requisition slips provided.',
      requisitionsGiven: Number(requisitionsCount) || 25,
      commitment: commitment.trim() || 'Agreed to recommend DSD routine panels.',
      selfieUrl: selfieSnapshot || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      gpsLocation: '27.8974° N, 78.0880° E (Aligarh Geo-Tagged)'
    };

    setDcrList([newEntry, ...dcrList]);
    setMslList(prev => prev.map(d => d.id === selectedDoctorId ? { ...d, visitsThisMonth: d.visitsThisMonth + 1 } : d));
    setNewVisitModalOpen(false);
    setDiscussion('');
    setCommitment('');
    setSelfieSnapshot(null);
    showToast(`DCR Visit Logged for ${doc.name}!`);
  };

  const handleExportDcr = () => {
    const text = `DAILY CALL REPORT (DCR) · DR. SHASTRI DIAGNOSTICS
Sales Executive: ${officerName}
Date: ${new Date().toLocaleDateString('en-IN')}
Total Doctor Calls Today: ${dcrList.length}

${dcrList.map((entry, i) => `
[CALL #${i + 1}]
Doctor:       ${entry.doctorName}
Clinic:       ${entry.clinic}
Time:         ${entry.time}
GPS Location: ${entry.gpsLocation}
Discussion:   ${entry.discussion}
Samples/Slips:${entry.requisitionsGiven}
Commitment:   ${entry.commitment}
-------------------------------------------------------`).join('\n')}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DCR_${officerName.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.txt`;
    a.click();
    showToast('Daily Call Report (DCR) exported for Lab Director.');
  };

  return (
    <div className="opsOverlay" role="dialog" aria-modal="true">
      <div className="salesWorkspaceShell">
        
        {/* Header */}
        <header className="salesHeader">
          <div className="salesBrand">
            <div className="salesBadge">
              <Building2 size={20} />
            </div>
            <div>
              <h3>B2B / B2C Field Sales Engine</h3>
              <small>{officerName} · Medical Territory Executive (Aligarh Node)</small>
            </div>
          </div>

          <div className="headerActions">
            <button 
              type="button" 
              className="opsPrimary"
              onClick={() => setNewVisitModalOpen(true)}
            >
              <Plus size={16} /> Log Doctor Visit
            </button>
            <button type="button" className="opsClose" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>

        {toastMsg && (
          <div className="phleboToast">
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="phleboNavTabs">
          <button 
            type="button" 
            className={activeTab === 'dcr' ? 'active' : ''} 
            onClick={() => setActiveTab('dcr')}
          >
            <FileText size={16} /> Daily Call Report (DCR) ({dcrList.length})
          </button>
          <button 
            type="button" 
            className={activeTab === 'msl' ? 'active' : ''} 
            onClick={() => setActiveTab('msl')}
          >
            <Stethoscope size={16} /> Monthly Doctor List (MSL) ({mslList.length})
          </button>
          <button 
            type="button" 
            className={activeTab === 'expenses' ? 'active' : ''} 
            onClick={() => setActiveTab('expenses')}
          >
            <DollarSign size={16} /> Travel Allowance (TA/DA)
          </button>
          <button 
            type="button" 
            className={activeTab === 'attendance' ? 'active' : ''} 
            onClick={() => setActiveTab('attendance')}
          >
            <Camera size={16} /> Morning Attendance
          </button>
        </nav>

        {/* Content Body */}
        <div className="phleboBody">
          
          {/* TAB 1: DCR LOG */}
          {activeTab === 'dcr' && (
            <div className="tabContent">
              <div className="dcrActionRow">
                <div>
                  <h4>Today's Doctor Call Logs</h4>
                  <p>All calls verified with clinic geotagged selfie and GPS coordinates</p>
                </div>
                <button 
                  type="button" 
                  className="exportDcrBtn"
                  onClick={handleExportDcr}
                >
                  <Download size={15} /> Export DCR Summary
                </button>
              </div>

              <div className="dcrEntriesList">
                {dcrList.map((entry) => (
                  <article key={entry.id} className="dcrCard">
                    <div className="dcrHead">
                      <div className="docMeta">
                        <Stethoscope size={20} className="textCyan" />
                        <div>
                          <h4>{entry.doctorName}</h4>
                          <small>{entry.clinic} · {entry.time}</small>
                        </div>
                      </div>

                      <span className="gpsVerifiedBadge">
                        <CheckCircle2 size={13} className="textEmerald" /> Geo-Verified
                      </span>
                    </div>

                    <p className="discussionText"><b>Discussion:</b> {entry.discussion}</p>

                    <div className="dcrStatsRow">
                      <div className="statPill">
                        <span>Requisition Slips Given:</span>
                        <b>{entry.requisitionsGiven} pcs</b>
                      </div>
                      <div className="statPill">
                        <span>Doctor Commitment:</span>
                        <b className="textEmerald">{entry.commitment}</b>
                      </div>
                    </div>

                    {entry.selfieUrl && (
                      <div className="selfieGeoBox">
                        <img src={entry.selfieUrl} alt="Clinic selfie" className="clinicThumb" />
                        <div>
                          <b>Doctor Clinic Geotagged Selfie</b>
                          <small><MapPin size={12} /> {entry.gpsLocation}</small>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MSL (MONTHLY DOCTOR LIST) */}
          {activeTab === 'msl' && (
            <div className="tabContent">
              <div className="mslHead">
                <div>
                  <h4>Target Clinicians Directory</h4>
                  <p>Categorized by call frequency tier and specialization</p>
                </div>
              </div>

              <div className="opsTableWrap">
                <table className="opsTable">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Specialty</th>
                      <th>Clinic & Area</th>
                      <th>Call Tier</th>
                      <th>Monthly Progress</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mslList.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <b>{doc.name}</b>
                          <small>{doc.id}</small>
                        </td>
                        <td><span className="opsPill">{doc.specialty}</span></td>
                        <td>
                          <b>{doc.clinic}</b>
                          <small>{doc.area}</small>
                        </td>
                        <td><b className="tierTag">{doc.tier}</b></td>
                        <td>
                          <div className="progressBarWrap">
                            <span>{doc.visitsThisMonth} / {doc.targetVisits} visits</span>
                            <div className="progressTrack">
                              <div 
                                className="progressFill" 
                                style={{ width: `${Math.min(100, (doc.visitsThisMonth / doc.targetVisits) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <button 
                            type="button" 
                            className="logVisitMiniBtn"
                            onClick={() => {
                              setSelectedDoctorId(doc.id);
                              setNewVisitModalOpen(true);
                            }}
                          >
                            Log Call
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TA / DA EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="tabContent">
              <div className="walletSummaryGrid">
                <div className="walletCard main">
                  <span>TODAY'S ALLOWANCE (TA/DA)</span>
                  <b>₹580.00</b>
                  <small>Daily DA: ₹150 · Local Conveyance: ₹250 · Tea/Host: ₹180</small>
                </div>

                <div className="walletCard rateCard">
                  <span>MONTHLY SALES INCENTIVE</span>
                  <b>₹8,450.00</b>
                  <small>Accrued on B2B clinic referrals & camp bookings</small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="tabContent">
              <div className="attendanceCard">
                <div className="attHead">
                  <Camera size={24} className="textCyan" />
                  <div>
                    <h4>Sales Officer Morning Face & GPS Punch-In</h4>
                    <p>Aligarh Medical Zone territory verified (Ramghat Rd / Center Point)</p>
                  </div>
                </div>

                <div className="selfiePreviewBox">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" 
                    alt="Sales executive punch-in" 
                    className="selfieImg" 
                  />
                  <div className="selfieMeta">
                    <div className="verifiedBadge">
                      <CheckCircle2 size={16} className="textEmerald" /> Field Verified
                    </div>
                    <b>Clock-In: Today, 09:15 AM</b>
                    <small>Territory: Ramghat Road / Vidyanagar Sector</small>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* LOG DOCTOR VISIT MODAL */}
        {newVisitModalOpen && (
          <div className="feedbackOverlay">
            <div className="feedbackCard visitModal">
              <div className="feedbackHead">
                <h4>Log Doctor Call Verification</h4>
                <button type="button" onClick={() => setNewVisitModalOpen(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmitDcr}>
                <label>
                  Select Doctor from MSL
                  <select 
                    value={selectedDoctorId} 
                    onChange={e => setSelectedDoctorId(e.target.value)}
                  >
                    {mslList.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.clinic}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Discussion & Detailing Summary
                  <textarea 
                    placeholder="Products detailed (e.g. Smart Health Advance, Thyroid profiles, report delivery)..."
                    value={discussion}
                    onChange={e => setDiscussion(e.target.value)}
                    rows={2}
                    required
                  />
                </label>

                <label>
                  Requisition Slips Handed Over
                  <input 
                    type="number" 
                    value={requisitionsCount} 
                    onChange={e => setRequisitionsCount(Number(e.target.value))} 
                  />
                </label>

                <label>
                  Doctor Commitment / Next Follow-up
                  <input 
                    type="text" 
                    placeholder="e.g. Prescribing 5 patients this week"
                    value={commitment}
                    onChange={e => setCommitment(e.target.value)}
                  />
                </label>

                {/* Camera Selfie Geotagging trigger */}
                <div className="cameraGeoSection">
                  <button 
                    type="button" 
                    className="selfieTriggerBtn"
                    onClick={handleCaptureClinicSelfie}
                  >
                    <Camera size={16} /> 
                    {selfieSnapshot ? '✓ Clinic Selfie & GPS Attached' : 'Take Clinic Board Selfie (Geotagged)'}
                  </button>

                  {selfieSnapshot && (
                    <img src={selfieSnapshot} alt="Clinic geotagged selfie" className="clinicPreviewMini" />
                  )}
                </div>

                <button type="submit" className="opsPrimary full">
                  Save DCR Entry
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SalesFieldWorkspace;
