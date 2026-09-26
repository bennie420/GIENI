import crypto from 'node:crypto';
import { DocumentLayoutFingerprint, LayoutDriftResult } from './types.js';

/**
 * Computes a deterministic template hash based on structural tokens of document text.
 */
export function computeTemplateStructureHash(documentText: string): string {
  // Normalize whitespace and extract top 20 structural tokens
  const structuralLines = documentText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && (l.includes(':') || l.startsWith('CAUSE') || l.startsWith('IN THE') || l.startsWith('ESTATE OF') || l.includes('COURT')))
    .slice(0, 10);

  const signature = structuralLines.join('|');
  return crypto.createHash('sha256').update(signature).digest('hex');
}

function checkHeaderPattern(documentText: string, pattern: string): string | null {
  const headerRegex = new RegExp(pattern, 'i');
  if (!headerRegex.test(documentText)) {
    return `Header pattern mismatch: Expected regex '${pattern}' not found in document text.`;
  }
  return null;
}

function checkTemplateHash(documentText: string, expectedHash: string): string | null {
  const currentStructureHash = computeTemplateStructureHash(documentText);
  if (currentStructureHash !== expectedHash) {
    return `Structural template hash mismatch: Recorded template '${expectedHash.slice(0, 8)}...' does not match current layout signature '${currentStructureHash.slice(0, 8)}...'.`;
  }
  return null;
}

function checkWatermark(documentText: string, pattern?: string): string | null {
  if (!pattern) return null;
  const watermarkRegex = new RegExp(pattern, 'i');
  if (!watermarkRegex.test(documentText)) {
    return `Watermark or seal pattern mismatch: '${pattern}' absent from document.`;
  }
  return null;
}

function calculateDriftConfidence(violationsCount: number): number {
  if (violationsCount === 0) return 0.0;
  return violationsCount >= 2 ? 0.95 : 0.65;
}

function resolveRecommendedAction(confidence: number): LayoutDriftResult['recommendedAction'] {
  if (confidence >= 0.9) return 'QUARANTINE_PARSER';
  if (confidence > 0) return 'REVIEW_LAYOUT';
  return 'NONE';
}

/**
 * Evaluates whether a county document exhibits structural layout drift (Gieni OS PRD v1.0 CH-002).
 * Catches page layout changes, court header revisions, and watermark changes before parser breakdown.
 */
export function evaluateDocumentLayoutDrift(params: {
  documentText: string;
  fingerprint: DocumentLayoutFingerprint;
}): LayoutDriftResult {
  const { documentText, fingerprint } = params;

  const violations = [
    checkHeaderPattern(documentText, fingerprint.headerPatternRegex),
    checkTemplateHash(documentText, fingerprint.templateHash),
    checkWatermark(documentText, fingerprint.watermarkPattern),
  ].filter((v): v is string => v !== null);

  const driftConfidence = calculateDriftConfidence(violations.length);

  return {
    hasDrift: violations.length > 0,
    driftConfidence,
    driftDetails: violations,
    recommendedAction: resolveRecommendedAction(driftConfidence),
  };
}

