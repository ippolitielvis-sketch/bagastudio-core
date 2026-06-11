import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiExecutionRequestMode =
  | "plan"
  | "preview"
  | "dry-run";

export type EdiExecutionRequestStatus =
  | "created"
  | "queued"
  | "cancelled";

export type EdiExecutionRequestPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type EdiExecutionRequestPayload = Record<string, unknown>;

export type EdiExecutionRequestMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiExecutionRequest = {
  id: string;
  timestamp: number;
  executionPlanId: string;
  actionIds: readonly string[];
  intentIds: readonly string[];
  contextIds: readonly string[];
  mode: EdiExecutionRequestMode;
  status: EdiExecutionRequestStatus;
  priority: EdiExecutionRequestPriority;
  targetDomain?: EdiObservationDomain;
  payload?: EdiExecutionRequestPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiExecutionRequestMetadata;
};

export type EdiExecutionRequestInput = {
  id?: string;
  timestamp?: number;
  executionPlanId: string;
  actionIds: readonly string[];
  intentIds: readonly string[];
  contextIds: readonly string[];
  mode?: EdiExecutionRequestMode;
  status?: EdiExecutionRequestStatus;
  priority?: EdiExecutionRequestPriority;
  targetDomain?: EdiObservationDomain;
  payload?: EdiExecutionRequestPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiExecutionRequestMetadata;
};
