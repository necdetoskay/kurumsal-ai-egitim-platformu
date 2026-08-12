export const modelStatuses = ['DISCOVERED','CANDIDATE','EVALUATING','QUALIFIED','CANARY','ACTIVE','DEPRECATED','RETIRED'] as const;
export type ModelStatus = (typeof modelStatuses)[number];

export interface CapabilityRequest {
  tenantId: string;
  capability: string;
  requiredTier: number;
  language?: string;
  structuredOutputRequired?: boolean;
  budgetClass?: 'economy' | 'standard' | 'premium';
  maxLatencyMs?: number;
  allowedProviders?: readonly string[];
  forbiddenProviders?: readonly string[];
  requiredDataPolicy?: string;
}

export interface ModelRegistryEntry {
  id: string;
  provider: string;
  providerModelName: string;
  status: ModelStatus;
  eligibleTiers: readonly number[];
  capabilities: readonly string[];
  languages: readonly string[];
  structuredOutputSupport: boolean;
  qualified: boolean;
  healthy: boolean;
  qualityScore: number;
  latencyP95Ms: number;
  inputCost: number;
  outputCost: number;
  dataPolicies: readonly string[];
}

export interface RoutingPolicy {
  minimumQuality: number;
  preference: 'cost' | 'latency' | 'quality';
}

export class AiRuntimeError extends Error {
  constructor(public readonly code: 'NO_ELIGIBLE_MODEL' | 'PRIVACY_POLICY_BLOCKED' | 'BUDGET_EXHAUSTED' | 'STRUCTURED_OUTPUT_INVALID') {
    super(code);
  }
}

export function eligibleModels(request: CapabilityRequest, registry: readonly ModelRegistryEntry[], policy: RoutingPolicy): ModelRegistryEntry[] {
  const providerAllowed = (m: ModelRegistryEntry) => {
    if (request.allowedProviders && !request.allowedProviders.includes(m.provider)) return false;
    if (request.forbiddenProviders?.includes(m.provider)) return false;
    return true;
  };

  return registry.filter((m) =>
    (m.status === 'QUALIFIED' || m.status === 'CANARY' || m.status === 'ACTIVE') &&
    m.qualified &&
    m.healthy &&
    m.capabilities.includes(request.capability) &&
    m.eligibleTiers.includes(request.requiredTier) &&
    (!request.language || m.languages.includes(request.language)) &&
    (!request.structuredOutputRequired || m.structuredOutputSupport) &&
    (!request.requiredDataPolicy || m.dataPolicies.includes(request.requiredDataPolicy)) &&
    providerAllowed(m) &&
    m.qualityScore >= policy.minimumQuality &&
    (!request.maxLatencyMs || m.latencyP95Ms <= request.maxLatencyMs)
  );
}

export function routeModel(request: CapabilityRequest, registry: readonly ModelRegistryEntry[], policy: RoutingPolicy): ModelRegistryEntry {
  const candidates = eligibleModels(request, registry, policy);
  if (candidates.length === 0) throw new AiRuntimeError('NO_ELIGIBLE_MODEL');

  const sorted = [...candidates].sort((a, b) => {
    if (policy.preference === 'quality') return b.qualityScore - a.qualityScore || a.id.localeCompare(b.id);
    if (policy.preference === 'latency') return a.latencyP95Ms - b.latencyP95Ms || a.id.localeCompare(b.id);
    const aCost = a.inputCost + a.outputCost;
    const bCost = b.inputCost + b.outputCost;
    return aCost - bCost || a.latencyP95Ms - b.latencyP95Ms || a.id.localeCompare(b.id);
  });
  return sorted[0]!;
}

export interface PromptVersion {
  promptId: string;
  version: number;
  capability: string;
  schemaVersion: string;
  template: string;
  active: boolean;
}

export function resolvePrompt(prompts: readonly PromptVersion[], capability: string): PromptVersion {
  const matches = prompts.filter((p) => p.capability === capability && p.active);
  if (matches.length === 0) throw new Error('PROMPT_NOT_FOUND');
  return [...matches].sort((a, b) => b.version - a.version)[0]!;
}

export interface StructuredOutputValidator<T> {
  validate(value: unknown): { ok: true; value: T } | { ok: false; errors: readonly string[] };
}

export function requireStructuredOutput<T>(validator: StructuredOutputValidator<T>, value: unknown): T {
  const result = validator.validate(value);
  if (!result.ok) throw new AiRuntimeError('STRUCTURED_OUTPUT_INVALID');
  return result.value;
}

export interface ProviderAdapterRequest {
  model: ModelRegistryEntry;
  prompt: string;
  schemaVersion: string;
}

export interface ProviderAdapterResponse {
  output: unknown;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface ProviderAdapter {
  provider: string;
  invoke(request: ProviderAdapterRequest): Promise<ProviderAdapterResponse>;
}

export type FailureKind = 'TRANSIENT' | 'PRIVACY' | 'SAFETY' | 'BUDGET' | 'PERMANENT';

export function mayFallback(failure: FailureKind): boolean {
  return failure === 'TRANSIENT';
}

export function boundedRetryCount(requested: number, max = 2): number {
  if (requested < 0) return 0;
  return Math.min(requested, max);
}

export interface ExecutionTrace {
  tenantId: string;
  capability: string;
  promptId: string;
  promptVersion: number;
  schemaVersion: string;
  modelId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCost: number;
}

export function buildExecutionTrace(input: Omit<ExecutionTrace,'estimatedCost'>, model: ModelRegistryEntry): ExecutionTrace {
  return {
    ...input,
    estimatedCost: input.inputTokens * model.inputCost + input.outputTokens * model.outputCost,
  };
}
