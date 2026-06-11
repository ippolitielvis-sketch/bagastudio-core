import type { EdiProjectEvent, EdiProjectEventType } from "./eventTypes";

export const EDI_COGNITIVE_STATES = [
  "idle",
  "thinking",
  "analyzing",
  "speaking",
  "suggestion",
  "warning",
  "success",
] as const;

export type EdiCognitiveState = typeof EDI_COGNITIVE_STATES[number];

export type EdiCognitiveStateTransition = {
  timestamp: number;
  sourceEvent?: EdiProjectEvent;
  metadata?: Record<string, unknown>;
  previousState: EdiCognitiveState;
  nextState: EdiCognitiveState;
  reason?: string;
  confidence?: number;
};

export type EdiCognitiveStateInput = Omit<EdiCognitiveStateTransition, "timestamp" | "previousState"> & {
  timestamp?: number;
};

export type EdiCognitiveStateListener = (transition: EdiCognitiveStateTransition) => void;

export const EDI_PROJECT_EVENT_STATE_MAP: Partial<Record<EdiProjectEventType, EdiCognitiveState>> = {
  PROJECT_OPENED: "idle",
  PROJECT_IMPORTED: "thinking",
  MODEL_SELECTED: "analyzing",
  MODEL_MOVED: "thinking",
  MODEL_ROTATED: "thinking",
  ROOM_CHANGED: "analyzing",
  TEXTURE_CHANGED: "analyzing",
  MATERIAL_CHANGED: "analyzing",
  PROJECT_CLOSED: "idle",
};
