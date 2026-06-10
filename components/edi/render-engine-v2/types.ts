import type { WebGLRenderer } from "three";

export type EdiV2State = "idle" | "thinking" | "analyzing" | "speaking" | "suggestion" | "warning" | "success";
export type EdiRenderEngineV2Props = { state?: EdiV2State; size?: number; intensity?: number; reducedMotion?: boolean; compact?: boolean; onFps?: (fps: number) => void };
export type EdiV2Frame = { renderer: WebGLRenderer; time: number; delta: number; state: EdiV2State; size: number; intensity: number; reducedMotion: boolean; compact: boolean };
