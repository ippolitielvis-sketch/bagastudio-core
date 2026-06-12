import type { EdiExecutionRequest } from "../../core/executionRequestTypes";
import type { EdiExecutionResult } from "../../core/executionResultTypes";
import type { EdiExecutionRuntime } from "../../runtime/EdiExecutionRuntime";

export type RunRecognitionRuntimeAdapterInput = {
  request: EdiExecutionRequest;
  executionRuntime: EdiExecutionRuntime;
};

export const runRecognitionRuntimeAdapter = (
  input: RunRecognitionRuntimeAdapterInput,
): EdiExecutionResult =>
  input.executionRuntime.runExecution({
    request: input.request,
  });
