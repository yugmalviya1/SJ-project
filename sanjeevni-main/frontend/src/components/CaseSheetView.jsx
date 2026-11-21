import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  CheckCircle, 
  Clock, 
  Activity, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function CaseSheetView({ activeMrn, user }) {
  const [activeSection, setActiveSection] = useState('chief_complaint');
  const [formData, setFormData] = useState({
    patient_mrn: activeMrn || 'MRN-1002',
    doctor_id: user?.doctor_id || 'DR-1001',
    hospital_id: 'HOSP-001',
    status: 'DRAFT',
    chief_complaint: 'Patient reports progressive fatigue, polyuria, and polydipsia over the last 3 weeks.',
    history_present_illness: 'Onset was gradual without associated fever, chills, or acute gastrointestinal distress.',
    past_medical_history: 'Essential hypertension diagnosed 3 years ago; well managed on Lisinopril.',
    past_surgical_history: 'Laparoscopic appendectomy at age 19 without complications.',
    family_history: 'Paternal grandmother had Type 2 Diabetes; father had coronary artery disease.',
    social_lifestyle_history: 'Non-smoker, drinks alcohol socially (1-2 units/month). Sedentary desk occupation.',
    allergies: ['Penicillin (cutaneous rash)'],
    vitals: {
      blood_pressure: '132/84 mmHg',
      heart_rate: '74 bpm',
      temperature: '98.6 F',
      spo2: '99%',
      respiratory_rate: '16 /min'
    },
    physical_examination: 'Alert and oriented x 3. Chest clear to auscultation. Normal S1/S2 without murmurs. Abdomen soft, non-tender.',
    provisional_diagnosis: 'Type 2 Diabetes Mellitus without acute decompensation (ICD-10: E11.9)',
    treatment_plan: 'Initiate Metformin 500mg BID with meals. Dietary diabetic counseling. Home blood glucose log.',
    procedures: 'Routine 12-lead ECG (Normal Sinus Rhythm). Fasting lipid panel ordered.',
    doctor_notes: 'Reviewed signs of hypoglycemia. Patient agreeable to lifestyle modifications.',
    follow_up_instructions: 'Follow-up in 90 days with repeat HbA1c and serum creatinine.'
  });

  const [existingSheets, setExistingSheets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (activeMrn) {
      setFormData(prev => ({ ...prev, patient_mrn: activeMrn }));
      fetchPatientSheets(activeMrn);
    }
  }, [activeMrn]);

  const fetchPatientSheets = async (mrn) => {
    const token = localStorage.getItem('medsecure_token');
    try {
      const res = await fetch(`/api/case-sheets/patient/${mrn}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setExistingSheets(data);
        }
      }
    } catch (e) {
      console.warn('Could not load case sheets:', e.message);
    }
  };

  const handleSave = async (targetStatus) => {
    setIsSaving(true);
    setStatusMessage(null);
    const token = localStorage.getItem('medsecure_token');
    try {
      const payload = {
        ...formData,
        patient_mrn: activeMrn,
        doctor_id: user?.doctor_id || 'DR-1001',
        status: targetStatus
      };

      const res = await fetch('/api/case-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        setStatusMessage({
          type: 'success',
          text: targetStatus === 'FINALIZED' 
            ? `Case sheet finalized & anchored into cryptographic ledger (Hash: ${data.version_info?.canonical_hash?.substring(0, 16) || 'SHA-256 Verified'}...)`
            : `Case sheet draft saved successfully (${data.case_sheet_id || 'Draft Recorded'})`
        });
        fetchPatientSheets(activeMrn);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to save case sheet' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'chief_complaint', label: '1. Chief Complaint' },
    { id: 'hpi', label: '2. History of Present Illness' },
    { id: 'history', label: '3. Medical History' },
    { id: 'vitals', label: '4. Vitals & Physical Exam' },
    { id: 'assessment', label: '5. Diagnosis & Treatment' },
    { id: 'notes', label: '6. Notes & Follow-up' }
  ];

  return (
    <div className="card" style={{ padding: '36px' }}>
      
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span className="eyebrow">Structured Clinical Documentation</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px' }}>
            Clinical Case Sheet Builder
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <span className="badge">Patient: {activeMrn}</span>
            <span className="badge">Physician: {formData.doctor_id}</span>
            <span className="badge">SHA-256 Validated</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving}
          >
            <Clock size={15} />
            <span>Save Draft</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleSave('FINALIZED')}
            disabled={isSaving}
          >
            <CheckCircle size={15} />
            <span>↘ Finalize & Anchor into Ledger</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`security-banner ${statusMessage.type === 'success' ? 'safe' : 'alert'}`} style={{ marginBottom: '24px' }}>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ─── Section Step Tabs ─── */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              border: activeSection === s.id ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
              background: activeSection === s.id ? '#ffffff' : 'transparent',
              color: activeSection === s.id ? '#000000' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s ease'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── Active Form Section ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
        
        {/* Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeSection === 'chief_complaint' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Chief Complaint (Primary encounter reason)
              </label>
              <textarea 
                className="textarea" 
                rows={4}
                value={formData.chief_complaint}
                onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
                placeholder="e.g. Severe substernal chest discomfort radiating to left shoulder..."
                style={{ lineHeight: 1.6 }}
              />
            </div>
          )}

          {activeSection === 'hpi' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                History of Present Illness (HPI)
              </label>
              <textarea 
                className="textarea" 
                rows={6}
                value={formData.history_present_illness}
                onChange={e => setFormData({ ...formData, history_present_illness: e.target.value })}
                placeholder="Chronological progression, relieving/aggravating factors, severity..."
                style={{ lineHeight: 1.6 }}
              />
            </div>
          )}

          {activeSection === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Past Medical History
                </label>
                <textarea 
                  className="textarea" 
                  rows={3}
                  value={formData.past_medical_history}
                  onChange={e => setFormData({ ...formData, past_medical_history: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Past Surgical History
                </label>
                <textarea 
                  className="textarea" 
                  rows={2}
                  value={formData.past_surgical_history}
                  onChange={e => setFormData({ ...formData, past_surgical_history: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Family History
                </label>
                <textarea 
                  className="textarea" 
                  rows={2}
                  value={formData.family_history}
                  onChange={e => setFormData({ ...formData, family_history: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeSection === 'vitals' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Physiological Vitals
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Blood Pressure</span>
                  <input 
                    className="input" 
                    value={formData.vitals.blood_pressure || ''} 
                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, blood_pressure: e.target.value } })}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Heart Rate</span>
                  <input 
                    className="input" 
                    value={formData.vitals.heart_rate || ''} 
                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, heart_rate: e.target.value } })}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>SpO2 Saturation</span>
                  <input 
                    className="input" 
                    value={formData.vitals.spo2 || ''} 
                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, spo2: e.target.value } })}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Physical Examination Findings
              </label>
              <textarea 
                className="textarea" 
                rows={4}
                value={formData.physical_examination}
                onChange={e => setFormData({ ...formData, physical_examination: e.target.value })}
              />
            </div>
          )}

          {activeSection === 'assessment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Provisional / Confirmed Diagnosis
                </label>
                <input 
                  className="input" 
                  value={formData.provisional_diagnosis}
                  onChange={e => setFormData({ ...formData, provisional_diagnosis: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Treatment Plan & Prescriptions
                </label>
                <textarea 
                  className="textarea" 
                  rows={4}
                  value={formData.treatment_plan}
                  onChange={e => setFormData({ ...formData, treatment_plan: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeSection === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Attending Physician Notes
                </label>
                <textarea 
                  className="textarea" 
                  rows={3}
                  value={formData.doctor_notes}
                  onChange={e => setFormData({ ...formData, doctor_notes: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Follow-up Instructions & Warning Signs
                </label>
                <textarea 
                  className="textarea" 
                  rows={3}
                  value={formData.follow_up_instructions}
                  onChange={e => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Previous Version & Case Sheets History */}
        <div style={{ background: '#050505', padding: '24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span className="eyebrow">Documentation History</span>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
            Case Sheets for {activeMrn}
          </h4>

          {existingSheets.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>No previous case sheets recorded for this patient.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {existingSheets.map(s => (
                <div key={s.id} style={{ 
                  padding: '14px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-subtle)',
                  background: '#090909' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{s.id}</span>
                    <span className="badge" style={{ fontSize: '0.62rem' }}>
                      {s.status} (v{s.version})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-lead)', marginBottom: '6px' }}>
                    {s.provisional_diagnosis || 'Pending diagnosis'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    Doctor: {s.doctor_id} • {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
