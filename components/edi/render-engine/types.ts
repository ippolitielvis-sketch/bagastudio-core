export type EdiRenderEngineState = "idle" | "thinking" | "analyzing" | "speaking" | "suggestion" | "warning" | "success";

export type EdiCoreRenderEngineProps = {
  state?: EdiRenderEngineState;
  size?: number;
  intensity?: number;
  compact?: boolean;
  reducedMotion?: boolean;
};

export type EdiRenderFrame = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  state: EdiRenderEngineState;
  intensity: number;
  compact: boolean;
  reducedMotion: boolean;
};

export type EdiStateVisual = { heart: number; plasma: number; particles: number; magnetic: number; speed: number; warm: number };
