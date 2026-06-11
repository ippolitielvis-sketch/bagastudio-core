import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";

const JOIN_PREVIEW_EXECUTOR_ID = "edi.executor.join.preview";

export const joinPreviewExecutor: EdiExecutor = {
  id: JOIN_PREVIEW_EXECUTOR_ID,
  name: "EDI Join Preview Executor",
  capabilities: [
    {
      domain: "join",
      modes: ["plan", "preview", "dry-run"],
      description: "Read-only join preview execution descriptor.",
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
        domain: "join",
        mode: request.mode,
        actionCount: request.actionIds.length,
        intentCount: request.intentIds.length,
        contextCount: request.contextIds.length,
        previewOnly: true,
        sideEffectFree: true,
      },
      executorId: JOIN_PREVIEW_EXECUTOR_ID,
      metadata: {
        source: "JoinPreviewExecutor",
        reason: "read-only join preview execution descriptor",
      },
    }),
};
