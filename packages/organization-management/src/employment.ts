export type EmployeeStatus = 'ACTIVE' | 'PASSIVE' | 'TERMINATED';
export type EmploymentStatus = 'ACTIVE' | 'CLOSED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN' | 'OTHER';

export interface EmployeeRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  status: EmployeeStatus;
}

export interface EmploymentRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  companyId: string;
  departmentId: string | null;
  positionId: string | null;
  locationId: string | null;
  managerEmploymentId: string | null;
  employmentType: EmploymentType;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  status: EmploymentStatus;
}

export interface CompanyScopeRecord { id: string; tenantId: string; organizationId: string; status: 'ACTIVE' | 'PASSIVE'; }
export interface DepartmentScopeRecord { id: string; tenantId: string; companyId: string; status: 'ACTIVE' | 'PASSIVE'; }
export interface PositionScopeRecord { id: string; tenantId: string; organizationId: string; status: 'ACTIVE' | 'PASSIVE'; }
export interface LocationScopeRecord { id: string; tenantId: string; organizationId: string; companyId: string | null; status: 'ACTIVE' | 'PASSIVE'; }

export interface EmploymentAuditInput {
  tenantId: string;
  actorUserId?: string | null;
  action: 'EMPLOYEE_PASSIVATED' | 'EMPLOYMENT_TRANSFERRED';
  entityType: 'EMPLOYEE' | 'EMPLOYMENT';
  entityId: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string | null;
}

export interface CreateEmploymentInput {
  tenantId: string;
  employeeId: string;
  companyId: string;
  departmentId: string | null;
  positionId: string | null;
  locationId: string | null;
  managerEmploymentId: string | null;
  employmentType: EmploymentType;
  startDate: string;
  isPrimary: boolean;
  status: 'ACTIVE';
}

export interface EmploymentRepository {
  getEmployee(id: string): Promise<EmployeeRecord | null>;
  getEmployment(id: string): Promise<EmploymentRecord | null>;
  getActivePrimaryEmployment(employeeId: string): Promise<EmploymentRecord | null>;
  getCompany(id: string): Promise<CompanyScopeRecord | null>;
  getDepartment(id: string): Promise<DepartmentScopeRecord | null>;
  getPosition(id: string): Promise<PositionScopeRecord | null>;
  getLocation(id: string): Promise<LocationScopeRecord | null>;
  closeEmployment(id: string, endDate: string): Promise<void>;
  createEmployment(input: CreateEmploymentInput): Promise<EmploymentRecord>;
  updateEmployeeStatus(id: string, status: EmployeeStatus): Promise<void>;
  appendEmploymentAudit(event: EmploymentAuditInput): Promise<void>;
}

export interface EmploymentTransactionManager {
  transaction<T>(work: (repo: EmploymentRepository) => Promise<T>): Promise<T>;
}

export class EmploymentInvariantError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'EmploymentInvariantError';
  }
}

function requireValue<T>(value: T | null, code: string, message: string): T {
  if (!value) throw new EmploymentInvariantError(code, message);
  return value;
}

function ensureTenant(tenantId: string, actualTenantId: string) {
  if (tenantId !== actualTenantId) throw new EmploymentInvariantError('TENANT_SCOPE_MISMATCH', 'Entity belongs to another tenant.');
}

function compareDate(a: string, b: string) { return a.localeCompare(b); }

function optionalAudit(
  base: Omit<EmploymentAuditInput, 'actorUserId' | 'correlationId'>,
  actorUserId?: string,
  correlationId?: string,
): EmploymentAuditInput {
  return {
    ...base,
    ...(actorUserId !== undefined ? { actorUserId } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };
}

export class EmploymentLifecycleService {
  constructor(private readonly tx: EmploymentTransactionManager) {}

  async passivateEmployee(input: { tenantId: string; employeeId: string; actorUserId?: string; correlationId?: string }) {
    return this.tx.transaction(async (repo) => {
      const employee = requireValue(await repo.getEmployee(input.employeeId), 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      ensureTenant(input.tenantId, employee.tenantId);
      if (employee.status !== 'ACTIVE') return;
      const active = await repo.getActivePrimaryEmployment(employee.id);
      if (active) throw new EmploymentInvariantError('EMPLOYEE_HAS_ACTIVE_PRIMARY_EMPLOYMENT', 'Employee has an active primary employment.');
      await repo.updateEmployeeStatus(employee.id, 'PASSIVE');
      await repo.appendEmploymentAudit(optionalAudit({
        tenantId: input.tenantId,
        action: 'EMPLOYEE_PASSIVATED',
        entityType: 'EMPLOYEE',
        entityId: employee.id,
        before: { status: employee.status },
        after: { status: 'PASSIVE' },
      }, input.actorUserId, input.correlationId));
    });
  }

  async transferEmployment(input: {
    tenantId: string;
    employeeId: string;
    effectiveDate: string;
    companyId: string;
    departmentId: string | null;
    positionId: string | null;
    locationId: string | null;
    managerEmploymentId: string | null;
    employmentType?: EmploymentType;
    actorUserId?: string;
    correlationId?: string;
  }): Promise<EmploymentRecord> {
    return this.tx.transaction(async (repo) => {
      const employee = requireValue(await repo.getEmployee(input.employeeId), 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      ensureTenant(input.tenantId, employee.tenantId);
      if (employee.status !== 'ACTIVE') throw new EmploymentInvariantError('EMPLOYEE_NOT_ACTIVE', 'Employee must be active for assignment change.');

      const current = requireValue(
        await repo.getActivePrimaryEmployment(employee.id),
        'ACTIVE_PRIMARY_EMPLOYMENT_NOT_FOUND',
        'Employee has no active primary employment.',
      );
      ensureTenant(input.tenantId, current.tenantId);
      if (!current.isPrimary || current.status !== 'ACTIVE' || current.endDate !== null) {
        throw new EmploymentInvariantError('INVALID_ACTIVE_PRIMARY_EMPLOYMENT', 'Current employment is not a valid active primary assignment.');
      }
      if (compareDate(input.effectiveDate, current.startDate) <= 0) {
        throw new EmploymentInvariantError('INVALID_EFFECTIVE_DATE', 'Effective date must be after current employment start date.');
      }

      const company = requireValue(await repo.getCompany(input.companyId), 'COMPANY_NOT_FOUND', 'Company not found.');
      ensureTenant(input.tenantId, company.tenantId);
      if (company.organizationId !== employee.organizationId || company.status !== 'ACTIVE') {
        throw new EmploymentInvariantError('COMPANY_SCOPE_MISMATCH', 'Company is outside employee organization or inactive.');
      }

      if (input.departmentId) {
        const department = requireValue(await repo.getDepartment(input.departmentId), 'DEPARTMENT_NOT_FOUND', 'Department not found.');
        ensureTenant(input.tenantId, department.tenantId);
        if (department.companyId !== company.id || department.status !== 'ACTIVE') {
          throw new EmploymentInvariantError('DEPARTMENT_SCOPE_MISMATCH', 'Department is outside selected company or inactive.');
        }
      }

      if (input.positionId) {
        const position = requireValue(await repo.getPosition(input.positionId), 'POSITION_NOT_FOUND', 'Position not found.');
        ensureTenant(input.tenantId, position.tenantId);
        if (position.organizationId !== employee.organizationId || position.status !== 'ACTIVE') {
          throw new EmploymentInvariantError('POSITION_SCOPE_MISMATCH', 'Position is outside employee organization or inactive.');
        }
      }

      if (input.locationId) {
        const location = requireValue(await repo.getLocation(input.locationId), 'LOCATION_NOT_FOUND', 'Location not found.');
        ensureTenant(input.tenantId, location.tenantId);
        if (location.organizationId !== employee.organizationId || location.status !== 'ACTIVE') {
          throw new EmploymentInvariantError('LOCATION_SCOPE_MISMATCH', 'Location is outside employee organization or inactive.');
        }
        if (location.companyId !== null && location.companyId !== company.id) {
          throw new EmploymentInvariantError('LOCATION_COMPANY_SCOPE_MISMATCH', 'Location is bound to another company.');
        }
      }

      if (input.managerEmploymentId) {
        if (input.managerEmploymentId === current.id) {
          throw new EmploymentInvariantError('MANAGER_SELF_REFERENCE', 'Employee cannot reference current employment as manager.');
        }
        const manager = requireValue(await repo.getEmployment(input.managerEmploymentId), 'MANAGER_EMPLOYMENT_NOT_FOUND', 'Manager employment not found.');
        ensureTenant(input.tenantId, manager.tenantId);
        if (manager.status !== 'ACTIVE' || manager.endDate !== null || manager.companyId !== company.id) {
          throw new EmploymentInvariantError('MANAGER_SCOPE_MISMATCH', 'Manager must have an active employment in selected company.');
        }
      }

      const previousSummary = {
        employmentId: current.id,
        companyId: current.companyId,
        departmentId: current.departmentId,
        positionId: current.positionId,
        locationId: current.locationId,
        managerEmploymentId: current.managerEmploymentId,
        startDate: current.startDate,
      };

      await repo.closeEmployment(current.id, input.effectiveDate);
      const created = await repo.createEmployment({
        tenantId: input.tenantId,
        employeeId: employee.id,
        companyId: company.id,
        departmentId: input.departmentId,
        positionId: input.positionId,
        locationId: input.locationId,
        managerEmploymentId: input.managerEmploymentId,
        employmentType: input.employmentType ?? current.employmentType,
        startDate: input.effectiveDate,
        isPrimary: true,
        status: 'ACTIVE',
      });

      await repo.appendEmploymentAudit(optionalAudit({
        tenantId: input.tenantId,
        action: 'EMPLOYMENT_TRANSFERRED',
        entityType: 'EMPLOYMENT',
        entityId: created.id,
        before: previousSummary,
        after: {
          employmentId: created.id,
          companyId: created.companyId,
          departmentId: created.departmentId,
          positionId: created.positionId,
          locationId: created.locationId,
          managerEmploymentId: created.managerEmploymentId,
          startDate: created.startDate,
        },
      }, input.actorUserId, input.correlationId));

      return created;
    });
  }
}
