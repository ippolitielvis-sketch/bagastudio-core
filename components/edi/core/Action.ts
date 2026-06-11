import type { EdiAction, EdiActionInput } from "./actionTypes";

export const createEdiAction = (input: EdiActionInput): EdiAction => {
  const timestamp = input.timestamp ?? Date.now();

  return {
    id: input.id ?? `action:${input.intentId}:${timestamp}`,
    timestamp,
    intentId: input.intentId,
    contextId: input.contextId,
    kind: input.kind,
    status: input.status ?? "proposed",
    priority: input.priority ?? "medium",
    confidence: input.confidence,
    targetDomain: input.targetDomain,
    payload: input.payload,
    reason: input.reason,
    explanation: input.explanation,
    metadata: input.metadata,
  };
};
