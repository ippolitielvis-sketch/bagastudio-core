export const EDI_JOIN_OBSERVATION_TYPES = [
  "JOIN_CANDIDATE_DETECTED",
  "MODULE_ALIGNMENT_DETECTED",
  "DOUBLE_PANEL_DETECTED",
  "SHARED_PANEL_CANDIDATE",
  "TOP_ALIGNMENT_DETECTED",
  "SOCKLE_ALIGNMENT_DETECTED",
  "BACK_PANEL_ALIGNMENT",
  "SNAP_ALIGNMENT",
  "JOIN_HARDWARE_REQUIRED",
  "JOIN_CONFLICT_DETECTED",
] as const;

export type EdiJoinObservationType = typeof EDI_JOIN_OBSERVATION_TYPES[number];
export type EdiJoinSource = "SCENE_COMPOSER" | "MODULAR_MERGE_ENGINE" | "SNAP_ENGINE" | "COLLISION_ENGINE" | "JOIN_ASSISTANT" | "FACTORY" | string;

export type EdiJoinAnalysisInput = {
  analysisId: string;
  source: EdiJoinSource;
  joinCandidateCount?: number;
  moduleAlignmentCount?: number;
  doublePanelCount?: number;
  sharedPanelCandidateCount?: number;
  topAlignmentCount?: number;
  sockleAlignmentCount?: number;
  backPanelAlignmentCount?: number;
  snapAlignmentCount?: number;
  joinHardwareRequiredCount?: number;
  joinConflictCount?: number;
  metadata?: Record<string, unknown>;
};

export type EdiJoinObservation<TPayload = unknown> = {
  id: string;
  type: EdiJoinObservationType;
  timestamp: number;
  analysisId: string;
  source: EdiJoinSource;
  payload?: TPayload;
  metadata?: Record<string, unknown>;
  confidence: number;
  reason?: string;
};

export type EdiJoinObservationInput<TPayload = unknown> =
  Omit<EdiJoinObservation<TPayload>, "timestamp"> & { timestamp?: number };
