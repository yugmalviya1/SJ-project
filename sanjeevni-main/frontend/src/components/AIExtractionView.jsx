import React, { useState } from 'react';
import { 
  FileUp, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BrainCircuit, 
  FileText, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowRight,
  Database
} from 'lucide-react';

const PRESET_DOCUMENTS = [
  {
    id: 'cbc_preset',
    title: 'Rahul Sharma - Complete Blood Count (CBC)',
    badge: 'Lab Report',
    text: `METRO LABS & DIAGNOSTICS - CLINICAL REPORT
Patient: Rahul Sharma    Age: 34    Gender: Male    MRN: MRN-1002
Collection Date: 2026-01-20    Report Type: Complete Blood Count (CBC)
----------------------------------------------------------------
TEST NAME                RESULT       REFERENCE RANGE   UNIT
Hemoglobin               14.5         13.0 - 17.0       g/dL
WBC                      6800         4,500 - 11,000    /µL
Platelets                245000       150,000 - 450,000 /µL
Fasting Blood Glucose    138.0        70 - 99           mg/dL
HbA1c                    7.2          4.0 - 5.6         %

DIAGNOSIS:
Type 2 Diabetes Mellitus without complications (ICD-10: E11.9)

MEDICATIONS:
Metformin Hydrochloride 500mg Oral Twice Daily with meals
`
  },
  {
    id: 'discharge_preset',
    title: 'Vikram Malhotra - Emergency Discharge Summary',
    badge: 'Inpatient Summary',
    text: `APEX HEART INSTITUTE - DISCHARGE SUMMARY
Patient: Vikram Malhotra    Age: 58    Gender: Male    MRN: MRN-3008
Discharge Date: 2026-02-15    Report Type: DischargeSummary
----------------------------------------------------------------
Primary Diagnosis: Acute myocardial infarction, unspecified (I21.9)

Discharge Medications:
Aspirin 81 mg once daily
Atorvastatin 40 mg nightly

Key Laboratory at Discharge:
Troponin was recorded at 0.45 ng/mL (Ref: 0.00 - 0.04)
Serum Creatinine was recorded at 1.1 mg/dL (Ref: 0.7 - 1.3)

Hospital Course:
Patient presented with acute crushing substernal chest pressure. Coronary angiography completed. Stent deployed. Patient hemodynamically stable.
`
  },
  {
    id: 'thyroid_preset',
    title: 'Priya Patel - Endocrinology Outpatient Note',
    badge: 'Prescription',
    text: `METROPOLITAN ENDOCRINE CLINIC
Patient: Priya Patel    Age: 42    Gender: Female    MRN: MRN-2004
Date: 2026-02-10    Report Type: Prescription
----------------------------------------------------------------
Diagnosis:
Hypothyroidism, unspecified (E03.9)

Rx Medications:
Levothyroxine Sodium 50 mcg Oral once daily in morning before breakfast

Lab Results:
TSH was recorded at 6.8 uIU/mL (Ref: 0.4 - 4.0)

Advice:
Continue Levothyroxine. Repeat thyroid panel in 8 weeks.
`
  }
];

export default function AIExtractionView({ onApproveSuccess, role }) {
  const [inputText, setInputText] = useState(PRESET_DOCUMENTS[0].text);
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_DOCUMENTS[0].id);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccessInfo, setApprovalSuccessInfo] = useState(null);

  const handleSelectPreset = (doc) => {
    setSelectedPresetId(doc.id);
    setInputText(doc.text);
    setExtractionResult(null);
    setEditableData(null);
    setApprovalSuccessInfo(null);
  };

  const handleRunExtraction = async () => {
    setIsExtracting(true);
    setApprovalSuccessInfo(null);
    try {
      const token = localStorage.getItem('medsecure_token');
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ raw_text: inputText })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Extraction failed');
      }
      const data = await res.json();
      setExtractionResult(data);
      setEditableData(JSON.parse(JSON.stringify(data.extraction)));
    } catch (e) {
      alert('Extraction failed: ' + e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApproveAndAnchor = async () => {
    if (role === 'Patient' || role === 'Auditor') {
      alert('Restricted: Only Doctor or Hospital Admin can review and anchor medical records.');
      return;
    }

    setIsApproving(true);
    try {
      const token = localStorage.getItem('medsecure_token');
      const docId = extractionResult?.document_id || 'DOC-DEMO-' + Date.now().toString(36).toUpperCase();
      
      const res = await fetch('/api/ai/review-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_id: docId,
          approved_data: editableData
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Approval failed');
      }

      const data = await res.json();
      setApprovalSuccessInfo(data);
      if (onApproveSuccess) onApproveSuccess();
    } catch (e) {
      alert('Approval error: ' + e.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleUpdateField = (section, index, field, value) => {
    setEditableData(prev => {
      const next = { ...prev };
      if (Array.isArray(next[section])) {
        next[section] = [...next[section]];
        next[section][index] = { ...next[section][index], [field]: value };
      } else {
        next[section] = value;
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '32px', alignItems: 'start' }}>
      
      {/* ─── Left Column: Input Document & Presets ─── */}
      <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span className="eyebrow">NLP Ingestion Pipeline</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Clinical Source Text
            </h3>
            <span className="badge">FHIR R4B Parser</span>
          </div>
        </div>

        {/* Preset Selector */}
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Select Synthetic Preset
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESET_DOCUMENTS.map((doc) => {
              const isSelected = doc.id === selectedPresetId;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectPreset(doc)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: isSelected ? '#121212' : 'transparent',
                    border: isSelected ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                    {doc.title}
                  </span>
                  <span className="badge" style={{ fontSize: '0.62rem' }}>{doc.badge}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raw Text Input */}
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Raw Clinical Content
          </span>
          <textarea
            className="textarea mono"
            rows={12}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste clinical text, doctor notes, or pathology report..."
            style={{ width: '100%', resize: 'vertical', lineHeight: 1.6, fontSize: '0.8rem' }}
          />
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={handleRunExtraction}
          disabled={isExtracting || !inputText.trim()}
          style={{ width: '100%' }}
        >
          <BrainCircuit size={17} />
          <span>{isExtracting ? 'Analyzing Entities & Abnormalities...' : '↘ Extract Clinical Entities'}</span>
        </button>
      </div>

      {/* ─── Right Column: Review & Commit Panel ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {approvalSuccessInfo ? (
          <div className="card" style={{ padding: '36px', borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <CheckCircle2 size={24} color="var(--success)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Committed & Cryptographically Anchored
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.7 }}>
              {approvalSuccessInfo.message}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#050505', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span className="text-dim text-xs">Ledger Block Index</span>
                <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', marginTop: '4px' }}>
                  Block #{approvalSuccessInfo.ledger_block?.index}
                </div>
              </div>
              <div>
                <span className="text-dim text-xs">Patient MRN</span>
                <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', marginTop: '4px' }}>
                  {editableData?.patient_info?.mrn || 'MRN-1002'}
                </div>
              </div>
              <div>
                <span className="text-dim text-xs">Encounter Created</span>
                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem', marginTop: '4px' }}>
                  #{approvalSuccessInfo.encounter_id}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setApprovalSuccessInfo(null)}
              >
                <span>Extract Another Document</span>
              </button>
            </div>
          </div>
        ) : editableData ? (
          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="eyebrow">Clinical Verification</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px' }}>
                  Human-in-the-Loop Review
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Review and edit extracted values before committing to PostgreSQL and anchoring to Blockchain.
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleApproveAndAnchor}
                disabled={isApproving || role === 'Patient' || role === 'Auditor'}
              >
                <CheckCircle2 size={16} />
                <span>{isApproving ? 'Anchoring...' : '↘ Approve & Anchor into Ledger'}</span>
              </button>
            </div>

            {/* Abnormalities Banner */}
            {(extractionResult?.detected_anomalies?.length > 0 || extractionResult?.critical_flags?.length > 0) && (
              <div className="security-banner warn" style={{ padding: '12px 18px' }}>
                <AlertTriangle size={16} />
                <span>
                  Clinical Abnormalities : {(extractionResult.detected_anomalies || extractionResult.critical_flags).join(' • ')}
                </span>
              </div>
            )}

            {/* Patient Header Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#050505', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span className="text-dim text-xs">Patient</span>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff', marginTop: '2px' }}>{editableData.patient_info?.name || 'N/A'}</div>
              </div>
              <div>
                <span className="text-dim text-xs">MRN Target</span>
                <div className="mono" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>
                  {editableData.patient_info?.mrn || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-dim text-xs">Demographics</span>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{editableData.patient_info?.age}y, {editableData.patient_info?.gender}</div>
              </div>
              <div>
                <span className="text-dim text-xs">Report Type</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>{editableData.report_type}</div>
              </div>
            </div>

            {/* Diagnoses Section */}
            <div>
              <span className="eyebrow" style={{ marginBottom: '10px' }}>
                Diagnoses ({editableData.diagnoses?.length || 0})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editableData.diagnoses?.map((d, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', gap: '10px', alignItems: 'center' }}>
                    <input 
                      className="input mono text-xs" 
                      value={d.code} 
                      onChange={(e) => handleUpdateField('diagnoses', idx, 'code', e.target.value)}
                    />
                    <input 
                      className="input text-xs" 
                      value={d.description} 
                      onChange={(e) => handleUpdateField('diagnoses', idx, 'description', e.target.value)}
                    />
                    <select 
                      className="select text-xs" 
                      value={d.status}
                      onChange={(e) => handleUpdateField('diagnoses', idx, 'status', e.target.value)}
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROVISIONAL">PROVISIONAL</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Medications Section */}
            <div>
              <span className="eyebrow" style={{ marginBottom: '10px' }}>
                Medications ({editableData.medications?.length || 0})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editableData.medications?.map((m, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 140px', gap: '10px', alignItems: 'center' }}>
                    <input 
                      className="input text-xs" 
                      value={m.name} 
                      onChange={(e) => handleUpdateField('medications', idx, 'name', e.target.value)}
                    />
                    <input 
                      className="input text-xs" 
                      value={m.dosage} 
                      onChange={(e) => handleUpdateField('medications', idx, 'dosage', e.target.value)}
                    />
                    <input 
                      className="input text-xs" 
                      value={m.frequency} 
                      onChange={(e) => handleUpdateField('medications', idx, 'frequency', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Observations Section */}
            <div>
              <span className="eyebrow" style={{ marginBottom: '10px' }}>
                Lab Observations ({editableData.lab_results?.length || 0})
              </span>
              <table className="data-table" style={{ marginTop: '6px' }}>
                <thead>
                  <tr>
                    <th>Observation</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {editableData.lab_results?.map((l, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{l.name}</td>
                      <td>
                        <input 
                          className="input mono text-xs" 
                          style={{ width: '90px', padding: '6px 10px' }}
                          value={l.value} 
                          onChange={(e) => handleUpdateField('lab_results', idx, 'value', e.target.value)}
                        />
                      </td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{l.unit}</td>
                      <td className="mono" style={{ color: 'var(--text-tertiary)' }}>{l.reference_range}</td>
                      <td>
                        <span className={`badge ${
                          l.interpretation === 'CRITICAL' ? 'badge-red' : 
                          l.interpretation === 'HIGH' || l.interpretation === 'LOW' ? 'badge-yellow' : 'badge-green'
                        }`}>
                          {l.interpretation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ) : (
          <div className="card flex-center" style={{ padding: '90px 24px', flexDirection: 'column', gap: '14px' }}>
            <BrainCircuit size={40} color="var(--text-tertiary)" />
            <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Select a clinical document from the left and click "Extract Clinical Entities"
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
