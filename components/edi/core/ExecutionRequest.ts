import type { EdiExecutionRequest, EdiExecutionRequestInput } from "./executionRequestTypes";

export const createEdiExecutionRequest = (input: EdiExecutionRequestInput): EdiExecutionRequest => {
  const timestamp = input.timestamp ?? Date.now();

  return {
    id: input.id ?? `execution-request:${input.executionPlanId}:${timestamp}`,
    timestamp,
    executionPlanId: input.executionPlanId,
    actionIds: [...input.actionIds],
    intentIds: [...input.intentIds],
    contextIds: [...input.contextIds],
    mode: input.mode ?? "plan",
    status: input.status ?? "created",
    priority: input.priority ?? "medium",
    targetDomain: input.targetDomain,
    payload: input.payload,
    reason: input.reason,
    explanation: input.explanation,
    metadata: input.metadata,
  };
};
