import { boolean, index, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './schema.js';

export const sourceAssets = pgTable('source_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  sourceType: text('source_type').notNull(),
  originalUri: text('original_uri').notNull(),
  originalFilename: text('original_filename'),
  title: text('title'),
  mimeType: text('mime_type'),
  sourceLanguage: text('source_language'),
  acquisitionMethod: text('acquisition_method').notNull(),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }).defaultNow().notNull(),
  checksum: text('checksum').notNull(),
  status: text('status').notNull().default('ACQUIRED'),
  untrusted: boolean('untrusted').notNull().default(true),
  metadata: jsonb('metadata'),
}, (table) => ({
  tenantChecksumUnique: uniqueIndex('source_assets_tenant_checksum_uq').on(table.tenantId, table.checksum),
  tenantStatusIdx: index('source_assets_tenant_status_idx').on(table.tenantId, table.status),
}));

export const extractionRuns = pgTable('extraction_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  sourceAssetId: uuid('source_asset_id').notNull().references(() => sourceAssets.id),
  extractor: text('extractor').notNull(),
  extractorVersion: text('extractor_version').notNull(),
  extractionTier: text('extraction_tier').notNull(),
  status: text('status').notNull(),
  qualityState: text('quality_state'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  latencyMs: numeric('latency_ms'),
  costAmount: numeric('cost_amount'),
  errorCode: text('error_code'),
}, (table) => ({
  sourceStartedIdx: index('extraction_runs_source_started_idx').on(table.tenantId, table.sourceAssetId, table.startedAt),
}));

export const extractedDocuments = pgTable('extracted_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  sourceAssetId: uuid('source_asset_id').notNull().references(() => sourceAssets.id),
  extractionRunId: uuid('extraction_run_id').notNull().references(() => extractionRuns.id),
  originalText: text('original_text').notNull(),
  normalizedText: text('normalized_text').notNull(),
  detectedLanguage: text('detected_language'),
  structuralRepresentation: jsonb('structural_representation'),
  pageSegmentMap: jsonb('page_segment_map'),
  qualityState: text('quality_state').notNull(),
}, (table) => ({
  runUnique: uniqueIndex('extracted_documents_run_uq').on(table.tenantId, table.extractionRunId),
}));

export const evidenceSegments = pgTable('evidence_segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  sourceAssetId: uuid('source_asset_id').notNull().references(() => sourceAssets.id),
  extractionRunId: uuid('extraction_run_id').notNull().references(() => extractionRuns.id),
  locator: text('locator').notNull(),
  text: text('text').notNull(),
  language: text('language'),
  checksum: text('checksum').notNull(),
  qualityState: text('quality_state').notNull(),
}, (table) => ({
  sourceLocatorIdx: index('evidence_segments_source_locator_idx').on(table.tenantId, table.sourceAssetId, table.locator),
  runChecksumUnique: uniqueIndex('evidence_segments_run_checksum_uq').on(table.tenantId, table.extractionRunId, table.checksum),
}));
