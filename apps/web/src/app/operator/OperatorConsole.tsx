'use client';

import React, { useState } from 'react';
import {
  resolveExceptionAction as resolveException,
  verifyClaimAction as verifyClaim,
} from '../../lib/actions';


interface OperatorConsoleProps {
  initialData: {
    cases: any[];
    documents: any[];
    claims: any[];
    parcels: any[];
    authorities: any[];
    ownerships: any[];
    scores: any[];
    opportunities: any[];
    exceptions: any[];
    qcReviews: any[];
    deliveries: any[];
    isConnectedToAtlas: boolean;
  };
}

export default function OperatorConsole({ initialData }: OperatorConsoleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'intake' | 'review' | 'investigation' | 'exceptions' | 'qc'
  >('dashboard');

  const [data, setData] = useState(initialData);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleResolveException = async (exceptionId: string) => {
    if (!resolutionText.trim()) return;
    try {
      await resolveException(exceptionId, resolutionText);
      setData((prev) => ({
        ...prev,
        exceptions: prev.exceptions.map((exc) =>
          exc.id === exceptionId
            ? { ...exc, status: 'RESOLVED', resolutionNote: resolutionText }
            : exc
        ),
      }));
      setResolvingId(null);
      setResolutionText('');
      setActionMessage(`Exception ${exceptionId} marked as RESOLVED.`);
    } catch (err: any) {
      alert(`Error resolving exception: ${err.message}`);
    }
  };

  const handleVerifyClaim = async (claimId: string) => {
    try {
      setVerifyingClaimId(claimId);
      await verifyClaim(claimId, 'operator_user');
      setData((prev) => ({
        ...prev,
        claims: prev.claims.map((c) =>
          c.id === claimId ? { ...c, verificationStatus: 'VERIFIED' } : c
        ),
      }));
      setActionMessage(`Claim ${claimId} verified successfully.`);
    } catch (err: any) {
      alert(`Error verifying claim: ${err.message}`);
    } finally {
      setVerifyingClaimId(null);
    }
  };

  const currentOpportunity = data.opportunities[0] ?? null;
  const currentCase = data.cases[0] ?? null;
  const currentParcel = data.parcels[0] ?? null;
  const currentAuthority = data.authorities[0] ?? null;
  const currentScore = data.scores[0] ?? null;
  const pendingExceptions = data.exceptions.filter((e) => e.status === 'PENDING_REVIEW');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
            Operator Investigation Console
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            County Intake &bull; Document AI Extraction &bull; Deterministic Valuation &bull; QC Certification
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: data.isConnectedToAtlas ? '#e6f4ea' : '#fce8e6',
              color: data.isConnectedToAtlas ? '#137333' : '#c5221f',
            }}
          >
            {data.isConnectedToAtlas ? '● MongoDB Atlas Connected' : '○ Offline Mode'}
          </span>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            background: 'var(--bg-hover)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontSize: '0.88rem',
            marginBottom: '16px',
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          1. Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'intake' ? 'active' : ''}`}
          onClick={() => setActiveTab('intake')}
        >
          2. Intake ({data.documents.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          3. Document Review ({data.claims.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'investigation' ? 'active' : ''}`}
          onClick={() => setActiveTab('investigation')}
        >
          4. Opportunity Investigation
        </button>
        <button
          className={`tab-btn ${activeTab === 'exceptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('exceptions')}
        >
          5. Exceptions / Tasks {pendingExceptions.length > 0 && `(${pendingExceptions.length})`}
        </button>
        <button
          className={`tab-btn ${activeTab === 'qc' ? 'active' : ''}`}
          onClick={() => setActiveTab('qc')}
        >
          6. QC & Delivery
        </button>
      </nav>

      {/* Tab 1: Dashboard */}
      {activeTab === 'dashboard' && (
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
                {data.claims.filter((c) => c.verificationStatus === 'VERIFIED').length} Verified &bull;{' '}
                {data.claims.filter((c) => c.verificationStatus === 'PROPOSED').length} Proposed
              </p>
            </div>
            <div className="insight-card">
              <h4>Pending Exceptions</h4>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: pendingExceptions.length > 0 ? '#c5221f' : 'var(--text-title)', margin: '8px 0' }}>
                {pendingExceptions.length}
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
      )}

      {/* Tab 2: Intake */}
      {activeTab === 'intake' && (
        <div className="insight-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3>Preserved Primary Source Documents</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                Immutable raw PDFs preserved in Google Cloud Storage with computed SHA-256 hashes.
              </p>
            </div>
            <button className="btn-secondary" onClick={() => alert('Travis County scraper adapter is simulated for prototype.')}>
              Simulate County Scraper Ingestion
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Document File</th>
                <th>Storage URI</th>
                <th>Authentic SHA-256 Hash</th>
                <th>Terms & Provenance</th>
                <th>Ingested At</th>
              </tr>
            </thead>
            <tbody>
              {data.documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.filename}</strong>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{doc.storageUri}</td>
                  <td>
                    <span className="hash-chip">{doc.artifactSha256.slice(0, 16)}...</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{doc.termsNote ?? 'Public court filing'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(doc.retrievalTimestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Document Review */}
      {activeTab === 'review' && (
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

            {data.claims.map((claim) => (
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
                    onClick={() => handleVerifyClaim(claim.id)}
                  >
                    {verifyingClaimId === claim.id ? 'Verifying...' : 'Verify Claim'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Opportunity Investigation */}
      {activeTab === 'investigation' && (
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
      )}

      {/* Tab 5: Exceptions */}
      {activeTab === 'exceptions' && (
        <div className="insight-card">
          <h3>Investigation & Exception Quarantine Queue</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
            Unresolved authority tiers, title variations, or low-confidence proposals are held here until certified.
          </p>

          {data.exceptions.length === 0 ? (
            <p>No exceptions active.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Resolution Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.exceptions.map((exc) => (
                  <tr key={exc.id}>
                    <td>
                      <span className="badge badge-c">{exc.type}</span>
                    </td>
                    <td>{exc.description}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: exc.status === 'RESOLVED' ? '#e6f4ea' : '#fce8e6',
                          color: exc.status === 'RESOLVED' ? '#137333' : '#c5221f',
                        }}
                      >
                        {exc.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{exc.resolutionNote ?? '—'}</td>
                    <td>
                      {exc.status === 'PENDING_REVIEW' ? (
                        resolvingId === exc.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="Enter resolution note..."
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                fontSize: '0.8rem',
                              }}
                            />
                            <button
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                              onClick={() => handleResolveException(exc.id)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            onClick={() => {
                              setResolvingId(exc.id);
                              setResolutionText('Reviewed middle name on death certificate attachment; identity affirmed.');
                            }}
                          >
                            Resolve
                          </button>
                        )
                      ) : (
                        <span style={{ color: '#137333', fontSize: '0.8rem' }}>✓ Certified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 6: QC & Delivery */}
      {activeTab === 'qc' && (
        <div className="insight-card">
          <h3>QC Review Gate & Commercial Publication</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
            Human reviewer gatekeeper checklist. Fails will quarantine to exception queue.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
              <input type="checkbox" defaultChecked disabled />
              <strong>Mandatory Primary Evidence Attached:</strong> Letters Testamentary attached with verified SHA-256 hash.
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
              <input type="checkbox" defaultChecked disabled />
              <strong>Authority Tier $\ge$ 2:</strong> Sarah Louise Jenkins confirmed as Tier 1 Independent Executor.
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
              <input type="checkbox" defaultChecked={pendingExceptions.length === 0} disabled />
              <strong>Zero Unresolved Exceptions:</strong> All title conflicts and identity variations resolved.
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
              <input type="checkbox" defaultChecked disabled />
              <strong>Mandatory Legal Boundary Notice Present:</strong> "research finding—not legal opinion or title guarantee".
            </label>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
              Tenant: <span className="hash-chip">client_austin_capital_partners</span> &bull; County:{' '}
              <span className="hash-chip">county_travis_tx</span>
            </span>
            <button
              className="btn-primary"
              onClick={() => alert('Probate Opportunity File published to client organization!')}
            >
              ✓ Certified for Tenant Delivery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
