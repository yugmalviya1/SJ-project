import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Ambulance, 
  FileBadge, 
  UserX, 
  CheckCircle, 
  Lock,
  Search,
  EyeOff
} from 'lucide-react';

export default function EmergencyPoliceView({ user }) {
  const [activeTab, setActiveTab] = useState(user?.role === 'PoliceEmergency' ? 'police' : 'break_glass');
  
  // Break-glass state
  const [targetMrn, setTargetMrn] = useState('MRN-3008');
  const [emergencyReason, setEmergencyReason] = useState('Critical highway trauma victim (unconscious, GCS 13/15). Immediate emergency cardiac and surgical resuscitation protocol.');
  const [breakGlassResult, setBreakGlassResult] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Police lookup state
  const [searchRef, setSearchRef] = useState('FIR-2026/089-VKN');
  const [policeData, setPoliceData] = useState(null);
  const [isSearchingPolice, setIsSearchingPolice] = useState(false);

  const handleBreakGlass = async (e) => {
    e.preventDefault();
    setIsAuthorizing(true);
    setErrorMsg(null);
    setBreakGlassResult(null);
    const token = localStorage.getItem('medsecure_token');

    try {
      const res = await fetch('/api/emergency/break-glass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_mrn: targetMrn,
          reason: emergencyReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBreakGlassResult(data);
      } else {
        setErrorMsg(data.detail || 'Break-glass authorization refused');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handlePoliceSearch = async (e) => {
    e.preventDefault();
    setIsSearchingPolice(true);
    setErrorMsg(null);
    setPoliceData(null);
    const token = localStorage.getItem('medsecure_token');

    try {
      const res = await fetch(`/api/emergency/police-report?ref=${encodeURIComponent(searchRef)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPoliceData(data);
      } else {
        setErrorMsg(data.detail || 'Report not found or unauthorized');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setIsSearchingPolice(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ─── Section Header (bb-b.net style) ─── */}
      <div className="section-header">
        <span className="section-eyebrow">Emergency Response & Protocol Overrides</span>
        <h2 className="section-title">Emergency Break-Glass & Incident Dossiers</h2>
        <p className="section-desc">
          Our zero-trust architecture ensures instantaneous emergency clinical clearance in life-threatening trauma situations, while creating an immutable forensic audit trail and legally restricting law enforcement access exclusively to accident-related records.
        </p>
      </div>

      {/* ─── Mode Switcher (bb-b.net pill tabs) ─── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'break_glass' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('break_glass')}
        >
          <Ambulance size={15} />
          <span>Emergency Break-Glass Protocol (Attending Physician)</span>
        </button>
        <button
          className={`btn ${activeTab === 'police' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('police')}
        >
          <FileBadge size={15} />
          <span>Restricted Police Accident Investigation View</span>
        </button>
      </div>

      {errorMsg && (
        <div className="security-banner alert" style={{ padding: '14px 20px' }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── Break-Glass Emergency Workflow ─── */}
      {activeTab === 'break_glass' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: '32px' }}>
          
          <div className="card" style={{ padding: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Emergency Override</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px', marginBottom: '8px' }}>
              Emergency Break-Glass Access Protocol
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Permits emergency physicians to override standard patient consent when a patient is unconscious, incapacitated, or presenting with acute cardiovascular collapse.
            </p>

            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--danger-border)',
              marginBottom: '24px',
              fontSize: '0.82rem',
              color: '#f87171',
              lineHeight: 1.6
            }}>
              <strong>FORENSIC AUDIT NOTICE :</strong> Every emergency break-glass action creates an immutable, cryptographically sealed record on the blockchain recording physician credentials, clinical justification, and accessed records.
            </div>

            <form onSubmit={handleBreakGlass} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Target Patient MRN Identifier
                </label>
                <input 
                  className="input" 
                  value={targetMrn} 
                  onChange={e => setTargetMrn(e.target.value)} 
                  placeholder="e.g. MRN-3008 (Vikram Malhotra)"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Emergency Justification & Clinical Rationale
                </label>
                <textarea 
                  className="textarea" 
                  rows={4}
                  value={emergencyReason} 
                  onChange={e => setEmergencyReason(e.target.value)} 
                  required
                  style={{ lineHeight: 1.6 }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                style={{ marginTop: '10px' }}
                disabled={isAuthorizing}
              >
                <Ambulance size={16} />
                <span>{isAuthorizing ? 'Authorizing Emergency Clearance...' : '↘ Authorize Emergency Break-Glass'}</span>
              </button>
            </form>
          </div>

          {/* Break Glass Result */}
          <div className="card" style={{ padding: '32px' }}>
            <span className="eyebrow">Decrypted Emergency Chart</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.015em' }}>
              Acute Trauma & Clinical Output
            </h4>

            {!breakGlassResult ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-tertiary)' }}>
                <Lock size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.88rem' }}>Awaiting emergency authorization submission...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="security-banner safe" style={{ padding: '10px 16px' }}>
                  <CheckCircle size={16} />
                  <span>Access Granted under Reference: <strong>{breakGlassResult.emergency_id}</strong></span>
                </div>

                <div style={{ background: '#050505', padding: '18px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    {breakGlassResult.patient.full_name}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Blood Group: <strong style={{ color: '#ffffff' }}>{breakGlassResult.patient.blood_group}</strong> • Emergency Contact: {breakGlassResult.patient.emergency_contact}
                  </div>
                </div>

                {breakGlassResult.accident_records?.map(acc => (
                  <div key={acc.id} style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#070707',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.84rem'
                  }}>
                    <div><strong>Incident :</strong> {acc.accident_type} ({acc.accident_time})</div>
                    <div><strong>Location :</strong> {acc.location}</div>
                    <div><strong>Police FIR Ref :</strong> {acc.police_report_ref}</div>
                    <div><strong>Injury Findings :</strong> {acc.injury_details}</div>
                    <div><strong>Administered Care :</strong> {acc.treatment_administered}</div>
                    <div><strong>Diagnostic Imaging :</strong> {acc.imaging_findings}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── Police Accident View ─── */}
      {activeTab === 'police' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '32px' }}>
          
          <div className="card" style={{ padding: '32px' }}>
            <span className="eyebrow">Judicial Inquiry</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px', marginBottom: '8px' }}>
              Law Enforcement Incident Query
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Police access is strictly partitioned by statutory law to vehicular accident verification and trauma reports. Unrelated patient medical history is entirely redacted.
            </p>

            <form onSubmit={handlePoliceSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  FIR / Incident Reference Number
                </label>
                <input 
                  className="input mono" 
                  value={searchRef} 
                  onChange={e => setSearchRef(e.target.value)} 
                  placeholder="e.g. FIR-2026/089-VKN"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={isSearchingPolice}>
                <Search size={15} />
                <span>{isSearchingPolice ? 'Searching Incident...' : '↘ Lookup Official Accident Dossier'}</span>
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <span className="eyebrow">Certified Record</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '18px', letterSpacing: '-0.015em' }}>
              Verified Accident Incident Dossier
            </h4>

            {!policeData ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-tertiary)' }}>
                <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.88rem' }}>Enter a verified FIR reference to load the official incident report.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  color: '#ffffff'
                }}>
                  Legal Authorization Scope : <strong>{policeData.access_scope}</strong>
                </div>

                <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '10px', background: '#050505', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div><strong>Police Station :</strong> {policeData.incident_details.police_station}</div>
                  <div><strong>FIR Number :</strong> <span className="mono">{policeData.incident_details.police_report_ref}</span></div>
                  <div><strong>Investigating Officer :</strong> {policeData.incident_details.investigating_officer}</div>
                  <div><strong>Incident Classification :</strong> {policeData.incident_details.accident_type}</div>
                  <div><strong>Date & Location :</strong> {policeData.incident_details.accident_time} at {policeData.incident_details.location}</div>
                  <div><strong>Injury Findings :</strong> {policeData.incident_details.injury_details}</div>
                  <div><strong>Admission Status :</strong> {policeData.incident_details.clinical_status}</div>
                </div>

                {/* Explicitly Blocked Medical History */}
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#040404',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <EyeOff size={16} color="var(--accent-red)" />
                    Legally Protected Confidential Clinical Records (Redacted)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Past Medical History : <strong>REDACTED (Protected Health Information)</strong></li>
                    <li>Routine Prescriptions : <strong>REDACTED (Protected Health Information)</strong></li>
                    <li>Psychiatric Notes & Consultations : <strong>REDACTED (Protected Health Information)</strong></li>
                  </ul>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
