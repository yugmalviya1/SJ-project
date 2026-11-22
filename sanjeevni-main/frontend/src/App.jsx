import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RoleDashboardView from './components/RoleDashboardView';
import RoleLoginView from './components/RoleLoginView';
import PatientEHRView from './components/PatientEHRView';
import CaseSheetView from './components/CaseSheetView';
import ConsentSharingView from './components/ConsentSharingView';
import EmergencyPoliceView from './components/EmergencyPoliceView';
import AIExtractionView from './components/AIExtractionView';
import LedgerExplorerView from './components/LedgerExplorerView';
import RAGAssistantView from './components/RAGAssistantView';
import AuditLogView from './components/AuditLogView';
import './App.css';
import { X } from 'lucide-react';

const FALLBACK_USERS = {
  Doctor: {
    id: 'USR-DOC-1',
    username: 'dr_smith',
    full_name: 'Dr. Robert Smith, MD',
    role: 'Doctor',
    doctor_id: 'DR-1001',
    hospital_id: 'HOSP-001'
  },
  Patient: {
    id: 'USR-PAT-1',
    username: 'pat_rahul',
    full_name: 'Rahul Sharma',
    role: 'Patient',
    patient_mrn: 'MRN-1002'
  },
  HospitalAdmin: {
    id: 'USR-ADM-1',
    username: 'admin_sarah',
    full_name: 'Sarah Jenkins',
    role: 'HospitalAdmin',
    hospital_id: 'HOSP-001'
  },
  Auditor: {
    id: 'USR-AUD-1',
    username: 'auditor_alex',
    full_name: 'Alex Rivera',
    role: 'Auditor'
  },
  PoliceEmergency: {
    id: 'USR-POL-1',
    username: 'officer_kumar',
    full_name: 'Sub-Inspector Rajesh Kumar',
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
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [activeMrn, setActiveMrn] = useState('MRN-1002');
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  
  const [ledgerBlocks, setLedgerBlocks] = useState([]);
  const [ledgerHealth, setLedgerHealth] = useState({ chain_integrity_valid: true, total_blocks: 11, status: 'VALID' });
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState({ total: 24, flags: 0 });
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
          setAuditSummary({ total: aData.total_records || 24, flags: aData.security_flags_count || 0 });
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
            setIsLoggedIn(true);
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
    setActiveTab('overview');

    if (newRole === 'Patient') {
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
            setIsLoggedIn(true);
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

  const handleLoginSuccess = async (userData, roleName) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setActiveTab('overview');
    if (roleName === 'Patient') {
      setActiveMrn(userData.patient_mrn || 'MRN-1002');
    }
    await fetchAllData(localStorage.getItem('medsecure_token'), userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('medsecure_token');
    setIsLoggedIn(false);
    setShowLoginModal(true);
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

  // Role-Specific Navigation Items
  const getNavItems = () => {
    const role = user?.role;
    if (role === 'PoliceEmergency') {
      return [
        { id: 'overview', label: 'Incident Dashboard' },
        { id: 'emergency', label: 'Accident Dossier' },
        { id: 'audit', label: 'Chain of Custody' }
      ];
    }
    if (role === 'Auditor') {
      return [
        { id: 'overview', label: 'Auditor Dashboard' },
        { id: 'ledger', label: 'Ledger Chain' },
        { id: 'audit', label: 'Forensic Logs' },
        { id: 'emergency', label: 'Emergency Events' }
      ];
    }
    if (role === 'Patient') {
      return [
        { id: 'overview', label: 'My Dashboard' },
        { id: 'patients', label: 'My Health' },
        { id: 'consent', label: 'Consent & Sharing' },
        { id: 'rag', label: 'My Assistant' },
        { id: 'audit', label: 'Access History' }
      ];
    }
    if (role === 'HospitalAdmin') {
      return [
        { id: 'overview', label: 'Admin Dashboard' },
        { id: 'patients', label: 'Patient Registry' },
        { id: 'consent', label: 'Consent Governance' },
        { id: 'ledger', label: 'Ledger Health' },
        { id: 'audit', label: 'Compliance Audit' }
      ];
    }
    // Doctor
    return [
      { id: 'overview', label: 'Clinical Dashboard' },
      { id: 'patients', label: 'Patient Records' },
      { id: 'case_sheet', label: 'Case Sheet' },
      { id: 'extract', label: 'AI Review' },
      { id: 'emergency', label: 'Emergency' },
      { id: 'consent', label: 'Consent' },
      { id: 'rag', label: 'Assistant' },
      { id: 'ledger', label: 'Ledger' },
      { id: 'audit', label: 'Audit' },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="container" style={{ minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* ─── Integrated Clean Navbar ─── */}
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
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* ─── LOGIN MODAL / FULL-SCREEN LOGIN WHEN LOGGED OUT ─── */}
      {(!isLoggedIn || showLoginModal) && (
        <div style={{
          position: !isLoggedIn ? 'static' : 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: !isLoggedIn ? 'auto' : '100%',
          background: !isLoggedIn ? 'transparent' : 'rgba(0, 0, 0, 0.92)',
          backdropFilter: !isLoggedIn ? 'none' : 'blur(10px)',
          zIndex: 1000,
          overflowY: 'auto',
          paddingTop: !isLoggedIn ? '20px' : '60px',
          paddingBottom: '80px'
        }}>
          {isLoggedIn && (
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: '#111111',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
                <span>Close Portal</span>
              </button>
            </div>
          )}

          <RoleLoginView 
            onLoginSuccess={handleLoginSuccess}
            currentRole={user?.role}
          />
        </div>
      )}

      {/* ─── MAIN PROTECTED CONTENT (Only rendered when logged in) ─── */}
      {isLoggedIn && (
        <main className="animate-fade-in" key={`${activeTab}-${user?.role}`} style={{ marginTop: '20px' }}>
          
          {/* ─── DEDICATED ROLE-BASED DASHBOARD (Distinct for Doctor, Patient, Admin, Auditor, Police) ─── */}
          {activeTab === 'overview' && (
            <RoleDashboardView
              user={user}
              onNavigateTab={(tab) => setActiveTab(tab)}
              patients={patients}
              activeMrn={activeMrn}
              onSelectPatient={handleSelectPatient}
              ledgerHealth={ledgerHealth}
              auditSummary={auditSummary}
            />
          )}

          {/* ─── PATIENT RECORDS VIEW (Scoped: Patients see only own MRN) ─── */}
          {activeTab === 'patients' && (
            <PatientEHRView
              patients={user?.role === 'Patient' ? patients.filter(p => p.mrn === user?.patient_mrn) : patients}
              activeMrn={user?.role === 'Patient' ? (user?.patient_mrn || activeMrn) : activeMrn}
              onSelectPatient={handleSelectPatient}
              patientDetails={patientDetails}
              loading={loadingPatient}
              onTamper={handleTamper}
              onRestore={handleRestore}
              role={user?.role}
            />
          )}

          {/* ─── CLINICAL CASE SHEET BUILDER (Doctor Only) ─── */}
          {activeTab === 'case_sheet' && (
            <CaseSheetView
              activeMrn={activeMrn}
              user={user}
            />
          )}

          {/* ─── CONSENT & ACCESS TOKEN SHARING ─── */}
          {activeTab === 'consent' && (
            <ConsentSharingView
              user={user}
            />
          )}

          {/* ─── EMERGENCY BREAK-GLASS & POLICE DOSSIER ─── */}
          {activeTab === 'emergency' && (
            <EmergencyPoliceView
              user={user}
            />
          )}

          {/* ─── AI CLINICAL EXTRACTION & REVIEW (Doctor / Clinician) ─── */}
          {activeTab === 'extract' && (
            <AIExtractionView
              onApproveSuccess={() => {
                fetchAllData();
                fetchPatientDetails(activeMrn);
              }}
              role={user?.role}
            />
          )}

          {/* ─── SCOPED CLINICAL RAG ASSISTANT (Zero cross-patient leakage) ─── */}
          {activeTab === 'rag' && (
            <RAGAssistantView
              role={user?.role}
              userMrn={user?.patient_mrn}
            />
          )}

          {/* ─── CRYPTOGRAPHIC LEDGER EXPLORER ─── */}
          {activeTab === 'ledger' && (
            <LedgerExplorerView
              blocks={ledgerBlocks}
              chainHealth={ledgerHealth}
              onRefreshLedger={() => fetchAllData()}
              isRefreshing={isRefreshing}
            />
          )}

          {/* ─── FORENSIC AUDIT LOG TRAIL ─── */}
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
      )}

      {/* ─── Editorial Minimal Footer ─── */}
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
            © 2026 Sovereign Healthcare Architecture. Role: <strong className="text-white">{user?.role}</strong> ({user?.full_name}).
          </span>
        </div>
        <div style={{ display: 'flex', gap: '28px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>Dashboard</span>
          {user?.role !== 'PoliceEmergency' && (
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('patients')}>
              {user?.role === 'Patient' ? 'My Health' : 'Patients'}
            </span>
          )}
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('consent')}>Consent</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowLoginModal(true)}>Switch Role</span>
        </div>
      </footer>

    </div>
  );
}
