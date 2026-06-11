import type {
  EdiRecognitionAnalysisInput,
  EdiRecognitionObservation,
  EdiRecognitionObservationInput,
  EdiRecognitionObservationType,
} from "./recognitionObservationTypes";

export const createRecognitionObservation = <TPayload = unknown>(
  input: EdiRecognitionObservationInput<TPayload>,
): EdiRecognitionObservation<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

const countObservation = (
  input: EdiRecognitionAnalysisInput,
  type: EdiRecognitionObservationType,
  count: number | undefined,
): EdiRecognitionObservation<number> | null => count === undefined ? null : createRecognitionObservation({
  id: `${input.recognitionId}:${type.toLowerCase()}`,
  type,
  recognitionId: input.recognitionId,
  source: input.source,
  payload: count,
  metadata: input.metadata,
  confidence: 1,
  reason: "typed-recognition-summary",
});

export class RecognitionIntelligence {
  private observations: EdiRecognitionObservation[] = [];

  analyzeRecognition(input: EdiRecognitionAnalysisInput): readonly EdiRecognitionObservation[] {
    const next: Array<EdiRecognitionObservation | null> = [
      input.modelDetected ? createRecognitionObservation({ id: `${input.recognitionId}:model`, type: "MODEL_DETECTED", recognitionId: input.recognitionId, source: input.source, metadata: input.metadata, confidence: .9, reason: "typed-recognition-summary" }) : null,
      countObservation(input, "MODULE_DETECTED", input.moduleCount),
      countObservation(input, "COMPONENT_DETECTED", input.componentCount),
      countObservation(input, "PART_DETECTED", input.partCount),
      countObservation(input, "HARDWARE_DETECTED", input.hardwareCount),
      countObservation(input, "MATERIAL_DETECTED", input.materialCount),
      countObservation(input, "TEXTURE_DETECTED", input.textureCount),
      countObservation(input, "GROUP_DETECTED", input.groupCount),
      input.hierarchyRecognized ? createRecognitionObservation({ id: `${input.recognitionId}:hierarchy`, type: "HIERARCHY_RECOGNIZED", recognitionId: input.recognitionId, source: input.source, metadata: input.metadata, confidence: .85, reason: "typed-recognition-summary" }) : null,
    ];
    this.observations = next.filter((observation): observation is EdiRecognitionObservation => observation !== null);
    return this.getObservations();
  }

  getObservations(): readonly EdiRecognitionObservation[] {
    return [...this.observations];
  }

  clear() {
    this.observations = [];
  }
}
