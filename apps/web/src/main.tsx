import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navForRole, type WebRole } from './navigation';
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

function Dashboard({ role }: { role: WebRole }) {
  if (role === 'learner') {
    return <>
      <header className="page-header"><div><span className="eyebrow">Öğrenme alanım</span><h1>Günaydın</h1><p>Atandığınız eğitimlere devam edin ve ilerlemenizi takip edin.</p></div><span className="status-badge">2 aktif eğitim</span></header>
      <section className="metric-grid" aria-label="Öğrenme özeti">
        <article className="metric-card"><span>Devam eden</span><strong>2</strong></article>
        <article className="metric-card"><span>Tamamlanan</span><strong>7</strong></article>
        <article className="metric-card"><span>Sertifika</span><strong>5</strong></article>
      </section>
      <section className="content-card"><h2>Sıradaki eğitim</h2><p>Bilgi Güvenliği Farkındalık Eğitimi</p><div className="progress"><span style={{ width: '68%' }} /></div><small>%68 tamamlandı</small></section>
    </>;
  }
  return <>
    <header className="page-header"><div><span className="eyebrow">{roleLabels[role]}</span><h1>Çalışma alanı</h1><p>Rolünüze ait işlemler ve güncel durumlar burada özetlenir.</p></div><span className="status-badge">Sistem hazır</span></header>
    <section className="metric-grid"><article className="metric-card"><span>Bekleyen işler</span><strong>4</strong></article><article className="metric-card"><span>Aktif kayıtlar</span><strong>18</strong></article><article className="metric-card"><span>Bugün</span><strong>6</strong></article></section>
    <section className="content-card"><h2>Başlangıç görünümü</h2><p>Sprint 13 ile production web shell ve ortak UI state altyapısı devreye alındı.</p></section>
  </>;
}

function App() {
  const [role, setRole] = useState<WebRole>('learner');
  const [viewState, setViewState] = useState<ViewState>('success');
  const nav = navForRole(role);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">İçeriğe geç</a>
    <aside className="sidebar" aria-label="Ana navigasyon">
      <div className="brand"><span className="brand-mark">K</span><div><strong>KAEP</strong><small>Kurumsal Eğitim</small></div></div>
      <nav>{nav.map((item, index) => <a className={index === 0 ? 'active' : ''} href={item.href} key={item.href}>{item.label}</a>)}</nav>
      <div className="role-box"><label htmlFor="role">Demo rolü</label><select id="role" value={role} onChange={(event) => setRole(event.target.value as WebRole)}>{(Object.keys(roleLabels) as WebRole[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><strong>{roleLabels[role]}</strong><div className="state-switcher" aria-label="UI state preview"><label htmlFor="state">Durum</label><select id="state" value={viewState} onChange={(event) => setViewState(event.target.value as ViewState)}><option value="success">Success</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option><option value="forbidden">403</option><option value="not-found">404</option></select></div></header>
      <main id="main-content">{viewState === 'success' ? <Dashboard role={role} /> : <StatePanel state={viewState} />}</main>
      <nav className="mobile-nav" aria-label="Mobil navigasyon">{nav.slice(0, 4).map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}</nav>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
