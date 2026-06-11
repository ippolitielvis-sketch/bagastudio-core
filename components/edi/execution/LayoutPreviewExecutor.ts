import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";

const LAYOUT_PREVIEW_EXECUTOR_ID = "edi.executor.layout.preview";

export const layoutPreviewExecutor: EdiExecutor = {
  id: LAYOUT_PREVIEW_EXECUTOR_ID,
  name: "EDI Layout Preview Executor",
  capabilities: [
    {
      domain: "layout",
      modes: ["plan", "preview", "dry-run"],
      description: "Read-only layout preview execution descriptor.",
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
        domain: "layout",
        mode: request.mode,
        actionCount: request.actionIds.length,
        intentCount: request.intentIds.length,
        contextCount: request.contextIds.length,
        previewOnly: true,
        sideEffectFree: true,
      },
      executorId: LAYOUT_PREVIEW_EXECUTOR_ID,
      metadata: {
        source: "LayoutPreviewExecutor",
        reason: "read-only layout preview execution descriptor",
      },
    }),
};
