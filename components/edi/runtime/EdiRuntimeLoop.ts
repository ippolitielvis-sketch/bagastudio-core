import type { CognitiveMemory } from "../core/CognitiveMemory";
import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { EdiMemoryEntry } from "../core/memoryTypes";
import type { EdiObservation } from "../core/observationTypes";
import type { ReasoningBridge } from "../core/ReasoningBridge";
import type { EdiDomainObservation, EdiObservationDomain } from "../adapters/ObservationAdapter";
import type { EdiCognitiveFeedback } from "../feedback/CognitiveFeedback";
import { buildCognitiveFeedback } from "../feedback/CognitiveFeedback";
import type { EdiFeedbackVisualState } from "./FeedbackVisualStateBridge";
import { buildFeedbackVisualState } from "./FeedbackVisualStateBridge";
import { pushReasoningObservationsToMemory } from "./MemoryWiring";
import { pushDomainObservationsToReasoning } from "./ReasoningWiring";

export type RunEdiRuntimeLoopInput = {
  domain: EdiObservationDomain;
  observations: readonly EdiDomainObservation[];
  cognitiveState: EdiCognitiveState;
  reasoningBridge: ReasoningBridge;
  cognitiveMemory: CognitiveMemory;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type RunEdiRuntimeLoopResult = {
  reasoningObservations: readonly EdiObservation[];
  memoryEntries: readonly EdiMemoryEntry[];
  feedback: readonly EdiCognitiveFeedback[];
  visualState: EdiFeedbackVisualState;
};

export const runEdiRuntimeLoop = (input: RunEdiRuntimeLoopInput): RunEdiRuntimeLoopResult => {
  const reasoningObservations = pushDomainObservationsToReasoning({
    domain: input.domain,
    observations: input.observations,
    cognitiveState: input.cognitiveState,
    reasoningBridge: input.reasoningBridge,
    sourceEvent: input.sourceEvent,
  });

  const memoryEntries = pushReasoningObservationsToMemory({
    observations: reasoningObservations,
    cognitiveMemory: input.cognitiveMemory,
    source: input.memorySource,
  });

  const feedback = buildCognitiveFeedback({
    observations: reasoningObservations,
    memoryEntries,
  });

  const visualState = buildFeedbackVisualState(feedback);

  return {
    reasoningObservations,
    memoryEntries,
    feedback,
    visualState,
  };
};
