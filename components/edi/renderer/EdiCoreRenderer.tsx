"use client";

import { buildEdiCoreAnimationStyle, getEdiVisualProfile } from "./stateAnimator";
import EdiCoreRenderEngine from "../render-engine/EdiCoreRenderEngine";
import type { EdiCoreRendererProps } from "./types";
import BlueprintBase from "./layers/BlueprintBase";
import EnergyLeaks from "./layers/EnergyLeaks";
import HeartCore from "./layers/HeartCore";
import MagneticField from "./layers/MagneticField";
import NeuralNetwork from "./layers/NeuralNetwork";
import ParticleEngine from "./layers/ParticleEngine";
import PlasmaEngine from "./layers/PlasmaEngine";
import SpeakingPulse from "./layers/SpeakingPulse";
import ThoughtPulse from "./layers/ThoughtPulse";

export default function EdiCoreRenderer({ state = "idle", size = 96, intensity = 1, compact = false, reducedMotion = false, renderEngine = "svg" }: EdiCoreRendererProps) {
  const layerProps = { state, intensity, compact, reducedMotion };
  if (renderEngine === "canvas") return <EdiCoreRenderEngine {...layerProps} size={size} />;
  const profile = getEdiVisualProfile(state, compact, reducedMotion);
  const profiledLayerProps = { ...layerProps, visualProfile: profile };
  return <span className="edi-renderer" data-state={state} data-pulse-mode={profile.pulseMode} style={{ width: size, height: size, ...buildEdiCoreAnimationStyle(layerProps) }} aria-hidden="true"><svg viewBox="0 0 110 124"><defs><radialGradient id="edi-renderer-heart"><stop stopColor="#fffef7" /><stop offset=".35" stopColor="#f1d28b" /><stop offset="1" stopColor="#58b7dc" stopOpacity="0" /></radialGradient></defs><MagneticField {...profiledLayerProps} /><PlasmaEngine {...profiledLayerProps} /><HeartCore {...profiledLayerProps} /><NeuralNetwork {...profiledLayerProps} /><ParticleEngine /><EnergyLeaks /><BlueprintBase {...layerProps} /><ThoughtPulse {...layerProps} /><SpeakingPulse {...layerProps} /></svg><style>{`.edi-renderer{position:absolute;inset:0;display:block;transition:filter .8s ease,opacity .8s ease}.edi-renderer svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 calc(8px * var(--edi-renderer-intensity) * var(--edi-glow-intensity)) #59bce14d);transition:filter .8s ease}.edi-renderer__leaks,.edi-renderer__blueprint,.edi-renderer__speaking{fill:none;stroke-linecap:round;stroke-linejoin:round;transition:opacity .8s ease}.edi-renderer__particles{fill:#efd48e;opacity:var(--edi-particle-density);transition:opacity .8s ease}.edi-renderer__particles circle{animation:ediRendererParticle 8s ease-in-out infinite}.edi-renderer__leaks{stroke:#e6c476;stroke-width:.7}.edi-renderer__blueprint{stroke:#6bc3e477;stroke-width:.5;stroke-dasharray:3 3;opacity:var(--edi-blueprint-activity)}.edi-renderer__thought{fill:none;stroke:#f5dc98;opacity:.65}.edi-renderer__speaking{stroke:#9ddff2;stroke-width:.8}@keyframes ediRendererParticle{50%{transform:translate(5px,-7px);opacity:.25}}`}</style></span>;
}
