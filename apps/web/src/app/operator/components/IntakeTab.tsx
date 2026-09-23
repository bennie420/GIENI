'use client';

import React from 'react';

interface IntakeTabProps {
  documents: any[];
}

export default function IntakeTab({ documents }: IntakeTabProps) {
  return (
    <div className="insight-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3>Preserved Primary Source Documents</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            Immutable raw PDFs preserved in Google Cloud Storage with computed SHA-256 hashes.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => alert('Travis County scraper adapter is simulated for prototype.')}
        >
          Simulate County Scraper Ingestion
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Document File</th>
            <th>Storage URI</th>
            <th>Authentic SHA-256 Hash</th>
            <th>Terms & Provenance</th>
            <th>Ingested At</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <strong>{doc.filename}</strong>
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{doc.storageUri}</td>
              <td>
                <span className="hash-chip">{doc.artifactSha256.slice(0, 16)}...</span>
              </td>
              <td style={{ fontSize: '0.8rem' }}>{doc.termsNote ?? 'Public court filing'}</td>
              <td style={{ fontSize: '0.8rem' }}>{new Date(doc.retrievalTimestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
