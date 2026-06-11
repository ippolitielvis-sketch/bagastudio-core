import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";

const PRICING_PREVIEW_EXECUTOR_ID = "edi.executor.pricing.preview";

export const pricingPreviewExecutor: EdiExecutor = {
  id: PRICING_PREVIEW_EXECUTOR_ID,
  name: "EDI Pricing Preview Executor",
  capabilities: [
    {
      domain: "pricing",
      modes: ["plan", "preview", "dry-run"],
      description: "Read-only pricing preview execution descriptor.",
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
        domain: "pricing",
        mode: request.mode,
        actionCount: request.actionIds.length,
        intentCount: request.intentIds.length,
        contextCount: request.contextIds.length,
        previewOnly: true,
        sideEffectFree: true,
      },
      executorId: PRICING_PREVIEW_EXECUTOR_ID,
      metadata: {
        source: "PricingPreviewExecutor",
        reason: "read-only pricing preview execution descriptor",
      },
    }),
};
