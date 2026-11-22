import React from 'react';
import { 
  Stethoscope, 
  User, 
  Building, 
  ShieldAlert, 
  Ambulance, 
  Link2, 
  BrainCircuit, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Lock, 
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck
} from 'lucide-react';

export default function RoleDashboardView({ 
  user, 
  onNavigateTab, 
  patients = [], 
  activeMrn, 
  onSelectPatient,
  ledgerHealth,
  auditSummary
}) {
  const role = user?.role || 'Doctor';

  // ─────────────────────────────────────────────────────────────
  // 1. DOCTOR CLINICAL DASHBOARD
  // ─────────────────────────────────────────────────────────────
  if (role === 'Doctor') {
    return (
      <div className="animate-fade-in">
        {/* Doctor Hero */}
        <section className="editorial-hero">
          <div className="editorial-hero-left">
            <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>
              Clinical Operations & Inpatient Care
            </span>
            <h1 className="headline-xl">
              Doctor <span className="text-highlight">Command Center</span>
            </h1>
            <p className="editorial-lead">
              Welcome, <strong className="text-white">{user?.full_name || 'Dr. Robert Smith, MD'}</strong>. You have full clinical authority over assigned patients, diagnostic charts, AI document extraction, and life-critical emergency break-glass protocols.
            </p>

            <div className="telemetry-strip">
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>{patients.length} Assigned Patients</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Continuous Ledger Continuous</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-red" />
                <span>Break-Glass Armed</span>
              </div>
            </div>
          </div>

          <div className="editorial-hero-right">
            <p className="editorial-body">
              All clinical mutations, prescriptions, and case sheet revisions are cryptographically fingerprinted with SHA-256 and anchored directly into the blockchain ledger upon your explicit approval.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="highlight-box">
                <strong>Active Hospital Affiliation</strong>
                <span>Senior Attending Cardiologist • <b>Apollo Multispecialty Hospital (HOSP-001)</b></span>
              </div>
              <div className="highlight-box">
                <strong>Clinician-in-the-Loop Safeguard</strong>
                <span>AI extracted lab reports remain <b>draft proposals</b> until you review and commit them to the EHR.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigateTab('patients')}>
                <span>↘ View Patient Records</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigateTab('case_sheet')}>
                <span>→ Open Case Sheet Builder</span>
              </button>
            </div>
          </div>
        </section>

        {/* Quick Patient Selector Strip */}
        <div style={{
          marginBottom: '48px',
          padding: '24px 28px',
          background: '#070707',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span className="eyebrow" style={{ marginBottom: '4px' }}>Fast Switcher</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Active Clinical Patients</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {patients.map(p => (
              <button
                key={p.mrn}
                onClick={() => {
                  onSelectPatient(p.mrn);
                  onNavigateTab('patients');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  background: activeMrn === p.mrn ? 'var(--accent-red)' : '#111111',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{p.full_name}</span>
                <span className="mono text-xs" style={{ opacity: 0.75 }}>({p.mrn})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Split Cards */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <span className="section-eyebrow">Clinical Tools</span>
            <h2 className="section-title">Clinical Workflows</h2>
            <p className="section-desc">Direct access to patient medical histories, clinical case sheets, AI review gates, and emergency overrides.</p>
          </div>

          <div className="editorial-case-grid">
            {/* Split Card 1: Patient EHR */}
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Diagnostic Records</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Patient EHR & Diagnostic Charts
                </h3>
                <p className="editorial-body">
                  Inspect patient encounters, ICD-10 diagnoses, active medications, laboratory results, and test the real-time cryptographic tamper detection engine.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('patients')}>
                    <span>→ Open Patient EHR Charts</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Stethoscope size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Full Clinical Authority</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Active Patient: {activeMrn}
                  </div>
                </div>
              </div>
            </div>

            {/* Split Card 2: AI Review */}
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: '#3b82f6' }}>Human-in-the-Loop</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  AI Clinical Ingestion Gate
                </h3>
                <p className="editorial-body">
                  Extract structured FHIR R4B clinical data from raw prescriptions and discharge summaries. Review and approve draft findings before anchoring into the ledger.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('extract')}>
                    <span>→ Review AI Draft Extractions</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <BrainCircuit size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-yellow" style={{ fontSize: '0.72rem' }}>Clinician Verification Required</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Model: QLoRA + Heuristic NLP
                  </div>
                </div>
              </div>
            </div>

            {/* Split Card 3: Emergency Break-Glass */}
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Critical Care Protocol</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Emergency Break-Glass Override
                </h3>
                <p className="editorial-body">
                  Override patient consent when treating unconscious trauma victims. All accesses generate an unalterable forensic audit trail anchored to the ledger.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('emergency')}>
                    <span>→ Launch Emergency Protocol</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Ambulance size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>Audit Warning Active</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Ref: PROTOCOL-BG-2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PATIENT SOVEREIGN HEALTH DASHBOARD
  // ─────────────────────────────────────────────────────────────
  if (role === 'Patient') {
    return (
      <div className="animate-fade-in">
        {/* Patient Hero */}
        <section className="editorial-hero">
          <div className="editorial-hero-left">
            <span className="eyebrow" style={{ color: '#3b82f6' }}>
              Patient Sovereign Health Vault
            </span>
            <h1 className="headline-xl">
              My Health <span className="text-highlight">Sovereignty</span>
            </h1>
            <p className="editorial-lead">
              Welcome, <strong className="text-white">{user?.full_name || 'Rahul Sharma'}</strong>. Your medical records belong to you. In Sanjeevni, no doctor, hospital, or insurer can access your data without your explicit, time-bounded consent.
            </p>

            <div className="telemetry-strip">
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>ID: {user?.patient_mrn || 'MRN-1002'}</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Blood Group: O+</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Identity Verified</span>
              </div>
            </div>
          </div>

          <div className="editorial-hero-right">
            <p className="editorial-body">
              Your health timeline is anchored in an immutable blockchain ledger. Every time a doctor views or updates your chart, an indelible cryptographic audit entry is permanently logged.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="highlight-box">
                <strong>Active Clinical Diagnoses</strong>
                <span>Type 2 Diabetes Mellitus (ICD-10: E11.9) • Essential Hypertension (I10)</span>
              </div>
              <div className="highlight-box">
                <strong>Current Active Prescriptions</strong>
                <span>Metformin 500mg Oral Twice Daily • Atorvastatin 20mg Oral Nightly</span>
              </div>
              <div className="highlight-box">
                <strong>Attending Consultant</strong>
                <span>Dr. Robert Smith, MD • <b>Apollo Multispecialty Hospital</b></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigateTab('patients')}>
                <span>↘ View My Medical Records</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigateTab('consent')}>
                <span>→ Manage Access & Consent</span>
              </button>
            </div>
          </div>
        </section>

        {/* Patient Split Cards */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <span className="section-eyebrow">Patient Services</span>
            <h2 className="section-title">Your Health Hub</h2>
            <p className="section-desc">Manage your medical data sovereignty, issue time-bounded consent tokens, and consult your private health assistant.</p>
          </div>

          <div className="editorial-case-grid">
            {/* Split Card 1: My Health Records */}
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: '#3b82f6' }}>Personal Medical History</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  My Sealed Health Records
                </h3>
                <p className="editorial-body">
                  Review all your past outpatient encounters, doctor prescriptions, and laboratory biomarker trends. All records are cryptographically verified against the ledger.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('patients')}>
                    <span>→ Open Personal Medical Records</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <User size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Sovereign Record Owner</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    MRN: {user?.patient_mrn || 'MRN-1002'}
                  </div>
                </div>
              </div>
            </div>

            {/* Split Card 2: Consent Management */}
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Access Control</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Consent & Sharing Tokens
                </h3>
                <p className="editorial-body">
                  Grant granular access tokens (Full, Summary Only, or Accident Only) with custom expirations to consulting doctors. Revoke access instantly with a single click.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('consent')}>
                    <span>→ Manage Active Consent Grants</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Lock size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>2 Active Grants</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Zero-Trust Authorization
                  </div>
                </div>
              </div>
            </div>

            {/* Split Card 3: Personal AI Assistant */}
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: '#10b981' }}>Private Intelligence</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Private Health Assistant
                </h3>
                <p className="editorial-body">
                  Ask questions about your prescribed medications, dietary precautions, and lab results. Grounded strictly in your authorized medical records with zero cross-patient data leakage.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('rag')}>
                    <span>→ Ask Health Assistant</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <BrainCircuit size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Zero Data Leakage</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Partitioned Vector Search
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. HOSPITAL ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────
  if (role === 'HospitalAdmin') {
    return (
      <div className="animate-fade-in">
        <section className="editorial-hero">
          <div className="editorial-hero-left">
            <span className="eyebrow" style={{ color: '#10b981' }}>
              Facility Administration & Compliance
            </span>
            <h1 className="headline-xl">
              Hospital <span className="text-highlight">Operations</span>
            </h1>
            <p className="editorial-lead">
              Welcome, <strong className="text-white">{user?.full_name || 'Sarah Jenkins'}</strong>. Supervising <strong className="text-white">Apollo Multispecialty Hospital (HOSP-001)</strong>. Manage hospital clinical registries, physician credentialing, and organizational compliance.
            </p>

            <div className="telemetry-strip">
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Facility: HOSP-001</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>2 Attending Doctors</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Blockchain Node Synced</span>
              </div>
            </div>
          </div>

          <div className="editorial-hero-right">
            <p className="editorial-body">
              Monitor organizational consent policies and ensure all clinical admissions comply with national digital health standards and cryptographic audit requirements.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="highlight-box">
                <strong>Facility Departments</strong>
                <span>Cardiology • Internal Medicine • Endocrinology • Emergency & Trauma</span>
              </div>
              <div className="highlight-box">
                <strong>Blockchain Ledger Health</strong>
                <span><b>11 Anchored Blocks</b> • Zero integrity violations detected across active registries.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigateTab('patients')}>
                <span>↘ View Hospital Patient Registry</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigateTab('audit')}>
                <span>→ Review Compliance Logs</span>
              </button>
            </div>
          </div>
        </section>

        {/* Admin Split Cards */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <span className="section-eyebrow">Governance</span>
            <h2 className="section-title">Administrative Operations</h2>
            <p className="section-desc">Manage institutional rosters, audit logs, and ledger integrity checks.</p>
          </div>

          <div className="editorial-case-grid">
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: '#10b981' }}>Hospital Registry</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Institutional Patient Roster
                </h3>
                <p className="editorial-body">
                  Access active inpatient and outpatient registries across departments. Verify clinical documentation completion and patient identifier verification.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('patients')}>
                    <span>→ Open Patient Registry</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Building size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Facility Administrator</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Node: APOLLO-DEL-01
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Forensic Governance</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Facility Audit & Ledger Chain
                </h3>
                <p className="editorial-body">
                  Verify the cryptographic health of patient charts. Confirm that all doctor encounters and lab reports are backed by SHA-256 blockchain anchors.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('ledger')}>
                    <span>→ Inspect Ledger Chain</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Link2 size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Integrity 100%</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    0 Drift Detected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SECURITY AUDITOR DASHBOARD
  // ─────────────────────────────────────────────────────────────
  if (role === 'Auditor') {
    return (
      <div className="animate-fade-in">
        <section className="editorial-hero">
          <div className="editorial-hero-left">
            <span className="eyebrow" style={{ color: '#8b5cf6' }}>
              Zero-Trust Security & Forensics
            </span>
            <h1 className="headline-xl">
              Security <span className="text-highlight">Auditor Portal</span>
            </h1>
            <p className="editorial-lead">
              Welcome, <strong className="text-white">{user?.full_name || 'Alex Rivera'}</strong>. Independent forensic authority. Your role has read-only verification rights across the cryptographic ledger, real-time drift detection engine, and security audit logs.
            </p>

            <div className="telemetry-strip">
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>SHA-256 Continuous Chain</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>0 Tamper Detected</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Zero-Trust Active</span>
              </div>
            </div>
          </div>

          <div className="editorial-hero-right">
            <p className="editorial-body">
              Every patient encounter, case sheet finalization, and emergency break-glass event is bound to a canonical JSON digest. Test the system live by simulating out-of-band tampering.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="highlight-box">
                <strong>Cryptographic Anchor Rule</strong>
                <span>Block Hash = SHA256(index || record_id || version || record_hash || previous_hash || timestamp)</span>
              </div>
              <div className="highlight-box">
                <strong>Break-Glass Forensic Audit</strong>
                <span>All emergency access events are permanently indexed and cannot be expunged.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigateTab('ledger')}>
                <span>↘ Verify Ledger Chain</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigateTab('audit')}>
                <span>→ Inspect Forensic Logs</span>
              </button>
            </div>
          </div>
        </section>

        {/* Auditor Split Cards */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <span className="section-eyebrow">Audit Operations</span>
            <h2 className="section-title">Integrity Verification</h2>
            <p className="section-desc">Run cryptographic checks and verify that database state matches ledger anchors.</p>
          </div>

          <div className="editorial-case-grid">
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: '#8b5cf6' }}>Blockchain Proof</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Cryptographic Ledger Explorer
                </h3>
                <p className="editorial-body">
                  Inspect every block in the continuous chain. Validate previous hash linkages and re-verify live database rows against canonical SHA-256 anchors.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('ledger')}>
                    <span>→ Open Ledger Explorer</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <ShieldAlert size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>All Anchors Valid</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    11 Blocks Verified
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Forensics</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  System-Wide Audit Trail
                </h3>
                <p className="editorial-body">
                  Examine complete audit trails of all logins, emergency break-glass overrides, consent token revocations, and data reads across the network.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('audit')}>
                    <span>→ Review Audit Trail</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Activity size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Forensic Integrity</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Zero Data Leakage
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5. POLICE EMERGENCY / LAW ENFORCEMENT DASHBOARD
  // ─────────────────────────────────────────────────────────────
  if (role === 'PoliceEmergency') {
    return (
      <div className="animate-fade-in">
        <section className="editorial-hero">
          <div className="editorial-hero-left">
            <span className="eyebrow" style={{ color: '#f59e0b' }}>
              Law Enforcement & Medico-Legal Cell
            </span>
            <h1 className="headline-xl">
              Incident <span className="text-highlight">Dossier Portal</span>
            </h1>
            <p className="editorial-lead">
              Welcome, <strong className="text-white">{user?.full_name || 'Sub-Inspector Rajesh Kumar'}</strong>. Investigating officer assigned to accident case <strong className="text-white">FIR-2026-DEL-8821</strong>.
            </p>

            <div className="telemetry-strip">
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>FIR: 2026-DEL-8821</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-yellow" />
                <span>Privacy Filter: STRICT</span>
              </div>
              <div className="telemetry-item">
                <span className="dot dot-green" />
                <span>Chain of Custody Active</span>
              </div>
            </div>
          </div>

          <div className="editorial-hero-right">
            <p className="editorial-body">
              This portal enforces strict data minimization. Non-essential medical history (psychiatric, reproductive, and chronic outpatient data) is mathematically redacted.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="highlight-box">
                <strong>Legal Privacy Protection</strong>
                <span>Confidential medical history is <b>redacted at the API serializer level</b>. Only trauma observations and accident details are revealed.</span>
              </div>
              <div className="highlight-box">
                <strong>Active Medico-Legal Case</strong>
                <span>Patient: Rahul Sharma (MRN-1002) • Trauma Type: <b>Road Traffic Accident (Intersection Collision)</b></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigateTab('emergency')}>
                <span>↘ Inspect Accident Dossier</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigateTab('audit')}>
                <span>→ Review Chain of Custody</span>
              </button>
            </div>
          </div>
        </section>

        {/* Police Split Cards */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <span className="section-eyebrow">Investigation File</span>
            <h2 className="section-title">Medico-Legal Records</h2>
            <p className="section-desc">Access official injury details, collision telemetry, and forensic audit timestamps.</p>
          </div>

          <div className="editorial-case-grid">
            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: '#f59e0b' }}>Case File</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Road Traffic Accident Dossier
                </h3>
                <p className="editorial-body">
                  Access official injury documentation: Glasgow Coma Scale, bleeding status, fracture imaging findings, and emergency surgery observations tied to FIR-2026-DEL-8821.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('emergency')}>
                    <span>→ Open Incident Dossier</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <Ambulance size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-yellow" style={{ fontSize: '0.72rem' }}>Redacted Medico-Legal</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    FIR-2026-DEL-8821
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-split-card">
              <div className="editorial-card-content">
                <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>Chain of Custody</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  Forensic Chain of Custody
                </h3>
                <p className="editorial-body">
                  Every access by law enforcement officers is timestamped and recorded in the audit trail for presentation in judicial hearings and accident claims tribunals.
                </p>
                <div>
                  <button className="btn-arrow" onClick={() => onNavigateTab('audit')}>
                    <span>→ View Chain of Custody Log</span>
                  </button>
                </div>
              </div>
              <div className="editorial-card-visual">
                <FileCheck size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Court Admissible</span>
                  <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    SHA-256 Verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
