export const EDI_LAYOUT_OBSERVATION_TYPES = [
  "ROOM_DETECTED",
  "WALL_DETECTED",
  "FREE_SPACE_DETECTED",
  "WORK_AREA_DETECTED",
  "CLEARANCE_DETECTED",
  "PASSAGE_DETECTED",
  "COLLISION_AREA_DETECTED",
  "TECHNICAL_POINT_DETECTED",
  "LAYOUT_CONSTRAINT_DETECTED",
  "DISTANCE_PATTERN_DETECTED",
] as const;

export type EdiLayoutObservationType = typeof EDI_LAYOUT_OBSERVATION_TYPES[number];
export type EdiLayoutSource = "ROOM_PANEL" | "WALLS" | "SKIRTING" | "DOORS" | "WINDOWS" | "PILLARS" | "NICHES" | "SCENE_COMPOSER" | "DIMENSIONS" | string;

export type EdiLayoutAnalysisInput = {
  analysisId: string;
  source: EdiLayoutSource;
  roomCount?: number;
  wallCount?: number;
  freeSpaceCount?: number;
  workAreaCount?: number;
  clearanceCount?: number;
  passageCount?: number;
  collisionAreaCount?: number;
  technicalPointCount?: number;
  layoutConstraintCount?: number;
  distancePatternCount?: number;
  metadata?: Record<string, unknown>;
};

export type EdiLayoutObservation<TPayload = unknown> = {
  id: string;
  type: EdiLayoutObservationType;
  timestamp: number;
  analysisId: string;
  source: EdiLayoutSource;
  payload?: TPayload;
  metadata?: Record<string, unknown>;
  confidence: number;
  reason?: string;
};

export type EdiLayoutObservationInput<TPayload = unknown> =
  Omit<EdiLayoutObservation<TPayload>, "timestamp"> & { timestamp?: number };
