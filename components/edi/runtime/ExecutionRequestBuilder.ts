import { createEdiExecutionRequest } from "../core/ExecutionRequest";
import type { EdiExecutionPlan } from "../core/executionPlanTypes";
import type {
  EdiExecutionRequest,
  EdiExecutionRequestMetadata,
  EdiExecutionRequestMode,
  EdiExecutionRequestPayload,
  EdiExecutionRequestPriority,
  EdiExecutionRequestStatus,
} from "../core/executionRequestTypes";
import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type BuildEdiExecutionRequestInput = {
  executionPlan: EdiExecutionPlan;
  id?: string;
  timestamp?: number;
  mode?: EdiExecutionRequestMode;
  status?: EdiExecutionRequestStatus;
  priority?: EdiExecutionRequestPriority;
  targetDomain?: EdiObservationDomain;
  payload?: EdiExecutionRequestPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiExecutionRequestMetadata;
};

export type BuildEdiExecutionRequestsInput = {
  requests: readonly BuildEdiExecutionRequestInput[];
};

export type EdiExecutionRequestBuilder = {
  buildRequest(input: BuildEdiExecutionRequestInput): EdiExecutionRequest;
  buildRequests(input: BuildEdiExecutionRequestsInput): readonly EdiExecutionRequest[];
};

export const createEdiExecutionRequestBuilder = (): EdiExecutionRequestBuilder => {
  const buildRequest = (input: BuildEdiExecutionRequestInput): EdiExecutionRequest =>
    createEdiExecutionRequest({
      id: input.id,
      timestamp: input.timestamp,
      executionPlanId: input.executionPlan.id,
      actionIds: input.executionPlan.actionIds,
      intentIds: input.executionPlan.intentIds,
      contextIds: input.executionPlan.contextIds,
      mode: input.mode,
      status: input.status,
      priority: input.priority ?? input.executionPlan.priority,
      targetDomain: input.targetDomain ?? input.executionPlan.targetDomain,
      payload: input.payload ?? input.executionPlan.payload,
      reason: input.reason ?? input.executionPlan.reason,
      explanation: input.explanation ?? input.executionPlan.explanation,
      metadata: input.metadata,
    });

  return {
    buildRequest,
    buildRequests: (input) => input.requests.map(buildRequest),
  };
};
