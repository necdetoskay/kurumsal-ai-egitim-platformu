import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OrganizationAdminView } from './organization-admin-ui.js';

const organization = {
  id: 'o1',
  name: 'Kent Konut',
  code: 'KK',
  status: 'ACTIVE' as const,
  companyCount: 1,
  departmentCount: 2,
  employeeCount: 42,
};

const company = {
  id: 'c1',
  name: 'Kent Konut A.Ş.',
  code: 'KKA',
  status: 'ACTIVE' as const,
  departmentCount: 2,
  employeeCount: 42,
};

const departments = {
  c1: [{
    id: 'd1',
    name: 'Bilgi Teknolojileri',
    code: 'BT',
    status: 'ACTIVE' as const,
    companyId: 'c1',
    children: [{
      id: 'd2',
      name: 'Altyapı',
      code: 'ALT',
      status: 'ACTIVE' as const,
      companyId: 'c1',
      children: [],
    }],
  }],
};

describe('OrganizationAdminView', () => {
  it('renders VCE overview metrics and hierarchy without destructive delete actions', () => {
    const html = renderToStaticMarkup(
      <OrganizationAdminView state="ready" organization={organization} companies={[company]} departmentsByCompany={departments} />,
    );
    expect(html).toContain('Şirketler ve Departmanlar');
    expect(html).toContain('Bilgi Teknolojileri');
    expect(html).toContain('Taşı');
    expect(html).toContain('Pasife Al');
    expect(html).not.toContain('Sil');
    expect(html).not.toContain('DELETE');
  });

  it('renders first-run empty state as a dedicated setup flow', () => {
    const html = renderToStaticMarkup(<OrganizationAdminView state="empty" />);
    expect(html).toContain('İlk Kurulumu Başlat');
    expect(html).toContain('Organizasyon kurulumu henüz tamamlanmadı');
  });

  it('renders forbidden state without exposing organization data', () => {
    const html = renderToStaticMarkup(<OrganizationAdminView state="forbidden" organization={organization} />);
    expect(html).toContain('görüntüleme yetkiniz yok');
    expect(html).not.toContain('Kent Konut');
  });
});
