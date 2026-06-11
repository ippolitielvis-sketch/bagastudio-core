import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { EdiObservation } from "../core/observationTypes";
import type { ReasoningBridge } from "../core/ReasoningBridge";
import {
  adaptDomainObservationToEdiObservation,
  type EdiDomainObservation,
  type EdiObservationDomain,
} from "../adapters/ObservationAdapter";

export type PushDomainObservationsToReasoningInput = {
  domain: EdiObservationDomain;
  observations: readonly EdiDomainObservation[];
  cognitiveState: EdiCognitiveState;
  reasoningBridge: ReasoningBridge;
  sourceEvent?: EdiProjectEvent;
};

export const pushDomainObservationsToReasoning = (
  input: PushDomainObservationsToReasoningInput,
): readonly EdiObservation[] =>
  input.observations.map((observation) => {
    const adaptedObservation = adaptDomainObservationToEdiObservation({
      domain: input.domain,
      observation,
      cognitiveState: input.cognitiveState,
      sourceEvent: input.sourceEvent,
    });

    return input.reasoningBridge.pushObservation(adaptedObservation) ?? adaptedObservation;
  });
