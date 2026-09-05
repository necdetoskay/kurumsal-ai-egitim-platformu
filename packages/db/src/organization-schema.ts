import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { tenants } from './schema.js';

export const organizationLifecycleStatus = pgEnum('organization_lifecycle_status', ['ACTIVE', 'PASSIVE']);

export const locationType = pgEnum('organization_location_type', [
  'OFFICE',
  'SITE',
  'WAREHOUSE',
  'FACTORY',
  'REGION',
  'OTHER',
]);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 200 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    sector: varchar('sector', { length: 120 }),
    defaultLocale: varchar('default_locale', { length: 20 }).notNull(),
    timezone: varchar('timezone', { length: 64 }).notNull(),
    status: organizationLifecycleStatus('status').default('ACTIVE').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantCodeUq: uniqueIndex('organizations_tenant_code_uq').on(table.tenantId, table.code),
    tenantIdIdUq: uniqueIndex('organizations_tenant_id_id_uq').on(table.tenantId, table.id),
    tenantStatusIdx: index('organizations_tenant_status_idx').on(table.tenantId, table.status),
    tenantNameIdx: index('organizations_tenant_name_idx').on(table.tenantId, sql`lower(${table.name})`),
  }),
);

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    legalName: varchar('legal_name', { length: 250 }),
    code: varchar('code', { length: 50 }).notNull(),
    taxNumber: varchar('tax_number', { length: 50 }),
    email: varchar('email', { length: 254 }),
    phone: varchar('phone', { length: 50 }),
    website: varchar('website', { length: 255 }),
    status: organizationLifecycleStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    organizationScopeFk: foreignKey({
      name: 'companies_tenant_organization_fk',
      columns: [table.tenantId, table.organizationId],
      foreignColumns: [organizations.tenantId, organizations.id],
    }).onDelete('restrict'),
    tenantOrgCodeUq: uniqueIndex('companies_tenant_org_code_uq').on(
      table.tenantId,
      table.organizationId,
      table.code,
    ),
    tenantOrgIdUq: uniqueIndex('companies_tenant_org_id_uq').on(
      table.tenantId,
      table.organizationId,
      table.id,
    ),
    tenantIdIdUq: uniqueIndex('companies_tenant_id_id_uq').on(table.tenantId, table.id),
    tenantOrgStatusIdx: index('companies_tenant_org_status_idx').on(
      table.tenantId,
      table.organizationId,
      table.status,
    ),
    tenantNameIdx: index('companies_tenant_name_idx').on(table.tenantId, sql`lower(${table.name})`),
  }),
);

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    companyId: uuid('company_id').notNull(),
    parentDepartmentId: uuid('parent_department_id'),
    name: varchar('name', { length: 200 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').default(0).notNull(),
    status: organizationLifecycleStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyScopeFk: foreignKey({
      name: 'departments_tenant_company_fk',
      columns: [table.tenantId, table.companyId],
      foreignColumns: [companies.tenantId, companies.id],
    }).onDelete('restrict'),
    parentScopeFk: foreignKey({
      name: 'departments_parent_same_company_fk',
      columns: [table.tenantId, table.companyId, table.parentDepartmentId],
      foreignColumns: [table.tenantId, table.companyId, table.id],
    }).onDelete('restrict'),
    tenantCompanyCodeUq: uniqueIndex('departments_tenant_company_code_uq').on(
      table.tenantId,
      table.companyId,
      table.code,
    ),
    tenantCompanyIdUq: uniqueIndex('departments_tenant_company_id_uq').on(
      table.tenantId,
      table.companyId,
      table.id,
    ),
    parentNotSelf: check('departments_parent_not_self_ck', sql`${table.parentDepartmentId} is null or ${table.parentDepartmentId} <> ${table.id}`),
    hierarchyIdx: index('departments_hierarchy_idx').on(
      table.tenantId,
      table.companyId,
      table.parentDepartmentId,
    ),
    tenantCompanyStatusIdx: index('departments_tenant_company_status_idx').on(
      table.tenantId,
      table.companyId,
      table.status,
    ),
    tenantCompanyNameIdx: index('departments_tenant_company_name_idx').on(
      table.tenantId,
      table.companyId,
      sql`lower(${table.name})`,
    ),
  }),
);

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id').notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    level: integer('level'),
    isManagerial: boolean('is_managerial').default(false).notNull(),
    status: organizationLifecycleStatus('status').default('ACTIVE').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    organizationScopeFk: foreignKey({
      name: 'positions_tenant_organization_fk',
      columns: [table.tenantId, table.organizationId],
      foreignColumns: [organizations.tenantId, organizations.id],
    }).onDelete('restrict'),
    tenantOrgCodeUq: uniqueIndex('positions_tenant_org_code_uq').on(
      table.tenantId,
      table.organizationId,
      table.code,
    ),
    tenantOrgStatusIdx: index('positions_tenant_org_status_idx').on(
      table.tenantId,
      table.organizationId,
      table.status,
    ),
    tenantOrgManagerialIdx: index('positions_tenant_org_managerial_idx').on(
      table.tenantId,
      table.organizationId,
      table.isManagerial,
    ),
  }),
);

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id').notNull(),
    companyId: uuid('company_id'),
    name: varchar('name', { length: 180 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    locationType: locationType('location_type').notNull(),
    country: varchar('country', { length: 80 }),
    city: varchar('city', { length: 120 }),
    district: varchar('district', { length: 120 }),
    address: text('address'),
    status: organizationLifecycleStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    organizationScopeFk: foreignKey({
      name: 'locations_tenant_organization_fk',
      columns: [table.tenantId, table.organizationId],
      foreignColumns: [organizations.tenantId, organizations.id],
    }).onDelete('restrict'),
    companyScopeFk: foreignKey({
      name: 'locations_company_same_organization_fk',
      columns: [table.tenantId, table.organizationId, table.companyId],
      foreignColumns: [companies.tenantId, companies.organizationId, companies.id],
    }).onDelete('restrict'),
    tenantOrgCodeUq: uniqueIndex('locations_tenant_org_code_uq').on(
      table.tenantId,
      table.organizationId,
      table.code,
    ),
    tenantOrgStatusIdx: index('locations_tenant_org_status_idx').on(
      table.tenantId,
      table.organizationId,
      table.status,
    ),
    tenantCompanyTypeIdx: index('locations_tenant_company_type_idx').on(
      table.tenantId,
      table.companyId,
      table.locationType,
    ),
  }),
);
