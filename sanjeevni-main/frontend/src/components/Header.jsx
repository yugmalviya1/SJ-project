import React, { useState } from 'react';
import { ChevronDown, LogOut, KeyRound, User as UserIcon } from 'lucide-react';

export default function Header({ 
  user, 
  onSwitchRole, 
  ledgerHealth, 
  onRefreshAll, 
  isRefreshing, 
  backendOffline,
  activeTab,
  onNavigateTab,
  navItems = [],
  isLoggedIn = true,
  onLogout,
  onOpenLogin
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles = [
    { id: 'Doctor', label: 'Doctor (Dr. Robert Smith)' },
    { id: 'Patient', label: 'Patient (Rahul Sharma)' },
    { id: 'HospitalAdmin', label: 'Hospital Admin (Sarah Jenkins)' },
    { id: 'Auditor', label: 'Security Auditor (Alex Rivera)' },
    { id: 'PoliceEmergency', label: 'Police Investigator (Rajesh Kumar)' },
  ];

  const isChainValid = ledgerHealth?.chain_integrity_valid;

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '32px 0 24px 0',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'relative',
      zIndex: 50,
      gap: '24px',
      flexWrap: 'wrap'
    }}>
      
      {/* ─── Left Brand (Exact bb&b lowercase bold typography: sanjeevni) ─── */}
      <div 
        onClick={() => onNavigateTab('overview')}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          flexShrink: 0,
          userSelect: 'none'
        }}
      >
        <span style={{
          fontSize: '2.1rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#ffffff',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1,
          whiteSpace: 'nowrap'
        }}>
          sanjeevni
        </span>
      </div>

      {/* ─── Center Navigation (bb-b.net text links with active red underline) ─── */}
      {isLoggedIn && (
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  padding: '6px 0 8px 0',
                  borderBottom: isActive ? '2px solid var(--accent-red)' : '2px solid transparent',
                  transition: 'color 0.18s ease, border-color 0.18s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* ─── Right Controls: Role Selector, Status & Logout ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        
        {isLoggedIn ? (
          <>
            {/* Compact Role Switcher Pill */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: '#0a0a0a',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <span>Role: <strong>{user?.role || 'Doctor'}</strong></span>
                <ChevronDown size={13} color="var(--text-secondary)" />
              </button>

              {showRoleMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  background: '#0a0a0a',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  width: '230px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 100
                }}>
                  <div style={{ padding: '6px 10px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                    Switch Demo Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSwitchRole(r.id);
                        setShowRoleMenu(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        background: user?.role === r.id ? '#ffffff' : 'transparent',
                        color: user?.role === r.id ? '#000000' : 'var(--text-secondary)',
                        fontWeight: user?.role === r.id ? 700 : 500,
                        fontSize: '0.76rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '4px', paddingTop: '4px' }}>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenLogin();
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-red)',
                        fontWeight: 600,
                        fontSize: '0.76rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      + Open Full Role Portal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ledger Integrity Indicator */}
            <div 
              onClick={onRefreshAll}
              title={isChainValid ? "Ledger Verified • Click to sync" : "Syncing ledger..."}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 'var(--radius-pill)',
                background: '#090909',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span className={`dot ${isChainValid ? 'dot-green' : 'dot-red'}`} />
              <span style={{ color: '#ffffff' }}>{ledgerHealth?.total_blocks || 4} Blocks</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sign Out of Session"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-pill)',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-red)';
                e.currentTarget.style.borderColor = 'var(--accent-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          /* Sign In Button when logged out */
          <button
            onClick={onOpenLogin}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            <KeyRound size={14} style={{ marginRight: '6px' }} />
            <span>Sign In / Role Access</span>
          </button>
        )}

      </div>

    </header>
  );
}
