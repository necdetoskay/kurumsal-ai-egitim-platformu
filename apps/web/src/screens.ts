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
  { id: 65, href: '/admin/organization', roles: ['tenant_admin'], title: 'Organizasyon Genel Bakış', description: 'Organizasyon, şirket ve departman yapısını yönetin.', workflowStates: ['ready', 'loading', 'empty', 'error', 'forbidden'], tone: 'info' },
  { id: 66, href: '/admin/organization/setup', roles: ['tenant_admin'], title: 'İlk Organizasyon Kurulumu', description: 'İlk organizasyon ve şirket yapısını güvenli kurulum akışıyla oluşturun.', workflowStates: ['empty', 'editing', 'saving', 'completed', 'error'] },
  { id: 67, href: '/admin/organization/companies', roles: ['tenant_admin'], title: 'Şirket Yönetimi', description: 'Şirketleri oluşturun, düzenleyin ve yaşam döngüsünü yönetin.', workflowStates: ['ready', 'empty', 'passivated', 'reactivated', 'forbidden'] },
  { id: 68, href: '/admin/organization/departments', roles: ['tenant_admin'], title: 'Departman Yönetimi', description: 'Departman ağacını yönetin ve güvenli taşıma komutlarını uygulayın.', workflowStates: ['ready', 'empty', 'moving', 'move-blocked', 'passivated', 'forbidden'] },
  { id: 69, href: '/admin/organization/personnel', roles: ['tenant_admin'], title: 'Personel Yönetimi', description: 'Personel kayıtlarını arayın, filtreleyin ve yaşam döngüsünü yönetin.', workflowStates: ['ready', 'loading', 'empty', 'error', 'forbidden'] },
  { id: 70, href: '/admin/organization/personnel/detail', roles: ['tenant_admin'], title: 'Personel Detayı', description: 'Personel, kullanıcı hesabı, mevcut atama ve istihdam geçmişini ayrı görüntüleyin.', workflowStates: ['ready', 'passive', 'terminated', 'not-linked', 'forbidden'] },
  { id: 71, href: '/admin/organization/personnel/transfer', roles: ['tenant_admin'], title: 'Atama Değişikliği', description: 'Mevcut employment kaydını kapatıp yeni atamayı etkin tarihle başlatın.', workflowStates: ['editing', 'scope-invalid', 'saving', 'completed', 'conflict'] },
  { id: 23, href: '/instructor/trainings', roles: ['instructor'], title: 'Eğitimler', description: 'Taslak, inceleme ve yayın durumundaki eğitimleri yönetin.', workflowStates: ['draft', 'in-review', 'changes-requested', 'published', 'archived'] },
  { id: 24, href: '/instructor/trainings/new', roles: ['instructor'], title: 'Yeni Eğitim', description: 'Yeni training draft oluşturun.', workflowStates: ['draft', 'validation-error'] },
  { id: 25, href: '/instructor/trainings/editor', roles: ['instructor'], title: 'Eğitim Editörü', description: 'Training metadata ve içerik yapısını düzenleyin.', workflowStates: ['editing', 'saving', 'saved', 'save-failed'] },
  { id: 26, href: '/instructor/trainings/modules', roles: ['instructor'], title: 'Modül Yöneticisi', description: 'Modül ve içerik sıralamasını yönetin.', workflowStates: ['editing', 'saved'] },
  { id: 27, href: '/instructor/trainings/sources', roles: ['instructor'], title: 'Kaynak Yöneticisi', description: 'Source ve evidence lineage bağlarını yönetin.', workflowStates: ['linked', 'missing-evidence', 'quality-blocked'] },
  { id: 28, href: '/instructor/trainings/objectives', roles: ['instructor'], title: 'Learning Objectives', description: 'Öğrenme hedeflerini düzenleyin ve içerikle eşleyin.', workflowStates: ['editing', 'mapped', 'incomplete'] },
  { id: 29, href: '/instructor/trainings/preview', roles: ['instructor'], title: 'Eğitim Önizleme', description: 'Review öncesi instructor preview.', workflowStates: ['preview', 'validation-warning'] },
  { id: 30, href: '/instructor/trainings/review', roles: ['instructor'], title: 'İncelemeye Gönder', description: 'Training draftı human review kuyruğuna gönderin.', workflowStates: ['ready', 'blocked', 'submitted'] },
  { id: 31, href: '/instructor/trainings/versions', roles: ['instructor'], title: 'Versiyon Geçmişi', description: 'Published ve draft version lineage görüntüleyin.', workflowStates: ['current', 'published', 'superseded'] },
  { id: 32, href: '/instructor/trainings/detail', roles: ['instructor'], title: 'Eğitim Detayı', description: 'Training lifecycle ve review durumunu görüntüleyin.', workflowStates: ['draft', 'in-review', 'changes-requested', 'published'] },
  { id: 33, href: '/instructor/questions', roles: ['instructor'], title: 'Soru Bankası', description: 'Soru versiyonlarını ve inceleme durumlarını yönetin.', workflowStates: ['draft', 'in-review', 'approved', 'retired'] },
  { id: 36, href: '/instructor/ai', roles: ['instructor'], title: 'AI Çalışma Alanı', description: 'Evidence-grounded AI content proposals üretin ve inceleyin.', workflowStates: ['draft-proposal', 'needs-review', 'accepted-as-draft', 'rejected'] },
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
