import type { CognitiveStateBus } from "../core/CognitiveStateBus";
import type { EdiCognitiveState } from "../core/cognitiveStateTypes";

export type CreateCognitiveStateRuntimeInput = {
  cognitiveStateBus: CognitiveStateBus;
};

export type EdiCognitiveStateRuntime = {
  getCurrentState(): EdiCognitiveState;
};

export const createCognitiveStateRuntime = (
  input: CreateCognitiveStateRuntimeInput,
): EdiCognitiveStateRuntime => ({
  getCurrentState: () => input.cognitiveStateBus.getCurrentState(),
});
