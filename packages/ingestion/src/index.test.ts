import { describe, expect, it } from 'vitest';
import { assertProvenance, buildExtractedDocument, canPromoteReady, detectDuplicateSource, promoteSourceReady, routeExtraction, sourceContentAuthority, type ExtractionRun, type SourceAsset } from './index.js';

const source = (overrides: Partial<SourceAsset> = {}): SourceAsset => ({
  id: 'source-1', tenantId: 'tenant-1', sourceType: 'PDF', originalUri: 'storage://a.pdf', acquisitionMethod: 'upload', acquiredAt: new Date('2026-08-12T00:00:00Z'), checksum: 'abc', status: 'ACQUIRED', untrusted: true, ...overrides,
});
const run = (overrides: Partial<ExtractionRun> = {}): ExtractionRun => ({
  id: 'run-1', tenantId: 'tenant-1', sourceAssetId: 'source-1', extractor: 'native', extractorVersion: '1', tier: 'D0_NATIVE', status: 'COMPLETED', startedAt: new Date('2026-08-12T00:00:00Z'), qualityState: 'PASS', ...overrides,
});

describe('ingestion invariants', () => {
  it('detects duplicate checksum only inside the same tenant', () => {
    expect(detectDuplicateSource([source()], { tenantId: 'tenant-1', checksum: 'abc' })?.id).toBe('source-1');
    expect(detectDuplicateSource([source()], { tenantId: 'tenant-2', checksum: 'abc' })).toBeNull();
  });

  it('prefers D0 native extraction when native quality is sufficient', () => {
    expect(routeExtraction({ nativeTextAvailable: true, nativeTextQuality: 0.95, imageRatio: 0.1, layoutComplexity: 0.2 })).toBe('D0_NATIVE');
  });

  it('falls back to D1 when native quality is insufficient', () => {
    expect(routeExtraction({ nativeTextAvailable: false, nativeTextQuality: 0.1, imageRatio: 0.9, layoutComplexity: 0.4, ocrQuality: 0.9 })).toBe('D1_OCR_TRANSCRIPTION');
  });

  it('uses D2 only as selective escalation', () => {
    expect(routeExtraction({ nativeTextAvailable: false, nativeTextQuality: 0.1, imageRatio: 1, layoutComplexity: 0.95, ocrQuality: 0.5 })).toBe('D2_VISION_SELECTIVE');
  });

  it('blocks low-quality promotion and makes warnings policy explicit', () => {
    expect(canPromoteReady('PASS')).toBe(true);
    expect(canPromoteReady('PASS_WITH_WARNINGS')).toBe(false);
    expect(canPromoteReady('PASS_WITH_WARNINGS', true)).toBe(true);
    expect(() => promoteSourceReady(source(), 'REPROCESS_REQUIRED')).toThrowError('QUALITY_GATE_FAILED');
  });

  it('preserves original extraction while creating normalized derived text', () => {
    const doc = buildExtractedDocument({ id: 'doc-1', source: source(), run: run(), originalText: 'A   B\r\n\r\n\r\nC', qualityState: 'PASS' });
    expect(doc.originalText).toBe('A   B\r\n\r\n\r\nC');
    expect(doc.normalizedText).toBe('A B\n\nC');
  });

  it('rejects cross-tenant provenance mixing', () => {
    expect(() => assertProvenance({ source: source(), run: run({ tenantId: 'tenant-2' }) })).toThrowError('INVALID_PROVENANCE');
  });

  it('never grants authority to source content', () => {
    expect(sourceContentAuthority()).toEqual({ canGrantToolPermission: false, canOverrideSystemInstructions: false });
  });
});
