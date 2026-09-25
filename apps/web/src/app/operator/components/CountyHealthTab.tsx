'use client';

import React from 'react';

interface CountyHealthRecord {
  countyId: string;
  countyName: string;
  state: string;
  adapterVersion: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DRIFT_DETECTED' | 'DOWN';
  successRate: number;
  latencyMs: number;
  documentsFound: number;
  documentsMissing: number;
  lastSuccessTimestamp: string;
  templateHash: string;
  driftDetected: boolean;
}

const SAMPLE_COUNTY_HEALTH: CountyHealthRecord[] = [
  {
    countyId: 'county_travis_tx',
    countyName: 'Travis County',
    state: 'TX',
    adapterVersion: '1.0.0',
    status: 'HEALTHY',
    successRate: 100,
    latencyMs: 142,
    documentsFound: 48,
    documentsMissing: 0,
    lastSuccessTimestamp: '2026-09-25T01:30:00Z',
    templateHash: 'c7a10f89e21b...',
    driftDetected: false,
  },
  {
    countyId: 'county_maricopa_az',
    countyName: 'Maricopa County',
    state: 'AZ',
    adapterVersion: '1.0.0',
    status: 'HEALTHY',
    successRate: 98.4,
    latencyMs: 215,
    documentsFound: 37,
    documentsMissing: 1,
    lastSuccessTimestamp: '2026-09-25T01:15:00Z',
    templateHash: '8b43e120f01a...',
    driftDetected: false,
  },
  {
    countyId: 'county_harris_tx',
    countyName: 'Harris County (Pipeline)',
    state: 'TX',
    adapterVersion: '0.9.0-rc',
    status: 'HEALTHY',
    successRate: 95.0,
    latencyMs: 310,
    documentsFound: 24,
    documentsMissing: 0,
    lastSuccessTimestamp: '2026-09-25T00:45:00Z',
    templateHash: '43ef671a998c...',
    driftDetected: false,
  },
];

export default function CountyHealthTab() {
  return (
    <div>
      <div className="insights-container">
        <div className="insight-card">
          <h4>Active Adapters</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>2 Production / 1 Staging</div>
          <p>Travis TX &bull; Maricopa AZ Active</p>
        </div>
        <div className="insight-card">
          <h4>Average Ingestion Latency</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#137333' }}>178ms</div>
          <p>Real-time county portal queries</p>
        </div>
        <div className="insight-card">
          <h4>Document Layout Drift</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#137333' }}>0 Anomalies</div>
          <p>Layout fingerprints matching baselines</p>
        </div>
        <div className="insight-card">
          <h4>Evidence Capture Rate</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>100% Provenance</div>
          <p>All claims bound to SourceRecord SHA-256</p>
        </div>
      </div>

      <div className="insight-card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-accent)' }}>
              County Adapter Health & Layout Drift Monitor
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-sub)' }}>
              Automated circuit breakers and layout fingerprinting detecting portal layout shifts.
            </p>
          </div>
          <span className="badge badge-a">CIRCUITS NOMINAL</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>County / State</th>
              <th>Adapter Version</th>
              <th>Status</th>
              <th>Success Rate</th>
              <th>Avg Latency</th>
              <th>Docs Harvested</th>
              <th>Drift Fingerprint</th>
              <th>Last Ingest</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_COUNTY_HEALTH.map((ch) => (
              <tr key={ch.countyId}>
                <td>
                  <strong>{ch.countyName}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                    ID: {ch.countyId}
                  </span>
                </td>
                <td>
                  <span className="hash-chip">v{ch.adapterVersion}</span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: ch.status === 'HEALTHY' ? '#e6f4ea' : '#fce8e6',
                      color: ch.status === 'HEALTHY' ? '#137333' : '#c5221f',
                    }}
                  >
                    {ch.status}
                  </span>
                </td>
                <td>
                  <strong style={{ color: ch.successRate > 95 ? '#137333' : '#b06000' }}>
                    {ch.successRate.toFixed(1)}%
                  </strong>
                </td>
                <td>{ch.latencyMs} ms</td>
                <td>
                  {ch.documentsFound} found{' '}
                  {ch.documentsMissing > 0 && (
                    <span style={{ color: '#b06000', fontSize: '0.75rem' }}>
                      ({ch.documentsMissing} missing)
                    </span>
                  )}
                </td>
                <td>
                  <span className="hash-chip">{ch.templateHash}</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#137333' }}>
                    &#10003; Match (0 drift)
                  </span>
                </td>
                <td style={{ fontSize: '0.78rem' }}>
                  {new Date(ch.lastSuccessTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
