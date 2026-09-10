import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import {
  AUDIENCE_ASSIGNMENT_OPERATION,
  AudienceAssignmentPersistenceError,
  persistConfirmedAudienceAssignments,
  type PersistConfirmedAudienceAssignmentsInput,
} from './audience-assignment-persistence.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for M1B PostgreSQL qualification`);
  return value;
}

const databaseUrl = requiredEnv('DATABASE_URL');
const fp = (char: string) => char.repeat(64);
type Pool = ReturnType<typeof createDatabase>['pool'];

async function expectPersistenceCode(
  promise: Promise<unknown>,
  code: AudienceAssignmentPersistenceError['code'],
): Promise<void> {
  await assert.rejects(promise, (error: unknown) =>
    error instanceof AudienceAssignmentPersistenceError && error.code === code,
  );
}

async function expectPgCode(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === code,
  );
}

async function insertTenant(pool: Pool, tenantId: string, name: string): Promise<void> {
  await pool.query(
    `insert into tenants (id, name, slug) values ($1, $2, $3)`,
    [tenantId, name, `mur-${randomUUID()}`],
  );
}

async function insertUser(pool: Pool, userId: string, label: string): Promise<void> {
  await pool.query(
    `insert into users (id, display_name, email, is_active) values ($1, $2, $3, true)`,
    [userId, label, `${randomUUID()}@example.invalid`],
  );
}

async function addMembership(pool: Pool, tenantId: string, userId: string): Promise<void> {
  await pool.query(
    `insert into memberships (tenant_id, user_id, status) values ($1, $2, 'active')`,
    [tenantId, userId],
  );
}

async function insertUserWithMembership(pool: Pool, tenantId: string, userId: string, label: string): Promise<void> {
  await insertUser(pool, userId, label);
  await addMembership(pool, tenantId, userId);
}

async function insertOrganization(pool: Pool, tenantId: string, organizationId: string, label: string): Promise<void> {
  await pool.query(
    `insert into organizations (id, tenant_id, name, code, default_locale, timezone)
     values ($1, $2, $3, $4, 'tr-TR', 'Europe/Istanbul')`,
    [organizationId, tenantId, label, `ORG-${randomUUID().slice(0, 8)}`],
  );
}

async function insertEmployee(
  pool: Pool,
  tenantId: string,
  organizationId: string,
  employeeId: string,
  label: string,
): Promise<void> {
  await pool.query(
    `insert into employees (id, tenant_id, organization_id, first_name, last_name)
     values ($1, $2, $3, $4, 'MUR')`,
    [employeeId, tenantId, organizationId, label],
  );
}

async function insertTraining(pool: Pool, tenantId: string, trainingId: string, versionId: string): Promise<void> {
  await pool.query(
    `insert into trainings (id, tenant_id, title, status) values ($1, $2, 'MUR M1B Training', 'PUBLISHED')`,
    [trainingId, tenantId],
  );
  await pool.query(
    `insert into training_versions (id, tenant_id, training_id, version, snapshot, published_at)
     values ($1, $2, $3, 1, '{}'::jsonb, now())`,
    [versionId, tenantId, trainingId],
  );
}

interface ResolutionMemberSeed {
  employeeId: string;
  learnerUserId: string | null;
  sourceAudienceIds?: readonly string[];
}

async function insertResolution(
  pool: Pool,
  input: {
    tenantId: string;
    trainingId: string;
    trainingVersionId: string;
    resolutionId: string;
    fingerprint: string;
    members: readonly ResolutionMemberSeed[];
    status?: 'PREVIEW' | 'CONFIRMED';
  },
): Promise<void> {
  const assignable = input.members.filter((member) => member.learnerUserId !== null).length;
  await pool.query(
    `insert into training_audience_resolutions
       (id, tenant_id, training_id, training_version_id, status, fingerprint,
        target_count, overlap_count, unique_employee_count, assignable_learner_count)
     values ($1, $2, $3, $4, $5, $6, 1, 0, $7, $8)`,
    [
      input.resolutionId,
      input.tenantId,
      input.trainingId,
      input.trainingVersionId,
      input.status ?? 'CONFIRMED',
      input.fingerprint,
      input.members.length,
      assignable,
    ],
  );

  for (const member of input.members) {
    await pool.query(
      `insert into training_audience_resolution_members
         (tenant_id, resolution_id, employee_id, learner_user_id, source_audience_ids)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [
        input.tenantId,
        input.resolutionId,
        member.employeeId,
        member.learnerUserId,
        JSON.stringify(member.sourceAudienceIds ?? ['audience-1']),
      ],
    );
  }
}

function command(input: {
  tenantId: string;
  trainingId: string;
  trainingVersionId: string;
  resolutionId: string;
  fingerprint: string;
  idempotencyKey: string;
}): PersistConfirmedAudienceAssignmentsInput {
  return {
    tenantId: input.tenantId,
    trainingId: input.trainingId,
    trainingVersionId: input.trainingVersionId,
    resolutionId: input.resolutionId,
    resolutionFingerprint: input.fingerprint,
    idempotencyKey: input.idempotencyKey,
    assignedAt: new Date('2026-09-10T00:00:00.000Z'),
  };
}

async function countRows(pool: Pool, sql: string, params: readonly unknown[]): Promise<number> {
  const result = await pool.query<{ count: string }>(sql, [...params]);
  return Number(result.rows[0]?.count ?? '0');
}

async function main(): Promise<void> {
  const database = createDatabase(databaseUrl);
  try {
    const tenant1 = randomUUID();
    const tenant2 = randomUUID();
    const org1 = randomUUID();
    const org2 = randomUUID();
    const training1 = randomUUID();
    const version1 = randomUUID();

    await insertTenant(database.pool, tenant1, 'MUR Tenant One');
    await insertTenant(database.pool, tenant2, 'MUR Tenant Two');
    await insertOrganization(database.pool, tenant1, org1, 'MUR Org One');
    await insertOrganization(database.pool, tenant2, org2, 'MUR Org Two');
    await insertTraining(database.pool, tenant1, training1, version1);

    const user1 = randomUUID();
    const user2 = randomUUID();
    const userTenant2 = randomUUID();
    await insertUserWithMembership(database.pool, tenant1, user1, 'Learner One');
    await insertUserWithMembership(database.pool, tenant1, user2, 'Learner Two');
    await insertUserWithMembership(database.pool, tenant2, userTenant2, 'Tenant Two Learner');

    const employee1 = randomUUID();
    const employee2 = randomUUID();
    const employeeUnlinked = randomUUID();
    const employeeTenant2 = randomUUID();
    await insertEmployee(database.pool, tenant1, org1, employee1, 'Employee One');
    await insertEmployee(database.pool, tenant1, org1, employee2, 'Employee Two');
    await insertEmployee(database.pool, tenant1, org1, employeeUnlinked, 'Employee Unlinked');
    await insertEmployee(database.pool, tenant2, org2, employeeTenant2, 'Employee Tenant Two');

    const resolution1 = randomUUID();
    await insertResolution(database.pool, {
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: resolution1,
      fingerprint: fp('a'),
      members: [
        { employeeId: employee1, learnerUserId: user1, sourceAudienceIds: ['org', 'department', 'group'] },
        { employeeId: employee2, learnerUserId: user2, sourceAudienceIds: ['group'] },
        { employeeId: employeeUnlinked, learnerUserId: null, sourceAudienceIds: ['employee'] },
      ],
    });

    const firstInput = command({
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: resolution1,
      fingerprint: fp('a'),
      idempotencyKey: 'mur-m1b-base',
    });
    const first = await persistConfirmedAudienceAssignments(database, firstInput);
    assert.equal(first.replayed, false);
    assert.equal(first.result.createdCount, 2);
    assert.equal(first.result.reusedCount, 0);
    assert.deepEqual(first.result.unlinkedEmployeeIds, [employeeUnlinked]);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignments where tenant_id = $1 and training_version_id = $2 and status = 'ACTIVE'`,
      [tenant1, version1],
    ), 2);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignment_origins where tenant_id = $1 and source_ref_id = $2`,
      [tenant1, resolution1],
    ), 2);

    const replayDatabase = createDatabase(databaseUrl);
    try {
      const replay = await persistConfirmedAudienceAssignments(replayDatabase, firstInput);
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.result, first.result);
    } finally {
      await replayDatabase.close();
    }

    const secondKey = await persistConfirmedAudienceAssignments(database, {
      ...firstInput,
      idempotencyKey: 'mur-m1b-base-second-key',
    });
    assert.equal(secondKey.result.createdCount, 0);
    assert.equal(secondKey.result.reusedCount, 2);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignment_origins where tenant_id = $1 and source_ref_id = $2`,
      [tenant1, resolution1],
    ), 2);

    const resolutionConflict = randomUUID();
    await insertResolution(database.pool, {
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: resolutionConflict,
      fingerprint: fp('b'),
      members: [{ employeeId: employee1, learnerUserId: user1 }],
    });
    await expectPersistenceCode(
      persistConfirmedAudienceAssignments(database, command({
        tenantId: tenant1,
        trainingId: training1,
        trainingVersionId: version1,
        resolutionId: resolutionConflict,
        fingerprint: fp('b'),
        idempotencyKey: 'mur-m1b-base',
      })),
      'PERSISTED_IDEMPOTENCY_CONFLICT',
    );

    await expectPersistenceCode(
      persistConfirmedAudienceAssignments(database, command({
        tenantId: tenant2,
        trainingId: training1,
        trainingVersionId: version1,
        resolutionId: resolution1,
        fingerprint: fp('a'),
        idempotencyKey: 'mur-cross-tenant-resolution',
      })),
      'RESOLUTION_NOT_AVAILABLE',
    );
    assert.equal(await countRows(
      database.pool,
      `select count(*) from command_idempotency where tenant_id = $1 and operation = $2 and idempotency_key = $3`,
      [tenant2, AUDIENCE_ASSIGNMENT_OPERATION, 'mur-cross-tenant-resolution'],
    ), 0);

    const noMembershipUser = randomUUID();
    const employeeNoMembership = randomUUID();
    await insertUser(database.pool, noMembershipUser, 'No Membership Learner');
    await insertEmployee(database.pool, tenant1, org1, employeeNoMembership, 'No Membership Employee');
    const resolutionNoMembership = randomUUID();
    await insertResolution(database.pool, {
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: resolutionNoMembership,
      fingerprint: fp('c'),
      members: [{ employeeId: employeeNoMembership, learnerUserId: noMembershipUser }],
    });
    await expectPersistenceCode(
      persistConfirmedAudienceAssignments(database, command({
        tenantId: tenant1,
        trainingId: training1,
        trainingVersionId: version1,
        resolutionId: resolutionNoMembership,
        fingerprint: fp('c'),
        idempotencyKey: 'mur-no-membership',
      })),
      'LEARNER_NOT_ASSIGNABLE',
    );

    const directUser = randomUUID();
    const directEmployee = randomUUID();
    const directAssignment = randomUUID();
    await insertUserWithMembership(database.pool, tenant1, directUser, 'Direct Learner');
    await insertEmployee(database.pool, tenant1, org1, directEmployee, 'Direct Employee');
    await database.pool.query(
      `insert into training_assignments
         (id, tenant_id, learner_id, training_id, training_version_id, status, assigned_at)
       values ($1, $2, $3, $4, $5, 'ACTIVE', now())`,
      [directAssignment, tenant1, directUser, training1, version1],
    );
    await database.pool.query(
      `insert into training_assignment_origins
         (tenant_id, assignment_id, origin_type, origin_key, created_at)
       values ($1, $2, 'DIRECT', 'DIRECT', now())`,
      [tenant1, directAssignment],
    );
    const directResolution = randomUUID();
    await insertResolution(database.pool, {
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: directResolution,
      fingerprint: fp('d'),
      members: [{ employeeId: directEmployee, learnerUserId: directUser }],
    });
    const directResult = await persistConfirmedAudienceAssignments(database, command({
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: directResolution,
      fingerprint: fp('d'),
      idempotencyKey: 'mur-direct-reuse',
    }));
    assert.deepEqual(directResult.result.reusedAssignmentIds, [directAssignment]);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignment_origins where tenant_id = $1 and assignment_id = $2`,
      [tenant1, directAssignment],
    ), 2);

    const rollbackUsers = [randomUUID(), randomUUID()];
    const rollbackEmployees = [randomUUID(), randomUUID()];
    await insertUserWithMembership(database.pool, tenant1, rollbackUsers[0]!, 'Rollback One');
    await insertUserWithMembership(database.pool, tenant1, rollbackUsers[1]!, 'Rollback Two');
    await insertEmployee(database.pool, tenant1, org1, rollbackEmployees[0]!, 'Rollback Employee One');
    await insertEmployee(database.pool, tenant1, org1, rollbackEmployees[1]!, 'Rollback Employee Two');
    const rollbackResolution = randomUUID();
    await insertResolution(database.pool, {
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: rollbackResolution,
      fingerprint: fp('e'),
      members: [
        { employeeId: rollbackEmployees[0]!, learnerUserId: rollbackUsers[0]! },
        { employeeId: rollbackEmployees[1]!, learnerUserId: rollbackUsers[1]! },
      ],
    });
    await assert.rejects(
      persistConfirmedAudienceAssignments(
        database,
        command({
          tenantId: tenant1,
          trainingId: training1,
          trainingVersionId: version1,
          resolutionId: rollbackResolution,
          fingerprint: fp('e'),
          idempotencyKey: 'mur-rollback',
        }),
        { afterAssignmentPersisted: (count) => { if (count === 1) throw new Error('FORCED_M1B_ROLLBACK'); } },
      ),
      /FORCED_M1B_ROLLBACK/,
    );
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignments where learner_id = any($1::uuid[])`,
      [rollbackUsers],
    ), 0);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignment_origins where tenant_id = $1 and source_ref_id = $2`,
      [tenant1, rollbackResolution],
    ), 0);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from command_idempotency where tenant_id = $1 and operation = $2 and idempotency_key = 'mur-rollback'`,
      [tenant1, AUDIENCE_ASSIGNMENT_OPERATION],
    ), 0);

    const concurrentUser = randomUUID();
    const concurrentEmployee = randomUUID();
    await insertUserWithMembership(database.pool, tenant1, concurrentUser, 'Concurrent Learner');
    await insertEmployee(database.pool, tenant1, org1, concurrentEmployee, 'Concurrent Employee');
    const concurrentResolution = randomUUID();
    await insertResolution(database.pool, {
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: concurrentResolution,
      fingerprint: fp('f'),
      members: [{ employeeId: concurrentEmployee, learnerUserId: concurrentUser }],
    });
    const concurrentInput = command({
      tenantId: tenant1,
      trainingId: training1,
      trainingVersionId: version1,
      resolutionId: concurrentResolution,
      fingerprint: fp('f'),
      idempotencyKey: 'mur-concurrent-a',
    });
    const concurrentDb = createDatabase(databaseUrl);
    try {
      await Promise.all([
        persistConfirmedAudienceAssignments(database, concurrentInput),
        persistConfirmedAudienceAssignments(concurrentDb, { ...concurrentInput, idempotencyKey: 'mur-concurrent-b' }),
      ]);
    } finally {
      await concurrentDb.close();
    }
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignments
        where tenant_id = $1 and learner_id = $2 and training_version_id = $3 and status = 'ACTIVE'`,
      [tenant1, concurrentUser, version1],
    ), 1);
    assert.equal(await countRows(
      database.pool,
      `select count(*) from training_assignment_origins where tenant_id = $1 and source_ref_id = $2`,
      [tenant1, concurrentResolution],
    ), 1);

    await expectPgCode(
      database.pool.query(
        `insert into training_audience_resolution_members
           (tenant_id, resolution_id, employee_id, source_audience_ids)
         values ($1, $2, $3, '[]'::jsonb)`,
        [tenant2, resolution1, employeeTenant2],
      ),
      '23503',
    );
    await expectPgCode(
      database.pool.query(
        `insert into training_assignments
           (tenant_id, learner_id, training_id, training_version_id, status, assigned_at)
         values ($1, $2, $3, $4, 'ACTIVE', now())`,
        [tenant2, userTenant2, training1, version1],
      ),
      '23503',
    );

    const lineage = await database.pool.query<{
      assignment_id: string;
      source_ref_id: string;
      source_fingerprint: string;
      resolution_fingerprint: string;
    }>(
      `select o.assignment_id, o.source_ref_id, o.source_fingerprint,
              r.fingerprint as resolution_fingerprint
         from training_assignment_origins o
         join training_audience_resolutions r
           on r.tenant_id = o.tenant_id and r.id::text = o.source_ref_id
        where o.tenant_id = $1 and o.source_ref_id = $2
        order by o.assignment_id`,
      [tenant1, resolution1],
    );
    assert.equal(lineage.rows.length, 2);
    for (const row of lineage.rows) {
      assert.equal(row.source_ref_id, resolution1);
      assert.equal(row.source_fingerprint, fp('a'));
      assert.equal(row.resolution_fingerprint, fp('a'));
    }

    console.log('M1B PostgreSQL qualification: PASS');
  } finally {
    await database.close();
  }
}

await main();
