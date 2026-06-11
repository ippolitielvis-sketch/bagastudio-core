export const EDI_PROJECT_EVENT_TYPES = [
  "PROJECT_OPENED",
  "PROJECT_CLOSED",
  "PROJECT_IMPORTED",
  "MODEL_SELECTED",
  "MODEL_DESELECTED",
  "MODEL_MOVED",
  "MODEL_ROTATED",
  "ROOM_CHANGED",
  "TEXTURE_CHANGED",
  "MATERIAL_CHANGED",
] as const;

export type EdiProjectEventType = typeof EDI_PROJECT_EVENT_TYPES[number];
export type EdiProjectEventOrigin = "viewer" | "home" | "import" | "project" | "system" | string;

export type EdiProjectEvent<TPayload = unknown, TMetadata extends Record<string, unknown> = Record<string, unknown>> = {
  type: EdiProjectEventType;
  timestamp: number;
  projectId?: string;
  moduleId?: string;
  payload?: TPayload;
  metadata?: TMetadata;
  origin: EdiProjectEventOrigin;
};

export type EdiProjectEventInput<TPayload = unknown, TMetadata extends Record<string, unknown> = Record<string, unknown>> =
  Omit<EdiProjectEvent<TPayload, TMetadata>, "timestamp"> & { timestamp?: number };

export type EdiProjectEventListener<TEvent extends EdiProjectEvent = EdiProjectEvent> = (event: TEvent) => void;
