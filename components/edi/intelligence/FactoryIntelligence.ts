import type {
  EdiFactoryAnalysisInput,
  EdiFactoryObservation,
  EdiFactoryObservationInput,
  EdiFactoryObservationType,
} from "./factoryObservationTypes";

export const createFactoryObservation = <TPayload = unknown>(
  input: EdiFactoryObservationInput<TPayload>,
): EdiFactoryObservation<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

const countObservation = (
  input: EdiFactoryAnalysisInput,
  type: EdiFactoryObservationType,
  count: number | undefined,
): EdiFactoryObservation<number> | null => count === undefined ? null : createFactoryObservation({
  id: `${input.analysisId}:${type.toLowerCase()}`,
  type,
  analysisId: input.analysisId,
  source: input.source,
  payload: count,
  metadata: input.metadata,
  confidence: 1,
  reason: "typed-factory-summary",
});

export class FactoryIntelligence {
  private observations: EdiFactoryObservation[] = [];

  analyzeFactory(input: EdiFactoryAnalysisInput): readonly EdiFactoryObservation[] {
    const next: Array<EdiFactoryObservation | null> = [
      countObservation(input, "PANEL_DETECTED", input.panelCount),
      countObservation(input, "THICKNESS_DETECTED", input.thicknessCount),
      countObservation(input, "EDGE_DETECTED", input.edgeCount),
      countObservation(input, "HARDWARE_LAYOUT_DETECTED", input.hardwareLayoutCount),
      countObservation(input, "DRILLING_PATTERN_DETECTED", input.drillingPatternCount),
      countObservation(input, "MACHINING_DETECTED", input.machiningCount),
      countObservation(input, "ASSEMBLY_GROUP_DETECTED", input.assemblyGroupCount),
      countObservation(input, "PRODUCTION_CONSTRAINT_DETECTED", input.productionConstraintCount),
    ];
    this.observations = next.filter((observation): observation is EdiFactoryObservation => observation !== null);
    return this.getObservations();
  }

  getObservations(): readonly EdiFactoryObservation[] {
    return [...this.observations];
  }

  clear() {
    this.observations = [];
  }
}
