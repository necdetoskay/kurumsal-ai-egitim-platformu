import { describe, expect, it } from 'vitest';
import { AgentRuntimeError, assertNoPrivilegeExpansion, authorizeTool, higherPriorityMemory, validateDerivedMemory, validateHandoff } from './index.js';

const agent = { id: 'qg', capability: 'question-generation', allowedTools: ['source.read', 'schema.validate'] } as const;

describe('agent runtime invariants', () => {
  it('denies tools not explicitly allowed', () => {
    expect(() => authorizeTool(agent, { tenantId: 't1', actorId: 'u1', agentId: 'qg', tool: 'domain.publish' })).toThrowError(new AgentRuntimeError('TOOL_DENIED'));
  });

  it('prevents privilege expansion', () => {
    expect(() => assertNoPrivilegeExpansion(agent, ['source.read', 'domain.publish'])).toThrowError(new AgentRuntimeError('PRIVILEGE_EXPANSION'));
  });

  it('keeps domain memory above retrieval and conversation memory', () => {
    expect(higherPriorityMemory('M3', 'M2')).toBe('M3');
    expect(higherPriorityMemory('M3', 'M5')).toBe('M3');
  });

  it('rejects cross-tenant handoff', () => {
    expect(() => validateHandoff({ handoffVersion: '1.0', tenantId: 't2', correlationId: 'c1', fromCapability: 'a', toCapability: 'b', inputSchemaVersion: '1', payload: {}, evidenceRefs: [] }, 't1')).toThrowError(new AgentRuntimeError('TENANT_BOUNDARY_VIOLATION'));
  });

  it('requires derived-memory lineage', () => {
    expect(() => validateDerivedMemory({ tenantId: 't1', recordType: 'insight', evidenceRefs: ['e1'], sourceVersions: ['v1'], promptVersion: 'p1', modelId: 'm1', provider: 'provider', generationRunId: 'r1', createdAt: new Date() }, 't1')).not.toThrow();
  });
});
