import {
  createEdiExecutionResultDispatcher,
  type EdiExecutionResultDispatcher,
} from "./EdiExecutionResultDispatcher";
import {
  createEdiPreviewExecutionRuntime,
} from "./PreviewExecutionRuntime";
import {
  createEdiPreviewExecutionResultConsumerRuntime,
} from "./PreviewExecutionResultConsumerRuntime";
import type { EdiExecutionRuntime } from "./EdiExecutionRuntime";
import type { EdiExecutionResultConsumerRegistry } from "./ExecutionResultConsumerRegistry";

export type EdiPreviewExecutionAndConsumptionWiring = {
  executionRuntime: EdiExecutionRuntime;
  consumerRegistry: EdiExecutionResultConsumerRegistry;
  executionResultDispatcher: EdiExecutionResultDispatcher;
};

export const createEdiPreviewExecutionAndConsumptionWiring =
  (): EdiPreviewExecutionAndConsumptionWiring => ({
    executionRuntime: createEdiPreviewExecutionRuntime(),
    consumerRegistry: createEdiPreviewExecutionResultConsumerRuntime(),
    executionResultDispatcher: createEdiExecutionResultDispatcher(),
  });
