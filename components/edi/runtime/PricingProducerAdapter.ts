import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { PricingIntelligence } from "../intelligence/PricingIntelligence";
import type { EdiPricingAnalysisInput } from "../intelligence/pricingObservationTypes";
import type { EdiRuntimeHost } from "./EdiRuntimeHost";
import type { RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreatePricingProducerAdapterInput = {
  runtimeHost: EdiRuntimeHost;
  pricingIntelligence: PricingIntelligence;
};

export type RunPricingProducerInput = {
  pricingAnalysis: EdiPricingAnalysisInput;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type PricingProducerAdapter = {
  processPricing(input: RunPricingProducerInput): RunEdiRuntimeLoopResult;
};

export const createPricingProducerAdapter = (
  input: CreatePricingProducerAdapterInput,
): PricingProducerAdapter => ({
  processPricing: (runInput) => {
    const observations = input.pricingIntelligence.analyzePricing(runInput.pricingAnalysis);

    return input.runtimeHost.pushDomainObservationBatch({
      domain: "pricing",
      observations,
      cognitiveState: runInput.cognitiveState,
      sourceEvent: runInput.sourceEvent,
      memorySource: runInput.memorySource,
    });
  },
});
