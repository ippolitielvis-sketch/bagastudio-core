import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";

const RECOGNITION_PREVIEW_EXECUTOR_ID = "edi.executor.recognition.preview";

export const recognitionPreviewExecutor: EdiExecutor = {
  id: RECOGNITION_PREVIEW_EXECUTOR_ID,
  name: "EDI Recognition Preview Executor",
  capabilities: [
    {
      domain: "recognition",
      modes: ["plan", "preview", "dry-run"],
      description: "Read-only recognition preview execution descriptor.",
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
        domain: "recognition",
        mode: request.mode,
        actionCount: request.actionIds.length,
        intentCount: request.intentIds.length,
        contextCount: request.contextIds.length,
        previewOnly: true,
        sideEffectFree: true,
      },
      executorId: RECOGNITION_PREVIEW_EXECUTOR_ID,
      metadata: {
        source: "RecognitionPreviewExecutor",
        reason: "read-only recognition preview execution descriptor",
      },
    }),
};
