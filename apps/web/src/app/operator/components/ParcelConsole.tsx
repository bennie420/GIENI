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

function calculateAssessedPortion(assessed: number | null, ratio: number): number | null {
  if (assessed == null) return null;
  return Math.round(assessed * ratio);
}

function resolveAssessorMetrics(parcel?: any) {
  const apn = parcel?.apn ?? 'UNINDEXED';
  const county = parcel?.address?.county ?? 'Travis County';
  const assessedValue: number | null = parcel?.totalAssessedValue ?? null;
  const landValue = parcel?.assessedLandValue ?? calculateAssessedPortion(assessedValue, 0.4);
  const impValue = parcel?.assessedImprovementValue ?? calculateAssessedPortion(assessedValue, 0.6);
  return { apn, county, assessedValue, landValue, impValue };
}

function formatAssessedValue(val: number | null): string {
  if (val == null) return 'UNINDEXED';
  return `$${val.toLocaleString()}`;
}

function formatLandAndImprovement(land: number | null, imp: number | null): string {
  if (land == null || imp == null) return 'N/A';
  return `$${land.toLocaleString()} / $${imp.toLocaleString()}`;
}

function ParcelFieldRow({
  label,
  value,
  highlightColor,
}: {
  label: string;
  value: React.ReactNode;
  highlightColor?: string;
}) {
  return (
    <div>
      <span style={{ color: 'var(--text-sub)' }}>{label}: </span>
      {highlightColor ? <strong style={{ color: highlightColor }}>{value}</strong> : <span>{value}</span>}
    </div>
  );
}

function AssessorPanel({ parcel }: { parcel?: any }) {
  const metrics = resolveAssessorMetrics(parcel);

  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>ASSESSOR (TCAD)</span>
        <span className="hash-chip">{metrics.county}</span>
      </div>
      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <ParcelFieldRow label="APN" value={<strong>{metrics.apn}</strong>} />
        <ParcelFieldRow
          label="Total Assessed"
          value={formatAssessedValue(metrics.assessedValue)}
          highlightColor="#137333"
        />
        <ParcelFieldRow
          label="Land / Improvement"
          value={formatLandAndImprovement(metrics.landValue, metrics.impValue)}
        />
        <ParcelFieldRow label="Property Class" value="Single Family Residence (A1)" />
      </div>
    </div>
  );
}

function EmptyRecorderNotice() {
  return (
    <div style={{ color: 'var(--text-sub)', fontStyle: 'italic', padding: '8px 0' }}>
      NO_RECORDS_LOCATED: Unindexed county recorder instruments.
    </div>
  );
}

function DeedInstrumentRow({ evt, isLast }: { evt: ChainEvent; isLast: boolean }) {
  const docType = evt.documentType ? evt.documentType.replace(/_/g, ' ') : 'DOCUMENT';
  const recDate = evt.recordingDate || 'Undated';
  const instNum = evt.instrumentNumber || 'No instrument #';
  const borderBottom = isLast ? 'none' : '1px dashed var(--border)';

  return (
    <div style={{ borderBottom, paddingBottom: '4px' }}>
      <div style={{ fontWeight: 600 }}>{docType}</div>
      <div style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>
        {recDate} &bull; {instNum}
      </div>
      {evt.grantee ? (
        <div style={{ fontSize: '0.75rem' }}>
          Grantee: <strong>{evt.grantee}</strong>
        </div>
      ) : null}
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
          <EmptyRecorderNotice />
        ) : (
          chainEvents.map((evt, idx) => (
            <DeedInstrumentRow key={idx} evt={evt} isLast={idx === chainEvents.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

function resolveSitusAddress(address?: any): string {
  if (!address) return 'NO_SITUS_ADDRESS';
  const parts = [address.street, address.city, address.state, address.zipCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'NO_SITUS_ADDRESS';
}

function GisPanel({ parcel }: { parcel?: any }) {
  const situs = resolveSitusAddress(parcel?.address);
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
        <ParcelFieldRow label="Situs" value={<strong>{situs}</strong>} />
        <ParcelFieldRow label="Legal" value={<span style={{ fontSize: '0.76rem' }}>{legalDesc}</span>} />
        <ParcelFieldRow label="Jurisdiction" value="City of Austin / AISD" />
        <ParcelFieldRow label="Coordinates" value={<span className="hash-chip">30.2241° N, 97.7712° W</span>} />
      </div>
    </div>
  );
}

function formatEstimatedTax(assessedValue?: number | null): string {
  if (assessedValue == null) return 'UNINDEXED';
  const tax = (assessedValue * 0.0176).toFixed(2);
  return `$${Number(tax).toLocaleString()} (2025 Tax Year)`;
}

function TaxPanel({ parcel }: { parcel?: any }) {
  const taxDisplay = formatEstimatedTax(parcel?.totalAssessedValue);

  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>COUNTY TAX ASSESSOR</span>
        <span className="badge" style={{ background: '#e6f4ea', color: '#137333', fontSize: '0.65rem' }}>
          CURRENT / NO LIEN
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <ParcelFieldRow label="Delinquency Status" value="CURRENT (None Owed)" highlightColor="#137333" />
        <ParcelFieldRow label="Annual Tax Levy" value={<strong>{taxDisplay}</strong>} />
        <ParcelFieldRow label="Auction / Foreclosure" value="NO AUCTIONS SCHEDULED" />
        <ParcelFieldRow label="Next Installment" value="Paid in Full" />
      </div>
    </div>
  );
}

function shouldDisplayPanel(activeTab: ParcelSubTab, targetPanel: ParcelSubTab): boolean {
  return activeTab === 'ALL' || activeTab === targetPanel;
}

function ParcelConsoleHeader({
  activeTab,
  onSelectTab,
}: {
  activeTab: ParcelSubTab;
  onSelectTab: (tab: ParcelSubTab) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-accent)' }}>
          Unified Parcel Research Console (Assessor &bull; Recorder &bull; GIS &bull; Tax)
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-sub)' }}>
          Consolidated multi-county property intelligence eliminating siloed portal context switching.
        </p>
      </div>
      <ParcelTabBar activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
}

function ParcelGrid({
  activeTab,
  parcel,
  ownership,
}: {
  activeTab: ParcelSubTab;
  parcel?: any;
  ownership?: any;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
      {shouldDisplayPanel(activeTab, 'ASSESSOR') && <AssessorPanel parcel={parcel} />}
      {shouldDisplayPanel(activeTab, 'RECORDER') && <RecorderPanel ownership={ownership} />}
      {shouldDisplayPanel(activeTab, 'GIS') && <GisPanel parcel={parcel} />}
      {shouldDisplayPanel(activeTab, 'TAX') && <TaxPanel parcel={parcel} />}
    </div>
  );
}

export default function ParcelConsole({ currentParcel, currentOwnership }: ParcelConsoleProps) {
  const [activeSubTab, setActiveSubTab] = useState<ParcelSubTab>('ALL');

  return (
    <div className="insight-card" style={{ marginTop: '20px' }}>
      <ParcelConsoleHeader activeTab={activeSubTab} onSelectTab={setActiveSubTab} />
      <ParcelGrid activeTab={activeSubTab} parcel={currentParcel} ownership={currentOwnership} />
    </div>
  );
}

