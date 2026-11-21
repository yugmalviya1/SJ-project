import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Header({ 
  user, 
  onSwitchRole, 
  ledgerHealth, 
  onRefreshAll, 
  isRefreshing, 
  backendOffline,
  activeTab,
  onNavigateTab,
  navItems = []
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles = [
    { id: 'Doctor', label: 'Doctor (Dr. Smith)' },
    { id: 'Patient', label: 'Patient (Rahul Sharma)' },
    { id: 'HospitalAdmin', label: 'Hospital Admin' },
    { id: 'Auditor', label: 'Security Auditor' },
    { id: 'PoliceEmergency', label: 'Police Investigator' },
  ];

  const isChainValid = ledgerHealth?.chain_integrity_valid;

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '36px 0 28px 0',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'relative',
      zIndex: 50,
      gap: '32px'
    }}>
      
      {/* ─── Left Brand (Exact bb&b lowercase bold typography: sanjeevni) ─── */}
      <div 
        onClick={() => onNavigateTab('overview')}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
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
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
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
                fontSize: '0.92rem',
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

      {/* ─── Right Controls: Role Selector, Status & Language ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
        
        {/* Compact Role Switcher Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: 'var(--radius-pill)',
              background: '#0a0a0a',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              fontSize: '0.8rem',
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
              width: '210px',
              boxShadow: 'var(--shadow-md)',
              zIndex: 100
            }}>
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
                    fontSize: '0.78rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {r.label}
                </button>
              ))}
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
            cursor: 'pointer'
          }}
        >
          <span className={`dot ${isChainValid ? 'dot-green' : 'dot-red'}`} />
          <span style={{ color: '#ffffff' }}>{ledgerHealth?.total_blocks || 4} Blocks</span>
        </div>
      </div>

    </header>
  );
}
