'use client';

import React from 'react';

interface ExceptionsTabProps {
  exceptions: any[];
  resolvingId: string | null;
  resolutionText: string;
  setResolvingId: (id: string | null) => void;
  setResolutionText: (text: string) => void;
  onResolveException: (exceptionId: string) => Promise<void>;
}

export default function ExceptionsTab({
  exceptions,
  resolvingId,
  resolutionText,
  setResolvingId,
  setResolutionText,
  onResolveException,
}: ExceptionsTabProps) {
  return (
    <div className="insight-card">
      <h3>Investigation & Exception Quarantine Queue</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
        Unresolved authority tiers, title variations, or low-confidence proposals are held here until certified.
      </p>

      {exceptions.length === 0 ? (
        <p>No exceptions active.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Resolution Note</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map((exc) => (
              <tr key={exc.id}>
                <td>
                  <span className="badge badge-c">{exc.type}</span>
                </td>
                <td>{exc.description}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: exc.status === 'RESOLVED' ? '#e6f4ea' : '#fce8e6',
                      color: exc.status === 'RESOLVED' ? '#137333' : '#c5221f',
                    }}
                  >
                    {exc.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{exc.resolutionNote ?? '—'}</td>
                <td>
                  {exc.status === 'PENDING_REVIEW' ? (
                    resolvingId === exc.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Enter resolution note..."
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                          }}
                        />
                        <button
                          className="btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          onClick={() => onResolveException(exc.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => {
                          setResolvingId(exc.id);
                          setResolutionText('Reviewed middle name on death certificate attachment; identity affirmed.');
                        }}
                      >
                        Resolve
                      </button>
                    )
                  ) : (
                    <span style={{ color: '#137333', fontSize: '0.8rem' }}>✓ Certified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
