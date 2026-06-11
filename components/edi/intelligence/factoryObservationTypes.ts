export const EDI_FACTORY_OBSERVATION_TYPES = [
  "PANEL_DETECTED",
  "THICKNESS_DETECTED",
  "EDGE_DETECTED",
  "HARDWARE_LAYOUT_DETECTED",
  "DRILLING_PATTERN_DETECTED",
  "MACHINING_DETECTED",
  "ASSEMBLY_GROUP_DETECTED",
  "PRODUCTION_CONSTRAINT_DETECTED",
] as const;

export type EdiFactoryObservationType = typeof EDI_FACTORY_OBSERVATION_TYPES[number];
export type EdiFactorySource = "BOM" | "CSV" | "CIX" | "HARDWARE" | "CNC" | "EDGE_BANDING" | "DRILLING" | "ASSEMBLY" | string;

export type EdiFactoryAnalysisInput = {
  analysisId: string;
  source: EdiFactorySource;
  panelCount?: number;
  thicknessCount?: number;
  edgeCount?: number;
  hardwareLayoutCount?: number;
  drillingPatternCount?: number;
  machiningCount?: number;
  assemblyGroupCount?: number;
  productionConstraintCount?: number;
  metadata?: Record<string, unknown>;
};

export type EdiFactoryObservation<TPayload = unknown> = {
  id: string;
  type: EdiFactoryObservationType;
  timestamp: number;
  analysisId: string;
  source: EdiFactorySource;
  payload?: TPayload;
  metadata?: Record<string, unknown>;
  confidence: number;
  reason?: string;
};

export type EdiFactoryObservationInput<TPayload = unknown> =
  Omit<EdiFactoryObservation<TPayload>, "timestamp"> & { timestamp?: number };
