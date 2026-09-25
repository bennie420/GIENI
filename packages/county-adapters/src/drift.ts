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

/**
 * Evaluates whether a county document exhibits structural layout drift (Gieni OS PRD v1.0 CH-002).
 * Catches page layout changes, court header revisions, and watermark changes before parser breakdown.
 */
export function evaluateDocumentLayoutDrift(params: {
  documentText: string;
  fingerprint: DocumentLayoutFingerprint;
}): LayoutDriftResult {
  const { documentText, fingerprint } = params;
  const driftDetails: string[] = [];

  // 1. Header Pattern Regex Check
  const headerRegex = new RegExp(fingerprint.headerPatternRegex, 'i');
  if (!headerRegex.test(documentText)) {
    driftDetails.push(
      `Header pattern mismatch: Expected regex '${fingerprint.headerPatternRegex}' not found in document text.`
    );
  }

  // 2. Template Structure Hash Check
  const currentStructureHash = computeTemplateStructureHash(documentText);
  if (currentStructureHash !== fingerprint.templateHash) {
    driftDetails.push(
      `Structural template hash mismatch: Recorded template '${fingerprint.templateHash.slice(0, 8)}...' does not match current layout signature '${currentStructureHash.slice(0, 8)}...'.`
    );
  }

  // 3. Watermark presence check (if defined)
  if (fingerprint.watermarkPattern) {
    const watermarkRegex = new RegExp(fingerprint.watermarkPattern, 'i');
    if (!watermarkRegex.test(documentText)) {
      driftDetails.push(
        `Watermark or seal pattern mismatch: '${fingerprint.watermarkPattern}' absent from document.`
      );
    }
  }

  const hasDrift = driftDetails.length > 0;
  const driftConfidence = hasDrift
    ? driftDetails.length >= 2
      ? 0.95
      : 0.65
    : 0.0;

  let recommendedAction: LayoutDriftResult['recommendedAction'] = 'NONE';
  if (driftConfidence >= 0.9) {
    recommendedAction = 'QUARANTINE_PARSER';
  } else if (driftConfidence > 0) {
    recommendedAction = 'REVIEW_LAYOUT';
  }

  return {
    hasDrift,
    driftConfidence,
    driftDetails,
    recommendedAction,
  };
}
