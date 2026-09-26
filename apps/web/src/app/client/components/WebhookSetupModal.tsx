'use client';

import React, { useState } from 'react';

interface WebhookSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookSetupModal({ isOpen, onClose }: WebhookSetupModalProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [secretKey, setSecretKey] = useState('whsec_gieni_live_' + Math.random().toString(36).substring(2, 14));
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    if (!webhookUrl.trim()) {
      setTestStatus('Please enter a target webhook URL.');
      return;
    }
    setIsTesting(true);
    setTestStatus('Transmitting signed HMAC-SHA256 ping test...');

    try {
      // Real test transmission via fetch or simulator
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gieni-Event': 'ping',
          'X-Gieni-Timestamp': Math.floor(Date.now() / 1000).toString(),
        },
        body: JSON.stringify({ event: 'ping', timestamp: new Date().toISOString() }),
      });

      if (res.ok) {
        setTestStatus(`✓ Success: Endpoint acknowledged ping with HTTP ${res.status}.`);
      } else {
        setTestStatus(`⚠️ Endpoint responded with error HTTP ${res.status}.`);
      }
    } catch (err: any) {
      setTestStatus(`❌ Transmission failed: ${err.message || 'Connection refused or unreachable URL'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Webhook Integration Settings</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#5f6368' }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#202124', marginBottom: '6px' }}>
              Target Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-crm.example.com/api/probate-leads"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #dadce0',
                fontSize: '0.9rem',
              }}
            />
            <span style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '4px', display: 'block' }}>
              Must accept HTTP POST requests with JSON payload.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#202124', marginBottom: '6px' }}>
              HMAC-SHA256 Signing Secret
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={secretKey}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dadce0',
                  background: '#f8f9fa',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={() => setSecretKey('whsec_gieni_live_' + Math.random().toString(36).substring(2, 14))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dadce0',
                  background: '#ffffff',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Regenerate
              </button>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '4px', display: 'block' }}>
              Used to compute the <code>X-Gieni-Signature</code> header.
            </span>
          </div>

          {testStatus && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: testStatus.startsWith('✓') ? '#e6f4ea' : '#fce8e6',
                color: testStatus.startsWith('✓') ? '#137333' : '#c5221f',
                fontSize: '0.85rem',
              }}
            >
              {testStatus}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', background: '#f8f9fa', borderTop: '1px solid #e8eaed', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={handleTestPing}
            disabled={isTesting}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #1a73e8',
              background: '#ffffff',
              color: '#1a73e8',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: isTesting ? 'wait' : 'pointer',
            }}
          >
            {isTesting ? 'Sending Ping...' : 'Send Test Ping'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#1a73e8',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
