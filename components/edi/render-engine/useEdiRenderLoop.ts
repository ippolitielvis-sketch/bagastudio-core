"use client";

import { useEffect, type RefObject } from "react";
import type { EdiCoreRenderEngineProps, EdiRenderFrame } from "./types";

export function useEdiRenderLoop(canvasRef: RefObject<HTMLCanvasElement | null>, props: Required<EdiCoreRenderEngineProps>, renderFrame: (frame: EdiRenderFrame) => void) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let animationFrame = 0;
    let previous = performance.now();
    const render = (now: number) => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = props.size * ratio;
      canvas.height = props.size * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, props.size, props.size);
      renderFrame({ context, width: props.size, height: props.size, time: now / 1000, delta: (now - previous) / 1000, ...props });
      previous = now;
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [canvasRef, props, renderFrame]);
}
