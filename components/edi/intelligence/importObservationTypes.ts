export const EDI_IMPORT_OBSERVATION_TYPES = [
  "IMPORT_STARTED",
  "IMPORT_COMPLETED",
  "IMPORT_FAILED",
  "MODEL_DETECTED",
  "MODULE_COUNT_DETECTED",
  "COMPONENT_COUNT_DETECTED",
  "MATERIAL_COUNT_DETECTED",
  "HIERARCHY_DETECTED",
] as const;

export type EdiImportObservationType = typeof EDI_IMPORT_OBSERVATION_TYPES[number];
export type EdiImportFormat = "DAE" | "GLTF" | "PRODUCT_PACKAGE" | "CSV" | "CIX" | string;

export type EdiImportAnalysisInput = {
  importId: string;
  format: EdiImportFormat;
  status?: "started" | "completed" | "failed";
  modelDetected?: boolean;
  moduleCount?: number;
  componentCount?: number;
  materialCount?: number;
  hierarchyDetected?: boolean;
  metadata?: Record<string, unknown>;
  error?: string;
};

export type EdiImportObservation<TPayload = unknown> = {
  id: string;
  type: EdiImportObservationType;
  timestamp: number;
  importId: string;
  format: EdiImportFormat;
  payload?: TPayload;
  metadata?: Record<string, unknown>;
  confidence: number;
  reason?: string;
};

export type EdiImportObservationInput<TPayload = unknown> =
  Omit<EdiImportObservation<TPayload>, "timestamp"> & { timestamp?: number };
