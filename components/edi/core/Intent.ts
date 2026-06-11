import type { EdiIntent, EdiIntentInput } from "./intentTypes";

export const createEdiIntent = (input: EdiIntentInput): EdiIntent => {
  const timestamp = input.timestamp ?? Date.now();

  return {
    id: input.id ?? `intent:${input.contextId}:${timestamp}`,
    timestamp,
    contextId: input.contextId,
    cognitiveState: input.cognitiveState,
    kind: input.kind,
    confidence: input.confidence,
    priority: input.priority ?? "medium",
    targetDomain: input.targetDomain,
    reason: input.reason,
    explanation: input.explanation,
    metadata: input.metadata,
  };
};
