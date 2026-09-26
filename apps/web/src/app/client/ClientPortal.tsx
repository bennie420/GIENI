'use client';

import React, { useState } from 'react';
import { submitClientFeedbackAction as submitClientFeedback } from '../../lib/actions';
import { ClientDisposition, ProbateOpportunityFile, ClientFeedback } from '@gieni/delivery';
import { PofCard } from './components/PofCard';
import { EvidenceModal } from './components/EvidenceModal';
import { DispositionModal } from './components/DispositionModal';
import { FeedbackHistoryTable } from './components/FeedbackHistoryTable';

interface ClientPortalProps {
  initialData: {
    deliveries: ProbateOpportunityFile[];
    feedback: ClientFeedback[];
    isConnectedToAtlas: boolean;
  };
}

export default function ClientPortal({ initialData }: ClientPortalProps) {
  const [deliveries] = useState<ProbateOpportunityFile[]>(initialData.deliveries);
  const [feedbackList, setFeedbackList] = useState<ClientFeedback[]>(initialData.feedback);
  const [selectedPofForEvidence, setSelectedPofForEvidence] = useState<ProbateOpportunityFile | null>(null);
  const [feedbackPofId, setFeedbackPofId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);

  const handleFeedbackSubmit = async (
    pofId: string,
    disposition: ClientDisposition,
    notes: string
  ) => {
    try {
      setSubmittingFeedback(true);
      const newFeedback = await submitClientFeedback(pofId, disposition, notes);
      setFeedbackList((prev) => [newFeedback, ...prev]);
      setFeedbackSuccessMessage(`Disposition '${disposition}' logged successfully for case.`);
      setFeedbackPofId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error submitting feedback: ${message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const statusBg = initialData.isConnectedToAtlas ? '#e6f4ea' : '#fce8e6';
  const statusColor = initialData.isConnectedToAtlas ? '#137333' : '#c5221f';
  const statusLabel = initialData.isConnectedToAtlas ? '● Live Atlas Delivery Feed' : '○ Offline Mode';

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
            background: statusBg,
            color: statusColor,
          }}
        >
          {statusLabel}
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
            <PofCard
              key={pof.id}
              pof={pof}
              onViewEvidence={setSelectedPofForEvidence}
              onLogFeedback={setFeedbackPofId}
            />
          ))
        )}
      </div>

      {/* Primary Evidence Modal */}
      <EvidenceModal
        pof={selectedPofForEvidence}
        onClose={() => setSelectedPofForEvidence(null)}
      />

      {/* Disposition / Feedback Modal */}
      <DispositionModal
        pofId={feedbackPofId}
        onClose={() => setFeedbackPofId(null)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={submittingFeedback}
      />

      {/* Recent Dispositions History */}
      <FeedbackHistoryTable feedbackList={feedbackList} />
    </div>
  );
}
