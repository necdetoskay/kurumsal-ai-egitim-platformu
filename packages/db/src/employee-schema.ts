import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { tenants } from './schema.js';
import { companies, departments, locations, organizations, positions } from './organization-schema.js';

export const employeeStatus = pgEnum('employee_status', ['ACTIVE', 'PASSIVE', 'TERMINATED']);
export const employmentStatus = pgEnum('employment_status', ['ACTIVE', 'CLOSED']);
export const employmentType = pgEnum('employment_type', [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACTOR',
  'INTERN',
  'OTHER',
]);

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id').notNull(),
    employeeNo: varchar('employee_no', { length: 80 }),
    firstName: varchar('first_name', { length: 120 }).notNull(),
    lastName: varchar('last_name', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }),
    phone: varchar('phone', { length: 50 }),
    birthDate: date('birth_date'),
    hireDate: date('hire_date'),
    terminationDate: date('termination_date'),
    status: employeeStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    organizationScopeFk: foreignKey({
      name: 'employees_tenant_organization_fk',
      columns: [table.tenantId, table.organizationId],
      foreignColumns: [organizations.tenantId, organizations.id],
    }).onDelete('restrict'),
    tenantIdIdUq: unique('employees_tenant_id_id_uq').on(table.tenantId, table.id),
    tenantOrgIdUq: unique('employees_tenant_org_id_uq').on(table.tenantId, table.organizationId, table.id),
    employeeNoUq: uniqueIndex('employees_tenant_org_employee_no_uq')
      .on(table.tenantId, table.organizationId, table.employeeNo)
      .where(sql`${table.employeeNo} is not null`),
    tenantOrgStatusIdx: index('employees_tenant_org_status_idx').on(
      table.tenantId,
      table.organizationId,
      table.status,
    ),
    employeeNoIdx: index('employees_tenant_org_employee_no_idx').on(
      table.tenantId,
      table.organizationId,
      table.employeeNo,
    ),
    nameIdx: index('employees_tenant_name_idx').on(
      table.tenantId,
      sql`lower(${table.lastName})`,
      sql`lower(${table.firstName})`,
    ),
    emailIdx: index('employees_tenant_email_idx')
      .on(table.tenantId, sql`lower(${table.email})`)
      .where(sql`${table.email} is not null`),
  }),
);

export const employments = pgTable(
  'employments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    employeeId: uuid('employee_id').notNull(),
    companyId: uuid('company_id').notNull(),
    departmentId: uuid('department_id'),
    positionId: uuid('position_id'),
    locationId: uuid('location_id'),
    managerEmploymentId: uuid('manager_employment_id'),
    employmentType: employmentType('employment_type').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isPrimary: boolean('is_primary').default(true).notNull(),
    status: employmentStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    employeeScopeFk: foreignKey({
      name: 'employments_tenant_employee_fk',
      columns: [table.tenantId, table.employeeId],
      foreignColumns: [employees.tenantId, employees.id],
    }).onDelete('restrict'),
    companyScopeFk: foreignKey({
      name: 'employments_tenant_company_fk',
      columns: [table.tenantId, table.companyId],
      foreignColumns: [companies.tenantId, companies.id],
    }).onDelete('restrict'),
    departmentScopeFk: foreignKey({
      name: 'employments_department_same_company_fk',
      columns: [table.tenantId, table.companyId, table.departmentId],
      foreignColumns: [departments.tenantId, departments.companyId, departments.id],
    }).onDelete('restrict'),
    positionScopeFk: foreignKey({
      name: 'employments_tenant_position_fk',
      columns: [table.tenantId, table.positionId],
      foreignColumns: [positions.tenantId, positions.id],
    }).onDelete('restrict'),
    locationScopeFk: foreignKey({
      name: 'employments_tenant_location_fk',
      columns: [table.tenantId, table.locationId],
      foreignColumns: [locations.tenantId, locations.id],
    }).onDelete('restrict'),
    managerScopeFk: foreignKey({
      name: 'employments_tenant_manager_employment_fk',
      columns: [table.tenantId, table.managerEmploymentId],
      foreignColumns: [table.tenantId, table.id],
    }).onDelete('restrict'),
    tenantIdIdUq: unique('employments_tenant_id_id_uq').on(table.tenantId, table.id),
    validDateRange: check(
      'employments_valid_date_range_ck',
      sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
    managerNotSelf: check(
      'employments_manager_not_self_ck',
      sql`${table.managerEmploymentId} is null or ${table.managerEmploymentId} <> ${table.id}`,
    ),
    activePrimaryUq: uniqueIndex('employments_active_primary_uq')
      .on(table.tenantId, table.employeeId)
      .where(sql`${table.isPrimary} = true and ${table.endDate} is null`),
    employeeHistoryIdx: index('employments_employee_history_idx').on(
      table.tenantId,
      table.employeeId,
      table.startDate,
    ),
    companyDepartmentCurrentIdx: index('employments_company_department_current_idx').on(
      table.tenantId,
      table.companyId,
      table.departmentId,
      table.endDate,
    ),
    positionCurrentIdx: index('employments_position_current_idx').on(
      table.tenantId,
      table.positionId,
      table.endDate,
    ),
    locationCurrentIdx: index('employments_location_current_idx').on(
      table.tenantId,
      table.locationId,
      table.endDate,
    ),
    managerCurrentIdx: index('employments_manager_current_idx').on(
      table.tenantId,
      table.managerEmploymentId,
      table.endDate,
    ),
  }),
);
