'use client';

import React from 'react';

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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
      <div className="insight-card">
        <h3>Primary Court Filing Evidence</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '12px' }}>
          Docket: Cause No. C-1-PB-26-000412 &bull; Probate Court No. 1, Travis County, Texas
        </p>
        <div className="evidence-box">
          {`IN THE PROBATE COURT NO. 1, TRAVIS COUNTY, TEXAS
ESTATE OF ARTHUR JAMES JENKINS, DECEASED
CAUSE NO. C-1-PB-26-000412

ORDER ADMITTING WILL TO PROBATE AND
AUTHORIZING LETTERS TESTAMENTARY

On this 1st day of March, 2026, came on to be heard the Application for Probate of Will and Issuance of Letters Testamentary filed herein by SARAH LOUISE JENKINS.

The Court finds that Arthur James Jenkins is dead, that four years have not elapsed since his death, and that this Court has jurisdiction and venue of the estate.

It is therefore ORDERED that said Will is admitted to probate, and that:
SARAH LOUISE JENKINS
is appointed Independent Executor of said Will and Estate, without bond, and that LETTERS TESTAMENTARY issue to her upon taking the oath required by law.`}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '8px' }}>
          Locator: <span className="hash-chip">p1_para3_line1-4</span> &bull; Verified SHA-256 Checksum Match
        </div>
      </div>

      <div className="insight-card">
        <h3>Extracted AI Claims (Proposals)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '12px' }}>
          LLM proposals are stored as PROPOSED until certified by an operator.
        </p>

        {claims.map((claim) => (
          <div
            key={claim.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              background: 'var(--bg-card)',
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
              Value:{' '}
              <strong>
                {typeof claim.proposedValue === 'object'
                  ? JSON.stringify(claim.proposedValue)
                  : String(claim.proposedValue)}
              </strong>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '8px' }}>
              Confidence: {(claim.confidence * 100).toFixed(0)}% &bull; Model: {claim.modelVersion}
            </div>

            {claim.verificationStatus === 'PROPOSED' && (
              <button
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                disabled={verifyingClaimId === claim.id}
                onClick={() => onVerifyClaim(claim.id)}
              >
                {verifyingClaimId === claim.id ? 'Verifying...' : 'Verify Claim'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
