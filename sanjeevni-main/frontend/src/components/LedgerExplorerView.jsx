import React, { useState } from 'react';
import { 
  Link2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertOctagon, 
  RefreshCw, 
  Hash, 
  Layers, 
  ArrowRight,
  Shield,
  Search
} from 'lucide-react';

export default function LedgerExplorerView({ 
  blocks = [], 
  chainHealth, 
  onRefreshLedger, 
  isRefreshing 
}) {
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [chainVerifyStatus, setChainVerifyStatus] = useState(chainHealth || null);
  const [filterQuery, setFilterQuery] = useState('');

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    try {
      const token = localStorage.getItem('medsecure_token');
      const res = await fetch('/api/ledger/verify-chain', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setChainVerifyStatus(data);
        }
      }
    } catch (e) {
      console.warn('Chain verification error:', e.message);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const filteredBlocks = blocks.filter(b => 
    b.record_id?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    b.block_hash?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* ─── Top Control & Status Banner ─── */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="eyebrow">Trust Infrastructure</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px' }}>
              Immutable Cryptographic Ledger
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <span className="badge">{blocks.length || 4} Blocks Anchored</span>
              <span className="badge">SHA-256 Continuous Digest</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', maxWidth: '780px', lineHeight: 1.6 }}>
              Dual-layer cryptographic blockchain anchoring every clinical record snapshot. Any out-of-band mutation to the SQL database without corresponding block signature is immediately flagged as tamper.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleVerifyChain}
              disabled={isVerifyingChain}
            >
              <CheckCircle2 size={15} />
              <span>{isVerifyingChain ? 'Verifying Chain...' : '↘ Verify Blockchain Continuity'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={onRefreshLedger}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
              <span>Sync Ledger</span>
            </button>
          </div>
        </div>

        {/* Chain Validation Alert */}
        {chainVerifyStatus && (
          <div className={`security-banner ${chainVerifyStatus.chain_integrity_valid ? 'safe' : 'alert'}`} style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.84rem' }}>
              {chainVerifyStatus.chain_integrity_valid 
                ? '✓ Continuous Chain Continuity : All SHA-256 block digests and previous pointers match 100%' 
                : '⚠ Chain Pointer Discontinuity : Discontinuity detected in cryptographic ledger'}
            </div>
          </div>
        )}
      </div>

      {/* ─── Search and Blocks List ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {blocks.length > 2 && (
          <div style={{ maxWidth: '340px' }}>
            <input 
              className="input"
              placeholder="Search by MRN or block hash..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '9px 14px' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredBlocks.map((b) => {
            const isGenesis = b.index === 0;
            return (
              <div 
                key={b.index}
                className="card"
                style={{
                  padding: '24px 28px',
                  borderLeft: isGenesis ? '3px solid var(--border-subtle)' : '3px solid #ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge" style={{ fontSize: '0.72rem' }}>
                      Block #{b.index}
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#ffffff' }}>
                      Record : {b.record_id}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                      v{b.version}
                    </span>
                  </div>

                  <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {b.timestamp}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: '#050505', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span className="text-dim text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Block SHA-256
                    </span>
                    <div className="mono text-xs" style={{ color: '#ffffff', wordBreak: 'break-all', marginTop: '4px' }}>
                      {b.block_hash}
                    </div>
                  </div>

                  <div>
                    <span className="text-dim text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Canonical Record Hash
                    </span>
                    <div className="mono text-xs" style={{ color: '#ffffff', wordBreak: 'break-all', marginTop: '4px' }}>
                      {b.record_hash}
                    </div>
                  </div>

                  <div>
                    <span className="text-dim text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Previous Block Pointer
                    </span>
                    <div className="mono text-xs text-muted" style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                      {b.previous_hash}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
