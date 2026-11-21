import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  HeartPulse, 
  Pill, 
  FlaskConical, 
  Calendar, 
  RotateCcw, 
  Zap, 
  Lock, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Hash, 
  Search
} from 'lucide-react';

export default function PatientEHRView({ 
  patients = [], 
  activeMrn, 
  onSelectPatient, 
  patientDetails, 
  loading, 
  onTamper, 
  onRestore, 
  role 
}) {
  const [tamperField, setTamperField] = useState('diagnosis');
  const [tamperValue, setTamperValue] = useState('Stage 4 Metastatic Sarcoma [MALICIOUS_DB_INJECTION]');
  const [isTampering, setIsTampering] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showHashDetails, setShowHashDetails] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      await onTamper(activeMrn, tamperField, tamperValue);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await onRestore(activeMrn);
    } finally {
      setIsRestoring(false);
    }
  };

  const integrity = patientDetails?.integrity;
  const isTampered = integrity?.verified === false;
  const isVerified = integrity?.verified === true;

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.mrn?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', alignItems: 'start' }}>
      
      {/* ─── Left Column: Scoped Patient Directory ─── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span className="eyebrow">Anchored Clinical Registry</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Patient Roster
            </h3>
            <span className="badge">{patients.length} scoped</span>
          </div>
        </div>

        {/* Directory Search */}
        {patients.length > 2 && (
          <div className="input-group" style={{ marginBottom: '14px' }}>
            <Search size={14} className="input-icon" />
            <input 
              className="input" 
              placeholder="Search by name or MRN..." 
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ padding: '9px 12px 9px 38px', fontSize: '0.82rem' }}
            />
          </div>
        )}

        {role === 'Patient' && (
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.08)', 
            border: '1px solid var(--warning-border)', 
            padding: '10px 14px', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '0.78rem', 
            color: '#fbbf24',
            marginBottom: '14px'
          }}>
            🔒 <strong>Strict RBAC:</strong> Restricted exclusively to your patient identity.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
          {filteredPatients.map((p) => {
            const isSelected = p.mrn === activeMrn;
            return (
              <div
                key={p.mrn}
                onClick={() => onSelectPatient(p.mrn)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isSelected ? '#121212' : 'transparent',
                  border: isSelected ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                    {p.full_name}
                  </span>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {p.mrn}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                  <span>{p.gender} • {p.age} yrs</span>
                  <span>{p.encounters_count || 1} encounters</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Right Column: EHR Chart with In-Line Ledger Integrity ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div className="card flex-center" style={{ padding: '80px 24px', flexDirection: 'column', gap: '14px' }}>
            <div className="spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#ffffff' }}></div>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Auditing blockchain continuity & decrypting clinical record...</span>
          </div>
        ) : patientDetails ? (
          <>
            {/* Patient Header & Integrated Blockchain Verification Banner */}
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <span className="eyebrow">Sovereign Health Chart</span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '4px' }}>
                    {patientDetails.full_name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <span className="badge">{patientDetails.mrn}</span>
                    <span className="badge">FHIR R4B</span>
                    <span className="badge">Immutable Anchor</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '14px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>Demographics : <strong style={{ color: '#fff' }}>{patientDetails.gender}, {patientDetails.age} yrs</strong></div>
                    <div>Encounters : <strong style={{ color: '#fff' }}>{patientDetails.encounters?.length || 0}</strong></div>
                    <div>Documents : <strong style={{ color: '#fff' }}>{patientDetails.documents?.length || 0}</strong></div>
                  </div>
                </div>

                {/* Integrated Blockchain Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {isTampered ? (
                    <div className="security-banner alert" style={{ padding: '8px 16px' }}>
                      <AlertOctagon size={16} />
                      <span>Tamper Detected in DB</span>
                    </div>
                  ) : isVerified ? (
                    <div className="security-banner safe" style={{ padding: '8px 16px' }}>
                      <CheckCircle2 size={16} />
                      <span>Ledger Verified (Block #{integrity?.block_index ?? 1})</span>
                    </div>
                  ) : (
                    <div className="security-banner" style={{ padding: '8px 16px' }}>
                      <span>Pending Anchor</span>
                    </div>
                  )}

                  {role !== 'Patient' && (
                    <button 
                      className={`btn btn-sm ${showSandbox ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => setShowSandbox(!showSandbox)}
                      title="Toggle Security Tamper Simulation"
                    >
                      <Zap size={13} />
                      {showSandbox ? 'Close Sandbox' : 'Simulate Tamper'}
                    </button>
                  )}
                </div>
              </div>

              {/* Cryptographic Hash Verification Accordion */}
              {integrity && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div 
                    onClick={() => setShowHashDetails(!showHashDetails)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color: isTampered ? 'var(--danger)' : 'var(--text-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Hash size={14} />
                      <span>
                        {isTampered 
                          ? '⚠️ Cryptographic Mismatch : Live Database SHA-256 differs from Blockchain Ledger Anchor'
                          : '✓ Real-time SHA-256 Continuity : Live Database snapshot perfectly matches Immutable Block'}
                      </span>
                    </div>
                    {showHashDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {showHashDetails && (
                    <div style={{ 
                      marginTop: '14px', 
                      background: '#040404', 
                      padding: '16px 20px', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '16px' 
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                          Anchored Block Hash (Block #{integrity.block_index})
                        </span>
                        <div className="mono text-xs" style={{ color: '#ffffff', wordBreak: 'break-all', marginTop: '6px' }}>
                          {integrity.expected_hash}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                          Live Database Calculated SHA-256
                        </span>
                        <div className="mono text-xs" style={{ 
                          color: isTampered ? 'var(--danger)' : 'var(--success)', 
                          wordBreak: 'break-all', 
                          marginTop: '6px', 
                          fontWeight: 700 
                        }}>
                          {integrity.actual_hash}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Sandbox for Tamper Simulation */}
            {showSandbox && role !== 'Patient' && (
              <div className="card" style={{ padding: '24px', borderColor: 'var(--danger-border)', background: 'rgba(239, 68, 68, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={18} color="var(--danger)" />
                  <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                    Security Sandbox : Direct SQL Database Mutation
                  </strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                  Simulate an out-of-band malicious SQL mutation bypassing the application layer. The cryptographic ledger detects the state corruption immediately.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto auto', gap: '12px', alignItems: 'center' }}>
                  <select 
                    className="select" 
                    value={tamperField} 
                    onChange={(e) => {
                      setTamperField(e.target.value);
                      if (e.target.value === 'diagnosis') setTamperValue('Stage 4 Metastatic Sarcoma [MALICIOUS_DB_INJECTION]');
                      else if (e.target.value === 'lab_value') setTamperValue('999.0');
                      else setTamperValue('Hacked Identity Entity');
                    }}
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="diagnosis">Field: Diagnosis</option>
                    <option value="lab_value">Field: Lab Observation</option>
                    <option value="patient_name">Field: Patient Name</option>
                  </select>

                  <input 
                    className="input mono" 
                    value={tamperValue} 
                    onChange={(e) => setTamperValue(e.target.value)}
                    placeholder="Enter tampered value..."
                    style={{ fontSize: '0.82rem' }}
                  />

                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={handleSimulateTamper}
                    disabled={isTampering}
                  >
                    <Zap size={13} />
                    {isTampering ? 'Injecting...' : 'Inject Tamper'}
                  </button>

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleRestore}
                    disabled={isRestoring}
                  >
                    <RotateCcw size={13} />
                    Restore Clean
                  </button>
                </div>
              </div>
            )}

            {/* Encounters & Clinical Entities */}
            {patientDetails.encounters?.map((enc, idx) => (
              <div key={enc.id || idx} className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span className="eyebrow">Clinical Encounter</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                        Encounter #{enc.id}: {enc.encounter_type}
                      </span>
                      <span className="badge">{enc.encounter_date}</span>
                      <span className="badge badge-green">{enc.status}</span>
                    </div>
                  </div>
                  {enc.notes && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{enc.notes}"
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  
                  {/* Diagnoses Card */}
                  <div style={{ background: '#050505', padding: '18px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <HeartPulse size={16} color="var(--accent-red)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Diagnoses (ICD-10)
                      </span>
                    </div>
                    {enc.diagnoses?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {enc.diagnoses.map((d) => (
                          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a', padding: '10px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                            <div>
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700, marginRight: '10px', fontSize: '0.8rem' }}>
                                {d.code}
                              </span>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-lead)' }}>
                                {d.description}
                              </span>
                            </div>
                            <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>{d.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>No diagnoses recorded.</p>
                    )}
                  </div>

                  {/* Medications Card */}
                  <div style={{ background: '#050505', padding: '18px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Pill size={16} color="#ffffff" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Prescribed Medications
                      </span>
                    </div>
                    {enc.medications?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {enc.medications.map((m) => (
                          <div key={m.id} style={{ background: '#0a0a0a', padding: '10px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.84rem', color: '#ffffff' }}>{m.name}</strong>
                              <span className="badge" style={{ fontSize: '0.65rem' }}>{m.dosage}</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {m.frequency} • {m.route} {m.duration ? `• ${m.duration}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>No medications active.</p>
                    )}
                  </div>

                </div>

                {/* Lab Results Table */}
                {enc.lab_results?.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <FlaskConical size={16} color="var(--text-secondary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Laboratory Observations & Anchored Biomarkers
                      </span>
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Biomarker Test</th>
                          <th>Recorded Value</th>
                          <th>Unit</th>
                          <th>Reference Range</th>
                          <th>Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enc.lab_results.map((l) => {
                          const isCritical = l.interpretation === 'CRITICAL';
                          const isWarn = l.interpretation === 'HIGH' || l.interpretation === 'LOW';
                          return (
                            <tr key={l.id}>
                              <td style={{ fontWeight: 600, color: '#ffffff' }}>{l.test_name}</td>
                              <td className="mono" style={{ 
                                fontWeight: 700, 
                                color: isCritical ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--success)' 
                              }}>
                                {l.value}
                              </td>
                              <td style={{ color: 'var(--text-tertiary)' }}>{l.unit}</td>
                              <td className="mono" style={{ color: 'var(--text-tertiary)' }}>{l.reference_range}</td>
                              <td>
                                <span className={`badge ${
                                  isCritical ? 'badge-red' : isWarn ? 'badge-yellow' : 'badge-green'
                                }`}>
                                  {l.interpretation}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            ))}
          </>
        ) : (
          <div className="card flex-center" style={{ padding: '80px 24px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Select a patient from the roster to inspect their immutable medical chart.</p>
          </div>
        )}
      </div>

    </div>
  );
}
