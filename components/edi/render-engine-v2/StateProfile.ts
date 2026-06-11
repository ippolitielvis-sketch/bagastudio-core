import type { EdiV2LaboratoryProfile, EdiV2State } from "./types";

export type EdiV2EngineVisualProfile = {
  heart: Pick<EdiV2LaboratoryProfile, "heartIntensity" | "heartPulseSpeed" | "heartGlow">;
  plasma: Pick<EdiV2LaboratoryProfile, "plasmaIntensity" | "plasmaFlowSpeed">;
  magnetic: Pick<EdiV2LaboratoryProfile, "fieldStrength" | "fieldSpeed" | "fieldOpacity">;
  neural: Pick<EdiV2LaboratoryProfile, "filamentDensity" | "filamentSpeed" | "filamentGlow">;
  particles: Pick<EdiV2LaboratoryProfile, "particleDensity" | "particleSpeed" | "knowledgeFlow">;
  presence: Pick<EdiV2LaboratoryProfile, "presence" | "presenceOpacity" | "presencePulse">;
  thought: Pick<EdiV2LaboratoryProfile, "thoughtPulseStrength" | "thoughtPulseSpeed" | "thoughtPulseGlow">;
  communication: Pick<EdiV2LaboratoryProfile, "communicationStrength" | "communicationSpeed" | "communicationGlow">;
};

export type EdiV2StateProfile = {
  state: EdiV2State;
  engines: EdiV2EngineVisualProfile;
};
