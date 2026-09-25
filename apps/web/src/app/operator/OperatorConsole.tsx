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
        <DashboardTab data={data} pendingExceptionsCount={pendingExceptions.length} />
      )}
      {activeTab === 'intake' && <IntakeTab documents={data.documents} />}
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
      {activeTab === 'counties' && <CountyHealthTab />}
    </div>
  );
}
