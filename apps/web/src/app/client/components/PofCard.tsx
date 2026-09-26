import React from 'react';
import { ProbateOpportunityFile } from '@gieni/delivery';

interface PofCardProps {
  pof: ProbateOpportunityFile;
  onViewEvidence: (pof: ProbateOpportunityFile) => void;
  onLogFeedback: (pofId: string) => void;
}

export function PofCard({ pof, onViewEvidence, onLogFeedback }: PofCardProps) {
  const isPriorityA = pof.scoring?.priorityBand === 'PRIORITY_A';
  const badgeClass = isPriorityA ? 'badge-a' : 'badge-b';
  const priorityText = pof.scoring?.priorityBand ?? 'UNSCORED';
  const scoreText = pof.scoring?.compositeScore !== undefined ? `${pof.scoring.compositeScore}/100` : 'N/A';

  const address = pof.property?.addressText || (pof.property?.recordsLocated === false ? 'No records located' : 'Unindexed Address');
  const assessedText = pof.property?.assessedValue != null ? `$${pof.property.assessedValue.toLocaleString()} Assessed` : 'Value Pending';
  const equityText = pof.property?.estimatedEquity != null ? `$${pof.property.estimatedEquity.toLocaleString()} Est. Equity` : 'Equity Pending';

  const fiduciaryText = pof.authority?.fiduciaryName
    ? `${pof.authority.fiduciaryName} (${pof.authority.fiduciaryRole})`
    : 'Unappointed / Null';

  const ownersText = pof.ownership?.verifiedOwners?.length
    ? pof.ownership.verifiedOwners.join(', ')
    : (pof.decedentName || 'Unindexed');

  const evidenceCount = pof.evidence?.length ?? 0;
  const publishedDate = pof.publishedAt ? new Date(pof.publishedAt).toLocaleDateString() : 'Unpublished';

  return (
    <div
      className="insight-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>
            Cause No. {pof.caseNumber}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            &bull; Travis County, TX
          </span>
        </div>
        <span
          className={`badge ${badgeClass}`}
          style={{ fontSize: '0.85rem', padding: '6px 14px' }}
        >
          {priorityText} (Score: {scoreText})
        </span>
      </div>

      {/* Facts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          fontSize: '0.9rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>
            ESTATE DECEDENT
          </span>
          <strong style={{ fontSize: '1.05rem' }}>{pof.decedentName}</strong>
        </div>

        <div>
          <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>
            ASSESSED PROPERTY & VALUATION
          </span>
          <strong>{address}</strong>
          <div style={{ color: '#137333', fontWeight: 600, fontSize: '0.85rem' }}>
            {assessedText} &bull; {equityText}
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>
            APPOINTED DECISION MAKER
          </span>
          <strong>
            {pof.authority?.fiduciaryName ? (
              fiduciaryText
            ) : (
              <em style={{ color: 'var(--text-sub)' }}>Unappointed / Null</em>
            )}
          </strong>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
            {pof.authority?.lettersIssued ? '✓ Letters Testamentary Issued' : 'Letters Pending'}
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>
            TITLE & OWNERSHIP
          </span>
          <strong>{pof.ownership?.status ?? 'DECEDENT_SOLE_OWNER'}</strong>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
            Verified Owners: {ownersText}
          </div>
        </div>
      </div>

      {/* Recommended Action */}
      <div
        style={{
          background: 'var(--bg-hover)',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.9rem',
        }}
      >
        <strong style={{ color: 'var(--accent)' }}>Recommended Action: </strong>
        {pof.recommendedAction ?? 'Engage Executor directly. Title is clear and letters are issued.'}
      </div>

      {/* Actions Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
          Published: {publishedDate} &bull; Primary Proof:{' '}
          {evidenceCount} document(s) attached
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onViewEvidence(pof)}
          >
            View Primary Evidence ({evidenceCount})
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onLogFeedback(pof.id)}
          >
            Log Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
