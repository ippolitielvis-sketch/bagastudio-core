import type { EdiV2StateProfile } from "./StateProfile";
import type { EdiV2State } from "./types";

export type EdiV2CognitiveStateFactors = Record<keyof EdiV2StateProfile["engines"], number>;

export type EdiV2CognitiveStateProfileDefinition = {
  id: EdiV2State;
  label: string;
  factors: EdiV2CognitiveStateFactors;
};

export type EdiV2CognitiveStateProfileRegistry = Record<EdiV2State, EdiV2CognitiveStateProfileDefinition>;

export const EDI_V2_COGNITIVE_STATE_PROFILES: EdiV2CognitiveStateProfileRegistry = {
  idle: { id: "idle", label: "Idle", factors: { heart: 1, plasma: .9, magnetic: .82, neural: .55, particles: .62, presence: 1, thought: .2, communication: .12 } },
  thinking: { id: "thinking", label: "Thinking", factors: { heart: 1.06, plasma: 1.12, magnetic: .95, neural: 1.2, particles: .9, presence: 1.04, thought: 1.1, communication: .2 } },
  analyzing: { id: "analyzing", label: "Analyzing", factors: { heart: 1.08, plasma: 1.2, magnetic: 1.08, neural: 1.28, particles: 1.15, presence: 1.06, thought: .92, communication: .18 } },
  speaking: { id: "speaking", label: "Speaking", factors: { heart: 1.12, plasma: 1.04, magnetic: .9, neural: .95, particles: 1.05, presence: 1.08, thought: .45, communication: 1.28 } },
  suggestion: { id: "suggestion", label: "Suggestion", factors: { heart: 1.14, plasma: 1.08, magnetic: 1, neural: 1.12, particles: 1, presence: 1.08, thought: 1.35, communication: .72 } },
  warning: { id: "warning", label: "Warning", factors: { heart: 1.06, plasma: .94, magnetic: 1.2, neural: .82, particles: .72, presence: 1.12, thought: .58, communication: .52 } },
  success: { id: "success", label: "Success", factors: { heart: 1.2, plasma: 1.1, magnetic: 1.06, neural: 1.04, particles: 1.12, presence: 1.18, thought: .82, communication: 1.02 } },
};

export const resolveEdiV2CognitiveStateProfile = (
  state: EdiV2State,
  profiles: EdiV2CognitiveStateProfileRegistry = EDI_V2_COGNITIVE_STATE_PROFILES,
): EdiV2CognitiveStateProfileDefinition => profiles[state];
