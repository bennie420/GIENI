'use client';

import React from 'react';

interface InvestigationTabProps {
  currentParcel: any;
  currentScore: any;
}

export default function InvestigationTab({ currentParcel, currentScore }: InvestigationTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div className="insight-card">
        <h3>Matched Assessor Parcel (TCAD)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
          Deterministic cross-reference against Travis County Assessor roll.
        </p>

        {currentParcel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>PARCEL APN</span>
              <strong>{currentParcel.apn}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>LEGAL DESCRIPTION</span>
              <strong>{currentParcel.legalDescription}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>SITUS ADDRESS</span>
              <strong>
                {currentParcel.address.street}, {currentParcel.address.city}, {currentParcel.address.state} {currentParcel.address.zipCode}
              </strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              <div style={{ padding: '8px', background: 'var(--bg-hover)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block' }}>ASSESSED VALUATION</span>
                <strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>
                  ${currentParcel.totalAssessedValue?.toLocaleString()}
                </strong>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-hover)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block' }}>ESTIMATED EQUITY</span>
                <strong style={{ color: '#137333', fontSize: '1.1rem' }}>
                  ${(currentParcel.totalAssessedValue - 75000).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="insight-card">
        <h3>Deterministic Scoring Breakdown</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
          Computed via Rule Version <span className="hash-chip">{currentScore?.ruleVersion ?? 'v1.0.0-deterministic'}</span>
        </p>

        {currentScore && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>COMPOSITE SCORE</span>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {currentScore.compositeScore}/100
                </div>
              </div>
              <span className="badge badge-a" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                {currentScore.priorityBand}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Authority Component (Tier 1 Executor, 35% weight):</span>
                <strong>{currentScore.breakdown?.authorityComponent ?? 95}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ownership Component (Sole Owner, 25% weight):</span>
                <strong>{currentScore.breakdown?.ownershipComponent ?? 90}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Equity Component ($630k Equity, 25% weight):</span>
                <strong>{currentScore.breakdown?.equityComponent ?? 85}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Freshness Component (Recent filing, 15% weight):</span>
                <strong>{currentScore.breakdown?.freshnessComponent ?? 80}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                <span>Risk Penalties:</span>
                <strong style={{ color: '#137333' }}>-0 pts</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
