import React, { useState } from 'react';
import { ClientDisposition } from '@gieni/delivery';

interface DispositionModalProps {
  pofId: string | null;
  onClose: () => void;
  onSubmit: (pofId: string, disposition: ClientDisposition, notes: string) => Promise<void>;
  isSubmitting: boolean;
}

export function DispositionModal({ pofId, onClose, onSubmit, isSubmitting }: DispositionModalProps) {
  const [disposition, setDisposition] = useState<ClientDisposition>('CONTACTED');
  const [notes, setNotes] = useState('');

  if (!pofId) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(pofId, disposition, notes);
    setNotes('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Log Opportunity Disposition</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
          Submit real feedback to record outcomes and refine scoring weights.
        </p>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Disposition Outcome:
            </label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value as ClientDisposition)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-body)',
                color: 'var(--text-title)',
              }}
            >
              <option value="CONTACTED">CONTACTED (Reached out to Executor)</option>
              <option value="APPOINTMENT_SET">APPOINTMENT_SET (Meeting Scheduled)</option>
              <option value="DEAL_CLOSED">DEAL_CLOSED (Contract Signed)</option>
              <option value="NOT_INTERESTED">NOT_INTERESTED (No Intent to Sell)</option>
              <option value="INVALID">INVALID (Incorrect Fiduciary / Contact)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Auditor / Representative Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Spoke with Sarah Jenkins; probate distribution in progress, open to discussion."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-body)',
                color: 'var(--text-title)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Submit Disposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
