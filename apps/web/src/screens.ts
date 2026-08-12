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
  { id: 23, href: '/instructor/trainings', roles: ['instructor'], title: 'Eğitimler', description: 'Taslak, inceleme ve yayın durumundaki eğitimleri yönetin.', workflowStates: ['draft', 'in-review', 'changes-requested', 'published', 'archived'] },
  { id: 33, href: '/instructor/questions', roles: ['instructor'], title: 'Soru Bankası', description: 'Soru versiyonlarını ve inceleme durumlarını yönetin.', workflowStates: ['draft', 'in-review', 'approved', 'retired'] },
  { id: 37, href: '/instructor/assessments', roles: ['instructor'], title: 'Değerlendirmeler', description: 'Assessment yapılandırma ve yayın akışları.', workflowStates: ['draft', 'published', 'closed'] },
  { id: 42, href: '/reviewer/queue', roles: ['reviewer'], title: 'İnceleme Kuyruğu', description: 'Human-in-the-loop karar bekleyen içerikler.', workflowStates: ['pending', 'claimed', 'approved', 'rejected', 'changes-requested'], tone: 'warning' },
  { id: 48, href: '/learn', roles: ['learner'], title: 'Öğrenme Alanım', description: 'Atandığınız eğitimler ve güncel ilerlemeniz.', workflowStates: ['assigned', 'in-progress', 'overdue', 'completed'], learnerSafe: true },
  { id: 49, href: '/learn/trainings', roles: ['learner'], title: 'Eğitimlerim', description: 'Aktif ve tamamlanan eğitim atamalarınız.', workflowStates: ['assigned', 'in-progress', 'overdue', 'completed'], learnerSafe: true },
  { id: 54, href: '/learn/assessments', roles: ['learner'], title: 'Değerlendirmeler', description: 'Uygunluk, mevcut attempt ve sonuç durumlarınızı görüntüleyin.', workflowStates: ['not-eligible', 'scheduled', 'eligible', 'attempt-exists', 'in-progress', 'autosave-failed', 'submitting', 'scoring', 'pass', 'fail'], learnerSafe: true },
  { id: 60, href: '/learn/certificates', roles: ['learner'], title: 'Sertifikalarım', description: 'Verilmiş ve varsa iptal edilmiş sertifikalarınız.', workflowStates: ['issued', 'revoked'], learnerSafe: true },
  { id: 62, href: '/learn/insights', roles: ['learner'], title: 'Öğrenme İçgörüleri', description: 'Yeterli evidence bulunduğunda öğrenme alanları hakkında güvenli içgörüler.', workflowStates: ['available', 'low-confidence', 'insufficient-evidence'], learnerSafe: true },
] as const;

export function screenFor(role: WebRole, href: string): ScreenDefinition | null {
  return screens.find((screen) => screen.href === href && screen.roles.includes(role)) ?? null;
}

export function defaultScreenFor(role: WebRole): ScreenDefinition {
  const href = role === 'learner' ? '/learn' : role === 'reviewer' ? '/reviewer/queue' : role === 'instructor' ? '/instructor/trainings' : '/admin';
  const screen = screenFor(role, href);
  if (!screen) throw new Error('DEFAULT_SCREEN_MISSING');
  return screen;
}

export function learnerProjectionContract(screen: ScreenDefinition): { exposesAnswerKey: false; serverAuthoritative: true } | null {
  if (!screen.learnerSafe) return null;
  return { exposesAnswerKey: false, serverAuthoritative: true };
}
