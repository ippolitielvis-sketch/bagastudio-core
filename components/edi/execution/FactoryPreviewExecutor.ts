import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";

const FACTORY_PREVIEW_EXECUTOR_ID = "edi.executor.factory.preview";

export const factoryPreviewExecutor: EdiExecutor = {
  id: FACTORY_PREVIEW_EXECUTOR_ID,
  name: "EDI Factory Preview Executor",
  capabilities: [
    {
      domain: "factory",
      modes: ["plan", "preview", "dry-run"],
      description: "Read-only factory preview execution descriptor.",
    },
  ],
  execute: (request: EdiExecutionRequest) =>
    createEdiExecutionResult({
      executionRequestId: request.id,
      executionPlanId: request.executionPlanId,
      actionIds: request.actionIds,
      intentIds: request.intentIds,
      contextIds: request.contextIds,
      mode: request.mode,
      status: "succeeded",
      targetDomain: request.targetDomain,
      output: {
        domain: "factory",
        mode: request.mode,
        actionCount: request.actionIds.length,
        intentCount: request.intentIds.length,
        contextCount: request.contextIds.length,
        previewOnly: true,
        sideEffectFree: true,
      },
      executorId: FACTORY_PREVIEW_EXECUTOR_ID,
      metadata: {
        source: "FactoryPreviewExecutor",
        reason: "read-only factory preview execution descriptor",
      },
    }),
};
