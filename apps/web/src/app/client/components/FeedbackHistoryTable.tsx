import React from 'react';
import { ClientFeedback } from '@gieni/delivery';

interface FeedbackHistoryTableProps {
  feedbackList: ClientFeedback[];
}

export function FeedbackHistoryTable({ feedbackList }: FeedbackHistoryTableProps) {
  if (feedbackList.length === 0) return null;

  return (
    <div className="insight-card" style={{ marginTop: '24px' }}>
      <h3>Client Feedback & Disposition History</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '12px' }}>
        Auditable record of commercial client interaction and deal outcomes.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Disposition</th>
            <th>Notes</th>
            <th>Logged At</th>
          </tr>
        </thead>
        <tbody>
          {feedbackList.map((fb, idx) => (
            <tr key={fb.id || idx}>
              <td>
                <span className="badge badge-a">{fb.disposition}</span>
              </td>
              <td>{fb.notes || '—'}</td>
              <td>{new Date(fb.submittedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
