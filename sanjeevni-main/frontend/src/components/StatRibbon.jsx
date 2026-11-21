import React from 'react';

export default function StatRibbon({ stats, role, ragStatus, onNavigateTab }) {
  const cards = [
    {
      id: 'patients',
      eyebrow: 'Clinical Registry',
      label: 'Patients Scoped',
      value: stats?.patientsCount ?? 3,
      sub: role === 'Patient' ? 'Restricted to patient MRN' : 'Active hospital records'
    },
    {
      id: 'extract',
      eyebrow: 'Intelligence Pipeline',
      label: 'Extraction Engine',
      value: 'AI + Human',
      sub: 'HL7 & FHIR R4B verified'
    },
    {
      id: 'ledger',
      eyebrow: 'Cryptographic Chain',
      label: 'Anchored Blocks',
      value: stats?.blocksCount ?? 4,
      sub: 'SHA-256 continuous hash chain'
    },
    {
      id: 'rag',
      eyebrow: 'Zero Data Cross-Leakage',
      label: 'Clinical Assistant',
      value: ragStatus?.indexed_chunks_count ? `${ragStatus.indexed_chunks_count} Chunks` : 'Scoped',
      sub: 'RBAC filtered semantic retrieval'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '40px'
    }}>
      {cards.map((c) => (
        <div
          key={c.id}
          className="stat-card"
          onClick={() => onNavigateTab(c.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">{c.eyebrow}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-red)', fontWeight: 700 }}>↘</span>
          </div>
          <div className="stat-value">
            {c.value}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
            {c.label}
          </div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
