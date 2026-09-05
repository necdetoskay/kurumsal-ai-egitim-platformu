export type LifecycleStatus = 'ACTIVE' | 'PASSIVE';

export interface DepartmentRecord {
  id: string;
  tenantId: string;
  companyId: string;
  parentDepartmentId: string | null;
  status: LifecycleStatus;
}

export interface CompanyRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  status: LifecycleStatus;
}

export interface OrganizationRecord {
  id: string;
  tenantId: string;
  status: LifecycleStatus;
}

export interface AuditEventInput {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT';
  entityId: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string | null;
}

export interface OrganizationRepository {
  getOrganization(id: string): Promise<OrganizationRecord | null>;
  getCompany(id: string): Promise<CompanyRecord | null>;
  getDepartment(id: string): Promise<DepartmentRecord | null>;
  listDepartmentsByCompany(companyId: string): Promise<DepartmentRecord[]>;
  countActiveCompanies(organizationId: string): Promise<number>;
  countActiveDepartments(companyId: string): Promise<number>;
  updateOrganizationStatus(id: string, status: LifecycleStatus): Promise<void>;
  updateCompanyStatus(id: string, status: LifecycleStatus): Promise<void>;
  updateDepartment(input: { id: string; parentDepartmentId?: string | null; status?: LifecycleStatus }): Promise<void>;
  appendAudit(event: AuditEventInput): Promise<void>;
}

export interface TransactionManager {
  transaction<T>(work: (repo: OrganizationRepository) => Promise<T>): Promise<T>;
}

export class OrganizationInvariantError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'OrganizationInvariantError';
  }
}

function requireRecord<T>(value: T | null, code: string, message: string): T {
  if (!value) throw new OrganizationInvariantError(code, message);
  return value;
}

function ensureSameTenant(expectedTenantId: string, actualTenantId: string) {
  if (expectedTenantId !== actualTenantId) {
    throw new OrganizationInvariantError('TENANT_SCOPE_MISMATCH', 'Entity belongs to a different tenant.');
  }
}

function withOptionalAuditFields(
  base: Omit<AuditEventInput, 'actorUserId' | 'correlationId'>,
  actorUserId?: string,
  correlationId?: string,
): AuditEventInput {
  return {
    ...base,
    ...(actorUserId !== undefined ? { actorUserId } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };
}

export class OrganizationLifecycleService {
  constructor(private readonly tx: TransactionManager) {}

  async passivateOrganization(input: { tenantId: string; organizationId: string; actorUserId?: string; correlationId?: string }) {
    return this.tx.transaction(async (repo) => {
      const organization = requireRecord(await repo.getOrganization(input.organizationId), 'ORGANIZATION_NOT_FOUND', 'Organization not found.');
      ensureSameTenant(input.tenantId, organization.tenantId);
      if (organization.status === 'PASSIVE') return;
      if ((await repo.countActiveCompanies(organization.id)) > 0) throw new OrganizationInvariantError('ORGANIZATION_HAS_ACTIVE_COMPANIES', 'Organization has active companies.');
      await repo.updateOrganizationStatus(organization.id, 'PASSIVE');
      await repo.appendAudit(withOptionalAuditFields({ tenantId: input.tenantId, action: 'ORGANIZATION_PASSIVATED', entityType: 'ORGANIZATION', entityId: organization.id, before: { status: organization.status }, after: { status: 'PASSIVE' } }, input.actorUserId, input.correlationId));
    });
  }

  async passivateCompany(input: { tenantId: string; companyId: string; actorUserId?: string; correlationId?: string }) {
    return this.tx.transaction(async (repo) => {
      const company = requireRecord(await repo.getCompany(input.companyId), 'COMPANY_NOT_FOUND', 'Company not found.');
      ensureSameTenant(input.tenantId, company.tenantId);
      if (company.status === 'PASSIVE') return;
      if ((await repo.countActiveDepartments(company.id)) > 0) throw new OrganizationInvariantError('COMPANY_HAS_ACTIVE_DEPARTMENTS', 'Company has active departments.');
      await repo.updateCompanyStatus(company.id, 'PASSIVE');
      await repo.appendAudit(withOptionalAuditFields({ tenantId: input.tenantId, action: 'COMPANY_PASSIVATED', entityType: 'COMPANY', entityId: company.id, before: { status: company.status }, after: { status: 'PASSIVE' } }, input.actorUserId, input.correlationId));
    });
  }

  async moveDepartment(input: { tenantId: string; departmentId: string; newParentDepartmentId: string | null; actorUserId?: string; correlationId?: string }) {
    return this.tx.transaction(async (repo) => {
      const department = requireRecord(await repo.getDepartment(input.departmentId), 'DEPARTMENT_NOT_FOUND', 'Department not found.');
      ensureSameTenant(input.tenantId, department.tenantId);
      if (input.newParentDepartmentId === department.id) throw new OrganizationInvariantError('DEPARTMENT_SELF_PARENT', 'Department cannot be its own parent.');
      if (input.newParentDepartmentId) {
        const parent = requireRecord(await repo.getDepartment(input.newParentDepartmentId), 'PARENT_DEPARTMENT_NOT_FOUND', 'Parent department not found.');
        ensureSameTenant(input.tenantId, parent.tenantId);
        if (parent.companyId !== department.companyId) throw new OrganizationInvariantError('DEPARTMENT_CROSS_COMPANY_PARENT', 'Parent department must belong to the same company.');
        const departments = await repo.listDepartmentsByCompany(department.companyId);
        const parentById = new Map(departments.map((item) => [item.id, item.parentDepartmentId]));
        let cursor: string | null = parent.id;
        const visited = new Set<string>();
        while (cursor) {
          if (cursor === department.id) throw new OrganizationInvariantError('DEPARTMENT_CYCLE', 'Department move would create a hierarchy cycle.');
          if (visited.has(cursor)) throw new OrganizationInvariantError('DEPARTMENT_EXISTING_CYCLE', 'Existing department hierarchy contains a cycle.');
          visited.add(cursor);
          cursor = parentById.get(cursor) ?? null;
        }
      }
      if (department.parentDepartmentId === input.newParentDepartmentId) return;
      await repo.updateDepartment({ id: department.id, parentDepartmentId: input.newParentDepartmentId });
      await repo.appendAudit(withOptionalAuditFields({ tenantId: input.tenantId, action: 'DEPARTMENT_MOVED', entityType: 'DEPARTMENT', entityId: department.id, before: { parentDepartmentId: department.parentDepartmentId }, after: { parentDepartmentId: input.newParentDepartmentId } }, input.actorUserId, input.correlationId));
    });
  }

  async passivateDepartment(input: { tenantId: string; departmentId: string; actorUserId?: string; correlationId?: string }) {
    return this.tx.transaction(async (repo) => {
      const department = requireRecord(await repo.getDepartment(input.departmentId), 'DEPARTMENT_NOT_FOUND', 'Department not found.');
      ensureSameTenant(input.tenantId, department.tenantId);
      if (department.status === 'PASSIVE') return;
      const descendants = (await repo.listDepartmentsByCompany(department.companyId)).filter((item) => item.parentDepartmentId === department.id && item.status === 'ACTIVE');
      if (descendants.length > 0) throw new OrganizationInvariantError('DEPARTMENT_HAS_ACTIVE_CHILDREN', 'Department has active child departments.');
      await repo.updateDepartment({ id: department.id, status: 'PASSIVE' });
      await repo.appendAudit(withOptionalAuditFields({ tenantId: input.tenantId, action: 'DEPARTMENT_PASSIVATED', entityType: 'DEPARTMENT', entityId: department.id, before: { status: department.status }, after: { status: 'PASSIVE' } }, input.actorUserId, input.correlationId));
    });
  }
}

export * from './employment.js';
export * from './group-membership.js';
export * from './integrations.js';
