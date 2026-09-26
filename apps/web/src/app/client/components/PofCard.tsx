import React from 'react';
import { ProbateOpportunityFile } from '@gieni/delivery';

interface PofCardProps {
  pof: ProbateOpportunityFile;
  onViewEvidence: (pof: ProbateOpportunityFile) => void;
  onLogFeedback: (pofId: string) => void;
}

function getScoreDisplay(scoring?: ProbateOpportunityFile['scoring']) {
  const isPriorityA = scoring?.priorityBand === 'PRIORITY_A';
  const badgeClass = isPriorityA ? 'badge-a' : 'badge-b';
  const priorityText = scoring?.priorityBand ?? 'UNSCORED';
  const scoreText = scoring?.compositeScore !== undefined ? `${scoring.compositeScore}/100` : 'N/A';
  return { badgeClass, priorityText, scoreText };
}

function getPropertyDisplay(property?: ProbateOpportunityFile['property']) {
  let address = 'Unindexed Address';
  if (property?.addressText) {
    address = property.addressText;
  } else if (property?.recordsLocated === false) {
    address = 'No records located';
  }

  const assessedText = property?.assessedValue != null
    ? `$${property.assessedValue.toLocaleString()} Assessed`
    : 'Value Pending';

  const equityText = property?.estimatedEquity != null
    ? `$${property.estimatedEquity.toLocaleString()} Est. Equity`
    : 'Equity Pending';

  return { address, assessedText, equityText };
}

function getAuthorityDisplay(authority?: ProbateOpportunityFile['authority']) {
  const hasFiduciary = Boolean(authority?.fiduciaryName);
  const fiduciaryText = hasFiduciary
    ? `${authority?.fiduciaryName} (${authority?.fiduciaryRole})`
    : 'Unappointed / Null';
  const lettersText = authority?.lettersIssued
    ? '✓ Letters Testamentary Issued'
    : 'Letters Pending';

  return { hasFiduciary, fiduciaryText, lettersText };
}

function getOwnersDisplay(ownership?: ProbateOpportunityFile['ownership'], fallbackName?: string) {
  if (ownership?.verifiedOwners && ownership.verifiedOwners.length > 0) {
    return ownership.verifiedOwners.join(', ');
  }
  return fallbackName || 'Unindexed';
}

function getPublishedDate(publishedAt?: string): string {
  if (!publishedAt) return 'Unpublished';
  return new Date(publishedAt).toLocaleDateString();
}

function PofFactsGrid({ pof }: { pof: ProbateOpportunityFile }) {
  const { address, assessedText, equityText } = getPropertyDisplay(pof.property);
  const { hasFiduciary, fiduciaryText, lettersText } = getAuthorityDisplay(pof.authority);
  const ownersText = getOwnersDisplay(pof.ownership, pof.decedentName);

  return (
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
          {hasFiduciary ? (
            fiduciaryText
          ) : (
            <em style={{ color: 'var(--text-sub)' }}>Unappointed / Null</em>
          )}
        </strong>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
          {lettersText}
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
  );
}

export function PofCard({ pof, onViewEvidence, onLogFeedback }: PofCardProps) {
  const { badgeClass, priorityText, scoreText } = getScoreDisplay(pof.scoring);
  const evidenceCount = pof.evidence?.length ?? 0;
  const publishedDate = getPublishedDate(pof.publishedAt);
  const recommendedAction = pof.recommendedAction ?? 'Engage Executor directly. Title is clear and letters are issued.';

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
      <PofFactsGrid pof={pof} />

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
        {recommendedAction}
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
