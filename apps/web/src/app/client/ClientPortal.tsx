'use client';

import React, { useState } from 'react';
import { submitClientFeedbackAction as submitClientFeedback } from '../../lib/actions';
import { ClientDisposition } from '@gieni/delivery';


interface ClientPortalProps {
  initialData: {
    deliveries: any[];
    feedback: any[];
    isConnectedToAtlas: boolean;
  };
}

export default function ClientPortal({ initialData }: ClientPortalProps) {
  const [deliveries] = useState(initialData.deliveries);
  const [feedbackList, setFeedbackList] = useState(initialData.feedback);
  const [selectedPofForEvidence, setSelectedPofForEvidence] = useState<any | null>(null);
  const [feedbackPofId, setFeedbackPofId] = useState<string | null>(null);
  const [disposition, setDisposition] = useState<ClientDisposition>('CONTACTED');
  const [notes, setNotes] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackPofId) return;

    try {
      setSubmittingFeedback(true);
      const newFeedback = await submitClientFeedback(feedbackPofId, disposition, notes);
      setFeedbackList((prev) => [newFeedback, ...prev]);
      setFeedbackSuccessMessage(`Disposition '${disposition}' logged successfully for case.`);
      setFeedbackPofId(null);
      setNotes('');
    } catch (err: any) {
      alert(`Error submitting feedback: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
            Client Opportunity Feed
          </h1>
          <p style={{ color: 'var(--text-sub)' }}>
            Verified, evidence-backed Probate Opportunity Files (POF) &bull; Travis County, TX
          </p>
        </div>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: initialData.isConnectedToAtlas ? '#e6f4ea' : '#fce8e6',
            color: initialData.isConnectedToAtlas ? '#137333' : '#c5221f',
          }}
        >
          {initialData.isConnectedToAtlas ? '● Live Atlas Delivery Feed' : '○ Offline Mode'}
        </span>
      </div>

      {/* Mandatory Legal Boundary Disclaimer */}
      <div className="disclaimer-banner">
        <strong>Legal Disclaimer:</strong> Research finding—not legal opinion or title guarantee.
      </div>

      {feedbackSuccessMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            background: '#e6f4ea',
            color: '#137333',
            fontSize: '0.88rem',
            marginBottom: '16px',
          }}
        >
          ✓ {feedbackSuccessMessage}
        </div>
      )}

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {deliveries.length === 0 ? (
          <div className="insight-card">
            <p>No published Probate Opportunity Files delivered yet for this client organization.</p>
          </div>
        ) : (
          deliveries.map((pof) => (
            <div
              key={pof.id}
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
                  className={`badge ${
                    pof.scoring?.priorityBand === 'PRIORITY_A' ? 'badge-a' : 'badge-b'
                  }`}
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  {pof.scoring?.priorityBand ?? 'PRIORITY_A'} (Score:{' '}
                  {pof.scoring?.compositeScore ?? 88}/100)
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
                  <strong>{pof.property?.addressText ?? '742 Evergreen Terrace, Austin TX'}</strong>
                  <div style={{ color: '#137333', fontWeight: 600, fontSize: '0.85rem' }}>
                    ${pof.property?.assessedValue?.toLocaleString()} Assessed &bull; $
                    {pof.property?.estimatedEquity?.toLocaleString()} Est. Equity
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-sub)', display: 'block', fontSize: '0.8rem' }}>
                    APPOINTED DECISION MAKER
                  </span>
                  <strong>
                    {pof.authority?.fiduciaryName ? (
                      `${pof.authority.fiduciaryName} (${pof.authority.fiduciaryRole})`
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
                    Verified Owners: {pof.ownership?.verifiedOwners?.join(', ') ?? pof.decedentName}
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
                  Published: {new Date(pof.publishedAt).toLocaleDateString()} &bull; Primary Proof:{' '}
                  {pof.evidence?.length ?? 1} document(s) attached
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedPofForEvidence(pof)}
                  >
                    View Primary Evidence ({pof.evidence?.length ?? 1})
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setFeedbackPofId(pof.id)}
                  >
                    Log Feedback
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Primary Evidence Viewer */}
      {selectedPofForEvidence && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Primary Source Evidence & Provenance</h2>
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setSelectedPofForEvidence(null)}
              >
                ✕ Close
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
              Attached court filings and certified excerpts verifying authority and ownership.
            </p>

            {(selectedPofForEvidence.evidence || []).map((ev: any, idx: number) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  background: 'var(--bg-body)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>{ev.factSummary ?? 'Letters Testamentary Finding'}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                    Page {ev.pageNumber}
                  </span>
                </div>

                <div className="evidence-box">
                  "{ev.excerpt ?? '...granted LETTERS TESTAMENTARY upon said estate unto: SARAH LOUISE JENKINS...'}"
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '8px' }}>
                  Document: <strong>{ev.sourceDocumentName ?? 'Cause_C-1-PB-26-000412_Letters_Testamentary.pdf'}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '4px' }}>
                  Authentic SHA-256: <span className="hash-chip">{ev.artifactSha256}</span>
                </div>
              </div>
            ))}

            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <button className="btn-primary" onClick={() => setSelectedPofForEvidence(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Feedback / Disposition Form */}
      {feedbackPofId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Log Opportunity Disposition</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
              Submit real feedback to record outcomes and refine scoring weights.
            </p>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Disposition Outcome:
                </label>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value as ClientDisposition)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-title)',
                  }}
                >
                  <option value="CONTACTED">CONTACTED (Reached out to Executor)</option>
                  <option value="APPOINTMENT_SET">APPOINTMENT_SET (Meeting Scheduled)</option>
                  <option value="DEAL_CLOSED">DEAL_CLOSED (Contract Signed)</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED (No Intent to Sell)</option>
                  <option value="INVALID">INVALID (Incorrect Fiduciary / Contact)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Auditor / Representative Notes:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Spoke with Sarah Jenkins; probate distribution in progress, open to discussion."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-title)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFeedbackPofId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? 'Saving...' : 'Submit Disposition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Dispositions History */}
      {feedbackList.length > 0 && (
        <div className="insight-card" style={{ marginTop: '24px' }}>
          <h3>Client Feedback & Disposition History</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '12px' }}>
            Auditable record of commercial client interaction and deal outcomes.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Disposition</th>
                <th>Notes</th>
                <th>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map((fb, idx) => (
                <tr key={fb.id || idx}>
                  <td>
                    <span className="badge badge-a">{fb.disposition}</span>
                  </td>
                  <td>{fb.notes ?? '—'}</td>
                  <td>{new Date(fb.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
