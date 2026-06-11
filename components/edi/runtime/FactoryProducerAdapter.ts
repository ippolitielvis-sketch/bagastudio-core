import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { FactoryIntelligence } from "../intelligence/FactoryIntelligence";
import type { EdiFactoryAnalysisInput } from "../intelligence/factoryObservationTypes";
import type { EdiRuntimeHost } from "./EdiRuntimeHost";
import type { RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreateFactoryProducerAdapterInput = {
  runtimeHost: EdiRuntimeHost;
  factoryIntelligence: FactoryIntelligence;
};

export type RunFactoryProducerInput = {
  factoryAnalysis: EdiFactoryAnalysisInput;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type FactoryProducerAdapter = {
  processFactory(input: RunFactoryProducerInput): RunEdiRuntimeLoopResult;
};

export const createFactoryProducerAdapter = (
  input: CreateFactoryProducerAdapterInput,
): FactoryProducerAdapter => ({
  processFactory: (runInput) => {
    const observations = input.factoryIntelligence.analyzeFactory(runInput.factoryAnalysis);

    return input.runtimeHost.pushDomainObservationBatch({
      domain: "factory",
      observations,
      cognitiveState: runInput.cognitiveState,
      sourceEvent: runInput.sourceEvent,
      memorySource: runInput.memorySource,
    });
  },
});
