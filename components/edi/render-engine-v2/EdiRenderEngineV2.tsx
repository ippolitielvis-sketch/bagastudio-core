"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { WebGLRenderer } from "three";
import { EdiRenderPipeline } from "./pipeline/EdiRenderPipeline";
import { CompositePass } from "./passes/CompositePass";
import { FieldPass } from "./passes/FieldPass";
import { GlowPass } from "./passes/GlowPass";
import { HeartPass } from "./passes/HeartPass";
import { ParticlePass } from "./passes/ParticlePass";
import { PlasmaPass } from "./passes/PlasmaPass";
import type { EdiRenderEngineV2Props } from "./types";
import { useEdiAnimationFrame } from "./useEdiAnimationFrame";

export default function EdiRenderEngineV2({ state = "idle", size = 140, intensity = 1, reducedMotion = false, compact = false, onFps }: EdiRenderEngineV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const pipeline = useMemo(() => new EdiRenderPipeline([new HeartPass(), new PlasmaPass(), new FieldPass(), new ParticlePass(), new GlowPass(), new CompositePass()]), []);
  useEffect(() => { if (!canvasRef.current) return; const renderer = new WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true }); renderer.setSize(size, size, false); renderer.autoClear = false; rendererRef.current = renderer; return () => { pipeline.dispose(); renderer.dispose(); rendererRef.current = null; }; }, [pipeline, size]);
  const lastFpsRef = useRef(0);
  const render = useCallback((time: number, delta: number) => { const renderer = rendererRef.current; if (!renderer) return; renderer.clear(); pipeline.render({ renderer, time, delta, state, size, intensity, reducedMotion, compact }); if (onFps && time - lastFpsRef.current > 1) { onFps(Math.round(1 / Math.max(delta, .001))); lastFpsRef.current = time; } }, [pipeline, state, size, intensity, reducedMotion, compact, onFps]);
  useEdiAnimationFrame(render);
  return <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size, display: "block" }} aria-hidden="true" />;
}
