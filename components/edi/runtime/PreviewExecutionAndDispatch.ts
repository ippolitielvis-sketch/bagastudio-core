import type { EdiExecutionRequest } from "../core/executionRequestTypes";
import type { EdiExecutionResult } from "../core/executionResultTypes";
import type { EdiExecutionRuntime } from "./EdiExecutionRuntime";
import type { EdiExecutionResultConsumerRegistry } from "./ExecutionResultConsumerRegistry";
import type { EdiExecutionResultDispatcher } from "./EdiExecutionResultDispatcher";

export type RunEdiPreviewExecutionAndDispatchInput = {
  request: EdiExecutionRequest;
  executionRuntime: EdiExecutionRuntime;
  executionResultDispatcher: EdiExecutionResultDispatcher;
  consumerRegistry: EdiExecutionResultConsumerRegistry;
};

export const runEdiPreviewExecutionAndDispatch = (
  input: RunEdiPreviewExecutionAndDispatchInput,
): EdiExecutionResult => {
  const result = input.executionRuntime.runExecution({
    request: input.request,
  });

  input.executionResultDispatcher.dispatchResult({
    result,
    consumerRegistry: input.consumerRegistry,
  });

  return result;
};
