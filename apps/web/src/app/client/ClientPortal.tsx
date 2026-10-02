'use client';

import React, { useState } from 'react';
import { submitClientFeedbackAction as submitClientFeedback } from '../../lib/actions';
import {
  ClientDisposition,
  ProbateOpportunityFile,
  ClientFeedback,
  analyzeClientFeedbackDispositions,
} from '@gieni/delivery';
import { PofCard } from './components/PofCard';
import { EvidenceModal } from './components/EvidenceModal';
import { DispositionModal } from './components/DispositionModal';
import { FeedbackHistoryTable } from './components/FeedbackHistoryTable';
import { OnboardingHero } from './components/OnboardingHero';
import { WebhookSetupModal } from './components/WebhookSetupModal';

interface ClientPortalProps {
  initialData: {
    deliveries: ProbateOpportunityFile[];
    feedback: ClientFeedback[];
    isConnectedToAtlas: boolean;
  };
}

interface ClientPortalHeaderProps {
  isConnectedToAtlas: boolean;
  onOpenWebhookSettings: () => void;
}

function ClientPortalHeader({ isConnectedToAtlas, onOpenWebhookSettings }: ClientPortalHeaderProps) {
  const statusBg = isConnectedToAtlas ? '#e6f4ea' : '#fce8e6';
  const statusColor = isConnectedToAtlas ? '#137333' : '#c5221f';
  const statusLabel = isConnectedToAtlas ? '● Live Atlas Delivery Feed' : '○ Offline Mode';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>Client Opportunity Feed</h1>
        <p style={{ color: 'var(--text-sub)' }}>
          Verified, evidence-backed Probate Opportunity Files (POF) &bull; Travis County, TX
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenWebhookSettings}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #dadce0',
            background: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#1a73e8',
          }}
        >
          Webhook Settings
        </button>
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
    </div>
  );
}

interface ExpansionMilestoneBannerProps {
  dealClosedCount: number;
  appointmentSetCount: number;
}

function ExpansionMilestoneBanner({ dealClosedCount, appointmentSetCount }: ExpansionMilestoneBannerProps) {
  const [expansionRequested, setExpansionRequested] = useState(false);

  const handleRequestExpansion = () => {
    setExpansionRequested(true);
    alert('Expansion request submitted! Our onboarding operations team will provision adjacent county feeds for your client organization.');
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '16px 20px',
        marginTop: '20px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🏆</span>
          <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
            Acquisition Milestone Reached ({dealClosedCount} Closed / {appointmentSetCount} Appts)
          </strong>
        </div>
        <p style={{ color: '#78350f', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Your organization has validated deal conversion in Travis County. You are eligible to activate adjacent county feeds (Williamson, Hays, King WA, Pierce WA) at preferred pilot terms.
        </p>
      </div>
      <button
        onClick={handleRequestExpansion}
        disabled={expansionRequested}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          background: expansionRequested ? '#78350f' : '#b45309',
          color: '#ffffff',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: expansionRequested ? 'default' : 'pointer',
        }}
      >
        {expansionRequested ? '✓ Expansion Requested' : 'Request Adjacent County Feeds \u2192'}
      </button>
    </div>
  );
}

function checkExpansionEligibility(analytics: ReturnType<typeof analyzeClientFeedbackDispositions>): boolean {
  if (analytics.globalMetrics.dealClosedCount >= 1) return true;
  if (analytics.globalMetrics.appointmentSetCount >= 2) return true;
  return Object.values(analytics.countyBreakdown).some((b) => b.expansionEligible);
}

export default function ClientPortal({ initialData }: ClientPortalProps) {
  const [deliveries] = useState<ProbateOpportunityFile[]>(initialData.deliveries);
  const [feedbackList, setFeedbackList] = useState<ClientFeedback[]>(initialData.feedback);
  const [selectedPofForEvidence, setSelectedPofForEvidence] = useState<ProbateOpportunityFile | null>(null);
  const [feedbackPofId, setFeedbackPofId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  const analytics = analyzeClientFeedbackDispositions(feedbackList);
  const isExpansionEligible = checkExpansionEligibility(analytics);

  const handleFeedbackSubmit = async (
    pofId: string,
    disposition: ClientDisposition,
    notes: string
  ) => {
    try {
      setSubmittingFeedback(true);
      const newFeedback = await submitClientFeedback({ opportunityId: pofId, disposition, notes });
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

  return (
    <div>
      <ClientPortalHeader
        isConnectedToAtlas={initialData.isConnectedToAtlas}
        onOpenWebhookSettings={() => setIsWebhookModalOpen(true)}
      />

      <div className="disclaimer-banner">
        <strong>Legal Disclaimer:</strong> Research finding—not legal opinion or title guarantee.
      </div>

      {feedbackSuccessMessage && (
        <div style={{ padding: '10px 16px', borderRadius: '6px', background: '#e6f4ea', color: '#137333', fontSize: '0.88rem', marginBottom: '16px' }}>
          ✓ {feedbackSuccessMessage}
        </div>
      )}

      {deliveries.length === 0 && (
        <OnboardingHero
          onExploreSample={setSelectedPofForEvidence}
          onOpenWebhookSetup={() => setIsWebhookModalOpen(true)}
        />
      )}

      {isExpansionEligible && (
        <ExpansionMilestoneBanner
          dealClosedCount={analytics.globalMetrics.dealClosedCount}
          appointmentSetCount={analytics.globalMetrics.appointmentSetCount}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {deliveries.map((pof) => (
          <PofCard
            key={pof.id}
            pof={pof}
            onViewEvidence={setSelectedPofForEvidence}
            onLogFeedback={setFeedbackPofId}
          />
        ))}
      </div>

      <EvidenceModal
        pof={selectedPofForEvidence}
        onClose={() => setSelectedPofForEvidence(null)}
      />

      <DispositionModal
        pofId={feedbackPofId}
        onClose={() => setFeedbackPofId(null)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={submittingFeedback}
      />

      <WebhookSetupModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
      />

      <FeedbackHistoryTable feedbackList={feedbackList} />
    </div>
  );
}
