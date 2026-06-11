import { createEdiCognitiveActivationContext } from "../core/CognitiveActivationContext";
import type {
  EdiCognitiveActivationContext,
  EdiCognitiveActivationContextMetadata,
} from "../core/activationContextTypes";
import type { EdiMemoryEntry } from "../core/memoryTypes";
import type { EdiObservation } from "../core/observationTypes";
import type { EdiCognitiveStateRuntime } from "./CognitiveStateRuntime";

export type CreateEdiCognitiveActivationContextBuilderInput = {
  cognitiveStateRuntime: EdiCognitiveStateRuntime;
};

export type BuildEdiCognitiveActivationContextInput = {
  id?: string;
  timestamp?: number;
  observations?: readonly EdiObservation[];
  memorySnapshot?: readonly EdiMemoryEntry[];
  metadata?: EdiCognitiveActivationContextMetadata;
};

export type EdiCognitiveActivationContextBuilder = {
  buildContext(input?: BuildEdiCognitiveActivationContextInput): EdiCognitiveActivationContext;
};

export const createEdiCognitiveActivationContextBuilder = (
  input: CreateEdiCognitiveActivationContextBuilderInput,
): EdiCognitiveActivationContextBuilder => ({
  buildContext: (buildInput) => {
    const cognitiveState = input.cognitiveStateRuntime.getCurrentState();

    return createEdiCognitiveActivationContext({
      id: buildInput?.id,
      timestamp: buildInput?.timestamp,
      cognitiveState,
      observations: buildInput?.observations,
      memorySnapshot: buildInput?.memorySnapshot,
      metadata: buildInput?.metadata,
    });
  },
});
