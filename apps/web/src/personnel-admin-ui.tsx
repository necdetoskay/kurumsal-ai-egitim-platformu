import React from 'react';

export type PersonnelState = 'ready' | 'loading' | 'empty' | 'error' | 'forbidden';
export type EmployeeStatus = 'ACTIVE' | 'PASSIVE' | 'TERMINATED';

export interface PersonnelRow {
  id: string;
  fullName: string;
  employeeNo?: string;
  email?: string;
  status: EmployeeStatus;
  companyName?: string;
  departmentName?: string;
  positionName?: string;
  locationName?: string;
  accountState?: 'LINKED' | 'NOT_LINKED' | 'DISABLED';
}

export interface EmploymentHistoryRow {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  companyName: string;
  departmentName?: string;
  positionName?: string;
  locationName?: string;
  managerName?: string;
  employmentType?: string;
}

export interface EmploymentTransferDraft {
  companyId: string;
  departmentId?: string;
  positionId?: string;
  locationId?: string;
  managerEmployeeId?: string;
  effectiveDate: string;
}

export interface PersonnelAdminProps {
  state: PersonnelState;
  employees?: readonly PersonnelRow[];
  selected?: PersonnelRow;
  history?: readonly EmploymentHistoryRow[];
  search?: string;
  onSearchChange?: (value: string) => void;
  onSelectEmployee?: (id: string) => void;
  onCreateEmployee?: () => void;
  onUpdateEmployee?: (id: string) => void;
  onPassivateEmployee?: (id: string) => void;
  onTerminateEmployee?: (id: string) => void;
  onTransferEmployment?: (employeeId: string, draft: EmploymentTransferDraft) => void;
}

function StatePanel({ state }: { state: Exclude<PersonnelState, 'ready'> }) {
  const copy = {
    loading: 'Personel verileri yükleniyor…',
    empty: 'Henüz personel kaydı yok.',
    error: 'Personel verileri alınamadı.',
    forbidden: 'Bu personel alanını görüntüleme yetkiniz yok.',
  } as const;
  return <section className="om-state" aria-live="polite">{copy[state]}</section>;
}

export function PersonnelAdminView(props: PersonnelAdminProps) {
  if (props.state !== 'ready') return <StatePanel state={props.state} />;
  const employees = props.employees ?? [];
  if (employees.length === 0) return <StatePanel state="empty" />;

  return <main className="om-page">
    <header className="om-header">
      <div><p className="om-eyebrow">Organizasyon Yönetimi</p><h1>Personel</h1><p>Çalışan kaydı, kullanıcı hesabı ve istihdam geçmişi birbirinden ayrı yönetilir.</p></div>
      <button type="button" onClick={props.onCreateEmployee}>Personel Ekle</button>
    </header>

    <section className="om-section">
      <label>Personel ara<input value={props.search ?? ''} onChange={(e) => props.onSearchChange?.(e.target.value)} placeholder="Ad, sicil veya e-posta" /></label>
      <div className="om-company-grid">
        {employees.map((employee) => <article className="om-company-card" key={employee.id}>
          <header><div><h3>{employee.fullName}</h3><span className="om-code">{employee.employeeNo ?? 'Sicil yok'}</span></div><span className="om-status">{employee.status}</span></header>
          <dl className="om-company-stats">
            <div><dt>Şirket</dt><dd>{employee.companyName ?? '—'}</dd></div>
            <div><dt>Departman</dt><dd>{employee.departmentName ?? '—'}</dd></div>
            <div><dt>Pozisyon</dt><dd>{employee.positionName ?? '—'}</dd></div>
            <div><dt>Lokasyon</dt><dd>{employee.locationName ?? '—'}</dd></div>
          </dl>
          <p><strong>Uygulama hesabı:</strong> {employee.accountState ?? 'NOT_LINKED'}</p>
          <div className="om-card-actions">
            <button type="button" onClick={() => props.onSelectEmployee?.(employee.id)}>Detay</button>
            <button type="button" onClick={() => props.onUpdateEmployee?.(employee.id)}>Personel Bilgisini Düzenle</button>
            {employee.status === 'ACTIVE' && <button type="button" onClick={() => props.onPassivateEmployee?.(employee.id)}>Pasife Al</button>}
            {employee.status !== 'TERMINATED' && <button type="button" onClick={() => props.onTerminateEmployee?.(employee.id)}>İşten Ayrıldı</button>}
          </div>
        </article>)}
      </div>
    </section>

    {props.selected && <section className="om-section">
      <h2>{props.selected.fullName} · Personel Detayı</h2>
      <p><strong>Personel durumu:</strong> {props.selected.status}</p>
      <p><strong>Kullanıcı hesabı:</strong> {props.selected.accountState ?? 'NOT_LINKED'} — bu durum personel yaşam döngüsünden bağımsızdır.</p>
      <h3>Mevcut Atama</h3>
      <p>{[props.selected.companyName, props.selected.departmentName, props.selected.positionName, props.selected.locationName].filter(Boolean).join(' / ') || 'Aktif atama yok'}</p>
      <h3>Atama Geçmişi</h3>
      <ul>{(props.history ?? []).map((row) => <li key={row.id}>{row.startedAt} – {row.endedAt ?? 'devam ediyor'} · {[row.companyName,row.departmentName,row.positionName,row.locationName].filter(Boolean).join(' / ')}</li>)}</ul>
      <div className="om-state om-state--empty">
        <h3>Atama Değişikliği</h3>
        <p>Şirket, departman, pozisyon, lokasyon veya yönetici değişikliği mevcut kaydı düzenlemez; eski atama kapanır ve yeni employment kaydı başlatılır.</p>
        <button type="button" onClick={() => props.onTransferEmployment?.(props.selected!.id, { companyId: '', effectiveDate: new Date().toISOString().slice(0,10) })}>Atama Değişikliği Başlat</button>
      </div>
    </section>}
  </main>;
}
