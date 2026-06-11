import type {
  EdiCognitiveActivationContext,
  EdiCognitiveActivationContextInput,
} from "./activationContextTypes";

export const createEdiCognitiveActivationContext = (
  input: EdiCognitiveActivationContextInput,
): EdiCognitiveActivationContext => {
  const timestamp = input.timestamp ?? Date.now();

  return {
    id: input.id ?? `activation:${timestamp}`,
    timestamp,
    cognitiveState: input.cognitiveState,
    observations: [...(input.observations ?? [])],
    memorySnapshot: input.memorySnapshot ? [...input.memorySnapshot] : undefined,
    metadata: input.metadata,
  };
};
