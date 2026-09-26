'use client';

import React from 'react';
import { OperatorData } from '../types';

interface DashboardTabProps {
  data: OperatorData;
  pendingExceptionsCount: number;
  onOpenScraperModal?: () => void;
}

export default function DashboardTab({
  data,
  pendingExceptionsCount,
  onOpenScraperModal,
}: DashboardTabProps) {
  const verifiedClaimsCount = data.claims.filter((c) => c.verificationStatus === 'VERIFIED').length;
  const proposedClaimsCount = data.claims.filter((c) => c.verificationStatus === 'PROPOSED').length;

  return (
    <div>
      {/* Real-time Municipal Scraper Quick-Action Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #172033 100%)',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#312e81',
              color: '#a5b4fc',
              fontSize: '1.1rem',
            }}
          >
            &#9881;
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
                Municipal Intake Harvester
              </strong>
              <span
                style={{
                  background: '#064e3b',
                  color: '#34d399',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                READY
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Travis County (TX) & Maricopa County (AZ) adapters calibrated. {data.documents.length} filings preserved in cloud evidence vault.
            </p>
          </div>
        </div>

        {onOpenScraperModal && (
          <button
            type="button"
            onClick={onOpenScraperModal}
            style={{
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>&#9654;</span>
            <span>Launch Municipal Scraper</span>
          </button>
        )}
      </div>

      <div className="insights-container">
        <div className="insight-card">
          <h4>Active Probate Cases</h4>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-title)', margin: '8px 0' }}>
            {data.cases.length}
          </p>
          <p>Travis County, TX &bull; 2026 Probate Dockets</p>
        </div>
        <div className="insight-card">
          <h4>Extracted AI Claims</h4>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-title)', margin: '8px 0' }}>
            {data.claims.length}
          </p>
          <p>
            {verifiedClaimsCount} Verified &bull; {proposedClaimsCount} Proposed
          </p>
        </div>
        <div className="insight-card">
          <h4>Pending Exceptions</h4>
          <p
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: pendingExceptionsCount > 0 ? '#c5221f' : 'var(--text-title)',
              margin: '8px 0',
            }}
          >
            {pendingExceptionsCount}
          </p>
          <p>Ambiguities quarantined from commercial delivery</p>
        </div>
        <div className="insight-card">
          <h4>Published Deliveries</h4>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#137333', margin: '8px 0' }}>
            {data.deliveries.length}
          </p>
          <p>Evidence-backed Probate Opportunity Files (POF)</p>
        </div>
      </div>

      <div className="insight-card" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Current Operational Opportunities Projection</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Case #</th>
              <th>Estate Decedent</th>
              <th>Assessed Property</th>
              <th>Authority Tier</th>
              <th>Deterministic Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.opportunities.map((opp) => (
              <tr key={opp.id}>
                <td>
                  <strong>{opp.currentSnapshot.caseNumber}</strong>
                </td>
                <td>{opp.currentSnapshot.decedentName}</td>
                <td>{opp.currentSnapshot.propertyAddress ?? 'Unresolved'}</td>
                <td>
                  Tier {opp.currentSnapshot.authorityTier} &bull; {opp.currentSnapshot.fiduciaryName ?? 'Unappointed'}
                </td>
                <td>
                  <span className={`badge ${opp.currentSnapshot.priorityBand === 'PRIORITY_A' ? 'badge-a' : 'badge-b'}`}>
                    {opp.currentSnapshot.priorityBand} ({opp.currentSnapshot.compositeScore}/100)
                  </span>
                </td>
                <td>
                  <span className="badge badge-a">{opp.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
