import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiExecutionPlanStatus =
  | "draft"
  | "ready"
  | "deferred"
  | "cancelled";

export type EdiExecutionPlanPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type EdiExecutionPlanPayload = Record<string, unknown>;

export type EdiExecutionPlanMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiExecutionPlan = {
  id: string;
  timestamp: number;
  actionIds: readonly string[];
  intentIds: readonly string[];
  contextIds: readonly string[];
  status: EdiExecutionPlanStatus;
  priority: EdiExecutionPlanPriority;
  targetDomain?: EdiObservationDomain;
  payload?: EdiExecutionPlanPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiExecutionPlanMetadata;
};

export type EdiExecutionPlanInput = {
  id?: string;
  timestamp?: number;
  actionIds: readonly string[];
  intentIds: readonly string[];
  contextIds: readonly string[];
  status?: EdiExecutionPlanStatus;
  priority?: EdiExecutionPlanPriority;
  targetDomain?: EdiObservationDomain;
  payload?: EdiExecutionPlanPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiExecutionPlanMetadata;
};
