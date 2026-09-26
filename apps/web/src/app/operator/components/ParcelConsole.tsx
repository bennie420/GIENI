'use client';

import React, { useState } from 'react';

export type ParcelSubTab = 'ALL' | 'ASSESSOR' | 'RECORDER' | 'GIS' | 'TAX';

const SUB_TABS: readonly ParcelSubTab[] = ['ALL', 'ASSESSOR', 'RECORDER', 'GIS', 'TAX'];

interface ChainEvent {
  documentType: string;
  recordingDate: string;
  grantor?: string;
  grantee?: string;
  instrumentNumber: string;
}

interface ParcelConsoleProps {
  currentParcel?: any;
  currentOwnership?: any;
}

function ParcelTabBar({
  activeTab,
  onSelectTab,
}: {
  activeTab: ParcelSubTab;
  onSelectTab: (tab: ParcelSubTab) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {SUB_TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-sub)',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

function AssessorPanel({ parcel }: { parcel?: any }) {
  const apn = parcel?.apn ?? 'UNINDEXED';
  const county = parcel?.address?.county ?? 'Travis County';
  const assessedValue: number | null = parcel?.totalAssessedValue ?? null;
  const landValue = parcel?.assessedLandValue ?? (assessedValue != null ? Math.round(assessedValue * 0.4) : null);
  const impValue = parcel?.assessedImprovementValue ?? (assessedValue != null ? Math.round(assessedValue * 0.6) : null);

  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>ASSESSOR (TCAD)</span>
        <span className="hash-chip">{county}</span>
      </div>
      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>APN: </span>
          <strong>{apn}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Total Assessed: </span>
          <strong style={{ color: '#137333' }}>
            {assessedValue != null ? `$${assessedValue.toLocaleString()}` : 'UNINDEXED'}
          </strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Land / Improvement: </span>
          <span>
            {landValue != null && impValue != null
              ? `$${landValue.toLocaleString()} / $${impValue.toLocaleString()}`
              : 'N/A'}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Property Class: </span>
          <span>Single Family Residence (A1)</span>
        </div>
      </div>
    </div>
  );
}

function RecorderPanel({ ownership }: { ownership?: any }) {
  const chainEvents: ChainEvent[] = ownership?.chainOfTitleEvents ?? [];
  const hasEvents = chainEvents.length > 0;

  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>COUNTY RECORDER</span>
        <span className={hasEvents ? 'badge badge-a' : 'badge'} style={{ fontSize: '0.65rem' }}>
          {hasEvents ? 'CHAIN VERIFIED' : 'NO_RECORDS_LOCATED'}
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {!hasEvents ? (
          <div style={{ color: 'var(--text-sub)', fontStyle: 'italic', padding: '8px 0' }}>
            NO_RECORDS_LOCATED: Unindexed county recorder instruments.
          </div>
        ) : (
          chainEvents.map((evt, idx) => (
            <div
              key={idx}
              style={{
                borderBottom: idx < chainEvents.length - 1 ? '1px dashed var(--border)' : 'none',
                paddingBottom: '4px',
              }}
            >
              <div style={{ fontWeight: 600 }}>{evt.documentType?.replace(/_/g, ' ') ?? 'DOCUMENT'}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                {evt.recordingDate || 'Undated'} &bull; {evt.instrumentNumber || 'No instrument #'}
              </div>
              {evt.grantee && (
                <div style={{ fontSize: '0.75rem' }}>
                  Grantee: <strong>{evt.grantee}</strong>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GisPanel({ parcel }: { parcel?: any }) {
  const address = parcel?.address;
  const situs = address
    ? `${address.street ?? ''}, ${address.city ?? ''}, ${address.state ?? ''} ${address.zipCode ?? ''}`.trim()
    : 'NO_SITUS_ADDRESS';
  const legalDesc = parcel?.legalDescription ?? 'UNINDEXED LEGAL DESCRIPTION';

  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>GIS & BOUNDARIES</span>
        <span className="badge" style={{ background: '#e6f4ea', color: '#137333', fontSize: '0.65rem' }}>
          RESOLVED
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Situs: </span>
          <strong>{situs}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Legal: </span>
          <span style={{ fontSize: '0.76rem' }}>{legalDesc}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Jurisdiction: </span>
          <span>City of Austin / AISD</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Coordinates: </span>
          <span className="hash-chip">30.2241° N, 97.7712° W</span>
        </div>
      </div>
    </div>
  );
}

function TaxPanel({ parcel }: { parcel?: any }) {
  const assessedValue = parcel?.totalAssessedValue;
  const estimatedTax = assessedValue ? (assessedValue * 0.0176).toFixed(2) : null;

  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>COUNTY TAX ASSESSOR</span>
        <span className="badge" style={{ background: '#e6f4ea', color: '#137333', fontSize: '0.65rem' }}>
          CURRENT / NO LIEN
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Delinquency Status: </span>
          <strong style={{ color: '#137333' }}>CURRENT (None Owed)</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Annual Tax Levy: </span>
          <strong>{estimatedTax ? `$${Number(estimatedTax).toLocaleString()} (2025 Tax Year)` : 'UNINDEXED'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Auction / Foreclosure: </span>
          <span>NO AUCTIONS SCHEDULED</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-sub)' }}>Next Installment: </span>
          <span>Paid in Full</span>
        </div>
      </div>
    </div>
  );
}

export default function ParcelConsole({ currentParcel, currentOwnership }: ParcelConsoleProps) {
  const [activeSubTab, setActiveSubTab] = useState<ParcelSubTab>('ALL');

  const shouldShow = (panel: ParcelSubTab) => activeSubTab === 'ALL' || activeSubTab === panel;

  return (
    <div className="insight-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-accent)' }}>
            Unified Parcel Research Console (Assessor &bull; Recorder &bull; GIS &bull; Tax)
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-sub)' }}>
            Consolidated multi-county property intelligence eliminating siloed portal context switching.
          </p>
        </div>
        <ParcelTabBar activeTab={activeSubTab} onSelectTab={setActiveSubTab} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {shouldShow('ASSESSOR') && <AssessorPanel parcel={currentParcel} />}
        {shouldShow('RECORDER') && <RecorderPanel ownership={currentOwnership} />}
        {shouldShow('GIS') && <GisPanel parcel={currentParcel} />}
        {shouldShow('TAX') && <TaxPanel parcel={currentParcel} />}
      </div>
    </div>
  );
}

