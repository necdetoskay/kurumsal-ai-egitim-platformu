import { describe, expect, it } from 'vitest';
import {
  EmploymentInvariantError,
  EmploymentLifecycleService,
  type CompanyScopeRecord,
  type CreateEmploymentInput,
  type DepartmentScopeRecord,
  type EmployeeRecord,
  type EmploymentAuditInput,
  type EmploymentRecord,
  type EmploymentRepository,
  type EmploymentTransactionManager,
  type LocationScopeRecord,
  type PositionScopeRecord,
} from './employment.js';

class MemoryEmploymentRepo implements EmploymentRepository {
  employees = new Map<string, EmployeeRecord>();
  employments = new Map<string, EmploymentRecord>();
  companies = new Map<string, CompanyScopeRecord>();
  departments = new Map<string, DepartmentScopeRecord>();
  positions = new Map<string, PositionScopeRecord>();
  locations = new Map<string, LocationScopeRecord>();
  audits: EmploymentAuditInput[] = [];
  nextId = 2;

  async getEmployee(id: string) { return this.employees.get(id) ?? null; }
  async getEmployment(id: string) { return this.employments.get(id) ?? null; }
  async getActivePrimaryEmployment(employeeId: string) {
    return [...this.employments.values()].find((e) => e.employeeId === employeeId && e.isPrimary && e.status === 'ACTIVE' && e.endDate === null) ?? null;
  }
  async getCompany(id: string) { return this.companies.get(id) ?? null; }
  async getDepartment(id: string) { return this.departments.get(id) ?? null; }
  async getPosition(id: string) { return this.positions.get(id) ?? null; }
  async getLocation(id: string) { return this.locations.get(id) ?? null; }
  async closeEmployment(id: string, endDate: string) {
    const current = this.employments.get(id)!;
    this.employments.set(id, { ...current, endDate, status: 'CLOSED' });
  }
  async createEmployment(input: CreateEmploymentInput) {
    const id = `e${this.nextId++}`;
    const created: EmploymentRecord = { ...input, id, endDate: null };
    this.employments.set(id, created);
    return created;
  }
  async updateEmployeeStatus(id: string, status: EmployeeRecord['status']) {
    const current = this.employees.get(id)!;
    this.employees.set(id, { ...current, status });
  }
  async appendEmploymentAudit(event: EmploymentAuditInput) { this.audits.push(event); }
}

class MemoryEmploymentTx implements EmploymentTransactionManager {
  constructor(readonly repo: MemoryEmploymentRepo) {}
  async transaction<T>(work: (repo: EmploymentRepository) => Promise<T>) { return work(this.repo); }
}

function fixture() {
  const repo = new MemoryEmploymentRepo();
  repo.employees.set('emp1', { id: 'emp1', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.companies.set('c1', { id: 'c1', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.companies.set('c2', { id: 'c2', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.companies.set('foreign-company', { id: 'foreign-company', tenantId: 't1', organizationId: 'o2', status: 'ACTIVE' });
  repo.departments.set('d1', { id: 'd1', tenantId: 't1', companyId: 'c1', status: 'ACTIVE' });
  repo.departments.set('d2', { id: 'd2', tenantId: 't1', companyId: 'c2', status: 'ACTIVE' });
  repo.positions.set('p1', { id: 'p1', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.positions.set('p2', { id: 'p2', tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  repo.locations.set('l1', { id: 'l1', tenantId: 't1', organizationId: 'o1', companyId: 'c1', status: 'ACTIVE' });
  repo.locations.set('l2', { id: 'l2', tenantId: 't1', organizationId: 'o1', companyId: 'c2', status: 'ACTIVE' });
  repo.employments.set('e1', {
    id: 'e1', tenantId: 't1', employeeId: 'emp1', companyId: 'c1', departmentId: 'd1', positionId: 'p1', locationId: 'l1',
    managerEmploymentId: null, employmentType: 'FULL_TIME', startDate: '2026-01-01', endDate: null, isPrimary: true, status: 'ACTIVE',
  });
  repo.employments.set('mgr2', {
    id: 'mgr2', tenantId: 't1', employeeId: 'manager2', companyId: 'c2', departmentId: 'd2', positionId: 'p2', locationId: 'l2',
    managerEmploymentId: null, employmentType: 'FULL_TIME', startDate: '2025-01-01', endDate: null, isPrimary: true, status: 'ACTIVE',
  });
  return { repo, service: new EmploymentLifecycleService(new MemoryEmploymentTx(repo)) };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code } satisfies Partial<EmploymentInvariantError>);
}

describe('EmploymentLifecycleService', () => {
  it('transfers employment by closing history and creating a new primary row', async () => {
    const { repo, service } = fixture();
    const created = await service.transferEmployment({
      tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-06-01', companyId: 'c2', departmentId: 'd2', positionId: 'p2', locationId: 'l2', managerEmploymentId: 'mgr2', actorUserId: 'u1', correlationId: 'corr-1',
    });
    expect(repo.employments.get('e1')).toMatchObject({ endDate: '2026-06-01', status: 'CLOSED' });
    expect(created).toMatchObject({ companyId: 'c2', departmentId: 'd2', positionId: 'p2', locationId: 'l2', startDate: '2026-06-01', isPrimary: true, status: 'ACTIVE' });
    expect(repo.audits.at(-1)).toMatchObject({ action: 'EMPLOYMENT_TRANSFERRED', entityId: created.id, correlationId: 'corr-1' });
  });

  it('supports promotion and location-only changes without overwriting old row', async () => {
    const { repo, service } = fixture();
    const promoted = await service.transferEmployment({
      tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-03-01', companyId: 'c1', departmentId: 'd1', positionId: 'p2', locationId: 'l1', managerEmploymentId: null,
    });
    expect(promoted.positionId).toBe('p2');
    expect(repo.employments.get('e1')?.status).toBe('CLOSED');

    // start a fresh fixture for location-only change because one active primary is expected at a time
    const second = fixture();
    second.repo.locations.set('l3', { id: 'l3', tenantId: 't1', organizationId: 'o1', companyId: 'c1', status: 'ACTIVE' });
    const moved = await second.service.transferEmployment({
      tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-04-01', companyId: 'c1', departmentId: 'd1', positionId: 'p1', locationId: 'l3', managerEmploymentId: null,
    });
    expect(moved.locationId).toBe('l3');
    expect(second.repo.employments.get('e1')?.endDate).toBe('2026-04-01');
  });

  it('rejects invalid effective dates and invalid scope references', async () => {
    const { service } = fixture();
    await expectCode(service.transferEmployment({ tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-01-01', companyId: 'c1', departmentId: 'd1', positionId: 'p1', locationId: 'l1', managerEmploymentId: null }), 'INVALID_EFFECTIVE_DATE');
    await expectCode(service.transferEmployment({ tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-05-01', companyId: 'foreign-company', departmentId: null, positionId: 'p1', locationId: null, managerEmploymentId: null }), 'COMPANY_SCOPE_MISMATCH');
    await expectCode(service.transferEmployment({ tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-05-01', companyId: 'c1', departmentId: 'd2', positionId: 'p1', locationId: 'l1', managerEmploymentId: null }), 'DEPARTMENT_SCOPE_MISMATCH');
    await expectCode(service.transferEmployment({ tenantId: 't1', employeeId: 'emp1', effectiveDate: '2026-05-01', companyId: 'c1', departmentId: 'd1', positionId: 'p1', locationId: 'l2', managerEmploymentId: null }), 'LOCATION_COMPANY_SCOPE_MISMATCH');
  });

  it('rejects passivation while an active primary employment exists', async () => {
    const { service } = fixture();
    await expectCode(service.passivateEmployee({ tenantId: 't1', employeeId: 'emp1' }), 'EMPLOYEE_HAS_ACTIVE_PRIMARY_EMPLOYMENT');
  });
});
