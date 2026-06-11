import { previewExecutionResultConsumer } from "../execution/PreviewExecutionResultConsumer";
import type { EdiExecutionResultConsumer } from "../core/executionResultConsumerTypes";
import {
  createEdiExecutionResultConsumerRegistry,
  type EdiExecutionResultConsumerRegistry,
} from "./ExecutionResultConsumerRegistry";

export const ediPreviewExecutionResultConsumers: readonly EdiExecutionResultConsumer[] = [
  previewExecutionResultConsumer,
];

export const createEdiPreviewExecutionResultConsumerRegistry =
  (): EdiExecutionResultConsumerRegistry =>
    createEdiExecutionResultConsumerRegistry({
      consumers: ediPreviewExecutionResultConsumers,
    });
