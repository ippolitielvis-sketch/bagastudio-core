import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiProjectEvent } from "../core/eventTypes";
import type { ImportIntelligence } from "../intelligence/ImportIntelligence";
import type { EdiImportAnalysisInput } from "../intelligence/importObservationTypes";
import type { EdiRuntimeHost } from "./EdiRuntimeHost";
import type { RunEdiRuntimeLoopResult } from "./EdiRuntimeLoop";

export type CreateImportProducerAdapterInput = {
  runtimeHost: EdiRuntimeHost;
  importIntelligence: ImportIntelligence;
};

export type RunImportProducerInput = {
  importAnalysis: EdiImportAnalysisInput;
  cognitiveState: EdiCognitiveState;
  sourceEvent?: EdiProjectEvent;
  memorySource?: string;
};

export type ImportProducerAdapter = {
  processImport(input: RunImportProducerInput): RunEdiRuntimeLoopResult;
};

export const createImportProducerAdapter = (
  input: CreateImportProducerAdapterInput,
): ImportProducerAdapter => ({
  processImport: (runInput) => {
    const observations = input.importIntelligence.analyzeImport(runInput.importAnalysis);

    return input.runtimeHost.pushDomainObservationBatch({
      domain: "import",
      observations,
      cognitiveState: runInput.cognitiveState,
      sourceEvent: runInput.sourceEvent,
      memorySource: runInput.memorySource,
    });
  },
});
