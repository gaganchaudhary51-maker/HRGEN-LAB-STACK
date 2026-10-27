import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Microscope, 
  UserCheck, 
  KeyRound, 
  Lock, 
  ArrowRight, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  PhoneCall,
  Crown
} from 'lucide-react';

export type StaffRole = 'admin' | 'phlebo' | 'patho' | 'desk' | 'sales' | 'superadmin';

interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  badge: string;
}

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: StaffRole, user: StaffUser) => void;
}

const ROLES_CONFIG: Record<StaffRole, {
  label: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  demoPin: string;
  demoUser: string;
  color: string;
  glow: string;
}> = {
  superadmin: {
    label: 'Super Admin',
    title: 'SaaS Platform Owner (You)',
    desc: 'Full multi-tenant provisioning, live theme & color customizer, card sizing scale, tab CMS & Aligarh SEO/GEO leads engine',
    icon: Crown,
    demoPin: '9999',
    demoUser: 'HRGen SaaS Platform Owner (You)',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.35)'
  },
  admin: {
    label: 'Tenant Admin',
    title: 'Lab Owner / Director (Dr. S. K. Shastri)',
    desc: 'Local test prices, package bundle offers, phlebotomist fleet rights & commissions, and lab analyzer worklists',
    icon: ShieldCheck,
    demoPin: '1234',
    demoUser: 'Dr. S. K. Shastri (MD Pathology)',
    color: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.25)'
  },
  phlebo: {
    label: 'Phlebotomist',
    title: 'Fleet & Home Collection',
    desc: 'Sample pickups, GPS navigation, cold-chain logs & job status',
    icon: Truck,
    demoPin: '1234',
    demoUser: 'Rahul Sharma (Field Lead)',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)'
  },
  patho: {
    label: 'Pathologist',
    title: 'Laboratory Diagnostic Desk',
    desc: 'Sample verification, panic-value alerts & report sign-off',
    icon: Microscope,
    demoPin: '1234',
    demoUser: 'Dr. Ananya Verma (MD Path)',
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.25)'
  },
  desk: {
    label: 'Front Desk',
    title: 'Reception & Patient Triage',
    desc: 'Walk-in registration, WhatsApp report dispatch & billing',
    icon: UserCheck,
    demoPin: '1234',
    demoUser: 'Pooja Singh (Care Desk)',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  sales: {
    label: 'Field Sales Officer',
    title: 'B2B/B2C Medical Territory Desk',
    desc: 'Doctor clinic visits, MSL targets, DCR reports & field GPS verification',
    icon: Building2,
    demoPin: '1234',
    demoUser: 'Vikas Saxena (Territory Lead)',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.25)'
  }
};

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<StaffRole>('admin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentRole = ROLES_CONFIG[selectedRole];
  const IconComponent = currentRole.icon;

  const handleRoleSelect = (role: StaffRole) => {
    setSelectedRole(role);
    setError('');
    setPin('');
    setPassword('');
  };

  const handleQuickDemoFill = () => {
    setPin(currentRole.demoPin);
    setPassword('Admin@123456');
    setError('');
  };

  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const inputVal = authMode === 'pin' ? pin : password;
    if (!inputVal.trim()) {
      setError(authMode === 'pin' ? 'Please enter your 4-digit security PIN' : 'Please enter your account password');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // In production or test environment, PIN 1234 or 9999 or 0000 succeeds
      const expectedPin = currentRole.demoPin;
      if (authMode === 'pin' && pin !== expectedPin && pin !== '1234' && pin !== '9999' && pin !== '0000') {
        setError(`Incorrect PIN. (Use Demo PIN: ${expectedPin})`);
        setIsSubmitting(false);
        return;
      }

      const user: StaffUser = {
        id: `DSD-${selectedRole.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        name: currentRole.demoUser,
        role: selectedRole,
        title: currentRole.title,
        badge: selectedRole === 'superadmin' ? 'Platform Owner' : (selectedRole === 'admin' ? 'Lab Director' : 'Staff Verified')
      };

      setIsSubmitting(false);
      onSuccess(selectedRole, user);
      onClose();
    }, 350);
  };

  return (
    <div className="staffAuthOverlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div 
        className="staffAuthCard" 
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: `0 30px 100px rgba(0, 0, 0, 0.8), 0 0 40px ${currentRole.glow}`
        }}
      >
        {/* Header Bar */}
        <div className="staffAuthHead">
          <div className="staffAuthBrand">
            <div className="staffAuthLogo">
              <span>DSD</span>
              <small>+</small>
            </div>
            <div>
              <div className="staffAuthEyebrow">
                <span className="livePulseDot" />
                NABL ACCREDITED CLINICAL SUITE
              </div>
              <h3>Control Center Authentication</h3>
            </div>
          </div>
          <button 
            type="button" 
            className="staffAuthCloseBtn" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="staffRoleGrid">
          {(Object.keys(ROLES_CONFIG) as StaffRole[]).map((r) => {
            const cfg = ROLES_CONFIG[r];
            const RoleIcon = cfg.icon;
            const isActive = selectedRole === r;
            return (
              <button
                key={r}
                type="button"
                className={`staffRoleBtn ${isActive ? 'active' : ''}`}
                onClick={() => handleRoleSelect(r)}
                style={{
                  borderColor: isActive ? cfg.color : undefined,
                  background: isActive ? `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))` : undefined
                }}
              >
                <div 
                  className="roleIconWrap" 
                  style={{ 
                    backgroundColor: isActive ? cfg.color : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#ffffff' : '#94a3b8' 
                  }}
                >
                  <RoleIcon size={16} />
                </div>
                <div className="roleLabelWrap">
                  <span className="roleName">{cfg.label}</span>
                  <small className="roleSubtitle">{r.toUpperCase()}</small>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Role Description Banner */}
        <div 
          className="activeRoleBanner"
          style={{ borderLeftColor: currentRole.color }}
        >
          <div className="bannerIcon">
            <IconComponent size={20} style={{ color: currentRole.color }} />
          </div>
          <div>
            <h4>{currentRole.title}</h4>
            <p>{currentRole.desc}</p>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuthenticate} className="staffAuthForm">
          {/* Mode Switcher */}
          <div className="authModeToggle">
            <button
              type="button"
              className={authMode === 'pin' ? 'active' : ''}
              onClick={() => { setAuthMode('pin'); setError(''); }}
            >
              <KeyRound size={14} /> Quick PIN Login
            </button>
            <button
              type="button"
              className={authMode === 'password' ? 'active' : ''}
              onClick={() => { setAuthMode('password'); setError(''); }}
            >
              <Lock size={14} /> Enterprise Password
            </button>
          </div>

          {authMode === 'pin' ? (
            <div className="inputGroup">
              <label htmlFor="staffPin">
                Enter 4-Digit Security PIN
                <span className="demoHint">(Default: <b>1234</b>)</span>
              </label>
              <div className="pinInputWrapper">
                <input
                  id="staffPin"
                  type="password"
                  maxLength={6}
                  placeholder="• • • •"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
                  className="staffPinInput"
                />
              </div>
            </div>
          ) : (
            <div className="inputGroup">
              <label htmlFor="staffPass">
                Staff Password
                <span className="demoHint">(Default: <b>Admin@123456</b>)</span>
              </label>
              <input
                id="staffPass"
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="staffTextInput"
              />
            </div>
          )}

          {error && (
            <div className="authErrorBanner">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="authActionRow">
            <button
              type="button"
              className="quickFillBtn"
              onClick={handleQuickDemoFill}
            >
              <Sparkles size={14} /> Fill Demo PIN (1234)
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="authSubmitBtn"
              style={{
                background: `linear-gradient(135deg, ${currentRole.color}, #078b83)`
              }}
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Enter {currentRole.label} Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Security Badges */}
        <div className="staffAuthFooter">
          <div className="securityBadge">
            <CheckCircle2 size={13} className="textEmerald" />
            <span>ISO 15189:2022 Ready</span>
          </div>
          <div className="securityBadge">
            <Building2 size={13} className="textCyan" />
            <span>Aligarh Lab Node #1246</span>
          </div>
          <div className="securityBadge">
            <PhoneCall size={13} className="textTeal" />
            <span>Emergency Help: +91 92588 88085</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAuthModal;
