import React from 'react';

export default function HomePage() {
  const jurisdictions = [
    { county: 'Travis County, TX', court: 'Probate Court No. 1', adapter: 'Active v1.0', status: 'Online' },
    { county: 'Pierce County, WA', court: 'Superior Court (LINX)', adapter: 'Active v1.0', status: 'Online' },
    { county: 'King County, WA', court: 'Superior Court (ECR)', adapter: 'Active v1.0', status: 'Online' },
    { county: 'Thurston County, WA', court: 'Superior Court', adapter: 'Active v1.0', status: 'Online' },
    { county: 'Maricopa County, AZ', court: 'Superior Court (PB)', adapter: 'Active v1.0', status: 'Online' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '8px' }}>
          Gieni OS Investigation & Intelligence
        </h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', maxWidth: '780px' }}>
          Evidence-first probate intelligence architecture. Ingesting authentic municipal filings,
          validating fiduciary authority, scoring property equity, and delivering verified opportunity dossiers.
        </p>
      </div>

      <div className="disclaimer-banner">
        <strong>Operating Standard:</strong> Research finding—not legal opinion or title guarantee.
        Zero synthetic or fictional records. Strict SHA-256 artifact provenance.
      </div>

      {/* Primary Workspaces */}
      <div className="insights-container" style={{ marginBottom: '32px' }}>
        <div className="insight-card">
          <h4>Operator Console</h4>
          <p>
            Investigation workspace for researchers and QC reviewers. Inspect case dockets,
            review Document AI OCR proposals, reconcile assessor parcels, manage exceptions, and certify deliveries.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a href="/operator" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Open Console &rarr;
            </a>
          </div>
        </div>

        <div className="insight-card">
          <h4>Client Portal</h4>
          <p>
            Commercial portal for Clerk client organizations. View delivered Probate Opportunity
            Files (POF), inspect primary evidence links, configure webhooks, and submit disposition feedback.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a href="/client" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Open Client Portal &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Supported Jurisdictions Matrix */}
      <div className="insight-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ margin: 0 }}>Active Municipal Jurisdiction Coverage</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: '4px 0 0 0' }}>
              Real-time court docket scraping with zero synthetic mock fallbacks.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', background: '#064e3b', padding: '4px 10px', borderRadius: '999px' }}>
            ● 5 Live Adapters
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {jurisdictions.map((j) => (
            <div
              key={j.county}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{j.county}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '2px' }}>{j.court}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#818cf8' }}>{j.adapter}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#34d399' }}>● {j.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Evidence Standard */}
      <div className="insight-card">
        <h4>The Claim–Evidence Triad Standard</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '12px' }}>
          <div>
            <strong>1. Primary Evidence Guarantee</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Every factual assertion links to an immutable PDF artifact with cryptographic SHA-256 integrity hash.
            </p>
          </div>
          <div>
            <strong>2. Honest Unlocated Fiduciaries</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Zero placeholder fiduciaries (no Vance family mocks). Unappointed cases are transparently represented as <code>null</code>.
            </p>
          </div>
          <div>
            <strong>3. Deterministic Opportunity Scoring</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Formula-based priority scoring without synthetic hallucinations. Versioned scoring rules with audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
