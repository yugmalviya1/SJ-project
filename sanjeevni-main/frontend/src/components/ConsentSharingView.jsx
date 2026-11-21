import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Clock, 
  Plus, 
  Check, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

export default function ConsentSharingView({ user }) {
  const [grants, setGrants] = useState([]);
  const [directory, setDirectory] = useState({ doctors: [], hospitals: [] });
  const [loading, setLoading] = useState(true);
  const [grantType, setGrantType] = useState('DOCTOR');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedScope, setSelectedScope] = useState('FULL');
  const [reason, setReason] = useState('Outpatient routine consult and clinical history sharing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activeMrn = user?.patient_mrn || 'MRN-1002';

  const fetchGrantsAndDirectory = async () => {
    const token = localStorage.getItem('medsecure_token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    setLoading(true);
    try {
      const [grantsRes, dirRes] = await Promise.all([
        fetch('/api/consent/my-grants', { headers: authHeaders }),
        fetch('/api/consent/directory', { headers: authHeaders })
      ]);

      if (grantsRes.ok) {
        const text = await grantsRes.text();
        if (text) setGrants(JSON.parse(text));
      }
      if (dirRes.ok) {
        const text = await dirRes.text();
        if (text) {
          const dData = JSON.parse(text);
          setDirectory(dData);
          if (dData.doctors?.length > 0) {
            setSelectedTargetId(dData.doctors[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching consent info:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrantsAndDirectory();
  }, []);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    const token = localStorage.getItem('medsecure_token');

    try {
      const res = await fetch('/api/consent/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          patient_mrn: activeMrn,
          granted_to_type: grantType,
          granted_to_id: selectedTargetId,
          scope: selectedScope,
          reason: reason
        })
      });

      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        setFeedback({ type: 'success', text: data.message || 'Access grant created and anchored into ledger.' });
        fetchGrantsAndDirectory();
      } else {
        const text = await res.text();
        setFeedback({ type: 'error', text: text || 'Authorization failed' });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '32px' }}>
      
      {/* ─── Active Grants List ─── */}
      <div className="card" style={{ padding: '32px' }}>
        <span className="eyebrow">Patient Sovereignty</span>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px', marginBottom: '8px' }}>
          Data Sharing & Granular Consent
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          You retain sovereign control of your health records (<strong>{activeMrn}</strong>). Verify which doctors or healthcare facilities have active read permissions and revoke access at any time.
        </p>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading consent grants...</div>
        ) : grants.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: '#050505', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <AlertCircle size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active sharing authorizations found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {grants.map(g => (
              <div 
                key={g.id} 
                style={{ 
                  padding: '18px 20px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-subtle)',
                  background: '#060606',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                      {g.granted_to_name}
                    </span>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>
                      {g.granted_to_type}
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                      {g.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Scope : <strong style={{ color: '#ffffff' }}>{g.scope}</strong> • ID : {g.granted_to_id}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                    Reason : {g.reason}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                    <Clock size={13} />
                    {g.expires_at || 'Indefinite'}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>Anchored on Ledger</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Grant New Authorization ─── */}
      <div className="card" style={{ padding: '32px' }}>
        <span className="eyebrow">New Authorization</span>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px', marginBottom: '8px' }}>
          Authorize a Physician or Facility
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          Select a verified clinician or accredited hospital network to sign and issue an immutable data disclosure token.
        </p>

        {feedback && (
          <div className={`security-banner ${feedback.type === 'success' ? 'safe' : 'alert'}`} style={{ marginBottom: '20px' }}>
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleGrantAccess} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Target Entity Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className={`btn btn-sm ${grantType === 'DOCTOR' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setGrantType('DOCTOR');
                  if (directory.doctors?.length > 0) setSelectedTargetId(directory.doctors[0].id);
                }}
              >
                <UserCheck size={14} /> Licensed Doctor
              </button>
              <button
                type="button"
                className={`btn btn-sm ${grantType === 'HOSPITAL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setGrantType('HOSPITAL');
                  if (directory.hospitals?.length > 0) setSelectedTargetId(directory.hospitals[0].id);
                }}
              >
                <Building2 size={14} /> Hospital Facility
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {grantType === 'DOCTOR' ? 'Select Registered Physician' : 'Select Accredited Hospital'}
            </label>
            <select 
              className="select" 
              value={selectedTargetId} 
              onChange={e => setSelectedTargetId(e.target.value)}
              required
            >
              {grantType === 'DOCTOR' ? (
                directory.doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization}) — {d.id}
                  </option>
                ))
              ) : (
                directory.hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.id}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Disclosure Permission Scope
            </label>
            <select 
              className="select" 
              value={selectedScope} 
              onChange={e => setSelectedScope(e.target.value)}
            >
              <option value="FULL">FULL — Complete EHR, Laboratory Biomarkers & Clinical Case Sheets</option>
              <option value="SUMMARY_ONLY">SUMMARY ONLY — Active Diagnoses & Current Medication Regimen</option>
              <option value="ACCIDENT_ONLY">ACCIDENT ONLY — Emergency Trauma & Injury Findings Only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Clinical Purpose / Reason
            </label>
            <input 
              className="input" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="e.g. Second opinion consultation, routine follow-up"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={isSubmitting}
          >
            <FileCheck2 size={16} />
            <span>↘ Sign & Authorize Access Grant</span>
          </button>
        </form>
      </div>

    </div>
  );
}
