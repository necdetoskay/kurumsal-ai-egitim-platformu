import React, { useState } from 'react';
import { sessionFromRuntime } from './runtime-session';
import { createRoot } from 'react-dom/client';
import { canRenderProtectedShell, sessionMessage, type SessionState, type SessionStatus } from './auth';
import { InstructorAuthoringWorkspace } from './authoring-ui';
import { QuestionAssessmentWorkspace } from './assessment-ui';
import { OrganizationRuntimeView } from './organization-runtime-view';
import { PersonnelRuntimeView } from './personnel-runtime-view';
import { GroupRuntimeView } from './group-runtime-view';

import { navForRole, type WebRole } from './navigation';
import { defaultScreenFor, screenFor, type ScreenDefinition } from './screens';
import './styles.css';

type ViewState = 'success' | 'loading' | 'empty' | 'error' | 'forbidden' | 'not-found';
const roleLabels: Record<WebRole, string> = { tenant_admin: 'Tenant Admin', instructor: 'Instructor', reviewer: 'Reviewer', learner: 'Learner' };
function SessionPanel({ session, onLogin }: { session: Exclude<SessionState, { status: 'authenticated' }>; onLogin: () => void }) { const copy = sessionMessage(session); const loginAllowed = session.status === 'unauthenticated' || session.status === 'expired'; return <main id="main-content" className="auth-stage"><section className="auth-card" aria-live="polite"><span className="eyebrow">Authentication & Session</span><h1>{copy.title}</h1><p>{copy.detail}</p>{session.status === 'verification-required' && <div className="verification-box"><strong>MFA</strong><span>Doğrulama kodu bekleniyor.</span></div>}{loginAllowed && <button type="button" className="primary-button" onClick={onLogin}>Giriş yap</button>}</section></main>; }
function StatePanel({ state }: { state: Exclude<ViewState, 'success'> }) { const copy = { loading: ['Yükleniyor', 'İçerik güvenli şekilde hazırlanıyor.'], empty: ['Henüz içerik yok', 'Bu görünümde gösterilecek kayıt bulunmuyor.'], error: ['Bir sorun oluştu', 'İşlem tamamlanamadı. Tekrar deneyebilirsiniz.'], forbidden: ['Erişim izniniz yok', 'Bu kaynağa erişme yetkiniz bulunmuyor.'], 'not-found': ['Sayfa bulunamadı', 'İstenen kaynak mevcut değil veya erişilebilir değil.'] } as const; return <section className="state-panel" aria-live="polite"><h2>{copy[state][0]}</h2><p>{copy[state][1]}</p></section>; }

function WorkflowScreen({ screen, role }: { screen: ScreenDefinition; role: WebRole }) {
  if (role === 'instructor' && screen.href === '/instructor/trainings') return <InstructorAuthoringWorkspace />;
  if (role === 'instructor' && (screen.href === '/instructor/questions' || screen.href === '/instructor/assessments')) return <QuestionAssessmentWorkspace role="instructor" />;
  if (role === 'reviewer' && screen.href === '/reviewer/queue') return <QuestionAssessmentWorkspace role="reviewer" />;
  if (role === 'tenant_admin' && screen.href === '/admin/organization') return <OrganizationRuntimeView />;
  if (role === 'tenant_admin' && screen.href === '/admin/organization/personnel') return <PersonnelRuntimeView />;
  if (role === 'tenant_admin' && screen.href === '/admin/organization/directory') return <GroupRuntimeView />;
  if (role === 'tenant_admin' && screen.href === '/admin/organization/operations') return <StatePanel state="empty" />;
  const learner = role === 'learner';
  return <><header className="page-header"><div><span className="eyebrow">Ekran #{screen.id} · {roleLabels[role]}</span><h1>{screen.title}</h1><p>{screen.description}</p></div><span className="status-badge">{learner ? 'Sunucu yetkili' : 'Rol kapsamı'}</span></header><section className="content-card" aria-labelledby="workflow-state-title"><h2 id="workflow-state-title">Desteklenen durumlar</h2><div className="chip-row">{screen.workflowStates.map((state) => <span className="state-chip" key={state}>{state}</span>)}</div></section>{learner && <section className="content-card safety-card"><h2>Learner güvenlik sınırı</h2><p>Navigation yalnız sunum katmanıdır. Yetkilendirme sunucu tarafında yapılır; assessment answer key ve scoring secret istemci projection’ına dahil edilmez.</p></section>}</>;
}

function App() {
  const [role, setRole] = useState<WebRole>('learner');
  const [viewState, setViewState] = useState<ViewState>('success');
  const [session, setSession] = useState<SessionState>(() => sessionFromRuntime());
  const [href, setHref] = useState(defaultScreenFor('learner').href);
  const effectiveRole = canRenderProtectedShell(session) ? session.role : role;
  const nav = navForRole(effectiveRole);
  const currentScreen = screenFor(effectiveRole, href) ?? defaultScreenFor(effectiveRole);
 
  function navigate(nextHref: string) { setHref(screenFor(effectiveRole, nextHref)?.href ?? defaultScreenFor(effectiveRole).href); setViewState('success'); }
  if (!canRenderProtectedShell(session)) return <div className="public-shell"><a className="skip-link" href="#main-content">İçeriğe geç</a><header className="public-topbar"><div className="brand"><span className="brand-mark">K</span><div><strong>KAEP</strong><small>Kurumsal Eğitim</small></div></div></header><SessionPanel session={session} onLogin={() => setSession(sessionFromRuntime())} /></div>;
  return <div className="app-shell"><a className="skip-link" href="#main-content">İçeriğe geç</a><aside className="sidebar" aria-label="Ana navigasyon"><div className="brand"><span className="brand-mark">K</span><div><strong>KAEP</strong><small>Kurumsal Eğitim</small></div></div><nav>{nav.map((item) => <a className={item.href === currentScreen.href ? 'active' : ''} href={item.href} key={item.href} onClick={(event) => { event.preventDefault(); navigate(item.href); }}>{item.label}</a>)}</nav></aside><div className="workspace"><header className="topbar"><strong>{roleLabels[effectiveRole]}</strong><div className="state-switcher"><button type="button" className="link-button" onClick={() => { sessionStorage.clear(); setSession({ status: 'unauthenticated' }); }}>Çıkış</button></div></header><main id="main-content">{viewState === 'success' ? <WorkflowScreen screen={currentScreen} role={effectiveRole} /> : <StatePanel state={viewState} />}</main><nav className="mobile-nav" aria-label="Mobil navigasyon">{nav.slice(0, 4).map((item) => <a href={item.href} key={item.href} onClick={(event) => { event.preventDefault(); navigate(item.href); }}>{item.label}</a>)}</nav></div></div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
