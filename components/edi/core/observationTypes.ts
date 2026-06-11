import type { EdiCognitiveState } from "./cognitiveStateTypes";
import type { EdiProjectEvent } from "./eventTypes";

export type EdiObservation<TPayload = unknown, TMetadata extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  timestamp: number;
  sourceEvent?: EdiProjectEvent;
  cognitiveState: EdiCognitiveState;
  payload?: TPayload;
  metadata?: TMetadata;
  confidence: number;
  reason?: string;
};

export type EdiObservationInput<TPayload = unknown, TMetadata extends Record<string, unknown> = Record<string, unknown>> =
  Omit<EdiObservation<TPayload, TMetadata>, "timestamp"> & { timestamp?: number };

export type EdiObservationListener = (observations: readonly EdiObservation[], latest: EdiObservation) => void;
