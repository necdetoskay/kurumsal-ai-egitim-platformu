import { describe, expect, it } from 'vitest';
import { AuthoringError, evaluateAuthoringReadiness, validateCandidate } from './index.js';

const evidence = { tenantId:'t1', sourceAssetId:'s1', evidenceSegmentId:'e1', qualityState:'PASS' as const };

describe('authoring invariants', () => {
  it('requires evidence for substantive candidates', () => {
    expect(() => validateCandidate({ id:'c1', tenantId:'t1', trainingId:'tr1', kind:'CONTENT', text:'x', evidenceRefs:[] })).toThrowError(AuthoringError);
  });
  it('rejects cross-tenant evidence', () => {
    expect(() => validateCandidate({ id:'c1', tenantId:'t1', trainingId:'tr1', kind:'CONTENT', text:'x', evidenceRefs:[{...evidence, tenantId:'t2'}] })).toThrowError(AuthoringError);
  });
  it('promotes only traceable evidence-backed output to review', () => {
    const status = evaluateAuthoringReadiness({ id:'r1', tenantId:'t1', trainingId:'tr1', schemaVersion:'1', promptId:'CI-001', promptVersion:'1', modelId:'m1', inputSnapshotHash:'h1', status:'DRAFT', candidates:[{ id:'c1', tenantId:'t1', trainingId:'tr1', kind:'OBJECTIVE', text:'Amaç', evidenceRefs:[evidence] }] });
    expect(status).toBe('READY_FOR_REVIEW');
  });
});
