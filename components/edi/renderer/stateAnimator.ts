import type { CSSProperties } from "react";
import type { EdiCoreRendererProps, EdiCoreState, EdiVisualProfile } from "./types";

const EDI_VISUAL_PROFILES: Record<EdiCoreState, EdiVisualProfile> = {
  idle: { heartIntensity: .72, plasmaActivity: .48, magneticSpeed: .42, particleDensity: .35, neuralActivity: .28, glowIntensity: .5, blueprintActivity: .25, pulseMode: "calm" },
  thinking: { heartIntensity: .84, plasmaActivity: .78, magneticSpeed: .58, particleDensity: .48, neuralActivity: .72, glowIntensity: .62, blueprintActivity: .55, pulseMode: "focus" },
  analyzing: { heartIntensity: .9, plasmaActivity: .86, magneticSpeed: .52, particleDensity: .82, neuralActivity: .9, glowIntensity: .7, blueprintActivity: .88, pulseMode: "focus" },
  speaking: { heartIntensity: 1, plasmaActivity: .68, magneticSpeed: .5, particleDensity: .62, neuralActivity: .78, glowIntensity: .86, blueprintActivity: .42, pulseMode: "voice" },
  suggestion: { heartIntensity: 1, plasmaActivity: .82, magneticSpeed: .62, particleDensity: .7, neuralActivity: .88, glowIntensity: 1, blueprintActivity: .76, pulseMode: "intuition" },
  warning: { heartIntensity: .92, plasmaActivity: .72, magneticSpeed: .38, particleDensity: .45, neuralActivity: .66, glowIntensity: .78, blueprintActivity: .62, pulseMode: "alert" },
  success: { heartIntensity: .96, plasmaActivity: .64, magneticSpeed: .46, particleDensity: .68, neuralActivity: .58, glowIntensity: .9, blueprintActivity: .7, pulseMode: "resolve" },
};

export function getEdiVisualProfile(state: EdiCoreState = "idle", compact = false, reducedMotion = false): EdiVisualProfile {
  const profile = EDI_VISUAL_PROFILES[state];
  const motionFactor = reducedMotion ? .2 : 1;
  return {
    ...profile,
    magneticSpeed: profile.magneticSpeed * motionFactor,
    plasmaActivity: profile.plasmaActivity * motionFactor,
    particleDensity: profile.particleDensity * (compact ? .65 : 1),
    blueprintActivity: profile.blueprintActivity * (compact ? 0 : motionFactor),
  };
}

export function buildEdiCoreAnimationStyle({ state = "idle", intensity = 1, compact = false, reducedMotion = false }: EdiCoreRendererProps): CSSProperties {
  const profile = getEdiVisualProfile(state, compact, reducedMotion);
  const stateSpeed = reducedMotion ? 30 : state === "speaking" ? 3 : state === "thinking" || state === "analyzing" ? 3.6 : 4.6;
  return {
    ["--edi-renderer-intensity" as string]: Math.max(0.25, Math.min(2, intensity)),
    ["--edi-renderer-speed" as string]: `${stateSpeed}s`,
    ["--edi-heart-intensity" as string]: profile.heartIntensity,
    ["--edi-plasma-activity" as string]: profile.plasmaActivity,
    ["--edi-magnetic-speed" as string]: profile.magneticSpeed,
    ["--edi-particle-density" as string]: profile.particleDensity,
    ["--edi-neural-activity" as string]: profile.neuralActivity,
    ["--edi-glow-intensity" as string]: profile.glowIntensity,
    ["--edi-blueprint-activity" as string]: profile.blueprintActivity,
  };
}
