export const EDI_INTELLIGENCE_TYPES = [
  "import",
  "recognition",
  "factory",
  "pricing",
  "join",
  "layout",
] as const;

export type EdiIntelligenceType = typeof EDI_INTELLIGENCE_TYPES[number];

export type EdiOrchestratorDispatch<TPayload = unknown> = {
  id: string;
  timestamp: number;
  target: EdiIntelligenceType;
  payload: TPayload;
  metadata?: Record<string, unknown>;
};

export type EdiOrchestratorDispatchInput<TPayload = unknown> =
  Omit<EdiOrchestratorDispatch<TPayload>, "timestamp"> & { timestamp?: number };

export type EdiIntelligenceRegistration = {
  id: string;
  type: EdiIntelligenceType;
  handle: (dispatch: EdiOrchestratorDispatch) => void;
  metadata?: Record<string, unknown>;
};

export type EdiOrchestratorListener = (dispatch: EdiOrchestratorDispatch) => void;
