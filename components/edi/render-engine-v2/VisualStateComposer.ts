import { resolveEdiV2CognitiveStateProfile } from "./CognitiveStateProfiles";
import type { EdiV2StateProfile } from "./StateProfile";
import type { EdiV2LaboratoryProfile, EdiV2State } from "./types";

const scale = <T extends Record<string, number>>(values: T, factor: number): T =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value * factor])) as T;

export const buildEdiV2StateProfile = (state: EdiV2State, base: EdiV2LaboratoryProfile): EdiV2StateProfile => {
  const factors = resolveEdiV2CognitiveStateProfile(state).factors;
  return {
    state,
    engines: {
      heart: scale({ heartIntensity: base.heartIntensity, heartPulseSpeed: base.heartPulseSpeed, heartGlow: base.heartGlow }, factors.heart),
      plasma: scale({ plasmaIntensity: base.plasmaIntensity, plasmaFlowSpeed: base.plasmaFlowSpeed }, factors.plasma),
      magnetic: scale({ fieldStrength: base.fieldStrength, fieldSpeed: base.fieldSpeed, fieldOpacity: base.fieldOpacity }, factors.magnetic),
      neural: scale({ filamentDensity: base.filamentDensity, filamentSpeed: base.filamentSpeed, filamentGlow: base.filamentGlow }, factors.neural),
      particles: scale({ particleDensity: base.particleDensity, particleSpeed: base.particleSpeed, knowledgeFlow: base.knowledgeFlow }, factors.particles),
      presence: scale({ presence: base.presence, presenceOpacity: base.presenceOpacity, presencePulse: base.presencePulse }, factors.presence),
      thought: scale({ thoughtPulseStrength: base.thoughtPulseStrength, thoughtPulseSpeed: base.thoughtPulseSpeed, thoughtPulseGlow: base.thoughtPulseGlow }, factors.thought),
      communication: scale({ communicationStrength: base.communicationStrength, communicationSpeed: base.communicationSpeed, communicationGlow: base.communicationGlow }, factors.communication),
    },
  };
};

export const composeEdiV2VisualState = (state: EdiV2State, base: EdiV2LaboratoryProfile): EdiV2LaboratoryProfile => {
  const engines = buildEdiV2StateProfile(state, base).engines;
  return { ...base, ...engines.heart, ...engines.plasma, ...engines.magnetic, ...engines.neural, ...engines.particles, ...engines.presence, ...engines.thought, ...engines.communication };
};
