import {
  assertHumanPublishBoundary,
  evaluateAuthoringReadiness,
  type AuthoringCandidate,
  type AuthoringRun,
} from '@kaep/authoring';
import {
  assertProvenance,
  canPromoteReady,
  type EvidenceSegment,
  type ExtractionRun,
  type SourceAsset,
} from '@kaep/ingestion';

export class AuthoringWorkflowError extends Error {
  constructor(public readonly code:
    | 'TENANT_BOUNDARY_VIOLATION'
    | 'SOURCE_NOT_READY'
    | 'EVIDENCE_NOT_USABLE') {
    super(code);
  }
}

export interface PrepareAuthoringReviewInput {
  tenantId: string;
  trainingId: string;
  source: SourceAsset;
  extractionRun: ExtractionRun;
  evidence: readonly EvidenceSegment[];
  candidateId: string;
  authoringRunId: string;
  candidateKind: AuthoringCandidate['kind'];
  candidateText: string;
  schemaVersion: string;
  promptId: string;
  promptVersion: string;
  modelId: string;
  inputSnapshotHash: string;
}

export function prepareAuthoringReviewFromEvidence(
  input: PrepareAuthoringReviewInput,
): AuthoringRun {
  if (input.source.tenantId !== input.tenantId || input.extractionRun.tenantId !== input.tenantId) {
    throw new AuthoringWorkflowError('TENANT_BOUNDARY_VIOLATION');
  }
  if (input.source.status !== 'READY') {
    throw new AuthoringWorkflowError('SOURCE_NOT_READY');
  }
  if (input.evidence.length === 0) {
    throw new AuthoringWorkflowError('EVIDENCE_NOT_USABLE');
  }

  for (const segment of input.evidence) {
    if (segment.tenantId !== input.tenantId) {
      throw new AuthoringWorkflowError('TENANT_BOUNDARY_VIOLATION');
    }
    assertProvenance({
      source: input.source,
      run: input.extractionRun,
      evidence: segment,
    });
    if (!canPromoteReady(segment.qualityState, true)) {
      throw new AuthoringWorkflowError('EVIDENCE_NOT_USABLE');
    }
  }

  const candidate: AuthoringCandidate = Object.freeze({
    id: input.candidateId,
    tenantId: input.tenantId,
    trainingId: input.trainingId,
    kind: input.candidateKind,
    text: input.candidateText,
    evidenceRefs: Object.freeze(input.evidence.map((segment) => Object.freeze({
      tenantId: input.tenantId,
      sourceAssetId: segment.sourceAssetId,
      evidenceSegmentId: segment.id,
      qualityState: segment.qualityState as 'PASS' | 'PASS_WITH_WARNINGS',
    }))),
  });

  const run: AuthoringRun = Object.freeze({
    id: input.authoringRunId,
    tenantId: input.tenantId,
    trainingId: input.trainingId,
    schemaVersion: input.schemaVersion,
    promptId: input.promptId,
    promptVersion: input.promptVersion,
    modelId: input.modelId,
    inputSnapshotHash: input.inputSnapshotHash,
    status: 'DRAFT',
    candidates: Object.freeze([candidate]),
  });

  const status = evaluateAuthoringReadiness(run);
  const readyRun = Object.freeze({ ...run, status });
  assertHumanPublishBoundary(readyRun);
  return readyRun;
}
