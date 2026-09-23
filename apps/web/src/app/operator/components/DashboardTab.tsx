'use client';

import React from 'react';
import { OperatorData } from '../types';

interface DashboardTabProps {
  data: OperatorData;
  pendingExceptionsCount: number;
}

export default function DashboardTab({ data, pendingExceptionsCount }: DashboardTabProps) {
  const verifiedClaimsCount = data.claims.filter((c) => c.verificationStatus === 'VERIFIED').length;
  const proposedClaimsCount = data.claims.filter((c) => c.verificationStatus === 'PROPOSED').length;

  return (
    <div>
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
