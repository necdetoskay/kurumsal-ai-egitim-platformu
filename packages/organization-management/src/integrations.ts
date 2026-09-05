export type ExternalProvider = 'CSV' | 'LDAP' | 'ACTIVE_DIRECTORY' | 'HR_API' | 'ERP';
export type ImportRowDecision = 'CREATE_EMPLOYEE' | 'LINK_EXISTING' | 'START_EMPLOYMENT' | 'TRANSFER_EMPLOYMENT' | 'NOOP' | 'CONFLICT';
export type SyncJobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'SUCCEEDED_WITH_WARNINGS' | 'FAILED';

export interface CanonicalEmployeeImportRow {
  rowNumber: number;
  employeeNo?: string;
  fullName: string;
  email?: string;
  provider: ExternalProvider;
  externalId: string;
  organizationId: string;
  companyId?: string;
  departmentId?: string;
  positionId?: string;
  locationId?: string;
  employmentStart?: string;
}

export interface ExistingEmployeeSnapshot {
  employeeId: string;
  provider: ExternalProvider;
  externalId: string;
  activeEmployment?: {
    employmentId: string;
    companyId: string;
    departmentId?: string;
    positionId?: string;
    locationId?: string;
  };
}

export interface ImportConflict {
  rowNumber: number;
  code: 'DUPLICATE_EXTERNAL_IDENTITY' | 'ACTIVE_EMPLOYMENT_DIFFERS' | 'SCOPE_REFERENCE_INVALID' | 'AMBIGUOUS_EMPLOYEE_MATCH';
  message: string;
  requiresResolution: true;
}

export interface ImportPreviewItem {
  rowNumber: number;
  employeeId?: string;
  decision: ImportRowDecision;
  conflict?: ImportConflict;
}

export interface ImportPreview {
  items: ImportPreviewItem[];
  conflicts: ImportConflict[];
  canCommit: boolean;
}

export function externalIdentityKey(tenantId: string, provider: ExternalProvider, externalId: string): string {
  if (!tenantId || !externalId.trim()) throw new Error('EXTERNAL_IDENTITY_KEY_INVALID');
  return `${tenantId}:${provider}:${externalId.trim().toLowerCase()}`;
}

export function previewImport(rows: readonly CanonicalEmployeeImportRow[], existingByIdentity: ReadonlyMap<string, ExistingEmployeeSnapshot>, tenantId: string): ImportPreview {
  const seen = new Set<string>();
  const items: ImportPreviewItem[] = [];
  const conflicts: ImportConflict[] = [];

  for (const row of rows) {
    const key = externalIdentityKey(tenantId, row.provider, row.externalId);
    if (seen.has(key)) {
      const conflict: ImportConflict = { rowNumber: row.rowNumber, code: 'DUPLICATE_EXTERNAL_IDENTITY', message: 'Import contains the same external identity more than once.', requiresResolution: true };
      conflicts.push(conflict);
      items.push({ rowNumber: row.rowNumber, decision: 'CONFLICT', conflict });
      continue;
    }
    seen.add(key);

    const existing = existingByIdentity.get(key);
    if (!existing) {
      items.push({ rowNumber: row.rowNumber, decision: 'CREATE_EMPLOYEE' });
      continue;
    }

    const employment = existing.activeEmployment;
    if (!employment) {
      items.push({ rowNumber: row.rowNumber, employeeId: existing.employeeId, decision: row.companyId ? 'START_EMPLOYMENT' : 'LINK_EXISTING' });
      continue;
    }

    const differs = (row.companyId !== undefined && row.companyId !== employment.companyId)
      || (row.departmentId !== undefined && row.departmentId !== employment.departmentId)
      || (row.positionId !== undefined && row.positionId !== employment.positionId)
      || (row.locationId !== undefined && row.locationId !== employment.locationId);

    if (differs) {
      const conflict: ImportConflict = { rowNumber: row.rowNumber, code: 'ACTIVE_EMPLOYMENT_DIFFERS', message: 'Incoming placement differs from current active employment; explicit transfer resolution is required.', requiresResolution: true };
      conflicts.push(conflict);
      items.push({ rowNumber: row.rowNumber, employeeId: existing.employeeId, decision: 'CONFLICT', conflict });
    } else {
      items.push({ rowNumber: row.rowNumber, employeeId: existing.employeeId, decision: 'NOOP' });
    }
  }

  return { items, conflicts, canCommit: conflicts.length === 0 };
}

export interface ExternalPersonRecord {
  provider: ExternalProvider;
  externalId: string;
  fullName: string;
  employeeNo?: string;
  email?: string;
  organizationCode?: string;
  companyCode?: string;
  departmentCode?: string;
  positionCode?: string;
  locationCode?: string;
  sourceVersion?: string;
}

export interface CanonicalSyncProposal {
  identityKey: string;
  provider: ExternalProvider;
  externalId: string;
  employeePatch: { fullName: string; employeeNo?: string; email?: string };
  placementReference: { organizationCode?: string; companyCode?: string; departmentCode?: string; positionCode?: string; locationCode?: string };
  sourceVersion?: string;
  historyMutation: 'NONE';
}

export function mapExternalRecord(tenantId: string, record: ExternalPersonRecord): CanonicalSyncProposal {
  return {
    identityKey: externalIdentityKey(tenantId, record.provider, record.externalId),
    provider: record.provider,
    externalId: record.externalId,
    employeePatch: {
      fullName: record.fullName,
      ...(record.employeeNo !== undefined ? { employeeNo: record.employeeNo } : {}),
      ...(record.email !== undefined ? { email: record.email } : {}),
    },
    placementReference: {
      ...(record.organizationCode !== undefined ? { organizationCode: record.organizationCode } : {}),
      ...(record.companyCode !== undefined ? { companyCode: record.companyCode } : {}),
      ...(record.departmentCode !== undefined ? { departmentCode: record.departmentCode } : {}),
      ...(record.positionCode !== undefined ? { positionCode: record.positionCode } : {}),
      ...(record.locationCode !== undefined ? { locationCode: record.locationCode } : {}),
    },
    ...(record.sourceVersion !== undefined ? { sourceVersion: record.sourceVersion } : {}),
    historyMutation: 'NONE',
  };
}

export interface ExternalDirectoryAdapter {
  readonly provider: Extract<ExternalProvider, 'LDAP' | 'ACTIVE_DIRECTORY'>;
  pull(cursor?: string): Promise<{ records: ExternalPersonRecord[]; nextCursor: string | null }>;
}

export interface WorkforceAdapter {
  readonly provider: Extract<ExternalProvider, 'HR_API' | 'ERP'>;
  pull(cursor?: string): Promise<{ records: ExternalPersonRecord[]; nextCursor: string | null }>;
}

export interface SyncJobResult {
  idempotencyKey: string;
  status: SyncJobStatus;
  processed: number;
  applied: number;
  conflicts: number;
  errors: Array<{ externalId?: string; code: string; message: string }>;
  correlationId: string;
}

export interface SyncExecutionPort {
  findCompletedByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<SyncJobResult | null>;
  execute(input: { tenantId: string; idempotencyKey: string; correlationId: string; proposals: CanonicalSyncProposal[] }): Promise<SyncJobResult>;
  appendAudit(event: OrganizationIntegrationAuditEvent): Promise<void>;
}

export async function runSync(input: { tenantId: string; idempotencyKey: string; correlationId: string; records: readonly ExternalPersonRecord[] }, port: SyncExecutionPort): Promise<SyncJobResult> {
  const prior = await port.findCompletedByIdempotencyKey(input.tenantId, input.idempotencyKey);
  if (prior) return prior;
  const proposals = input.records.map((record) => mapExternalRecord(input.tenantId, record));
  const result = await port.execute({ tenantId: input.tenantId, idempotencyKey: input.idempotencyKey, correlationId: input.correlationId, proposals });
  await port.appendAudit({ tenantId: input.tenantId, action: 'EXTERNAL_SYNC_EXECUTED', entityType: 'SYNC_JOB', entityId: input.idempotencyKey, correlationId: input.correlationId, after: { status: result.status, processed: result.processed, applied: result.applied, conflicts: result.conflicts } });
  return result;
}

export interface OrganizationIntegrationAuditEvent {
  tenantId: string;
  actorUserId?: string;
  action: string;
  entityType: 'IMPORT_JOB' | 'SYNC_JOB' | 'EMPLOYEE' | 'EMPLOYMENT' | 'EXTERNAL_IDENTITY';
  entityId?: string;
  before?: unknown;
  after?: unknown;
  correlationId: string;
  occurredAt?: string;
}

export interface AuditQuery {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  cursor?: string;
  limit?: number;
}

export interface AuditProjection {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  correlationId: string | null;
  occurredAt: string;
  before?: unknown;
  after?: unknown;
}

export interface OrganizationAuditQueryPort {
  assertTenantScope(tenantId: string, actorUserId: string): Promise<void>;
  query(tenantId: string, input: AuditQuery): Promise<{ data: AuditProjection[]; nextCursor: string | null }>;
}

export async function queryOrganizationAudit(input: { tenantId: string; actorUserId: string; query: AuditQuery }, port: OrganizationAuditQueryPort) {
  await port.assertTenantScope(input.tenantId, input.actorUserId);
  const limit = Math.max(1, Math.min(input.query.limit ?? 25, 100));
  return port.query(input.tenantId, { ...input.query, limit });
}
