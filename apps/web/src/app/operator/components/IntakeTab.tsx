'use client';

import React from 'react';

interface IntakeTabProps {
  documents: any[];
  onOpenScraperModal: () => void;
}

export default function IntakeTab({ documents, onOpenScraperModal }: IntakeTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Ingestion Control */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: '1px solid #312e81',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#4338ca',
                color: '#e0e7ff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Intake Subsystem
            </span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
              Municipal Court Docket Harvester & Evidence Vault
            </h3>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '650px' }}>
            Direct ingestion from county portals (Travis County Probate Court No. 1, Maricopa Superior Court).
            All filings are cryptographically hashed (SHA-256) and preserved before downstream pipeline extraction.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScraperModal}
          style={{
            background: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 22px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
            transition: 'background 0.2s, transform 0.1s',
          }}
        >
          <span>&#9654;</span>
          <span>Launch Municipal Scraper</span>
        </button>
      </div>

      {/* Main Documents Table Card */}
      <div className="insight-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Preserved Primary Source Filings ({documents.length})</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
              Raw public records preserved in Google Cloud Storage with immutable tamper-evident SHA-256 digests.
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
            &bull; Live Evidence Provenance 100%
          </span>
        </div>

        {documents.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px dashed #334155',
              borderRadius: '8px',
              background: '#090d16',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>&#128196;</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.05rem' }}>No Primary Documents Ingested Yet</h4>
            <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Launch the municipal scraper to harvest newly recorded probate petitions and preserve primary evidence.
            </p>
            <button
              type="button"
              onClick={onOpenScraperModal}
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Launch Scraper Now
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document File</th>
                <th>Storage URI</th>
                <th>Cryptographic SHA-256 Digest</th>
                <th>Terms & Provenance</th>
                <th>Ingested Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong style={{ color: 'var(--accent)' }}>{doc.filename}</strong>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {doc.storageUri}
                  </td>
                  <td>
                    <span className="hash-chip" title={doc.artifactSha256}>
                      {doc.artifactSha256.slice(0, 16)}...
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                    {doc.termsNote ?? 'Public court filing'}
                  </td>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(doc.retrievalTimestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
