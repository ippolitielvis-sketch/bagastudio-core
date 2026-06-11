import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";
import type { EdiExecutionResult } from "../core/executionResultTypes";
import type { EdiExecutorSelector } from "./ExecutorSelector";

type EdiExecutorRegistryForSelector = Parameters<
  EdiExecutorSelector["selectExecutors"]
>[0]["registry"];

export type CreateEdiExecutionRuntimeInput = {
  executorSelector: EdiExecutorSelector;
  executorRegistry: EdiExecutorRegistryForSelector;
};

export type RunEdiExecutionInput = {
  request: EdiExecutionRequest;
};

export type EdiExecutionRuntime = {
  runExecution(input: RunEdiExecutionInput): EdiExecutionResult;
};

const createFailedExecutionResult = (
  request: EdiExecutionRequest,
  message: string,
  code: string,
  executorId?: string,
): EdiExecutionResult =>
  createEdiExecutionResult({
    executionRequestId: request.id,
    executionPlanId: request.executionPlanId,
    actionIds: request.actionIds,
    intentIds: request.intentIds,
    contextIds: request.contextIds,
    mode: request.mode,
    status: "failed",
    targetDomain: request.targetDomain,
    error: {
      code,
      message,
    },
    executorId,
    metadata: {
      source: "EdiExecutionRuntime",
      reason: message,
    },
  });

const isPromiseLikeExecutionResult = (
  result: EdiExecutionResult | Promise<EdiExecutionResult>,
): result is Promise<EdiExecutionResult> =>
  typeof (result as Promise<EdiExecutionResult>).then === "function";

const runExecutor = (
  executor: EdiExecutor,
  request: EdiExecutionRequest,
): EdiExecutionResult => {
  try {
    const result = executor.execute(request);

    if (isPromiseLikeExecutionResult(result)) {
      return createFailedExecutionResult(
        request,
        "Async executors are not supported by EdiExecutionRuntime.",
        "EDI_ASYNC_EXECUTOR_UNSUPPORTED",
        executor.id,
      );
    }

    return result;
  } catch (error) {
    return createFailedExecutionResult(
      request,
      error instanceof Error ? error.message : "Executor failed with an unknown error.",
      "EDI_EXECUTOR_FAILED",
      executor.id,
    );
  }
};

export const createEdiExecutionRuntime = (
  input: CreateEdiExecutionRuntimeInput,
): EdiExecutionRuntime => ({
  runExecution: ({ request }) => {
    const selection = input.executorSelector.selectExecutors({
      request,
      registry: input.executorRegistry,
    });
    const executor = selection.executors[0];

    if (!executor) {
      return createFailedExecutionResult(
        request,
        "No EDI executor found for execution request.",
        "EDI_EXECUTOR_NOT_FOUND",
      );
    }

    return runExecutor(executor, request);
  },
});
