import { describe, expect, it } from 'vitest';
import { AiRuntimeError, boundedRetryCount, buildExecutionTrace, mayFallback, requireStructuredOutput, routeModel, type ModelRegistryEntry } from './index.js';

const base: ModelRegistryEntry = {
  id: 'm1', provider: 'p1', providerModelName: 'x', status: 'ACTIVE', eligibleTiers: [2], capabilities: ['question_generation'],
  languages: ['tr'], structuredOutputSupport: true, qualified: true, healthy: true, qualityScore: 90, latencyP95Ms: 1000,
  inputCost: 0.1, outputCost: 0.2, dataPolicies: ['standard'],
};

const request = { tenantId: 't1', capability: 'question_generation', requiredTier: 2, language: 'tr', structuredOutputRequired: true, requiredDataPolicy: 'standard' } as const;

describe('AI runtime router', () => {
  it('routes cheapest qualified candidate after hard filters', () => {
    const expensive = { ...base, id: 'm2', inputCost: 0.5, outputCost: 0.5, qualityScore: 95 };
    expect(routeModel(request, [expensive, base], { minimumQuality: 88, preference: 'cost' }).id).toBe('m1');
  });

  it('never routes unqualified or retired models', () => {
    const bad = { ...base, status: 'RETIRED' as const, qualified: false };
    expect(() => routeModel(request, [bad], { minimumQuality: 88, preference: 'cost' })).toThrowError(AiRuntimeError);
  });

  it('enforces provider/data policy before optimization', () => {
    const blocked = { ...base, id: 'cheap', provider: 'blocked', inputCost: 0, outputCost: 0 };
    const selected = routeModel({ ...request, forbiddenProviders: ['blocked'] }, [blocked, base], { minimumQuality: 88, preference: 'cost' });
    expect(selected.id).toBe('m1');
  });

  it('is deterministic for equivalent candidates', () => {
    const b = { ...base, id: 'b' };
    const a = { ...base, id: 'a' };
    expect(routeModel(request, [b, a], { minimumQuality: 88, preference: 'cost' }).id).toBe('a');
  });

  it('fails closed on invalid structured output', () => {
    expect(() => requireStructuredOutput({ validate: () => ({ ok: false as const, errors: ['bad'] }) }, {})).toThrowError(AiRuntimeError);
  });

  it('allows fallback only for transient failures and bounds retry', () => {
    expect(mayFallback('TRANSIENT')).toBe(true);
    expect(mayFallback('PRIVACY')).toBe(false);
    expect(mayFallback('SAFETY')).toBe(false);
    expect(boundedRetryCount(10)).toBe(2);
  });

  it('records deterministic execution telemetry', () => {
    const trace = buildExecutionTrace({ tenantId: 't1', capability: 'question_generation', promptId: 'QG-001', promptVersion: 1, schemaVersion: 'v1', modelId: 'm1', provider: 'p1', inputTokens: 10, outputTokens: 5, latencyMs: 500 }, base);
    expect(trace.estimatedCost).toBe(2);
  });
});
