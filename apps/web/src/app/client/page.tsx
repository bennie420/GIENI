import React from 'react';

export default function ClientPortalPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
          Client Opportunity Feed
        </h1>
        <p style={{ color: 'var(--text-sub)' }}>
          Verified, evidence-backed Probate Opportunity Files (POF) for licensed jurisdictions.
        </p>
      </div>

      <div className="disclaimer-banner">
        Research finding—not legal opinion or title guarantee.
      </div>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="insight-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Case # PR-2026-08912 &bull; Travis County</span>
            <span className="badge badge-a">Priority A</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>ESTATE DECEDENT</span>
              <strong>Eleanor Rigby Vance</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>ASSESSED PROPERTY</span>
              <strong>742 Evergreen Terrace ($620,000)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>AUTHORITY STATUS</span>
              <strong>Tier 1 — Letters Issued (Executor)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>PRIMARY EVIDENCE</span>
              <span style={{ color: 'var(--accent)' }}>3 Documents Verified</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
              Action: Contact Executor regarding probate distribution timeline
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                View Evidence
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Log Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
