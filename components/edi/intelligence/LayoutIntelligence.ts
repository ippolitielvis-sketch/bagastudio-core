import type {
  EdiLayoutAnalysisInput,
  EdiLayoutObservation,
  EdiLayoutObservationInput,
  EdiLayoutObservationType,
} from "./layoutObservationTypes";

export const createLayoutObservation = <TPayload = unknown>(
  input: EdiLayoutObservationInput<TPayload>,
): EdiLayoutObservation<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

const countObservation = (
  input: EdiLayoutAnalysisInput,
  type: EdiLayoutObservationType,
  count: number | undefined,
): EdiLayoutObservation<number> | null => count === undefined ? null : createLayoutObservation({
  id: `${input.analysisId}:${type.toLowerCase()}`,
  type,
  analysisId: input.analysisId,
  source: input.source,
  payload: count,
  metadata: input.metadata,
  confidence: 1,
  reason: "typed-layout-summary",
});

export class LayoutIntelligence {
  private observations: EdiLayoutObservation[] = [];

  analyzeLayout(input: EdiLayoutAnalysisInput): readonly EdiLayoutObservation[] {
    const next: Array<EdiLayoutObservation | null> = [
      countObservation(input, "ROOM_DETECTED", input.roomCount),
      countObservation(input, "WALL_DETECTED", input.wallCount),
      countObservation(input, "FREE_SPACE_DETECTED", input.freeSpaceCount),
      countObservation(input, "WORK_AREA_DETECTED", input.workAreaCount),
      countObservation(input, "CLEARANCE_DETECTED", input.clearanceCount),
      countObservation(input, "PASSAGE_DETECTED", input.passageCount),
      countObservation(input, "COLLISION_AREA_DETECTED", input.collisionAreaCount),
      countObservation(input, "TECHNICAL_POINT_DETECTED", input.technicalPointCount),
      countObservation(input, "LAYOUT_CONSTRAINT_DETECTED", input.layoutConstraintCount),
      countObservation(input, "DISTANCE_PATTERN_DETECTED", input.distancePatternCount),
    ];
    this.observations = next.filter((observation): observation is EdiLayoutObservation => observation !== null);
    return this.getObservations();
  }

  getObservations(): readonly EdiLayoutObservation[] {
    return [...this.observations];
  }

  clear() {
    this.observations = [];
  }
}
