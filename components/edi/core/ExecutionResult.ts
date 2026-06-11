import type { EdiExecutionResult, EdiExecutionResultInput } from "./executionResultTypes";

export const createEdiExecutionResult = (input: EdiExecutionResultInput): EdiExecutionResult => {
  const timestamp = input.timestamp ?? Date.now();

  return {
    id: input.id ?? `execution-result:${input.executionRequestId}:${timestamp}`,
    timestamp,
    executionRequestId: input.executionRequestId,
    executionPlanId: input.executionPlanId,
    actionIds: [...input.actionIds],
    intentIds: [...input.intentIds],
    contextIds: [...input.contextIds],
    mode: input.mode,
    status: input.status ?? "not-run",
    targetDomain: input.targetDomain,
    output: input.output,
    error: input.error,
    diagnostics: input.diagnostics ? [...input.diagnostics] : undefined,
    executorId: input.executorId,
    durationMs: input.durationMs,
    metadata: input.metadata,
  };
};
