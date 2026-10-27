import React, { useState, useEffect } from 'react';
import UniversalLims, { LimsMode, ThirdPartyLimsConfig } from '../services/universalLimsAdapter';
import { 
  Crown, 
  Building2, 
  Palette, 
  Database, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Edit3, 
  Save, 
  Trash2, 
  RefreshCw, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Globe,
  Sliders,
  DollarSign,
  Calendar,
  Lock,
  Unlock,
  Check,
  MapPin,
  PhoneCall,
  Activity,
  Heart,
  Award,
  Zap,
  Truck,
  Microscope,
  UserCheck,
  FileText,
  SlidersHorizontal
} from 'lucide-react';

export interface NavTabItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  order: number;
  icon?: string;
  isSpecial?: 'portal' | 'tracking' | 'vitality' | 'link';
}

export interface LabTenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  city: string;
  adminEmail: string;
  phone: string;
  plan: 'Starter' | 'Professional' | 'Enterprise SaaS';
  status: 'Active' | 'Trial' | 'Expiring Soon' | 'Suspended';
  usersCount: number;
  monthlyRevenue: number;
  validUntil: string;
  features: {
    phleboTracking3D: boolean;
    whatsappCloudApi: boolean;
    nablPdfEngine: boolean;
    limsCoreBridge: boolean;
  };
}

export interface MasterCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  sampleType: string;
  fastingHours: number;
  tat: string;
  suggestedMrp: number;
  refRange: string;
}

export interface ThemeAppearanceSettings {
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  cardBgColor: string;
  cardDensity: 'compact' | 'comfortable' | 'spacious';
  cardRadius: 'sharp' | 'standard' | 'squircle' | 'pill';
  cardGlow: number; // 0 to 100
}

interface SuperAdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNavTabs?: NavTabItem[];
  onUpdateNavTabs: (tabs: NavTabItem[]) => void;
  cmsSettings?: any;
  onUpdateCmsSettings: (settings: any) => void;
}

const DEFAULT_PORTAL_NAV_TABS: NavTabItem[] = [
  { id: 'packages', label: 'Health Packages', href: '#packages', visible: true, order: 1, icon: 'Award' },
  { id: 'concerns', label: 'Health Concerns', href: '#organs', visible: true, order: 2, icon: 'Activity' },
  { id: 'patient-portal', label: 'Patient Portal & Reports', href: '#', isSpecial: 'portal', visible: true, order: 3, icon: 'FileText' },
  { id: 'track-phlebo', label: 'Track Phlebo 3D', href: '#', isSpecial: 'tracking', visible: true, order: 4, icon: 'Truck' },
  { id: 'vitality', label: 'Vitality AI ✨', href: '#vitality-score', isSpecial: 'vitality', visible: true, order: 5, icon: 'Sparkles' },
  { id: 'staff-portal', label: 'Staff Portal', href: '#', isSpecial: 'link', visible: true, order: 6, icon: 'ShieldCheck' },
];

const DEFAULT_THEME_APPEARANCE: ThemeAppearanceSettings = {
  primaryColor: '#00f0ff',
  accentColor: '#a855f7',
  surfaceColor: '#090d16',
  cardBgColor: '#0f172a',
  cardDensity: 'comfortable',
  cardRadius: 'standard',
  cardGlow: 40
};

const THEME_PALETTES = [
  {
    name: 'Cyber Cyan & Violet',
    primary: '#00f0ff',
    accent: '#a855f7',
    surface: '#090d16',
    card: '#0f172a'
  },
  {
    name: 'Emerald Bio & Mint',
    primary: '#10b981',
    accent: '#06b6d4',
    surface: '#061311',
    card: '#0c221e'
  },
  {
    name: 'Royal Amethyst & Gold',
    primary: '#8b5cf6',
    accent: '#f59e0b',
    surface: '#0f0a1e',
    card: '#1e1438'
  },
  {
    name: 'Sky Azure & Indigo',
    primary: '#38bdf8',
    accent: '#6366f1',
    surface: '#070f1e',
    card: '#0c1b33'
  },
  {
    name: 'Crimson Clinical & Rose',
    primary: '#f43f5e',
    accent: '#fb7185',
    surface: '#18070b',
    card: '#290c13'
  },
  {
    name: 'OLED Monolith Pure Dark',
    primary: '#38bdf8',
    accent: '#a855f7',
    surface: '#000000',
    card: '#0a0a0a'
  }
];

const AVAILABLE_ICONS: Record<string, React.ElementType> = {
  Crown,
  ShieldCheck,
  Microscope,
  Truck,
  Activity,
  Heart,
  Award,
  Zap,
  Sparkles,
  MapPin,
  Building2,
  UserCheck,
  PhoneCall,
  FileText
};

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  isOpen,
  onClose,
  currentNavTabs,
  onUpdateNavTabs,
  cmsSettings,
  onUpdateCmsSettings
}) => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'appearance' | 'cms' | 'seoGeo' | 'catalog' | 'limsGateway'>('appearance');
  const [limsMode, setLimsMode] = useState<LimsMode>(() => UniversalLims.getMode());
  
  // Theme & Appearance State
  const [theme, setTheme] = useState<ThemeAppearanceSettings>(() => {
    const saved = localStorage.getItem('dsd_theme_settings');
    return saved ? JSON.parse(saved) : DEFAULT_THEME_APPEARANCE;
  });

  // Nav Tabs State
  const [localTabs, setLocalTabs] = useState<NavTabItem[]>(() => {
    return currentNavTabs && currentNavTabs.length > 0 ? currentNavTabs : DEFAULT_PORTAL_NAV_TABS;
  });

  // Tab Edit state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabLabel, setEditingTabLabel] = useState('');
  const [editingTabIcon, setEditingTabIcon] = useState('Award');
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);

  // SEO & GEO State
  const [seoGeo, setSeoGeo] = useState(() => {
    const saved = localStorage.getItem('dsd_seo_geo');
    return saved ? JSON.parse(saved) : {
      metaTitle: 'Dr. Shastri Diagnostics (DSD) | Central NABL Lab & Home Blood Test Aligarh',
      metaDesc: 'Accredited NABL diagnostic lab in Aligarh. Same-day reports with dual MD Pathologist sign-off. Free home sample collection on Ramghat Road, Medical Road, and Centre Point.',
      keywords: 'blood test at home Aligarh, NABL lab Ramghat Road, HbA1c test Aligarh, full body checkup Aligarh, pathology lab near me, FlaboTrack Aligarh',
      geoLatitude: 27.8974,
      geoLongitude: 78.0880,
      geoRadiusKm: 15,
      whatsappNumber: '+919412345678',
      whatsappGreeting: 'Hello DSD Central Lab! I want to book a home blood sample collection in Aligarh.'
    };
  });

  // Copy CMS
  const [copyCms, setCopyCms] = useState(() => {
    const saved = localStorage.getItem('dsd_copy_cms');
    return saved ? JSON.parse(saved) : {
      heroHeadline: 'Advanced Diagnostic Intelligence at Your Doorstep',
      heroSubtitle: 'Aligarh’s Central NABL Lab with Roche & Beckman Coulter 6-Sigma Automated Analyzers. 30-Minute Home Phlebo Arrival with Cold-Chain Tracking.',
      emergencyBanner: '⚡ Urgent Home Pickup Available: Phlebo reaching Ramghat Road & Centre Point within 30 Mins',
      dualSignoffBadge: 'Central NABL Lab Aligarh · Dual MD Pathologist Sign-Off'
    };
  });

  // Tenants State
  const [tenants, setTenants] = useState<LabTenant[]>([
    {
      id: 'tenant-aligarh-01',
      name: 'Dr. Shastri Diagnostics (Central Lab)',
      slug: 'dsd-aligarh',
      domain: 'dsd.flabo.in',
      city: 'Aligarh, UP',
      adminEmail: 'dr.shastri@dsdlab.in',
      phone: '+91 94123 45678',
      plan: 'Enterprise SaaS',
      status: 'Active',
      usersCount: 14,
      monthlyRevenue: 185000,
      validUntil: '2027-12-31',
      features: {
        phleboTracking3D: true,
        whatsappCloudApi: true,
        nablPdfEngine: true,
        limsCoreBridge: true
      }
    },
    {
      id: 'tenant-mathura-02',
      name: 'City PathLabs & Imaging',
      slug: 'city-mathura',
      domain: 'mathura.flabo.in',
      city: 'Mathura, UP',
      adminEmail: 'director@citypathmathura.com',
      phone: '+91 98370 12345',
      plan: 'Professional',
      status: 'Active',
      usersCount: 8,
      monthlyRevenue: 92000,
      validUntil: '2026-11-30',
      features: {
        phleboTracking3D: true,
        whatsappCloudApi: true,
        nablPdfEngine: true,
        limsCoreBridge: false
      }
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync Theme Settings to Document Root
  const applyTheme = (newTheme: ThemeAppearanceSettings) => {
    setTheme(newTheme);
    localStorage.setItem('dsd_theme_settings', JSON.stringify(newTheme));
    
    // Inject CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', newTheme.primaryColor);
    root.style.setProperty('--brand-accent', newTheme.accentColor);
    root.style.setProperty('--card-radius', 
      newTheme.cardRadius === 'sharp' ? '6px' :
      newTheme.cardRadius === 'squircle' ? '18px' :
      newTheme.cardRadius === 'pill' ? '28px' : '12px'
    );
    root.style.setProperty('--card-density-padding',
      newTheme.cardDensity === 'compact' ? '0.75rem' :
      newTheme.cardDensity === 'spacious' ? '1.75rem' : '1.25rem'
    );

    if (onUpdateCmsSettings) {
      onUpdateCmsSettings({ ...cmsSettings, theme: newTheme });
    }
    showNotification('Theme appearance applied live ✓');
  };

  // Save SEO & GEO
  const saveSeoGeo = () => {
    localStorage.setItem('dsd_seo_geo', JSON.stringify(seoGeo));
    showNotification('Aligarh SEO, GEO coordinates and WhatsApp leads saved ✓');
  };

  // Save Copy CMS
  const saveCopyCms = () => {
    localStorage.setItem('dsd_copy_cms', JSON.stringify(copyCms));
    showNotification('Headlines and Card Copy updated ✓');
  };

  // Tab Reordering
  const handleMoveTab = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= localTabs.length) return;

    const updated = [...localTabs];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    // re-assign order property
    const normalized = updated.map((t, i) => ({ ...t, order: i + 1 }));
    setLocalTabs(normalized);
    onUpdateNavTabs(normalized);
    showNotification(`Tab order shifted ${direction} ✓`);
  };

  const handleToggleTabVisibility = (id: string) => {
    const updated = localTabs.map(t => t.id === id ? { ...t, visible: !t.visible } : t);
    setLocalTabs(updated);
    onUpdateNavTabs(updated);
    showNotification('Tab visibility toggled ✓');
  };

  const startEditTab = (tab: NavTabItem) => {
    setEditingTabId(tab.id);
    setEditingTabLabel(tab.label);
    setEditingTabIcon(tab.icon || 'Award');
  };

  const saveEditTab = (id: string) => {
    const updated = localTabs.map(t => {
      if (t.id === id) {
        return { ...t, label: editingTabLabel, icon: editingTabIcon };
      }
      return t;
    });
    setLocalTabs(updated);
    onUpdateNavTabs(updated);
    setEditingTabId(null);
    showNotification('Tab label & icon saved ✓');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Floating Notification */}
        {notification && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white font-bold text-xs shadow-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
              <Crown size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Super Admin SaaS Platform
                </h2>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-mono font-bold border border-violet-500/30">
                  Platform Owner (Full Rights)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Color Theme Engine · Card Scale & Density · Tab CMS · Aligarh SEO/GEO · Tenant Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Super Admin Portal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 sm:gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'appearance' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={16} />
            <span>Multi-Color & Card Styler</span>
            {activeTab === 'appearance' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cms')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'cms' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Tab & Copy CMS</span>
            {activeTab === 'cms' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seoGeo')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'seoGeo' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={16} />
            <span>Aligarh SEO, GEO & Leads</span>
            {activeTab === 'seoGeo' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'tenants' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 size={16} />
            <span>Tenant Labs SaaS ({tenants.length})</span>
            {activeTab === 'tenants' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'catalog' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database size={16} />
            <span>Universal Master Catalog</span>
            {activeTab === 'catalog' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('limsGateway')}
            className={`py-3 px-3 relative flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'limsGateway' ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={16} />
            <span>Universal LIMS Gateway</span>
            {activeTab === 'limsGateway' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: MULTI-COLOR & CARD STYLER */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              
              {/* Preset Theme Palettes */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette size={16} className="text-violet-400" />
                    Preset Color Themes (One-Click Switch)
                  </h3>
                  <span className="text-xs text-slate-400">All elements sync immediately</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {THEME_PALETTES.map((pal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTheme({
                        ...theme,
                        primaryColor: pal.primary,
                        accentColor: pal.accent,
                        surfaceColor: pal.surface,
                        cardBgColor: pal.card
                      })}
                      className="p-3 rounded-xl border border-slate-800 hover:border-violet-500/50 bg-slate-900 flex flex-col items-center gap-2 transition-all hover:scale-105 text-left"
                    >
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.primary }} />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.accent }} />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.card }} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-200 text-center leading-tight">
                        {pal.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Multi-Color Hex Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-violet-400" />
                    Granular Color Pickers (Any Hex / Any Hue)
                  </h4>
                  
                  <div className="space-y-3 text-xs">
                    {/* Primary Color */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-white font-semibold block">Primary Brand / Glow Color</span>
                        <span className="text-slate-400 text-[11px]">Headlines, primary action buttons, key badges</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.primaryColor}
                          onChange={e => applyTheme({ ...theme, primaryColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs text-slate-300 font-bold uppercase">{theme.primaryColor}</span>
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-white font-semibold block">Secondary Accent Color</span>
                        <span className="text-slate-400 text-[11px]">Special tabs, active indicator, tags</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.accentColor}
                          onChange={e => applyTheme({ ...theme, accentColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs text-slate-300 font-bold uppercase">{theme.accentColor}</span>
                      </div>
                    </div>

                    {/* Card Background Color */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-white font-semibold block">Card Surface Color</span>
                        <span className="text-slate-400 text-[11px]">Package cards & modals background tint</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.cardBgColor}
                          onChange={e => applyTheme({ ...theme, cardBgColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs text-slate-300 font-bold uppercase">{theme.cardBgColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Sizing, Density & Geometry */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-violet-400" />
                    Card Sizing Scale & Corner Geometry
                  </h4>

                  <div className="space-y-4 text-xs">
                    {/* Density / Scale */}
                    <div>
                      <span className="text-slate-400 block mb-1.5 font-medium">Card Layout Density</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['compact', 'comfortable', 'spacious'] as const).map(den => (
                          <button
                            key={den}
                            type="button"
                            onClick={() => applyTheme({ ...theme, cardDensity: den })}
                            className={`py-2 px-3 rounded-xl border text-center font-bold capitalize transition-colors ${
                              theme.cardDensity === den
                                ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {den}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Corner Radius */}
                    <div>
                      <span className="text-slate-400 block mb-1.5 font-medium">Card Corner Radius (Border Smoothness)</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'sharp', label: 'Sharp 6px' },
                          { id: 'standard', label: 'Standard 12px' },
                          { id: 'squircle', label: 'Squircle 18px' },
                          { id: 'pill', label: 'Pill 28px' }
                        ].map(rad => (
                          <button
                            key={rad.id}
                            type="button"
                            onClick={() => applyTheme({ ...theme, cardRadius: rad.id as any })}
                            className={`py-2 px-2 rounded-xl border text-center text-[11px] font-bold transition-colors ${
                              theme.cardRadius === rad.id
                                ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {rad.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Glow Intensity */}
                    <div>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span>Card Border & Shadow Glow</span>
                        <span className="font-mono font-bold text-violet-400">{theme.cardGlow}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={theme.cardGlow}
                        onChange={e => applyTheme({ ...theme, cardGlow: Number(e.target.value) })}
                        className="w-full accent-violet-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TAB & COPY CMS */}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              
              {/* Navigation Tab Customizer */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-violet-400" />
                      Live Navigation Tabs & Icons CMS
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rename tabs, change icons, reorder (Up/Down), or toggle visibility live across desktop and mobile.
                    </p>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 font-semibold border border-violet-500/30">
                    Live Client Sync Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {localTabs.map((tab, idx) => {
                    const isEditing = editingTabId === tab.id;
                    const IconComp = AVAILABLE_ICONS[tab.icon || 'Award'] || Award;

                    return (
                      <div 
                        key={tab.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        {/* Left: Drag / Order & Label */}
                        <div className="flex items-center gap-3 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
                            {idx + 1}
                          </span>

                          <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30">
                            <IconComp size={15} />
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 max-w-md">
                              <input
                                type="text"
                                value={editingTabLabel}
                                onChange={e => setEditingTabLabel(e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-violet-500 text-white text-xs font-semibold focus:outline-none w-full"
                                autoFocus
                              />
                              
                              {/* Icon Select dropdown */}
                              <select
                                value={editingTabIcon}
                                onChange={e => setEditingTabIcon(e.target.value)}
                                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                              >
                                {Object.keys(AVAILABLE_ICONS).map(icName => (
                                  <option key={icName} value={icName}>{icName}</option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => saveEditTab(tab.id)}
                                className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                                title="Save label"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTabId(null)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <b className="text-sm text-white font-semibold">{tab.label}</b>
                              <button
                                type="button"
                                onClick={() => startEditTab(tab)}
                                className="p-1 text-slate-400 hover:text-violet-400 transition-colors"
                                title="Rename tab & change icon"
                              >
                                <Edit3 size={13} />
                              </button>
                              <span className="text-[11px] text-slate-500 font-mono">({tab.href})</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Move & Visibility Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveTab(idx, 'up')}
                            disabled={idx === 0}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                            title="Move tab left/up in navbar"
                          >
                            <ArrowUp size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveTab(idx, 'down')}
                            disabled={idx === localTabs.length - 1}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                            title="Move tab right/down in navbar"
                          >
                            <ArrowDown size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleTabVisibility(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                              tab.visible
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {tab.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                            {tab.visible ? 'Visible' : 'Hidden'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Copy & Headline CMS */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 size={16} className="text-violet-400" />
                    Live Headlines, Subtitles & Card Copy CMS
                  </h4>
                  <button
                    type="button"
                    onClick={saveCopyCms}
                    className="py-1.5 px-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save size={13} /> Save All Copy
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Hero Main Headline</span>
                    <input
                      type="text"
                      value={copyCms.heroHeadline}
                      onChange={e => setCopyCms({ ...copyCms, heroHeadline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Dual Sign-Off Clinical Badge</span>
                    <input
                      type="text"
                      value={copyCms.dualSignoffBadge}
                      onChange={e => setCopyCms({ ...copyCms, dualSignoffBadge: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-slate-400 block mb-1 font-medium">Hero Subtitle & Clinical Technology Statement</span>
                    <textarea
                      rows={2}
                      value={copyCms.heroSubtitle}
                      onChange={e => setCopyCms({ ...copyCms, heroSubtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-slate-400 block mb-1 font-medium">Top Emergency Home Collection Banner</span>
                    <input
                      type="text"
                      value={copyCms.emergencyBanner}
                      onChange={e => setCopyCms({ ...copyCms, emergencyBanner: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ALIGARH SEO, GEO & LEADS */}
          {activeTab === 'seoGeo' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe size={16} className="text-violet-400" />
                    Aligarh Local SEO & Medical Schema Generator
                  </h3>
                  <button
                    type="button"
                    onClick={saveSeoGeo}
                    className="py-1.5 px-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save size={13} /> Save SEO & Leads Config
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Meta Browser Title</span>
                    <input
                      type="text"
                      value={seoGeo.metaTitle}
                      onChange={e => setSeoGeo({ ...seoGeo, metaTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Local Aligarh Target Keywords (Comma Separated)</span>
                    <input
                      type="text"
                      value={seoGeo.keywords}
                      onChange={e => setSeoGeo({ ...seoGeo, keywords: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-slate-400 block mb-1 font-medium">Meta Description (Rich Snippets for Google Search)</span>
                    <textarea
                      rows={2}
                      value={seoGeo.metaDesc}
                      onChange={e => setSeoGeo({ ...seoGeo, metaDesc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* GEO Coordinates & WhatsApp Lead Engine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GEO Coordinates */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin size={16} className="text-violet-400" />
                    GEO Targeting & Google Maps Coordinates
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">Latitude (Ramghat Rd)</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={seoGeo.geoLatitude}
                          onChange={e => setSeoGeo({ ...seoGeo, geoLatitude: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">Longitude</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={seoGeo.geoLongitude}
                          onChange={e => setSeoGeo({ ...seoGeo, geoLongitude: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Home Sample Pickup Radius (KM)</span>
                      <input
                        type="number"
                        value={seoGeo.geoRadiusKm}
                        onChange={e => setSeoGeo({ ...seoGeo, geoRadiusKm: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                      Google Local Pack Preview: <strong>Dr. Shastri Diagnostics · 1246, Vidyanagar Colony, Ramghat Road, Aligarh · 4.9 ★ (1,420+ Reviews)</strong>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Lead Routing Engine */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <PhoneCall size={16} className="text-violet-400" />
                    WhatsApp Lead Generation Engine
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Routing Phone Number (Include +91)</span>
                      <input
                        type="text"
                        value={seoGeo.whatsappNumber}
                        onChange={e => setSeoGeo({ ...seoGeo, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Auto Pre-Filled Inquiry Message</span>
                      <textarea
                        rows={2}
                        value={seoGeo.whatsappGreeting}
                        onChange={e => setSeoGeo({ ...seoGeo, whatsappGreeting: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                      <span>Live WhatsApp Lead Trigger:</span>
                      <span className="text-xs font-mono">1-Click Auto Dispatch Active</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TENANT MANAGEMENT */}
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 size={16} className="text-violet-400" />
                    Subscribed Diagnostic Labs (Multi-Tenant SaaS)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provision new client labs, control license validity, toggle 3D Phlebo tracking, and set monthly billing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showNotification('Onboard New Tenant Lab dialog opened')}
                  className="py-2 px-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Plus size={14} /> Onboard New Lab
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenants.map(t => (
                  <div key={t.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-bold border border-violet-500/30">
                          {t.plan}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{t.name}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{t.domain} · {t.city}</p>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                        {t.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Monthly Fee</span>
                        <span className="font-mono font-bold text-white">₹{t.monthlyRevenue.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Staff Accounts</span>
                        <span className="font-mono font-bold text-cyan-400">{t.usersCount} Active</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Valid Until</span>
                        <span className="font-mono text-slate-300">{t.validUntil}</span>
                      </div>
                    </div>

                    {/* Features enabled */}
                    <div className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span>3D Phlebo GPS Companion:</span>
                        <span className={t.features.phleboTracking3D ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {t.features.phleboTracking3D ? '✓ Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>WhatsApp Cloud API Dispatch:</span>
                        <span className={t.features.whatsappCloudApi ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {t.features.whatsappCloudApi ? '✓ Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>NABL Cryptographic PDF Engine:</span>
                        <span className={t.features.nablPdfEngine ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {t.features.nablPdfEngine ? '✓ Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: UNIVERSAL MASTER CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-violet-400" />
                  Universal Diagnostic Master Catalog (500+ Tests Baseline)
                </h3>
                <p className="text-xs text-slate-400">
                  Global repository of LOINC, CPT, sample tube guidelines, and reference ranges synced to all tenant labs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { code: 'CBC-01', name: 'Complete Blood Count (CBC)', dept: 'Hematology', tube: 'Lavender EDTA', tat: '4 Hours', mrp: 350 },
                    { code: 'LFT-01', name: 'Liver Function Panel (12)', dept: 'Biochemistry', tube: 'Gold SST Gel', tat: '5 Hours', mrp: 650 },
                    { code: 'KFT-01', name: 'Kidney Function Panel (10)', dept: 'Biochemistry', tube: 'Gold SST Gel', tat: '5 Hours', mrp: 600 },
                    { code: 'LIP-01', name: 'Lipid Profile Screen', dept: 'Biochemistry', tube: 'Gold SST Gel', tat: '5 Hours', mrp: 550 },
                    { code: 'GLU-01', name: 'HbA1c Glycated Glucose', dept: 'Endocrine', tube: 'Lavender EDTA', tat: '6 Hours', mrp: 500 },
                    { code: 'THY-01', name: 'TSH Ultrasensitive (3rd Gen)', dept: 'Immunology', tube: 'Gold SST Gel', tat: '6 Hours', mrp: 300 }
                  ].map(item => (
                    <div key={item.code} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-violet-400 font-bold">{item.code}</span>
                        <span className="text-slate-400 font-mono">₹{item.mrp}</span>
                      </div>
                      <strong className="text-white block">{item.name}</strong>
                      <span className="text-slate-400 block text-[11px]">{item.dept} · {item.tube}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: UNIVERSAL LIMS GATEWAY */}
          {activeTab === 'limsGateway' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap size={16} className="text-violet-400" />
                  Universal Decoupled LIMS Gateway (Plug & Play)
                </h3>
                <p className="text-xs text-slate-400">
                  Switch between GIA Standalone Core, Mock Adapter, or Third-Party LIMS (Health-One, Crelio, MocDoc) without recompiling.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { mode: 'gia_standalone', title: 'GIA LIMS Standalone Core', desc: 'Embedded Node.js engine with SQLite, ASTM-1394, Roche & Beckman drivers.', active: limsMode === 'gia_standalone' },
                  { mode: 'mock', title: 'Mock Simulation Adapter', desc: 'In-memory simulator for rapid prototyping and offline training.', active: limsMode === 'mock' },
                  { mode: 'third_party', title: 'External LIMS Bridge (ASTM/HL7)', desc: 'Connects to Health-One, CrelioHealth, or hospital HMIS via REST/HL7.', active: limsMode === 'third_party' }
                ].map(gw => (
                  <div key={gw.mode} className={`p-5 rounded-2xl border transition-colors ${
                    gw.active ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-white">{gw.title}</h4>
                      {gw.active && <CheckCircle2 size={16} className="text-violet-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{gw.desc}</p>
                    <button
                      type="button"
                      onClick={() => {
                        UniversalLims.setMode(gw.mode as LimsMode);
                        setLimsMode(gw.mode as LimsMode);
                        showNotification(`LIMS Gateway switched to ${gw.title} ✓`);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                        gw.active
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {gw.active ? 'Active Gateway' : 'Activate Gateway'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Platform SaaS Engine: <strong>HRGen Universal Multi-Tenant v2.4</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Super Admin Portal
          </button>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminPortal;
