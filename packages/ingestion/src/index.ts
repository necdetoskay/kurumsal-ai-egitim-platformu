export const sourceTypes = ['PDF','DOCX','TXT','MARKDOWN','HTML','PASTED_TEXT','IMAGE','AUDIO','VIDEO_TRANSCRIPT','URL','EXTERNAL_DISCOVERED','INTERNAL_CURATED'] as const;
export type SourceType = (typeof sourceTypes)[number];

export const qualityStates = ['PASS','PASS_WITH_WARNINGS','REPROCESS_REQUIRED','HUMAN_REVIEW_REQUIRED','REJECTED'] as const;
export type QualityState = (typeof qualityStates)[number];

export type ExtractionTier = 'D0_NATIVE' | 'D1_OCR_TRANSCRIPTION' | 'D2_VISION_SELECTIVE';
export type SourceStatus = 'ACQUIRED' | 'PROCESSING' | 'READY' | 'QUARANTINED' | 'REJECTED';

export interface SourceAsset {
  id: string;
  tenantId: string;
  sourceType: SourceType;
  originalUri: string;
  originalFilename?: string;
  title?: string;
  mimeType?: string;
  sourceLanguage?: string;
  acquisitionMethod: string;
  acquiredAt: Date;
  checksum: string;
  status: SourceStatus;
  untrusted: true;
}

export interface ExtractionRun {
  id: string;
  tenantId: string;
  sourceAssetId: string;
  extractor: string;
  extractorVersion: string;
  tier: ExtractionTier;
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
  qualityState?: QualityState;
  startedAt: Date;
  completedAt?: Date;
}

export interface ExtractedDocument {
  id: string;
  tenantId: string;
  sourceAssetId: string;
  extractionRunId: string;
  originalText: string;
  normalizedText: string;
  detectedLanguage?: string;
  qualityState: QualityState;
}

export interface EvidenceSegment {
  id: string;
  tenantId: string;
  sourceAssetId: string;
  extractionRunId: string;
  locator: string;
  text: string;
  language?: string;
  checksum: string;
  qualityState: QualityState;
}

export class IngestionDomainError extends Error {
  constructor(public readonly code: 'TENANT_BOUNDARY_VIOLATION' | 'DUPLICATE_SOURCE' | 'INVALID_PROVENANCE' | 'QUALITY_GATE_FAILED' | 'VALIDATION_FAILED') {
    super(code);
  }
}

export function detectDuplicateSource(existing: readonly SourceAsset[], candidate: Pick<SourceAsset,'tenantId'|'checksum'>): SourceAsset | null {
  return existing.find((asset) => asset.tenantId === candidate.tenantId && asset.checksum === candidate.checksum) ?? null;
}

export interface RoutingInput {
  nativeTextAvailable: boolean;
  nativeTextQuality: number;
  imageRatio: number;
  layoutComplexity: number;
  ocrQuality?: number;
}

export function routeExtraction(input: RoutingInput): ExtractionTier {
  if (input.nativeTextAvailable && input.nativeTextQuality >= 0.8) return 'D0_NATIVE';
  if ((input.ocrQuality ?? 1) >= 0.7 && input.layoutComplexity < 0.85) return 'D1_OCR_TRANSCRIPTION';
  return 'D2_VISION_SELECTIVE';
}

export function canPromoteReady(quality: QualityState, allowWarnings = false): boolean {
  if (quality === 'PASS') return true;
  if (quality === 'PASS_WITH_WARNINGS') return allowWarnings;
  return false;
}

export function promoteSourceReady(asset: SourceAsset, quality: QualityState, allowWarnings = false): SourceAsset {
  if (!canPromoteReady(quality, allowWarnings)) throw new IngestionDomainError('QUALITY_GATE_FAILED');
  return { ...asset, status: 'READY' };
}

export function assertProvenance(input: {
  source: SourceAsset;
  run: ExtractionRun;
  document?: ExtractedDocument;
  evidence?: EvidenceSegment;
}): void {
  const { source, run, document, evidence } = input;
  if (run.tenantId !== source.tenantId || run.sourceAssetId !== source.id) throw new IngestionDomainError('INVALID_PROVENANCE');
  for (const item of [document, evidence]) {
    if (!item) continue;
    if (item.tenantId !== source.tenantId || item.sourceAssetId !== source.id || item.extractionRunId !== run.id) {
      throw new IngestionDomainError('INVALID_PROVENANCE');
    }
  }
}

export function normalizeTextDeterministically(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function buildExtractedDocument(input: {
  id: string;
  source: SourceAsset;
  run: ExtractionRun;
  originalText: string;
  qualityState: QualityState;
  detectedLanguage?: string;
}): ExtractedDocument {
  const doc: ExtractedDocument = {
    id: input.id,
    tenantId: input.source.tenantId,
    sourceAssetId: input.source.id,
    extractionRunId: input.run.id,
    originalText: input.originalText,
    normalizedText: normalizeTextDeterministically(input.originalText),
    qualityState: input.qualityState,
    ...(input.detectedLanguage ? { detectedLanguage: input.detectedLanguage } : {}),
  };
  assertProvenance({ source: input.source, run: input.run, document: doc });
  return Object.freeze(doc);
}

export function sourceContentAuthority(): { canGrantToolPermission: false; canOverrideSystemInstructions: false } {
  return { canGrantToolPermission: false, canOverrideSystemInstructions: false };
}
