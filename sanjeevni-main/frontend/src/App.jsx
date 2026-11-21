import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PatientEHRView from './components/PatientEHRView';
import CaseSheetView from './components/CaseSheetView';
import ConsentSharingView from './components/ConsentSharingView';
import EmergencyPoliceView from './components/EmergencyPoliceView';
import AIExtractionView from './components/AIExtractionView';
import LedgerExplorerView from './components/LedgerExplorerView';
import RAGAssistantView from './components/RAGAssistantView';
import AuditLogView from './components/AuditLogView';
import './App.css';
import { ShieldCheck, Ambulance, Link2, BrainCircuit, ArrowRight } from 'lucide-react';

const FALLBACK_USERS = {
  Doctor: {
    id: 'user-doc-1',
    username: 'dr_sharma',
    full_name: 'Dr. Rahul Sharma, MD',
    role: 'Doctor',
    doctor_id: 'DR-1001',
    hospital_id: 'HOSP-001'
  },
  Patient: {
    id: 'user-pat-1',
    username: 'rahul_sharma',
    full_name: 'Rahul Sharma',
    role: 'Patient',
    patient_mrn: 'MRN-1002'
  },
  HospitalAdmin: {
    id: 'user-adm-1',
    username: 'admin_metro',
    full_name: 'Chief Administrator Kapoor',
    role: 'HospitalAdmin',
    hospital_id: 'HOSP-001'
  },
  Auditor: {
    id: 'user-aud-1',
    username: 'auditor_verma',
    full_name: 'Senior Auditor Verma',
    role: 'Auditor'
  },
  PoliceEmergency: {
    id: 'user-pol-1',
    username: 'inspector_singh',
    full_name: 'Inspector Vikram Singh',
    role: 'PoliceEmergency',
    police_badge_id: 'POL-DL-8821'
  }
};

const DEFAULT_PATIENTS = [
  { mrn: 'MRN-1002', full_name: 'Rahul Sharma', age: 34, gender: 'Male', encounters_count: 2 },
  { mrn: 'MRN-2004', full_name: 'Priya Patel', age: 42, gender: 'Female', encounters_count: 1 },
  { mrn: 'MRN-3008', full_name: 'Vikram Malhotra', age: 58, gender: 'Male', encounters_count: 2 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(FALLBACK_USERS.Doctor);
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [activeMrn, setActiveMrn] = useState('MRN-1002');
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  
  const [ledgerBlocks, setLedgerBlocks] = useState([]);
  const [ledgerHealth, setLedgerHealth] = useState({ chain_integrity_valid: true, total_blocks: 4, status: 'VALID' });
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState({ total: 12, flags: 0 });
  const [ragStatus, setRagStatus] = useState({ indexed_chunks_count: 24, status: 'active' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  const fetchPatientDetails = async (mrn, tokenOverride) => {
    const token = tokenOverride || localStorage.getItem('medsecure_token');
    setLoadingPatient(true);
    try {
      const res = await fetch(`/api/patients/${mrn}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setPatientDetails(data);
          setBackendOffline(false);
        }
      }
    } catch (e) {
      console.warn('Backend offline:', e.message);
    } finally {
      setLoadingPatient(false);
    }
  };

  const fetchAllData = async (tokenOverride, userOverride) => {
    const token = tokenOverride || localStorage.getItem('medsecure_token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const currentUser = userOverride || user;

      if (currentUser?.role !== 'PoliceEmergency') {
        const pRes = await fetch('/api/patients', { headers: authHeaders });
        if (pRes.ok) {
          const text = await pRes.text();
          if (text) {
            const pData = JSON.parse(text);
            if (Array.isArray(pData) && pData.length > 0) {
              setPatients(pData);
              const targetMrn = currentUser?.patient_mrn || activeMrn || pData[0].mrn;
              const chosenMrn = pData.some(p => p.mrn === targetMrn) ? targetMrn : pData[0].mrn;
              setActiveMrn(chosenMrn);
              fetchPatientDetails(chosenMrn, token);
            }
          }
        }
      }

      const bRes = await fetch('/api/ledger/blocks', { headers: authHeaders });
      if (bRes.ok) {
        const text = await bRes.text();
        if (text) {
          const bData = JSON.parse(text);
          setLedgerBlocks(bData.blocks || []);
        }
      }

      const hRes = await fetch('/api/ledger/verify-chain', { headers: authHeaders });
      if (hRes.ok) {
        const text = await hRes.text();
        if (text) {
          const hData = JSON.parse(text);
          setLedgerHealth(hData);
        }
      }

      const aRes = await fetch('/api/audit/logs', { headers: authHeaders });
      if (aRes.ok) {
        const text = await aRes.text();
        if (text) {
          const aData = JSON.parse(text);
          setAuditLogs(aData.logs || []);
          setAuditSummary({ total: aData.total_records || 12, flags: aData.security_flags_count || 0 });
        }
      }

      if (currentUser?.role !== 'Patient' && currentUser?.role !== 'PoliceEmergency') {
        const rRes = await fetch('/api/rag/status', { headers: authHeaders });
        if (rRes.ok) {
          const text = await rRes.text();
          if (text) {
            const rData = JSON.parse(text);
            setRagStatus(rData);
          }
        }
      }
      setBackendOffline(false);
    } catch (e) {
      console.warn('Sync issue:', e.message);
      setBackendOffline(true);
    }
  };

  const initDefaultAuth = async () => {
    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Doctor' })
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.access_token) {
            localStorage.setItem('medsecure_token', data.access_token);
            setUser(data.user);
            fetchAllData(data.access_token, data.user);
            setBackendOffline(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Offline initialization:', e.message);
      setBackendOffline(true);
    }
    fetchPatientDetails('MRN-1002');
  };

  useEffect(() => {
    initDefaultAuth();
  }, []);

  const handleSwitchRole = async (newRole) => {
    setIsRefreshing(true);
    const fallback = FALLBACK_USERS[newRole] || FALLBACK_USERS.Doctor;
    setUser(fallback);

    if (newRole === 'PoliceEmergency') {
      setActiveTab('emergency');
    } else if (newRole === 'Auditor') {
      setActiveTab('audit');
    } else if (newRole === 'Patient') {
      setActiveTab('patients');
      setActiveMrn('MRN-1002');
    }

    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.access_token) {
            localStorage.setItem('medsecure_token', data.access_token);
            setUser(data.user);
            await fetchAllData(data.access_token, data.user);
            setBackendOffline(false);
          }
        }
      }
    } catch (e) {
      console.warn('Backend server offline during role switch:', e.message);
      setBackendOffline(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectPatient = (mrn) => {
    setActiveMrn(mrn);
    fetchPatientDetails(mrn);
  };

  const handleTamper = async (mrn, field, value) => {
    const token = localStorage.getItem('medsecure_token');
    try {
      const res = await fetch(`/api/patients/${mrn}/tamper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ field_to_tamper: field, tampered_value: value })
      });
      if (res.ok) {
        await fetchPatientDetails(mrn);
        fetchAllData();
      }
    } catch (e) {
      console.error('Tamper simulation error:', e);
    }
  };

  const handleRestore = async (mrn) => {
    const token = localStorage.getItem('medsecure_token');
    try {
      const res = await fetch(`/api/patients/${mrn}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchPatientDetails(mrn);
        fetchAllData();
      }
    } catch (e) {
      console.error('Restore error:', e);
    }
  };

  // bb-b.net style clean concise header navigation
  const getNavItems = () => {
    const role = user?.role;
    if (role === 'PoliceEmergency') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'emergency', label: 'Incident Dossier' },
        { id: 'audit', label: 'Audit Trail' }
      ];
    }
    if (role === 'Auditor') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'audit', label: 'Audit Logs' },
        { id: 'ledger', label: 'Ledger' },
        { id: 'emergency', label: 'Emergency Events' }
      ];
    }
    if (role === 'Patient') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'patients', label: 'My Health' },
        { id: 'consent', label: 'Consent' },
        { id: 'rag', label: 'Assistant' },
        { id: 'audit', label: 'Access History' }
      ];
    }
    // Doctor / HospitalAdmin
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'patients', label: 'Patients' },
      { id: 'case_sheet', label: 'Case Sheet' },
      { id: 'consent', label: 'Consent' },
      { id: 'emergency', label: 'Emergency' },
      { id: 'extract', label: 'AI Review' },
      { id: 'rag', label: 'Assistant' },
      { id: 'ledger', label: 'Ledger' },
      { id: 'audit', label: 'Audit' },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="container" style={{ minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* ─── Integrated Clean Navbar (bb-b.net Exact Layout) ─── */}
      <Header
        user={user}
        onSwitchRole={handleSwitchRole}
        ledgerHealth={ledgerHealth}
        onRefreshAll={() => fetchAllData()}
        isRefreshing={isRefreshing}
        backendOffline={backendOffline}
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        navItems={navItems}
      />

      {/* ─── Main View Content ─── */}
      <main className="animate-fade-in" key={activeTab} style={{ marginTop: '20px' }}>
        
        {/* ─── OVERVIEW TAB (bb-b.net Showcase Page) ─── */}
        {activeTab === 'overview' && (
          <div>
            {/* 1. bb-b.net Style Two-Column Editorial Hero */}
            <section className="editorial-hero">
              <div className="editorial-hero-left">
                <span className="eyebrow">
                  Healthcare, Technologies and Digital Sovereign EHR
                </span>
                <h1 className="headline-xl">
                  A Singular <span className="text-highlight">Architecture</span>
                </h1>
                <p className="editorial-lead">
                  Sanjeevni is an enterprise healthcare platform uniting <strong className="text-white">cryptographically verified records</strong>, clinician-validated <span className="keyword-pill">AI extraction</span>, and <strong className="text-white">immutable blockchain auditability</strong>.
                </p>

                <div className="telemetry-strip">
                  <div className="telemetry-item">
                    <span className="dot dot-green" />
                    <span>Continuous Hash Chain</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="dot dot-green" />
                    <span>Zero Cross-Patient Leakage</span>
                  </div>
                  <div className="telemetry-item">
                    <span>FHIR R4B Certified</span>
                  </div>
                </div>
              </div>

              <div className="editorial-hero-right">
                <p className="editorial-body">
                  We combine <strong className="text-white">cryptographic rigor</strong>, <strong className="text-white">FHIR R4B clinical standards</strong>, and <strong className="text-white">artificial intelligence</strong> to deliver absolute data integrity. From life-critical emergency admissions to selective patient consent, every record state mutation is <span className="text-highlight">permanently anchored</span> in the ledger.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="highlight-box">
                    <strong>Our Mission</strong>
                    <span>Converge clinical intelligence with blockchain sovereignty to <b>eliminate healthcare record falsification</b>.</span>
                  </div>
                  <div className="highlight-box">
                    <strong>Our Singularity</strong>
                    <span>Continuous SHA-256 hash chaining paired with strict RBAC boundary walls ensuring <b>zero cross-patient data leakage</b>.</span>
                  </div>
                  <div className="highlight-box">
                    <strong>Our Expertise</strong>
                    <span><b>Structure, verify, deploy.</b></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setActiveTab('patients')}
                  >
                    <span>↘ Explore Patient Records</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => setActiveTab('ledger')}
                  >
                    <span>→ Inspect Ledger Chain</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Concrete Cases Section (Matching bb-b.net Images 2 & 3: DES CAS CONCRETS) */}
            <section style={{ marginBottom: '80px' }}>
              <div className="section-header">
                <span className="section-eyebrow">Deployed Capabilities</span>
                <h2 className="section-title">Concrete Clinical Cases</h2>
                <p className="section-desc">
                  Explore real-world hospital workflows spanning emergency trauma break-glass, AI document ingestion, and sovereign cryptographic data anchoring.
                </p>
              </div>

              <div className="editorial-case-grid">
                
                {/* Case 1: ZONEGREEN Style Split Card (Emergency Break-Glass) */}
                <div className="editorial-split-card">
                  <div className="editorial-card-content">
                    <span className="eyebrow" style={{ color: 'var(--accent-red)' }}>
                      Critical Care Protocol
                    </span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                      Emergency Break-Glass Access
                    </h3>
                    <p className="editorial-body">
                      Enables emergency physicians to override standard patient consent when treating unconscious trauma victims. All accesses trigger an unforgeable forensic audit event linked directly to police FIR databases while redacting non-essential psychiatric history.
                    </p>
                    <div>
                      <button 
                        className="btn-arrow" 
                        onClick={() => setActiveTab('emergency')}
                      >
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

                {/* Case 2: BINDER MAGNETIC Style Split Card (Integrity Ledger) */}
                <div className="editorial-split-card">
                  <div className="editorial-card-content">
                    <span className="eyebrow">
                      Cryptographic Infrastructure
                    </span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                      Continuous Blockchain Ledger
                    </h3>
                    <p className="editorial-body">
                      Every diagnostic finding, prescribed medication, and anchored lab observation is sealed inside a continuous SHA-256 block digest. Direct out-of-band SQL modifications are identified and flagged within milliseconds.
                    </p>
                    <div>
                      <button 
                        className="btn-arrow" 
                        onClick={() => setActiveTab('ledger')}
                      >
                        <span>→ Inspect Cryptographic Ledger</span>
                      </button>
                    </div>
                  </div>

                  <div className="editorial-card-visual">
                    <Link2 size={64} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Chain Continuous</span>
                      <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
                        4 Blocks Verified • 0 Tamper Detected
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* ─── DEDICATED CLINICAL WORK VIEWS (Zero clutter, full breathing room) ─── */}
        {activeTab === 'patients' && (
          <PatientEHRView
            patients={patients}
            activeMrn={activeMrn}
            onSelectPatient={handleSelectPatient}
            patientDetails={patientDetails}
            loading={loadingPatient}
            onTamper={handleTamper}
            onRestore={handleRestore}
            role={user?.role}
          />
        )}

        {activeTab === 'case_sheet' && (
          <CaseSheetView
            activeMrn={activeMrn}
            user={user}
          />
        )}

        {activeTab === 'consent' && (
          <ConsentSharingView
            user={user}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyPoliceView
            user={user}
          />
        )}

        {activeTab === 'extract' && (
          <AIExtractionView
            onApproveSuccess={() => {
              fetchAllData();
              fetchPatientDetails(activeMrn);
            }}
            role={user?.role}
          />
        )}

        {activeTab === 'rag' && (
          <RAGAssistantView
            role={user?.role}
            userMrn={user?.patient_mrn}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerExplorerView
            blocks={ledgerBlocks}
            chainHealth={ledgerHealth}
            onRefreshLedger={() => fetchAllData()}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            logs={auditLogs}
            onRefreshLogs={() => fetchAllData()}
            totalRecords={auditSummary.total}
            securityFlagsCount={auditSummary.flags}
            role={user?.role}
          />
        )}

      </main>

      {/* ─── Editorial Minimal Footer (bb-b.net style) ─── */}
      <footer style={{
        marginTop: '100px',
        paddingTop: '36px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>sanjeevni</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
            © 2026 Sovereign Healthcare Architecture. All rights reserved.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '28px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>Overview</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('patients')}>Patients</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ledger')}>Cryptographic Ledger</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('audit')}>Forensic Trail</span>
        </div>
      </footer>

    </div>
  );
}
