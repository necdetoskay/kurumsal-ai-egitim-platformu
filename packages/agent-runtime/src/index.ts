export type MemoryTier = 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5';

export interface AgentDefinition {
  id: string;
  capability: string;
  allowedTools: readonly string[];
}

export interface ToolInvocationContext {
  tenantId: string;
  actorId: string;
  agentId: string;
  tool: string;
}

export interface HandoffEnvelope<T = unknown> {
  handoffVersion: '1.0';
  tenantId: string;
  correlationId: string;
  parentRunId?: string;
  fromCapability: string;
  toCapability: string;
  inputSchemaVersion: string;
  payload: T;
  evidenceRefs: readonly string[];
  policyContextRef?: string;
}

export interface DerivedMemoryRecord {
  tenantId: string;
  recordType: string;
  evidenceRefs: readonly string[];
  sourceVersions: readonly string[];
  promptVersion: string;
  modelId: string;
  provider: string;
  generationRunId: string;
  confidence?: number;
  createdAt: Date;
}

export interface ToolAuditRecord extends ToolInvocationContext {
  correlationId: string;
  runId: string;
  outcome: 'ALLOWED' | 'DENIED' | 'SUCCEEDED' | 'FAILED';
  occurredAt: Date;
}

export class AgentRuntimeError extends Error {
  constructor(public readonly code: 'TOOL_DENIED' | 'TENANT_BOUNDARY_VIOLATION' | 'PRIVILEGE_EXPANSION' | 'INVALID_HANDOFF') {
    super(code);
  }
}

export function authorizeTool(agent: AgentDefinition, invocation: ToolInvocationContext): void {
  if (agent.id !== invocation.agentId) throw new AgentRuntimeError('TOOL_DENIED');
  if (!agent.allowedTools.includes(invocation.tool)) throw new AgentRuntimeError('TOOL_DENIED');
}

export function assertNoPrivilegeExpansion(current: AgentDefinition, proposedAllowedTools: readonly string[]): void {
  for (const tool of proposedAllowedTools) {
    if (!current.allowedTools.includes(tool)) throw new AgentRuntimeError('PRIVILEGE_EXPANSION');
  }
}

const memoryPriority: Record<MemoryTier, number> = { M3: 6, M2: 5, M4: 4, M1: 3, M0: 2, M5: 1 };

export function higherPriorityMemory(a: MemoryTier, b: MemoryTier): MemoryTier {
  return memoryPriority[a] >= memoryPriority[b] ? a : b;
}

export function validateHandoff<T>(handoff: HandoffEnvelope<T>, expectedTenantId: string): void {
  if (handoff.tenantId !== expectedTenantId) throw new AgentRuntimeError('TENANT_BOUNDARY_VIOLATION');
  if (!handoff.correlationId || !handoff.fromCapability || !handoff.toCapability || !handoff.inputSchemaVersion) {
    throw new AgentRuntimeError('INVALID_HANDOFF');
  }
}

export function validateDerivedMemory(record: DerivedMemoryRecord, expectedTenantId: string): void {
  if (record.tenantId !== expectedTenantId) throw new AgentRuntimeError('TENANT_BOUNDARY_VIOLATION');
  if (!record.promptVersion || !record.modelId || !record.provider || !record.generationRunId) {
    throw new Error('INVALID_DERIVED_MEMORY_LINEAGE');
  }
}
