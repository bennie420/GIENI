'use client';

import React from 'react';

interface AuthorityTimelineProps {
  probateCase?: any;
  authority?: any;
}

interface TimelineStepDetail {
  label: string;
  value: string;
}

interface TimelineStep {
  step: number;
  title: string;
  subtitle: string;
  date: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  badge: string;
  details: TimelineStepDetail[];
}

function getBondDisplay(bondAmount?: number): string {
  if (typeof bondAmount === 'number' && bondAmount > 0) {
    return `$${bondAmount.toLocaleString()}`;
  }
  return 'Waived (Independent)';
}

function buildPetitionStep(probateCase?: any): TimelineStep {
  const caseNumber = probateCase?.caseNumber ?? 'C-1-PB-26-000412';
  const courtName = probateCase?.courtName ?? 'Travis County Probate Court No. 1';
  const filingDate = probateCase?.filingDate ?? '2026-03-01';
  const decedent = probateCase?.decedentName ?? 'Arthur James Jenkins';

  return {
    step: 1,
    title: 'Petition Filed',
    subtitle: `Application for Probate & Letters filed in ${courtName}`,
    date: filingDate,
    status: 'COMPLETED',
    badge: 'PROBATE FILED',
    details: [
      { label: 'Cause No.', value: caseNumber },
      { label: 'Decedent', value: decedent },
      { label: 'Filing Date', value: filingDate },
    ],
  };
}

function buildFiduciaryStep(authority?: any): TimelineStep {
  const fiduciary = authority?.fiduciary;
  const fiduciaryName = fiduciary?.fullName;
  const fiduciaryRole = fiduciary?.role ?? 'EXECUTOR';
  const appointmentDate = fiduciary?.appointmentDate ?? '2026-03-01';
  const authorityStatus = authority?.status ?? 'CONFIRMED';
  const authorityTier = authority?.tier ?? 1;

  return {
    step: 2,
    title: 'Fiduciary Appointed',
    subtitle: `${fiduciaryRole} legally designated by judicial order`,
    date: appointmentDate,
    status: fiduciaryName ? 'COMPLETED' : 'PENDING',
    badge: authorityStatus,
    details: [
      { label: 'Designated Party', value: fiduciaryName ?? 'None (Unappointed)' },
      { label: 'Role', value: fiduciaryRole },
      { label: 'Authority Tier', value: `Tier ${authorityTier} (Sole Decision Maker)` },
    ],
  };
}

function buildLettersStep(authority?: any): TimelineStep {
  const fiduciary = authority?.fiduciary;
  const lettersIssued = fiduciary?.lettersIssued ?? true;
  const appointmentDate = fiduciary?.appointmentDate ?? '2026-03-01';

  return {
    step: 3,
    title: 'Letters Issued',
    subtitle: 'Letters Testamentary / Letters of Administration granted',
    date: appointmentDate,
    status: lettersIssued ? 'COMPLETED' : 'PENDING',
    badge: lettersIssued ? 'LETTERS ACTIVE' : 'AWAITING OATH/BOND',
    details: [
      { label: 'Letters Status', value: lettersIssued ? 'Active / Granted' : 'Pending' },
      { label: 'Bond Required', value: getBondDisplay(fiduciary?.bondAmount) },
      { label: 'Evidence Citation', value: fiduciary?.verifiedEvidenceId ?? 'doc_travis_probate_001#p1' },
    ],
  };
}

function buildInventoryStep(): TimelineStep {
  return {
    step: 4,
    title: 'Inventory & Appraisement',
    subtitle: 'Inventory filed or statutory creditor notification published',
    date: '2026-03-15',
    status: 'IN_PROGRESS',
    badge: 'STATUTORY WINDOW',
    details: [
      { label: 'Filing Deadline', value: '90 Days Post-Qualification' },
      { label: 'Notice to Creditors', value: 'Published (Travis County Commercial Recorder)' },
      { label: 'Claim Status', value: 'Open statutory creditor period' },
    ],
  };
}

function buildTimelineSteps(probateCase?: any, authority?: any): TimelineStep[] {
  return [
    buildPetitionStep(probateCase),
    buildFiduciaryStep(authority),
    buildLettersStep(authority),
    buildInventoryStep(),
  ];
}


function TimelineStepCard({ step }: { step: TimelineStep }) {
  const isCompleted = step.status === 'COMPLETED';

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '8px',
        background: isCompleted ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${isCompleted ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: isCompleted ? 'var(--accent)' : '#9e9e9e',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {step.step}
          </span>
          <span
            className="badge"
            style={{
              fontSize: '0.68rem',
              background: isCompleted ? '#e6f4ea' : '#fff8e1',
              color: isCompleted ? '#137333' : '#b06000',
            }}
          >
            {step.badge}
          </span>
        </div>
        <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--text-title)' }}>
          {step.title}
        </strong>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)', display: 'block', marginTop: '4px' }}>
          {step.subtitle}
        </span>
      </div>

      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
        {step.details.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              marginBottom: '3px',
            }}
          >
            <span style={{ color: 'var(--text-sub)' }}>{d.label}:</span>
            <span style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthorityTimeline({ probateCase, authority }: AuthorityTimelineProps) {
  const authorityTier = authority?.tier ?? 1;
  const authorityStatus = authority?.status ?? 'CONFIRMED';
  const steps = buildTimelineSteps(probateCase, authority);

  return (
    <div className="insight-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-accent)' }}>
            Probate Authority Milestone Timeline
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-sub)' }}>
            Sequential legal milestone verification from petition through letters and notice.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-a">Tier {authorityTier} Authority</span>
          <span className="badge" style={{ background: '#e8f0fe', color: 'var(--accent)' }}>
            {authorityStatus}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {steps.map((st) => (
          <TimelineStepCard key={st.step} step={st} />
        ))}
      </div>
    </div>
  );
}
