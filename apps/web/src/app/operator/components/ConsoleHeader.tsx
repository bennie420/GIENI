'use client';

import React from 'react';

interface ConsoleHeaderProps {
  isConnectedToAtlas: boolean;
  actionMessage: string | null;
}

export default function ConsoleHeader({ isConnectedToAtlas, actionMessage }: ConsoleHeaderProps) {
  return (
    <>
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
              background: isConnectedToAtlas ? '#e6f4ea' : '#fce8e6',
              color: isConnectedToAtlas ? '#137333' : '#c5221f',
            }}
          >
            {isConnectedToAtlas ? '● MongoDB Atlas Connected' : '○ Offline Mode'}
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
    </>
  );
}
