import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiActionKind =
  | "observe"
  | "explain"
  | "suggest"
  | "warn"
  | "confirm"
  | "defer";

export type EdiActionStatus =
  | "proposed"
  | "deferred"
  | "dismissed";

export type EdiActionPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type EdiActionPayload = Record<string, unknown>;

export type EdiActionMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiAction = {
  id: string;
  timestamp: number;
  intentId: string;
  contextId: string;
  kind: EdiActionKind;
  status: EdiActionStatus;
  priority: EdiActionPriority;
  confidence: number;
  targetDomain?: EdiObservationDomain;
  payload?: EdiActionPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiActionMetadata;
};

export type EdiActionInput = {
  id?: string;
  timestamp?: number;
  intentId: string;
  contextId: string;
  kind: EdiActionKind;
  status?: EdiActionStatus;
  priority?: EdiActionPriority;
  confidence: number;
  targetDomain?: EdiObservationDomain;
  payload?: EdiActionPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiActionMetadata;
};
