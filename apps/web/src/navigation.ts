export type WebRole = 'tenant_admin' | 'instructor' | 'reviewer' | 'learner';

export interface NavItem {
  label: string;
  href: string;
  inventory: readonly number[];
}

const roleNavigation: Record<WebRole, readonly NavItem[]> = {
  tenant_admin: [
    { label: 'Genel Bakış', href: '/admin', inventory: [9] },
    { label: 'Kullanıcılar', href: '/admin/users', inventory: [10, 11, 12, 13, 14] },
    { label: 'Eğitimler', href: '/admin/trainings', inventory: [15, 16] },
    { label: 'Değerlendirmeler', href: '/admin/assessments', inventory: [17, 18] },
    { label: 'Sertifikalar', href: '/admin/certificates', inventory: [19] },
    { label: 'Analitik', href: '/admin/analytics', inventory: [20, 21, 22] },
  ],
  instructor: [
    { label: 'Eğitimler', href: '/instructor/trainings', inventory: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32] },
    { label: 'Soru Bankası', href: '/instructor/questions', inventory: [33, 34, 35] },
    { label: 'AI Çalışma Alanı', href: '/instructor/ai', inventory: [36] },
    { label: 'Değerlendirmeler', href: '/instructor/assessments', inventory: [37, 38, 39] },
    { label: 'Atamalar', href: '/instructor/assignments', inventory: [40, 41] },
  ],
  reviewer: [
    { label: 'İnceleme Kuyruğu', href: '/reviewer/queue', inventory: [42] },
    { label: 'Eğitim İnceleme', href: '/reviewer/trainings', inventory: [43, 46, 47] },
    { label: 'Soru İnceleme', href: '/reviewer/questions', inventory: [44, 46, 47] },
    { label: 'AI Karşılaştırma', href: '/reviewer/ai', inventory: [45, 46] },
  ],
  learner: [
    { label: 'Ana Sayfa', href: '/learn', inventory: [48] },
    { label: 'Eğitimlerim', href: '/learn/trainings', inventory: [49, 50, 51, 52, 53] },
    { label: 'Değerlendirmeler', href: '/learn/assessments', inventory: [54, 55, 56, 57, 58, 59] },
    { label: 'Sertifikalarım', href: '/learn/certificates', inventory: [60, 61] },
    { label: 'Öğrenme İçgörüleri', href: '/learn/insights', inventory: [62, 63] },
    { label: 'Bildirimler', href: '/learn/notifications', inventory: [64] },
  ],
};

export function navForRole(role: WebRole): readonly NavItem[] {
  return roleNavigation[role];
}
