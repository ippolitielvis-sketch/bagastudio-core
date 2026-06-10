"use client";

import { useCallback, useMemo, useRef } from "react";
import { renderHeart } from "./engines/HeartEngine";
import { renderMagneticField } from "./engines/MagneticFieldEngine";
import { renderParticles } from "./engines/ParticleEngine";
import { renderPlasma } from "./engines/PlasmaEngine";
import { renderSpeakingPulse } from "./engines/SpeakingPulseEngine";
import type { EdiCoreRenderEngineProps, EdiRenderFrame } from "./types";
import { useEdiRenderLoop } from "./useEdiRenderLoop";

export default function EdiCoreRenderEngine({ state = "idle", size = 120, intensity = 1, compact = false, reducedMotion = false }: EdiCoreRenderEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useMemo(() => ({ state, size, intensity, compact, reducedMotion }), [state, size, intensity, compact, reducedMotion]);
  const renderFrame = useCallback((frame: EdiRenderFrame) => {
    renderMagneticField(frame);
    renderPlasma(frame);
    renderHeart(frame);
    renderParticles(frame);
    renderSpeakingPulse(frame);
  }, []);
  useEdiRenderLoop(canvasRef, props, renderFrame);
  return <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size, display: "block" }} aria-hidden="true" />;
}
