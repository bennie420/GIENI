'use client';

import React, { useState } from 'react';

interface ReviewTabProps {
  claims: any[];
  verifyingClaimId: string | null;
  onVerifyClaim: (claimId: string) => Promise<void>;
}

export default function ReviewTab({
  claims,
  verifyingClaimId,
  onVerifyClaim,
}: ReviewTabProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    claims.length > 0 ? claims[0].id : null
  );

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

  // Map claim to specific evidentiary excerpt
  const getEvidenceDetails = (claim: any) => {
    if (!claim) {
      return {
        excerpt: 'No claim selected.',
        page: 1,
        locator: 'N/A',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        sourceType: 'COURT',
        courtName: 'Probate Court No. 1, Travis County, Texas',
      };
    }

    if (claim.fieldPath?.includes('fiduciary') || claim.fieldPath?.includes('executor')) {
      return {
        excerpt: `ORDER ADMITTING WILL TO PROBATE AND AUTHORIZING LETTERS TESTAMENTARY\n\nOn this 1st day of March, 2026, came on to be heard the Application for Probate of Will and Issuance of Letters Testamentary filed herein by SARAH LOUISE JENKINS.\n\nThe Court finds that Arthur James Jenkins is dead, that four years have not elapsed since his death, and that this Court has jurisdiction and venue of the estate.\n\nIt is therefore ORDERED that said Will is admitted to probate, and that SARAH LOUISE JENKINS is appointed Independent Executor of said Will and Estate, without bond, and that LETTERS TESTAMENTARY issue to her upon taking the oath required by law.`,
        page: 1,
        locator: 'p1_para3_line1-6',
        sha256: '4a6b2c89f13e77a0bc0928e441bc19df273a00508a8e03efb7c7f3b8908851aa',
        sourceType: 'COURT_ORDER',
        courtName: 'Travis County Probate Court No. 1',
      };
    }

    if (claim.fieldPath?.includes('dateOfDeath') || claim.fieldPath?.includes('decedent')) {
      return {
        excerpt: `APPLICATION FOR PROBATE OF WILL AND FOR LETTERS TESTAMENTARY\n\nTO THE HONORABLE JUDGE OF SAID COURT:\nSARAH LOUISE JENKINS ("Applicant") furnishes the following information:\n1. Decedent Arthur James Jenkins died on January 14, 2026 in Austin, Travis County, Texas at the age of 78 years.\n2. Decedent had his domicile and fixed place of residence in Travis County, Texas at 4502 Elm Wood Trl, Austin, TX 78745.`,
        page: 1,
        locator: 'p1_para1-2',
        sha256: '8f7e2d1a33b901fc88a1029471928374619a8b7c6d5e4f3a2b1c0d9e8f7a6b5c',
        sourceType: 'COURT_APPLICATION',
        courtName: 'Travis County Probate Court No. 1',
      };
    }

    return {
      excerpt: `IN THE PROBATE COURT NO. 1, TRAVIS COUNTY, TEXAS\nCAUSE NO. C-1-PB-26-000412\nESTATE OF ARTHUR JAMES JENKINS, DECEASED\n\nPrimary Case File & Attestation Record Verified by Travis County Clerk.`,
      page: 1,
      locator: 'p1_heading_line1-4',
      sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      sourceType: 'COURT',
      courtName: 'Travis County Probate Court No. 1',
    };
  };

  const evidence = getEvidenceDetails(selectedClaim);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-accent)' }}>
          Side-by-Side Evidence Research Viewer (RC-001)
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          Direct provenance verification linking proposed extraction claims to primary document SHA-256 evidence.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px' }}>
        {/* Left: Primary Source Document Evidence Viewer */}
        <div className="insight-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-accent)' }}>
              Primary Source Document Evidence
            </h4>
            <span className="badge badge-a" style={{ fontSize: '0.7rem' }}>
              {evidence.sourceType}
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', marginBottom: '10px' }}>
            Court: <strong>{evidence.courtName}</strong> &bull; Cause No. C-1-PB-26-000412
          </div>

          <div
            className="evidence-box"
            style={{
              maxHeight: '360px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.82rem',
              lineHeight: '1.5',
            }}
          >
            {evidence.excerpt}
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              Source Document Locator: <span className="hash-chip">{evidence.locator}</span> &bull; Page {evidence.page}
            </div>
            <div>
              Artifact SHA-256 Fingerprint:
              <span className="hash-chip" style={{ wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
                {evidence.sha256}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Claims Audit List */}
        <div className="insight-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-accent)' }}>
              Extracted Claims & Proposals ({claims.length})
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
              Click claim to inspect evidence
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto' }}>
            {claims.map((claim) => {
              const isSelected = selectedClaim?.id === claim.id;
              return (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  style={{
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px',
                    background: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{claim.fieldPath}</span>
                    <span
                      className="badge"
                      style={{
                        background: claim.verificationStatus === 'VERIFIED' ? '#e6f4ea' : '#fff8e1',
                        color: claim.verificationStatus === 'VERIFIED' ? '#137333' : '#b06000',
                      }}
                    >
                      {claim.verificationStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                    Proposed Value:{' '}
                    <strong>
                      {typeof claim.proposedValue === 'object'
                        ? JSON.stringify(claim.proposedValue)
                        : String(claim.proposedValue)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                    <span>Confidence: {(claim.confidence * 100).toFixed(0)}% &bull; Model: {claim.modelVersion}</span>
                    {claim.verificationStatus === 'PROPOSED' && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        disabled={verifyingClaimId === claim.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerifyClaim(claim.id);
                        }}
                      >
                        {verifyingClaimId === claim.id ? 'Verifying...' : 'Verify Claim'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
