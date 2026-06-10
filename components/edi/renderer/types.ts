export type EdiCoreState = "idle" | "thinking" | "analyzing" | "speaking" | "suggestion" | "warning" | "success";

export type EdiCoreRendererProps = {
  state?: EdiCoreState;
  size?: number;
  intensity?: number;
  compact?: boolean;
  reducedMotion?: boolean;
  renderEngine?: "svg" | "canvas";
};

export type EdiRendererLayerProps = Pick<EdiCoreRendererProps, "state" | "intensity" | "compact" | "reducedMotion">;

export type EdiPulseMode = "calm" | "focus" | "voice" | "intuition" | "alert" | "resolve";

export type EdiVisualProfile = {
  heartIntensity: number;
  plasmaActivity: number;
  magneticSpeed: number;
  particleDensity: number;
  neuralActivity: number;
  glowIntensity: number;
  blueprintActivity: number;
  pulseMode: EdiPulseMode;
};

export type EdiProfiledLayerProps = EdiRendererLayerProps & { visualProfile: EdiVisualProfile };
