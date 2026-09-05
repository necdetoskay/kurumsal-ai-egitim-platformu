import { describe, expect, it } from 'vitest';
import {
  OrganizationInvariantError,
  OrganizationLifecycleService,
  type AuditEventInput,
  type CompanyRecord,
  type DepartmentRecord,
  type OrganizationRecord,
  type OrganizationRepository,
  type TransactionManager,
} from './index.js';

class MemoryRepo implements OrganizationRepository {
  organizations = new Map<string, OrganizationRecord>();
  companies = new Map<string, CompanyRecord>();
  departments = new Map<string, DepartmentRecord>();
  audits: AuditEventInput[] = [];

  async getOrganization(id: string) { return this.organizations.get(id) ?? null; }
  async getCompany(id: string) { return this.companies.get(id) ?? null; }
  async getDepartment(id: string) { return this.departments.get(id) ?? null; }
  async listDepartmentsByCompany(companyId: string) { return [...this.departments.values()].filter((d) => d.companyId === companyId); }
  async countActiveCompanies(organizationId: string) { return [...this.companies.values()].filter((c) => c.organizationId === organizationId && c.status === 'ACTIVE').length; }
  async countActiveDepartments(companyId: string) { return [...this.departments.values()].filter((d) => d.companyId === companyId && d.status === 'ACTIVE').length; }
  async updateOrganizationStatus(id: string, status: 'ACTIVE' | 'PASSIVE') { this.organizations.set(id, { ...this.organizations.get(id)!, status }); }
  async updateCompanyStatus(id: string, status: 'ACTIVE' | 'PASSIVE') { this.companies.set(id, { ...this.companies.get(id)!, status }); }
  async updateDepartment(input: { id: string; parentDepartmentId?: string | null; status?: 'ACTIVE' | 'PASSIVE' }) {
    const current = this.departments.get(input.id)!;
    this.departments.set(input.id, { ...current, ...input });
  }
  async appendAudit(event: AuditEventInput) { this.audits.push(event); }
}

class MemoryTx implements TransactionManager {
  constructor(readonly repo: MemoryRepo) {}
  async transaction<T>(work: (repo: OrganizationRepository) => Promise<T>) { return work(this.repo); }
}

function fixture() {
  const repo = new MemoryRepo();
  repo.organizations.set('o1', { id: 'o1', tenantId: 't1', status: 'ACTIVE' });
  repo.companies.set('c1', { id: 'c1', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.companies.set('c2', { id: 'c2', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.departments.set('root', { id: 'root', tenantId: 't1', companyId: 'c1', parentDepartmentId: null, status: 'ACTIVE' });
  repo.departments.set('child', { id: 'child', tenantId: 't1', companyId: 'c1', parentDepartmentId: 'root', status: 'ACTIVE' });
  repo.departments.set('grandchild', { id: 'grandchild', tenantId: 't1', companyId: 'c1', parentDepartmentId: 'child', status: 'ACTIVE' });
  repo.departments.set('foreign', { id: 'foreign', tenantId: 't1', companyId: 'c2', parentDepartmentId: null, status: 'ACTIVE' });
  return { repo, service: new OrganizationLifecycleService(new MemoryTx(repo)) };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code } as Partial<OrganizationInvariantError>);
}

describe('OrganizationLifecycleService', () => {
  it('rejects a cross-company parent move', async () => {
    const { service } = fixture();
    await expectCode(service.moveDepartment({ tenantId: 't1', departmentId: 'child', newParentDepartmentId: 'foreign' }), 'DEPARTMENT_CROSS_COMPANY_PARENT');
  });

  it('rejects self and descendant moves', async () => {
    const { service } = fixture();
    await expectCode(service.moveDepartment({ tenantId: 't1', departmentId: 'child', newParentDepartmentId: 'child' }), 'DEPARTMENT_SELF_PARENT');
    await expectCode(service.moveDepartment({ tenantId: 't1', departmentId: 'root', newParentDepartmentId: 'grandchild' }), 'DEPARTMENT_CYCLE');
  });

  it('moves a department atomically and emits audit evidence', async () => {
    const { repo, service } = fixture();
    await service.moveDepartment({ tenantId: 't1', departmentId: 'grandchild', newParentDepartmentId: 'root', actorUserId: 'u1', correlationId: 'corr-1' });
    expect(repo.departments.get('grandchild')?.parentDepartmentId).toBe('root');
    expect(repo.audits.at(-1)).toMatchObject({ action: 'DEPARTMENT_MOVED', entityId: 'grandchild', correlationId: 'corr-1' });
  });

  it('guards passivation while active dependents exist', async () => {
    const { service } = fixture();
    await expectCode(service.passivateOrganization({ tenantId: 't1', organizationId: 'o1' }), 'ORGANIZATION_HAS_ACTIVE_COMPANIES');
    await expectCode(service.passivateCompany({ tenantId: 't1', companyId: 'c1' }), 'COMPANY_HAS_ACTIVE_DEPARTMENTS');
    await expectCode(service.passivateDepartment({ tenantId: 't1', departmentId: 'root' }), 'DEPARTMENT_HAS_ACTIVE_CHILDREN');
  });

  it('passivates a leaf department and emits audit evidence', async () => {
    const { repo, service } = fixture();
    await service.passivateDepartment({ tenantId: 't1', departmentId: 'grandchild', actorUserId: 'u1' });
    expect(repo.departments.get('grandchild')?.status).toBe('PASSIVE');
    expect(repo.audits.at(-1)).toMatchObject({ action: 'DEPARTMENT_PASSIVATED', entityId: 'grandchild' });
  });
});
