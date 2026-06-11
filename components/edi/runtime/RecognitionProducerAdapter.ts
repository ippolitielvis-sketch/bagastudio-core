import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { RecognitionIntelligence } from "../intelligence/RecognitionIntelligence";
import type { EdiRecognitionAnalysisInput } from "../intelligence/recognitionObservationTypes";
import type { EdiRuntimeHost } from "./EdiRuntimeHost";
import type { RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreateRecognitionProducerAdapterInput = {
  runtimeHost: EdiRuntimeHost;
  recognitionIntelligence: RecognitionIntelligence;
};

export type RunRecognitionProducerInput = {
  recognitionAnalysis: EdiRecognitionAnalysisInput;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type RecognitionProducerAdapter = {
  processRecognition(input: RunRecognitionProducerInput): RunEdiRuntimeLoopResult;
};

export const createRecognitionProducerAdapter = (
  input: CreateRecognitionProducerAdapterInput,
): RecognitionProducerAdapter => ({
  processRecognition: (runInput) => {
    const observations = input.recognitionIntelligence.analyzeRecognition(runInput.recognitionAnalysis);

    return input.runtimeHost.pushDomainObservationBatch({
      domain: "recognition",
      observations,
      cognitiveState: runInput.cognitiveState,
      sourceEvent: runInput.sourceEvent,
      memorySource: runInput.memorySource,
    });
  },
});
