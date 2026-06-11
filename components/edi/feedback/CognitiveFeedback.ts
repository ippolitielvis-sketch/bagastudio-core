import type { EdiCognitiveState } from "../core/cognitiveStateTypes";
import type { EdiMemoryEntry } from "../core/memoryTypes";
import type { EdiObservation } from "../core/observationTypes";

export type EdiCognitiveFeedbackKind = "insight" | "suggestion" | "warning" | "success";

export type EdiCognitiveFeedback = {
  id: string;
  timestamp: number;
  kind: EdiCognitiveFeedbackKind;
  state: EdiCognitiveState;
  confidence: number;
  title: string;
  message: string;
  sourceObservationId?: string;
  sourceMemoryId?: string;
  metadata?: Record<string, unknown>;
};

export type BuildCognitiveFeedbackInput = {
  observations?: readonly EdiObservation[];
  memoryEntries?: readonly EdiMemoryEntry[];
};

const getFeedbackKind = (state: EdiCognitiveState): EdiCognitiveFeedbackKind => {
  if (state === "warning") return "warning";
  if (state === "suggestion") return "suggestion";
  if (state === "success") return "success";
  return "insight";
};

const getFeedbackTitle = (kind: EdiCognitiveFeedbackKind): string => {
  if (kind === "warning") return "EDI warning";
  if (kind === "suggestion") return "Review suggested";
  if (kind === "success") return "EDI success";
  return "EDI insight";
};

const getFeedbackMessage = (kind: EdiCognitiveFeedbackKind): string => {
  if (kind === "warning") return "Observation requires review.";
  if (kind === "suggestion") return "Observation suggests a possible action.";
  if (kind === "success") return "Observation indicates a positive state.";
  return "Observation detected.";
};

export const buildFeedbackFromObservation = (observation: EdiObservation): EdiCognitiveFeedback => {
  const kind = getFeedbackKind(observation.cognitiveState);

  return {
    id: `feedback:${observation.id}`,
    timestamp: observation.timestamp,
    kind,
    state: observation.cognitiveState,
    confidence: observation.confidence,
    title: getFeedbackTitle(kind),
    message: getFeedbackMessage(kind),
    sourceObservationId: observation.id,
    metadata: observation.metadata,
  };
};

export const buildFeedbackFromMemoryEntry = (entry: EdiMemoryEntry): EdiCognitiveFeedback => {
  const kind = getFeedbackKind(entry.state);

  return {
    id: `feedback:${entry.id}`,
    timestamp: entry.timestamp,
    kind,
    state: entry.state,
    confidence: entry.confidence,
    title: getFeedbackTitle(kind),
    message: getFeedbackMessage(kind),
    sourceObservationId: entry.observation && typeof entry.observation === "object" && "id" in entry.observation
      ? String(entry.observation.id)
      : undefined,
    sourceMemoryId: entry.id,
    metadata: entry.metadata,
  };
};

export const buildCognitiveFeedback = (input: BuildCognitiveFeedbackInput): readonly EdiCognitiveFeedback[] => [
  ...(input.observations ?? []).map(buildFeedbackFromObservation),
  ...(input.memoryEntries ?? []).map(buildFeedbackFromMemoryEntry),
];
