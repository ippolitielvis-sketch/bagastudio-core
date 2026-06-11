import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiExecutionResultStatus =
  | "not-run"
  | "succeeded"
  | "failed"
  | "partial"
  | "cancelled";

export type EdiExecutionResultMode =
  | "plan"
  | "preview"
  | "dry-run";

export type EdiExecutionResultOutput = Record<string, unknown>;

export type EdiExecutionResultError = {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
};

export type EdiExecutionResultDiagnostic = {
  level: "info" | "warning" | "error";
  message: string;
  metadata?: Record<string, unknown>;
};

export type EdiExecutionResultMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiExecutionResult = {
  id: string;
  timestamp: number;
  executionRequestId: string;
  executionPlanId: string;
  actionIds: readonly string[];
  intentIds: readonly string[];
  contextIds: readonly string[];
  mode: EdiExecutionResultMode;
  status: EdiExecutionResultStatus;
  targetDomain?: EdiObservationDomain;
  output?: EdiExecutionResultOutput;
  error?: EdiExecutionResultError;
  diagnostics?: readonly EdiExecutionResultDiagnostic[];
  executorId?: string;
  durationMs?: number;
  metadata?: EdiExecutionResultMetadata;
};

export type EdiExecutionResultInput = {
  id?: string;
  timestamp?: number;
  executionRequestId: string;
  executionPlanId: string;
  actionIds: readonly string[];
  intentIds: readonly string[];
  contextIds: readonly string[];
  mode: EdiExecutionResultMode;
  status?: EdiExecutionResultStatus;
  targetDomain?: EdiObservationDomain;
  output?: EdiExecutionResultOutput;
  error?: EdiExecutionResultError;
  diagnostics?: readonly EdiExecutionResultDiagnostic[];
  executorId?: string;
  durationMs?: number;
  metadata?: EdiExecutionResultMetadata;
};
