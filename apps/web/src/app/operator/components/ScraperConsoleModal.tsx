'use client';

import React, { useState } from 'react';
import { triggerMunicipalScraperAction } from '../../../lib/actions';
import { IngestionRunResult, IngestionTelemetryEvent } from '@gieni/county-adapters';

interface ScraperConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (newData: IngestionRunResult['data']) => void;
}

const LEVEL_TAG_COLORS: Record<IngestionTelemetryEvent['level'], string> = {
  SUCCESS: '#34d399',
  ERROR: '#f87171',
  WARN: '#fbbf24',
  INFO: '#38bdf8',
};

function getTagColor(level: IngestionTelemetryEvent['level']): string {
  return LEVEL_TAG_COLORS[level] ?? '#38bdf8';
}

interface ScraperHeaderProps {
  isRunning: boolean;
  onClose: () => void;
}

function ScraperHeader({ isRunning, onClose }: ScraperHeaderProps) {
  const statusColor = isRunning ? '#f59e0b' : '#10b981';

  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0d1322',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }}
          />
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 600 }}>
            Municipal Intake Scraper & Telemetry Monitor
          </h2>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          Direct County Adapter Dispatch &bull; Primary PDF Evidence Hashing &bull; Real Cadastre Reconciliation
        </p>
      </div>
      <button
        onClick={onClose}
        disabled={isRunning}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          fontSize: '1.25rem',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          padding: '4px 8px',
        }}
      >
        &times;
      </button>
    </div>
  );
}

interface ScraperConfigFormProps {
  countyId: string;
  setCountyId: (id: string) => void;
  lookbackDays: number;
  setLookbackDays: (days: number) => void;
  harvestLimit: number;
  setHarvestLimit: (limit: number) => void;
  isRunning: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function ScraperConfigForm({
  countyId,
  setCountyId,
  lookbackDays,
  setLookbackDays,
  harvestLimit,
  setHarvestLimit,
  isRunning,
  onSubmit,
}: ScraperConfigFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1e293b',
        display: 'grid',
        gridTemplateColumns: '1.8fr 1.2fr 1fr 1.3fr',
        gap: '16px',
        background: '#090d16',
      }}
    >
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
          TARGET COUNTY DOCKET REPOSITORY
        </label>
        <select
          value={countyId}
          onChange={(e) => setCountyId(e.target.value)}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            background: '#131b2e',
            border: '1px solid #334155',
            color: '#f8fafc',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
                    <option value="county_thurston_wa">Thurston County, WA &bull; Superior Court (Odyssey Portal & Records)</option>
          <option value="county_pierce_wa">Pierce County, WA &bull; Superior Court (LINX / Odyssey Portal)</option>
          <option value="county_king_wa">King County, WA &bull; Superior Court (ECR Portal & Records)</option>
          <option value="county_travis_tx">Travis County, TX &bull; Probate Court No. 1 (Odyssey Portal)</option>
          <option value="county_maricopa_az">Maricopa County, AZ &bull; Superior Court (PB Records Portal)</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
          LOOKBACK WINDOW
        </label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            max={90}
            value={lookbackDays}
            onChange={(e) => setLookbackDays(Number(e.target.value))}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#131b2e',
              border: '1px solid #334155',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#64748b' }}>days</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {[
            { label: '14d', val: 14 },
            { label: '30d', val: 30 },
            { label: '90d Backfill', val: 90 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              disabled={isRunning}
              onClick={() => setLookbackDays(preset.val)}
              style={{
                background: lookbackDays === preset.val ? '#4f46e5' : '#1e293b',
                color: lookbackDays === preset.val ? '#fff' : '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
          HARVEST LIMIT
        </label>
        <select
          value={harvestLimit}
          onChange={(e) => setHarvestLimit(Number(e.target.value))}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            background: '#131b2e',
            border: '1px solid #334155',
            color: '#f8fafc',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          <option value={15}>15 Dockets</option>
          <option value={30}>30 Dockets</option>
          <option value={50}>50 Dockets</option>
          <option value={100}>100 (Full 90-Day Backfill)</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button
          type="submit"
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '9px 16px',
            borderRadius: '6px',
            background: isRunning ? '#312e81' : '#4f46e5',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
        >
          {isRunning ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>&#9696;</span>
              <span>Scraping Municipal Portal...</span>
            </>
          ) : (
            <>
              <span>&#9654;</span>
              <span>Run Municipal Intake Scraper</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

interface TelemetryMetricsStripProps {
  result: IngestionRunResult;
}

function TelemetryMetricsStrip({ result }: TelemetryMetricsStripProps) {
  const driftColor = result.layoutDriftDetected ? '#f59e0b' : '#34d399';
  const driftLabel = result.layoutDriftDetected ? 'DRIFT ALERT' : '0% (VALID)';

  return (
    <div
      style={{
        padding: '12px 24px',
        background: '#0e182b',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Dockets</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>{result.casesHarvested}</div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Filings</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>{result.documentsPreserved}</div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Claims AI</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#c084fc' }}>{result.claimsExtracted || 0}</div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>APNs</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a78bfa' }}>{result.parcelsMatched}</div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Authorities</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2dd4bf' }}>{result.authoritiesEvaluated || 0}</div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Scored Opps</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>{result.opportunitiesScored || 0}</div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Exceptions</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: result.exceptionsFlagged > 0 ? '#f87171' : '#64748b' }}>
          {result.exceptionsFlagged || 0}
        </div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Layout Drift</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: driftColor }}>
          {driftLabel}
        </div>
      </div>
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Duration</span>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>{result.durationMs}ms</div>
      </div>
    </div>
  );
}

interface TelemetryConsoleLogProps {
  logs: IngestionTelemetryEvent[];
  onClear: () => void;
}

function TelemetryConsoleLog({ logs, onClear }: TelemetryConsoleLogProps) {
  return (
    <div style={{ padding: '16px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
          LIVE WORKER TELEMETRY STREAM &bull; SHA-256 AUDIT LOGS
        </span>
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          Clear Log Buffer
        </button>
      </div>

      <div
        style={{
          background: '#030712',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '16px',
          height: '320px',
          overflowY: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.8rem',
          lineHeight: 1.5,
          color: '#d1d5db',
        }}
      >
        {logs.map((ev, i) => (
          <div key={i} style={{ marginBottom: '6px', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#475569' }}>[{ev.timestamp.slice(11, 19)}]</span>
            <span
              style={{
                color: getTagColor(ev.level),
                fontWeight: 600,
                minWidth: '120px',
              }}
            >
              [{ev.stage}]
            </span>
            <span style={{ color: ev.level === 'ERROR' ? '#f87171' : '#e2e8f0', flex: 1 }}>
              {ev.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ScraperFooterProps {
  onClose: () => void;
}

function ScraperFooter({ onClose }: ScraperFooterProps) {
  return (
    <div
      style={{
        padding: '12px 24px',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0d1322',
      }}
    >
      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
        Operating standard: Authentic municipal filings only &bull; Zero synthetic fiduciaries
      </span>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '8px 18px',
          borderRadius: '6px',
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#f8fafc',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Close & Review State
      </button>
    </div>
  );
}

const INITIAL_TELEMETRY_LOGS: IngestionTelemetryEvent[] = [
  {
    timestamp: new Date().toISOString(),
    stage: 'INIT',
    level: 'INFO',
    message: 'Municipal Ingestion Subsystem initialized. County adapter pool calibrated and ready.',
  },
];

function createLaunchTelemetryEvent(countyId: string, lookbackDays: number): IngestionTelemetryEvent {
  return {
    timestamp: new Date().toISOString(),
    stage: 'INIT',
    level: 'INFO',
    message: `Dispatching municipal scraper worker for county '${countyId}' (Lookback: ${lookbackDays} days)...`,
  };
}

function createErrorTelemetryEvent(err: unknown): IngestionTelemetryEvent {
  const errorMsg = err instanceof Error ? err.message : 'Scraper execution encountered a fatal error.';
  return {
    timestamp: new Date().toISOString(),
    stage: 'ERROR',
    level: 'ERROR',
    message: `Execution failed: ${errorMsg}`,
  };
}

export default function ScraperConsoleModal({
  isOpen,
  onClose,
  onIngestSuccess,
}: ScraperConsoleModalProps) {
  const [countyId, setCountyId] = useState<string>('county_thurston_wa');
  const [lookbackDays, setLookbackDays] = useState<number>(90);
  const [harvestLimit, setHarvestLimit] = useState<number>(100);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<IngestionTelemetryEvent[]>(INITIAL_TELEMETRY_LOGS);
  const [lastResult, setLastResult] = useState<IngestionRunResult | null>(null);

  if (!isOpen) return null;

  const handleLaunchScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setLastResult(null);

    setTelemetryLogs((prev) => [createLaunchTelemetryEvent(countyId, lookbackDays), ...prev]);

    try {
      const res = await triggerMunicipalScraperAction(countyId, lookbackDays, harvestLimit);
      setLastResult(res);
      setTelemetryLogs(res.telemetry);
      onIngestSuccess(res.data);
    } catch (err: unknown) {
      setTelemetryLogs((prev) => [createErrorTelemetryEvent(err), ...prev]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
      >
        <ScraperHeader isRunning={isRunning} onClose={onClose} />
        <ScraperConfigForm
          countyId={countyId}
          setCountyId={setCountyId}
          lookbackDays={lookbackDays}
          setLookbackDays={setLookbackDays}
          harvestLimit={harvestLimit}
          setHarvestLimit={setHarvestLimit}
          isRunning={isRunning}
          onSubmit={handleLaunchScraper}
        />
        {lastResult && <TelemetryMetricsStrip result={lastResult} />}
        <TelemetryConsoleLog logs={telemetryLogs} onClear={() => setTelemetryLogs([])} />
        <ScraperFooter onClose={onClose} />
      </div>
    </div>
  );
}

