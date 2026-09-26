'use client';

import React, { useState } from 'react';
import {
  resolveExceptionAction as resolveException,
  verifyClaimAction as verifyClaim,
} from '../../lib/actions';
import { OperatorData, TabKey } from './types';
import ConsoleHeader from './components/ConsoleHeader';
import TabNav from './components/TabNav';
import DashboardTab from './components/DashboardTab';
import IntakeTab from './components/IntakeTab';
import ReviewTab from './components/ReviewTab';
import InvestigationTab from './components/InvestigationTab';
import ExceptionsTab from './components/ExceptionsTab';
import QcTab from './components/QcTab';
import CountyHealthTab from './components/CountyHealthTab';
import ScraperConsoleModal from './components/ScraperConsoleModal';
import { IngestionRunResult } from '@gieni/county-adapters';

interface OperatorConsoleProps {
  initialData: OperatorData;
}

export default function OperatorConsole({ initialData }: OperatorConsoleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [data, setData] = useState<OperatorData>(initialData);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isScraperModalOpen, setIsScraperModalOpen] = useState(false);

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

  const handleIngestSuccess = (newData: IngestionRunResult['data']) => {
    setData((prev) => {
      const existingDocIds = new Set(prev.documents.map((d) => d.id));
      const newDocs = newData.documents.filter((d) => !existingDocIds.has(d.id));

      const existingCaseIds = new Set(prev.cases.map((c) => c.id));
      const newCases = newData.cases.filter((c) => !existingCaseIds.has(c.id));

      const existingParcelIds = new Set(prev.parcels.map((p) => p.id));
      const newParcels = newData.parcels.filter((p) => !existingParcelIds.has(p.id));

      const existingClaimIds = new Set(prev.claims.map((cl) => cl.id));
      const newClaims = (newData.claims || []).filter((cl) => !existingClaimIds.has(cl.id));

      const existingAuthIds = new Set(prev.authorities.map((a) => a.id));
      const newAuths = (newData.authorities || []).filter((a) => !existingAuthIds.has(a.id));

      const existingOwnIds = new Set(prev.ownerships.map((o) => o.id));
      const newOwns = (newData.ownerships || []).filter((o) => !existingOwnIds.has(o.id));

      const existingScoreIds = new Set(prev.scores.map((s) => s.id));
      const newScores = (newData.scores || []).filter((s) => !existingScoreIds.has(s.id));

      const existingOppIds = new Set(prev.opportunities.map((op) => op.id));
      const newOpps = (newData.opportunities || []).filter((op) => !existingOppIds.has(op.id));

      const existingExcIds = new Set(prev.exceptions.map((e) => e.id));
      const newExceptions = (newData.exceptions || []).filter((e) => !existingExcIds.has(e.id));

      return {
        ...prev,
        documents: [...newDocs, ...prev.documents],
        cases: [...newCases, ...prev.cases],
        parcels: [...newParcels, ...prev.parcels],
        claims: [...newClaims, ...prev.claims],
        authorities: [...newAuths, ...prev.authorities],
        ownerships: [...newOwns, ...prev.ownerships],
        scores: [...newScores, ...prev.scores],
        opportunities: [...newOpps, ...prev.opportunities],
        exceptions: [...newExceptions, ...prev.exceptions],
      };
    });

    setActionMessage(
      `Municipal ingestion completed: preserved ${newData.documents.length} individual filings across ${newData.cases.length} court dockets, extracted ${newData.claims?.length || 0} verified claims, evaluated ${newData.authorities?.length || 0} authorities, and projected ${newData.opportunities?.length || 0} scored opportunities!`
    );
  };

  const currentParcel = data.parcels[0] ?? null;
  const currentScore = data.scores[0] ?? null;
  const currentCase = data.cases[0] ?? null;
  const currentAuthority = data.authorities[0] ?? null;
  const currentOwnership = data.ownerships[0] ?? null;
  const pendingExceptions = data.exceptions.filter((e) => e.status === 'PENDING_REVIEW');

  return (
    <div>
      <ConsoleHeader
        isConnectedToAtlas={data.isConnectedToAtlas}
        actionMessage={actionMessage}
      />

      <TabNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documentCount={data.documents.length}
        claimCount={data.claims.length}
        pendingExceptionsCount={pendingExceptions.length}
      />

      {activeTab === 'dashboard' && (
        <DashboardTab data={data} pendingExceptionsCount={pendingExceptions.length} onOpenScraperModal={() => setIsScraperModalOpen(true)} />
      )}
      {activeTab === 'intake' && (
        <IntakeTab
          documents={data.documents}
          onOpenScraperModal={() => setIsScraperModalOpen(true)}
        />
      )}
      {activeTab === 'review' && (
        <ReviewTab
          claims={data.claims}
          verifyingClaimId={verifyingClaimId}
          onVerifyClaim={handleVerifyClaim}
        />
      )}
      {activeTab === 'investigation' && (
        <InvestigationTab
          currentParcel={currentParcel}
          currentScore={currentScore}
          currentCase={currentCase}
          currentAuthority={currentAuthority}
          currentOwnership={currentOwnership}
        />
      )}
      {activeTab === 'exceptions' && (
        <ExceptionsTab
          exceptions={data.exceptions}
          resolvingId={resolvingId}
          resolutionText={resolutionText}
          setResolvingId={setResolvingId}
          setResolutionText={setResolutionText}
          onResolveException={handleResolveException}
        />
      )}
      {activeTab === 'qc' && <QcTab hasPendingExceptions={pendingExceptions.length > 0} />}
      {activeTab === 'counties' && (
        <CountyHealthTab onOpenScraperModal={() => setIsScraperModalOpen(true)} />
      )}

      {/* Institutional Municipal Scraper & Telemetry Modal */}
      <ScraperConsoleModal
        isOpen={isScraperModalOpen}
        onClose={() => setIsScraperModalOpen(false)}
        onIngestSuccess={handleIngestSuccess}
      />
    </div>
  );
}

