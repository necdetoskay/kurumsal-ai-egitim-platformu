import { createHash } from 'node:crypto';

export type TrainingAudienceTargetType = 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT' | 'GROUP' | 'EMPLOYEE';

export interface TrainingAudienceTarget {
  type: TrainingAudienceTargetType;
  id: string;
}

export interface AudienceCandidate {
  employeeId: string;
  tenantId: string;
  organizationId: string;
  learnerUserId: string | null;
}

export interface AudienceTargetScope {
  tenantId: string;
  organizationId: string;
  active: boolean;
}

export interface ResolvedAudienceMember {
  employeeId: string;
  learnerUserId: string | null;
  sourceTargets: string[];
}

export interface AudienceResolutionPreview {
  fingerprint: string;
  targetCount: number;
  expandedCandidateCount: number;
  overlapCount: number;
  uniqueEmployeeCount: number;
  assignableLearnerCount: number;
  unlinkedEmployeeIds: string[];
  members: ResolvedAudienceMember[];
}

export interface TrainingAudienceRepository {
  getTargetScope(target: TrainingAudienceTarget): Promise<AudienceTargetScope | null>;
  listActiveEmployeesForOrganization(organizationId: string): Promise<AudienceCandidate[]>;
  listActiveEmployeesForCompany(companyId: string): Promise<AudienceCandidate[]>;
  listActiveEmployeesForDepartment(departmentId: string): Promise<AudienceCandidate[]>;
  listActiveEmployeesForGroup(groupId: string): Promise<AudienceCandidate[]>;
  getActiveEmployee(employeeId: string): Promise<AudienceCandidate | null>;
}

export class TrainingAudienceInvariantError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'TrainingAudienceInvariantError';
  }
}

function targetKey(target: TrainingAudienceTarget): string {
  return `${target.type}:${target.id}`;
}

function stableFingerprint(targets: TrainingAudienceTarget[], members: ResolvedAudienceMember[]): string {
  const payload = JSON.stringify({
    targets: [...targets].map(targetKey).sort(),
    members: members.map((member) => ({
      employeeId: member.employeeId,
      learnerUserId: member.learnerUserId,
      sourceTargets: [...member.sourceTargets].sort(),
    })),
  });
  return createHash('sha256').update(payload).digest('hex');
}

export class TrainingAudienceResolver {
  constructor(private readonly repo: TrainingAudienceRepository) {}

  async preview(input: {
    tenantId: string;
    organizationId: string;
    targets: TrainingAudienceTarget[];
  }): Promise<AudienceResolutionPreview> {
    if (input.targets.length === 0) {
      return {
        fingerprint: stableFingerprint([], []),
        targetCount: 0,
        expandedCandidateCount: 0,
        overlapCount: 0,
        uniqueEmployeeCount: 0,
        assignableLearnerCount: 0,
        unlinkedEmployeeIds: [],
        members: [],
      };
    }

    const byEmployee = new Map<string, ResolvedAudienceMember>();
    let expandedCandidateCount = 0;

    for (const target of [...input.targets].sort((a, b) => targetKey(a).localeCompare(targetKey(b)))) {
      const scope = await this.repo.getTargetScope(target);
      if (!scope) throw new TrainingAudienceInvariantError('AUDIENCE_TARGET_NOT_FOUND', 'Audience target not found.');
      if (scope.tenantId !== input.tenantId) {
        throw new TrainingAudienceInvariantError('CROSS_TENANT_REFERENCE', 'Audience target belongs to another tenant.');
      }
      if (scope.organizationId !== input.organizationId) {
        throw new TrainingAudienceInvariantError('CROSS_ORGANIZATION_REFERENCE', 'Audience target belongs to another organization.');
      }
      if (!scope.active) {
        throw new TrainingAudienceInvariantError('AUDIENCE_TARGET_NOT_ACTIVE', 'Audience target is not active.');
      }

      const candidates = await this.resolveTarget(target);
      expandedCandidateCount += candidates.length;
      for (const candidate of candidates) {
        if (candidate.tenantId !== input.tenantId) {
          throw new TrainingAudienceInvariantError('CROSS_TENANT_REFERENCE', 'Resolved employee belongs to another tenant.');
        }
        if (candidate.organizationId !== input.organizationId) {
          throw new TrainingAudienceInvariantError('CROSS_ORGANIZATION_REFERENCE', 'Resolved employee belongs to another organization.');
        }
        const source = targetKey(target);
        const existing = byEmployee.get(candidate.employeeId);
        if (existing) {
          if (!existing.sourceTargets.includes(source)) existing.sourceTargets.push(source);
          if (existing.learnerUserId === null && candidate.learnerUserId !== null) existing.learnerUserId = candidate.learnerUserId;
        } else {
          byEmployee.set(candidate.employeeId, {
            employeeId: candidate.employeeId,
            learnerUserId: candidate.learnerUserId,
            sourceTargets: [source],
          });
        }
      }
    }

    const members = [...byEmployee.values()]
      .map((member) => ({ ...member, sourceTargets: [...member.sourceTargets].sort() }))
      .sort((a, b) => a.employeeId.localeCompare(b.employeeId));
    const unlinkedEmployeeIds = members.filter((member) => member.learnerUserId === null).map((member) => member.employeeId);

    return {
      fingerprint: stableFingerprint(input.targets, members),
      targetCount: input.targets.length,
      expandedCandidateCount,
      overlapCount: Math.max(0, expandedCandidateCount - members.length),
      uniqueEmployeeCount: members.length,
      assignableLearnerCount: members.length - unlinkedEmployeeIds.length,
      unlinkedEmployeeIds,
      members,
    };
  }

  private async resolveTarget(target: TrainingAudienceTarget): Promise<AudienceCandidate[]> {
    switch (target.type) {
      case 'ORGANIZATION': return this.repo.listActiveEmployeesForOrganization(target.id);
      case 'COMPANY': return this.repo.listActiveEmployeesForCompany(target.id);
      case 'DEPARTMENT': return this.repo.listActiveEmployeesForDepartment(target.id);
      case 'GROUP': return this.repo.listActiveEmployeesForGroup(target.id);
      case 'EMPLOYEE': {
        const employee = await this.repo.getActiveEmployee(target.id);
        return employee ? [employee] : [];
      }
    }
  }
}
