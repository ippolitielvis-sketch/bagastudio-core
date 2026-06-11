import type {
  EdiImportAnalysisInput,
  EdiImportObservation,
  EdiImportObservationInput,
  EdiImportObservationType,
} from "./importObservationTypes";

export const createImportObservation = <TPayload = unknown>(
  input: EdiImportObservationInput<TPayload>,
): EdiImportObservation<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

const countObservation = (
  input: EdiImportAnalysisInput,
  type: EdiImportObservationType,
  count: number | undefined,
): EdiImportObservation<number> | null => count === undefined ? null : createImportObservation({
  id: `${input.importId}:${type.toLowerCase()}`,
  type,
  importId: input.importId,
  format: input.format,
  payload: count,
  metadata: input.metadata,
  confidence: 1,
  reason: "typed-import-summary",
});

export class ImportIntelligence {
  private observations: EdiImportObservation[] = [];

  analyzeImport(input: EdiImportAnalysisInput): readonly EdiImportObservation[] {
    const statusType: EdiImportObservationType = input.status === "failed"
      ? "IMPORT_FAILED"
      : input.status === "completed" ? "IMPORT_COMPLETED" : "IMPORT_STARTED";
    const next: Array<EdiImportObservation | null> = [
      createImportObservation({ id: `${input.importId}:${statusType.toLowerCase()}`, type: statusType, importId: input.importId, format: input.format, payload: input.error, metadata: input.metadata, confidence: 1, reason: "import-status" }),
      input.modelDetected ? createImportObservation({ id: `${input.importId}:model`, type: "MODEL_DETECTED", importId: input.importId, format: input.format, metadata: input.metadata, confidence: .9, reason: "typed-import-summary" }) : null,
      countObservation(input, "MODULE_COUNT_DETECTED", input.moduleCount),
      countObservation(input, "COMPONENT_COUNT_DETECTED", input.componentCount),
      countObservation(input, "MATERIAL_COUNT_DETECTED", input.materialCount),
      input.hierarchyDetected ? createImportObservation({ id: `${input.importId}:hierarchy`, type: "HIERARCHY_DETECTED", importId: input.importId, format: input.format, metadata: input.metadata, confidence: .85, reason: "typed-import-summary" }) : null,
    ];
    this.observations = next.filter((observation): observation is EdiImportObservation => observation !== null);
    return this.getObservations();
  }

  getObservations(): readonly EdiImportObservation[] {
    return [...this.observations];
  }

  clear() {
    this.observations = [];
  }
}
