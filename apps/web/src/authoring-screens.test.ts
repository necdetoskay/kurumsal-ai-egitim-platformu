import { describe, expect, it } from 'vitest';
import { screenFor } from './screens';

describe('instructor authoring screen inventory', () => {
  it('registers the create edit preview review and version flow', () => {
    const routes = [
      '/instructor/trainings/new',
      '/instructor/trainings/editor',
      '/instructor/trainings/modules',
      '/instructor/trainings/sources',
      '/instructor/trainings/objectives',
      '/instructor/trainings/preview',
      '/instructor/trainings/review',
      '/instructor/trainings/versions',
      '/instructor/trainings/detail',
      '/instructor/ai',
    ];
    for (const route of routes) expect(screenFor('instructor', route)).not.toBeNull();
  });

  it('fails closed when another role asks for instructor authoring routes', () => {
    expect(screenFor('learner', '/instructor/trainings/editor')).toBeNull();
    expect(screenFor('reviewer', '/instructor/trainings/sources')).toBeNull();
    expect(screenFor('tenant_admin', '/instructor/ai')).toBeNull();
  });

  it('exposes save failure and evidence quality states', () => {
    expect(screenFor('instructor', '/instructor/trainings/editor')?.workflowStates).toContain('save-failed');
    expect(screenFor('instructor', '/instructor/trainings/sources')?.workflowStates).toContain('quality-blocked');
    expect(screenFor('instructor', '/instructor/trainings/review')?.workflowStates).toContain('blocked');
  });
});
