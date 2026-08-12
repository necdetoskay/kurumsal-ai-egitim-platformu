import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navForRole, type WebRole } from './navigation';
import { defaultScreenFor, screenFor, type ScreenDefinition } from './screens';
import './styles.css';

type ViewState = 'success' | 'loading' | 'empty' | 'error' | 'forbidden' | 'not-found';

const roleLabels: Record<WebRole, string> = {
  tenant_admin: 'Tenant Admin',
  instructor: 'Instructor',
  reviewer: 'Reviewer',
  learner: 'Learner',
};

function StatePanel({ state }: { state: Exclude<ViewState, 'success'> }) {
  const copy = {
    loading: ['Yükleniyor', 'İçerik güvenli şekilde hazırlanıyor.'],
    empty: ['Henüz içerik yok', 'Bu görünümde gösterilecek kayıt bulunmuyor.'],
    error: ['Bir sorun oluştu', 'İşlem tamamlanamadı. Tekrar deneyebilirsiniz.'],
    forbidden: ['Erişim izniniz yok', 'Bu kaynağa erişme yetkiniz bulunmuyor.'],
    'not-found': ['Sayfa bulunamadı', 'İstenen kaynak mevcut değil veya erişilebilir değil.'],
  } as const;
  return <section className="state-panel" aria-live="polite"><h2>{copy[state][0]}</h2><p>{copy[state][1]}</p></section>;
}

function WorkflowScreen({ screen, role }: { screen: ScreenDefinition; role: WebRole }) {
  const learner = role === 'learner';
  return <>
    <header className="page-header">
      <div><span className="eyebrow">Ekran #{screen.id} · {roleLabels[role]}</span><h1>{screen.title}</h1><p>{screen.description}</p></div>
      <span className="status-badge">{learner ? 'Sunucu yetkili' : 'Rol kapsamı'}</span>
    </header>
    <section className="content-card" aria-labelledby="workflow-state-title">
      <h2 id="workflow-state-title">Desteklenen durumlar</h2>
      <div className="chip-row">{screen.workflowStates.map((state) => <span className="state-chip" key={state}>{state}</span>)}</div>
    </section>
    {learner && <section className="content-card safety-card"><h2>Learner güvenlik sınırı</h2><p>Navigation yalnız sunum katmanıdır. Yetkilendirme sunucu tarafında yapılır; assessment answer key ve scoring secret istemci projection’ına dahil edilmez.</p></section>}
  </>;
}

function App() {
  const [role, setRole] = useState<WebRole>('learner');
  const [viewState, setViewState] = useState<ViewState>('success');
  const [href, setHref] = useState(defaultScreenFor('learner').href);
  const nav = navForRole(role);
  const currentScreen = screenFor(role, href) ?? defaultScreenFor(role);

  function changeRole(nextRole: WebRole) {
    setRole(nextRole);
    setHref(defaultScreenFor(nextRole).href);
    setViewState('success');
  }

  function navigate(nextHref: string) {
    setHref(screenFor(role, nextHref)?.href ?? defaultScreenFor(role).href);
    setViewState('success');
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">İçeriğe geç</a>
    <aside className="sidebar" aria-label="Ana navigasyon">
      <div className="brand"><span className="brand-mark">K</span><div><strong>KAEP</strong><small>Kurumsal Eğitim</small></div></div>
      <nav>{nav.map((item) => <a className={item.href === currentScreen.href ? 'active' : ''} href={item.href} key={item.href} onClick={(event) => { event.preventDefault(); navigate(item.href); }}>{item.label}</a>)}</nav>
      <div className="role-box"><label htmlFor="role">Demo rolü</label><select id="role" value={role} onChange={(event) => changeRole(event.target.value as WebRole)}>{(Object.keys(roleLabels) as WebRole[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><strong>{roleLabels[role]}</strong><div className="state-switcher" aria-label="UI state preview"><label htmlFor="state">Durum</label><select id="state" value={viewState} onChange={(event) => setViewState(event.target.value as ViewState)}><option value="success">Success</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option><option value="forbidden">403</option><option value="not-found">404</option></select></div></header>
      <main id="main-content">{viewState === 'success' ? <WorkflowScreen screen={currentScreen} role={role} /> : <StatePanel state={viewState} />}</main>
      <nav className="mobile-nav" aria-label="Mobil navigasyon">{nav.slice(0, 4).map((item) => <a href={item.href} key={item.href} onClick={(event) => { event.preventDefault(); navigate(item.href); }}>{item.label}</a>)}</nav>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
