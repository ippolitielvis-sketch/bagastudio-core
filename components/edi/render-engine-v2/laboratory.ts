import type { EdiV2LaboratoryProfile, EdiV2VisualMode } from "./types";

export const EDI_V2_LABORATORY_PRESETS: Record<EdiV2VisualMode, EdiV2LaboratoryProfile> = {
  prototype: { mode: "prototype", shaderMode: "composite", bloomIntensity: 1, bloomRadius: .72, bloomThreshold: .18, heartIntensity: 1, heartPulseSpeed: 1, heartRadius: .48, heartNoise: .7, heartGlow: 1, plasmaIntensity: 1, magneticIntensity: 1, particleDensity: 1, distortionIntensity: 1, pulseIntensity: 1, animationSpeed: 1, paused: false },
  minimal: { mode: "minimal", shaderMode: "composite", bloomIntensity: .45, bloomRadius: .42, bloomThreshold: .34, heartIntensity: .82, heartPulseSpeed: .72, heartRadius: .44, heartNoise: .35, heartGlow: .55, plasmaIntensity: .42, magneticIntensity: .28, particleDensity: .45, distortionIntensity: .55, pulseIntensity: .72, animationSpeed: .55, paused: false },
  energy: { mode: "energy", shaderMode: "composite", bloomIntensity: 1.3, bloomRadius: .88, bloomThreshold: .1, heartIntensity: 1.16, heartPulseSpeed: 1.14, heartRadius: .5, heartNoise: .9, heartGlow: 1.3, plasmaIntensity: 1.38, magneticIntensity: 1.08, particleDensity: 1.35, distortionIntensity: 1.25, pulseIntensity: 1.22, animationSpeed: 1.2, paused: false },
  experimental: { mode: "experimental", shaderMode: "composite", bloomIntensity: 1.55, bloomRadius: 1, bloomThreshold: .04, heartIntensity: .94, heartPulseSpeed: .85, heartRadius: .52, heartNoise: 1.45, heartGlow: 1.55, plasmaIntensity: 1.65, magneticIntensity: 1.42, particleDensity: 1.65, distortionIntensity: 1.8, pulseIntensity: 1.4, animationSpeed: .82, paused: false },
};

export const resolveEdiV2LaboratoryProfile = (laboratory?: Partial<EdiV2LaboratoryProfile>): EdiV2LaboratoryProfile => {
  const mode = laboratory?.mode || "prototype";
  return { ...EDI_V2_LABORATORY_PRESETS[mode], ...laboratory, mode };
};
