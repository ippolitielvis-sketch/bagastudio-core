import type { WebGLRenderer, WebGLRenderTarget } from "three";

export type EdiV2State = "idle" | "thinking" | "analyzing" | "speaking" | "suggestion" | "warning" | "success";
export type EdiV2VisualMode = "prototype" | "minimal" | "energy" | "experimental";
export type EdiV2ShaderMode = "heart" | "plasma" | "magnetic" | "particles" | "glow" | "composite";
export type EdiV2LaboratoryProfile = { mode: EdiV2VisualMode; shaderMode: EdiV2ShaderMode; bloomIntensity: number; bloomRadius: number; bloomThreshold: number; heartIntensity: number; plasmaIntensity: number; magneticIntensity: number; particleDensity: number; distortionIntensity: number; pulseIntensity: number; animationSpeed: number; paused: boolean };
export type EdiRenderEngineV2Props = { state?: EdiV2State; size?: number; intensity?: number; reducedMotion?: boolean; compact?: boolean; laboratory?: Partial<EdiV2LaboratoryProfile>; onFps?: (fps: number) => void };
export type EdiV2Frame = { renderer: WebGLRenderer; target: WebGLRenderTarget; time: number; delta: number; state: EdiV2State; size: number; intensity: number; reducedMotion: boolean; compact: boolean; laboratory: EdiV2LaboratoryProfile };
