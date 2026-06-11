import {
  createEdiExecutionRuntime,
  type EdiExecutionRuntime,
} from "./EdiExecutionRuntime";
import { createEdiExecutorSelector } from "./ExecutorSelector";
import { createEdiPreviewExecutorRegistry } from "./PreviewExecutorRegistry";

export const createEdiPreviewExecutionRuntime = (): EdiExecutionRuntime => {
  const executorRegistry = createEdiPreviewExecutorRegistry();
  const executorSelector = createEdiExecutorSelector();

  return createEdiExecutionRuntime({
    executorRegistry,
    executorSelector,
  });
};
