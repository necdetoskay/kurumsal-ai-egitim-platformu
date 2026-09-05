import React from 'react';
import './organization-admin-ui.css';

export type OrganizationAdminState = 'ready' | 'loading' | 'empty' | 'error' | 'forbidden';
export type LifecycleStatus = 'ACTIVE' | 'PASSIVE';

export interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
  status: LifecycleStatus;
  companyCount: number;
  departmentCount: number;
  employeeCount: number;
}

export interface CompanySummary {
  id: string;
  name: string;
  code: string;
  status: LifecycleStatus;
  departmentCount: number;
  employeeCount: number;
}

export interface DepartmentTreeNode {
  id: string;
  name: string;
  code: string;
  status: LifecycleStatus;
  companyId: string;
  children: readonly DepartmentTreeNode[];
}

export interface OrganizationAdminActions {
  onCreateOrganization?: () => void;
  onCreateCompany?: () => void;
  onCreateDepartment?: (companyId: string) => void;
  onMoveDepartment?: (departmentId: string) => void;
  onPassivateCompany?: (companyId: string) => void;
  onReactivateCompany?: (companyId: string) => void;
  onPassivateDepartment?: (departmentId: string) => void;
  onReactivateDepartment?: (departmentId: string) => void;
}

export interface OrganizationAdminProps extends OrganizationAdminActions {
  state: OrganizationAdminState;
  organization?: OrganizationSummary;
  companies?: readonly CompanySummary[];
  departmentsByCompany?: Readonly<Record<string, readonly DepartmentTreeNode[]>>;
}

function StatusBadge({ status }: { status: LifecycleStatus }) {
  return <span className={`om-status om-status--${status.toLowerCase()}`}>{status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</span>;
}

function StatePanel({ state, onCreateOrganization }: Pick<OrganizationAdminProps, 'state' | 'onCreateOrganization'>) {
  if (state === 'loading') return <section className="om-state" aria-live="polite">Organizasyon bilgileri yükleniyor…</section>;
  if (state === 'error') return <section className="om-state om-state--error" role="alert">Organizasyon bilgileri alınamadı.</section>;
  if (state === 'forbidden') return <section className="om-state om-state--forbidden" role="alert">Bu organizasyonu görüntüleme yetkiniz yok.</section>;
  if (state === 'empty') {
    return (
      <section className="om-state om-state--empty">
        <h2>Organizasyon kurulumu henüz tamamlanmadı</h2>
        <p>İlk şirket ve organizasyon yapısını oluşturmak için kurulum akışını başlatın.</p>
        <button type="button" onClick={onCreateOrganization}>İlk Kurulumu Başlat</button>
      </section>
    );
  }
  return null;
}

function DepartmentNode({ node, actions }: { node: DepartmentTreeNode; actions: OrganizationAdminActions }) {
  return (
    <li className="om-department-node">
      <div className="om-department-row">
        <div>
          <strong>{node.name}</strong>
          <span className="om-code">{node.code}</span>
        </div>
        <div className="om-row-actions">
          <StatusBadge status={node.status} />
          <button type="button" onClick={() => actions.onMoveDepartment?.(node.id)}>Taşı</button>
          {node.status === 'ACTIVE' ? (
            <button type="button" onClick={() => actions.onPassivateDepartment?.(node.id)}>Pasife Al</button>
          ) : (
            <button type="button" onClick={() => actions.onReactivateDepartment?.(node.id)}>Yeniden Aktifleştir</button>
          )}
        </div>
      </div>
      {node.children.length > 0 ? (
        <ul className="om-department-tree">
          {node.children.map((child) => <DepartmentNode key={child.id} node={child} actions={actions} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function OrganizationAdminView(props: OrganizationAdminProps) {
  if (props.state !== 'ready') return <StatePanel state={props.state} onCreateOrganization={props.onCreateOrganization} />;
  if (!props.organization) return <StatePanel state="empty" onCreateOrganization={props.onCreateOrganization} />;

  const companies = props.companies ?? [];
  const departmentsByCompany = props.departmentsByCompany ?? {};

  return (
    <main className="om-page">
      <header className="om-header">
        <div>
          <p className="om-eyebrow">Organizasyon Yönetimi</p>
          <div className="om-title-row">
            <h1>{props.organization.name}</h1>
            <StatusBadge status={props.organization.status} />
          </div>
          <p className="om-code">{props.organization.code}</p>
        </div>
        <button type="button" onClick={props.onCreateCompany}>Şirket Ekle</button>
      </header>

      <section className="om-metrics" aria-label="Organizasyon özeti">
        <article><strong>{props.organization.companyCount}</strong><span>Şirket</span></article>
        <article><strong>{props.organization.departmentCount}</strong><span>Departman</span></article>
        <article><strong>{props.organization.employeeCount}</strong><span>Personel</span></article>
      </section>

      <section className="om-section">
        <div className="om-section-heading">
          <div>
            <h2>Şirketler ve Departmanlar</h2>
            <p>Departman taşıma işlemleri yalnız aynı şirket içindeki geçerli üst departmanlara yapılabilir.</p>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="om-state om-state--empty">
            <h3>Henüz şirket yok</h3>
            <button type="button" onClick={props.onCreateCompany}>İlk Şirketi Oluştur</button>
          </div>
        ) : (
          <div className="om-company-grid">
            {companies.map((company) => {
              const roots = departmentsByCompany[company.id] ?? [];
              return (
                <article className="om-company-card" key={company.id}>
                  <header>
                    <div>
                      <h3>{company.name}</h3>
                      <span className="om-code">{company.code}</span>
                    </div>
                    <StatusBadge status={company.status} />
                  </header>
                  <dl className="om-company-stats">
                    <div><dt>Departman</dt><dd>{company.departmentCount}</dd></div>
                    <div><dt>Personel</dt><dd>{company.employeeCount}</dd></div>
                  </dl>
                  <div className="om-card-actions">
                    <button type="button" onClick={() => props.onCreateDepartment?.(company.id)}>Departman Ekle</button>
                    {company.status === 'ACTIVE' ? (
                      <button type="button" onClick={() => props.onPassivateCompany?.(company.id)}>Pasife Al</button>
                    ) : (
                      <button type="button" onClick={() => props.onReactivateCompany?.(company.id)}>Yeniden Aktifleştir</button>
                    )}
                  </div>
                  <div className="om-tree-wrap">
                    <h4>Departman Ağacı</h4>
                    {roots.length === 0 ? <p className="om-muted">Bu şirkette henüz departman yok.</p> : (
                      <ul className="om-department-tree">
                        {roots.map((node) => <DepartmentNode key={node.id} node={node} actions={props} />)}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
