import type { WebRole } from './navigation';

export type ScreenState = 'ready' | 'loading' | 'empty' | 'error' | 'forbidden' | 'not-found';
export type WorkflowTone = 'neutral' | 'info' | 'warning' | 'success';

export interface ScreenDefinition {
  id: number;
  href: string;
  roles: readonly WebRole[];
  title: string;
  description: string;
  workflowStates: readonly string[];
  tone?: WorkflowTone;
  learnerSafe?: boolean;
}

export const screens: readonly ScreenDefinition[] = [
  { id: 9, href: '/admin', roles: ['tenant_admin'], title: 'Yönetim Paneli', description: 'Organizasyon, eğitim ve operasyon özetleri.', workflowStates: ['active'], tone: 'info' },
  { id: 23, href: '/trainings', roles: ['tenant_admin', 'instructor'], title: 'Eğitimler', description: 'Taslak, inceleme ve yayın durumundaki eğitimleri yönetin.', workflowStates: ['draft', 'in-review', 'changes-requested', 'published', 'archived'] },
  { id: 33, href: '/questions', roles: ['tenant_admin', 'instructor', 'reviewer'], title: 'Soru Bankası', description: 'Soru versiyonlarını ve inceleme durumlarını yönetin.', workflowStates: ['draft', 'in-review', 'approved', 'retired'] },
  { id: 37, href: '/assessments', roles: ['tenant_admin', 'instructor', 'reviewer'], title: 'Değerlendirmeler', description: 'Assessment yapılandırma ve yayın akışları.', workflowStates: ['draft', 'published', 'closed'] },
  { id: 42, href: '/reviews', roles: ['tenant_admin', 'reviewer'], title: 'İnceleme Kuyruğu', description: 'Human-in-the-loop karar bekleyen içerikler.', workflowStates: ['pending', 'claimed', 'approved', 'rejected', 'changes-requested'], tone: 'warning' },
  { id: 48, href: '/learn', roles: ['learner'], title: 'Öğrenme Alanım', description: 'Atandığınız eğitimler ve güncel ilerlemeniz.', workflowStates: ['assigned', 'in-progress', 'overdue', 'completed'], learnerSafe: true },
  { id: 49, href: '/learn/trainings', roles: ['learner'], title: 'Eğitimlerim', description: 'Aktif ve tamamlanan eğitim atamalarınız.', workflowStates: ['assigned', 'in-progress', 'overdue', 'completed'], learnerSafe: true },
  { id: 51, href: '/learn/player', roles: ['learner'], title: 'Eğitim Oynatıcı', description: 'İçeriğe devam edin; ilerleme sunucu durumu ile senkronize edilir.', workflowStates: ['resuming', 'progress-saving', 'progress-save-failed', 'completed'], learnerSafe: true },
  { id: 54, href: '/learn/assessment', roles: ['learner'], title: 'Değerlendirme', description: 'Uygunluk ve mevcut attempt durumunu kontrol edin.', workflowStates: ['not-eligible', 'scheduled', 'eligible', 'attempt-exists'], learnerSafe: true },
  { id: 55, href: '/learn/assessment/player', roles: ['learner'], title: 'Değerlendirme Oynatıcı', description: 'Cevap anahtarı ve scoring secret bilgileri istemciye gönderilmez.', workflowStates: ['in-progress', 'autosaving', 'autosave-failed', 'resumed', 'expiring', 'expired', 'submitting'], learnerSafe: true },
  { id: 58, href: '/learn/results', roles: ['learner'], title: 'Sonuçlar', description: 'Sunucu tarafından tamamlanmış değerlendirme sonuçları.', workflowStates: ['scoring', 'pass', 'fail'], learnerSafe: true },
  { id: 60, href: '/learn/certificates', roles: ['learner'], title: 'Sertifikalarım', description: 'Verilmiş ve varsa iptal edilmiş sertifikalarınız.', workflowStates: ['issued', 'revoked'], learnerSafe: true },
] as const;

export function screenFor(role: WebRole, href: string): ScreenDefinition | null {
  return screens.find((screen) => screen.href === href && screen.roles.includes(role)) ?? null;
}

export function defaultScreenFor(role: WebRole): ScreenDefinition {
  const href = role === 'learner' ? '/learn' : role === 'reviewer' ? '/reviews' : role === 'instructor' ? '/trainings' : '/admin';
  const screen = screenFor(role, href);
  if (!screen) throw new Error('DEFAULT_SCREEN_MISSING');
  return screen;
}

export function learnerProjectionContract(screen: ScreenDefinition): { exposesAnswerKey: false; serverAuthoritative: true } | null {
  if (!screen.learnerSafe) return null;
  return { exposesAnswerKey: false, serverAuthoritative: true };
}
