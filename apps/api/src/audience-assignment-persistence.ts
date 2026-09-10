import type { DatabaseClient, DatabasePoolClient } from '@kaep/db';

export const AUDIENCE_ASSIGNMENT_OPERATION = 'CONFIRM_AUDIENCE_ASSIGNMENTS';

export class AudienceAssignmentPersistenceError extends Error {
  constructor(public readonly code:
    | 'IDEMPOTENCY_KEY_REQUIRED'
    | 'INVALID_RESOLUTION_FINGERPRINT'
    | 'PERSISTED_IDEMPOTENCY_CONFLICT'
    | 'IDEMPOTENCY_RECORD_INVALID'
    | 'RESOLUTION_NOT_AVAILABLE'
    | 'RESOLUTION_SCOPE_MISMATCH'
    | 'RESOLUTION_COUNT_MISMATCH'
    | 'LEARNER_NOT_ASSIGNABLE'
    | 'ASSIGNMENT_PERSISTENCE_CONFLICT'
    | 'ASSIGNMENT_ORIGIN_CONFLICT') {
    super(code);
    this.name = 'AudienceAssignmentPersistenceError';
  }
}

export interface PersistConfirmedAudienceAssignmentsInput {
  tenantId: string;
  trainingId: string;
  trainingVersionId: string;
  resolutionId: string;
  resolutionFingerprint: string;
  idempotencyKey: string;
  assignedAt?: Date;
}

export interface PersistedAudienceAssignmentResult {
  resolutionId: string;
  resolutionFingerprint: string;
  createdAssignmentIds: readonly string[];
  reusedAssignmentIds: readonly string[];
  unlinkedEmployeeIds: readonly string[];
  assignableLearnerCount: number;
  createdCount: number;
  reusedCount: number;
}

/** Internal qualification seam used only to prove transaction rollback. */
export interface AudienceAssignmentPersistenceHooks {
  afterAssignmentPersisted?: (persistedCount: number) => void | Promise<void>;
}

type PgClient = DatabasePoolClient;

interface IdempotencyRow {
  resource_id: string;
  result_ref: string | null;
}

interface ResolutionRow {
  id: string;
  tenant_id: string;
  training_id: string;
  training_version_id: string;
  status: string;
  fingerprint: string;
  unique_employee_count: number;
  assignable_learner_count: number;
}

interface ResolutionMemberRow {
  employee_id: string;
  learner_user_id: string | null;
  user_active: boolean | null;
  membership_status: string | null;
}

function assertInput(input: PersistConfirmedAudienceAssignmentsInput): void {
  if (!input.idempotencyKey.trim()) {
    throw new AudienceAssignmentPersistenceError('IDEMPOTENCY_KEY_REQUIRED');
  }
  if (!/^[a-f0-9]{64}$/i.test(input.resolutionFingerprint)) {
    throw new AudienceAssignmentPersistenceError('INVALID_RESOLUTION_FINGERPRINT');
  }
}

function resourceIdentity(input: PersistConfirmedAudienceAssignmentsInput): string {
  return JSON.stringify({
    resolutionId: input.resolutionId,
    resolutionFingerprint: input.resolutionFingerprint,
    trainingId: input.trainingId,
    trainingVersionId: input.trainingVersionId,
  });
}

function parsePersistedResult(row: IdempotencyRow, expectedResourceId: string): PersistedAudienceAssignmentResult {
  if (row.resource_id !== expectedResourceId) {
    throw new AudienceAssignmentPersistenceError('PERSISTED_IDEMPOTENCY_CONFLICT');
  }
  if (!row.result_ref) throw new AudienceAssignmentPersistenceError('IDEMPOTENCY_RECORD_INVALID');

  try {
    const parsed = JSON.parse(row.result_ref) as PersistedAudienceAssignmentResult;
    if (
      !parsed ||
      typeof parsed.resolutionId !== 'string' ||
      typeof parsed.resolutionFingerprint !== 'string' ||
      !Array.isArray(parsed.createdAssignmentIds) ||
      !Array.isArray(parsed.reusedAssignmentIds) ||
      !Array.isArray(parsed.unlinkedEmployeeIds) ||
      typeof parsed.assignableLearnerCount !== 'number' ||
      typeof parsed.createdCount !== 'number' ||
      typeof parsed.reusedCount !== 'number'
    ) {
      throw new Error('invalid persisted result shape');
    }
    return Object.freeze({
      ...parsed,
      createdAssignmentIds: Object.freeze([...parsed.createdAssignmentIds]),
      reusedAssignmentIds: Object.freeze([...parsed.reusedAssignmentIds]),
      unlinkedEmployeeIds: Object.freeze([...parsed.unlinkedEmployeeIds]),
    });
  } catch (error) {
    if (error instanceof AudienceAssignmentPersistenceError) throw error;
    throw new AudienceAssignmentPersistenceError('IDEMPOTENCY_RECORD_INVALID');
  }
}

async function claimIdempotency(
  client: PgClient,
  input: PersistConfirmedAudienceAssignmentsInput,
  expectedResourceId: string,
): Promise<PersistedAudienceAssignmentResult | null> {
  const existing = await client.query<IdempotencyRow>(
    `select resource_id, result_ref
       from command_idempotency
      where tenant_id = $1 and operation = $2 and idempotency_key = $3
      for update`,
    [input.tenantId, AUDIENCE_ASSIGNMENT_OPERATION, input.idempotencyKey],
  );
  if (existing.rowCount) return parsePersistedResult(existing.rows[0]!, expectedResourceId);

  const claimed = await client.query(
    `insert into command_idempotency (tenant_id, operation, idempotency_key, resource_id)
     values ($1, $2, $3, $4)
     on conflict (tenant_id, operation, idempotency_key) do nothing
     returning id`,
    [input.tenantId, AUDIENCE_ASSIGNMENT_OPERATION, input.idempotencyKey, expectedResourceId],
  );
  if (claimed.rowCount) return null;

  const raced = await client.query<IdempotencyRow>(
    `select resource_id, result_ref
       from command_idempotency
      where tenant_id = $1 and operation = $2 and idempotency_key = $3
      for update`,
    [input.tenantId, AUDIENCE_ASSIGNMENT_OPERATION, input.idempotencyKey],
  );
  if (!raced.rowCount) throw new AudienceAssignmentPersistenceError('IDEMPOTENCY_RECORD_INVALID');
  return parsePersistedResult(raced.rows[0]!, expectedResourceId);
}

async function loadConfirmedResolution(
  client: PgClient,
  input: PersistConfirmedAudienceAssignmentsInput,
): Promise<ResolutionRow> {
  const query = await client.query<ResolutionRow>(
    `select id, tenant_id, training_id, training_version_id, status, fingerprint,
            unique_employee_count, assignable_learner_count
       from training_audience_resolutions
      where tenant_id = $1 and id = $2
      for share`,
    [input.tenantId, input.resolutionId],
  );
  if (!query.rowCount) throw new AudienceAssignmentPersistenceError('RESOLUTION_NOT_AVAILABLE');

  const resolution = query.rows[0]!;
  if (resolution.status !== 'CONFIRMED') {
    throw new AudienceAssignmentPersistenceError('RESOLUTION_NOT_AVAILABLE');
  }
  if (
    resolution.training_id !== input.trainingId ||
    resolution.training_version_id !== input.trainingVersionId ||
    resolution.fingerprint !== input.resolutionFingerprint
  ) {
    throw new AudienceAssignmentPersistenceError('RESOLUTION_SCOPE_MISMATCH');
  }
  return resolution;
}

async function loadResolutionMembers(
  client: PgClient,
  input: PersistConfirmedAudienceAssignmentsInput,
  resolution: ResolutionRow,
): Promise<{ learnerIds: string[]; unlinkedEmployeeIds: string[] }> {
  const query = await client.query<ResolutionMemberRow>(
    `select m.employee_id,
            m.learner_user_id,
            u.is_active as user_active,
            membership.status as membership_status
       from training_audience_resolution_members m
       left join users u on u.id = m.learner_user_id
       left join memberships membership
              on membership.tenant_id = m.tenant_id
             and membership.user_id = m.learner_user_id
      where m.tenant_id = $1 and m.resolution_id = $2
      order by m.employee_id asc`,
    [input.tenantId, input.resolutionId],
  );

  if (query.rows.length !== resolution.unique_employee_count) {
    throw new AudienceAssignmentPersistenceError('RESOLUTION_COUNT_MISMATCH');
  }

  const learnerIds: string[] = [];
  const unlinkedEmployeeIds: string[] = [];
  for (const member of query.rows) {
    if (!member.learner_user_id) {
      unlinkedEmployeeIds.push(member.employee_id);
      continue;
    }
    if (member.user_active !== true || member.membership_status !== 'active') {
      throw new AudienceAssignmentPersistenceError('LEARNER_NOT_ASSIGNABLE');
    }
    learnerIds.push(member.learner_user_id);
  }

  const uniqueLearners = [...new Set(learnerIds)].sort();
  if (uniqueLearners.length !== learnerIds.length || uniqueLearners.length !== resolution.assignable_learner_count) {
    throw new AudienceAssignmentPersistenceError('RESOLUTION_COUNT_MISMATCH');
  }

  return {
    learnerIds: uniqueLearners,
    unlinkedEmployeeIds: unlinkedEmployeeIds.sort(),
  };
}

async function persistAssignment(
  client: PgClient,
  input: PersistConfirmedAudienceAssignmentsInput,
  learnerId: string,
  assignedAt: Date,
): Promise<{ assignmentId: string; created: boolean }> {
  const inserted = await client.query<{ id: string }>(
    `insert into training_assignments
       (tenant_id, learner_id, training_id, training_version_id, status, assigned_at, updated_at)
     values ($1, $2, $3, $4, 'ACTIVE', $5, $5)
     on conflict (tenant_id, learner_id, training_id, training_version_id)
       where status = 'ACTIVE'
     do nothing
     returning id`,
    [input.tenantId, learnerId, input.trainingId, input.trainingVersionId, assignedAt],
  );
  if (inserted.rowCount) return { assignmentId: inserted.rows[0]!.id, created: true };

  const existing = await client.query<{ id: string }>(
    `select id
       from training_assignments
      where tenant_id = $1
        and learner_id = $2
        and training_id = $3
        and training_version_id = $4
        and status = 'ACTIVE'
      for share`,
    [input.tenantId, learnerId, input.trainingId, input.trainingVersionId],
  );
  if (existing.rowCount !== 1) {
    throw new AudienceAssignmentPersistenceError('ASSIGNMENT_PERSISTENCE_CONFLICT');
  }
  return { assignmentId: existing.rows[0]!.id, created: false };
}

async function persistAudienceOrigin(
  client: PgClient,
  input: PersistConfirmedAudienceAssignmentsInput,
  assignmentId: string,
  assignedAt: Date,
): Promise<void> {
  const originKey = `AUDIENCE_RESOLUTION:${input.resolutionId}`;
  const inserted = await client.query(
    `insert into training_assignment_origins
       (tenant_id, assignment_id, origin_type, origin_key, source_ref_id, source_fingerprint, created_at)
     values ($1, $2, 'AUDIENCE_RESOLUTION', $3, $4, $5, $6)
     on conflict (tenant_id, assignment_id, origin_key) do nothing
     returning id`,
    [input.tenantId, assignmentId, originKey, input.resolutionId, input.resolutionFingerprint, assignedAt],
  );
  if (inserted.rowCount) return;

  const existing = await client.query<{
    origin_type: string;
    source_ref_id: string | null;
    source_fingerprint: string | null;
  }>(
    `select origin_type, source_ref_id, source_fingerprint
       from training_assignment_origins
      where tenant_id = $1 and assignment_id = $2 and origin_key = $3`,
    [input.tenantId, assignmentId, originKey],
  );
  const prior = existing.rows[0];
  if (
    existing.rowCount !== 1 ||
    prior?.origin_type !== 'AUDIENCE_RESOLUTION' ||
    prior.source_ref_id !== input.resolutionId ||
    prior.source_fingerprint !== input.resolutionFingerprint
  ) {
    throw new AudienceAssignmentPersistenceError('ASSIGNMENT_ORIGIN_CONFLICT');
  }
}

async function persistResult(
  client: PgClient,
  input: PersistConfirmedAudienceAssignmentsInput,
  expectedResourceId: string,
  result: PersistedAudienceAssignmentResult,
): Promise<void> {
  const updated = await client.query(
    `update command_idempotency
        set result_ref = $4
      where tenant_id = $1
        and operation = $2
        and idempotency_key = $3
        and resource_id = $5
        and result_ref is null`,
    [
      input.tenantId,
      AUDIENCE_ASSIGNMENT_OPERATION,
      input.idempotencyKey,
      JSON.stringify(result),
      expectedResourceId,
    ],
  );
  if (updated.rowCount !== 1) {
    throw new AudienceAssignmentPersistenceError('IDEMPOTENCY_RECORD_INVALID');
  }
}

export async function persistConfirmedAudienceAssignments(
  database: DatabaseClient,
  input: PersistConfirmedAudienceAssignmentsInput,
  hooks: AudienceAssignmentPersistenceHooks = {},
): Promise<{ result: PersistedAudienceAssignmentResult; replayed: boolean }> {
  assertInput(input);
  const expectedResourceId = resourceIdentity(input);
  const assignedAt = input.assignedAt ?? new Date();
  const client = await database.pool.connect();

  try {
    await client.query('begin');

    const replay = await claimIdempotency(client, input, expectedResourceId);
    if (replay) {
      await client.query('commit');
      return { result: replay, replayed: true };
    }

    const resolution = await loadConfirmedResolution(client, input);
    const members = await loadResolutionMembers(client, input, resolution);
    const createdAssignmentIds: string[] = [];
    const reusedAssignmentIds: string[] = [];
    let persistedCount = 0;

    for (const learnerId of members.learnerIds) {
      const assignment = await persistAssignment(client, input, learnerId, assignedAt);
      if (assignment.created) createdAssignmentIds.push(assignment.assignmentId);
      else reusedAssignmentIds.push(assignment.assignmentId);

      await persistAudienceOrigin(client, input, assignment.assignmentId, assignedAt);
      persistedCount += 1;
      await hooks.afterAssignmentPersisted?.(persistedCount);
    }

    const result: PersistedAudienceAssignmentResult = Object.freeze({
      resolutionId: input.resolutionId,
      resolutionFingerprint: input.resolutionFingerprint,
      createdAssignmentIds: Object.freeze([...createdAssignmentIds].sort()),
      reusedAssignmentIds: Object.freeze([...reusedAssignmentIds].sort()),
      unlinkedEmployeeIds: Object.freeze([...members.unlinkedEmployeeIds]),
      assignableLearnerCount: members.learnerIds.length,
      createdCount: createdAssignmentIds.length,
      reusedCount: reusedAssignmentIds.length,
    });

    await persistResult(client, input, expectedResourceId, result);
    await client.query('commit');
    return { result, replayed: false };
  } catch (error) {
    try {
      await client.query('rollback');
    } catch {
    }
    throw error;
  } finally {
    client.release();
  }
}
