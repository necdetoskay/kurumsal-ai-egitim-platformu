import { describe, expect, it } from 'vitest';
import { trainingAssignmentAudiences, trainingAudienceResolutions, trainingAudienceResolutionMembers } from './training-audience-schema.js';

describe('training audience schema', () => {
  it('exports typed audience and immutable resolution lineage tables', () => {
    expect(trainingAssignmentAudiences).toBeDefined();
    expect(trainingAudienceResolutions).toBeDefined();
    expect(trainingAudienceResolutionMembers).toBeDefined();
  });
});
