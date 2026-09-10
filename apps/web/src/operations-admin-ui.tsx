import React from 'react';

export type OperationsAdminState = 'ready' | 'loading' | 'empty' | 'error' | 'forbidden';
export type IntegrationStatus = 'CONNECTED' | 'DEGRADED' | 'ERROR' | 'DISABLED';

export interface ImportSummary { id: string; fileName: string; status: 'REVIEW' | 'READY' | 'COMPLETED' | 'FAILED'; rows: number; warnings: number; }
export interface IntegrationSummary { id: string; name: string; type: 'AD_LDAP' | 'HR_ERP' | 'CSV'; status: IntegrationStatus; lastSyncAt?: string; error?: string; }
export interface AuditSummary { id: string; actor: string; action: string; occurredAt: string; entity: string; correlationId: string; }
export interface AudienceSelection { type: 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT' | 'GROUP' | 'EMPLOYEE'; id: string; label: string; resolvedLearners: number; }

export interface OperationsAdminProps {
  state: OperationsAdminState;
  imports?: readonly ImportSummary[];
  integrations?: readonly IntegrationSummary[];
  audit?: readonly AuditSummary[];
  audience?: readonly AudienceSelection[];
  uniqueLearnerCount?: number;
  overlapCount?: number;
  onStartImport?: () => void;
  onReviewImport?: (id: string) => void;
  onConfigureIntegration?: (id: string) => void;
  onConfirmAudience?: () => void;
}

function StatePanel({ state }: { state: Exclude<OperationsAdminState, 'ready'> }) {
  const copy = state === 'loading' ? 'Operasyon verileri yükleniyor…' : state === 'empty' ? 'Henüz operasyon kaydı yok.' : state === 'forbidden' ? 'Bu organizasyon operasyonlarını görüntüleme yetkiniz yok.' : 'Operasyon verileri alınamadı.';
  return <section className="ops-state" role={state === 'error' || state === 'forbidden' ? 'alert' : undefined}>{copy}</section>;
}

export function OperationsAdminView(props: OperationsAdminProps) {
  if (props.state !== 'ready') return <StatePanel state={props.state} />;
  const imports = props.imports ?? [];
  const integrations = props.integrations ?? [];
  const audit = props.audit ?? [];
  const audience = props.audience ?? [];
  return <main className="ops-page">
    <header><p className="eyebrow">Organizasyon Operasyonları</p><h1>İçe Aktarım, Entegrasyon, Audit ve Eğitim Kitlesi</h1></header>

    <section className="content-card"><div className="ops-heading"><div><h2>Personel İçe Aktarımı</h2><p>İçe aktarımlar önce doğrulanır ve incelenir; mevcut employment geçmişi sessizce overwrite edilmez.</p></div><button type="button" onClick={props.onStartImport}>Dosya Yükle</button></div>
      {imports.length === 0 ? <p>Henüz içe aktarım yok.</p> : <ul>{imports.map(item => <li key={item.id}><strong>{item.fileName}</strong> · {item.status} · {item.rows} satır · {item.warnings} uyarı <button type="button" onClick={() => props.onReviewImport?.(item.id)}>İncele</button></li>)}</ul>}
    </section>

    <section className="content-card"><h2>Entegrasyonlar</h2><div className="ops-grid">{integrations.map(item => <article key={item.id}><strong>{item.name}</strong><p>{item.type} · {item.status}</p>{item.lastSyncAt ? <small>Son senkron: {item.lastSyncAt}</small> : null}{item.error ? <p role="alert">Hata: {item.error}</p> : null}<button type="button" onClick={() => props.onConfigureIntegration?.(item.id)}>Yapılandır</button></article>)}</div></section>

    <section className="content-card"><h2>Audit Geçmişi</h2>{audit.length === 0 ? <p>Audit kaydı bulunamadı.</p> : <table><thead><tr><th>Aktör</th><th>İşlem</th><th>Kaynak</th><th>Zaman</th><th>Correlation</th></tr></thead><tbody>{audit.map(item => <tr key={item.id}><td>{item.actor}</td><td>{item.action}</td><td>{item.entity}</td><td>{item.occurredAt}</td><td><code>{item.correlationId}</code></td></tr>)}</tbody></table>}</section>

    <section className="content-card"><h2>Eğitim Kitlesi</h2><p>Organization, Company, Department, Group ve Employee hedefleri birlikte seçilebilir; çakışmalar tekilleştirilir.</p><ul>{audience.map(item => <li key={`${item.type}:${item.id}`}>{item.type}: {item.label} ({item.resolvedLearners})</li>)}</ul><div className="ops-audience-summary"><strong>Tekil öğrenen: {props.uniqueLearnerCount ?? 0}</strong><span>Çakışma: {props.overlapCount ?? 0}</span></div><button type="button" disabled={(props.uniqueLearnerCount ?? 0) === 0} onClick={props.onConfirmAudience}>Kitleyi Onayla</button></section>
  </main>;
}
