CREATE TYPE "public"."organization_lifecycle_status" AS ENUM('ACTIVE', 'PASSIVE');
--> statement-breakpoint
CREATE TYPE "public"."organization_location_type" AS ENUM('OFFICE', 'SITE', 'WAREHOUSE', 'FACTORY', 'REGION', 'OTHER');
--> statement-breakpoint
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "code" varchar(50) NOT NULL,
  "sector" varchar(120),
  "default_locale" varchar(20) NOT NULL,
  "timezone" varchar(64) NOT NULL,
  "status" "organization_lifecycle_status" DEFAULT 'ACTIVE' NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "legal_name" varchar(250),
  "code" varchar(50) NOT NULL,
  "tax_number" varchar(50),
  "email" varchar(254),
  "phone" varchar(50),
  "website" varchar(255),
  "status" "organization_lifecycle_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "parent_department_id" uuid,
  "name" varchar(200) NOT NULL,
  "code" varchar(50) NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "status" "organization_lifecycle_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "departments_parent_not_self_ck" CHECK ("parent_department_id" IS NULL OR "parent_department_id" <> "id")
);
--> statement-breakpoint
CREATE TABLE "positions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" varchar(160) NOT NULL,
  "code" varchar(50) NOT NULL,
  "level" integer,
  "is_managerial" boolean DEFAULT false NOT NULL,
  "status" "organization_lifecycle_status" DEFAULT 'ACTIVE' NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "company_id" uuid,
  "name" varchar(180) NOT NULL,
  "code" varchar(50) NOT NULL,
  "location_type" "organization_location_type" NOT NULL,
  "country" varchar(80),
  "city" varchar(120),
  "district" varchar(120),
  "address" text,
  "status" "organization_lifecycle_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_tenant_code_uq" ON "organizations" USING btree ("tenant_id","code");
--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_tenant_id_id_uq" ON "organizations" USING btree ("tenant_id","id");
--> statement-breakpoint
CREATE INDEX "organizations_tenant_status_idx" ON "organizations" USING btree ("tenant_id","status");
--> statement-breakpoint
CREATE INDEX "organizations_tenant_name_idx" ON "organizations" USING btree ("tenant_id",lower("name"));
--> statement-breakpoint
CREATE UNIQUE INDEX "companies_tenant_org_code_uq" ON "companies" USING btree ("tenant_id","organization_id","code");
--> statement-breakpoint
CREATE UNIQUE INDEX "companies_tenant_org_id_uq" ON "companies" USING btree ("tenant_id","organization_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX "companies_tenant_id_id_uq" ON "companies" USING btree ("tenant_id","id");
--> statement-breakpoint
CREATE INDEX "companies_tenant_org_status_idx" ON "companies" USING btree ("tenant_id","organization_id","status");
--> statement-breakpoint
CREATE INDEX "companies_tenant_name_idx" ON "companies" USING btree ("tenant_id",lower("name"));
--> statement-breakpoint
CREATE UNIQUE INDEX "departments_tenant_company_code_uq" ON "departments" USING btree ("tenant_id","company_id","code");
--> statement-breakpoint
CREATE UNIQUE INDEX "departments_tenant_company_id_uq" ON "departments" USING btree ("tenant_id","company_id","id");
--> statement-breakpoint
CREATE INDEX "departments_hierarchy_idx" ON "departments" USING btree ("tenant_id","company_id","parent_department_id");
--> statement-breakpoint
CREATE INDEX "departments_tenant_company_status_idx" ON "departments" USING btree ("tenant_id","company_id","status");
--> statement-breakpoint
CREATE INDEX "departments_tenant_company_name_idx" ON "departments" USING btree ("tenant_id","company_id",lower("name"));
--> statement-breakpoint
CREATE UNIQUE INDEX "positions_tenant_org_code_uq" ON "positions" USING btree ("tenant_id","organization_id","code");
--> statement-breakpoint
CREATE INDEX "positions_tenant_org_status_idx" ON "positions" USING btree ("tenant_id","organization_id","status");
--> statement-breakpoint
CREATE INDEX "positions_tenant_org_managerial_idx" ON "positions" USING btree ("tenant_id","organization_id","is_managerial");
--> statement-breakpoint
CREATE UNIQUE INDEX "locations_tenant_org_code_uq" ON "locations" USING btree ("tenant_id","organization_id","code");
--> statement-breakpoint
CREATE INDEX "locations_tenant_org_status_idx" ON "locations" USING btree ("tenant_id","organization_id","status");
--> statement-breakpoint
CREATE INDEX "locations_tenant_company_type_idx" ON "locations" USING btree ("tenant_id","company_id","location_type");
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."organizations"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_company_fk" FOREIGN KEY ("tenant_id","company_id") REFERENCES "public"."companies"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_same_company_fk" FOREIGN KEY ("tenant_id","company_id","parent_department_id") REFERENCES "public"."departments"("tenant_id","company_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."organizations"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."organizations"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_company_same_organization_fk" FOREIGN KEY ("tenant_id","organization_id","company_id") REFERENCES "public"."companies"("tenant_id","organization_id","id") ON DELETE restrict ON UPDATE no action;
