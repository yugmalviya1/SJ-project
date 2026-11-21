// Central API client for MedSecure AI
const BASE = '/api';

function getToken() {
  return localStorage.getItem('medsecure_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Auth
export const authAPI = {
  login: (username, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.detail)))),
  switchDemo: (role) =>
    fetch(`${BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    }).then(r => r.json()),
  me: () => api('/auth/me'),
  listUsers: () => api('/auth/users'),
  verifyIdentity: (payload) => api('/auth/verify-identity', { method: 'POST', body: JSON.stringify(payload) }),
  verifyFace: (payload) => api('/auth/verify-face', { method: 'POST', body: JSON.stringify(payload) }),
};

// Patients
export const patientsAPI = {
  list: () => api('/patients'),
  get: (mrn) => api(`/patients/${mrn}`),
  tamper: (mrn, field, value) => api(`/patients/${mrn}/tamper`, { method: 'POST', body: JSON.stringify({ field_to_tamper: field, tampered_value: value }) }),
  restore: (mrn) => api(`/patients/${mrn}/restore`, { method: 'POST' }),
};

// Case Sheets
export const caseSheetsAPI = {
  listByPatient: (mrn) => api(`/case-sheets/patient/${mrn}`),
  save: (payload) => api('/case-sheets', { method: 'POST', body: JSON.stringify(payload) }),
};

// Consent & Data Sharing
export const consentAPI = {
  myGrants: () => api('/consent/my-grants'),
  directory: () => api('/consent/directory'),
  grant: (payload) => api('/consent/grant', { method: 'POST', body: JSON.stringify(payload) }),
};

// Emergency & Police Access
export const emergencyAPI = {
  breakGlass: (payload) => api('/emergency/break-glass', { method: 'POST', body: JSON.stringify(payload) }),
  policeReport: (ref) => api(`/emergency/police-report?ref=${encodeURIComponent(ref)}`),
};

// AI Extraction
export const aiAPI = {
  extract: (payload) => api('/ai/extract', { method: 'POST', body: JSON.stringify(payload) }),
  approve: (document_id, approved_data) => api('/ai/review-approve', { method: 'POST', body: JSON.stringify({ document_id, approved_data }) }),
};

// Ledger
export const ledgerAPI = {
  blocks: () => api('/ledger/blocks'),
  verifyChain: () => api('/ledger/verify-chain'),
  verifyRecord: (mrn) => api(`/ledger/verify-record/${mrn}`),
};

// RAG
export const ragAPI = {
  query: (query, target_mrn, top_k = 3) => api('/rag/query', { method: 'POST', body: JSON.stringify({ query, target_mrn, top_k }) }),
  status: () => api('/rag/status'),
};

// Audit
export const auditAPI = {
  logs: (limit = 100, action = null) => api(`/audit/logs?limit=${limit}${action ? '&action=' + encodeURIComponent(action) : ''}`),
  auditorSummary: () => api('/audit/auditor-summary'),
};

// Documents
export const docsAPI = {
  list: () => api('/documents'),
  get: (id) => api(`/documents/${id}`),
};

// Health
export const healthAPI = {
  check: () => api('/health'),
};
