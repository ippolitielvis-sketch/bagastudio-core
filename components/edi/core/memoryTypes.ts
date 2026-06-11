import type { EdiCognitiveState } from "./cognitiveStateTypes";

export const EDI_MEMORY_LEVELS = [
  "short-term",
  "working",
  "long-term",
] as const;

export type EdiMemoryLevel = typeof EDI_MEMORY_LEVELS[number];

export type EdiMemoryEntry<TObservation = unknown, TMetadata extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  timestamp: number;
  source: string;
  observation: TObservation;
  state: EdiCognitiveState;
  confidence: number;
  metadata?: TMetadata;
};

export type EdiMemoryEntryInput<TObservation = unknown, TMetadata extends Record<string, unknown> = Record<string, unknown>> =
  Omit<EdiMemoryEntry<TObservation, TMetadata>, "timestamp"> & { timestamp?: number };

export type EdiMemoryListener = (memory: readonly EdiMemoryEntry[], latest: EdiMemoryEntry) => void;

export type EdiCognitiveMemoryOptions = {
  maxEntries?: number;
  timeWindowMs?: number;
};
