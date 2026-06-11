import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";

const IMPORT_PREVIEW_EXECUTOR_ID = "edi.executor.import.preview";

export const importPreviewExecutor: EdiExecutor = {
  id: IMPORT_PREVIEW_EXECUTOR_ID,
  name: "EDI Import Preview Executor",
  capabilities: [
    {
      domain: "import",
      modes: ["plan", "preview", "dry-run"],
      description: "Read-only import preview execution descriptor.",
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
        domain: "import",
        mode: request.mode,
        actionCount: request.actionIds.length,
        intentCount: request.intentIds.length,
        contextCount: request.contextIds.length,
        previewOnly: true,
        sideEffectFree: true,
      },
      executorId: IMPORT_PREVIEW_EXECUTOR_ID,
      metadata: {
        source: "ImportPreviewExecutor",
        reason: "read-only import preview execution descriptor",
      },
    }),
};
