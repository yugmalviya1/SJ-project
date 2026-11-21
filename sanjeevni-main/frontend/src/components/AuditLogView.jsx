import React, { useState } from 'react';
import { 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Clock, 
  User, 
  FileText,
  RefreshCw
} from 'lucide-react';

export default function AuditLogView({ logs = [], onRefreshLogs, totalRecords, securityFlagsCount, role }) {
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = filterAction === 'ALL'
    ? logs
    : logs.filter(l => l.action === filterAction);

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Top Banner ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span className="eyebrow">Medicolegal Compliance & Security</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px' }}>
            Immutable Forensic Audit Trail
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '780px', lineHeight: 1.6 }}>
            Permanent forensic audit trail of all practitioner authentication, EHR record access, clinical AI extractions, and out-of-band database tamper events.
          </p>
        </div>

        {/* Counters & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#050505', padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', fontWeight: 700 }}>Total Events</span>
            <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>{totalRecords || logs.length || 12}</strong>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger-border)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', fontWeight: 700 }}>Tamper / Flags</span>
            <strong style={{ fontSize: '1.1rem', color: '#f87171' }}>{securityFlagsCount || 0}</strong>
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onRefreshLogs}
            title="Refresh logs"
            style={{ height: '40px', padding: '0 16px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Action Filters ─── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
        {['ALL', 'SIMULATED_DB_TAMPER', 'INTEGRITY_VERIFICATION', 'APPROVE_RECORD', 'VIEW_RECORD', 'EMERGENCY_ACCESS', 'POLICE_ACCIDENT_VIEW', 'CONSENT_GRANTED', 'AUTH_LOGIN_SUCCESS'].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: filterAction === act ? '#ffffff' : 'transparent',
              border: filterAction === act ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
              color: filterAction === act ? '#000000' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {act}
          </button>
        ))}
      </div>

      {/* ─── Logs Table ─── */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Anchored Action</th>
              <th>User / Practitioner</th>
              <th>Resource / MRN</th>
              <th>Status</th>
              <th>Technical Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const isTamper = log.action === 'SIMULATED_DB_TAMPER' || log.status === 'TAMPER_DETECTED';
              const isApproved = log.action === 'APPROVE_RECORD';
              return (
                <tr key={log.id} style={{ background: isTamper ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                  <td className="mono text-xs" style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : '-'}
                  </td>
                  <td>
                    <span className={`badge ${
                      isTamper ? 'badge-red' : 
                      isApproved ? 'badge-green' : 'badge-gray'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="mono text-xs" style={{ color: '#ffffff' }}>{log.user_id}</td>
                  <td className="mono text-xs" style={{ color: log.patient_mrn ? '#ffffff' : 'var(--text-tertiary)', fontWeight: 700 }}>
                    {log.patient_mrn || log.resource_id || '-'}
                  </td>
                  <td>
                    <span className={`badge ${
                      log.status === 'SUCCESS' ? 'badge-green' : 
                      log.status === 'TAMPER_DETECTED' ? 'badge-red' : 'badge-yellow'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="text-muted text-xs" style={{ maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
