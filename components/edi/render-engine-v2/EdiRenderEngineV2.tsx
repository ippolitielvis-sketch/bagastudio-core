"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WebGLRenderer } from "three";
import { EdiRenderPipeline } from "./pipeline/EdiRenderPipeline";
import { CompositePass } from "./passes/CompositePass";
import { CommunicationPulsePass } from "./passes/CommunicationPulsePass";
import { FieldPass } from "./passes/FieldPass";
import { GlowPass } from "./passes/GlowPass";
import { HeartPass } from "./passes/HeartPass";
import { NeuralPass } from "./passes/NeuralPass";
import { ParticlePass } from "./passes/ParticlePass";
import { PlasmaPass } from "./passes/PlasmaPass";
import { PresencePass } from "./passes/PresencePass";
import { ThoughtPulsePass } from "./passes/ThoughtPulsePass";
import { resolveEdiV2LaboratoryProfile } from "./laboratory";
import type { EdiRenderEngineV2Props } from "./types";
import { useEdiAnimationFrame } from "./useEdiAnimationFrame";
import { composeEdiV2VisualState } from "./VisualStateComposer";

export default function EdiRenderEngineV2({ state = "idle", size = 140, intensity = 1, reducedMotion = false, compact = false, laboratory, onFps }: EdiRenderEngineV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const pipelineRef = useRef<EdiRenderPipeline | null>(null);
  const initialSizeRef = useRef(size);
  const [webGlAvailable, setWebGlAvailable] = useState(true);
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const renderer = new WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true, powerPreference: "high-performance" });
      const pipeline = new EdiRenderPipeline([new HeartPass(), new PlasmaPass(), new NeuralPass(), new FieldPass(), new ParticlePass(), new ThoughtPulsePass(), new CommunicationPulsePass(), new PresencePass(), new GlowPass(), new CompositePass()], initialSizeRef.current);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.autoClear = false;
      rendererRef.current = renderer;
      pipelineRef.current = pipeline;
      return () => { pipeline.dispose(); renderer.dispose(); pipelineRef.current = null; rendererRef.current = null; };
    } catch {
      rendererRef.current = null;
      queueMicrotask(() => setWebGlAvailable(false));
    }
  }, []);
  useEffect(() => {
    rendererRef.current?.setSize(size, size, false);
    pipelineRef.current?.setSize(size);
  }, [size]);
  const lastFpsRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const render = useCallback((time: number, delta: number) => {
    const renderer = rendererRef.current; const pipeline = pipelineRef.current; if (!renderer || !pipeline) return;
    const laboratoryProfile = composeEdiV2VisualState(state, resolveEdiV2LaboratoryProfile(laboratory));
    if (!laboratoryProfile.paused) pausedTimeRef.current += delta * laboratoryProfile.animationSpeed;
    pipeline.render({ renderer, time: pausedTimeRef.current, delta: laboratoryProfile.paused ? 0 : delta, state, size, intensity, reducedMotion, compact, laboratory: laboratoryProfile });
    if (onFps && time - lastFpsRef.current > 1) { onFps(Math.round(1 / Math.max(delta, .001))); lastFpsRef.current = time; }
  }, [state, size, intensity, reducedMotion, compact, laboratory, onFps]);
  useEdiAnimationFrame(render);
  return <span style={{ width: size, height: size, display: "block", position: "relative" }}><canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size, display: "block" }} aria-hidden="true" />{!webGlAvailable && <span aria-hidden="true" style={{ position: "absolute", inset: "28%", borderRadius: "48% 52% 46% 54%", background: "radial-gradient(circle, rgba(255,249,232,.9), rgba(87,189,227,.25) 42%, transparent 72%)", filter: "blur(5px)" }} />}</span>;
}
