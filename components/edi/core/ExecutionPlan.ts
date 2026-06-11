import type { EdiExecutionPlan, EdiExecutionPlanInput } from "./executionPlanTypes";

export const createEdiExecutionPlan = (input: EdiExecutionPlanInput): EdiExecutionPlan => {
  const timestamp = input.timestamp ?? Date.now();

  return {
    id: input.id ?? `execution-plan:${timestamp}`,
    timestamp,
    actionIds: [...input.actionIds],
    intentIds: [...input.intentIds],
    contextIds: [...input.contextIds],
    status: input.status ?? "draft",
    priority: input.priority ?? "medium",
    targetDomain: input.targetDomain,
    payload: input.payload,
    reason: input.reason,
    explanation: input.explanation,
    metadata: input.metadata,
  };
};
