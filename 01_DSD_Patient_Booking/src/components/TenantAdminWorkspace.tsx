import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  DollarSign,
  Truck,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Plus,
  Search,
  Sliders,
  Check,
  X,
  PhoneCall,
  Activity,
  Award,
  Zap,
  Users,
  ChevronRight,
  TrendingUp,
  Percent,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export interface TestCatalogItem {
  id: string;
  code: string;
  name: string;
  department: string;
  mrp: number;
  offerPrice: number;
  b2bRate: number;
  sampleType: string;
  vacutainer: string;
  tatHours: number;
  isActive: boolean;
}

export interface FleboOfficer {
  id: string;
  name: string;
  phone: string;
  rating: number;
  status: 'On Duty' | 'In Transit' | 'Off Duty';
  assignedSector: string;
  completedToday: number;
  pendingToday: number;
  rights: {
    canCollectCash: boolean;
    canReschedule: boolean;
    canOverrideTubes: boolean;
    canViewMedicalHistory: boolean;
    highFreqGps: boolean;
  };
  commission: {
    basePerOrder: number;
    tatBonus: number;
  };
}

interface TenantAdminWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName?: string;
  tenantLocation?: string;
}

const INITIAL_TESTS: TestCatalogItem[] = [
  {
    id: 't-cbc',
    code: 'HEM-001',
    name: 'Complete Blood Count (CBC 24 Params)',
    department: 'Hematology',
    mrp: 350,
    offerPrice: 199,
    b2bRate: 110,
    sampleType: 'Whole Blood',
    vacutainer: 'Lavender EDTA',
    tatHours: 4,
    isActive: true
  },
  {
    id: 't-lft',
    code: 'BIO-012',
    name: 'Liver Function Test (LFT 12 Params)',
    department: 'Biochemistry',
    mrp: 650,
    offerPrice: 349,
    b2bRate: 190,
    sampleType: 'Serum',
    vacutainer: 'Gold SST Gel',
    tatHours: 5,
    isActive: true
  },
  {
    id: 't-kft',
    code: 'BIO-015',
    name: 'Kidney Function Test (KFT 10 Params)',
    department: 'Biochemistry',
    mrp: 600,
    offerPrice: 349,
    b2bRate: 180,
    sampleType: 'Serum',
    vacutainer: 'Gold SST Gel',
    tatHours: 5,
    isActive: true
  },
  {
    id: 't-lipid',
    code: 'BIO-022',
    name: 'Lipid Profile Screen (9 Params)',
    department: 'Biochemistry',
    mrp: 550,
    offerPrice: 299,
    b2bRate: 160,
    sampleType: 'Serum',
    vacutainer: 'Gold SST Gel',
    tatHours: 5,
    isActive: true
  },
  {
    id: 't-hba1c',
    code: 'DIA-004',
    name: 'HbA1c Glycated Hemoglobin (HPLC)',
    department: 'Diabetes / Endocrine',
    mrp: 500,
    offerPrice: 299,
    b2bRate: 150,
    sampleType: 'Whole Blood',
    vacutainer: 'Lavender EDTA',
    tatHours: 6,
    isActive: true
  },
  {
    id: 't-fbs',
    code: 'DIA-001',
    name: 'Fasting Blood Sugar (Hexokinase FBS)',
    department: 'Biochemistry',
    mrp: 100,
    offerPrice: 60,
    b2bRate: 35,
    sampleType: 'Fluoride Plasma',
    vacutainer: 'Grey Fluoride',
    tatHours: 3,
    isActive: true
  },
  {
    id: 't-tsh',
    code: 'IMM-008',
    name: 'Thyroid Stimulating Hormone (TSH 3rd Gen)',
    department: 'Immunology ECLIA',
    mrp: 300,
    offerPrice: 180,
    b2bRate: 95,
    sampleType: 'Serum',
    vacutainer: 'Gold SST Gel',
    tatHours: 6,
    isActive: true
  },
  {
    id: 't-vitd',
    code: 'IMM-045',
    name: 'Vitamin D3 (25-OH Total Calcidiol)',
    department: 'Immunology ECLIA',
    mrp: 1400,
    offerPrice: 699,
    b2bRate: 380,
    sampleType: 'Serum',
    vacutainer: 'Gold SST Gel',
    tatHours: 8,
    isActive: true
  },
  {
    id: 't-vitb12',
    code: 'IMM-046',
    name: 'Vitamin B12 (Active Cobalamin)',
    department: 'Immunology ECLIA',
    mrp: 1200,
    offerPrice: 599,
    b2bRate: 340,
    sampleType: 'Serum',
    vacutainer: 'Gold SST Gel',
    tatHours: 8,
    isActive: true
  }
];

const INITIAL_FLEBOS: FleboOfficer[] = [
  {
    id: 'fl-01',
    name: 'Rahul Sharma',
    phone: '+91 94123 78901',
    rating: 4.9,
    status: 'In Transit',
    assignedSector: 'Sector 1 (Ramghat Road & Centre Point)',
    completedToday: 7,
    pendingToday: 3,
    rights: {
      canCollectCash: true,
      canReschedule: true,
      canOverrideTubes: false,
      canViewMedicalHistory: true,
      highFreqGps: true
    },
    commission: {
      basePerOrder: 80,
      tatBonus: 15
    }
  },
  {
    id: 'fl-02',
    name: 'Amit Verma',
    phone: '+91 94123 78902',
    rating: 4.8,
    status: 'On Duty',
    assignedSector: 'Sector 2 (Medical Road & AMU Campus)',
    completedToday: 6,
    pendingToday: 2,
    rights: {
      canCollectCash: true,
      canReschedule: false,
      canOverrideTubes: false,
      canViewMedicalHistory: true,
      highFreqGps: true
    },
    commission: {
      basePerOrder: 80,
      tatBonus: 15
    }
  },
  {
    id: 'fl-03',
    name: 'Vikram Singh',
    phone: '+91 94123 78903',
    rating: 4.7,
    status: 'Off Duty',
    assignedSector: 'Sector 3 (Sasni Gate & GT Road)',
    completedToday: 4,
    pendingToday: 0,
    rights: {
      canCollectCash: false,
      canReschedule: false,
      canOverrideTubes: false,
      canViewMedicalHistory: false,
      highFreqGps: true
    },
    commission: {
      basePerOrder: 75,
      tatBonus: 10
    }
  }
];

export const TenantAdminWorkspace: React.FC<TenantAdminWorkspaceProps> = ({
  isOpen,
  onClose,
  tenantName = 'Dr. Shastri Diagnostics (Central Lab)',
  tenantLocation = '1246, Vidyanagar Colony, Ramghat Road, Aligarh'
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'packages' | 'flebo' | 'profile' | 'orders'>('catalog');
  const [tests, setTests] = useState<TestCatalogItem[]>(() => {
    const saved = localStorage.getItem('dsd_tenant_tests');
    return saved ? JSON.parse(saved) : INITIAL_TESTS;
  });
  const [flebos, setFlebos] = useState<FleboOfficer[]>(() => {
    const saved = localStorage.getItem('dsd_tenant_flebos');
    return saved ? JSON.parse(saved) : INITIAL_FLEBOS;
  });

  // Package Rates state
  const [packageRates, setPackageRates] = useState({
    smartadvance: { mrp: 1499, offer: 499, active: true },
    executive: { mrp: 2899, offer: 999, active: true },
    basiccamp: { mrp: 699, offer: 299, active: true }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editOfferPrice, setEditOfferPrice] = useState<number>(0);
  const [editMrpPrice, setEditMrpPrice] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveTestPrice = (id: string) => {
    const updated = tests.map(t => {
      if (t.id === id) {
        return { ...t, mrp: editMrpPrice, offerPrice: editOfferPrice };
      }
      return t;
    });
    setTests(updated);
    localStorage.setItem('dsd_tenant_tests', JSON.stringify(updated));
    setEditingTestId(null);
    triggerToast('Test pricing updated successfully ✓');
  };

  const handleToggleTestActive = (id: string) => {
    const updated = tests.map(t => {
      if (t.id === id) {
        return { ...t, isActive: !t.isActive };
      }
      return t;
    });
    setTests(updated);
    localStorage.setItem('dsd_tenant_tests', JSON.stringify(updated));
    triggerToast('Test availability status updated ✓');
  };

  const handleToggleFleboRight = (fleboId: string, rightKey: keyof FleboOfficer['rights']) => {
    const updated = flebos.map(f => {
      if (f.id === fleboId) {
        return {
          ...f,
          rights: {
            ...f.rights,
            [rightKey]: !f.rights[rightKey]
          }
        };
      }
      return f;
    });
    setFlebos(updated);
    localStorage.setItem('dsd_tenant_flebos', JSON.stringify(updated));
    triggerToast('Phlebotomist permissions updated ✓');
  };

  const filteredTests = tests.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Toast Notification */}
        {saveToast && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {tenantName}
                </h2>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Tenant Admin (Lab Owner)
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">
                  <CheckCircle2 size={12} /> NABL ISO 15189:2022
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} className="text-cyan-400" />
                {tenantLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Portal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'catalog' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={16} />
            <span>Test Catalog & Prices ({tests.length})</span>
            {activeTab === 'catalog' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'packages' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Percent size={16} />
            <span>Health Packages Rates</span>
            {activeTab === 'packages' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flebo')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'flebo' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck size={16} />
            <span>Flebo Fleet & Rights ({flebos.length})</span>
            {activeTab === 'flebo' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'orders' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={16} />
            <span>Daily Orders & Revenue</span>
            {activeTab === 'orders' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Lab Profile & Analyzers</span>
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: TEST CATALOG & PRICES */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign size={16} className="text-cyan-400" />
                    Local Test Price List & Availability
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adjust test offer prices, set B2B rates for partner clinics, and toggle analyzer availability.
                  </p>
                </div>

                <div className="relative min-w-[240px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search test name or code..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Tests Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Test Code / Name</th>
                      <th className="py-3 px-3">Dept / Specimen</th>
                      <th className="py-3 px-3">Standard MRP</th>
                      <th className="py-3 px-3 text-cyan-400">Lab Offer Price</th>
                      <th className="py-3 px-3">B2B Partner Rate</th>
                      <th className="py-3 px-3">TAT</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTests.map(test => {
                      const isEditing = editingTestId === test.id;
                      return (
                        <tr key={test.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white text-[13px]">{test.name}</div>
                            <div className="text-[10px] font-mono text-cyan-400/80">{test.code}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <div>{test.department}</div>
                            <span className="text-[10px] font-mono text-slate-400">{test.vacutainer}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400 line-through">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editMrpPrice}
                                onChange={e => setEditMrpPrice(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                              />
                            ) : (
                              `₹${test.mrp}`
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editOfferPrice}
                                onChange={e => setEditOfferPrice(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-cyan-300 font-mono text-xs font-bold"
                              />
                            ) : (
                              `₹${test.offerPrice}`
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-400">
                            ₹{test.b2bRate}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">
                            {test.tatHours}h
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleTestActive(test.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-colors ${
                                test.isActive
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {test.isActive ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveTestPrice(test.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                                  title="Save price"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTestId(null)}
                                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                  title="Cancel"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTestId(test.id);
                                  setEditOfferPrice(test.offerPrice);
                                  setEditMrpPrice(test.mrp);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 transition-colors"
                                title="Edit pricing"
                              >
                                <Edit3 size={13} />
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

          {/* TAB 2: HEALTH PACKAGES RATES */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Percent size={16} className="text-cyan-400" />
                  Aligarh Home Checkup Packages Pricing & Margins
                </h3>
                <p className="text-xs text-slate-400">
                  Manage patient-facing pricing for packages. Changes reflect instantly on your public booking page.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Package 1 */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                        Best Seller · 84 Params
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2">DSD Smart Health Advance</h4>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Standard MRP:</span>
                      <input
                        type="number"
                        value={packageRates.smartadvance.mrp}
                        onChange={e => setPackageRates({
                          ...packageRates,
                          smartadvance: { ...packageRates.smartadvance, mrp: Number(e.target.value) }
                        })}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-right font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between text-white font-semibold">
                      <span className="text-cyan-400">Public Offer Price:</span>
                      <input
                        type="number"
                        value={packageRates.smartadvance.offer}
                        onChange={e => setPackageRates({
                          ...packageRates,
                          smartadvance: { ...packageRates.smartadvance, offer: Number(e.target.value) }
                        })}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-cyan-300 font-mono font-bold text-right"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerToast('Smart Health Advance price updated ✓')}
                    className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save size={13} /> Save Package Price
                  </button>
                </div>

                {/* Package 2 */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30">
                        Executive · 92 Params
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2">Executive Full Body Screen</h4>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Standard MRP:</span>
                      <input
                        type="number"
                        value={packageRates.executive.mrp}
                        onChange={e => setPackageRates({
                          ...packageRates,
                          executive: { ...packageRates.executive, mrp: Number(e.target.value) }
                        })}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-right font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between text-white font-semibold">
                      <span className="text-purple-400">Public Offer Price:</span>
                      <input
                        type="number"
                        value={packageRates.executive.offer}
                        onChange={e => setPackageRates({
                          ...packageRates,
                          executive: { ...packageRates.executive, offer: Number(e.target.value) }
                        })}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-purple-500 text-purple-300 font-mono font-bold text-right"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerToast('Executive Full Body price updated ✓')}
                    className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save size={13} /> Save Package Price
                  </button>
                </div>

                {/* Package 3 */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                        Camp Special · 42 Params
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2">Basic Health Pack (Vital 4)</h4>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Standard MRP:</span>
                      <input
                        type="number"
                        value={packageRates.basiccamp.mrp}
                        onChange={e => setPackageRates({
                          ...packageRates,
                          basiccamp: { ...packageRates.basiccamp, mrp: Number(e.target.value) }
                        })}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-right font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between text-white font-semibold">
                      <span className="text-amber-400">Public Offer Price:</span>
                      <input
                        type="number"
                        value={packageRates.basiccamp.offer}
                        onChange={e => setPackageRates({
                          ...packageRates,
                          basiccamp: { ...packageRates.basiccamp, offer: Number(e.target.value) }
                        })}
                        className="w-24 px-2 py-1 rounded bg-slate-900 border border-amber-500 text-amber-300 font-mono font-bold text-right"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerToast('Basic Health Pack price updated ✓')}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save size={13} /> Save Package Price
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEBO FLEET & RIGHTS */}
          {activeTab === 'flebo' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Truck size={16} className="text-cyan-400" />
                    Phlebotomist (Flebo) Fleet Management & Operational Rights
                  </h3>
                  <p className="text-xs text-slate-400">
                    Control active field staff permissions: cash collection, sample cancellation, commission rates, and assigned Aligarh sectors.
                  </p>
                </div>

                <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>FlaboTrack GPS Engine: Active (3 Fleet Online)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {flebos.map(flebo => (
                  <div 
                    key={flebo.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    {/* Flebo Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{flebo.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            ★ {flebo.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{flebo.phone}</p>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        flebo.status === 'In Transit' 
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          : flebo.status === 'On Duty'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {flebo.status}
                      </span>
                    </div>

                    {/* Sector */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Territory Sector:</span>
                      <span className="text-slate-200 font-medium">{flebo.assignedSector}</span>
                    </div>

                    {/* Commission */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Base / Pickup</span>
                        <span className="font-mono font-bold text-cyan-400">₹{flebo.commission.basePerOrder}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">TAT &lt;30m Bonus</span>
                        <span className="font-mono font-bold text-emerald-400">+₹{flebo.commission.tatBonus}</span>
                      </div>
                    </div>

                    {/* Rights Checkbox Matrix */}
                    <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Active Permissions:</span>

                      <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                        <span>Collect Cash at Home</span>
                        <input
                          type="checkbox"
                          checked={flebo.rights.canCollectCash}
                          onChange={() => handleToggleFleboRight(flebo.id, 'canCollectCash')}
                          className="accent-cyan-500 w-4 h-4 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                        <span>Reschedule / Cancel Booking</span>
                        <input
                          type="checkbox"
                          checked={flebo.rights.canReschedule}
                          onChange={() => handleToggleFleboRight(flebo.id, 'canReschedule')}
                          className="accent-cyan-500 w-4 h-4 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                        <span>Vacutainer Emergency Override</span>
                        <input
                          type="checkbox"
                          checked={flebo.rights.canOverrideTubes}
                          onChange={() => handleToggleFleboRight(flebo.id, 'canOverrideTubes')}
                          className="accent-cyan-500 w-4 h-4 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                        <span>High-Frequency GPS Ping</span>
                        <input
                          type="checkbox"
                          checked={flebo.rights.highFreqGps}
                          onChange={() => handleToggleFleboRight(flebo.id, 'highFreqGps')}
                          className="accent-cyan-500 w-4 h-4 rounded"
                        />
                      </label>
                    </div>

                    {/* Today's Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>Completed Today: <strong className="text-white">{flebo.completedToday}</strong></span>
                      <span>Pending: <strong className="text-cyan-400">{flebo.pendingToday}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DAILY ORDERS & REVENUE */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Total Bookings Today</span>
                  <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">28</div>
                  <span className="text-[10px] text-emerald-400 font-mono">+18% vs Yesterday</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Cash Collected (Flebos)</span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">₹8,450</div>
                  <span className="text-[10px] text-slate-500 font-mono">14 Home Collections</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Online UPI / Razorpay</span>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono mt-1">₹14,900</div>
                  <span className="text-[10px] text-slate-500 font-mono">Auto Reconciled</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Under Dual Analyzers</span>
                  <div className="text-xl sm:text-2xl font-bold text-purple-400 font-mono mt-1">14</div>
                  <span className="text-[10px] text-purple-300 font-mono">Roche + Beckman</span>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Live Patient Collection Queue (Aligarh Hub)</span>
                  <span className="text-xs font-mono text-cyan-400">Auto-refresh: 15s</span>
                </h4>

                <div className="space-y-2">
                  {[
                    { id: 'DSD-2401', patient: 'Rajesh Sharma', phone: '+91 98971 23456', pkg: 'DSD Smart Health Advance', time: '08:30 AM', status: 'Sample Collected', flebo: 'Rahul Sharma', amount: 499, payment: 'Cash' },
                    { id: 'DSD-2402', patient: 'Meena Gupta', phone: '+91 94120 54321', pkg: 'Executive Full Body Screen', time: '09:00 AM', status: 'Under Analyzer', flebo: 'Amit Verma', amount: 999, payment: 'UPI' },
                    { id: 'DSD-2403', patient: 'Dr. Tariq Khan', phone: '+91 97580 98765', pkg: 'Basic Health Pack (Vital 4)', time: '09:45 AM', status: 'Report Sign-off', flebo: 'Rahul Sharma', amount: 299, payment: 'UPI' },
                  ].map(ord => (
                    <div key={ord.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-cyan-400">{ord.id}</span>
                        <div>
                          <div className="font-semibold text-white">{ord.patient} · <span className="text-slate-400 font-normal">{ord.pkg}</span></div>
                          <div className="text-[11px] text-slate-400 font-mono">{ord.phone} · Flebo: {ord.flebo}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-mono font-bold">₹{ord.amount} ({ord.payment})</span>
                        <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 font-mono text-[10.5px] font-bold border border-cyan-500/30">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LAB PROFILE & ANALYZERS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lab Info Card */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 size={16} className="text-cyan-400" />
                    Lab Facility & NABL Registry
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Lab Name</span>
                      <input 
                        type="text" 
                        defaultValue="Dr. Shastri Diagnostics (Central NABL Laboratory)" 
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Aligarh Central Address</span>
                      <input 
                        type="text" 
                        defaultValue="1246, Vidyanagar Colony, Ramghat Road, Aligarh, UP 202001" 
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">NABL Certificate Number</span>
                      <input 
                        type="text" 
                        defaultValue="NABL-MED-2024-DSD-9842 (ISO 15189:2022)" 
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Lab Director & Pathologist</span>
                      <input 
                        type="text" 
                        defaultValue="Dr. S. K. Shastri (MD Pathology, AIIMS Gold Medalist)" 
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerToast('Lab profile information saved ✓')}
                    className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save size={13} /> Save Lab Details
                  </button>
                </div>

                {/* Connected Analyzers Card */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity size={16} className="text-cyan-400" />
                    Connected 6-Sigma Automated Analyzers
                  </h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Roche Cobas e411 ECLIA', testType: 'Chemiluminescence (Thyroid, Vit D3, B12)', status: 'Online · Calibrated', ping: '1.2s' },
                      { name: 'Beckman Coulter DxC 700 AU', testType: 'Clinical Chemistry (LFT, KFT, Lipids)', status: 'Online · Calibrated', ping: '0.8s' },
                      { name: 'Sysmex XN-550', testType: '5-Part Differential Hematology (CBC)', status: 'Online · Calibrated', ping: '0.9s' },
                      { name: 'Bio-Rad D-10 HPLC', testType: 'Gold-Standard Glycated Hemoglobin (HbA1c)', status: 'Standby / Ready', ping: '1.5s' }
                    ].map((an, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-white block">{an.name}</span>
                          <span className="text-[11px] text-slate-400">{an.testType}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {an.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-3.5 px-6 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Aligarh Tenant Node: <strong>DSD-ALIGARH-01</strong></span>
            <span>·</span>
            <span>Universal LIMS Decoupled Bridge Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Tenant Portal
          </button>
        </div>

      </div>
    </div>
  );
};

export default TenantAdminWorkspace;
