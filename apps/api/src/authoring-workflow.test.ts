import { describe, expect, it } from 'vitest';
import { prepareAuthoringReviewFromEvidence, AuthoringWorkflowError } from './authoring-workflow.js';
import type { EvidenceSegment, ExtractionRun, SourceAsset } from '@kaep/ingestion';

const source: SourceAsset = {
  id: 'source-1',
  tenantId: 'tenant-1',
  sourceType: 'PDF',
  originalUri: 'https://example.com/source.pdf',
  originalFilename: 'source.pdf',
  acquisitionMethod: 'upload',
  acquiredAt: new Date('2026-08-12T04:00:00.000Z'),
  checksum: 'sha256:source',
  status: 'READY',
  untrusted: true,
};

const extractionRun: ExtractionRun = {
  id: 'run-1',
  tenantId: 'tenant-1',
  sourceAssetId: 'source-1',
  extractor: 'native-pdf',
  extractorVersion: '1.0.0',
  tier: 'D0_NATIVE',
  status: 'COMPLETED',
  qualityState: 'PASS',
  startedAt: new Date('2026-08-12T04:00:00.000Z'),
  completedAt: new Date('2026-08-12T04:01:00.000Z'),
};

const evidence: EvidenceSegment = {
  id: 'evidence-1',
  tenantId: 'tenant-1',
  sourceAssetId: 'source-1',
  extractionRunId: 'run-1',
  locator: 'page:1',
  text: 'Çalışanlar bilgi güvenliği olaylarını kurum politikasına göre raporlamalıdır.',
  language: 'tr',
  checksum: 'sha256:evidence',
  qualityState: 'PASS',
};

function run(overrides: Partial<Parameters<typeof prepareAuthoringReviewFromEvidence>[0]> = {}) {
  return prepareAuthoringReviewFromEvidence({
    tenantId: 'tenant-1',
    trainingId: 'training-1',
    source,
    extractionRun,
    evidence: [evidence],
    candidateId: 'candidate-1',
    authoringRunId: 'authoring-run-1',
    candidateKind: 'OBJECTIVE',
    candidateText: 'Bilgi güvenliği olaylarının doğru raporlama adımlarını açıklar.',
    schemaVersion: '1',
    promptId: 'authoring-objective',
    promptVersion: '1',
    modelId: 'qualified-model-1',
    inputSnapshotHash: 'sha256:snapshot',
    ...overrides,
  });
}

describe('backend ingestion -> authoring flow', () => {
  it('preserves evidence lineage and stops at human review boundary', () => {
    const result = run();

    expect(result.status).toBe('READY_FOR_REVIEW');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.evidenceRefs).toEqual([
      {
        tenantId: 'tenant-1',
        sourceAssetId: 'source-1',
        evidenceSegmentId: 'evidence-1',
        qualityState: 'PASS',
      },
    ]);
  });

  it('rejects source content that is not quality-promoted to READY', () => {
    expect(() => run({
      source: { ...source, status: 'PROCESSING' },
    })).toThrowError(new AuthoringWorkflowError('SOURCE_NOT_READY'));
  });

  it('rejects unusable evidence before authoring review', () => {
    expect(() => run({
      evidence: [{ ...evidence, qualityState: 'HUMAN_REVIEW_REQUIRED' }],
    })).toThrowError(new AuthoringWorkflowError('EVIDENCE_NOT_USABLE'));
  });

  it('fails closed on cross-tenant evidence', () => {
    expect(() => run({
      evidence: [{ ...evidence, tenantId: 'tenant-2' }],
    })).toThrowError(new AuthoringWorkflowError('TENANT_BOUNDARY_VIOLATION'));
  });
});
