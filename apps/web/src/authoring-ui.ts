export type AuthoringStatus = 'draft' | 'in-review' | 'changes-requested' | 'published';
export type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export interface EvidenceRef {
  id: string;
  sourceTitle: string;
  locator: string;
}

export interface TrainingDraft {
  id: string;
  title: string;
  status: AuthoringStatus;
  version: number;
  objectives: readonly string[];
  modules: readonly { id: string; title: string; evidence: readonly EvidenceRef[] }[];
  aiCandidates: readonly { id: string; title: string; approved: boolean }[];
}

export const demoTraining: TrainingDraft = {
  id: 'training-security-101',
  title: 'Bilgi Güvenliği Farkındalığı',
  status: 'draft',
  version: 1,
  objectives: ['Kimlik avı sinyallerini tanır', 'Şüpheli olayları doğru kanaldan bildirir'],
  modules: [
    { id: 'module-1', title: 'Kimlik Avı Temelleri', evidence: [{ id: 'ev-1', sourceTitle: 'Kurumsal Güvenlik Politikası', locator: '§4.2' }] },
    { id: 'module-2', title: 'Olay Bildirimi', evidence: [{ id: 'ev-2', sourceTitle: 'Olay Müdahale Prosedürü', locator: '§2.1' }] },
  ],
  aiCandidates: [{ id: 'ai-1', title: 'Kimlik avı örnek senaryosu', approved: false }],
};

export function canSubmitForReview(training: TrainingDraft, saveState: SaveState): boolean {
  return training.status === 'draft' && saveState !== 'saving' && saveState !== 'failed' && training.objectives.length > 0 && training.modules.length > 0;
}

export function publishedEditMessage(training: TrainingDraft): string | null {
  return training.status === 'published' ? `Yayınlanmış v${training.version} doğrudan değiştirilemez. Düzenleme yeni bir sürüm oluşturur.` : null;
}

export function aiCandidatePolicy(training: TrainingDraft): { selfPublishAllowed: false; pendingReview: number } {
  return { selfPublishAllowed: false, pendingReview: training.aiCandidates.filter((candidate) => !candidate.approved).length };
}

export function visibleEvidence(training: TrainingDraft): readonly EvidenceRef[] {
  return training.modules.flatMap((module) => module.evidence);
}
