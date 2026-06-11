import type {
  EdiJoinAnalysisInput,
  EdiJoinObservation,
  EdiJoinObservationInput,
  EdiJoinObservationType,
} from "./joinObservationTypes";

export const createJoinObservation = <TPayload = unknown>(
  input: EdiJoinObservationInput<TPayload>,
): EdiJoinObservation<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

const countObservation = (
  input: EdiJoinAnalysisInput,
  type: EdiJoinObservationType,
  count: number | undefined,
): EdiJoinObservation<number> | null => count === undefined ? null : createJoinObservation({
  id: `${input.analysisId}:${type.toLowerCase()}`,
  type,
  analysisId: input.analysisId,
  source: input.source,
  payload: count,
  metadata: input.metadata,
  confidence: 1,
  reason: "typed-join-summary",
});

export class JoinIntelligence {
  private observations: EdiJoinObservation[] = [];

  analyzeJoin(input: EdiJoinAnalysisInput): readonly EdiJoinObservation[] {
    const next: Array<EdiJoinObservation | null> = [
      countObservation(input, "JOIN_CANDIDATE_DETECTED", input.joinCandidateCount),
      countObservation(input, "MODULE_ALIGNMENT_DETECTED", input.moduleAlignmentCount),
      countObservation(input, "DOUBLE_PANEL_DETECTED", input.doublePanelCount),
      countObservation(input, "SHARED_PANEL_CANDIDATE", input.sharedPanelCandidateCount),
      countObservation(input, "TOP_ALIGNMENT_DETECTED", input.topAlignmentCount),
      countObservation(input, "SOCKLE_ALIGNMENT_DETECTED", input.sockleAlignmentCount),
      countObservation(input, "BACK_PANEL_ALIGNMENT", input.backPanelAlignmentCount),
      countObservation(input, "SNAP_ALIGNMENT", input.snapAlignmentCount),
      countObservation(input, "JOIN_HARDWARE_REQUIRED", input.joinHardwareRequiredCount),
      countObservation(input, "JOIN_CONFLICT_DETECTED", input.joinConflictCount),
    ];
    this.observations = next.filter((observation): observation is EdiJoinObservation => observation !== null);
    return this.getObservations();
  }

  getObservations(): readonly EdiJoinObservation[] {
    return [...this.observations];
  }

  clear() {
    this.observations = [];
  }
}
