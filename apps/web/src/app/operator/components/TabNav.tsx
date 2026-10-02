'use client';

import React from 'react';
import { TabKey } from '../types';

interface TabNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  documentCount: number;
  claimCount: number;
  pendingExceptionsCount: number;
}

export default function TabNav({
  activeTab,
  setActiveTab,
  documentCount,
  claimCount,
  pendingExceptionsCount,
}: TabNavProps) {
  return (
    <nav className="tab-nav">
      <button
        className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        1. Dashboard
      </button>
      <button
        className={`tab-btn ${activeTab === 'intake' ? 'active' : ''}`}
        onClick={() => setActiveTab('intake')}
      >
        2. Intake ({documentCount})
      </button>
      <button
        className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => setActiveTab('review')}
      >
        3. Document Review ({claimCount})
      </button>
      <button
        className={`tab-btn ${activeTab === 'investigation' ? 'active' : ''}`}
        onClick={() => setActiveTab('investigation')}
      >
        4. Opportunity Investigation
      </button>
      <button
        className={`tab-btn ${activeTab === 'exceptions' ? 'active' : ''}`}
        onClick={() => setActiveTab('exceptions')}
        style={{ position: 'relative' }}
      >
        5. Exceptions / Tasks {pendingExceptionsCount > 0 && (
          <span
            style={{
              marginLeft: '6px',
              padding: '2px 6px',
              borderRadius: '999px',
              background: '#c5221f',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {pendingExceptionsCount}
          </span>
        )}
      </button>
      <button
        className={`tab-btn ${activeTab === 'qc' ? 'active' : ''}`}
        onClick={() => setActiveTab('qc')}
      >
        6. QC & Delivery
      </button>
      <button
        className={`tab-btn ${activeTab === 'counties' ? 'active' : ''}`}
        onClick={() => setActiveTab('counties')}
      >
        7. County Health & Drift
      </button>
    </nav>
  );
}
