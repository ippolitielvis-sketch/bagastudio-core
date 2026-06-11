import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";
import type { EdiExecutorRegistry } from "./ExecutorRegistry";

export type SelectEdiExecutorsInput = {
  request: EdiExecutionRequest;
  registry: EdiExecutorRegistry;
};

export type EdiExecutorSelection = {
  requestId: string;
  executors: readonly EdiExecutor[];
};

export type EdiExecutorSelector = {
  selectExecutors(input: SelectEdiExecutorsInput): EdiExecutorSelection;
};

export const createEdiExecutorSelector = (): EdiExecutorSelector => ({
  selectExecutors: (input) => {
    const executors = input.registry.findExecutors({
      domain: input.request.targetDomain,
      mode: input.request.mode,
    });

    return {
      requestId: input.request.id,
      executors,
    };
  },
});
