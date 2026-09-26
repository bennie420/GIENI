import React from 'react';
import { ProbateOpportunityFile, EvidencePointer } from '@gieni/delivery';

interface EvidenceModalProps {
  pof: ProbateOpportunityFile | null;
  onClose: () => void;
}

export function EvidenceModal({ pof, onClose }: EvidenceModalProps) {
  if (!pof) return null;

  const evidenceList: EvidencePointer[] = pof.evidence ?? [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Primary Source Evidence & Provenance</h2>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 8px' }}
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
          Attached court filings and certified excerpts verifying authority and ownership.
        </p>

        {evidenceList.map((ev, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              background: 'var(--bg-body)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>{ev.factSummary || 'Certified Finding'}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                Page {ev.pageNumber}
              </span>
            </div>

            <div className="evidence-box">
              &ldquo;{ev.excerpt}&rdquo;
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '8px' }}>
              Document: <strong>{ev.sourceDocumentName}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Authentic SHA-256: <span className="hash-chip">{ev.artifactSha256}</span>
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
