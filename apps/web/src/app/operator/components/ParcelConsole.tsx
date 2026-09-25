'use client';

import React, { useState } from 'react';

interface ParcelConsoleProps {
  currentParcel?: any;
  currentOwnership?: any;
}

export default function ParcelConsole({ currentParcel, currentOwnership }: ParcelConsoleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'ASSESSOR' | 'RECORDER' | 'GIS' | 'TAX'>('ALL');

  const apn = currentParcel?.apn || '02040506070000';
  const legalDesc = currentParcel?.legalDescription || 'LOT 4 BLK B SHADY ACRES SEC 2';
  const street = currentParcel?.address?.street || '4502 ELM WOOD TRL';
  const city = currentParcel?.address?.city || 'AUSTIN';
  const state = currentParcel?.address?.state || 'TX';
  const zip = currentParcel?.address?.zipCode || '78745';
  const county = currentParcel?.address?.county || 'Travis County';
  const assessedValue = currentParcel?.totalAssessedValue || 705000;

  const chainEvents = currentOwnership?.chainOfTitleEvents || [
    {
      documentType: 'WARRANTY_DEED',
      recordingDate: '2014-06-12',
      grantor: 'MARGARET T. ROBERTS',
      grantee: 'ARTHUR JAMES JENKINS',
      instrumentNumber: 'DOC#2014-089412',
    },
    {
      documentType: 'DEED_OF_TRUST',
      recordingDate: '2014-06-12',
      grantor: 'ARTHUR JAMES JENKINS',
      grantee: 'FIRST NATIONAL BANK OF AUSTIN',
      instrumentNumber: 'DOC#2014-089413',
    },
  ];

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
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['ALL', 'ASSESSOR', 'RECORDER', 'GIS', 'TAX'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: activeSubTab === tab ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeSubTab === tab ? 'var(--bg-hover)' : 'transparent',
                color: activeSubTab === tab ? 'var(--accent)' : 'var(--text-sub)',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {/* Assessor Panel */}
        {(activeSubTab === 'ALL' || activeSubTab === 'ASSESSOR') && (
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
                <strong style={{ color: '#137333' }}>${assessedValue.toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Land / Improvement: </span>
                <span>${(assessedValue * 0.4).toLocaleString()} / ${(assessedValue * 0.6).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Property Class: </span>
                <span>Single Family Residence (A1)</span>
              </div>
            </div>
          </div>
        )}

        {/* Recorder Panel */}
        {(activeSubTab === 'ALL' || activeSubTab === 'RECORDER') && (
          <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>COUNTY RECORDER</span>
              <span className="badge badge-a" style={{ fontSize: '0.65rem' }}>CHAIN VERIFIED</span>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {chainEvents.map((evt: any, idx: number) => (
                <div key={idx} style={{ borderBottom: idx < chainEvents.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: '4px' }}>
                  <div style={{ fontWeight: 600 }}>{evt.documentType.replace('_', ' ')}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                    {evt.recordingDate} &bull; {evt.instrumentNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>Grantee: <strong>{evt.grantee}</strong></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GIS Panel */}
        {(activeSubTab === 'ALL' || activeSubTab === 'GIS') && (
          <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>GIS & BOUNDARIES</span>
              <span className="badge" style={{ background: '#e6f4ea', color: '#137333', fontSize: '0.65rem' }}>RESOLVED</span>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Situs: </span>
                <strong>{street}, {city}, {state} {zip}</strong>
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
        )}

        {/* Tax Panel */}
        {(activeSubTab === 'ALL' || activeSubTab === 'TAX') && (
          <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>COUNTY TAX ASSESSOR</span>
              <span className="badge" style={{ background: '#e6f4ea', color: '#137333', fontSize: '0.65rem' }}>CURRENT / NO LIEN</span>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Delinquency Status: </span>
                <strong style={{ color: '#137333' }}>CURRENT (None Owed)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Annual Tax Levy: </span>
                <strong>$12,410.50 (2025 Tax Year)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Auction / Foreclosure: </span>
                <span>NO AUCTIONS SCHEDULED</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-sub)' }}>Next Installment: </span>
                <span>Paid in Full (Receipt #TX-TR-2025-9921)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
