import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { JoinIntelligence } from "../intelligence/JoinIntelligence";
import type { EdiJoinAnalysisInput } from "../intelligence/joinObservationTypes";
import type { EdiRuntimeHost } from "./EdiRuntimeHost";
import type { RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreateJoinProducerAdapterInput = {
  runtimeHost: EdiRuntimeHost;
  joinIntelligence: JoinIntelligence;
};

export type RunJoinProducerInput = {
  joinAnalysis: EdiJoinAnalysisInput;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type JoinProducerAdapter = {
  processJoin(input: RunJoinProducerInput): RunEdiRuntimeLoopResult;
};

export const createJoinProducerAdapter = (
  input: CreateJoinProducerAdapterInput,
): JoinProducerAdapter => ({
  processJoin: (runInput) => {
    const observations = input.joinIntelligence.analyzeJoin(runInput.joinAnalysis);

    return input.runtimeHost.pushDomainObservationBatch({
      domain: "join",
      observations,
      cognitiveState: runInput.cognitiveState,
      sourceEvent: runInput.sourceEvent,
      memorySource: runInput.memorySource,
    });
  },
});
