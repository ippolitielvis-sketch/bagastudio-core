import type { EdiCognitiveState } from "./cognitiveStateTypes";
import type { EdiMemoryEntry } from "./memoryTypes";
import type { EdiObservation } from "./observationTypes";
import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiCognitiveActivationTrigger =
  | "manual"
  | "producer"
  | "runtime"
  | "system";

export type EdiCognitiveActivationContextMetadata = {
  source?: string;
  trigger?: EdiCognitiveActivationTrigger;
  producer?: EdiObservationDomain;
  reason?: string;
  [key: string]: unknown;
};

export type EdiCognitiveActivationContext = {
  id: string;
  timestamp: number;
  cognitiveState: EdiCognitiveState;
  observations: readonly EdiObservation[];
  memorySnapshot?: readonly EdiMemoryEntry[];
  metadata?: EdiCognitiveActivationContextMetadata;
};

export type EdiCognitiveActivationContextInput = {
  id?: string;
  timestamp?: number;
  cognitiveState: EdiCognitiveState;
  observations?: readonly EdiObservation[];
  memorySnapshot?: readonly EdiMemoryEntry[];
  metadata?: EdiCognitiveActivationContextMetadata;
};
