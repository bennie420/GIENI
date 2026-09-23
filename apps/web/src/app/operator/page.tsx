import React from 'react';

export default function OperatorConsolePage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
          Operator Investigation Console
        </h1>
        <p style={{ color: 'var(--text-sub)' }}>
          Review probate intake, AI proposals, exceptions, and quality certification.
        </p>
      </div>

      <div className="insights-container">
        <div className="insight-card">
          <h4>1. Intake & Ingestion</h4>
          <p>County docket ingest, raw PDF preservation in Google Cloud Storage, Document AI OCR layout processing.</p>
        </div>
        <div className="insight-card">
          <h4>2. Document Review</h4>
          <p>Inspect extracted decedent, filing date, court dockets, and will/letters attachments with page locators.</p>
        </div>
        <div className="insight-card">
          <h4>3. Opportunity Investigation</h4>
          <p>Cross-reference decedent with county assessor parcel rolls, deed chains, and legal descriptions.</p>
        </div>
        <div className="insight-card">
          <h4>4. Exceptions & Tasks</h4>
          <p>Quarantine unresolved authority tiers, address conflicts, and low-confidence OCR proposals for manual resolution.</p>
        </div>
        <div className="insight-card">
          <h4>5. QC & Delivery Gate</h4>
          <p>Human reviewer certification checklist. Verify primary evidence links prior to tenant delivery publication.</p>
        </div>
      </div>
    </div>
  );
}
