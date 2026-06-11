import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { LayoutIntelligence } from "../intelligence/LayoutIntelligence";
import type { EdiLayoutAnalysisInput } from "../intelligence/layoutObservationTypes";
import type { EdiRuntimeHost } from "./EdiRuntimeHost";
import type { RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreateLayoutProducerAdapterInput = {
  runtimeHost: EdiRuntimeHost;
  layoutIntelligence: LayoutIntelligence;
};

export type RunLayoutProducerInput = {
  layoutAnalysis: EdiLayoutAnalysisInput;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type LayoutProducerAdapter = {
  processLayout(input: RunLayoutProducerInput): RunEdiRuntimeLoopResult;
};

export const createLayoutProducerAdapter = (
  input: CreateLayoutProducerAdapterInput,
): LayoutProducerAdapter => ({
  processLayout: (runInput) => {
    const observations = input.layoutIntelligence.analyzeLayout(runInput.layoutAnalysis);

    return input.runtimeHost.pushDomainObservationBatch({
      domain: "layout",
      observations,
      cognitiveState: runInput.cognitiveState,
      sourceEvent: runInput.sourceEvent,
      memorySource: runInput.memorySource,
    });
  },
});
