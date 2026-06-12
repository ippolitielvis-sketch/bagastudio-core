import { createEdiExecutionResult } from "../core/ExecutionResult";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";
import type { EdiExecutionResult } from "../core/executionResultTypes";
import {
  createEdiIntegrationBoundaryRequest,
  type EdiIntegrationBoundaryValidationIssue,
} from "../integration/EdiIntegrationBoundary";
import type { EdiExecutionRuntime } from "./EdiExecutionRuntime";
import type { EdiExecutionResultConsumerRegistry } from "./ExecutionResultConsumerRegistry";
import type { EdiExecutionResultDispatcher } from "./EdiExecutionResultDispatcher";

export type RunEdiPreviewExecutionAndDispatchInput = {
  request: EdiExecutionRequest;
  executionRuntime: EdiExecutionRuntime;
  executionResultDispatcher: EdiExecutionResultDispatcher;
  consumerRegistry: EdiExecutionResultConsumerRegistry;
};

const createBoundaryValidationFailedResult = (
  request: EdiExecutionRequest,
  issues: readonly EdiIntegrationBoundaryValidationIssue[],
): EdiExecutionResult =>
  createEdiExecutionResult({
    executionRequestId: request.id || "boundary:missing-request-id",
    executionPlanId: request.executionPlanId,
    actionIds: request.actionIds,
    intentIds: request.intentIds,
    contextIds: request.contextIds,
    mode: request.mode || "preview",
    status: "failed",
    targetDomain: request.targetDomain,
    error: {
      code: "EDI_INTEGRATION_BOUNDARY_VALIDATION_FAILED",
      message: "EDI integration boundary validation failed.",
      details: {
        issues,
      },
    },
    metadata: {
      source: "EdiIntegrationBoundary",
      reason: "Integration boundary validation failed before preview execution.",
      stage: "pre-runtime",
      issues,
    },
  });

export const runEdiPreviewExecutionAndDispatch = (
  input: RunEdiPreviewExecutionAndDispatchInput,
): EdiExecutionResult => {
  const boundaryRequest = createEdiIntegrationBoundaryRequest(input.request);

  if (!boundaryRequest.request) {
    const result = createBoundaryValidationFailedResult(
      input.request,
      boundaryRequest.validation.issues,
    );

    input.executionResultDispatcher.dispatchResult({
      result,
      consumerRegistry: input.consumerRegistry,
    });

    return result;
  }

  const result = input.executionRuntime.runExecution({
    request: boundaryRequest.request,
  });

  input.executionResultDispatcher.dispatchResult({
    result,
    consumerRegistry: input.consumerRegistry,
  });

  return result;
};
