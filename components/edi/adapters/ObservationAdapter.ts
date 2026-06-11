import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { EdiObservation } from "../core/observationTypes";
import type { EdiFactoryObservation } from "../intelligence/factoryObservationTypes";
import type { EdiImportObservation } from "../intelligence/importObservationTypes";
import type { EdiJoinObservation } from "../intelligence/joinObservationTypes";
import type { EdiLayoutObservation } from "../intelligence/layoutObservationTypes";
import type { EdiPricingObservation } from "../intelligence/pricingObservationTypes";
import type { EdiRecognitionObservation } from "../intelligence/recognitionObservationTypes";

export type EdiObservationDomain = "import" | "recognition" | "layout" | "join" | "pricing" | "factory";

export type EdiDomainObservation =
  | EdiImportObservation
  | EdiRecognitionObservation
  | EdiLayoutObservation
  | EdiJoinObservation
  | EdiPricingObservation
  | EdiFactoryObservation;

export type EdiDomainObservationPayload = {
  domain: EdiObservationDomain;
  type: EdiDomainObservation["type"];
  original: EdiDomainObservation;
};

export type EdiDomainObservationMetadata = {
  domain: EdiObservationDomain;
  type: EdiDomainObservation["type"];
  source?: unknown;
};

export type AdaptDomainObservationInput = {
  domain: EdiObservationDomain;
  observation: EdiDomainObservation;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
};

const readObservationSource = (observation: EdiDomainObservation): unknown => {
  if ("source" in observation) return observation.source;
  return undefined;
};

export const adaptDomainObservationToEdiObservation = (
  input: AdaptDomainObservationInput,
): EdiObservation<EdiDomainObservationPayload, EdiDomainObservationMetadata> => {
  const source = readObservationSource(input.observation);

  return {
    id: input.observation.id,
    timestamp: input.observation.timestamp,
    sourceEvent: input.sourceEvent,
    cognitiveState: input.cognitiveState,
    payload: {
      domain: input.domain,
      type: input.observation.type,
      original: input.observation,
    },
    metadata: {
      domain: input.domain,
      type: input.observation.type,
      ...(source === undefined ? {} : { source }),
    },
    confidence: input.observation.confidence,
    reason: input.observation.reason,
  };
};
