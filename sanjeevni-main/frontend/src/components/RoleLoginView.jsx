import React, { useState } from 'react';
import { 
  Stethoscope, 
  User, 
  Building, 
  ShieldAlert, 
  Ambulance, 
  ArrowRight, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function RoleLoginView({ onLoginSuccess, currentRole }) {
  const [username, setUsername] = useState('dr_smith');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('Doctor');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Available pre-configured personas for one-click access
  const rolePortals = [
    {
      id: 'Doctor',
      username: 'dr_smith',
      title: 'Doctor Portal',
      persona: 'Dr. Robert Smith, MD',
      designation: 'Senior Cardiologist & Consultant',
      hospital: 'Apollo Multispecialty (HOSP-001)',
      icon: Stethoscope,
      accent: 'var(--accent-red)',
      badge: 'CLINICAL COMMAND',
      description: 'Access patient EHR charts, author clinical case sheets, review AI extracted reports, and execute emergency break-glass protocols.',
      capabilities: ['Full EHR Access', 'Case Sheet Authoring', 'AI Extraction Gate', 'Break-Glass Override']
    },
    {
      id: 'Patient',
      username: 'pat_rahul',
      title: 'Patient Sovereign Vault',
      persona: 'Rahul Sharma',
      designation: 'Patient Identifier: MRN-1002',
      hospital: 'Personal Sovereign Health Vault',
      icon: User,
      accent: '#3b82f6',
      badge: 'PATIENT SOVEREIGNTY',
      description: 'Own and control your health records. Grant time-limited scoped consent tokens to doctors and consult your private AI health assistant.',
      capabilities: ['Own Record Only', 'Grant / Revoke Consent', 'Personal AI Assistant', 'View Access Trail']
    },
    {
      id: 'HospitalAdmin',
      username: 'admin_sarah',
      title: 'Hospital Administration',
      persona: 'Sarah Jenkins',
      designation: 'Chief Health Administrator',
      hospital: 'Apollo Multispecialty (HOSP-001)',
      icon: Building,
      accent: '#10b981',
      badge: 'FACILITY OPERATIONS',
      description: 'Manage hospital-wide patient registries, doctor hospital affiliations, organizational consent compliance, and system health.',
      capabilities: ['Facility Patient Roster', 'Staff Affiliations', 'Consent Governance', 'System Health']
    },
    {
      id: 'Auditor',
      username: 'auditor_alex',
      title: 'Security & Forensic Auditor',
      persona: 'Alex Rivera',
      designation: 'Lead Healthcare Compliance Auditor',
      hospital: 'National Digital Health Audit Bureau',
      icon: ShieldAlert,
      accent: '#8b5cf6',
      badge: 'ZERO-TRUST AUDIT',
      description: 'Cryptographically verify the continuous SHA-256 blockchain ledger, detect out-of-band data tampering, and review all emergency break-glass logs.',
      capabilities: ['Ledger Hash Verification', 'Tamper Drift Engine', 'Forensic Audit Logs', 'Break-Glass Audit']
    },
    {
      id: 'PoliceEmergency',
      username: 'officer_kumar',
      title: 'Police & Law Enforcement',
      persona: 'Sub-Inspector Rajesh Kumar',
      designation: 'Investigating Officer (Traffic & Trauma)',
      hospital: 'State Police Department • Medico-Legal Cell',
      icon: Ambulance,
      accent: '#f59e0b',
      badge: 'RESTRICTED INCIDENT',
      description: 'Access verified accident and trauma incident dossiers tied to police FIR numbers with confidential medical history mathematically redacted.',
      capabilities: ['FIR Accident Dossier', 'Trauma & Blood Group', 'Strict Privacy Redaction', 'Chain of Custody']
    }
  ];

  const handleQuickRoleSelect = async (portal) => {
    setSelectedRole(portal.id);
    setUsername(portal.username);
    setPassword('password123');
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: portal.id })
      });

      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.access_token) {
            localStorage.setItem('medsecure_token', data.access_token);
            onLoginSuccess(data.user, portal.id);
            return;
          }
        }
      }
      throw new Error('Failed to switch role');
    } catch (err) {
      console.warn('Switch role error:', err);
      // Fallback offline mock user
      onLoginSuccess({
        username: portal.username,
        full_name: portal.persona,
        role: portal.id,
        patient_mrn: portal.id === 'Patient' ? 'MRN-1002' : null,
        doctor_id: portal.id === 'Doctor' ? 'DR-1001' : null
      }, portal.id);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.access_token) {
            localStorage.setItem('medsecure_token', data.access_token);
            onLoginSuccess(data.user, data.user.role);
            return;
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.detail || 'Invalid username or password.');
      }
    } catch (err) {
      console.warn('Login request failed:', err);
      // If backend happens to be unreachable, attempt demo switch
      handleQuickRoleSelect(rolePortals.find(p => p.id === selectedRole) || rolePortals[0]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '40px 20px 80px 20px'
    }}>
      
      {/* ─── Hero Header (bb-b.net style) ─── */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--accent-red)', letterSpacing: '0.18em' }}>
          Identity & Sovereign Access Control
        </span>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          marginTop: '8px',
          marginBottom: '16px'
        }}>
          Role-Based Access <span className="text-highlight">Portal</span>
        </h1>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: '740px',
          margin: '0 auto',
          lineHeight: 1.7
        }}>
          Select an authorized role portal below for instant access, or authenticate directly with institutional credentials. Each persona activates a dedicated, security-partitioned dashboard.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          maxWidth: '700px',
          margin: '0 auto 32px auto',
          padding: '14px 20px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#ff6b6b'
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMessage}</span>
        </div>
      )}

      {/* ─── 1. Instant Role Portals Grid ─── */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)'
          }}>
            1. Instant Role Portals (Select Persona)
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            One-click role activation with live seed data
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {rolePortals.map((portal) => {
            const Icon = portal.icon;
            const isSelected = selectedRole === portal.id;
            return (
              <div
                key={portal.id}
                onClick={() => handleQuickRoleSelect(portal)}
                style={{
                  background: isSelected ? '#111111' : '#080808',
                  border: isSelected ? `2px solid ${portal.accent}` : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = portal.accent;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isSelected ? portal.accent : 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header Strip */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '18px'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#141414',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <Icon size={22} color={portal.accent} />
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: portal.accent,
                      border: `1px solid ${portal.accent}33`
                    }}>
                      {portal.badge}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '4px'
                  }}>
                    {portal.title}
                  </h3>

                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '2px'
                  }}>
                    {portal.persona}
                  </div>

                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-tertiary)',
                    marginBottom: '14px'
                  }}>
                    {portal.designation}
                  </div>

                  <p style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: '20px'
                  }}>
                    {portal.description}
                  </p>

                  {/* Capabilities List */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '24px'
                  }}>
                    {portal.capabilities.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: '#121212',
                          color: '#ffffff',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action Button */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span className="mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    User: {portal.username}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: portal.accent
                  }}>
                    <span>Access Dashboard</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Manual Credential Login Card ─── */}
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        background: '#070707',
        border: '1px solid var(--border-mid)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 40px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <KeyRound size={22} color="var(--accent-red)" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Direct Credential Authentication
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Sign in with your assigned username and password
            </p>
          </div>
        </div>

        <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Role Authority
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                const newRole = e.target.value;
                setSelectedRole(newRole);
                const matching = rolePortals.find(p => p.id === newRole);
                if (matching) setUsername(matching.username);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: '#0f0f0f',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="Doctor">Doctor (Attending Physician & Surgeon)</option>
              <option value="Patient">Patient (Sovereign Health Vault)</option>
              <option value="HospitalAdmin">Hospital Administrator (Facility Management)</option>
              <option value="Auditor">Security Auditor (Cryptographic Ledger)</option>
              <option value="PoliceEmergency">Police & Law Enforcement (Accident FIR)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#0f0f0f',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#0f0f0f',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#0c0c0c',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.78rem',
            color: 'var(--text-tertiary)'
          }}>
            <span>Default Seed Password: <strong className="text-white">password123</strong></span>
            <span>Zero-Trust SHA-256 Enabled</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '8px',
              padding: '14px',
              fontWeight: 700
            }}
          >
            <span>{loading ? 'Authenticating Session...' : 'Authenticate & Open Dashboard →'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
