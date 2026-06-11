import type { CognitiveMemory } from "../core/CognitiveMemory";
import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { ReasoningBridge } from "../core/ReasoningBridge";
import type { EdiDomainObservation, EdiObservationDomain } from "../adapters/ObservationAdapter";
import { runEdiRuntimeLoop, type RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreateEdiRuntimeHostInput = {
  reasoningBridge: ReasoningBridge;
  cognitiveMemory: CognitiveMemory;
};

export type PushEdiDomainObservationBatchInput = {
  domain: EdiObservationDomain;
  observations: readonly EdiDomainObservation[];
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type EdiRuntimeHost = {
  pushDomainObservationBatch(input: PushEdiDomainObservationBatchInput): RunEdiRuntimeLoopResult;
};

export const createEdiRuntimeHost = (input: CreateEdiRuntimeHostInput): EdiRuntimeHost => ({
  pushDomainObservationBatch: (batch) =>
    runEdiRuntimeLoop({
      domain: batch.domain,
      observations: batch.observations,
      cognitiveState: batch.cognitiveState,
      reasoningBridge: input.reasoningBridge,
      cognitiveMemory: input.cognitiveMemory,
      sourceEvent: batch.sourceEvent,
      memorySource: batch.memorySource,
    }),
});
