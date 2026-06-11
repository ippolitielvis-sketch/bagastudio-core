import type { EdiCognitiveState } from "./cognitiveStateTypes";
import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiIntentKind =
  | "observe"
  | "explain"
  | "suggest"
  | "warn"
  | "confirm"
  | "defer";

export type EdiIntentPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type EdiIntentMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiIntent = {
  id: string;
  timestamp: number;
  contextId: string;
  cognitiveState: EdiCognitiveState;
  kind: EdiIntentKind;
  confidence: number;
  priority: EdiIntentPriority;
  targetDomain?: EdiObservationDomain;
  reason?: string;
  explanation?: string;
  metadata?: EdiIntentMetadata;
};

export type EdiIntentInput = {
  id?: string;
  timestamp?: number;
  contextId: string;
  cognitiveState: EdiCognitiveState;
  kind: EdiIntentKind;
  confidence: number;
  priority?: EdiIntentPriority;
  targetDomain?: EdiObservationDomain;
  reason?: string;
  explanation?: string;
  metadata?: EdiIntentMetadata;
};
