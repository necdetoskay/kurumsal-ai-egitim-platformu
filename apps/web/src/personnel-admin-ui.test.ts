import { describe, expect, it } from 'vitest';
import { PersonnelAdminView } from './personnel-admin-ui';

describe('PersonnelAdminView contract', () => {
  it('exposes employee and account state as distinct concepts', () => {
    expect(PersonnelAdminView).toBeTypeOf('function');
    const source = PersonnelAdminView.toString();
    expect(source).toContain('Personel durumu');
    expect(source).toContain('Kullanıcı hesabı');
  });

  it('uses dedicated assignment transfer language and no destructive delete', () => {
    const source = PersonnelAdminView.toString();
    expect(source).toContain('Atama Değişikliği');
    expect(source).not.toContain('Sil');
    expect(source).not.toContain('delete');
  });
});
