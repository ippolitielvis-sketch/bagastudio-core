import {
  createEdiPreviewExecutionResultConsumerRegistry,
} from "./PreviewExecutionResultConsumerRegistry";
import type { EdiExecutionResultConsumerRegistry } from "./ExecutionResultConsumerRegistry";

export const createEdiPreviewExecutionResultConsumerRuntime =
  (): EdiExecutionResultConsumerRegistry =>
    createEdiPreviewExecutionResultConsumerRegistry();
