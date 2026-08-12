import type { TrainingDraft } from './authoring';

export type AuthoringApiResult =
  | { ok: true; status: 200 | 201 | 202; draft: TrainingDraft }
  | { ok: false; status: 400 | 401 | 403 | 409 | 422 | 500; code: string };

export type AuthoringTransport = {
  create(input: Pick<TrainingDraft, 'title'>): Promise<AuthoringApiResult>;
  save(draft: TrainingDraft): Promise<AuthoringApiResult>;
  submitForReview(draftId: string, version: number): Promise<AuthoringApiResult>;
};

export type AuthoringUiOutcome =
  | { state: 'success'; draft: TrainingDraft }
  | { state: 'unauthenticated' }
  | { state: 'forbidden' }
  | { state: 'conflict' }
  | { state: 'validation-error' }
  | { state: 'error' };

export function mapAuthoringApiResult(result: AuthoringApiResult): AuthoringUiOutcome {
  if (result.ok) return { state: 'success', draft: result.draft };
  if (result.status === 401) return { state: 'unauthenticated' };
  if (result.status === 403) return { state: 'forbidden' };
  if (result.status === 409) return { state: 'conflict' };
  if (result.status === 400 || result.status === 422) return { state: 'validation-error' };
  return { state: 'error' };
}
