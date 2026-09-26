'use client';

import React, { useState } from 'react';
import { ProbateOpportunityFile, LEGAL_DISCLAIMER } from '@gieni/delivery';
import { PofCard } from './PofCard';

interface OnboardingHeroProps {
  onExploreSample: (sample: ProbateOpportunityFile) => void;
  onOpenWebhookSetup: () => void;
}

export const SAMPLE_OPPORTUNITY: ProbateOpportunityFile = {
  id: 'sample_austin_deal_01',
  organizationId: 'org_sample_preview',
  clientId: 'client_sample_preview',
  countyId: 'county_travis_tx',
  caseNumber: 'PR-2026-004128',
  decedentName: 'Eleanor Vance Sterling',
  filingDate: '2026-03-12T00:00:00.000Z',
  property: {
    apn: '01-2894-0012',
    addressText: '3814 Westlake Hills Dr, Austin, TX 78746',
    assessedValue: 1250000,
    estimatedEquity: 980000,
    recordsLocated: true,
  },
  ownership: {
    status: 'DECEDENT_SOLE_OWNER',
    verifiedOwners: ['Eleanor Vance Sterling'],
  },
  authority: {
    status: 'CONFIRMED',
    tier: 1,
    fiduciaryName: 'Marcus Sterling',
    fiduciaryRole: 'EXECUTOR',
    lettersIssued: true,
  },
  scoring: {
    compositeScore: 96,
    priorityBand: 'PRIORITY_A',
    ruleVersion: 'v1.0.0-deterministic',
  },
  evidence: [
    {
      claimPath: 'authority.fiduciary',
      factSummary: 'Letters Testamentary issued by Travis County Probate Court #1',
      sourceDocumentName: 'Travis_Letters_Testamentary_PR-2026-004128.pdf',
      pageNumber: 1,
      excerpt: 'Marcus Sterling is hereby confirmed and appointed Independent Executor without bond.',
      artifactSha256: '9f83c12a781b24192b15e4a7a8d8329b35b719c8f002b489a23c3161c6b55928',
    },
    {
      claimPath: 'property.parcel',
      factSummary: 'Travis Central Appraisal District (TCAD) parcel match',
      sourceDocumentName: 'TCAD_Assessment_2026.pdf',
      pageNumber: 1,
      excerpt: 'Account: 0128940012 | Owner: STERLING ELEANOR V | Market Value: $1,250,000',
      artifactSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  ],
  recommendedAction: 'Immediate high-equity outreach to Marcus Sterling (Independent Executor).',
  disclaimer: LEGAL_DISCLAIMER,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  schemaVersion: 1,
};

export function OnboardingHero({ onExploreSample, onOpenWebhookSetup }: OnboardingHeroProps) {
  const [showSampleCard, setShowSampleCard] = useState(false);

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid #d2e3fc',
        background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)',
        padding: '28px',
        marginTop: '12px',
        marginBottom: '28px',
        boxShadow: '0 2px 8px rgba(26, 115, 232, 0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ maxWidth: '650px' }}>
          <span
            style={{
              display: 'inline-block',
              background: '#e8f0fe',
              color: '#1a73e8',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
            }}
          >
            Welcome to Gieni OS
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#202124', marginBottom: '8px' }}>
            Zero-Synthetic Probate Intelligence Feed
          </h2>
          <p style={{ color: '#5f6368', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Your organization is configured for live municipal publication. When Travis County, King County, or Pierce County records pass Quality Control and publication gates, verified files will stream here instantly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setShowSampleCard(!showSampleCard);
              if (!showSampleCard) onExploreSample(SAMPLE_OPPORTUNITY);
            }}
            style={{
              padding: '10px 16px',
              background: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {showSampleCard ? 'Hide Verified Sample' : 'Explore Verified Sample Dossier'}
          </button>

          <button
            onClick={onOpenWebhookSetup}
            style={{
              padding: '10px 16px',
              background: '#ffffff',
              color: '#1a73e8',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Configure Webhook Endpoint
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e8eaed',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600 }}>Active Coverage</div>
          <div style={{ fontWeight: 600, color: '#202124', marginTop: '2px' }}>Travis (TX) &bull; Pierce (WA) &bull; King (WA) &bull; Thurston (WA) &bull; Maricopa (AZ)</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600 }}>Delivery Standard</div>
          <div style={{ fontWeight: 600, color: '#137333', marginTop: '2px' }}>100% Verified Primary Source Evidence</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600 }}>Zero Synthetic Policy</div>
          <div style={{ fontWeight: 600, color: '#202124', marginTop: '2px' }}>Strict Nulling for Missing Fiduciaries</div>
        </div>
      </div>

      {showSampleCard && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase' }}>
              Sample Verified Probate Opportunity File (POF)
            </span>
            <span style={{ fontSize: '0.75rem', background: '#fef7e0', color: '#b06000', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Preview Mode
            </span>
          </div>
          <PofCard
            pof={SAMPLE_OPPORTUNITY}
            onViewEvidence={onExploreSample}
            onLogFeedback={() => {}}
          />
        </div>
      )}
    </div>
  );
}
