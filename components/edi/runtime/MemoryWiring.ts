import type { CognitiveMemory } from "../core/CognitiveMemory";
import type { EdiMemoryEntry } from "../core/memoryTypes";
import type { EdiObservation } from "../core/observationTypes";

export type PushReasoningObservationToMemoryInput = {
  observation: EdiObservation;
  cognitiveMemory: CognitiveMemory;
  source?: string;
};

export type PushReasoningObservationsToMemoryInput = {
  observations: readonly EdiObservation[];
  cognitiveMemory: CognitiveMemory;
  source?: string;
};

export const pushReasoningObservationToMemory = (
  input: PushReasoningObservationToMemoryInput,
): EdiMemoryEntry<EdiObservation> =>
  input.cognitiveMemory.pushMemory({
    id: input.observation.id,
    timestamp: input.observation.timestamp,
    source: input.source ?? "reasoning",
    observation: input.observation,
    state: input.observation.cognitiveState,
    confidence: input.observation.confidence,
    metadata: input.observation.metadata,
  });

export const pushReasoningObservationsToMemory = (
  input: PushReasoningObservationsToMemoryInput,
): readonly EdiMemoryEntry<EdiObservation>[] =>
  input.observations.map((observation) =>
    pushReasoningObservationToMemory({
      observation,
      cognitiveMemory: input.cognitiveMemory,
      source: input.source,
    }),
  );
