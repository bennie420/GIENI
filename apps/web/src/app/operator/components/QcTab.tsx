'use client';

import React, { useState } from 'react';
import { Opportunity } from '@gieni/scoring';
import { Claim } from '@gieni/evidence';
import { InvestigationException } from '@gieni/qc';
import { ProbateOpportunityFile } from '@gieni/delivery';
import { certifyAndPublishOpportunityAction } from '../../../lib/actions';

interface QcTabProps {
  hasPendingExceptions?: boolean;
  opportunities?: Opportunity[];
  claims?: Claim[];
  exceptions?: InvestigationException[];
  onPublishSuccess?: (publishedPof: ProbateOpportunityFile) => void;
}

export default function QcTab({
  opportunities = [],
  claims = [],
  exceptions = [],
  onPublishSuccess,
}: QcTabProps) {
  const [selectedOppId, setSelectedOppId] = useState<string>(
    opportunities[0]?.id || ''
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    pofId: string;
    publishedAt: string;
    webhookStatus?: string | null;
    notificationCount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedOpp =
    opportunities.find((o) => o.id === selectedOppId) || opportunities[0] || null;

  const oppClaims = selectedOpp
    ? claims.filter(
        (c) =>
          c.subjectId === selectedOpp.id ||
          c.subjectId === selectedOpp.caseId ||
          (selectedOpp.parcelId && c.subjectId === selectedOpp.parcelId)
      )
    : [];

  const unverifiedClaims = oppClaims.filter((c) => c.verificationStatus !== 'VERIFIED');
  const caseExceptions = selectedOpp
    ? exceptions.filter(
        (e) =>
          (e.opportunityId === selectedOpp.id || (e as any).subjectId === selectedOpp.id) &&
          e.status !== 'RESOLVED'
      )
    : [];

  const authorityTier = selectedOpp?.currentSnapshot.authorityTier ?? 1;
  const isTierEligible = authorityTier < 4;
  const hasUnresolvedExceptions = caseExceptions.length > 0;
  const hasUnverifiedClaims = unverifiedClaims.length > 0;
  const isPublished = selectedOpp?.status === 'PUBLISHED';

  const canPublish =
    selectedOpp &&
    !isPublished &&
    isTierEligible &&
    !hasUnresolvedExceptions &&
    !hasUnverifiedClaims;

  const handleCertifyAndPublish = async () => {
    if (!selectedOpp) return;
    setIsPublishing(true);
    setErrorMessage(null);
    setPublishResult(null);

    try {
      const result = await certifyAndPublishOpportunityAction(selectedOpp.id);
      setPublishResult({
        pofId: result.pof.id,
        publishedAt: result.pof.publishedAt,
        webhookStatus: result.dispatchResult?.status ?? 'No Webhook Configured',
        notificationCount: result.notifications.length,
      });
      if (onPublishSuccess) {
        onPublishSuccess(result.pof);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publication failed';
      setErrorMessage(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!selectedOpp) {
    return (
      <div className="insight-card">
        <h3>QC Review Gate & Commercial Publication</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '8px' }}>
          No opportunities currently projected in queue. Execute a municipal scraper run from the Intake or Counties tab to harvest dockets.
        </p>
      </div>
    );
  }

  const snapshot = selectedOpp.currentSnapshot;

  return (
    <div className="insight-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3>QC Review Gate & Commercial Publication</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            Human reviewer gatekeeper checklist. Fails will quarantine to exception queue.
          </p>
        </div>

        {opportunities.length > 1 && (
          <select
            value={selectedOpp.id}
            onChange={(e) => setSelectedOppId(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.85rem',
            }}
          >
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.currentSnapshot.caseNumber} &bull; {opp.currentSnapshot.decedentName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected Opportunity Header */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{snapshot.caseNumber}</span> &bull;{' '}
          <span style={{ color: 'var(--text-sub)' }}>{snapshot.decedentName}</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '2px' }}>
            APN: {selectedOpp.parcelId ?? 'Unmatched'} &bull; Equity: $
            {(snapshot.estimatedEquity || 0).toLocaleString()} &bull; Score:{' '}
            {snapshot.compositeScore ?? 'N/A'} ({snapshot.priorityBand ?? 'N/A'})
          </div>
        </div>
        <div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: isPublished ? '#064e3b' : '#1e293b',
              color: isPublished ? '#34d399' : '#94a3b8',
            }}
          >
            {selectedOpp.status}
          </span>
        </div>
      </div>

      {/* Dynamic QC Gate Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={!hasUnverifiedClaims} disabled />
          <span>
            <strong>Mandatory Primary Evidence Attached:</strong>{' '}
            {oppClaims.length} claim(s) attached ({unverifiedClaims.length} unverified / proposed).
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={isTierEligible} disabled />
          <span>
            <strong>Authority Tier &le; 3 (Eligible):</strong>{' '}
            {snapshot.fiduciaryName ? `${snapshot.fiduciaryName} (Tier ${authorityTier})` : `Tier ${authorityTier} (Unappointed - Blocked if Tier 4)`}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={!hasUnresolvedExceptions} disabled />
          <span>
            <strong>Zero Unresolved Exceptions:</strong>{' '}
            {caseExceptions.length === 0 ? 'All exceptions clear.' : `${caseExceptions.length} pending critical exception(s).`}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={true} disabled />
          <span>
            <strong>Mandatory Legal Boundary Notice Present:</strong> &quot;research finding—not legal opinion or title guarantee&quot;.
          </span>
        </label>
      </div>

      {/* Publication Result or Error Notification */}
      {publishResult && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: '#064e3b',
            color: '#a7f3d0',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          <strong>✓ Publication Successful:</strong> Probate Opportunity File{' '}
          <code>{publishResult.pofId}</code> generated and persisted to delivery store. Webhook status:{' '}
          <strong>{publishResult.webhookStatus}</strong> &bull; {publishResult.notificationCount} notification event(s) queued.
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: '#450a0a',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '16px',
            whiteSpace: 'pre-wrap',
          }}
        >
          <strong>⚠️ Publication Blocked:</strong> {errorMessage}
        </div>
      )}

      {/* Operator Certification Action Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          County: <span className="hash-chip">{selectedOpp.countyId || 'county_travis_tx'}</span> &bull; Scope: Certified Delivery
        </span>
        <button
          className="btn-primary"
          onClick={handleCertifyAndPublish}
          disabled={!canPublish || isPublishing}
          style={{
            opacity: canPublish && !isPublishing ? 1 : 0.6,
            cursor: canPublish && !isPublishing ? 'pointer' : 'not-allowed',
          }}
        >
          {isPublishing
            ? 'Publishing to Client Tenant...'
            : isPublished
            ? '✓ Already Published'
            : '✓ Certified for Tenant Delivery'}
        </button>
      </div>
    </div>
  );
}
