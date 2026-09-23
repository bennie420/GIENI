'use client';

import React from 'react';

interface QcTabProps {
  hasPendingExceptions: boolean;
}

export default function QcTab({ hasPendingExceptions }: QcTabProps) {
  return (
    <div className="insight-card">
      <h3>QC Review Gate & Commercial Publication</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
        Human reviewer gatekeeper checklist. Fails will quarantine to exception queue.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" defaultChecked disabled />
          <strong>Mandatory Primary Evidence Attached:</strong> Letters Testamentary attached with verified SHA-256 hash.
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" defaultChecked disabled />
          <strong>Authority Tier &ge; 2:</strong> Sarah Louise Jenkins confirmed as Tier 1 Independent Executor.
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" defaultChecked={!hasPendingExceptions} disabled />
          <strong>Zero Unresolved Exceptions:</strong> All title conflicts and identity variations resolved.
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" defaultChecked disabled />
          <strong>Mandatory Legal Boundary Notice Present:</strong> &quot;research finding—not legal opinion or title guarantee&quot;.
        </label>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          Tenant: <span className="hash-chip">client_austin_capital_partners</span> &bull; County:{' '}
          <span className="hash-chip">county_travis_tx</span>
        </span>
        <button
          className="btn-primary"
          onClick={() => alert('Probate Opportunity File published to client organization!')}
        >
          ✓ Certified for Tenant Delivery
        </button>
      </div>
    </div>
  );
}
