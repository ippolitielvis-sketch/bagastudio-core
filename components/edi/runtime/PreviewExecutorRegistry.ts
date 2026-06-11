import { factoryPreviewExecutor } from "../execution/FactoryPreviewExecutor";
import { importPreviewExecutor } from "../execution/ImportPreviewExecutor";
import { joinPreviewExecutor } from "../execution/JoinPreviewExecutor";
import { layoutPreviewExecutor } from "../execution/LayoutPreviewExecutor";
import { pricingPreviewExecutor } from "../execution/PricingPreviewExecutor";
import { recognitionPreviewExecutor } from "../execution/RecognitionPreviewExecutor";
import { createEdiExecutorRegistry } from "./ExecutorRegistry";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutorRegistry } from "./ExecutorRegistry";

export const ediPreviewExecutors: readonly EdiExecutor[] = [
  importPreviewExecutor,
  recognitionPreviewExecutor,
  layoutPreviewExecutor,
  joinPreviewExecutor,
  pricingPreviewExecutor,
  factoryPreviewExecutor,
];

export const createEdiPreviewExecutorRegistry = (): EdiExecutorRegistry =>
  createEdiExecutorRegistry({
    executors: ediPreviewExecutors,
  });
