import React from 'react';

export default function HomePage() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
          Gieni OS Investigation & Intelligence
        </h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem' }}>
          Modular, evidence-backed probate opportunity processing system.
        </p>
      </div>

      <div className="disclaimer-banner">
        <strong>Operating Standard:</strong> Research finding—not legal opinion or title guarantee.
        Zero synthetic or fictional records.
      </div>

      <div className="insights-container">
        <div className="insight-card">
          <h4>Operator Console</h4>
          <p>
            Investigation workspace for researchers and QC reviewers. Inspect case dockets,
            review Document AI OCR proposals, reconcile assessor parcels, and manage exceptions.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a href="/operator" style={{ fontWeight: 600 }}>Open Console &rarr;</a>
          </div>
        </div>

        <div className="insight-card">
          <h4>Client Portal</h4>
          <p>
            Commercial portal for Clerk client organizations. View delivered Probate Opportunity
            Files (POF), inspect primary evidence links, and submit disposition feedback.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a href="/client" style={{ fontWeight: 600 }}>Open Portal &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
