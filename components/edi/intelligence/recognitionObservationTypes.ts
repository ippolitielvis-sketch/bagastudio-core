export const EDI_RECOGNITION_OBSERVATION_TYPES = [
  "MODEL_DETECTED",
  "MODULE_DETECTED",
  "COMPONENT_DETECTED",
  "PART_DETECTED",
  "HARDWARE_DETECTED",
  "MATERIAL_DETECTED",
  "TEXTURE_DETECTED",
  "GROUP_DETECTED",
  "HIERARCHY_RECOGNIZED",
] as const;

export type EdiRecognitionObservationType = typeof EDI_RECOGNITION_OBSERVATION_TYPES[number];
export type EdiRecognitionSource = "DAE" | "GLTF" | "PRODUCT_PACKAGE" | "SCENE_COMPOSER" | "PARAMETRIC_MODULES" | string;

export type EdiRecognitionAnalysisInput = {
  recognitionId: string;
  source: EdiRecognitionSource;
  modelDetected?: boolean;
  moduleCount?: number;
  componentCount?: number;
  partCount?: number;
  hardwareCount?: number;
  materialCount?: number;
  textureCount?: number;
  groupCount?: number;
  hierarchyRecognized?: boolean;
  metadata?: Record<string, unknown>;
};

export type EdiRecognitionObservation<TPayload = unknown> = {
  id: string;
  type: EdiRecognitionObservationType;
  timestamp: number;
  recognitionId: string;
  source: EdiRecognitionSource;
  payload?: TPayload;
  metadata?: Record<string, unknown>;
  confidence: number;
  reason?: string;
};

export type EdiRecognitionObservationInput<TPayload = unknown> =
  Omit<EdiRecognitionObservation<TPayload>, "timestamp"> & { timestamp?: number };
